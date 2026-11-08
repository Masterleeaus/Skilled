/**
 * Central access-check response contract compatibility gate.
 *
 * Central's currently deployed/source /v1/access/check returns only
 * {allowed, role, reason}, not a revisioned local-identity decision.
 * Never coerce that legacy minimal response into a Skilled session grant.
 *
 * This is a PURE parser: the caller must additionally validate the response
 * came from an authenticated, trusted Central server-to-server transport and
 * that the authenticated principal matches expected Central OIDC claims.
 * It is not wired to login or session routes until Central agrees the format.
 */
import type {
  CentralSessionBinding,
  FreshCentralAccess,
} from "./central-session-revalidation";

const ID = /^[A-Za-z0-9:_-]{1,200}$/;
const REVISION = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;
const keys = [
  "allowed", "subject", "issuer", "audience", "organisationRef",
  "membershipRevision", "linkRevision", "localUserId", "companyId", "memberRole",
] as const;
const roles = new Set(["OWNER", "MANAGER", "ASSESSOR", "LEARNER"]);

export interface CentralAccessDecisionV1 extends FreshCentralAccess {
  allowed: true;
  localUserId: string;
  companyId: string;
  memberRole: CentralSessionBinding["memberRole"];
}

export type CentralAccessContractResult =
  | { accepted: true; decision: CentralAccessDecisionV1 }
  | { accepted: false; reason: "unsupported_response" | "identity_mismatch" | "revoked_or_changed" };

function dataObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Fail closed on Central's current minimal access-check response.
 * A *future* versioned decision must bind the verified subject, organisation,
 * local account, member role and BOTH Central revision numbers.
 *
 * Deliberately reject unknown top-level response fields so new contracts
 * require explicit review rather than silent accidental acceptance.
 */
export function parseCentralAccessDecision(
  input: unknown,
  session: CentralSessionBinding,
): CentralAccessContractResult {
  const reject = (reason: "unsupported_response" | "identity_mismatch" | "revoked_or_changed"): CentralAccessContractResult =>
    ({accepted: false, reason});
  if (!dataObject(input) || !dataObject(session)) return reject("unsupported_response");
  if (Object.keys(input).length !== keys.length || Object.keys(input).some(k => !keys.includes(k as typeof keys[number]))) {
    return reject("unsupported_response");
  }
  if (input.allowed !== true ||
      typeof input.subject !== "string" || !ID.test(input.subject) ||
      typeof input.issuer !== "string" || !/^https:\/\/[^/?#]+$/.test(input.issuer) ||
      typeof input.audience !== "string" || !ID.test(input.audience) ||
      typeof input.organisationRef !== "string" || !ID.test(input.organisationRef) ||
      typeof input.localUserId !== "string" || !ID.test(input.localUserId) ||
      typeof input.companyId !== "string" || !ID.test(input.companyId) ||
      !roles.has(input.memberRole) ||
      !REVISION(input.membershipRevision) || !REVISION(input.linkRevision)) {
    return reject("unsupported_response");
  }
  if (input.subject !== session.subject ||
      input.issuer !== session.issuer ||
      input.audience !== session.audience ||
      input.organisationRef !== session.organisationRef ||
      input.localUserId !== session.localUserId ||
      input.companyId !== session.companyId ||
      input.memberRole !== session.memberRole) return reject("identity_mismatch");
  if (input.membershipRevision !== session.centralMembershipRevision ||
      input.linkRevision !== session.centralLinkRevision) return reject("revoked_or_changed");
  return {accepted: true, decision: {
    allowed: true,
    authorised: true,
    subject: input.subject, issuer: input.issuer,
    audience: input.audience, organisationRef: input.organisationRef,
    localUserId: input.localUserId, companyId: input.companyId,
    memberRole: input.memberRole as CentralSessionBinding["memberRole"],
    membershipRevision: input.membershipRevision,
    linkRevision: input.linkRevision,
  }};
}
