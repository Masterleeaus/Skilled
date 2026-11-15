import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

// next.config.js is CommonJS and reads NODE_ENV when it loads, so each case loads a fresh copy.
const require = createRequire(import.meta.url);
const configPath = fileURLToPath(new URL("../next.config.js", import.meta.url));

async function loadHeaders(nodeEnv: string) {
  vi.stubEnv("NODE_ENV", nodeEnv);
  delete require.cache[configPath];
  const config = require(configPath) as { headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]> };
  const rules = await config.headers();
  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");
  return new Map(rules[0].headers.map((h) => [h.key, h.value]));
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete require.cache[configPath];
});

describe("frontend security headers", () => {
  it("sends nosniff, frame protection and a referrer policy on every route", async () => {
    const headers = await loadHeaders("production");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("sends HSTS in production builds", async () => {
    const headers = await loadHeaders("production");
    expect(headers.get("Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
  });

  it("does not send HSTS in development, while keeping the other headers", async () => {
    const headers = await loadHeaders("development");
    expect(headers.has("Strict-Transport-Security")).toBe(false);
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });
});
