/**
 * Central outbox events (#208). Skilled accepts an event only when it is HMAC-signed, fresh, and well formed.
 * Verification happens before any parsing that could trigger side effects, and before any handler runs.
 *
 * Signing scheme (placeholder until Central's docs/EVENTS.md is confirmed in this repository):
 *   signature = "v1=" + hex(HMAC-SHA256(secret, `${timestamp}.${eventId}.${rawBody}`))
 * Headers: x-central-event-id, x-central-event-timestamp (unix seconds), x-central-event-signature.
 * The signature covers the raw body bytes, never a re-serialised JSON value.
 *
 * Delivery order per tenant is not enforced here: the contract does not yet name a sequence field.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const CENTRAL_EVENT_HEADERS = {
  id: "x-central-event-id",
  timestamp: "x-central-event-timestamp",
  signature: "x-central-event-signature",
} as const;

export const CENTRAL_EVENT_MAX_AGE_SECONDS = 300;
export const CENTRAL_EVENT_MAX_FUTURE_SKEW_SECONDS = 60;
export const CENTRAL_EVENT_MAX_BODY_BYTES = 65_536;
export const CENTRAL_EVENTS_SECRET_ENV = "CENTRAL_EVENTS_HMAC_SECRET";

export type CentralEventReason =
  | "headers_missing"
  | "signature_invalid"
  | "timestamp_stale"
  | "timestamp_invalid"
  | "body_too_large"
  | "body_invalid"
  | "event_id_mismatch";

export class CentralEventError extends Error {
  constructor(readonly reason: CentralEventReason) {
    super(reason);
    this.name = "CentralEventError";
  }
}

export interface CentralEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

/** Reads the secret from operator configuration. Throws naming the variable, never echoing its value. */
export function loadCentralEventsSecret(env: Readonly<Record<string, string | undefined>>): string {
  const secret = env[CENTRAL_EVENTS_SECRET_ENV] ?? "";
  if (secret.length < 32 || secret.length > 512) {
    throw new Error(`${CENTRAL_EVENTS_SECRET_ENV} is required (32 to 512 characters) to accept Central events`);
  }
  return secret;
}

const EVENT_ID = /^[A-Za-z0-9:_-]{1,200}$/;
const TIMESTAMP = /^\d{1,12}$/;
const SIGNATURE = /^v1=[0-9a-f]{64}$/;

export function signingInput(timestamp: string, eventId: string, rawBody: string): string {
  return `${timestamp}.${eventId}.${rawBody}`;
}

/** Produces a signature in the scheme above. Used by Central-side fixtures and by tests; Skilled only verifies. */
export function signCentralEvent(secret: string, timestamp: string, eventId: string, rawBody: string): string {
  return "v1=" + createHmac("sha256", secret).update(signingInput(timestamp, eventId, rawBody)).digest("hex");
}

function singleHeader(headers: Readonly<Record<string, string | string[] | undefined>>, name: string): string {
  const value = headers[name];
  if (typeof value !== "string" || value.length === 0) throw new CentralEventError("headers_missing");
  return value;
}

/**
 * Verifies freshness, signature and body shape, and returns the parsed event. Throws CentralEventError on any failure.
 * Headers are looked up in lower case, as Node exposes them.
 */
export function verifyCentralEvent({
  secret,
  headers,
  rawBody,
  nowSeconds = Math.floor(Date.now() / 1000),
}: {
  secret: string;
  headers: Readonly<Record<string, string | string[] | undefined>>;
  rawBody: string;
  nowSeconds?: number;
}): CentralEvent {
  if (typeof secret !== "string" || secret.length < 32) throw new Error("event secret not configured");
  const eventId = singleHeader(headers, CENTRAL_EVENT_HEADERS.id);
  const timestamp = singleHeader(headers, CENTRAL_EVENT_HEADERS.timestamp);
  const signature = singleHeader(headers, CENTRAL_EVENT_HEADERS.signature);
  if (!EVENT_ID.test(eventId) || !TIMESTAMP.test(timestamp) || !SIGNATURE.test(signature)) {
    throw new CentralEventError("signature_invalid");
  }
  if (typeof rawBody !== "string") throw new CentralEventError("body_invalid");
  if (Buffer.byteLength(rawBody, "utf8") > CENTRAL_EVENT_MAX_BODY_BYTES) throw new CentralEventError("body_too_large");

  const sentAt = Number(timestamp);
  if (sentAt > nowSeconds + CENTRAL_EVENT_MAX_FUTURE_SKEW_SECONDS) throw new CentralEventError("timestamp_invalid");
  if (nowSeconds - sentAt > CENTRAL_EVENT_MAX_AGE_SECONDS) throw new CentralEventError("timestamp_stale");

  const expected = Buffer.from(signCentralEvent(secret, timestamp, eventId, rawBody), "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new CentralEventError("signature_invalid");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new CentralEventError("body_invalid");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new CentralEventError("body_invalid");
  const event = parsed as Record<string, unknown>;
  if (typeof event.id !== "string" || typeof event.type !== "string" || event.type.length === 0 || event.type.length > 200 ||
      !event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) {
    throw new CentralEventError("body_invalid");
  }
  if (event.id !== eventId) throw new CentralEventError("event_id_mismatch");
  return { id: event.id, type: event.type, payload: event.payload as Record<string, unknown> };
}

/** Atomic claim store keyed by event id. claim() returns false when the event was already claimed. */
export interface EventClaimStore {
  claim(eventId: string): Promise<boolean>;
  release(eventId: string): Promise<void>;
}

/**
 * In-memory claim store for tests and single-process development only. It does not survive a restart, so production
 * needs a durable store (for example a unique-key table) before idempotency can be relied on across restarts.
 */
export function createMemoryEventClaimStore(): EventClaimStore {
  const claimed = new Set<string>();
  return {
    async claim(eventId) {
      if (claimed.has(eventId)) return false;
      claimed.add(eventId);
      return true;
    },
    async release(eventId) {
      claimed.delete(eventId);
    },
  };
}

export type EventOutcome = "processed" | "duplicate";

/**
 * Runs the handler at most once per event id. If the handler fails, the claim is released so a later delivery can retry.
 */
export function createIdempotentEventHandler({
  store,
  handle,
}: {
  store: EventClaimStore;
  handle: (event: CentralEvent) => Promise<void>;
}): (event: CentralEvent) => Promise<EventOutcome> {
  if (!store || typeof store.claim !== "function" || typeof store.release !== "function" || typeof handle !== "function") {
    throw new TypeError("invalid idempotent handler dependencies");
  }
  return async (event) => {
    if (!(await store.claim(event.id))) return "duplicate";
    try {
      await handle(event);
    } catch (error) {
      await store.release(event.id);
      throw error;
    }
    return "processed";
  };
}
