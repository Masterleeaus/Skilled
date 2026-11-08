/**
 * PASS43 server-side knowledge-check answer keys.
 * - Keys never reach a learner: the outline, the attempt response and the stored revision body carry no key or rationale.
 * - Grading reads the server-side key per pinned revision and check ID. Correct answers pass, wrong answers fail.
 * - A check with no loaded key is refused (409) and records no attempt.
 * - The loader planner refuses checks it cannot key, and never keys a check by position.
 * Drives the real curriculum router against the in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { errorHandler } from "../middleware/errorHandler";
import {
  AnswerKey,
  knowledgeCheckList,
  planAnswerKeys,
  readAssessmentKeys,
} from "../modules/curriculum/knowledge-answer-keys";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const CURRICULUM = "/api/academy/curriculum";
const attemptUrl = `${CURRICULUM}/knowledge-checks/attempts`;
const learner = `Bearer ${token(ids.learner1)}`;
const LEAK_MARKERS = ["correctIndex", "rationale", "Fixture rationale"];

const attempt = (answers: number[], revisionId = ids.revisionA) =>
  request(app).post(attemptUrl).set("Authorization", learner).send({ lessonId: ids.lessonA, revisionId, answers });

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
});

describe("learner payloads never carry an answer key", () => {
  it("the outline carries no lesson text or check text, and no key field or rationale", async () => {
    const res = await request(app).get(`${CURRICULUM}/courses/${ids.course}/outline`).set("Authorization", learner);
    expect(res.status).toBe(200);
    const placements = res.body.data.tracks[0].track.placements as Array<{ lesson: { sourceId: string }; revision: Record<string, unknown> | null }>;
    const lesson = placements.find((p) => p.lesson.sourceId === "TST-A")!;
    expect(lesson.revision).not.toHaveProperty("body");
    expect(Object.keys((lesson as { lesson: object }).lesson).sort()).toEqual(["id", "sourceId", "title"]);
    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toContain("knowledgeChecks");
    for (const marker of LEAK_MARKERS) expect(serialised).not.toContain(marker);
  });

  it("an attempt response returns the score only, never the key", async () => {
    const res = await attempt([1, 0]);
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.data).sort()).toEqual(["createdAt", "id", "passed", "score", "total"]);
    const serialised = JSON.stringify(res.body);
    for (const marker of LEAK_MARKERS) expect(serialised).not.toContain(marker);
  });

  it("the stored revision body holds no answer key", () => {
    const revision = rows("academyLessonRevision").find((row) => row.id === ids.revisionA)!;
    expect(JSON.stringify(revision.body)).not.toContain("correctIndex");
  });
});

describe("grading reads the server-side key", () => {
  it("passes when every answer matches its key", async () => {
    const res = await attempt([1, 1]);
    expect(res.body.data).toMatchObject({ score: 2, total: 2, passed: true });
    expect(rows("academyKnowledgeAttempt")).toHaveLength(1);
  });

  it("fails a wrong answer, and fails one correct answer out of two (80% rule)", async () => {
    expect((await attempt([0, 0])).body.data).toMatchObject({ score: 0, total: 2, passed: false });
    expect((await attempt([1, 0])).body.data).toMatchObject({ score: 1, total: 2, passed: false });
    expect(rows("academyKnowledgeAttempt").map((row) => row.passed)).toEqual([false, false]);
  });

  it("refuses an attempt on a check with no loaded key, and records nothing", async () => {
    await prisma.academyKnowledgeAnswerKey.deleteMany({ where: { revisionId: ids.revisionA } });
    const res = await attempt([1, 1]);
    expect(res.status).toBe(409);
    expect(JSON.stringify(res.body)).not.toMatch(/correctIndex|rationale/);
    expect(rows("academyKnowledgeAttempt")).toHaveLength(0);
  });
});

describe("loader planning (pure)", () => {
  const body = (ids: string[], optionCount = 3) => ({
    knowledgeChecks: ids.map((id) => ({ id, question: "Q", options: Array.from({ length: optionCount }, (_, i) => `o${i}`) })),
  });
  const keysOf = (entries: AnswerKey[]) => new Map(entries.map((entry) => [entry.checkId, entry]));

  it("keys each check by its ID, never by position", () => {
    const assessment = {
      lessonId: "TST-X",
      knowledgeAnswers: [
        { id: "TST-X-K01", correctIndex: 0, rationale: "first" },
        { id: "TST-X-K02", correctIndex: 2, rationale: "second" },
      ],
    };
    const plan = planAnswerKeys(body(["TST-X-K02", "TST-X-K01"]), readAssessmentKeys(assessment, "TST-X"));
    expect(plan.refused).toEqual([]);
    expect(plan.keys).toEqual([
      { checkId: "TST-X-K02", correctIndex: 2, rationale: "second" },
      { checkId: "TST-X-K01", correctIndex: 0, rationale: "first" },
    ]);
  });

  it("refuses a check that has no key in the assessment file, without guessing", () => {
    const keys = keysOf([{ checkId: "TST-X-K01", correctIndex: 0, rationale: null }]);
    const plan = planAnswerKeys(body(["TST-X-K01", "TST-X-K02"]), keys);
    expect(plan.keys.map((key) => key.checkId)).toEqual(["TST-X-K01"]);
    expect(plan.refused).toEqual([{ checkId: "TST-X-K02", reason: "no answer key in the assessment file" }]);
  });

  it("refuses every check when the lesson has no assessment file", () => {
    const plan = planAnswerKeys(body(["TST-X-K01", "TST-X-K02"]), null);
    expect(plan.keys).toEqual([]);
    expect(plan.refused.map((refusal) => refusal.reason)).toEqual(["no assessment file for this lesson", "no assessment file for this lesson"]);
  });

  it("refuses a key whose index falls outside the check's options", () => {
    const keys = keysOf([{ checkId: "TST-X-K01", correctIndex: 3, rationale: null }]);
    const plan = planAnswerKeys(body(["TST-X-K01"], 3), keys);
    expect(plan.keys).toEqual([]);
    expect(plan.refused).toEqual([{ checkId: "TST-X-K01", reason: "answer key index is outside the check's options" }]);
  });

  it("refuses a check that has no id", () => {
    const plan = planAnswerKeys({ knowledgeChecks: [{ question: "Q", options: ["a", "b"] }] }, keysOf([]));
    expect(plan.refused).toEqual([{ checkId: null, reason: "check has no id" }]);
  });

  it("rejects an assessment file that names a different lesson, and malformed or duplicated entries", () => {
    expect(() => readAssessmentKeys({ lessonId: "OTHER", knowledgeAnswers: [] }, "TST-X")).toThrow(/does not match/);
    expect(() => readAssessmentKeys({ lessonId: "TST-X", knowledgeAnswers: [{ id: "TST-X-K01", correctIndex: "1" }] }, "TST-X")).toThrow(/valid correctIndex/);
    expect(() => readAssessmentKeys({ lessonId: "TST-X", knowledgeAnswers: [{ id: "TST-X-K01", correctIndex: 0 }, { id: "TST-X-K01", correctIndex: 1 }] }, "TST-X")).toThrow(/duplicated/);
  });

  it("selects checks from the same field the attempt route reads, including the legacy singular name", () => {
    expect(knowledgeCheckList({ knowledgeCheck: [{}] })).toHaveLength(1);
    expect(knowledgeCheckList({ knowledgeChecks: [{}, {}] })).toHaveLength(2);
    expect(knowledgeCheckList(null)).toEqual([]);
  });
});
