/**
 * Production startup must fail closed when checkout is on (it always is in production) and Stripe is partly or fully
 * unconfigured. The schema is validated directly with synthetic values; none is a real secret.
 */
import { describe, expect, it } from "vitest";
import { envSchema } from "../config/env";

const productionBase = {
  NODE_ENV: "production",
  CLIENT_URL: "https://academy.example.test",
  DATABASE_URL: "postgresql://titan_academy:fixture-password@db.example.test:5432/titan_academy",
  REDIS_URL: "redis://redis.example.test:6379",
  JWT_ACCESS_SECRET: "fixture-access-secret-0123456789abcdef",
  JWT_REFRESH_SECRET: "fixture-refresh-secret-0123456789abcdef",
  MINIO_ACCESS_KEY: "fixture-minio-access",
  MINIO_SECRET_KEY: "fixture-minio-secret",
  SMTP_TLS_MODE: "starttls",
};

function issuePaths(input: Record<string, string>): string[] {
  const result = envSchema.safeParse({ ...productionBase, ...input });
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("production Stripe configuration", () => {
  it("rejects production startup when Stripe is fully unconfigured", () => {
    const paths = issuePaths({ STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "" });

    expect(paths).toContain("STRIPE_SECRET_KEY");
    expect(paths).toContain("STRIPE_WEBHOOK_SECRET");
  });

  it("rejects production startup when only the secret key is set", () => {
    const paths = issuePaths({ STRIPE_SECRET_KEY: "sk_test_fixture_key", STRIPE_WEBHOOK_SECRET: "" });

    expect(paths).toEqual(["STRIPE_WEBHOOK_SECRET"]);
  });

  it("rejects production startup when only the webhook secret is set", () => {
    const paths = issuePaths({ STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "whsec_fixture_secret" });

    expect(paths).toEqual(["STRIPE_SECRET_KEY"]);
  });

  it("rejects a whitespace-only key as unconfigured", () => {
    const paths = issuePaths({ STRIPE_SECRET_KEY: "   ", STRIPE_WEBHOOK_SECRET: "whsec_fixture_secret" });

    expect(paths).toEqual(["STRIPE_SECRET_KEY"]);
  });

  it("accepts production startup when both Stripe values are set", () => {
    expect(issuePaths({ STRIPE_SECRET_KEY: "sk_test_fixture_key", STRIPE_WEBHOOK_SECRET: "whsec_fixture_secret" })).toEqual([]);
  });

  it("does not require Stripe outside production", () => {
    const result = envSchema.safeParse({ ...productionBase, NODE_ENV: "development", STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "" });

    expect(result.success).toBe(true);
  });
});
