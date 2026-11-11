/**
 * Issue #16: the answer-key loader applies the same approval gate as the curriculum publisher.
 * An assessment file loads no keys unless an approved record names its exact bytes (sha256) and a real reviewer.
 * Pure rules: no database. The loader script calls approvalProblem before it reads any key.
 */
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { approvalProblem, parseApprovalRecords } from "../modules/curriculum/assessment-approval";
import { planAnswerKeys, readAssessmentKeys } from "../modules/curriculum/knowledge-answer-keys";

const LESSON = "TST-GATE-01";
const assessment = {
  lessonId: LESSON,
  passRule: "2 of 2",
  knowledgeAnswers: [
    { id: "TST-GATE-01-K01", correctIndex: 1, rationale: "Fixture rationale." },
    { id: "TST-GATE-01-K02", correctIndex: 0, rationale: null },
  ],
};
const bytes = Buffer.from(JSON.stringify(assessment, null, 2), "utf8");
const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const GOOD_USER_ID = "cabcdefghijklmnopqrstuvw1";
const noUsers = async () => false;
const knownUsers = async (id: string) => id === GOOD_USER_ID;

function approvalFor(overrides: Record<string, unknown> = {}, content: Buffer = bytes) {
  return {
    [LESSON]: {
      status: "approved",
      sha256: sha(content),
      reviewer: "Dana Reviewer",
      reviewedAt: "2026-11-01T09:00:00Z",
      ...overrides,
    },
  };
}

describe("assessment approval gate (issue #16)", () => {
  it("passes an approved record whose sha256 matches the exact file bytes", async () => {
    expect(await approvalProblem(LESSON, bytes, approvalFor(), noUsers)).toBeNull();
  });

  it("refuses a file with no approval record", async () => {
    expect(await approvalProblem(LESSON, bytes, {}, noUsers)).toBe("no approval record");
  });

  it("refuses a record that is not approved", async () => {
    expect(await approvalProblem(LESSON, bytes, approvalFor({ status: "draft" }), noUsers)).toBe("approval status is not approved");
  });

  it("refuses stale approval: the file changed after it was approved", async () => {
    const edited = Buffer.from(JSON.stringify({ ...assessment, passRule: "1 of 2" }, null, 2), "utf8");
    const approvals = approvalFor({}, bytes);
    expect(await approvalProblem(LESSON, edited, approvals, noUsers)).toBe("approval does not match the file (sha256)");
  });

  it("refuses an approval whose sha256 is for different content, even when the record otherwise looks valid", async () => {
    expect(await approvalProblem(LESSON, bytes, approvalFor({ sha256: "0".repeat(64) }), noUsers)).toBe("approval does not match the file (sha256)");
  });

  it("refuses placeholder reviewers", async () => {
    for (const reviewer of ["TBD", "pending", "admin", "  "]) {
      expect(await approvalProblem(LESSON, bytes, approvalFor({ reviewer }), noUsers)).toBe("reviewer is missing or a placeholder");
    }
  });

  it("refuses a single-word reviewer that is neither a named person nor a known user ID", async () => {
    expect(await approvalProblem(LESSON, bytes, approvalFor({ reviewer: "Dana" }), noUsers)).toBe("reviewer is neither a named person nor a known user ID");
  });

  it("accepts a user ID reviewer only when that user exists", async () => {
    expect(await approvalProblem(LESSON, bytes, approvalFor({ reviewer: GOOD_USER_ID }), knownUsers)).toBeNull();
    expect(await approvalProblem(LESSON, bytes, approvalFor({ reviewer: "czzzzzzzzzzzzzzzzzzzzzzz9" }), knownUsers)).toBe(
      "reviewer is neither a named person nor a known user ID",
    );
  });

  it("refuses reviewedAt without a zone, unparseable, or in the future", async () => {
    const reason = "reviewedAt is not a parseable ISO date in the past";
    expect(await approvalProblem(LESSON, bytes, approvalFor({ reviewedAt: "2026-11-01T09:00:00" }), noUsers)).toBe(reason);
    expect(await approvalProblem(LESSON, bytes, approvalFor({ reviewedAt: "not a date" }), noUsers)).toBe(reason);
    expect(await approvalProblem(LESSON, bytes, approvalFor({ reviewedAt: "2999-01-01T00:00:00Z" }), noUsers)).toBe(reason);
  });

  it("does not let an approval for another lesson cover this file", async () => {
    const other = { "TST-GATE-02": approvalFor()[LESSON] };
    expect(await approvalProblem(LESSON, bytes, other, noUsers)).toBe("no approval record");
  });

  it("an approved file yields its keys; an unapproved file yields none", async () => {
    const body = { knowledgeChecks: [
      { id: "TST-GATE-01-K01", options: ["a", "b"] },
      { id: "TST-GATE-01-K02", options: ["c", "d"] },
    ] };
    const approved = await approvalProblem(LESSON, bytes, approvalFor(), noUsers);
    expect(approved).toBeNull();
    const plan = planAnswerKeys(body, readAssessmentKeys(assessment, LESSON));
    expect(plan.keys.map((k) => k.checkId)).toEqual(["TST-GATE-01-K01", "TST-GATE-01-K02"]);

    const heldProblem = await approvalProblem(LESSON, bytes, {}, noUsers);
    expect(heldProblem).not.toBeNull();
  });

  it("refuses an approval file that is not a JSON object keyed by lesson ID", () => {
    expect(() => parseApprovalRecords("[]")).toThrow(/JSON object keyed by lesson ID/);
    expect(() => parseApprovalRecords("null")).toThrow(/JSON object keyed by lesson ID/);
    expect(parseApprovalRecords("{}")).toEqual({});
  });
});
