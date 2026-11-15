/**
 * Request and error logs never contain a query string. The Central SSO callback receives an authorization `code` and
 * `state` in its query, so those values must not reach any log line for any route.
 */
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { app } from "../app";
import { logger } from "../config/logger";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";
import { createHttpRequestLogger, redactUrlQuery } from "../middleware/httpRequestLog";

const CODE = "oidc-code-SECRET-0123456789";
const STATE = "oidc-state-SECRET-abcdefghij";
const REFERER = `https://idp.example.test/authorize?client_id=lms&state=${STATE}&code=${CODE}`;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("redactUrlQuery", () => {
  it("removes the whole query string and keeps the path", () => {
    expect(redactUrlQuery(`/api/callback?code=${CODE}&state=${STATE}`)).toBe("/api/callback?[redacted]");
  });

  it("leaves a URL without a query string unchanged", () => {
    expect(redactUrlQuery("/api/courses/abc")).toBe("/api/courses/abc");
  });

  it("redacts an absolute referrer as well", () => {
    expect(redactUrlQuery(REFERER)).toBe("https://idp.example.test/authorize?[redacted]");
  });
});

describe("request log line", () => {
  function captureApp() {
    const lines: string[] = [];
    const probe = express();
    probe.use(createHttpRequestLogger({ write: (line: string) => lines.push(line.trim()) }));
    probe.get("/api/titan/integration/callback", (_req, res) => res.status(200).send("ok"));
    probe.get("/api/courses/:id", (_req, res) => res.status(200).send("ok"));
    return { probe, lines };
  }

  it("logs the path without the query for a callback that carries code and state", async () => {
    const { probe, lines } = captureApp();

    await request(probe)
      .get(`/api/titan/integration/callback?code=${CODE}&state=${STATE}`)
      .set("Referer", REFERER)
      .set("User-Agent", "test-agent");

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('"GET /api/titan/integration/callback?[redacted] HTTP/1.1" 200');
    expect(lines[0]).toContain('"https://idp.example.test/authorize?[redacted]"');
    expect(lines[0]).not.toContain(CODE);
    expect(lines[0]).not.toContain(STATE);
  });

  it("redacts the query on an ordinary route too", async () => {
    const { probe, lines } = captureApp();

    await request(probe).get("/api/courses/abc?token=query-token-SECRET");

    expect(lines[0]).toContain('"GET /api/courses/abc?[redacted] HTTP/1.1" 200');
    expect(lines[0]).not.toContain("query-token-SECRET");
  });

  it("keeps the standard combined fields", async () => {
    const { probe, lines } = captureApp();

    await request(probe).get("/api/courses/abc").set("User-Agent", "test-agent");

    expect(lines[0]).toMatch(/^\S+ - - \[[^\]]+\] "GET \/api\/courses\/abc HTTP\/1\.1" 200 \S+ "-" "test-agent"$/);
  });
});

describe("real application logs", () => {
  it("never writes the code or state from a callback query to the request log", async () => {
    const info = vi.spyOn(logger, "info");

    await request(app).get(`/api/titan/integration/callback?code=${CODE}&state=${STATE}`);

    const logged = info.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain("/api/titan/integration/callback?[redacted]");
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(STATE);
  });
});

describe("error log", () => {
  it("logs the path without the query for an unexpected error", async () => {
    const error = vi.spyOn(logger, "error");
    const probe = express();
    probe.get("/fail", (_req, _res, next) => next(new Error("boom")));
    probe.use(notFoundHandler);
    probe.use(errorHandler);

    await request(probe).get(`/fail?code=${CODE}&state=${STATE}`);

    const logged = error.mock.calls.map((call) => String(call[0])).join("\n");
    expect(logged).toContain("GET /fail?[redacted] - boom");
    expect(logged).not.toContain(CODE);
    expect(logged).not.toContain(STATE);
  });
});
