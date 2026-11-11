/**
 * ACA-012: guards the read-only assessment coverage audit (scripts/assessment-coverage.mjs).
 * Runs the script into a temporary directory. It does not write under curriculum/ or build/.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(__dirname, "../../../..");
const script = path.join(repoRoot, "scripts/assessment-coverage.mjs");

function runAudit() {
  const dir = mkdtempSync(path.join(tmpdir(), "assessment-coverage-"));
  try {
    const json = path.join(dir, "coverage.json");
    const markdown = path.join(dir, "coverage.md");
    execFileSync(process.execPath, [script, "--json", json, "--markdown", markdown], { cwd: repoRoot, stdio: "pipe" });
    return { raw: readFileSync(json, "utf8"), markdown: readFileSync(markdown, "utf8") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("assessment coverage audit", () => {
  const { raw, markdown } = runAudit();
  const result = JSON.parse(raw);

  it("accounts for every course placement exactly once", () => {
    const { summary, inputs, requirements, uncoveredRequirements } = result;
    expect(requirements).toHaveLength(inputs.coursePlacements);
    expect(summary.requirements).toBe(inputs.coursePlacements);
    expect(summary.requirementsCovered + summary.requirementsUncovered).toBe(summary.requirements);
    expect(uncoveredRequirements).toHaveLength(summary.requirementsUncovered);
    expect(requirements.filter((r: { uncoveredReason: string | null }) => r.uncoveredReason)).toHaveLength(summary.requirementsUncovered);
  });

  it("never marks an assessment reviewed or publishable unless a reviewer set reviewStatus", () => {
    // Every file in the repository currently has no reviewer sign-off, so both counts must be zero.
    expect(result.summary.publishableLessons).toBe(0);
    expect(result.summary.reviewedLessons).toBe(0);
    expect(result.summary.coursesPublishable).toBe(0);
  });

  it("writes no answer keys or rationales", () => {
    for (const forbidden of ["correctIndex", "rationale", "knowledgeAnswers"]) {
      expect(raw).not.toContain(forbidden);
      expect(markdown).not.toContain(forbidden);
    }
  });

  it("lists every uncovered requirement in the summary document", () => {
    for (const requirement of result.uncoveredRequirements as { courseSlug: string; lessonId: string }[]) {
      expect(markdown).toContain(`${requirement.lessonId}:`);
    }
  });
});
