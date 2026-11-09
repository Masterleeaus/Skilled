/**
 * Disabled-by-default server-only client for Central's CURRENT /v1/access/check.
 * Central presently returns {allowed,role,reason}; the bridge deliberately
 * rejects that as insufficient proof of a revision-bound Skilled session.
 *
 * No HTTP route or login handler imports this module. The caller MUST provide
 * an operator-pinned HTTPS endpoint and an access token from an independently
 * verified, subject-bound Central credential exchange. Never forward arbitrary
 * user headers, caller-selected organisations or a service token standing in
 * for the user's identity.
 */
import type { CentralDecisionTransport } from "./central-verified-access-bridge";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BEARER = /^[A-Za-z0-9._~-]{16,8192}$/;
const ACTION = "session:open";
const MAX_BODY_BYTES = 8192;
const MAX_TIMEOUT_MS = 5000;
export const CENTRAL_LEGACY_APPLICATION = "academy" as const;

export interface CentralAccessHttpConfig {
  /** Exact operator-allowlisted origin, not an URL from the incoming request. */
  origin: string;
  /** Must be explicitly enabled when trustworthy delegated token issuance exists. */
  enabled: true;
  /** Token acquired server-side for the verified Central subject/audience. */
  getVerifiedBearer: (subject: string) => Promise<string>;
  timeoutMs?: number;
  /** Only for tests. Production uses Node's native fetch. */
  fetchImpl?: typeof fetch;
}

function operatorOrigin(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.href !== url.origin + "/" ||
        url.username || url.password || url.port ||
        !host.includes(".") || host === "localhost" ||
        host.endsWith(".localhost") || host.endsWith(".local") ||
        host.endsWith(".internal") || /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
        host.startsWith("[") || host.endsWith("]") ||
        /\s/.test(value)) return null;
    return url.origin;
  } catch { return null; }
}

/**
 * A production client must be assembled only from verified operator config.
 * Reject bad configuration before exposing a transport callback.
 */
export function createCentralAccessHttpTransport(config: CentralAccessHttpConfig): CentralDecisionTransport {
  if (!config || config.enabled !== true ||
      typeof config.getVerifiedBearer !== "function") throw new Error("central transport disabled");
  const origin = operatorOrigin(config.origin);
  const timeout = config.timeoutMs ?? 2000;
  if (!origin || !Number.isInteger(timeout) || timeout < 100 || timeout > MAX_TIMEOUT_MS) {
    throw new Error("invalid trusted Central transport configuration");
  }
  const fetcher = config.fetchImpl ?? fetch;
  if (typeof fetcher !== "function") throw new Error("missing trusted HTTP implementation");
  return async request => {
    if (!request || request.audience !== "urn:titan-central:product:lms" ||
        request.issuer !== origin ||
        !UUID.test(request.organisationRef) ||
        !/^[A-Za-z0-9:_-]{1,200}$/.test(request.subject)) {
      throw new Error("central transport request rejected");
    }
    const bearer = await config.getVerifiedBearer(request.subject);
    if (typeof bearer !== "string" || !BEARER.test(bearer)) {
      throw new Error("verified Central bearer unavailable");
    }
    const url = new URL("/v1/access/check", origin);
    url.searchParams.set("organisation_id", request.organisationRef);
    url.searchParams.set("application", CENTRAL_LEGACY_APPLICATION);
    url.searchParams.set("action", ACTION);
    const response = await fetcher(url.toString(), {
      method: "GET",
      headers: {
        authorization: `Bearer ${bearer}`,
        accept: "application/json",
      },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(timeout),
    });
    // 401/403/429/5xx are never coerced into successful access decisions.
    if (!response.ok) throw new Error("central access unavailable or denied");
    if (!(response.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
      throw new Error("central response is not JSON");
    }
    const declaredLength = response.headers.get("content-length");
    if (declaredLength !== null && (!/^\d+$/.test(declaredLength) ||
        Number(declaredLength) > MAX_BODY_BYTES)) throw new Error("central response too large");
    // Bound actual bytes even if Content-Length is missing or dishonest.
    if (!response.body) throw new Error("empty Central response");
    const reader = response.body.getReader();
    const parts: Uint8Array[] = [];
    let count = 0;
    try {
      for (;;) {
        const {done,value} = await reader.read();
        if (done) break;
        count += value.byteLength;
        if (count > MAX_BODY_BYTES) throw new Error("central response too large");
        parts.push(value);
      }
    } finally {
      await reader.cancel().catch(() => {});
    }
    if (count === 0) throw new Error("empty Central response");
    const bytes = new Uint8Array(count);
    let offset = 0;
    for (const part of parts) { bytes.set(part,offset); offset += part.length; }
    return JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(bytes)) as unknown;
  };
}
