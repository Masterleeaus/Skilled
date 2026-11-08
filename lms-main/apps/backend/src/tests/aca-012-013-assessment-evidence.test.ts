/**
 * ACA-012: evidence mapping per lesson and course.
 * ACA-013: verified competency awarded only from assessor-approved evidence.
 * Knowledge pass rule: "80% on knowledge checks" applied to the real knowledge-check route.
 * Drives the real curriculum router with supertest against an in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { errorHandler } from "../middleware/errorHandler";
import {
  assertCompetencyAwardable,
  buildEvidenceReport,
  courseEvidenceStatus,
  mapLessonEvidence,
  type AssessmentSpec,
} from "../modules/curriculum/assessment-evidence";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const ORG = ids.org1;
const SELF_ASSESSOR = "assessor-self";
const EVIDENCE_ID = "evidence-1";
const reviewUrl = (evidenceId: string, companyId = ORG) =>
  `/api/academy/curriculum/companies/${companyId}/practical-evidence/${evidenceId}/review`;
const pendingUrl = `/api/academy/curriculum/companies/${ORG}/practical-evidence/pending`;
const APPROVE = { decision: "APPROVED", feedback: "Observed against every practical criterion." };
const REJECT = { decision: "REJECTED", feedback: "Handover record incomplete; resubmit." };

const C01_L01: AssessmentSpec = {
  lessonId: "C01-L01",
  knowledgeAnswers: [{}, {}, {}],
  practicalCriteria: ["Learner states the location of the first aid kit for each site."],
  evidenceRequired: [
    "Sign-in record for the shift and sites visited",
    "Completed shift handover checklist signed by the supervisor",
    "Record of any defect, unlabelled product or incident found on the shift",
  ],
  passRule: "80% on knowledge checks; practical sign-off separate",
};
const NO_EVIDENCE: AssessmentSpec = {
  lessonId: "TST-GAP",
  knowledgeAnswers: [{}, {}, {}],
  practicalCriteria: ["Learner sets aside an unlabelled product."],
  evidenceRequired: [],
};
const KNOWLEDGE_ONLY: AssessmentSpec = { lessonId: "TST-KO", knowledgeAnswers: [{}], practicalCriteria: [], evidenceRequired: [] };

async function seedEvidence(overrides: Record<string, unknown> = {}) {
  await seed("academyPracticalEvidence", [{
    id: EVIDENCE_ID,
    companyId: ORG,
    learnerId: ids.learner1,
    lessonId: ids.lessonA,
    revisionId: ids.revisionA,
    description: "Observed the shift sequence from sign-in to verbal handover.",
    evidenceUrls: ["https://example.test/evidence/1"],
    status: "PENDING",
    ...overrides,
  }]);
}

async function review(evidenceId: string, body: Record<string, unknown>, userId = ids.assessor) {
  return request(app).post(reviewUrl(evidenceId)).set("Authorization", `Bearer ${token(userId, "TEACHER")}`).send(body);
}

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
  await seed("user", [{ id: SELF_ASSESSOR, email: "self@example.test", fullName: "Self Assessor", role: "TEACHER", isActive: true, isEmailVerified: true }]);
  await seed("companyMember", [{ companyId: ORG, userId: SELF_ASSESSOR, role: "ASSESSOR" }]);
});

describe("ACA-012 evidence mapping per lesson", () => {
  it("maps a lesson with evidence to one evidence type per listed record", () => {
    const mapping = mapLessonEvidence(C01_L01);
    expect(mapping.requiresPracticalEvidence).toBe(true);
    expect(mapping.gap).toBe(false);
    expect(mapping.evidenceTypes).toHaveLength(3);
    expect(mapping.evidenceTypes[0]).toEqual({ key: "sign-in-record-for-the-shift-and-sites-visited", label: "Sign-in record for the shift and sites visited" });
  });

  it("flags a lesson with practical criteria and no evidence as a gap", () => {
    const mapping = mapLessonEvidence(NO_EVIDENCE);
    expect(mapping).toMatchObject({ requiresPracticalEvidence: true, gap: true, evidenceTypes: [] });
  });

  it("does not require evidence for a knowledge-only lesson", () => {
    expect(mapLessonEvidence(KNOWLEDGE_ONLY)).toMatchObject({ requiresPracticalEvidence: false, gap: false, evidenceTypes: [] });
  });

  it("reports a course as incomplete when any required lesson has no evidence type, or no assessment file", () => {
    const specs = new Map<string, AssessmentSpec>([[C01_L01.lessonId, C01_L01], [NO_EVIDENCE.lessonId, NO_EVIDENCE]]);
    const status = courseEvidenceStatus("course-x", [C01_L01.lessonId, NO_EVIDENCE.lessonId, "MISSING-1"], specs);
    expect(status).toMatchObject({ requiredLessons: 3, lessonsRequiringEvidence: 2, gapLessonIds: ["TST-GAP"], missingAssessmentLessonIds: ["MISSING-1"], complete: false });
    expect(courseEvidenceStatus("course-y", [C01_L01.lessonId], specs).complete).toBe(true);
  });

  it("builds a coverage report across courses with counts", () => {
    const report = buildEvidenceReport([C01_L01, NO_EVIDENCE, KNOWLEDGE_ONLY], {
      "field-safety": [C01_L01.lessonId, KNOWLEDGE_ONLY.lessonId],
      "gap-course": [NO_EVIDENCE.lessonId],
    });
    expect(report).toMatchObject({
      assessmentFiles: 3,
      courses: 2,
      lessonsRequiringPracticalEvidence: 2,
      lessonsWithEvidenceTypes: 1,
      lessonsWithoutEvidenceType: ["TST-GAP"],
      knowledgeOnlyLessons: 1,
      coursesComplete: 1,
      courseLessonsWithoutKnowledgeChecks: [],
    });
    expect(report.coursesWithGaps).toEqual([{ courseSlug: "gap-course", gapLessonIds: ["TST-GAP"], missingAssessmentLessonIds: [] }]);
  });
});

describe("ACA-013 competency award from approved evidence", () => {
  it("refuses an award for evidence that is still pending, rejected, or approved by someone else", () => {
    const base = { id: EVIDENCE_ID, learnerId: ids.learner1 };
    expect(() => assertCompetencyAwardable({ ...base, status: "PENDING", assessorId: null }, ids.assessor)).toThrow(/approved/);
    expect(() => assertCompetencyAwardable({ ...base, status: "REJECTED", assessorId: ids.assessor }, ids.assessor)).toThrow(/approved/);
    expect(() => assertCompetencyAwardable({ ...base, status: "APPROVED", assessorId: ids.manager }, ids.assessor)).toThrow(/assessor who approved/);
    expect(() => assertCompetencyAwardable(null, ids.assessor)).toThrow(/not found/);
  });

  it("refuses an award where the assessor is the learner", () => {
    expect(() => assertCompetencyAwardable({ id: EVIDENCE_ID, learnerId: SELF_ASSESSOR, status: "APPROVED", assessorId: SELF_ASSESSOR }, SELF_ASSESSOR)).toThrow(/own evidence/);
  });

  it("allows an award for evidence approved by the acting assessor", () => {
    expect(() => assertCompetencyAwardable({ id: EVIDENCE_ID, learnerId: ids.learner1, status: "APPROVED", assessorId: ids.assessor }, ids.assessor)).not.toThrow();
  });

  it("creates no competency for pending evidence, and the award references the evidence record after approval", async () => {
    await seedEvidence();
    expect(rows("academyVerifiedCompetency")).toHaveLength(0);
    const res = await review(EVIDENCE_ID, APPROVE);
    expect(res.status).toBe(200);
    const awards = rows("academyVerifiedCompetency");
    expect(awards).toHaveLength(1);
    expect(awards[0]).toMatchObject({ evidenceId: EVIDENCE_ID, learnerId: ids.learner1, assessorId: ids.assessor, companyId: ORG, lessonId: ids.lessonA, revisionId: ids.revisionA });
  });

  it("creates no competency when the assessor rejects the evidence", async () => {
    await seedEvidence();
    const res = await review(EVIDENCE_ID, REJECT);
    expect(res.status).toBe(200);
    expect(rows("academyVerifiedCompetency")).toHaveLength(0);
    expect(rows("academyPracticalEvidence")[0]).toMatchObject({ status: "REJECTED", assessorFeedback: REJECT.feedback });
  });

  it("refuses to award competency from rejected evidence after a rejection", async () => {
    await seedEvidence();
    await review(EVIDENCE_ID, REJECT);
    const res = await review(EVIDENCE_ID, APPROVE);
    expect(res.status).toBe(403);
    expect(rows("academyVerifiedCompetency")).toHaveLength(0);
  });

  it("creates only one competency when the same evidence is approved twice", async () => {
    await seedEvidence();
    expect((await review(EVIDENCE_ID, APPROVE)).status).toBe(200);
    expect((await review(EVIDENCE_ID, APPROVE)).status).toBe(403);
    expect(rows("academyVerifiedCompetency")).toHaveLength(1);
  });

  it("refuses a learner approving their own evidence, even when they are not an assessor", async () => {
    await seedEvidence({ learnerId: ids.learner1 });
    const res = await review(EVIDENCE_ID, APPROVE, ids.learner1);
    expect(res.status).toBe(403);
    expect(rows("academyVerifiedCompetency")).toHaveLength(0);
    expect(rows("academyPracticalEvidence")[0].status).toBe("PENDING");
  });

  it("refuses an assessor approving their own evidence", async () => {
    await seedEvidence({ learnerId: SELF_ASSESSOR });
    const res = await review(EVIDENCE_ID, APPROVE, SELF_ASSESSOR);
    expect(res.status).toBe(403);
    expect(rows("academyVerifiedCompetency")).toHaveLength(0);
    expect(rows("academyPracticalEvidence")[0].status).toBe("PENDING");
  });

  it("lists pending evidence for assessors only, and never shows an assessor their own evidence", async () => {
    await seedEvidence();
    await seedEvidence({ id: "evidence-self", learnerId: SELF_ASSESSOR });
    const learnerView = await request(app).get(pendingUrl).set("Authorization", `Bearer ${token(ids.learner1)}`);
    expect(learnerView.status).toBe(403);
    const assessorView = await request(app).get(pendingUrl).set("Authorization", `Bearer ${token(ids.assessor, "TEACHER")}`);
    expect(assessorView.status).toBe(200);
    expect(assessorView.body.data.map((row: { id: string }) => row.id).sort()).toEqual([EVIDENCE_ID, "evidence-self"]);
    const selfView = await request(app).get(pendingUrl).set("Authorization", `Bearer ${token(SELF_ASSESSOR, "TEACHER")}`);
    expect(selfView.status).toBe(200);
    expect(selfView.body.data.map((row: { id: string }) => row.id)).toEqual([EVIDENCE_ID]);
  });
});

describe("Knowledge pass rule: 80% on knowledge checks", () => {
  /** Adds a published revision of lesson A with `count` knowledge checks, placed in a second course track. */
  async function seedCheckRevision(count: number) {
    const revisionId = `rev-a-${count}`;
    await seed("academyLessonRevision", [{
      id: revisionId, lessonId: ids.lessonA, version: 100 + count, status: "PUBLISHED", publishedAt: new Date(), contentHash: `h-${count}`,
      body: { introduction: "Check lesson", knowledgeChecks: Array.from({ length: count }, (_, i) => ({ id: `${revisionId}-K${i + 1}`, question: `Q${i + 1}`, options: ["A", "B", "C"] })) },
    }]);
    // Correct answer for check i is i % 3, held server-side only.
    await seed("academyKnowledgeAnswerKey", Array.from({ length: count }, (_, i) => ({ revisionId, checkId: `${revisionId}-K${i + 1}`, correctIndex: i % 3 })));
    await seed("academyCurriculumTrack", [{ id: `tr-${count}`, slug: `tr-${count}`, title: `Track ${count}`, scope: "UNIVERSAL", status: "PUBLISHED" }]);
    await seed("academyLessonPlacement", [{ trackId: `tr-${count}`, lessonId: ids.lessonA, revisionId, position: 1, required: true }]);
    await seed("academyCourseTrack", [{ courseId: ids.course, trackId: `tr-${count}`, position: 10 + count, required: true }]);
    return revisionId;
  }

  async function attempt(revisionId: string, answers: number[], userId = ids.learner1) {
    return request(app)
      .post("/api/academy/curriculum/knowledge-checks/attempts")
      .set("Authorization", `Bearer ${token(userId)}`)
      .send({ lessonId: ids.lessonA, revisionId, answers });
  }

  it("passes a three-check lesson only when all three answers are correct", async () => {
    const revisionId = await seedCheckRevision(3);
    const twoOfThree = await attempt(revisionId, [0, 1, 0]);
    expect(twoOfThree.status).toBe(200);
    expect(twoOfThree.body.data).toMatchObject({ score: 2, total: 3, passed: false });
    const threeOfThree = await attempt(revisionId, [0, 1, 2]);
    expect(threeOfThree.body.data).toMatchObject({ score: 3, total: 3, passed: true });
  });

  it("passes a five-check lesson at four correct and fails it at three", async () => {
    const revisionId = await seedCheckRevision(5);
    expect((await attempt(revisionId, [0, 1, 2, 0, 0])).body.data).toMatchObject({ score: 4, total: 5, passed: true });
    expect((await attempt(revisionId, [0, 1, 2, 2, 2])).body.data).toMatchObject({ score: 3, total: 5, passed: false });
  });

  it("records a knowledge pass without creating a practical competency", async () => {
    const revisionId = await seedCheckRevision(3);
    await attempt(revisionId, [0, 1, 2]);
    expect(rows("academyKnowledgeAttempt")[0]).toMatchObject({ passed: true, score: 3, total: 3 });
    expect(rows("academyVerifiedCompetency")).toHaveLength(0);
  });
});
