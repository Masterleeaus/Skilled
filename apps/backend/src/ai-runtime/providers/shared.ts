/**
 * Shared HTTP plumbing for the tutor chat clients (openai.ts, anthropic.ts).
 *
 * Rules enforced here:
 * - Global fetch only, injected through an option so tests never touch the network.
 * - Request timeout through AbortController. A timeout is a transport failure (status null, retryable).
 * - Failures carry a fixed error code and a numeric HTTP status. Response bodies, request bodies, headers
 *   and provider messages are never copied into a failure, a thrown error or a log line.
 * - Statuses 429, 500, 502, 503 and 504 are marked retryable, matching DEFAULT_FAILOVER_STATUSES in
 *   ../failover.ts. The chain decides whether to fail over; this file only classifies.
 */
import { DisabledChatProvider, type ChatProviderContract, type ProviderChatResult, type ProviderFailure } from '../contracts.js';

export type FetchLike = typeof fetch;
export type EnvLike = Record<string, string | undefined>;

export const DEFAULT_TIMEOUT_MS = 20_000;

export type ProviderConfigCode = 'model_not_configured';

/** Typed configuration error. Chat clients turn it into a non-retryable failure with `code` as the error. */
export class ProviderConfigError extends Error {
  readonly code: ProviderConfigCode;

  constructor(code: ProviderConfigCode, message: string) {
    super(message);
    this.name = 'ProviderConfigError';
    this.code = code;
  }
}

/** Reads a model name from the environment. Throws ProviderConfigError when it is unset or blank. */
export function resolveModel(env: EnvLike, variable: string): string {
  const value = env[variable];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ProviderConfigError('model_not_configured', `${variable} must be set to a model name`);
  }
  return value.trim();
}

/** Returns the API key from the environment, or null when unset or blank. Read at call time only. */
export function readKey(env: EnvLike, variable: string): string | null {
  const value = env[variable];
  if (typeof value !== 'string' || value.trim() === '') return null;
  return value.trim();
}

/** Parses a positive integer millisecond timeout. Anything else falls back to the default. */
export function parseTimeoutMs(raw: string | undefined, fallback: number = DEFAULT_TIMEOUT_MS): number {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw.trim())) return fallback;
  const value = Number(raw.trim());
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

/** Maps an HTTP status to a fixed error code and a retryable flag. Never reads the response body. */
export function classifyHttpStatus(status: number): { error: string; retryable: boolean } {
  switch (status) {
    case 429:
      return { error: 'rate_limited', retryable: true };
    case 500:
    case 502:
    case 503:
    case 504:
      return { error: 'provider_unavailable', retryable: true };
    case 529:
      return { error: 'provider_overloaded', retryable: true };
    case 401:
    case 403:
      return { error: 'auth_failed', retryable: false };
    case 400:
    case 404:
    case 413:
    case 422:
      return { error: 'bad_request', retryable: false };
    default:
      return { error: 'http_error', retryable: false };
  }
}

export function failure(provider: string, error: string, status: number | null, retryable: boolean, latency_ms: number | null): ProviderFailure {
  return { ok: false, provider, error, status, retryable, latency_ms };
}

export interface PostJsonOptions {
  provider: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  fetchImpl: FetchLike;
  timeoutMs: number;
}

export type PostJsonResult = { ok: true; json: unknown; status: number; latency_ms: number } | ProviderFailure;

/**
 * POSTs a JSON body with a timeout and returns the parsed JSON on a 2xx response. Any other outcome is a
 * ProviderFailure with a fixed code. Nothing from the request or the response is placed in the failure.
 */
export async function postJson(options: PostJsonOptions): Promise<PostJsonResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  const started = Date.now();
  const elapsed = (): number => Date.now() - started;

  try {
    const response = await options.fetchImpl(options.url, {
      method: 'POST',
      headers: { ...options.headers, 'content-type': 'application/json' },
      body: JSON.stringify(options.body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const mapped = classifyHttpStatus(response.status);
      return failure(options.provider, mapped.error, response.status, mapped.retryable, elapsed());
    }

    const json: unknown = await response.json();
    return { ok: true, json, status: response.status, latency_ms: elapsed() };
  } catch (err) {
    if (controller.signal.aborted) {
      return failure(options.provider, 'timeout', null, true, elapsed());
    }
    if (err instanceof SyntaxError) {
      return failure(options.provider, 'invalid_response', null, false, elapsed());
    }
    return failure(options.provider, 'transport_error', null, true, elapsed());
  } finally {
    clearTimeout(timer);
  }
}

/** Returns the disabled-provider refusal, the result used whenever the API key is missing. */
export function disabledResult(): Promise<ProviderChatResult> {
  const disabled: ChatProviderContract = new DisabledChatProvider();
  return disabled.chat({ companyId: '0', messages: [] });
}
