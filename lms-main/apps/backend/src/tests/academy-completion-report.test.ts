/**
 * ACA-025 (evidence-backed completion reports) and the academy half of ACA-014
 * (required versus optional completion). Uses the real routers over an in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import completionReportRoutes from "../modules/curriculum/completion-report.routes";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use("/api/academy/curriculum", completionReportRoutes);
app.use(errorHandler);

const CURRICULUM = "/api/academy/curriculum";
const learnerReport = (learnerId: string, companyId = ids.org1) =>
  `${CURRICULUM}/companies/${companyId}/completion-reports/learners/${learnerId}`;
const orgReport = (companyId = ids.org1) => `${CURRICULUM}/companies/${companyId}/completion-reports`;
const auth = (userId: string, role?: string) => ({ Authorization: `Bearer ${token(userId, role)}` });

const FUTURE = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);

async function acknowledge(learnerId: string, lessonId: string, revisionId: string) {
  return request(app).post(`${CURRICULUM}/completions`).set(auth(learnerId)).send({ lessonId, revisionId });
}

async function submitKnowledgeCheck(learnerId: string, answers: number[], lessonId = ids.lessonA, revisionId = ids.revisionA) {
  return request(app).post(`${CURRICULUM}/knowledge-checks/attempts`).set(auth(learnerId)).send({ lessonId, revisionId, answers });
}

async function submitEvidence(learnerId: string) {
  return request(app)
    .post(`${CURRICULUM}/practical-evidence`)
    .set(auth(learnerId))
    .send({
      companyId: ids.org1,
      lessonId: ids.lessonA,
      revisionId: ids.revisionA,
      description: "Completed the prestart kit check on site with supervisor observation.",
      evidenceUrls: ["https://example.test/evidence/photo-1"],
    });
}

async function approveEvidence(evidenceId: string, expiresAt?: Date) {
  return request(app)
    .post(`${CURRICULUM}/companies/${ids.org1}/practical-evidence/${evidenceId}/review`)
    .set(auth(ids.assessor))
    .send({ decision: "APPROVED", feedback: "Observed on site and matches the approved procedure.", ...(expiresAt ? { expiresAt: expiresAt.toISOString() } : {}) });
}

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
});

describe("ACA-025 learner completion report", () => {
  it("reports acknowledged required lessons separately from optional ones and from competency", async () => {
    expect((await acknowledge(ids.learner1, ids.lessonA, ids.revisionA)).status).toBe(200);

    const res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    const [course] = res.body.data.courses;
    expect(course).toMatchObject({ courseId: ids.course, completionState: "REQUIRED_LESSONS_ACKNOWLEDGED" });
    expect(course.summary).toMatchObject({
      requiredLessons: 1,
      requiredAcknowledged: 1,
      requiredPercent: 100,
      optionalLessons: 1,
      optionalAcknowledged: 0,
      practicalPending: 0,
      activeCompetencies: 0,
    });
    const lessonB = course.lessons.find((lesson: { lessonId: string }) => lesson.lessonId === ids.lessonB);
    expect(lessonB).toMatchObject({ required: false, acknowledgement: null });
  });

  it("does not treat an acknowledgement as a verified practical competency", async () => {
    await acknowledge(ids.learner2, ids.lessonA, ids.revisionA);
    const res = await request(app).get(learnerReport(ids.learner2)).set(auth(ids.learner2));
    const lesson = res.body.data.courses[0].lessons.find((item: { lessonId: string }) => item.lessonId === ids.lessonA);
    expect(lesson.acknowledgement).not.toBeNull();
    expect(lesson.competencies).toEqual([]);
    expect(res.body.data.courses[0].summary.activeCompetencies).toBe(0);
  });

  it("lists knowledge-check attempts, the latest result and whether any attempt passed", async () => {
    await submitKnowledgeCheck(ids.learner1, [0, 0]);
    await submitKnowledgeCheck(ids.learner1, [1, 1]);
    const res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    const lesson = res.body.data.courses[0].lessons.find((item: { lessonId: string }) => item.lessonId === ids.lessonA);
    expect(lesson.knowledgeCheck).toMatchObject({ attempts: 2, passed: true, latest: { score: 2, total: 2, passed: true } });
  });

  it("reports failed-only knowledge checks as not passed", async () => {
    await submitKnowledgeCheck(ids.learner1, [0, 0]);
    const res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    const lesson = res.body.data.courses[0].lessons.find((item: { lessonId: string }) => item.lessonId === ids.lessonA);
    expect(lesson.knowledgeCheck).toMatchObject({ attempts: 1, passed: false, latest: { score: 0, total: 2, passed: false } });
  });

  it("shows practical evidence as pending until an assessor approves it, then as an active competency", async () => {
    const submitted = await submitEvidence(ids.learner1);
    expect(submitted.status).toBe(201);
    const evidenceId = submitted.body.data.id as string;

    let res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    expect(res.body.data.courses[0].summary.practicalPending).toBe(1);
    expect(res.body.data.courses[0].summary.activeCompetencies).toBe(0);

    expect((await approveEvidence(evidenceId, FUTURE)).status).toBe(200);
    res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    const lesson = res.body.data.courses[0].lessons.find((item: { lessonId: string }) => item.lessonId === ids.lessonA);
    expect(lesson.practicalEvidence).toEqual([expect.objectContaining({ id: evidenceId, status: "APPROVED" })]);
    expect(lesson.competencies).toEqual([expect.objectContaining({ active: true })]);
    expect(res.body.data.courses[0].summary).toMatchObject({ practicalPending: 0, activeCompetencies: 1 });
  });

  it("marks expired competencies inactive rather than counting them", async () => {
    await seed("academyPracticalEvidence", [
      { id: "ev-expired", companyId: ids.org1, learnerId: ids.learner2, lessonId: ids.lessonA, revisionId: ids.revisionA, description: "Historic practical evidence record.", evidenceUrls: [], status: "APPROVED", assessorId: ids.assessor },
    ]);
    await seed("academyVerifiedCompetency", [
      { companyId: ids.org1, learnerId: ids.learner2, lessonId: ids.lessonA, revisionId: ids.revisionA, evidenceId: "ev-expired", assessorId: ids.assessor, expiresAt: PAST },
    ]);
    const res = await request(app).get(learnerReport(ids.learner2)).set(auth(ids.learner2));
    const [competency] = res.body.data.courses[0].lessons.find((item: { lessonId: string }) => item.lessonId === ids.lessonA).competencies;
    expect(competency).toMatchObject({ active: false });
    expect(res.body.data.courses[0].summary.activeCompetencies).toBe(0);
  });

  it("excludes revisions that are no longer published from the report", async () => {
    await prisma.academyLessonRevision.update({ where: { id: ids.revisionB }, data: { status: "ARCHIVED" } });
    const res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    expect(res.body.data.courses[0].lessons.map((lesson: { lessonId: string }) => lesson.lessonId)).toEqual([ids.lessonA]);
  });

  it("reconciles report counts with the canonical completion and competency records", async () => {
    await acknowledge(ids.learner1, ids.lessonA, ids.revisionA);
    await acknowledge(ids.learner1, ids.lessonB, ids.revisionB);
    const evidenceId = (await submitEvidence(ids.learner1)).body.data.id as string;
    await approveEvidence(evidenceId, FUTURE);

    const res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    const summary = res.body.data.courses[0].summary;
    const canonicalCompletions = rows("academyLearnerCompletion").filter((row) => row.learnerId === ids.learner1).length;
    const canonicalCompetencies = rows("academyVerifiedCompetency").filter((row) => row.learnerId === ids.learner1 && (row.expiresAt === null || row.expiresAt > new Date())).length;

    expect(summary.requiredAcknowledged + summary.optionalAcknowledged).toBe(canonicalCompletions);
    expect(summary.activeCompetencies).toBe(canonicalCompetencies);
    expect(summary).toMatchObject({ requiredPercent: 100, optionalAcknowledged: 1 });
  });
});

describe("ACA-025 access control for completion reports", () => {
  it("lets managers, owners and assessors read a learner's report in the same organisation", async () => {
    expect((await request(app).get(learnerReport(ids.learner1)).set(auth(ids.manager))).status).toBe(200);
    expect((await request(app).get(learnerReport(ids.learner1)).set(auth(ids.assessor))).status).toBe(200);
  });

  it("denies a learner another learner's report", async () => {
    const res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner2));
    expect(res.status).toBe(403);
    expect(res.body.data).toBeUndefined();
  });

  it("denies non-members of the organisation, even when they are members elsewhere", async () => {
    const res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.outsider));
    expect(res.status).toBe(403);
  });

  it("returns not found for a learner who is not a member of the organisation", async () => {
    const res = await request(app).get(learnerReport(ids.outsider)).set(auth(ids.manager));
    expect(res.status).toBe(404);
  });

  it("rejects unauthenticated requests", async () => {
    expect((await request(app).get(learnerReport(ids.learner1))).status).toBe(401);
    expect((await request(app).get(orgReport())).status).toBe(401);
  });
});

describe("ACA-025 organisation completion report", () => {
  it("rolls up learner-level evidence for managers", async () => {
    await acknowledge(ids.learner1, ids.lessonA, ids.revisionA);
    await submitEvidence(ids.learner2);
    const evidenceOne = (await submitEvidence(ids.learner1)).body.data.id as string;
    await approveEvidence(evidenceOne, FUTURE);

    const res = await request(app).get(orgReport()).set(auth(ids.manager));
    expect(res.status).toBe(200);
    expect(res.body.data.totals).toEqual({
      learners: 2,
      assignedCourses: 2,
      coursesWithRequiredLessonsAcknowledged: 1,
      practicalPending: 1,
      activeCompetencies: 1,
    });
    const learner1 = res.body.data.learners.find((learner: { learnerId: string }) => learner.learnerId === ids.learner1);
    expect(learner1).toMatchObject({ fullName: "Learner One", courses: [expect.objectContaining({ completionState: "REQUIRED_LESSONS_ACKNOWLEDGED", requiredPercent: 100 })] });
  });

  it("denies assessors and learners the organisation roll-up", async () => {
    expect((await request(app).get(orgReport()).set(auth(ids.assessor))).status).toBe(403);
    expect((await request(app).get(orgReport()).set(auth(ids.learner1))).status).toBe(403);
  });

  it("denies managers of another organisation", async () => {
    const res = await request(app).get(orgReport(ids.org2)).set(auth(ids.manager));
    expect(res.status).toBe(403);
  });
});

describe("ACA-014 academy required and optional completion", () => {
  it("is REQUIRED_LESSONS_ACKNOWLEDGED only once every required lesson is acknowledged", async () => {
    await acknowledge(ids.learner1, ids.lessonB, ids.revisionB);
    let res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    expect(res.body.data.courses[0]).toMatchObject({ completionState: "IN_PROGRESS" });
    expect(res.body.data.courses[0].summary).toMatchObject({ requiredPercent: 0, optionalAcknowledged: 1 });

    await acknowledge(ids.learner1, ids.lessonA, ids.revisionA);
    res = await request(app).get(learnerReport(ids.learner1)).set(auth(ids.learner1));
    expect(res.body.data.courses[0]).toMatchObject({ completionState: "REQUIRED_LESSONS_ACKNOWLEDGED" });
  });

  it("refuses acknowledgements for lessons outside an active enrolment", async () => {
    const res = await acknowledge(ids.outsider, ids.lessonA, ids.revisionA);
    expect(res.status).toBe(403);
    expect(rows("academyLearnerCompletion")).toHaveLength(0);
  });
});
