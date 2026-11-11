/**
 * Central SSO: OpenID Connect ID token verification for the Skilled callback.
 * Fixed issuer, fixed audience (this application's client ID), RS256 only, JWKS from configuration.
 * Tokens and key URLs are never taken from the request. Only verified claims leave this module.
 */
import { createPublicKey, verify as verifySignature, type KeyObject } from "node:crypto";
import { CentralAuthError } from "./central-errors";

/** RSA public key in JWK form, as published by the identity provider's JWKS. */
interface RsaJwk {
  kty: "RSA";
  kid: string;
  n: string;
  e: string;
  use?: string;
  alg?: string;
}

export interface VerifiedIdToken {
  sub: string;
  nonce: string;
  iss: string;
  aud: string | string[];
  azp?: string;
  iat: number;
  exp: number;
}

export type IdTokenVerifier = (token: string) => Promise<VerifiedIdToken>;

export interface IdTokenVerifierOptions {
  issuer: string;
  clientId: string;
  jwksUri: string;
  fetcher?: typeof fetch;
  clock?: () => number;
  /** Maximum age of iat accepted for a freshly issued ID token. */
  maxAgeMs?: number;
  /** How long fetched signing keys are reused before the JWKS is read again. */
  keyCacheMs?: number;
  /** Minimum gap between forced JWKS refreshes triggered by an unknown key ID. */
  refreshCooldownMs?: number;
}

const fail = (): never => {
  throw new CentralAuthError("invalid_identity_token");
};

const parseSegment = (segment: string): Record<string, unknown> => {
  try {
    const value: unknown = JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail();
    return value as Record<string, unknown>;
  } catch {
    return fail();
  }
};

const isRsaSigningKey = (key: unknown): key is RsaJwk => {
  if (!key || typeof key !== "object") return false;
  const candidate = key as { kty?: unknown; kid?: unknown; use?: unknown; alg?: unknown };
  return candidate.kty === "RSA" && typeof candidate.kid === "string" && candidate.kid.length > 0 &&
    (candidate.use === undefined || candidate.use === "sig") &&
    (candidate.alg === undefined || candidate.alg === "RS256");
};

export function createCentralIdTokenVerifier({
  issuer,
  clientId,
  jwksUri,
  fetcher = fetch,
  clock = Date.now,
  maxAgeMs = 300_000,
  keyCacheMs = 60_000,
  refreshCooldownMs = 30_000,
}: IdTokenVerifierOptions): IdTokenVerifier {
  if (typeof issuer !== "string" || typeof clientId !== "string" || !clientId || typeof jwksUri !== "string") {
    throw new TypeError("invalid ID token verifier configuration");
  }
  let keys: Array<RsaJwk> = [];
  let keysExpireAt = 0;
  let lastForcedRefresh = Number.NEGATIVE_INFINITY;

  async function loadKeys(): Promise<void> {
    let response: Response;
    try {
      response = await fetcher(jwksUri, { method: "GET", headers: { accept: "application/json" }, redirect: "error", signal: AbortSignal.timeout(4000) });
    } catch {
      return fail();
    }
    if (!response.ok) return fail();
    let document: unknown;
    try {
      document = await response.json();
    } catch {
      return fail();
    }
    const list = (document as { keys?: unknown } | null)?.keys;
    if (!Array.isArray(list) || list.length > 64) return fail();
    keys = list.filter(isRsaSigningKey);
    keysExpireAt = clock() + keyCacheMs;
  }

  async function signingKey(kid: string): Promise<KeyObject> {
    if (clock() >= keysExpireAt) await loadKeys();
    let jwk = keys.find((key) => key.kid === kid);
    if (!jwk && clock() - lastForcedRefresh >= refreshCooldownMs) {
      lastForcedRefresh = clock();
      await loadKeys();
      jwk = keys.find((key) => key.kid === kid);
    }
    if (!jwk) return fail();
    try {
      return createPublicKey({ key: jwk, format: "jwk" });
    } catch {
      return fail();
    }
  }

  return async function verifyIdToken(token: string): Promise<VerifiedIdToken> {
    if (typeof token !== "string" || token.length === 0 || token.length > 16_384) return fail();
    const parts = token.split(".");
    if (parts.length !== 3) return fail();
    const [headerSegment, payloadSegment, signatureSegment] = parts;
    const header = parseSegment(headerSegment);
    const payload = parseSegment(payloadSegment);
    if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid || header.crit || header.jku || header.x5u || header.b64 === false) {
      return fail();
    }
    const key = await signingKey(header.kid);
    const signature = Buffer.from(signatureSegment, "base64url");
    if (signature.length === 0 || !verifySignature("RSA-SHA256", Buffer.from(`${headerSegment}.${payloadSegment}`), key, signature)) return fail();

    const now = Math.floor(clock() / 1000);
    const aud = payload.aud;
    const audienceMatches = aud === clientId || (Array.isArray(aud) && aud.includes(clientId));
    const audienceOk = audienceMatches && (!Array.isArray(aud) || aud.length === 1 || payload.azp === clientId);
    const azpOk = payload.azp === undefined || payload.azp === clientId;
    const iat = payload.iat;
    const exp = payload.exp;
    if (payload.iss !== issuer || !audienceOk || !azpOk) return fail();
    if (typeof payload.sub !== "string" || payload.sub.length === 0 || payload.sub.length > 255) return fail();
    if (typeof payload.nonce !== "string" || payload.nonce.length === 0 || payload.nonce.length > 512) return fail();
    if (!Number.isSafeInteger(iat) || (iat as number) > now + 60 || (iat as number) < now - Math.ceil(maxAgeMs / 1000) - 60) return fail();
    if (!Number.isSafeInteger(exp) || (exp as number) <= now) return fail();
    if (payload.nbf !== undefined && (!Number.isSafeInteger(payload.nbf) || (payload.nbf as number) > now + 60)) return fail();

    return {
      sub: payload.sub,
      nonce: payload.nonce,
      iss: issuer,
      aud: payload.aud as string | string[],
      azp: typeof payload.azp === "string" ? payload.azp : undefined,
      iat: iat as number,
      exp: exp as number,
    };
  };
}
