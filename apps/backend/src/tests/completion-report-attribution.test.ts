/**
 * Completion report attribution for practical evidence and verified competencies (issue #56).
 *
 * The organisation's assignment cut-off applies to every evidence type, not only to acknowledgements and
 * attempts. Practical evidence is attributed by its review once decided, else its submission. A competency is
 * attributed by its verification. Reassignment reuses the assignment row, so the cut-off stays the first
 * assignment and that choice is reported as countedFrom. Uses the real routers over the in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "completion-attribution-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import completionReportRoutes from "../modules/curriculum/completion-report.routes";
import { buildLearnerCompletionReport } from "../modules/curriculum/completion-report.service";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use("/api/academy/curriculum", completionReportRoutes);
app.use(errorHandler);

const CURRICULUM = "/api/academy/curriculum";
const auth = (userId: string, role?: string) => ({ Authorization: `Bearer ${token(userId, role)}` });

const ASSIGNED_AT = new Date("2026-03-01T00:00:00Z");
const BEFORE = new Date("2026-02-10T00:00:00Z");
const AFTER = new Date("2026-03-20T00:00:00Z");
const NOW = new Date("2026-05-15T00:00:00Z");
const EXPIRES = new Date("2026-06-01T00:00:00Z");
const AFTER_EXPIRY = new Date("2026-07-01T00:00:00Z");

const LEARNER = ids.learner1;
const REVISION_A2 = "rev-a2";

type Lesson = { lessonId: string; practicalEvidence: Array<{ id: string; attributedBy: string; attributedAt: Date }>; competencies: Array<{ id: string; evidenceSubmittedAt: Date | null; active: boolean }>; acknowledgement: unknown; knowledgeCheck: { attempts: number }; excludedBeforeAssignment: number };
const course1 = (report: { courses: Array<unknown> }) => report.courses[0] as { countedFrom: Date; summary: Record<string, number>; lessons: Lesson[]; completionState: string };
const lessonA = (report: { courses: Array<unknown> }) => course1(report).lessons.find((lesson) => lesson.lessonId === ids.lessonA) as Lesson;

async function submitted(id: string, status: string, createdAt: Date, reviewedAt: Date | null = null, learnerId = LEARNER) {
  await seed("academyPracticalEvidence", [{
    id,
    companyId: ids.org1,
    learnerId,
    lessonId: ids.lessonA,
    revisionId: ids.revisionA,
    description: "Practical evidence recorded for the attribution tests.",
    evidenceUrls: [],
    status,
    assessorId: status === "PENDING" ? null : ids.assessor,
    reviewedAt,
    createdAt,
  }]);
}

async function competency(id: string, evidenceId: string, verifiedAt: Date, expiresAt: Date | null = null, learnerId = LEARNER) {
  await seed("academyVerifiedCompetency", [{
    id,
    companyId: ids.org1,
    learnerId,
    lessonId: ids.lessonA,
    revisionId: ids.revisionA,
    evidenceId,
    assessorId: ids.assessor,
    verifiedAt,
    expiresAt,
  }]);
}

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
  // Organisation one's course assignment for the learner is dated explicitly.
  await prisma.academyTrainingAssignment.updateMany({
    where: { companyId: ids.org1, learnerId: LEARNER, courseId: ids.course },
    data: { createdAt: ASSIGNED_AT },
  });
});

describe("practical evidence is attributed by its own timestamp", () => {
  it("counts pending evidence submitted after the assignment and hides evidence submitted before it", async () => {
    await submitted("ev-pending-before", "PENDING", BEFORE);
    await submitted("ev-pending-after", "PENDING", AFTER);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(lessonA(report).practicalEvidence).toEqual([
      expect.objectContaining({ id: "ev-pending-after", attributedBy: "SUBMISSION", attributedAt: AFTER }),
    ]);
    expect(course1(report).summary).toMatchObject({ practicalPending: 1, excludedBeforeAssignment: 1 });
    expect(report.totals.practicalPending).toBe(1);
  });

  it("counts evidence submitted before the assignment once an assessor reviews it after the assignment, and shows both dates", async () => {
    const reviewed = new Date("2026-03-25T00:00:00Z");
    await submitted("ev-old-reviewed", "APPROVED", BEFORE, reviewed);
    await competency("cmp-old-reviewed", "ev-old-reviewed", reviewed);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(lessonA(report).practicalEvidence).toEqual([
      expect.objectContaining({ id: "ev-old-reviewed", attributedBy: "REVIEW", attributedAt: reviewed }),
    ]);
    // Provenance: the competency is attributed by verification, and shows when its evidence was submitted.
    expect(lessonA(report).competencies).toEqual([
      expect.objectContaining({ id: "cmp-old-reviewed", evidenceSubmittedAt: BEFORE, active: true }),
    ]);
    expect(course1(report).summary).toMatchObject({ activeCompetencies: 1, excludedBeforeAssignment: 0 });
  });

  it("hides evidence and its competency when both were decided before the assignment", async () => {
    const reviewed = new Date("2026-02-20T00:00:00Z");
    await submitted("ev-decided-before", "APPROVED", BEFORE, reviewed);
    await competency("cmp-decided-before", "ev-decided-before", reviewed);
    await submitted("ev-rejected-before", "REJECTED", BEFORE, reviewed);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(lessonA(report).practicalEvidence).toEqual([]);
    expect(lessonA(report).competencies).toEqual([]);
    expect(course1(report).summary).toMatchObject({ practicalPending: 0, activeCompetencies: 0, excludedBeforeAssignment: 3 });
    expect(report.totals.activeCompetencies).toBe(0);
  });

  it("counts an approved competency verified after the assignment", async () => {
    await submitted("ev-after", "APPROVED", AFTER, AFTER);
    await competency("cmp-after", "ev-after", AFTER);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(lessonA(report).competencies).toEqual([expect.objectContaining({ id: "cmp-after", active: true })]);
    expect(course1(report).summary.activeCompetencies).toBe(1);
  });

  it("applies the cut-off per organisation, so another organisation's assignment date never admits a record", async () => {
    // Organisation two assigned this learner long before the record, but organisation one's cut-off is its own.
    await seed("companyMember", [{ companyId: ids.org2, userId: LEARNER, role: "LEARNER" }]);
    await seed("academyTrainingAssignment", [
      { companyId: ids.org2, learnerId: LEARNER, assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED", createdAt: new Date("2025-01-01T00:00:00Z") },
    ]);
    await submitted("ev-between", "PENDING", BEFORE);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(lessonA(report).practicalEvidence).toEqual([]);
    expect(course1(report).summary.practicalPending).toBe(0);
  });
});

describe("assignment cut-off, reassignment and provenance", () => {
  it("reports the cut-off used for each course", async () => {
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(course1(report).countedFrom).toEqual(ASSIGNED_AT);
  });

  it("keeps the first assignment as the cut-off on reassignment, so records made since then count across it", async () => {
    await submitted("ev-before-first-assignment", "PENDING", BEFORE);
    await submitted("ev-after-first-assignment", "PENDING", new Date("2026-03-10T00:00:00Z"));

    // The organisation reassigns the same course through the real route. The assignment row is reused: status
    // and dueAt change, createdAt does not. The row is set to COMPLETED first so the reassignment is visible.
    await prisma.academyTrainingAssignment.updateMany({ where: { companyId: ids.org1, learnerId: LEARNER, courseId: ids.course }, data: { status: "COMPLETED" } });
    const res = await request(app)
      .post(`${CURRICULUM}/companies/${ids.org1}/assignments`)
      .set(auth(ids.manager))
      .send({ learnerId: LEARNER, courseId: ids.course, dueAt: "2026-12-31T00:00:00Z" });
    expect(res.status).toBe(200);
    const stored = rows("academyTrainingAssignment").find((row) => row.companyId === ids.org1 && row.learnerId === LEARNER && row.courseId === ids.course);
    expect(stored).toMatchObject({ status: "ASSIGNED", createdAt: ASSIGNED_AT });

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(course1(report).countedFrom).toEqual(ASSIGNED_AT);
    expect(lessonA(report).practicalEvidence.map((row) => row.id)).toEqual(["ev-after-first-assignment"]);
    expect(lessonA(report).excludedBeforeAssignment).toBe(1);
  });

  it("reports the assignment-time cut-off through the route", async () => {
    await submitted("ev-before", "PENDING", BEFORE);
    const res = await request(app).get(`${CURRICULUM}/companies/${ids.org1}/completion-reports/learners/${LEARNER}`).set(auth(LEARNER));
    expect(res.status).toBe(200);
    expect(res.body.data.courses[0]).toMatchObject({ countedFrom: ASSIGNED_AT.toISOString(), summary: { excludedBeforeAssignment: 1 } });
  });
});

describe("revision change", () => {
  it("does not count evidence, competencies or acknowledgements on a superseded revision", async () => {
    await submitted("ev-rev1-after", "APPROVED", AFTER, AFTER);
    await competency("cmp-rev1-after", "ev-rev1-after", AFTER);
    await seed("academyLearnerCompletion", [{ learnerId: LEARNER, lessonId: ids.lessonA, revisionId: ids.revisionA, completedAt: AFTER }]);
    await seed("academyKnowledgeAttempt", [{ learnerId: LEARNER, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true, createdAt: AFTER }]);

    // Lesson A is re-published as revision two and the course is pinned to it.
    await seed("academyLessonRevision", [{ id: REVISION_A2, lessonId: ids.lessonA, version: 2, body: { introduction: "Lesson A, revision two" }, contentHash: "rev-a2", status: "PUBLISHED", publishedAt: new Date() }]);
    await prisma.academyLessonPlacement.updateMany({ where: { trackId: ids.track, lessonId: ids.lessonA }, data: { revisionId: REVISION_A2 } });

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const lesson = lessonA(report);
    expect(lesson).toMatchObject({ revisionId: REVISION_A2, acknowledgement: null, practicalEvidence: [], competencies: [], excludedBeforeAssignment: 0 });
    expect(lesson.knowledgeCheck.attempts).toBe(0);
    expect(course1(report).summary).toMatchObject({ requiredAcknowledged: 0, activeCompetencies: 0 });
  });

  it("counts a record made on the new revision after the assignment", async () => {
    await seed("academyLessonRevision", [{ id: REVISION_A2, lessonId: ids.lessonA, version: 2, body: { introduction: "Lesson A, revision two" }, contentHash: "rev-a2", status: "PUBLISHED", publishedAt: new Date() }]);
    await prisma.academyLessonPlacement.updateMany({ where: { trackId: ids.track, lessonId: ids.lessonA }, data: { revisionId: REVISION_A2 } });
    await seed("academyLearnerCompletion", [{ learnerId: LEARNER, lessonId: ids.lessonA, revisionId: REVISION_A2, completedAt: AFTER }]);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(lessonA(report).acknowledgement).toEqual({ completedAt: AFTER });
  });
});

describe("expiry", () => {
  it("counts a competency while it is in date and stops counting it once it expires, without a new write", async () => {
    await submitted("ev-expiring", "APPROVED", AFTER, AFTER);
    await competency("cmp-expiring", "ev-expiring", AFTER, EXPIRES);

    const inDate = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(lessonA(inDate).competencies).toEqual([expect.objectContaining({ id: "cmp-expiring", active: true })]);
    expect(course1(inDate).summary.activeCompetencies).toBe(1);
    expect(inDate.totals.activeCompetencies).toBe(1);

    const expired = await buildLearnerCompletionReport(ids.org1, LEARNER, AFTER_EXPIRY);
    expect(lessonA(expired).competencies).toEqual([expect.objectContaining({ id: "cmp-expiring", active: false })]);
    expect(course1(expired).summary.activeCompetencies).toBe(0);
    expect(expired.totals.activeCompetencies).toBe(0);
  });

  it("treats a competency with no expiry as active", async () => {
    await submitted("ev-open", "APPROVED", AFTER, AFTER);
    await competency("cmp-open", "ev-open", AFTER, null);
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, AFTER_EXPIRY);
    expect(course1(report).summary.activeCompetencies).toBe(1);
  });
});
