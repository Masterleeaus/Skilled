/**
 * Central SSO: OpenID Connect Authorization Code + PKCE (S256) client for the Skilled callback.
 * - State, nonce and PKCE verifier are random per login and stored server-side, keyed by the SHA-256 of the state.
 * - The state is consumed atomically (one use). A callback is accepted only with the same browser binding
 *   cookie that started the login.
 * - The token exchange authenticates the client with HTTP Basic credentials from configuration.
 * - Authorization and token endpoints come only from the provider metadata at
 *   {issuer}/.well-known/openid-configuration (Central's apps/control-api/src/oidc-login.mjs). They are never
 *   derived from the issuer path. Discovery rejects a metadata issuer that is not an exact match, an endpoint on
 *   another origin, redirects, and bodies over 64 KiB. Successful discovery is cached for 5 minutes; failures are not.
 * See lms-main/docs/SKILLED-CENTRAL-CONTRACT-ALIGNMENT.md for the full list of differences from Central.
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

const DISCOVERY_SUFFIX = "/.well-known/openid-configuration";
const DISCOVERY_CACHE_MS = 300_000;
const MAX_DISCOVERY_BYTES = 65_536;

interface Endpoints {
  authorizationEndpoint: string;
  tokenEndpoint: string;
}

/** Reads a body as text and fails as soon as it exceeds maxBytes. */
async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  const declared = response.headers?.get?.("content-length");
  if (declared != null && Number(declared) > maxBytes) throw new CentralAuthError("discovery_invalid");
  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new CentralAuthError("discovery_invalid");
      }
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks).toString("utf8");
  }
  throw new CentralAuthError("discovery_invalid");
}

/** Fetches and validates the provider metadata. Endpoints must share the issuer's origin and carry no credentials, query or fragment. */
async function discover(
  fetcher: typeof fetch,
  discoveryUrl: string,
  issuer: string,
  issuerOrigin: string,
  timeoutMs: number,
): Promise<Endpoints> {
  let response: Response;
  try {
    response = await fetcher(discoveryUrl, {
      method: "GET",
      headers: { accept: "application/json" },
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new CentralAuthError("discovery_unavailable");
  }
  if (!response || !response.ok || response.redirected === true) throw new CentralAuthError("discovery_unavailable");
  let metadata: unknown;
  try {
    metadata = JSON.parse(await readBoundedText(response, MAX_DISCOVERY_BYTES));
  } catch (error) {
    if (error instanceof CentralAuthError) throw error;
    throw new CentralAuthError("discovery_invalid");
  }
  const document = metadata as { issuer?: unknown; authorization_endpoint?: unknown; token_endpoint?: unknown } | null;
  if (!document || typeof document !== "object" || document.issuer !== issuer) throw new CentralAuthError("discovery_invalid");
  const endpoint = (raw: unknown): string => {
    if (typeof raw !== "string" || raw.length === 0 || raw.length > 4096) throw new CentralAuthError("discovery_invalid");
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new CentralAuthError("discovery_invalid");
    }
    if (url.protocol !== "https:" || url.origin !== issuerOrigin || url.username || url.password || url.search || url.hash) {
      throw new CentralAuthError("discovery_invalid");
    }
    return url.href;
  };
  return {
    authorizationEndpoint: endpoint(document.authorization_endpoint),
    tokenEndpoint: endpoint(document.token_endpoint),
  };
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
  const issuerUrl = new URL(settings.issuer);
  if (issuerUrl.protocol !== "https:" || issuerUrl.username || issuerUrl.password || issuerUrl.search || issuerUrl.hash) {
    throw new TypeError("exact https issuer required");
  }
  const discoveryUrl = settings.issuer.replace(/\/+$/, "") + DISCOVERY_SUFFIX;
  let cache: { endpoints: Endpoints; expiresAt: number } | null = null;
  let inflight: Promise<Endpoints> | null = null;

  /** Cached metadata endpoints. Concurrent callers share one discovery request; failures are not cached. */
  function resolveEndpoints(): Promise<Endpoints> {
    if (cache && clock() < cache.expiresAt) return Promise.resolve(cache.endpoints);
    if (!inflight) {
      inflight = discover(fetcher, discoveryUrl, settings.issuer, issuerUrl.origin, timeoutMs)
        .then((endpoints) => {
          cache = { endpoints, expiresAt: clock() + DISCOVERY_CACHE_MS };
          return endpoints;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  }

  return {
    async begin(browserBinding: string) {
      if (typeof browserBinding !== "string" || !BINDING.test(browserBinding)) throw new CentralAuthError("binding_invalid");
      const { authorizationEndpoint } = await resolveEndpoints();
      const state = random();
      const nonce = random();
      const verifier = random();
      const expiresAt = clock() + stateTtlMs;
      await store.save(digestState(state), { nonce, verifier, bindingHash: sha256Base64url(browserBinding), expiresAt }, stateTtlMs);
      const url = new URL(authorizationEndpoint);
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

      const { tokenEndpoint } = await resolveEndpoints();
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
      let tokens: { id_token?: unknown; access_token?: unknown; token_type?: unknown } | null;
      try {
        tokens = (await response.json()) as { id_token?: unknown; access_token?: unknown; token_type?: unknown } | null;
      } catch {
        throw new CentralAuthError("invalid_token_response");
      }
      // Central requires both tokens in the exchange response (oidc-login.mjs), so both are required here.
      if (!tokens || typeof tokens.id_token !== "string" || tokens.id_token.length === 0 || tokens.id_token.length > 16_384 ||
          typeof tokens.access_token !== "string" || tokens.access_token.length === 0 || tokens.access_token.length > 16_384 ||
          typeof tokens.token_type !== "string" || tokens.token_type.toLowerCase() !== "bearer") {
        throw new CentralAuthError("invalid_token_response");
      }

      // The ID token must verify (signature, issuer, audience, expiry) before its claims are trusted.
      // The checks below repeat Central's post-verification checks (oidc-login.mjs) as defence in depth.
      const claims = await verifyIdToken(tokens.id_token);
      if (!sameDigest(claims.nonce, record.nonce)) throw new CentralAuthError("nonce_mismatch");
      const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      if (claims.iss !== settings.issuer || !audiences.includes(settings.clientId) ||
          !Number.isSafeInteger(claims.exp) || claims.exp <= Math.floor(clock() / 1000)) {
        throw new CentralAuthError("invalid_identity_token");
      }
      return { subject: claims.sub, issuer: settings.issuer };
    },
  };
}
