/**
 * Titan Central -> Skilled local identity resolution boundary (issue #71).
 *
 * Do not expose this function to HTTP clients or invoke it with unverified token
 * data. The caller MUST validate Central issuer, audience, signature, expiry,
 * state/nonce and membership/revocation independently before constructing the
 * VerifiedCentralIdentity. This module deliberately cannot mint sessions.
 *
 * Existing AcademyExternalIdentity rows are provisioning links, NOT evidence of
 * Central entitlement. No automatic subject/email matching is permitted.
 */
import { prisma } from "../../config/prisma";

export const CENTRAL_LINK_SERVICE = "titan-central" as const;
const REF = /^[A-Za-z0-9:_-]{1,200}$/;

export interface VerifiedCentralIdentity {
  /** Output of a trusted Central/OIDC verifier, never browser JSON. */
  subject: string;
  issuer: string;
  audience: string;
  organisationRef: string;
  /** Explicit downstream decision from Central's authoritative entitlement check. */
  authorised: true;
}

export interface LocalCentralResolution {
  userId: string;
  companyId: string;
  companyRef: string;
  memberRole: "OWNER" | "MANAGER" | "ASSESSOR" | "LEARNER";
  /** Local login still requires a separate session issuer and revocation wiring. */
  canIssueSession: false;
}

export interface CentralResolutionStore {
  company: {
    findUnique(args: { where: { externalRef: string }; select: { id: true } }): Promise<{ id: string } | null>;
  };
  academyExternalIdentity: {
    findMany(args: {
      where: { service: string; externalUserRef: string };
      select: { id: true; companyId: true; userId: true };
      take: number;
    }): Promise<Array<{ id: string; companyId: string | null; userId: string }>>;
  };
  user: {
    findUnique(args: {
      where: { id: string };
      select: { id: true; role: true; isActive: true; isEmailVerified: true; deletedAt: true };
    }): Promise<{ id: string; role: string; isActive: boolean; isEmailVerified: boolean; deletedAt: Date | null } | null>;
  };
  companyMember: {
    findUnique(args: {
      where: { companyId_userId: { companyId: string; userId: string } };
      select: { role: true };
    }): Promise<{ role: string } | null>;
  };
}

const validIdentity = (input: VerifiedCentralIdentity): boolean =>
  !!input && input.authorised === true &&
  typeof input.issuer === "string" && input.issuer.startsWith("https://") &&
  typeof input.audience === "string" && REF.test(input.audience) &&
  typeof input.subject === "string" && REF.test(input.subject) &&
  typeof input.organisationRef === "string" && REF.test(input.organisationRef);

const memberRoles = new Set(["OWNER","MANAGER","ASSESSOR","LEARNER"]);

/**
 * Fail closed for absent org, stale links, ambiguous links, deactivated users,
 * missing memberships or unrecognised roles. The full verified identity and
 * organisation must come from Central; never accept caller-selected tenant IDs.
 */
export async function resolveVerifiedCentralIdentity(
  input: VerifiedCentralIdentity,
  store: CentralResolutionStore = prisma,
): Promise<LocalCentralResolution | null> {
  if (!validIdentity(input)) return null;
  const company = await store.company.findUnique({
    where: { externalRef: input.organisationRef },
    select: { id: true },
  });
  if (!company) return null;

  // Legacy unscoped identities must not be granted a tenant retroactively.
  // A global uniqueness key may currently constrain the subject to one row;
  // selecting up to 2 still rejects ambiguous results after schema migration.
  const links = await store.academyExternalIdentity.findMany({
    where: { service: CENTRAL_LINK_SERVICE, externalUserRef: input.subject },
    select: { id: true, companyId: true, userId: true },
    take: 2,
  });
  if (links.length !== 1) return null;
  const link = links[0];
  if (!link.id || !link.userId || link.companyId !== company.id) return null;

  const [user, membership] = await Promise.all([
    store.user.findUnique({
      where: { id: link.userId },
      select: { id: true, role: true, isActive: true, isEmailVerified: true, deletedAt: true },
    }),
    store.companyMember.findUnique({
      where: { companyId_userId: { companyId: company.id, userId: link.userId } },
      select: { role: true },
    }),
  ]);
  if (!user || user.id !== link.userId || !user.isActive || !user.isEmailVerified || user.deletedAt) return null;
  if (!membership || !memberRoles.has(membership.role)) return null;

  return {
    userId: user.id, companyId: company.id, companyRef: input.organisationRef,
    memberRole: membership.role as LocalCentralResolution["memberRole"],
    canIssueSession: false,
  };
}
