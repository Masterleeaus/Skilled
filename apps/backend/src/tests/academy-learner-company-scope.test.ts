/**
 * Learner completion and knowledge-check rows are scoped to the learner's organisation. The organisation comes from
 * server-side membership and training assignments, never from the request. Uses the real routers over the in-memory double.
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

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const CURRICULUM = "/api/academy/curriculum";
const auth = (userId: string) => ({ Authorization: `Bearer ${token(userId)}` });
const COMPLETIONS_ME = `${CURRICULUM}/completions/me`;
const ATTEMPTS_ME = `${CURRICULUM}/knowledge-checks/attempts/me`;

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
});

describe("learner completions are scoped to the learner's organisation", () => {
  it("returns only rows for an organisation the learner belongs to", async () => {
    await seed("academyLearnerCompletion", [
      { learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA, companyId: ids.org1 },
      { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB, companyId: ids.org2 },
    ]);
    const res = await request(app).get(COMPLETIONS_ME).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ learnerId: ids.learner1, lessonId: ids.lessonA, companyId: ids.org1 });
  });

  it("never shows a learner in organisation A the rows of organisation B, in either direction", async () => {
    await seed("academyLearnerCompletion", [
      { learnerId: ids.outsider, lessonId: ids.lessonA, revisionId: ids.revisionA, companyId: ids.org1 },
      { learnerId: ids.outsider, lessonId: ids.lessonB, revisionId: ids.revisionB, companyId: ids.org2 },
      { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB, companyId: ids.org2 },
    ]);
    const outsider = await request(app).get(COMPLETIONS_ME).set(auth(ids.outsider));
    expect(outsider.body.data.map((r: { companyId: string }) => r.companyId)).toEqual([ids.org2]);
    const learner = await request(app).get(COMPLETIONS_ME).set(auth(ids.learner1));
    expect(learner.body.data).toEqual([]);
  });

  it("does not return a row with no organisation", async () => {
    await seed("academyLearnerCompletion", [
      { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB, companyId: null },
    ]);
    const res = await request(app).get(COMPLETIONS_ME).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it("takes the organisation from the session, not from the request", async () => {
    await seed("academyLearnerCompletion", [
      { learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA, companyId: ids.org1 },
      { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB, companyId: ids.org2 },
    ]);
    const res = await request(app).get(`${COMPLETIONS_ME}?companyId=${ids.org2}`).set(auth(ids.learner1));
    expect(res.body.data.map((r: { companyId: string }) => r.companyId)).toEqual([ids.org1]);
  });

  it("returns nothing to an account with no organisation membership", async () => {
    await seed("user", [{ id: "loner-1", email: "loner@example.test", fullName: "Loner", role: "STUDENT", isActive: true, isEmailVerified: true }]);
    await seed("academyLearnerCompletion", [
      { learnerId: "loner-1", lessonId: ids.lessonA, revisionId: ids.revisionA, companyId: ids.org1 },
    ]);
    const res = await request(app).get(COMPLETIONS_ME).set(auth("loner-1"));
    expect(res.body.data).toEqual([]);
  });

  it("stamps a new completion with the organisation of the learner's training assignment", async () => {
    const res = await request(app).post(`${CURRICULUM}/completions`).set(auth(ids.learner1)).send({ lessonId: ids.lessonA, revisionId: ids.revisionA });
    expect(res.status).toBe(200);
    expect(rows("academyLearnerCompletion")).toEqual([expect.objectContaining({ learnerId: ids.learner1, companyId: ids.org1 })]);
    const mine = await request(app).get(COMPLETIONS_ME).set(auth(ids.learner1));
    expect(mine.body.data).toHaveLength(1);
  });

  it("leaves a completion without an organisation when the learner belongs to several and only one is not assigned", async () => {
    await seed("user", [{ id: "multi-1", email: "multi@example.test", fullName: "Multi", role: "STUDENT", isActive: true, isEmailVerified: true }]);
    await seed("enrollment", [{ studentId: "multi-1", courseId: ids.course, status: "ACTIVE" }]);
    await seed("companyMember", [
      { companyId: ids.org1, userId: "multi-1", role: "LEARNER" },
      { companyId: ids.org2, userId: "multi-1", role: "LEARNER" },
    ]);
    await seed("academyTrainingAssignment", [
      { companyId: ids.org1, learnerId: "multi-1", assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED" },
      { companyId: ids.org2, learnerId: "multi-1", assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED" },
    ]);
    const res = await request(app).post(`${CURRICULUM}/completions`).set(auth("multi-1")).send({ lessonId: ids.lessonA, revisionId: ids.revisionA });
    expect(res.status).toBe(200);
    expect(rows("academyLearnerCompletion").find(r => r.learnerId === "multi-1")?.companyId ?? null).toBeNull();
    const mine = await request(app).get(COMPLETIONS_ME).set(auth("multi-1"));
    expect(mine.body.data).toEqual([]);
  });

  it("leaves a completion without an organisation when no training assignment names one", async () => {
    await seed("user", [{ id: "solo-1", email: "solo@example.test", fullName: "Solo", role: "STUDENT", isActive: true, isEmailVerified: true }]);
    await seed("enrollment", [{ studentId: "solo-1", courseId: ids.course, status: "ACTIVE" }]);
    const res = await request(app).post(`${CURRICULUM}/completions`).set(auth("solo-1")).send({ lessonId: ids.lessonA, revisionId: ids.revisionA });
    expect(res.status).toBe(200);
    expect(rows("academyLearnerCompletion").find(r => r.learnerId === "solo-1")?.companyId ?? null).toBeNull();
    const mine = await request(app).get(COMPLETIONS_ME).set(auth("solo-1"));
    expect(mine.body.data).toEqual([]);
  });
});

describe("knowledge-check attempts are scoped to the learner's organisation", () => {
  it("returns only attempts for an organisation the learner belongs to", async () => {
    await seed("academyKnowledgeAttempt", [
      { learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true, companyId: ids.org1 },
      { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB, answers: [1], score: 1, total: 1, passed: true, companyId: ids.org2 },
      { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB, answers: [1], score: 1, total: 1, passed: true, companyId: null },
    ]);
    const res = await request(app).get(ATTEMPTS_ME).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ lessonId: ids.lessonA, score: 2 });
    expect(res.body.data[0]).not.toHaveProperty("companyId");
  });

  it("never shows a learner in organisation B the attempts of organisation A", async () => {
    await seed("academyKnowledgeAttempt", [
      { learnerId: ids.outsider, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true, companyId: ids.org1 },
    ]);
    const res = await request(app).get(ATTEMPTS_ME).set(auth(ids.outsider));
    expect(res.body.data).toEqual([]);
  });

  it("stamps a new attempt with the organisation of the learner's training assignment", async () => {
    const res = await request(app).post(`${CURRICULUM}/knowledge-checks/attempts`).set(auth(ids.learner1)).send({ lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1] });
    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty("companyId");
    expect(rows("academyKnowledgeAttempt")).toEqual([expect.objectContaining({ learnerId: ids.learner1, companyId: ids.org1 })]);
    const mine = await request(app).get(ATTEMPTS_ME).set(auth(ids.learner1));
    expect(mine.body.data).toHaveLength(1);
  });
});
