// Guards the documented Central runtime configuration (issue #161): the example file and the doc must
// name the same keys the code reads, use placeholders only, and keep the LMS domain marked as an open owner decision.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const here = path.dirname(fileURLToPath(import.meta.url));
const lmsRoot = path.resolve(here, "../../../..");
const example = readFileSync(path.join(lmsRoot, "deploy/central/runtime.env.example"), "utf8");
const doc = readFileSync(path.join(lmsRoot, "docs/SKILLED-CENTRAL-RUNTIME-CONFIG.md"), "utf8");
const codeFiles = [
  "src/modules/auth/central-oidc-config.ts",
  "src/modules/auth/central-decision-transport.ts",
].map((f) => readFileSync(path.resolve(here, "../..", f), "utf8")).join("\n");

const entries = example
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith("#"))
  .map((line) => {
    const eq = line.indexOf("=");
    return { key: line.slice(0, eq), value: line.slice(eq + 1) };
  });

describe("Central runtime configuration documentation", () => {
  it("lists only keys that the code reads", () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const { key } of entries) {
      expect(codeFiles, `${key} is not read by the Central modules`).toContain(key);
    }
  });

  it("documents every example key in the doc", () => {
    for (const { key } of entries) expect(doc).toContain(key);
  });

  it("uses placeholders or empty values only, with no real host names or secrets", () => {
    for (const { key, value } of entries) {
      const ok = value === "" || value === "false" || value === "true" || /<[A-Z0-9_]+>/.test(value);
      expect(ok, `${key} must be a placeholder or empty`).toBe(true);
      expect(value, `${key} must not name a host`).not.toMatch(/https?:\/\/[a-z0-9]/i);
    }
  });

  it("keeps the public LMS domain as an open owner decision", () => {
    expect(doc).toContain("<LMS_PUBLIC_ORIGIN>");
    expect(doc).toMatch(/not decided|not confirmed/i);
    expect(doc).toMatch(/owner decision/i);
  });

  it("keeps the example off by default", () => {
    expect(entries.find((e) => e.key === "SKILLED_CENTRAL_OIDC_ENABLED")?.value).toBe("false");
  });
});
