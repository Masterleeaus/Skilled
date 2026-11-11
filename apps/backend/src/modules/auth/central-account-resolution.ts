/**
 * Skilled-side Central account resolution, deliberately not mounted as an authentication route.
 *
 * Central verifies OIDC, memberships, entitlements and local account links. Skilled
 * must independently verify the exact company/account/member identity and obtain
 * the current local role before issuing any local session. No email matching.
 */
export type CentralApplicationId = "academy";
export type CentralDecision = {
  allowed: true;
  applicationId: CentralApplicationId;
  organisationId: string;
  localUserId: string;
  localAccountId: string;
  membershipRevision: number;
  entitlementRevision: number;
  linkRevision: number;
};
export type SkilledCentralAccount = {
  userId: string;
  companyId: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
};
export type LocalUserState = {
  id: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  isActive: boolean;
  isEmailVerified: boolean;
  deletedAt: Date | null;
};
export interface LocalCentralMapping {
  centralOrganisationId: string;
  companyId: string;
  localAccountId: string;
  localUserId: string;
  status: "verified" | "revoked";
}
export interface SkilledCentralReaders {
  /** Controlled mapping registry; MUST NOT accept organisation/company IDs from browser input. */
  findMappings(centralOrganisationId: string, localUserId: string, localAccountId: string):
    Promise<readonly LocalCentralMapping[]>;
  findUser(userId: string): Promise<LocalUserState | null>;
  isMember(companyId: string, userId: string): Promise<boolean>;
  /** Fresh Central check MUST verify link/membership/entitlement revisions and revocation. */
  isCentralAccessCurrent(decision: CentralDecision): Promise<boolean>;
}
const id = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9:_-]{1,200}$/.test(value);
const revision = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const role = (value: unknown): value is SkilledCentralAccount["role"] =>
  value === "ADMIN" || value === "TEACHER" || value === "STUDENT";

export async function resolveSkilledCentralAccount(
  untrustedDecision: unknown,
  readers: SkilledCentralReaders,
): Promise<SkilledCentralAccount | null> {
  if (untrustedDecision === null || typeof untrustedDecision !== "object" ||
      Array.isArray(untrustedDecision)) return null;
  const decision = untrustedDecision as Partial<CentralDecision>;
  if (decision.allowed !== true || decision.applicationId !== "academy" ||
      !id(decision.organisationId) || !id(decision.localUserId) || !id(decision.localAccountId) ||
      !revision(decision.membershipRevision) || !revision(decision.entitlementRevision) ||
      !revision(decision.linkRevision)) return null;
  // A valid-shaped object is NOT proof of OIDC authentication or Central authority.
  // The caller supplies the verified Central decision, and the reader MUST recheck it.
  if (!(await readers.isCentralAccessCurrent(decision as CentralDecision))) return null;
  const found = await readers.findMappings(
    decision.organisationId, decision.localUserId, decision.localAccountId,
  );
  if (!Array.isArray(found) || found.length !== 1) return null;
  const mapping = found[0];
  if (mapping?.status !== "verified" ||
      mapping.centralOrganisationId !== decision.organisationId ||
      mapping.localUserId !== decision.localUserId ||
      mapping.localAccountId !== decision.localAccountId || !id(mapping.companyId)) return null;
  const user = await readers.findUser(decision.localUserId);
  if (!user || user.id !== decision.localUserId || !user.isActive ||
      !user.isEmailVerified || user.deletedAt !== null || !role(user.role)) return null;
  if (!(await readers.isMember(mapping.companyId, user.id))) return null;
  return { userId: user.id, companyId: mapping.companyId, role: user.role };
}
