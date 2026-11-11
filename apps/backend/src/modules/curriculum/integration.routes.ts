/** Read-only machine-to-machine skill verification for Titan Zero services.
 * Configure separate random secrets for each caller; never expose these to browsers.
 */
import { Router, Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { logger } from "../../config/logger";
import { filterToFinishedLevels } from "../levels/level.service";
import { resolveScopedIdentity } from "./integration-identity-policy";

export const integrationRoutes = Router();
type Caller = "field-services" | "ai-workforce";
type ServiceScope = { caller: Caller; companyRefs: string[] };
// Explicit allowlists are mandatory: a service-wide secret must never grant all-tenant access.
// Configure JSON in INTEGRATION_SERVICE_SCOPES: {"field-services":["external-org-1"],"ai-workforce":["external-org-2"]}.
// serviceAuthenticate enforces it: a credential whose tenant is not listed for its caller is refused.
export function parseServiceScopes(raw: string | undefined): Record<Caller, string[]> | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const obj = value as Record<string, unknown>;
    const result = {} as Record<Caller, string[]>;
    for (const caller of ["field-services", "ai-workforce"] as const) {
      const refs = obj[caller];
      if (!Array.isArray(refs) || !refs.every((ref) => typeof ref === "string" && ref.length > 0 && ref.length <= 200)) return null;
      result[caller] = [...new Set(refs)];
    }
    return result;
  } catch { return null; }
}

export async function serviceAuthenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const caller = req.header("x-titan-service");
  const authorization = req.header("authorization");
  const knownCaller = caller === "field-services" || caller === "ai-workforce";
  // Every authentication denial is audited (ACA-004). No organisation or learner is resolved at this stage.
  const denyAuthentication = async (message: string) => {
    try {
      await prisma.academyIntegrationAudit.create({
        data: { service: knownCaller ? String(caller) : "unknown", outcome: "DENIED_AUTHENTICATION" },
      });
    } catch (error) {
      logger.error("Integration authentication denial could not be audited", { error: String(error) });
    }
    res.status(401).json({ message });
  };
  if (!knownCaller) { await denyAuthentication("Unknown service"); return; }
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (token.length < 32 || token.length > 512) { await denyAuthentication("Service authentication failed"); return; }
  try {
    // Only SHA-256 digests are stored. A credential is bound to one caller and tenant.
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const credential = await prisma.academyServiceCredential.findUnique({
      where: { tokenHash }, select: { id: true, service: true, companyRef: true, revokedAt: true, expiresAt: true },
    });
    if (!credential || credential.service !== caller || credential.revokedAt ||
        (credential.expiresAt && credential.expiresAt <= new Date())) {
      await denyAuthentication("Service authentication failed"); return;
    }
    // Enforced env allowlist. Unset or invalid configuration yields no allowed tenants, so every call is refused.
    const allowedRefs = knownCaller ? parseServiceScopes(process.env.INTEGRATION_SERVICE_SCOPES)?.[caller as Caller] : undefined;
    if (!allowedRefs?.includes(credential.companyRef)) {
      await denyAuthentication("Service authentication failed"); return;
    }
    // Boundary: credential.companyRef is the external company reference. It stays external here and is mapped to a companyId only after lookup below.
    res.locals.titanService = { caller, companyRefs: [credential.companyRef] } satisfies ServiceScope;
  } catch (error) { next(error); return; }
  res.setHeader("Cache-Control", "no-store");
  next();
}
integrationRoutes.use(serviceAuthenticate);
const requestParams = z.object({ externalOrganisationRef: z.string().min(1).max(200), externalUserRef: z.string().min(1).max(200) });
// External organisation reference is provisioned through the organisation's trusted integration setup.
// Never infer organisation membership from a caller-provided user ID alone.
integrationRoutes.get("/organisations/:externalOrganisationRef/learners/:externalUserRef/skills", async (req, res, next) => {
  try {
    const parsed = requestParams.safeParse(req.params);
    if (!parsed.success) { res.status(400).json({ message: "Invalid identifiers" }); return; }
    const { externalOrganisationRef, externalUserRef } = parsed.data;
    const service = res.locals.titanService as ServiceScope | undefined;
    const audit = async (outcome: string) => {
      await prisma.academyIntegrationAudit.create({ data: { service: service?.caller ?? "unknown", companyRef: externalOrganisationRef, externalUserRef, outcome } });
    };
    if (!service?.companyRefs.includes(externalOrganisationRef)) {
      await audit("DENIED_SCOPE");
      // Do not reveal whether an unauthorised organisation exists.
      res.status(404).json({ message: "Organisation not found" }); return;
    }
    // Boundary: externalOrganisationRef (external company reference) maps to the internal companyId here. Everything below uses company.id as the companyId.
    const company = await prisma.company.findUnique({ where: { externalRef: externalOrganisationRef }, select: { id: true } });
    if (!company) { await audit("NOT_FOUND_ORGANISATION"); res.status(404).json({ message: "Organisation not found" }); return; }
    // Query by internal companyId from the trusted company mapping, not a client tenant ID.
    // An ambiguous identity or legacy NULL companyId fails closed; never pick the first global match.
    const learnerId = await resolveScopedIdentity(
      { service: service.caller, companyId: company.id, externalUserRef },
      (where) => prisma.academyExternalIdentity.findMany({
        where, select: { userId: true }, take: 2,
      }),
    );
    if (!learnerId) { await audit("NOT_FOUND_IDENTITY"); res.status(404).json({ message: "Learner not found" }); return; }
    // Revoked/deactivated Academy accounts must never be represented as currently eligible workers.
    // Same account rule as curriculum.routes.ts activeAccountWhere: active, email verified and not soft-deleted (copied locally, helper not exported).
    const learner = await prisma.user.findUnique({
      where: { id: learnerId }, select: { isActive: true, isEmailVerified: true, deletedAt: true },
    });
    if (!learner?.isActive || !learner.isEmailVerified || learner.deletedAt) {
      await audit("INACTIVE_LEARNER");
      res.status(404).json({ message: "Learner not found" }); return;
    }
    const member = await prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId: company.id, userId: learnerId } },
      select: { id: true },
    });
    if (!member) { await audit("NOT_FOUND_MEMBERSHIP"); res.status(404).json({ message: "Learner not found in organisation" }); return; }
    const now = new Date();
    const skills = await prisma.academyVerifiedCompetency.findMany({
      where: { companyId: company.id, learnerId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      select: { id: true, lessonId: true, revisionId: true, verifiedAt: true, expiresAt: true },
      orderBy: { verifiedAt: "desc" },
    });
    // Level gate (PASS42): only lessons in levels the learner has finished. Applied after the auth and scope checks above, which are unchanged.
    const readableSkills = await filterToFinishedLevels(learnerId, skills);
    await audit("SUCCESS");
    res.json({ companyRef: externalOrganisationRef, externalUserRef, verifiedSkills: readableSkills, checkedAt: now.toISOString() });
  } catch (error) { next(error); }
});
