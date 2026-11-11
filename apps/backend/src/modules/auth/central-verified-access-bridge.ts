/**
 * Central -> Skilled session-check integration boundary.
 *
 * Transport input is obtained by a future authenticated, operator-configured
 * server-to-server Central client; never by a browser or unverified user token.
 *
 * The current Central /v1/access/check response is deliberately incompatible:
 * it lacks the immutable local identity and revision bindings. This bridge
 * connects strict wire-contract parsing to fresh local account revalidation
 * without enabling login, accepting legacy responses or minting sessions.
 */
import {
  parseCentralAccessDecision,
  type CentralAccessContractResult,
} from "./central-access-contract";
import {
  revalidateCentralSession,
  type CentralSessionBinding,
} from "./central-session-revalidation";
import type {
  CentralResolutionStore,
  TrustedCentralVerifierConfig,
} from "./central-identity-resolver";

export type CentralDecisionTransport = (request: {
  subject: string;
  issuer: string;
  audience: "urn:titan-central:product:lms";
  organisationRef: string;
}) => Promise<unknown>;

export type CentralSessionCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "contract_rejected" | "access_denied" };

/**
 * Every call requires a fresh trusted response and a current Skilled local
 * identity lookup. No positive result is cached. In particular, a legacy
 * {allowed:true,role,reason} response can never authorise a session.
 *
 * The caller owns transport authentication, stored session integrity, request
 * timing/expiry and actual logout revocation. Until these exist, this is only
 * an unmounted integration primitive.
 */
export async function checkCentralLinkedSession(
  binding: CentralSessionBinding,
  transport: CentralDecisionTransport,
  store: CentralResolutionStore,
  trusted: TrustedCentralVerifierConfig,
): Promise<CentralSessionCheckResult> {
  if (!binding || !trusted || typeof transport !== "function" || !store) {
    return {allowed: false, reason: "access_denied"};
  }
  let rejection: CentralAccessContractResult | undefined;
  const allowed = await revalidateCentralSession(
    binding,
    async request => {
      const response = await transport(request);
      const parsed = parseCentralAccessDecision(response, binding);
      if (!parsed.accepted) {
        rejection = parsed;
        throw new Error("central_contract_rejected");
      }
      return parsed.decision;
    },
    store,
    trusted,
  );
  if (allowed) return {allowed: true};
  if (rejection && !rejection.accepted) return {allowed: false, reason: "contract_rejected"};
  return {allowed: false, reason: "access_denied"};
}
