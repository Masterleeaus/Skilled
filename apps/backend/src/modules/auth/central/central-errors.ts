/** Central SSO failure vocabulary. Reasons are safe to log and to audit: they never contain tokens, codes or subjects. */
export type CentralAuthReason =
  | "state_invalid"
  | "binding_invalid"
  | "token_exchange_unavailable"
  | "token_exchange_rejected"
  | "invalid_token_response"
  | "invalid_identity_token"
  | "nonce_mismatch"
  | "login_unavailable"
  | "discovery_unavailable"
  | "discovery_invalid";

export class CentralAuthError extends Error {
  constructor(readonly reason: CentralAuthReason) {
    super(reason);
    this.name = "CentralAuthError";
  }
}

/** Reasons a verified Central identity is not allowed to open a Skilled session. */
export type CentralDenialReason =
  | "not_linked"
  | "link_ambiguous"
  | "link_unscoped"
  | "organisation_missing"
  | "membership_missing"
  | "account_inactive";

export class CentralLinkError extends Error {
  constructor(readonly reason: "organisation_missing" | "membership_missing" | "conflicting_link" | "not_linked" | "invalid_input") {
    super(reason);
    this.name = "CentralLinkError";
  }
}
