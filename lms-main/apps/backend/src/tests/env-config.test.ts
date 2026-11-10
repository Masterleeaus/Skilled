import path from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { envSchema, JWT_SECRET_MIN_LENGTH } from "../config/env";

const base: Record<string, string> = {
  CLIENT_URL: "http://localhost:3000",
  DATABASE_URL: "postgresql://lms:lms@localhost:5432/lms?schema=public",
  REDIS_URL: "redis://localhost:6379",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  MINIO_ACCESS_KEY: "minio-access",
  MINIO_SECRET_KEY: "minio-secret",
};

const parse = (overrides: Record<string, string> = {}) => envSchema.safeParse({ ...base, ...overrides });

const failingPaths = (result: ReturnType<typeof parse>) =>
  result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));

describe("JWT secret minimum applies in every environment", () => {
  it("sets the minimum to 32 characters", () => {
    expect(JWT_SECRET_MIN_LENGTH).toBe(32);
  });

  it("accepts 32-character independent secrets in development", () => {
    expect(parse({ NODE_ENV: "development" }).success).toBe(true);
  });

  it("rejects a 31-character access secret in development", () => {
    expect(failingPaths(parse({ JWT_ACCESS_SECRET: "a".repeat(31) }))).toContain("JWT_ACCESS_SECRET");
  });

  it("rejects a 31-character refresh secret in test", () => {
    expect(failingPaths(parse({ NODE_ENV: "test", JWT_REFRESH_SECRET: "b".repeat(31) }))).toContain("JWT_REFRESH_SECRET");
  });

  it("rejects identical access and refresh secrets in development", () => {
    expect(failingPaths(parse({ JWT_REFRESH_SECRET: "a".repeat(32) }))).toContain("JWT_REFRESH_SECRET");
  });
});

describe("Redis configuration keeps the password out of REDIS_URL", () => {
  it("accepts a credential-free REDIS_URL with a separate REDIS_PASSWORD", () => {
    const result = parse({ REDIS_URL: "redis://127.0.0.1:6379", REDIS_PASSWORD: "redis-secret-value" });
    expect(result.success).toBe(true);
    expect(result.success && result.data.REDIS_PASSWORD).toBe("redis-secret-value");
  });

  it("accepts a credential-free REDIS_URL with no password (local development)", () => {
    const result = parse({ REDIS_URL: "redis://localhost:6379" });
    expect(result.success).toBe(true);
    expect(result.success && result.data.REDIS_PASSWORD).toBe("");
  });

  it("rejects a password embedded in REDIS_URL", () => {
    expect(failingPaths(parse({ REDIS_URL: "redis://:embedded-secret@127.0.0.1:6379" }))).toContain("REDIS_URL");
  });

  it("rejects a username embedded in REDIS_URL", () => {
    expect(failingPaths(parse({ REDIS_URL: "redis://default@127.0.0.1:6379" }))).toContain("REDIS_URL");
  });

  it("rejects a non-Redis scheme", () => {
    expect(failingPaths(parse({ REDIS_URL: "http://127.0.0.1:6379" }))).toContain("REDIS_URL");
  });

  it("the production template holds no Redis credential in REDIS_URL", () => {
    const template = readFileSync(path.resolve(__dirname, "../../../../.env.production.example"), "utf8");
    const line = template.match(/^REDIS_URL="([^"]*)"$/m);
    expect(line, "REDIS_URL line in .env.production.example").not.toBeNull();
    expect(line![1]).not.toMatch(/:\/\/[^/]*@/);
    expect(parse({ REDIS_URL: line![1] }).success).toBe(true);
    expect(template).toMatch(/^REDIS_PASSWORD="/m);
  });
});
