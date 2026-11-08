/**
 * PASS42 course lesson selection over HTTP, through the real app (so the /api/academy/course-selection mount in
 * app.ts is what is tested). Covers lesson-pool, lesson-selection GET and PUT for an owner, a teacher who does not own
 * the course, a learner, a platform admin, an organisation owner of another organisation, an unknown lesson ID, and
 * the outline and progress routes that follow the saved selection. Runs over the in-memory Prisma double.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "pass42-selection-http-secret",
    JWT_ACCESS_EXPIRES: "15m",
    NODE_ENV: "test",
    CLIENT_URL: "http://localhost:3000",
    // Synthetic local values so the app's storage and queue clients construct. Nothing is connected to in these tests.
    REDIS_URL: "redis://127.0.0.1:6399",
    MINIO_ENDPOINT: "127.0.0.1",
    MINIO_PORT: 9099,
    MINIO_USE_SSL: false,
    MINIO_ACCESS_KEY: "test-access",
    MINIO_SECRET_KEY: "test-secret",
    MINIO_BUCKET: "test-bucket",
  },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import { app } from "../app";
import { CourseLevelMap, setCourseLevelMapForTests } from "../modules/levels/level-rules";

const SELECTION = (courseId = ids.course) => `/api/academy/course-selection/courses/${courseId}/lesson-selection`;
const POOL = (courseId = ids.course) => `/api/academy/course-selection/courses/${courseId}/lesson-pool`;
const OUTLINE = (courseId = ids.course) => `/api/academy/curriculum/courses/${courseId}/outline`;
const PROGRESS = (courseId = ids.course) => `/api/academy/curriculum/courses/${courseId}/progress/me`;

const COURSE_OWNER = "sel-http-owner";
const OTHER_TEACHER = "sel-http-other-teacher";
const ADMIN = "sel-http-admin";
const ORG2_OWNER = "sel-http-org2-owner";
const ORG1_OWNER = "sel-http-org1-owner";

// The fixture course (slug field-safety) gets a level map: TST-A is base, TST-B is group.
const MAP: CourseLevelMap = { "field-safety": { "TST-A": "base", "TST-B": "group" } };

const auth = (userId: string, role: string) => ({ Authorization: `Bearer ${token(userId, role)}` });
const savedIds = () => rows("academyCourseLessonSelection").filter((row) => row.courseId === ids.course).map((row) => row.sourceId).sort();
const outlineSourceIds = (body: any): string[] => body.data.tracks.flatMap((t: any) => t.track.placements.map((p: any) => p.lesson.sourceId)).sort();

beforeEach(async () => {
  resetFakeDb();
  setCourseLevelMapForTests(MAP);
  await seedAcademyFixture();
  await seed("user", [
    { id: COURSE_OWNER, email: "sel-http-owner@example.test", fullName: "Course Owner", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: OTHER_TEACHER, email: "sel-http-other@example.test", fullName: "Other Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: ADMIN, email: "sel-http-admin@example.test", fullName: "Platform Admin", role: "ADMIN", isActive: true, isEmailVerified: true },
    { id: ORG1_OWNER, email: "sel-http-org1@example.test", fullName: "Org One Owner", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: ORG2_OWNER, email: "sel-http-org2@example.test", fullName: "Org Two Owner", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("companyMember", [
    { companyId: ids.org1, userId: ORG1_OWNER, role: "OWNER" },
    { companyId: ids.org2, userId: ORG2_OWNER, role: "OWNER" },
  ]);
  // The fixture course has no teacher. Make COURSE_OWNER its teacher for the owner paths.
  await prisma.course.update({ where: { id: ids.course }, data: { teacherId: COURSE_OWNER } });
});

describe("lesson pool over HTTP", () => {
  it("lets the course owner read the pool, with levels and titles", async () => {
    const res = await request(app).get(POOL()).set(auth(COURSE_OWNER, "TEACHER"));
    expect(res.status).toBe(200);
    expect(res.body.data.lessons).toEqual([
      expect.objectContaining({ sourceId: "TST-A", level: "base", title: "Lesson A" }),
      expect.objectContaining({ sourceId: "TST-B", level: "group", title: "Lesson B" }),
    ]);
  });

  it("lets a platform admin read the pool", async () => {
    const res = await request(app).get(POOL()).set(auth(ADMIN, "ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body.data.countsByLevel).toEqual({ base: 1, group: 1, specialised: 0 });
  });

  it("refuses a teacher who does not own the course", async () => {
    const res = await request(app).get(POOL()).set(auth(OTHER_TEACHER, "TEACHER"));
    expect(res.status).toBe(403);
  });

  it("refuses a learner, even one enrolled and assigned to the course", async () => {
    const res = await request(app).get(POOL()).set(auth(ids.learner1, "STUDENT"));
    expect(res.status).toBe(403);
  });

  it("refuses an organisation owner of another organisation, because the course is not assigned to it", async () => {
    const res = await request(app).get(POOL()).set(auth(ORG2_OWNER, "STUDENT"));
    expect(res.status).toBe(403);
  });

  it("refuses an unauthenticated caller", async () => {
    const res = await request(app).get(POOL());
    expect(res.status).toBe(401);
  });

  it("returns 404 for a course that does not exist", async () => {
    const res = await request(app).get(POOL("no-such-course")).set(auth(ADMIN, "ADMIN"));
    expect(res.status).toBe(404);
  });
});

describe("lesson selection GET over HTTP", () => {
  it("reports the full level for the owner when nothing is saved", async () => {
    const res = await request(app).get(SELECTION()).set(auth(COURSE_OWNER, "TEACHER"));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ usesFullLevel: true, sourceIds: [], countsByLevel: { base: 1, group: 1, specialised: 0 } });
  });

  it("lets the admin read the saved selection", async () => {
    await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-A"] });
    const res = await request(app).get(SELECTION()).set(auth(ADMIN, "ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ usesFullLevel: false, sourceIds: ["TST-A"], countsByLevel: { base: 1, group: 0, specialised: 0 } });
  });

  it("refuses a teacher who does not own the course, a learner, and another organisation's owner", async () => {
    const teacher = await request(app).get(SELECTION()).set(auth(OTHER_TEACHER, "TEACHER"));
    const learner = await request(app).get(SELECTION()).set(auth(ids.learner1, "STUDENT"));
    const otherOrg = await request(app).get(SELECTION()).set(auth(ORG2_OWNER, "STUDENT"));
    expect([teacher.status, learner.status, otherOrg.status]).toEqual([403, 403, 403]);
  });
});

describe("lesson selection PUT over HTTP", () => {
  it("lets the course owner save a selection, and records who saved it", async () => {
    const res = await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-B"] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ usesFullLevel: false, sourceIds: ["TST-B"], countsByLevel: { base: 0, group: 1, specialised: 0 } });
    expect(rows("academyCourseLessonSelection").every((row) => row.savedById === COURSE_OWNER)).toBe(true);
  });

  it("lets a platform admin save a selection", async () => {
    const res = await request(app).put(SELECTION()).set(auth(ADMIN, "ADMIN")).send({ sourceIds: ["TST-A"] });
    expect(res.status).toBe(200);
    expect(savedIds()).toEqual(["TST-A"]);
  });

  it("lets an owner of the organisation the course is assigned to save that organisation's selection", async () => {
    const res = await request(app).put(SELECTION()).set(auth(ORG1_OWNER, "STUDENT")).send({ companyId: ids.org1, sourceIds: ["TST-A"] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ companyId: ids.org1, source: "ORGANISATION", sourceIds: ["TST-A"] });
    expect(rows("academyCourseLessonSelection").filter((row) => row.companyId === ids.org1).map((row) => row.sourceId)).toEqual(["TST-A"]);
  });

  it("refuses an organisation owner who saves without naming their organisation, so the course-wide default is untouched", async () => {
    const res = await request(app).put(SELECTION()).set(auth(ORG1_OWNER, "STUDENT")).send({ sourceIds: ["TST-A"] });
    expect(res.status).toBe(403);
    expect(savedIds()).toEqual([]);
  });

  it("refuses a teacher who does not own the course, a learner, and another organisation's owner, and writes nothing", async () => {
    const teacher = await request(app).put(SELECTION()).set(auth(OTHER_TEACHER, "TEACHER")).send({ sourceIds: ["TST-A"] });
    const learner = await request(app).put(SELECTION()).set(auth(ids.learner1, "STUDENT")).send({ sourceIds: ["TST-A"] });
    const otherOrg = await request(app).put(SELECTION()).set(auth(ORG2_OWNER, "STUDENT")).send({ sourceIds: ["TST-A"] });
    expect([teacher.status, learner.status, otherOrg.status]).toEqual([403, 403, 403]);
    expect(savedIds()).toEqual([]);
  });

  it("refuses an unknown lesson ID with 422, and keeps the previous selection", async () => {
    await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-A"] });
    const res = await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-B", "TST-UNKNOWN"] });
    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual([expect.objectContaining({ code: "UNKNOWN_LESSON", sourceIds: ["TST-UNKNOWN"] })]);
    expect(savedIds()).toEqual(["TST-A"]);
  });

  it("refuses a lesson that exists in the database but is not in this course's pool", async () => {
    await seed("academyContentLesson", [
      { id: "lesson-other", sourceId: "TST-OTHER", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Other", objective: "o", assessment: "a", sourceVersion: "1", sourceHash: "h-o" },
    ]);
    const res = await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-OTHER"] });
    expect(res.status).toBe(422);
    expect(savedIds()).toEqual([]);
  });
});

describe("outline and progress follow the saved selection over HTTP", () => {
  const acknowledge = (learnerId: string, lessonId: string, revisionId: string) =>
    request(app).post("/api/academy/curriculum/completions").set(auth(learnerId, "STUDENT")).send({ lessonId, revisionId });

  it("lists every lesson in the outline and progress when no selection is saved", async () => {
    const outline = await request(app).get(OUTLINE()).set(auth(ids.learner1, "STUDENT"));
    const progress = await request(app).get(PROGRESS()).set(auth(ids.learner1, "STUDENT"));
    expect(outlineSourceIds(outline.body)).toEqual(["TST-A", "TST-B"]);
    expect(progress.body.data.lessonCount).toBe(2);
  });

  it("lists only the selected lessons once the owner saves a selection", async () => {
    await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-A"] });
    const outline = await request(app).get(OUTLINE()).set(auth(ids.learner1, "STUDENT"));
    const progress = await request(app).get(PROGRESS()).set(auth(ids.learner1, "STUDENT"));
    expect(outlineSourceIds(outline.body)).toEqual(["TST-A"]);
    expect(progress.body.data).toMatchObject({ lessonCount: 1, required: { total: 1, completed: 0 }, optional: { total: 0, completed: 0 } });
    expect(progress.body.data.lessons.map((lesson: { sourceId: string }) => lesson.sourceId)).toEqual(["TST-A"]);
  });

  it("counts completion only against the selected lessons", async () => {
    await request(app).put(SELECTION()).set(auth(ADMIN, "ADMIN")).send({ sourceIds: ["TST-A"] });
    const ack = await acknowledge(ids.learner1, ids.lessonA, ids.revisionA);
    expect(ack.status).toBe(200);
    const progress = await request(app).get(PROGRESS()).set(auth(ids.learner1, "STUDENT"));
    expect(progress.body.data).toMatchObject({ lessonCount: 1, completedCount: 1, completionPercent: 100 });
  });

  it("switches the outline to the other lesson when the selection changes", async () => {
    await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-B"] });
    const outline = await request(app).get(OUTLINE()).set(auth(ids.learner2, "STUDENT"));
    expect(outlineSourceIds(outline.body)).toEqual(["TST-B"]);
  });

  it("gives an organisation's learners that organisation's selection over the course-wide default", async () => {
    await request(app).put(SELECTION()).set(auth(COURSE_OWNER, "TEACHER")).send({ sourceIds: ["TST-B"] });
    await request(app).put(SELECTION()).set(auth(ORG1_OWNER, "STUDENT")).send({ companyId: ids.org1, sourceIds: ["TST-A"] });
    const outline = await request(app).get(OUTLINE()).set(auth(ids.learner1, "STUDENT"));
    expect(outlineSourceIds(outline.body)).toEqual(["TST-A"]);
    const defaults = rows("academyCourseLessonSelection").filter((row) => row.courseId === ids.course && row.companyId == null).map((row) => row.sourceId);
    expect(defaults).toEqual(["TST-B"]);
  });
});
