/**
 * Test fixtures for Central SSO. A generated RSA key stands in for the identity provider's signing key and a
 * fake fetch serves its JWKS and token endpoint. It checks client authentication and PKCE (S256) like Logto would.
 * No value here is a real credential or a real endpoint.
 */
import { createHash, generateKeyPairSync, sign as cryptoSign, type KeyObject } from "node:crypto";

export const ISSUER = "https://id.central.test";
export const CLIENT_ID = "skilled-academy-test-client";
export const CLIENT_SECRET = "central-test-secret-0123456789";
export const JWKS_URI = "https://id.central.test/oidc/jwks";
export const TOKEN_URI = "https://id.central.test/oidc/token";
export const REDIRECT_URI = "https://academy.test/api/auth/central/callback";

export interface SigningKey {
  kid: string;
  privateKey: KeyObject;
  jwk: Record<string, unknown>;
}

export function createSigningKey(kid = "central-key-1"): SigningKey {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = publicKey.export({ format: "jwk" }) as Record<string, unknown>;
  return { kid, privateKey, jwk: { ...jwk, kid, alg: "RS256", use: "sig" } };
}

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

/** Signs an RS256 token. header may override alg/kid to build malformed tokens for negative tests. */
export function signToken(key: SigningKey, claims: Record<string, unknown>, header: Record<string, unknown> = {}): string {
  const headerPart = b64({ alg: "RS256", kid: key.kid, typ: "JWT", ...header });
  const payloadPart = b64(claims);
  const signature = cryptoSign("RSA-SHA256", Buffer.from(`${headerPart}.${payloadPart}`), key.privateKey).toString("base64url");
  return `${headerPart}.${payloadPart}.${signature}`;
}

/** Claims for a valid ID token. Pass undefined in overrides to remove a claim. */
export function idClaims(nonce: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, unknown> = { iss: ISSUER, aud: CLIENT_ID, sub: "central-subject-1", nonce, iat: now, exp: now + 300, ...overrides };
  for (const [key, value] of Object.entries(claims)) if (value === undefined) delete claims[key];
  return claims;
}

const sha256Base64url = (value: string) => createHash("sha256").update(value).digest("base64url");

export interface FakeCentral {
  fetcher: typeof fetch;
  /** Registers the nonce and PKCE challenge from an /authorize URL and returns the authorization code for it. */
  issueCode(authorizationUrl: string, options?: { idTokenClaims?: Record<string, unknown>; signWith?: SigningKey }): string;
  tokenRequests: Array<{ authorization: string | null; params: URLSearchParams }>;
  jwksRequests: number;
  setKeys(keys: SigningKey[]): void;
  tokenStatus: number;
}

/** A fake identity provider. It records requests so tests can assert what Skilled sent. */
export function createFakeCentral(initialKeys: SigningKey[]): FakeCentral {
  let keys = initialKeys;
  const codes = new Map<string, { nonce: string; challenge: string; idTokenClaims?: Record<string, unknown>; signWith?: SigningKey }>();
  const central: FakeCentral = {
    tokenRequests: [],
    jwksRequests: 0,
    tokenStatus: 200,
    setKeys: (next) => {
      keys = next;
    },
    issueCode(authorizationUrl, options = {}) {
      const url = new URL(authorizationUrl);
      const nonce = url.searchParams.get("nonce") ?? "";
      const challenge = url.searchParams.get("code_challenge") ?? "";
      const code = `code-${codes.size + 1}-${Math.random().toString(36).slice(2)}`;
      codes.set(code, { nonce, challenge, idTokenClaims: options.idTokenClaims, signWith: options.signWith });
      return code;
    },
    fetcher: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
      if (url === JWKS_URI) {
        central.jwksRequests += 1;
        return json(200, { keys: keys.map((key) => key.jwk) });
      }
      if (url === TOKEN_URI) {
        const params = new URLSearchParams(String(init?.body ?? ""));
        const authorization = (init?.headers as Record<string, string> | undefined)?.authorization ?? null;
        central.tokenRequests.push({ authorization, params });
        if (central.tokenStatus !== 200) return json(central.tokenStatus, { error: "invalid_grant" });
        const entry = codes.get(params.get("code") ?? "");
        codes.delete(params.get("code") ?? "");
        const expectedAuth = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`;
        if (!entry || authorization !== expectedAuth) return json(400, { error: "invalid_client_or_grant" });
        if (sha256Base64url(params.get("code_verifier") ?? "") !== entry.challenge) return json(400, { error: "pkce_mismatch" });
        const signer = entry.signWith ?? keys[0];
        const claims = entry.idTokenClaims ?? idClaims(entry.nonce);
        return json(200, { id_token: signToken(signer, claims), access_token: "central-access-token", token_type: "Bearer", expires_in: 300 });
      }
      return json(404, { error: "not_found" });
    }) as typeof fetch,
  };
  return central;
}
