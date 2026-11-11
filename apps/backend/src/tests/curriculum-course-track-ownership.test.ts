/**
 * POST /api/academy/curriculum/courses/:courseId/tracks over HTTP, through the real app. Covers ownership: a teacher
 * may attach a published track only to a course they teach, an admin may attach to any live course, and a teacher
 * may not attach to another teacher's course, a deleted course, or a draft track. Refused attempts must create no
 * course-track rows. Placement behaviour (position, required default and optional) is also checked. Runs over the
 * in-memory Prisma double.
 */
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "track-ownership-http-secret",
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

const OWNER = "track-own-teacher";
const OTHER_TEACHER = "track-other-teacher";
const ADMIN = "track-own-admin";

const OWN_COURSE = ids.course; // field-safety, taught by OWNER
const OTHER_COURSE = "track-other-course"; // taught by OTHER_TEACHER
const DELETED_COURSE = "track-deleted-course"; // taught by OWNER, soft-deleted
const PUBLISHED_TRACK = "tr-two";
const DRAFT_TRACK = "tr-draft";

const ATTACH = (courseId: string) => `/api/academy/curriculum/courses/${courseId}/tracks`;
const auth = (userId: string, role: string) => ({ Authorization: `Bearer ${token(userId, role)}` });
const courseTracksFor = (courseId: string) => rows("academyCourseTrack").filter((row) => row.courseId === courseId);

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
  await seed("user", [
    { id: OWNER, email: "track-owner@example.test", fullName: "Course Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: OTHER_TEACHER, email: "track-other@example.test", fullName: "Other Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: ADMIN, email: "track-admin@example.test", fullName: "Platform Admin", role: "ADMIN", isActive: true, isEmailVerified: true },
  ]);
  // The fixture course has no teacher. OWNER teaches it.
  await prisma.course.update({ where: { id: OWN_COURSE }, data: { teacherId: OWNER } });
  await seed("course", [
    { id: OTHER_COURSE, title: "Other Course", slug: "other-course", description: "x", isPublished: true, price: 0, teacherId: OTHER_TEACHER },
    { id: DELETED_COURSE, title: "Deleted Course", slug: "deleted-course", description: "x", isPublished: false, price: 0, teacherId: OWNER, deletedAt: new Date() },
  ]);
  await seed("academyCurriculumTrack", [
    { id: "trk-two", slug: PUBLISHED_TRACK, title: "Track Two", scope: "UNIVERSAL", status: "PUBLISHED" },
    { id: "trk-draft", slug: DRAFT_TRACK, title: "Draft Track", scope: "UNIVERSAL", status: "DRAFT" },
  ]);
});

describe("attaching a track to a course over HTTP", () => {
  it("lets the course's own teacher attach a published track, with the default required placement", async () => {
    const res = await request(app).post(ATTACH(OWN_COURSE)).set(auth(OWNER, "TEACHER")).send({ trackSlug: PUBLISHED_TRACK, position: 2 });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ courseId: OWN_COURSE, trackId: "trk-two", position: 2, required: true });
    expect(courseTracksFor(OWN_COURSE).map((row) => row.trackId).sort()).toEqual([ids.track, "trk-two"].sort());
  });

  it("keeps an optional placement when required is false", async () => {
    const res = await request(app).post(ATTACH(OWN_COURSE)).set(auth(OWNER, "TEACHER")).send({ trackSlug: PUBLISHED_TRACK, position: 3, required: false });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ position: 3, required: false });
  });

  it("lets a platform admin attach a published track to any live course", async () => {
    const res = await request(app).post(ATTACH(OTHER_COURSE)).set(auth(ADMIN, "ADMIN")).send({ trackSlug: PUBLISHED_TRACK, position: 1 });
    expect(res.status).toBe(201);
    expect(courseTracksFor(OTHER_COURSE)).toEqual([expect.objectContaining({ trackId: "trk-two", position: 1, required: true })]);
  });

  it("refuses a teacher who does not own the course, and writes no course-track row", async () => {
    const before = rows("academyCourseTrack").length;
    const res = await request(app).post(ATTACH(OTHER_COURSE)).set(auth(OWNER, "TEACHER")).send({ trackSlug: PUBLISHED_TRACK, position: 1 });
    expect(res.status).toBe(403);
    expect(courseTracksFor(OTHER_COURSE)).toEqual([]);
    expect(rows("academyCourseTrack").length).toBe(before);
  });

  it("refuses the other teacher on a course they do not teach, in the same way", async () => {
    const res = await request(app).post(ATTACH(OWN_COURSE)).set(auth(OTHER_TEACHER, "TEACHER")).send({ trackSlug: PUBLISHED_TRACK, position: 2 });
    expect(res.status).toBe(403);
    expect(courseTracksFor(OWN_COURSE).map((row) => row.trackId)).toEqual([ids.track]);
  });

  it("returns 404 for a soft-deleted course, even to its own teacher, and writes no row", async () => {
    const res = await request(app).post(ATTACH(DELETED_COURSE)).set(auth(OWNER, "TEACHER")).send({ trackSlug: PUBLISHED_TRACK, position: 1 });
    expect(res.status).toBe(404);
    expect(courseTracksFor(DELETED_COURSE)).toEqual([]);
  });

  it("returns 404 for a soft-deleted course to a platform admin as well", async () => {
    const res = await request(app).post(ATTACH(DELETED_COURSE)).set(auth(ADMIN, "ADMIN")).send({ trackSlug: PUBLISHED_TRACK, position: 1 });
    expect(res.status).toBe(404);
    expect(courseTracksFor(DELETED_COURSE)).toEqual([]);
  });

  it("returns 404 for a course that does not exist", async () => {
    const res = await request(app).post(ATTACH("no-such-course")).set(auth(ADMIN, "ADMIN")).send({ trackSlug: PUBLISHED_TRACK, position: 1 });
    expect(res.status).toBe(404);
  });

  it("refuses a draft track even to the course's own teacher, and writes no row", async () => {
    const before = rows("academyCourseTrack").length;
    const res = await request(app).post(ATTACH(OWN_COURSE)).set(auth(OWNER, "TEACHER")).send({ trackSlug: DRAFT_TRACK, position: 4 });
    expect(res.status).toBe(403);
    expect(rows("academyCourseTrack").length).toBe(before);
  });

  it("refuses a learner, who lacks course:create, and writes no row", async () => {
    const before = rows("academyCourseTrack").length;
    const res = await request(app).post(ATTACH(OWN_COURSE)).set(auth(ids.learner1, "STUDENT")).send({ trackSlug: PUBLISHED_TRACK, position: 2 });
    expect(res.status).toBe(403);
    expect(rows("academyCourseTrack").length).toBe(before);
  });

  it("refuses an unauthenticated caller, and writes no row", async () => {
    const before = rows("academyCourseTrack").length;
    const res = await request(app).post(ATTACH(OWN_COURSE)).send({ trackSlug: PUBLISHED_TRACK, position: 2 });
    expect(res.status).toBe(401);
    expect(rows("academyCourseTrack").length).toBe(before);
  });

  it("rejects an invalid body (422) before any ownership or write happens", async () => {
    const before = rows("academyCourseTrack").length;
    const res = await request(app).post(ATTACH(OTHER_COURSE)).set(auth(OWNER, "TEACHER")).send({ trackSlug: PUBLISHED_TRACK, position: 0 });
    expect(res.status).toBe(422);
    expect(rows("academyCourseTrack").length).toBe(before);
  });
});
