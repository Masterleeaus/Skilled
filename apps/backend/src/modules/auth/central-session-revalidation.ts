/**
 * Central-linked session revalidation contract (issue #71).
 *
 * No endpoint is mounted and no session is issued here. This boundary is for
 * future application session middleware once Central's verification protocol,
 * application-specific issuer/audience and revocation hooks are agreed.
 *
 * Each check MUST obtain a fresh server-to-server decision from Central. A
 * browser-provided decision or a cached OIDC login result is not acceptable.
 */
import {
  resolveVerifiedCentralIdentity,
  type CentralResolutionStore,
  type LocalCentralResolution,
  type TrustedCentralVerifierConfig,
  type VerifiedCentralIdentity,
} from "./central-identity-resolver";

export interface CentralSessionBinding {
  /** Persisted from a separately verified login; not a browser-supplied claim. */
  subject: string;
  issuer: string;
  audience: "urn:titan-central:product:lms";
  organisationRef: string;
  localUserId: string;
  companyId: string;
  memberRole: LocalCentralResolution["memberRole"];
  /** Central grants, memberships and links are independently revocable. */
  centralMembershipRevision: number;
  centralLinkRevision: number;
}

export interface FreshCentralAccess {
  authorised: boolean;
  subject: string;
  issuer: string;
  audience: string;
  organisationRef: string;
  membershipRevision: number;
  linkRevision: number;
}

/**
 * Implemented by trusted Central server-side access-check transport in a
 * future pass. This check is NOT a local JWT verification substitute.
 */
export type CentralAccessRecheck = (input: {
  subject: string;
  issuer: string;
  audience: "urn:titan-central:product:lms";
  organisationRef: string;
}) => Promise<FreshCentralAccess>;

const validRevision = (value: number): boolean =>
  Number.isSafeInteger(value) && value >= 0;

export async function revalidateCentralSession(
  binding: CentralSessionBinding,
  recheck: CentralAccessRecheck,
  store: CentralResolutionStore,
  trusted: TrustedCentralVerifierConfig,
): Promise<boolean> {
  // No default store or checker: validation must be explicitly wired by the
  // future app middleware, with a correctly scoped database transaction.
  if (!binding || !trusted ||
      typeof recheck !== "function" ||
      !binding.subject || !binding.organisationRef || !binding.localUserId ||
      !binding.companyId || !binding.memberRole ||
      !validRevision(binding.centralMembershipRevision) ||
      !validRevision(binding.centralLinkRevision) ||
      binding.issuer !== trusted.issuer ||
      binding.audience !== trusted.audience) return false;
  try {
    const decision = await recheck({
      subject: binding.subject,
      issuer: binding.issuer,
      audience: binding.audience,
      organisationRef: binding.organisationRef,
    });
    // Central may demote, revoke or re-link a user at any point. Revisions
    // must match exactly: a new grant requires a newly verified login.
    if (!decision || decision.authorised !== true ||
        decision.subject !== binding.subject ||
        decision.issuer !== binding.issuer ||
        decision.audience !== binding.audience ||
        decision.organisationRef !== binding.organisationRef ||
        decision.membershipRevision !== binding.centralMembershipRevision ||
        decision.linkRevision !== binding.centralLinkRevision ||
        !validRevision(decision.membershipRevision) ||
        !validRevision(decision.linkRevision)) return false;

    const verified: VerifiedCentralIdentity = {
      subject: decision.subject, issuer: decision.issuer,
      audience: decision.audience, organisationRef: decision.organisationRef,
      authorised: true,
    };
    const local = await resolveVerifiedCentralIdentity(verified, store, trusted);
    return !!local && local.userId === binding.localUserId &&
      local.companyId === binding.companyId &&
      local.companyRef === binding.organisationRef &&
      local.memberRole === binding.memberRole &&
      local.canIssueSession === false;
  } catch {
    // Network failure, service outage, or malformed reply never becomes an
    // affirmative access decision.
    return false;
  }
}
