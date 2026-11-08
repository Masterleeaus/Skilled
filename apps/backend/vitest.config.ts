import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // tests/**/*.test.{mjs,cjs} are node:test and assert scripts, not vitest suites. The package.json test
    // script runs them with `tsx --test` after vitest. Do not widen this include to them.
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    testTimeout: 15000,
    // Fills required non-database env names (CLIENT_URL, JWT_*, MINIO_*) when unset.
    setupFiles: ["src/tests/support/test-env.ts"],
  },
});
