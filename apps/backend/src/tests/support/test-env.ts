/**
 * Vitest setup: supplies synthetic values for required env names that a bare
 * test run does not have, so src/config/env.ts does not call process.exit(1)
 * at import time. Only unset names are filled. None of these values is a real secret.
 *
 * DATABASE_URL and REDIS_URL get placeholders that point at 127.0.0.1 port 1, where
 * nothing listens, so a bare run never reaches a real database or Redis. Suites that
 * need them detect the placeholders and skip (see hasConfiguredServices in
 * src/tests/integration/harness.ts). To run them, set DATABASE_URL to a disposable
 * local test database and REDIS_URL to a local Redis in the environment.
 */
export const PLACEHOLDER_DATABASE_URL = "postgresql://vitest-placeholder:vitest-placeholder@127.0.0.1:1/vitest_placeholder";
export const PLACEHOLDER_REDIS_URL = "redis://127.0.0.1:1";

const testDefaults: Record<string, string> = {
  CLIENT_URL: "http://localhost:3000",
  JWT_ACCESS_SECRET: "vitest-only-access-secret-not-real",
  JWT_REFRESH_SECRET: "vitest-only-refresh-secret-not-real",
  MINIO_ACCESS_KEY: "vitest-minio-access",
  MINIO_SECRET_KEY: "vitest-minio-secret",
  DATABASE_URL: PLACEHOLDER_DATABASE_URL,
  REDIS_URL: PLACEHOLDER_REDIS_URL,
};

for (const [name, value] of Object.entries(testDefaults)) {
  if (!process.env[name]) {
    process.env[name] = value;
  }
}
