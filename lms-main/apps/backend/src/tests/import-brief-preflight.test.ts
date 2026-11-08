import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const backend = resolve(import.meta.dirname, "../..");
function preflight(args: string[]) {
  return spawnSync("pnpm", ["exec", "tsx", "prisma/import-titan-curriculum.ts", ...args], {
    cwd: backend,
    env: { ...process.env, DATABASE_URL: "postgresql://invalid:invalid@127.0.0.1:1/no_database" },
    encoding: "utf8",
    timeout: 30_000,
  });
}

describe("legacy brief import validation boundary", () => {
  it("validates the tracked inventory without connecting to the database or publishing", () => {
    const result = preflight(["--validate-only"]);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    const report = JSON.parse(result.stdout.trim());
    expect(report).toMatchObject({
      mode: "validate-only",
      databaseConnected: false,
      writes: 0,
      contentStage: "briefs-only",
      publicationApproved: false,
    });
    expect(report.total).toBeGreaterThan(0);
    expect(Object.values(report.layers).reduce((sum: number, count) => sum + Number(count), 0)).toBe(report.total);
  });

  it("rejects invalid duplicate IDs without database writes", () => {
    const directory = mkdtempSync(join(tmpdir(), "skilled-brief-preflight-"));
    const path = join(directory, "invalid.json");
    const row = { id: "U01-01", layer: "Universal", unit: "Induction", title: "Example", objective: "Explain the topic", assessment: "Check" };
    try {
      writeFileSync(path, JSON.stringify({ version: "test", lessons: [row, row] }));
      const result = preflight(["--validate-only", "--source", path]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("Duplicate source ID");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects unknown flags instead of silently running a mutating import", () => {
    const result = preflight(["--unrecognized"]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Unknown argument");
  });
});
