/**
 * Central SSO: OpenID Connect Authorization Code + PKCE (S256) client for the Skilled callback.
 * - State, nonce and PKCE verifier are random per login and stored server-side, keyed by the SHA-256 of the state.
 * - The state is consumed atomically (one use). A callback is accepted only with the same browser binding
 *   cookie that started the login.
 * - The token exchange authenticates the client with HTTP Basic credentials from configuration.
 * - Endpoint paths (oidc/auth, oidc/token) follow the Titan Central OIDC client in the Central source tree.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { CentralSsoSettings } from "../../../config/central-sso";
import { CentralAuthError } from "./central-errors";
import type { IdTokenVerifier } from "./central-id-token";

export interface CentralStateRecord {
  nonce: string;
  verifier: string;
  bindingHash: string;
  expiresAt: number;
}

/** Durable, shared, one-use storage. consume() must delete and return atomically, or return null. */
export interface CentralStateStore {
  save(stateDigest: string, record: CentralStateRecord, ttlMs: number): Promise<void>;
  consume(stateDigest: string): Promise<CentralStateRecord | null>;
}

export interface CentralOidcOptions {
  settings: Pick<CentralSsoSettings, "issuer" | "clientId" | "clientSecret" | "redirectUri">;
  store: CentralStateStore;
  verifyIdToken: IdTokenVerifier;
  fetcher?: typeof fetch;
  clock?: () => number;
  stateTtlMs?: number;
  timeoutMs?: number;
}

export interface CentralOidcClient {
  begin(browserBinding: string): Promise<{ authorizationUrl: string; expiresAt: number }>;
  complete(input: { state: string; code: string; browserBinding: string }): Promise<{ subject: string; issuer: string }>;
}

const b64url = (buffer: Buffer) => buffer.toString("base64url");
const random = () => b64url(randomBytes(32));
export const sha256Base64url = (value: string) => b64url(createHash("sha256").update(value).digest());
export const digestState = (state: string) => createHash("sha256").update(state).digest("hex");
const BINDING = /^[A-Za-z0-9_-]{43}$/;
const STATE = /^[A-Za-z0-9_-]{43}$/;

function sameDigest(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function createCentralOidcClient({
  settings,
  store,
  verifyIdToken,
  fetcher = fetch,
  clock = Date.now,
  stateTtlMs = 300_000,
  timeoutMs = 5000,
}: CentralOidcOptions): CentralOidcClient {
  if (!store || typeof store.save !== "function" || typeof store.consume !== "function" || typeof verifyIdToken !== "function") {
    throw new TypeError("invalid Central OIDC dependencies");
  }
  if (!Number.isInteger(stateTtlMs) || stateTtlMs < 60_000 || stateTtlMs > 600_000) throw new TypeError("invalid state TTL");
  const base = settings.issuer.endsWith("/") ? settings.issuer : `${settings.issuer}/`;
  const authorizeEndpoint = new URL("oidc/auth", base).href;
  const tokenEndpoint = new URL("oidc/token", base).href;

  return {
    async begin(browserBinding: string) {
      if (typeof browserBinding !== "string" || !BINDING.test(browserBinding)) throw new CentralAuthError("binding_invalid");
      const state = random();
      const nonce = random();
      const verifier = random();
      const expiresAt = clock() + stateTtlMs;
      await store.save(digestState(state), { nonce, verifier, bindingHash: sha256Base64url(browserBinding), expiresAt }, stateTtlMs);
      const url = new URL(authorizeEndpoint);
      const params: Record<string, string> = {
        client_id: settings.clientId,
        redirect_uri: settings.redirectUri,
        response_type: "code",
        scope: "openid profile email",
        state,
        nonce,
        code_challenge: sha256Base64url(verifier),
        code_challenge_method: "S256",
      };
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
      return { authorizationUrl: url.href, expiresAt };
    },

    async complete({ state, code, browserBinding }) {
      if (typeof state !== "string" || !STATE.test(state) || typeof code !== "string" || code.length === 0 || code.length > 2048 ||
          typeof browserBinding !== "string" || !BINDING.test(browserBinding)) {
        throw new CentralAuthError("state_invalid");
      }
      // The state is consumed before any network call, so a replayed callback never reaches the token endpoint.
      const record = await store.consume(digestState(state));
      if (!record || !Number.isSafeInteger(record.expiresAt) || record.expiresAt <= clock() ||
          !sameDigest(record.bindingHash, sha256Base64url(browserBinding)) || !record.nonce || !record.verifier) {
        throw new CentralAuthError("state_invalid");
      }

      const credential = Buffer.from(`${settings.clientId}:${settings.clientSecret}`).toString("base64");
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: settings.redirectUri,
        code_verifier: record.verifier,
      });
      let response: Response;
      try {
        response = await fetcher(tokenEndpoint, {
          method: "POST",
          headers: { authorization: `Basic ${credential}`, "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
          body: body.toString(),
          redirect: "error",
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        throw new CentralAuthError("token_exchange_unavailable");
      }
      if (!response.ok) throw new CentralAuthError("token_exchange_rejected");
      let tokens: { id_token?: unknown; token_type?: unknown } | null;
      try {
        tokens = (await response.json()) as { id_token?: unknown; token_type?: unknown } | null;
      } catch {
        throw new CentralAuthError("invalid_token_response");
      }
      if (!tokens || typeof tokens.id_token !== "string" || tokens.id_token.length === 0 || tokens.id_token.length > 16_384 ||
          typeof tokens.token_type !== "string" || tokens.token_type.toLowerCase() !== "bearer") {
        throw new CentralAuthError("invalid_token_response");
      }

      // The ID token must verify (signature, issuer, audience, expiry) before its claims are trusted.
      const claims = await verifyIdToken(tokens.id_token);
      if (!sameDigest(claims.nonce, record.nonce)) throw new CentralAuthError("nonce_mismatch");
      return { subject: claims.sub, issuer: settings.issuer };
    },
  };
}
