/**
 * Skilled (LMS) product-side signed account-link assertion for Titan Central.
 *
 * Wire contract: Central packages/control-plane/src/link-assertion.ts.
 * This service NEVER provisions Central records or authenticates web sessions.
 * Product signing key stays in the server-only operator configuration.
 */
import { createPrivateKey, randomBytes, sign, type KeyObject } from "node:crypto";

export const CENTRAL_LINK_ASSERTION_AUDIENCE = "titan-central";
export const CENTRAL_LINK_ASSERTION_TYPE = "titan-link+jwt";
export const CENTRAL_LINK_ASSERTION_ISSUER = "lms";
export const CENTRAL_LEGACY_APPLICATION_ID = "academy";
const OPAQUE = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const KID = /^[A-Za-z0-9._-]{1,64}$/;
const B64URL = /^[A-Za-z0-9_-]{22,128}$/;
const MAX_SECONDS = 300;
const validId = (value: unknown): value is string => typeof value === "string" && OPAQUE.test(value);

export interface LinkAssertionRequest {
  logtoSubject: string;
  logtoOrganisationId: string;
  localUserId: string;
  localAccountId: string;
  companyId: string;
}

export interface SkilledLocalLinkAuthority {
  /**
   * Only trusted operator/Central-provisioning inputs reach this method.
   * This callback proves the Central organisation belongs to the exact
   * internal Skilled company. Never trust a browser-supplied companyId.
   */
  centralOrganisationMapsToCompany(logtoOrganisationId: string, companyId: string): Promise<boolean>;
  /** The local account is bound to this user and this company, and is not revoked. */
  localAccountBelongsToUser(accountId: string, userId: string, companyId: string): Promise<boolean>;
  /** The local user is active, verified, not deleted, and currently a company member. */
  activeVerifiedMember(userId: string, companyId: string): Promise<boolean>;
}
export interface SignedLinkOptions {
  key: KeyObject;
  kid: string;
  ttlSeconds?: number;
  clock?: () => Date;
  nonce?: () => string;
}
export class LinkAssertionDenied extends Error {
  constructor(readonly code: "invalid_request" | "not_authorised" | "invalid_configuration") {
    super("Skilled Central link assertion refused");
    this.name = "LinkAssertionDenied";
  }
}
function encode(payload: object) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}
export async function signSkilledCentralLinkAssertion(
  request: LinkAssertionRequest,
  authority: SkilledLocalLinkAuthority,
  options: SignedLinkOptions,
): Promise<string> {
  if (!request || !validId(request.logtoSubject) || !validId(request.logtoOrganisationId) ||
      !validId(request.localUserId) || !validId(request.localAccountId) || !validId(request.companyId)) {
    throw new LinkAssertionDenied("invalid_request");
  }
  const ttl = options?.ttlSeconds ?? 120;
  if (!options || !options.key || options.key.asymmetricKeyType !== "ed25519" ||
      options.key.type !== "private" || !KID.test(options.kid) ||
      !Number.isInteger(ttl) || ttl < 1 || ttl > MAX_SECONDS ||
      typeof authority?.centralOrganisationMapsToCompany !== "function" ||
      typeof authority?.localAccountBelongsToUser !== "function" ||
      typeof authority?.activeVerifiedMember !== "function") {
    throw new LinkAssertionDenied("invalid_configuration");
  }
  // All three checks are independent trusted sources, not assumptions based on one link.
  // Fail closed on any denied or unavailable check; errors propagate without signing.
  if (!(await authority.centralOrganisationMapsToCompany(request.logtoOrganisationId, request.companyId)) ||
      !(await authority.localAccountBelongsToUser(request.localAccountId, request.localUserId, request.companyId)) ||
      !(await authority.activeVerifiedMember(request.localUserId, request.companyId))) {
    throw new LinkAssertionDenied("not_authorised");
  }
  const now = (options.clock ?? (() => new Date()))();
  const iat = Math.floor(now.getTime() / 1000);
  const nonce = (options.nonce ?? (() => randomBytes(24).toString("base64url")))();
  if (!Number.isSafeInteger(iat) || iat < 0 || typeof nonce !== "string" || !B64URL.test(nonce)) {
    throw new LinkAssertionDenied("invalid_configuration");
  }
  const header = { alg: "EdDSA", typ: CENTRAL_LINK_ASSERTION_TYPE, kid: options.kid };
  const claims = {
    iss: CENTRAL_LINK_ASSERTION_ISSUER, aud: CENTRAL_LINK_ASSERTION_AUDIENCE,
    sub: request.logtoSubject, org: request.logtoOrganisationId,
    lu: request.localUserId, la: request.localAccountId, nonce,
    iat, exp: iat + ttl,
  };
  // Never include email, companyId, role, credential material, or display names.
  const signingInput = `${encode(header)}.${encode(claims)}`;
  return `${signingInput}.${sign(null, Buffer.from(signingInput, "ascii"), options.key).toString("base64url")}`;
}

/** Operator configuration names. The private key is read from server configuration only; it is never in the repository. */
export const CENTRAL_LINK_SIGNING_ENV = {
  key: "SKILLED_CENTRAL_LINK_SIGNING_KEY",
  kid: "SKILLED_CENTRAL_LINK_SIGNING_KID",
} as const;

/**
 * Loads the Ed25519 signing key from configuration. The key is base64 of a PKCS#8 DER private key.
 * Returns null when no key is configured, so signing stays unavailable. Malformed configuration throws
 * with a message that never includes the key material.
 */
export function loadCentralLinkSigningOptions(
  env: Readonly<Record<string, string | undefined>>,
): { key: KeyObject; kid: string } | null {
  const encoded = env[CENTRAL_LINK_SIGNING_ENV.key];
  if (encoded === undefined || encoded === "") return null;
  const kid = env[CENTRAL_LINK_SIGNING_ENV.kid] ?? "";
  if (!KID.test(kid)) throw new TypeError(`${CENTRAL_LINK_SIGNING_ENV.kid} must be a key identifier`);
  let key: KeyObject;
  try {
    key = createPrivateKey({ key: Buffer.from(encoded, "base64"), format: "der", type: "pkcs8" });
  } catch {
    throw new TypeError(`${CENTRAL_LINK_SIGNING_ENV.key} must be a base64 PKCS#8 private key`);
  }
  if (key.type !== "private" || key.asymmetricKeyType !== "ed25519") {
    throw new TypeError(`${CENTRAL_LINK_SIGNING_ENV.key} must be an Ed25519 private key`);
  }
  return { key, kid };
}
