/**
 * Central service calls (#209). Skilled calls Central's APIs with its own client-credentials token.
 *
 * - Token endpoint comes from OIDC discovery (same validation as sign-in). Nothing is hard-coded.
 * - The token request names the LMS audience (CENTRAL_LMS_AUDIENCE). The returned access token must carry that
 *   audience and be unexpired, or it is refused. A token for another product is never cached or sent.
 * - The token is cached in memory and refreshed REFRESH_SKEW_MS before expiry. Concurrent callers share one fetch.
 *   Failures are not cached. A 401 from an API call drops the cached token.
 * - Token contents are never logged and never put in error messages.
 * - The tenant comes from Central's verified token. organisation, tenant and cohort parameters are refused in the
 *   query or body before any network call, because Central answers 400 to them.
 *
 * Not mounted by any route. Configuration is read from operator environment variables; nothing is read from a request.
 */
import { isPlainHttpsUrl, isValidAudience } from "../../config/central-sso";
import { CentralAuthError } from "../auth/central/central-errors";
import { DISCOVERY_SUFFIX, discover, type Endpoints } from "../auth/central/central-oidc";

export const CENTRAL_SERVICE_ENV = {
  issuer: "CENTRAL_SSO_ISSUER",
  clientId: "CENTRAL_SERVICE_CLIENT_ID",
  clientSecret: "CENTRAL_SERVICE_CLIENT_SECRET",
  audience: "CENTRAL_LMS_AUDIENCE",
} as const;

export type CentralServiceReason =
  | "not_configured"
  | "discovery_unavailable"
  | "token_unavailable"
  | "token_rejected"
  | "invalid_token_response"
  | "audience_mismatch"
  | "token_expired"
  | "invalid_request"
  | "tenant_parameter_refused"
  | "api_unavailable";

export class CentralServiceError extends Error {
  constructor(readonly reason: CentralServiceReason) {
    super(reason);
    this.name = "CentralServiceError";
  }
}

export interface CentralServiceConfig {
  /** Exact https Central origin. The token endpoint is discovered from this issuer. */
  issuer: string;
  clientId: string;
  clientSecret: string;
  /** LMS audience. Required on every token. */
  audience: string;
}

/**
 * Reads the service configuration from operator environment variables. Throws a message that names missing or invalid
 * variables but never prints their values.
 */
export function loadCentralServiceConfig(env: Readonly<Record<string, string | undefined>>): CentralServiceConfig {
  const issuer = env[CENTRAL_SERVICE_ENV.issuer] ?? "";
  const clientId = env[CENTRAL_SERVICE_ENV.clientId] ?? "";
  const clientSecret = env[CENTRAL_SERVICE_ENV.clientSecret] ?? "";
  const audience = env[CENTRAL_SERVICE_ENV.audience] ?? "";
  const problems: string[] = [];
  if (!issuer) problems.push(CENTRAL_SERVICE_ENV.issuer);
  else if (!isPlainHttpsUrl(issuer)) problems.push(`${CENTRAL_SERVICE_ENV.issuer} (exact https URL)`);
  if (!clientId || clientId.length > 200) problems.push(CENTRAL_SERVICE_ENV.clientId);
  if (clientSecret.length < 16 || clientSecret.length > 512) problems.push(`${CENTRAL_SERVICE_ENV.clientSecret} (16 to 512 characters)`);
  if (!isValidAudience(audience)) problems.push(CENTRAL_SERVICE_ENV.audience);
  if (problems.length > 0) {
    // Names only. Values are never echoed, so a secret cannot leak through this message.
    throw new Error(`Central service calls are not configured. Missing or invalid: ${problems.join(", ")}`);
  }
  return { issuer, clientId, clientSecret, audience };
}

export interface CentralServiceClientOptions {
  config: CentralServiceConfig;
  fetcher?: typeof fetch;
  clock?: () => number;
  timeoutMs?: number;
  /** Refresh this long before the token's expiry. */
  refreshSkewMs?: number;
}

export interface CentralServiceRequest {
  method: "GET" | "POST";
  /** Absolute path on the Central origin, such as /v1/example. No query string here. */
  path: string;
  query?: Record<string, string>;
  body?: unknown;
}

export interface CentralServiceClient {
  getAccessToken(): Promise<string>;
  request(input: CentralServiceRequest): Promise<Response>;
}

const TENANT_KEY = /^(organi[sz]ation(_?id)?|tenant(_?id)?|cohort(_?id)?)$/i;
const SAFE_PATH = /^\/[A-Za-z0-9_.~/-]{1,512}$/;
const DISCOVERY_CACHE_MS = 300_000;
const MAX_TOKEN_RESPONSE_BYTES = 16_384;
const MAX_TOKEN_LENGTH = 8192;
const MAX_EXPIRES_IN_SECONDS = 86_400;

/** Walks a JSON value and reports whether any object key names a tenant parameter. Bounded depth. */
function containsTenantKey(value: unknown, depth = 0): boolean {
  if (depth > 16 || value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsTenantKey(item, depth + 1));
  return Object.entries(value).some(([key, child]) => TENANT_KEY.test(key) || containsTenantKey(child, depth + 1));
}

function decodeUnverifiedClaims(token: string): Record<string, unknown> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new CentralServiceError("invalid_token_response");
  try {
    const claims: unknown = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    if (!claims || typeof claims !== "object" || Array.isArray(claims)) throw new Error("not an object");
    return claims as Record<string, unknown>;
  } catch {
    throw new CentralServiceError("invalid_token_response");
  }
}

export function createCentralServiceClient({
  config,
  fetcher = fetch,
  clock = Date.now,
  timeoutMs = 5000,
  refreshSkewMs = 60_000,
}: CentralServiceClientOptions): CentralServiceClient {
  if (!config || !isPlainHttpsUrl(config.issuer) || !isValidAudience(config.audience) || !config.clientId ||
      config.clientSecret.length < 16 || typeof fetcher !== "function") {
    throw new CentralServiceError("not_configured");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 500 || timeoutMs > 10_000) throw new TypeError("invalid service timeout");
  if (!Number.isInteger(refreshSkewMs) || refreshSkewMs < 0 || refreshSkewMs > 300_000) throw new TypeError("invalid refresh skew");

  const issuerUrl = new URL(config.issuer);
  const origin = issuerUrl.origin;
  const discoveryUrl = config.issuer.replace(/\/+$/, "") + DISCOVERY_SUFFIX;
  let endpointCache: { endpoints: Endpoints; expiresAt: number } | null = null;
  let token: { value: string; expiresAt: number } | null = null;
  let inflight: Promise<string> | null = null;

  async function resolveTokenEndpoint(): Promise<string> {
    if (endpointCache && clock() < endpointCache.expiresAt) return endpointCache.endpoints.tokenEndpoint;
    try {
      const endpoints = await discover(fetcher, discoveryUrl, config.issuer, origin, timeoutMs);
      endpointCache = { endpoints, expiresAt: clock() + DISCOVERY_CACHE_MS };
      return endpoints.tokenEndpoint;
    } catch (error) {
      if (error instanceof CentralAuthError) throw new CentralServiceError("discovery_unavailable");
      throw error;
    }
  }

  async function fetchToken(): Promise<{ value: string; expiresAt: number }> {
    const tokenEndpoint = await resolveTokenEndpoint();
    const credential = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    let response: Response;
    try {
      response = await fetcher(tokenEndpoint, {
        method: "POST",
        headers: { authorization: `Basic ${credential}`, "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
        body: new URLSearchParams({ grant_type: "client_credentials", audience: config.audience }).toString(),
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch {
      throw new CentralServiceError("token_unavailable");
    }
    if (!response.ok) throw new CentralServiceError("token_rejected");
    const raw = await response.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_TOKEN_RESPONSE_BYTES) throw new CentralServiceError("invalid_token_response");
    let body: { access_token?: unknown; token_type?: unknown; expires_in?: unknown } | null;
    try {
      body = JSON.parse(raw) as typeof body;
    } catch {
      throw new CentralServiceError("invalid_token_response");
    }
    if (!body || typeof body !== "object" || typeof body.access_token !== "string" || body.access_token.length === 0 ||
        body.access_token.length > MAX_TOKEN_LENGTH || typeof body.token_type !== "string" || body.token_type.toLowerCase() !== "bearer" ||
        !Number.isSafeInteger(body.expires_in) || (body.expires_in as number) < 1 || (body.expires_in as number) > MAX_EXPIRES_IN_SECONDS) {
      throw new CentralServiceError("invalid_token_response");
    }
    const accessToken = body.access_token;
    const now = clock();
    const claims = decodeUnverifiedClaims(accessToken);
    // The signature is verified by Central on every call. Skilled uses these claims only to refuse a token that is
    // for another product or already expired, so such a token is never cached or sent.
    const aud = claims.aud;
    const audiences = Array.isArray(aud) ? aud : [aud];
    if (!audiences.includes(config.audience)) throw new CentralServiceError("audience_mismatch");
    if (claims.iss !== undefined && claims.iss !== config.issuer) throw new CentralServiceError("invalid_token_response");
    if (!Number.isSafeInteger(claims.exp) || (claims.exp as number) * 1000 <= now) throw new CentralServiceError("token_expired");
    const expiresAt = Math.min(now + (body.expires_in as number) * 1000, (claims.exp as number) * 1000) - refreshSkewMs;
    if (expiresAt <= now) throw new CentralServiceError("token_expired");
    return { value: accessToken, expiresAt };
  }

  async function getAccessToken(): Promise<string> {
    if (token && clock() < token.expiresAt) return token.value;
    if (!inflight) {
      inflight = fetchToken()
        .then((fresh) => {
          token = fresh;
          return fresh.value;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  }

  async function request({ method, path, query, body }: CentralServiceRequest): Promise<Response> {
    if (method !== "GET" && method !== "POST") throw new CentralServiceError("invalid_request");
    if (typeof path !== "string" || !SAFE_PATH.test(path) || path.includes("//")) throw new CentralServiceError("invalid_request");
    if (query !== undefined && (typeof query !== "object" || query === null)) throw new CentralServiceError("invalid_request");
    const queryKeys = Object.keys(query ?? {});
    if (queryKeys.some((key) => TENANT_KEY.test(key)) || containsTenantKey(body)) {
      throw new CentralServiceError("tenant_parameter_refused");
    }
    const url = new URL(path, origin);
    for (const key of queryKeys) {
      const value = (query as Record<string, unknown>)[key];
      if (typeof value !== "string") throw new CentralServiceError("invalid_request");
      url.searchParams.set(key, value);
    }
    const bearer = await getAccessToken();
    let response: Response;
    try {
      response = await fetcher(url.href, {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          authorization: `Bearer ${bearer}`,
          accept: "application/json",
          "cache-control": "no-store",
          ...(body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new CentralServiceError("api_unavailable");
    }
    if (response.status === 401 && token?.value === bearer) token = null;
    return response;
  }

  return { getAccessToken, request };
}
