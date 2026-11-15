import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

// next.config.js is CommonJS and reads NODE_ENV and the API/MinIO variables when it loads, so each case loads a fresh copy.
const require = createRequire(import.meta.url);
const configPath = fileURLToPath(new URL("../next.config.js", import.meta.url));

// Reserved test domains only (RFC 2606 .test), so no real deployment host appears in the suite.
const API_URL = "https://api.skilled.test/api";
const MINIO_ENV = { MINIO_ENDPOINT: "media.skilled.test", MINIO_PORT: "9000", MINIO_USE_SSL: "true" };

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

const trackedEnv = ["NODE_ENV", "NEXT_PUBLIC_API_URL", "MINIO_ENDPOINT", "MINIO_PORT", "MINIO_USE_SSL"] as const;
const originalEnv = Object.fromEntries(trackedEnv.map((name) => [name, process.env[name]]));

// process.env.NODE_ENV is typed read-only by @types/node, so the writable view is used for every key.
const writableEnv = process.env as Record<string, string | undefined>;

function setEnv(values: Record<string, string>) {
  for (const name of trackedEnv) {
    if (name !== "NODE_ENV" && !(name in values)) delete writableEnv[name];
  }
  for (const [name, value] of Object.entries(values)) writableEnv[name] = value;
}

async function loadRules(nodeEnv: string, env: Record<string, string> = {}): Promise<HeaderRule[]> {
  setEnv({ NODE_ENV: nodeEnv, ...env });
  delete require.cache[configPath];
  const config = require(configPath) as { headers: () => Promise<HeaderRule[]> };
  return config.headers();
}

async function loadHeaders(nodeEnv: string, env: Record<string, string> = {}) {
  const rules = await loadRules(nodeEnv, env);
  expect(rules).toHaveLength(1);
  expect(rules[0].source).toBe("/:path*");
  return new Map(rules[0].headers.map((h) => [h.key, h.value]));
}

/** Parses a CSP header into directive name -> list of sources. */
function parseCsp(policy: string) {
  return new Map(
    policy
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...sources] = part.split(/\s+/);
        return [name, sources] as const;
      }),
  );
}

afterEach(() => {
  for (const name of trackedEnv) {
    if (originalEnv[name] === undefined) delete writableEnv[name];
    else writableEnv[name] = originalEnv[name];
  }
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

describe("frontend Content-Security-Policy", () => {
  it("is present on every route with a restrictive default and framing limits", async () => {
    const headers = await loadHeaders("production", { NEXT_PUBLIC_API_URL: API_URL, ...MINIO_ENV });
    const csp = parseCsp(headers.get("Content-Security-Policy") ?? "");
    expect(csp.get("default-src")).toEqual(["'self'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'self'"]);
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
  });

  it("allows the API origin for requests and the MinIO origin for media", async () => {
    const headers = await loadHeaders("production", { NEXT_PUBLIC_API_URL: API_URL, ...MINIO_ENV });
    const csp = parseCsp(headers.get("Content-Security-Policy") ?? "");
    expect(csp.get("connect-src")).toEqual(["'self'", "https://api.skilled.test"]);
    expect(csp.get("img-src")).toContain("https://media.skilled.test:9000");
    expect(csp.get("media-src")).toEqual(["'self'", "blob:", "https://media.skilled.test:9000"]);
  });

  it("uses http for MinIO when MINIO_USE_SSL is not true, as the backend does", async () => {
    const headers = await loadHeaders("production", {
      NEXT_PUBLIC_API_URL: "http://localhost:5000/api",
      MINIO_ENDPOINT: "localhost",
      MINIO_PORT: "9000",
      MINIO_USE_SSL: "false",
    });
    const csp = parseCsp(headers.get("Content-Security-Policy") ?? "");
    expect(csp.get("media-src")).toContain("http://localhost:9000");
    expect(csp.get("connect-src")).toContain("http://localhost:5000");
  });

  it("keeps the production script policy free of unsafe-eval", async () => {
    const headers = await loadHeaders("production", { NEXT_PUBLIC_API_URL: API_URL, ...MINIO_ENV });
    const csp = parseCsp(headers.get("Content-Security-Policy") ?? "");
    expect(csp.get("script-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(csp.get("connect-src")).not.toContain("ws:");
  });

  it("allows the dev runtime's eval and hot-reload websocket only outside production", async () => {
    const headers = await loadHeaders("development", { NEXT_PUBLIC_API_URL: "http://localhost:5000/api" });
    const csp = parseCsp(headers.get("Content-Security-Policy") ?? "");
    expect(csp.get("script-src")).toContain("'unsafe-eval'");
    expect(csp.get("connect-src")).toEqual(["'self'", "http://localhost:5000", "ws:", "wss:"]);
  });

  it("adds no API or MinIO origin when the env values are unset or relative", async () => {
    const headers = await loadHeaders("production");
    const csp = parseCsp(headers.get("Content-Security-Policy") ?? "");
    expect(csp.get("connect-src")).toEqual(["'self'"]);
    expect(csp.get("media-src")).toEqual(["'self'", "blob:"]);
  });

  it("fails the build on a malformed absolute API URL instead of sending a broken policy", async () => {
    await expect(loadRules("production", { NEXT_PUBLIC_API_URL: "https://" })).rejects.toThrow(
      "NEXT_PUBLIC_API_URL must be an absolute URL",
    );
  });
});
