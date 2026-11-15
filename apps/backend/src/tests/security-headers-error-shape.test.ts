/**
 * Production hardening on the Express app: baseline security headers on every response, a JSON error shape that never
 * exposes stack traces or operator-only messages in production, body size limits answered with 413, and a safe 404.
 */
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { app } from "../app";
import { AppError } from "../utils/AppError";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

const INTERNAL_DETAIL = "db-primary.internal:5432 connection refused";
const OPERATOR_HINT = "Stripe is not configured — set STRIPE_SECRET_KEY in .env";

// A small app that mounts the same body parser, 404 handler and error handler as app.ts, with routes that fail on demand.
function probeApp() {
  const probe = express();
  probe.use(express.json({ limit: "1mb" }));
  probe.get("/operator-hint", (_req, _res, next) => next(new AppError(OPERATOR_HINT, 503)));
  probe.get("/client-error", (_req, _res, next) => next(new AppError("Course not found", 404)));
  probe.get("/unexpected", (_req, _res, next) => next(new Error(INTERNAL_DETAIL)));
  probe.post("/echo", (req, res) => res.json({ ok: true, size: JSON.stringify(req.body).length }));
  probe.use(notFoundHandler);
  probe.use(errorHandler);
  return probe;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("security headers on the app", () => {
  // Routes chosen so no database or Redis call is made: an unknown route, and a body rejected by the parser.
  it.each([
    ["unknown route", () => request(app).get("/api/does-not-exist"), 404],
    ["rejected body", () => request(app).post("/api/auth/login").set("Content-Type", "application/json").send(JSON.stringify({ blob: "x".repeat(1024 * 1024 + 10) })), 413],
  ])("sets baseline hardening headers on an %s (%i)", async (_label, send, status) => {
    const res = await send();
    expect(res.status).toBe(status);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
    expect(res.headers["strict-transport-security"]).toMatch(/max-age=31536000/);
    expect(res.headers["content-security-policy"]).toMatch(/default-src 'self'/);
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("error responses", () => {
  it("returns a JSON error shape for unknown routes without echoing headers or stacks", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    expect(res.body).toEqual({ success: false, message: "Route /api/does-not-exist not found", errors: [] });
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\.ts|stack/i);
  });

  it("hides operator-only messages on 5xx AppErrors in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await request(probeApp()).get("/operator-hint");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: false, message: "Service temporarily unavailable. Try again later.", errors: [] });
    expect(JSON.stringify(res.body)).not.toContain("STRIPE_SECRET_KEY");
  });

  it("keeps 5xx AppError messages outside production so developers still see them", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const res = await request(probeApp()).get("/operator-hint");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ success: false, message: OPERATOR_HINT, errors: [] });
  });

  it("keeps 4xx AppError messages in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await request(probeApp()).get("/client-error");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: "Course not found", errors: [] });
  });

  it("returns a generic 500 with no stack or internal detail for unexpected errors in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const res = await request(probeApp()).get("/unexpected");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ success: false, message: "Internal server error", errors: [] });
    expect(JSON.stringify(res.body)).not.toContain(INTERNAL_DETAIL);
    expect(JSON.stringify(res.body)).not.toMatch(/\bat\b .*:\d+:\d+/);
  });

  it("answers an oversized JSON body with 413 and the standard error shape", async () => {
    const res = await request(probeApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ blob: "x".repeat(1024 * 1024 + 10) }));
    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({ success: false, errors: [] });
    expect(res.body.message).toMatch(/too large/i);
  });

  it("answers an oversized JSON body on the real app with 413, not 500", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ blob: "x".repeat(1024 * 1024 + 10) }));
    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({ success: false, errors: [] });
    expect(JSON.stringify(res.body)).not.toMatch(/stack|\bat\b .*:\d+:\d+/);
  });

  it("answers malformed JSON with 400 and the standard error shape", async () => {
    const res = await request(probeApp())
      .post("/echo")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, errors: [] });
  });
});
