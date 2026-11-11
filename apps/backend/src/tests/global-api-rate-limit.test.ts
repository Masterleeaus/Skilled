/**
 * Global per-IP API limit, exercised through the real app. The ceiling is set low through the environment before the
 * app loads. Requests from supertest arrive from loopback, which app.ts trusts as a proxy, so each test's client IP
 * comes from X-Forwarded-For and the counters stay independent between tests.
 */
import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.API_RATE_LIMIT_MAX = "40";
  process.env.API_RATE_LIMIT_WINDOW_MS = String(15 * 60 * 1000);
});

import { app } from "../app";
import {
  DEFAULT_GLOBAL_RATE_LIMIT_MAX,
  createGlobalRateLimiter,
  isGlobalRateLimitExempt,
} from "../middleware/globalRateLimit";

const GLOBAL_LIMIT = 40;

describe("global API rate limit on the app", () => {
  it("answers 429 with a JSON message once a client passes the global ceiling", async () => {
    const ip = "198.51.100.10";
    for (let i = 0; i < GLOBAL_LIMIT; i += 1) {
      const res = await request(app).get("/api/unknown-route").set("X-Forwarded-For", ip);
      expect(res.status).toBe(404);
    }

    const blocked = await request(app).get("/api/unknown-route").set("X-Forwarded-For", ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, message: expect.stringMatching(/too many requests/i) });
    expect(blocked.headers["ratelimit-limit"]).toBe(String(GLOBAL_LIMIT));
  });

  it("keeps per-route limits in force below the global ceiling", async () => {
    const ip = "198.51.100.20";
    // Malformed bodies fail validation before any database call, so the per-route counter is the only thing measured.
    for (let i = 0; i < 10; i += 1) {
      const res = await request(app).post("/api/auth/login").set("X-Forwarded-For", ip).send({});
      expect(res.status).not.toBe(429);
    }

    const blocked = await request(app).post("/api/auth/login").set("X-Forwarded-For", ip).send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body).toMatchObject({ success: false, message: expect.stringMatching(/too many attempts/i) });
  });

  it("counts each client IP separately", async () => {
    const res = await request(app).get("/api/unknown-route").set("X-Forwarded-For", "198.51.100.30");
    expect(res.status).toBe(404);
  });
});

describe("global limiter middleware", () => {
  function buildApp(limit: number) {
    const testApp = express();
    testApp.use(createGlobalRateLimiter({ windowMs: 60 * 1000, limit }));
    testApp.get("/api/health", (_req, res) => { res.json({ ok: true }); });
    testApp.get("/api/other", (_req, res) => { res.json({ ok: true }); });
    return testApp;
  }

  it("throttles ordinary routes after the limit", async () => {
    const testApp = buildApp(3);
    for (let i = 0; i < 3; i += 1) {
      expect((await request(testApp).get("/api/other")).status).toBe(200);
    }
    expect((await request(testApp).get("/api/other")).status).toBe(429);
  });

  it("never throttles the health check, even after the limit is exhausted", async () => {
    const testApp = buildApp(2);
    for (let i = 0; i < 2; i += 1) {
      await request(testApp).get("/api/other");
    }
    expect((await request(testApp).get("/api/other")).status).toBe(429);

    for (let i = 0; i < 5; i += 1) {
      expect((await request(testApp).get("/api/health")).status).toBe(200);
    }
  });

  it("uses its documented defaults when no options are given", async () => {
    const testApp = express();
    testApp.use(createGlobalRateLimiter());
    testApp.get("/api/other", (_req, res) => { res.json({ ok: true }); });

    const res = await request(testApp).get("/api/other");
    expect(res.status).toBe(200);
    expect(res.headers["ratelimit-limit"]).toBe(String(DEFAULT_GLOBAL_RATE_LIMIT_MAX));
  });

  it("exempts only the health path", () => {
    expect(isGlobalRateLimitExempt({ path: "/api/health" })).toBe(true);
    expect(isGlobalRateLimitExempt({ path: "/api/health/" })).toBe(true);
    expect(isGlobalRateLimitExempt({ path: "/api/healthz" })).toBe(false);
    expect(isGlobalRateLimitExempt({ path: "/api/other" })).toBe(false);
  });
});
