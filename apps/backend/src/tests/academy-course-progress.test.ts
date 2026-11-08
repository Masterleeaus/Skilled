/**
 * Learner course progress: GET /academy/curriculum/courses/:courseId/progress/me.
 * Uses the real curriculum router over the in-memory Prisma double.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const PROGRESS = (courseId = ids.course) => `/api/academy/curriculum/courses/${courseId}/progress/me`;
const auth = (userId: string) => ({ Authorization: `Bearer ${token(userId)}` });

async function acknowledge(learnerId: string, lessonId: string, revisionId: string) {
  const res = await request(app).post("/api/academy/curriculum/completions").set(auth(learnerId)).send({ lessonId, revisionId });
  expect(res.status).toBe(200);
}

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
});

describe("academy course progress for the signed-in learner", () => {
  it("returns zero progress with required and optional counts for an enrolled learner who has not started", async () => {
    const res = await request(app).get(PROGRESS()).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      courseId: ids.course,
      lessonCount: 2,
      completedCount: 0,
      completionPercent: 0,
      required: { total: 1, completed: 0 },
      optional: { total: 1, completed: 0 },
    });
    expect(res.body.data.lessons).toHaveLength(2);
    expect(res.body.data.lessons.every((lesson: { completed: boolean; completedAt: string | null }) => !lesson.completed && lesson.completedAt === null)).toBe(true);
  });

  it("gives the correct percentage for a partly completed course and reports the required lesson as done", async () => {
    await acknowledge(ids.learner1, ids.lessonA, ids.revisionA);
    const res = await request(app).get(PROGRESS()).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      lessonCount: 2,
      completedCount: 1,
      completionPercent: 50,
      required: { total: 1, completed: 1 },
      optional: { total: 1, completed: 0 },
    });
    const lessonA = res.body.data.lessons.find((lesson: { lessonId: string }) => lesson.lessonId === ids.lessonA);
    const lessonB = res.body.data.lessons.find((lesson: { lessonId: string }) => lesson.lessonId === ids.lessonB);
    expect(lessonA).toMatchObject({ required: true, completed: true, revisionId: ids.revisionA });
    expect(typeof lessonA.completedAt).toBe("string");
    expect(lessonB).toMatchObject({ required: false, completed: false, completedAt: null });
  });

  it("reaches 100 percent once every shared lesson is acknowledged", async () => {
    await acknowledge(ids.learner1, ids.lessonA, ids.revisionA);
    await acknowledge(ids.learner1, ids.lessonB, ids.revisionB);
    const res = await request(app).get(PROGRESS()).set(auth(ids.learner1));
    expect(res.body.data).toMatchObject({ completedCount: 2, completionPercent: 100, optional: { total: 1, completed: 1 } });
  });

  it("counts a lesson reached through two tracks once, keeping it required if either path requires it", async () => {
    await seed("academyCurriculumTrack", [{ id: "tr-2", slug: "tr-two", title: "Track Two", scope: "UNIVERSAL", status: "PUBLISHED" }]);
    await seed("academyLessonPlacement", [{ trackId: "tr-2", lessonId: ids.lessonA, revisionId: ids.revisionA, position: 1, required: true }]);
    await seed("academyCourseTrack", [{ courseId: ids.course, trackId: "tr-2", position: 2, required: false }]);
    await acknowledge(ids.learner1, ids.lessonA, ids.revisionA);
    const res = await request(app).get(PROGRESS()).set(auth(ids.learner1));
    expect(res.body.data).toMatchObject({ lessonCount: 2, completedCount: 1, completionPercent: 50, required: { total: 1, completed: 1 } });
  });

  it("refuses a learner with no enrolment in the course", async () => {
    const res = await request(app).get(PROGRESS()).set(auth(ids.outsider));
    expect(res.status).toBe(403);
    expect(res.body.data).toBeUndefined();
  });

  it("refuses a learner whose enrolment is cancelled", async () => {
    await prisma.enrollment.update({
      where: { studentId_courseId: { studentId: ids.learner2, courseId: ids.course } },
      data: { status: "CANCELLED" },
    });
    const res = await request(app).get(PROGRESS()).set(auth(ids.learner2));
    expect(res.status).toBe(403);
  });

  it("requires an authenticated caller", async () => {
    const res = await request(app).get(PROGRESS());
    expect(res.status).toBe(401);
  });

  it("returns only the requesting learner's acknowledgements", async () => {
    await acknowledge(ids.learner2, ids.lessonA, ids.revisionA);
    const res = await request(app).get(PROGRESS()).set(auth(ids.learner1));
    expect(res.body.data).toMatchObject({ completedCount: 0, completionPercent: 0 });
  });
});
