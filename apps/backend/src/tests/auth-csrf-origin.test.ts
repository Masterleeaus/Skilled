import { describe, it, expect } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import authRoutes from "../modules/auth/auth.routes";
import { createOriginGuard, parseOriginAllowlist } from "../middleware/origin-guard";
import { refreshCookieOptions, refreshCookieClearOptions, setRefreshCookie, REFRESH_COOKIE } from "../modules/auth/auth-cookies";

const ALLOWED = "http://localhost:3000";

function authApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  return app;
}

describe("parseOriginAllowlist", () => {
  it("defaults to the CLIENT_URL origin when AUTH_ALLOWED_ORIGINS is empty", () => {
    expect(parseOriginAllowlist("", "https://app.example.test/some/path")).toEqual(["https://app.example.test"]);
  });

  it("parses a comma-separated list and normalises each entry to an origin", () => {
    expect(parseOriginAllowlist(" https://a.example.test , https://b.example.test/x ", ALLOWED)).toEqual([
      "https://a.example.test",
      "https://b.example.test",
    ]);
  });

  it("throws on an invalid entry so bad config fails at startup", () => {
    expect(() => parseOriginAllowlist("not a url", ALLOWED)).toThrow();
  });
});

describe("origin guard on /api/auth state-changing requests", () => {
  it("allows a POST whose Origin is in the allowlist", async () => {
    const res = await request(authApp()).post("/api/auth/logout").set("Origin", ALLOWED);
    expect(res.status).toBe(200);
  });

  it("rejects a POST from a foreign origin with 403", async () => {
    const res = await request(authApp()).post("/api/auth/logout").set("Origin", "https://evil.example.test");
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("rejects the opaque 'null' origin", async () => {
    const res = await request(authApp()).post("/api/auth/logout").set("Origin", "null");
    expect(res.status).toBe(403);
  });

  it("rejects a foreign origin on every state-changing method", async () => {
    const app = authApp();
    const evil = "https://evil.example.test";
    expect((await request(app).put("/api/auth/logout").set("Origin", evil)).status).toBe(403);
    expect((await request(app).patch("/api/auth/me").set("Origin", evil)).status).toBe(403);
    expect((await request(app).delete("/api/auth/logout").set("Origin", evil)).status).toBe(403);
  });

  it("allows a request with no Origin header (non-browser client)", async () => {
    const res = await request(authApp()).post("/api/auth/logout");
    expect(res.status).toBe(200);
  });

  it("does not block safe methods from a foreign origin", async () => {
    const res = await request(authApp()).get("/api/auth/me").set("Origin", "https://evil.example.test");
    expect(res.status).not.toBe(403);
  });
});

describe("refresh cookie attributes", () => {
  it("uses HttpOnly, SameSite=Lax, and Secure only in production", () => {
    expect(refreshCookieOptions(true)).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    expect(refreshCookieOptions(false)).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false });
  });

  it("clear options match the set options but carry no maxAge", () => {
    const clear = refreshCookieClearOptions(true);
    expect(clear).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    expect(clear).not.toHaveProperty("maxAge");
  });

  it("logout clears the cookie with SameSite=Lax on the Set-Cookie header", async () => {
    const res = await request(authApp()).post("/api/auth/logout").set("Origin", ALLOWED);
    const setCookie = String(res.headers["set-cookie"]);
    expect(setCookie).toContain(`${REFRESH_COOKIE}=;`);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/HttpOnly/i);
  });

  it("setRefreshCookie writes SameSite=Lax on the Set-Cookie header", async () => {
    const app = express();
    app.get("/set", (_req, res) => {
      setRefreshCookie(res, "tok", false);
      res.sendStatus(204);
    });
    const res = await request(app).get("/set");
    const setCookie = String(res.headers["set-cookie"]);
    expect(setCookie).toMatch(/^refreshToken=tok/);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).not.toMatch(/Secure/i);
  });
});

describe("createOriginGuard", () => {
  it("accepts an explicitly configured second origin", async () => {
    const app = express();
    app.use(createOriginGuard(["https://a.example.test", "https://b.example.test"]));
    app.post("/x", (_req, res) => res.sendStatus(204));
    expect((await request(app).post("/x").set("Origin", "https://b.example.test")).status).toBe(204);
    expect((await request(app).post("/x").set("Origin", "https://c.example.test")).status).toBe(403);
  });
});
