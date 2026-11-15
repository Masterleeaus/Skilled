import { describe, it, expect, vi } from "vitest";
import { readFlag, type FlagSource } from "../modules/central/central-flags";
import {
  CentralEventError,
  CENTRAL_EVENT_HEADERS,
  createIdempotentEventHandler,
  createMemoryEventClaimStore,
  loadCentralEventsSecret,
  signCentralEvent,
  verifyCentralEvent,
  type CentralEvent,
} from "../modules/central/central-events";

// Fakes only. Central is never reached from these tests.
const NOW = 1_900_000_000;
const SECRET = "events-secret-for-tests-only-0123456789abcdef";
const FLAG = "lms.example_flag";

const answer = (value: unknown): FlagSource => vi.fn(async () => value);
const unreachable: FlagSource = async () => {
  throw new Error("connect ECONNREFUSED central.test");
};
const never: FlagSource = () => new Promise(() => undefined);

describe("central flags: declared defaults (#208)", () => {
  it("returns the declared default when no source is wired", async () => {
    expect(await readFlag(FLAG, false)).toBe(false);
    expect(await readFlag(FLAG, "standard")).toBe("standard");
    expect(await readFlag(FLAG, 25)).toBe(25);
  });

  it("returns the declared default when Central is unreachable", async () => {
    const value = await readFlag(FLAG, true, {
      sources: { organisation: unreachable, rollout: unreachable, global: unreachable },
      organisationId: "org-1",
    });
    expect(value).toBe(true);
  });

  it("treats a slow Central answer as no answer", async () => {
    const started = Date.now();
    const value = await readFlag(FLAG, false, { sources: { global: never }, timeoutMs: 20 });
    expect(value).toBe(false);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it("ignores an answer of the wrong type and a non-finite number", async () => {
    expect(await readFlag(FLAG, false, { sources: { global: answer("yes") } })).toBe(false);
    expect(await readFlag(FLAG, 1, { sources: { global: answer(Number.NaN) } })).toBe(1);
    expect(await readFlag(FLAG, false, { sources: { global: answer(null) } })).toBe(false);
  });
});

describe("central flags: resolution order (#208)", () => {
  it("prefers the organisation override, then rollout, then global", async () => {
    const sources = { organisation: answer(true), rollout: answer(false), global: answer(false) };
    expect(await readFlag(FLAG, false, { sources, organisationId: "org-1" })).toBe(true);

    const noOrg = { rollout: answer(true), global: answer(false) };
    expect(await readFlag(FLAG, false, { sources: noOrg, organisationId: "org-1" })).toBe(true);

    expect(await readFlag(FLAG, true, { sources: { global: answer(false) } })).toBe(false);
  });

  it("falls through to the next source when one fails", async () => {
    const value = await readFlag(FLAG, false, {
      sources: { organisation: unreachable, rollout: answer(true) },
      organisationId: "org-1",
    });
    expect(value).toBe(true);
  });

  it("does not consult the organisation source without an organisation", async () => {
    const organisation = answer(true);
    const value = await readFlag(FLAG, false, { sources: { organisation } });
    expect(value).toBe(false);
    expect(organisation).not.toHaveBeenCalled();
  });

  it("passes the organisation scope to the source", async () => {
    const organisation = answer(true);
    await readFlag(FLAG, false, { sources: { organisation }, organisationId: "org-9" });
    expect(organisation).toHaveBeenCalledWith(FLAG, { organisationId: "org-9" });
  });
});

describe("central flags: programmer errors fail at the call site (#208)", () => {
  it("rejects an invalid flag name", async () => {
    await expect(readFlag("Bad Name", false)).rejects.toThrow(TypeError);
  });

  it("rejects a non-finite default", async () => {
    await expect(readFlag(FLAG, Number.POSITIVE_INFINITY)).rejects.toThrow(TypeError);
  });
});

describe("central events: signed and fresh (#208)", () => {
  const body = (overrides: Record<string, unknown> = {}) =>
    JSON.stringify({ id: "evt-100", type: "enrolment.completed", payload: { learnerRef: "l-1" }, ...overrides });

  function signedHeaders(rawBody: string, options: { id?: string; timestamp?: number; secret?: string } = {}) {
    const id = options.id ?? "evt-100";
    const timestamp = String(options.timestamp ?? NOW);
    const signature = signCentralEvent(options.secret ?? SECRET, timestamp, id, rawBody);
    return {
      [CENTRAL_EVENT_HEADERS.id]: id,
      [CENTRAL_EVENT_HEADERS.timestamp]: timestamp,
      [CENTRAL_EVENT_HEADERS.signature]: signature,
    };
  }

  it("accepts a correctly signed, fresh event and returns it parsed", () => {
    const rawBody = body();
    const event = verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody), rawBody, nowSeconds: NOW });
    expect(event).toEqual({ id: "evt-100", type: "enrolment.completed", payload: { learnerRef: "l-1" } });
  });

  it("rejects a tampered body", () => {
    const rawBody = body();
    const tampered = body({ payload: { learnerRef: "l-2" } });
    expect(() => verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody), rawBody: tampered, nowSeconds: NOW }))
      .toThrow(CentralEventError);
    try {
      verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody), rawBody: tampered, nowSeconds: NOW });
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("signature_invalid");
    }
  });

  it("rejects an unsigned event", () => {
    const rawBody = body();
    const headers = { [CENTRAL_EVENT_HEADERS.id]: "evt-100", [CENTRAL_EVENT_HEADERS.timestamp]: String(NOW) };
    try {
      verifyCentralEvent({ secret: SECRET, headers, rawBody, nowSeconds: NOW });
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("headers_missing");
    }
  });

  it("rejects an event signed with another secret", () => {
    const rawBody = body();
    try {
      verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody, { secret: "another-secret-0123456789abcdefghij" }), rawBody, nowSeconds: NOW });
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("signature_invalid");
    }
  });

  it("rejects a stale event even when its signature is valid", () => {
    const rawBody = body();
    try {
      verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody, { timestamp: NOW - 301 }), rawBody, nowSeconds: NOW });
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("timestamp_stale");
    }
  });

  it("rejects a timestamp too far in the future", () => {
    const rawBody = body();
    try {
      verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody, { timestamp: NOW + 61 }), rawBody, nowSeconds: NOW });
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("timestamp_invalid");
    }
  });

  it("rejects a header id that does not match the body id", () => {
    const rawBody = body({ id: "evt-other" });
    try {
      verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody, { id: "evt-100" }), rawBody, nowSeconds: NOW });
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("event_id_mismatch");
    }
  });

  it("rejects a signed body that is not a valid event", () => {
    const rawBody = "{not json";
    try {
      verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody), rawBody, nowSeconds: NOW });
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("body_invalid");
    }
  });

  it("rejects an oversized body before verifying it", () => {
    const rawBody = body({ payload: { big: "x".repeat(70_000) } });
    try {
      verifyCentralEvent({ secret: SECRET, headers: signedHeaders(rawBody), rawBody, nowSeconds: NOW });
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as CentralEventError).reason).toBe("body_too_large");
    }
  });

  it("requires a secret of at least 32 characters, naming the variable but not its value", () => {
    expect(() => loadCentralEventsSecret({})).toThrow(/CENTRAL_EVENTS_HMAC_SECRET/);
    let message = "";
    try {
      loadCentralEventsSecret({ CENTRAL_EVENTS_HMAC_SECRET: "too-short-visible" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("CENTRAL_EVENTS_HMAC_SECRET");
    expect(message).not.toContain("too-short-visible");
    expect(loadCentralEventsSecret({ CENTRAL_EVENTS_HMAC_SECRET: SECRET })).toBe(SECRET);
  });
});

describe("central events: idempotent handlers (#208)", () => {
  const event: CentralEvent = { id: "evt-7", type: "x.y", payload: {} };

  it("runs the handler once per event id", async () => {
    const handle = vi.fn(async () => undefined);
    const run = createIdempotentEventHandler({ store: createMemoryEventClaimStore(), handle });
    expect(await run(event)).toBe("processed");
    expect(await run(event)).toBe("duplicate");
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it("releases the claim when the handler fails so a redelivery can succeed", async () => {
    const handle = vi
      .fn<(e: CentralEvent) => Promise<void>>()
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce(undefined);
    const run = createIdempotentEventHandler({ store: createMemoryEventClaimStore(), handle });
    await expect(run(event)).rejects.toThrow("database unavailable");
    expect(await run(event)).toBe("processed");
    expect(handle).toHaveBeenCalledTimes(2);
  });
});
