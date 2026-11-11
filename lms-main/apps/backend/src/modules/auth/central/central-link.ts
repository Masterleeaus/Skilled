/**
 * Central SSO: verified identity links between a Titan Central subject and a Skilled-local learner, manager,
 * assessor or owner.
 *
 * The link is the existing AcademyExternalIdentity row with service "titan-central", externalUserRef set to the
 * Logto subject, and companyId set to the Skilled Company whose externalRef is the verified Central organisation.
 * Only trusted operator code calls linkCentralIdentity / unlinkCentralIdentity. No HTTP route writes links.
 *
 * Login never grants a role. It only resolves the subject to one existing local account in one organisation with
 * an active membership. Skilled's own role checks (User.role, CompanyMember.role) decide what that account can do.
 * Email, company name, and any tenant or account ID from the browser are never used for matching.
 */
import type { Role } from "@prisma/client";
import type { prisma as PrismaInstance } from "../../../config/prisma";
import type { CentralDenialReason } from "./central-errors";
import { CentralLinkError } from "./central-errors";

export type CentralDb = typeof PrismaInstance;
export const CENTRAL_LINK_SERVICE = "titan-central";

export type CentralResolution =
  | { allowed: true; userId: string; companyId: string; organisationRef: string; role: Role; memberRole: string }
  | { allowed: false; reason: CentralDenialReason };

interface LinkInput {
  subject: string;
  organisationRef: string;
  userId: string;
}

const isBounded = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 200;

/** Same account rule as auth.service isAccountEligible: active, email verified, not soft-deleted. */
export function isCentralAccountEligible(user: { deletedAt: Date | null; isActive: boolean; isEmailVerified: boolean }): boolean {
  return !user.deletedAt && user.isActive && user.isEmailVerified;
}

async function audit(
  client: Pick<CentralDb, "academyIntegrationAudit">,
  outcome: string,
  companyRef: string | null,
  externalUserRef: string | null,
): Promise<void> {
  await client.academyIntegrationAudit.create({
    data: { service: CENTRAL_LINK_SERVICE, companyRef, externalUserRef, outcome },
  });
}

/** Resolves a verified Central subject to one Skilled account. Every ambiguous, missing or inactive case denies. */
export async function resolveCentralLogin(db: CentralDb, subject: string): Promise<CentralResolution> {
  const deny = (reason: CentralDenialReason): CentralResolution => ({ allowed: false, reason });
  if (!isBounded(subject)) return deny("not_linked");

  const links = await db.academyExternalIdentity.findMany({
    where: { service: CENTRAL_LINK_SERVICE, externalUserRef: subject },
    select: { userId: true, companyId: true },
  });
  if (links.length === 0) return deny("not_linked");
  // The unique key already prevents this. Checking again keeps an ambiguous link from ever resolving.
  if (links.length !== 1) return deny("link_ambiguous");
  const [link] = links;
  if (!link.companyId) return deny("link_unscoped");

  const company = await db.company.findUnique({ where: { id: link.companyId }, select: { id: true, externalRef: true } });
  if (!company || !company.externalRef) return deny("organisation_missing");

  // The link alone is not enough: the account must hold an active membership in the linked organisation.
  const member = await db.companyMember.findUnique({
    where: { companyId_userId: { companyId: company.id, userId: link.userId } },
    select: { role: true },
  });
  if (!member) return deny("membership_missing");

  const user = await db.user.findUnique({
    where: { id: link.userId },
    select: { id: true, role: true, isActive: true, isEmailVerified: true, deletedAt: true },
  });
  if (!user || !isCentralAccountEligible(user)) return deny("account_inactive");

  return { allowed: true, userId: user.id, companyId: company.id, organisationRef: company.externalRef, role: user.role, memberRole: member.role };
}

/** Creates a verified link. Idempotent for the same subject, user and organisation. Refuses any conflicting link. */
export async function linkCentralIdentity(db: CentralDb, input: LinkInput): Promise<"created" | "already_linked"> {
  if (!isBounded(input.subject) || !isBounded(input.organisationRef) || !isBounded(input.userId)) {
    throw new CentralLinkError("invalid_input");
  }
  return db.$transaction(async (tx) => {
    const company = await tx.company.findUnique({ where: { externalRef: input.organisationRef }, select: { id: true } });
    if (!company) throw new CentralLinkError("organisation_missing");
    const member = await tx.companyMember.findUnique({
      where: { companyId_userId: { companyId: company.id, userId: input.userId } },
      select: { id: true },
    });
    if (!member) throw new CentralLinkError("membership_missing");

    const existing = await tx.academyExternalIdentity.findUnique({
      where: { service_externalUserRef: { service: CENTRAL_LINK_SERVICE, externalUserRef: input.subject } },
    });
    if (existing) {
      if (existing.userId === input.userId && existing.companyId === company.id) {
        await audit(tx, "CENTRAL_LINK_CONFIRMED", input.organisationRef, input.subject);
        return "already_linked" as const;
      }
      // Manual reconciliation is required. The existing link is left untouched.
      throw new CentralLinkError("conflicting_link");
    }
    await tx.academyExternalIdentity.create({
      data: { service: CENTRAL_LINK_SERVICE, externalUserRef: input.subject, userId: input.userId, companyId: company.id },
    });
    await audit(tx, "CENTRAL_LINK_CREATED", input.organisationRef, input.subject);
    return "created" as const;
  });
}

/**
 * Removes a verified link and revokes every Skilled refresh session of that account, in one transaction.
 * Sessions are not tagged by origin, so all of the account's sessions are revoked (fail closed). The local
 * email/password login stays available and the learner signs in again.
 */
export async function unlinkCentralIdentity(db: CentralDb, input: LinkInput): Promise<{ sessionsRevoked: number }> {
  if (!isBounded(input.subject) || !isBounded(input.organisationRef) || !isBounded(input.userId)) {
    throw new CentralLinkError("invalid_input");
  }
  return db.$transaction(async (tx) => {
    const company = await tx.company.findUnique({ where: { externalRef: input.organisationRef }, select: { id: true } });
    if (!company) throw new CentralLinkError("organisation_missing");
    const existing = await tx.academyExternalIdentity.findUnique({
      where: { service_externalUserRef: { service: CENTRAL_LINK_SERVICE, externalUserRef: input.subject } },
    });
    if (!existing || existing.userId !== input.userId || existing.companyId !== company.id) throw new CentralLinkError("not_linked");

    await tx.academyExternalIdentity.delete({ where: { id: existing.id } });
    const revoked = await tx.refreshToken.updateMany({ where: { userId: input.userId, isRevoked: false }, data: { isRevoked: true } });
    await audit(tx, "CENTRAL_LINK_REVOKED", input.organisationRef, input.subject);
    return { sessionsRevoked: revoked.count };
  });
}
