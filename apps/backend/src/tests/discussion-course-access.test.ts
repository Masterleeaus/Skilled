/**
 * GET /api/discussions/course/:courseId and GET /api/discussions/threads/:threadId (issue #300).
 * Threads and replies need authentication and course access. Anonymous callers and unenrolled students are refused,
 * and an unpublished course returns 404 to everyone except its teacher and admins.
 * Runs the real router and authenticate middleware over an in-memory Prisma stub.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  users: [] as Array<Record<string, unknown>>,
  courses: [] as Array<Record<string, unknown>>,
  enrollments: [] as Array<Record<string, unknown>>,
  threads: [] as Array<Record<string, unknown>>,
}));

function matches(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.entries(value as Record<string, unknown>).every(([field, v]) => row[field] === v);
    }
    return (row[key] ?? null) === value;
  });
}

const find = (rows: Array<Record<string, unknown>>) => ({
  findUnique: async ({ where }: { where: Record<string, unknown> }) => rows.find((r) => matches(r, where)) ?? null,
  findMany: async ({ where = {} }: { where?: Record<string, unknown> } = {}) => rows.filter((r) => matches(r, where)),
});

vi.mock("../config/prisma", () => ({
  prisma: {
    user: { findUnique: (args: { where: Record<string, unknown> }) => find(db.users).findUnique(args) },
    course: { findUnique: (args: { where: Record<string, unknown> }) => find(db.courses).findUnique(args) },
    enrollment: { findUnique: (args: { where: Record<string, unknown> }) => find(db.enrollments).findUnique(args) },
    discussionThread: {
      findUnique: (args: { where: Record<string, unknown> }) => find(db.threads).findUnique(args),
      findMany: (args: { where?: Record<string, unknown> }) => find(db.threads).findMany(args),
    },
  },
}));
vi.mock("../config/logger", () => ({
  logger: { error: () => undefined, warn: () => undefined, info: () => undefined },
  httpLogStream: { write: () => undefined },
}));

import { signAccessToken } from "../modules/auth/token.utils";
import discussionRoutes from "../modules/discussions/discussion.routes";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/discussions", discussionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const COURSE = "course-open";
const DRAFT = "course-draft";
const THREAD = "thread-1";
const THREAD_DRAFT = "thread-draft";
const PRIVATE_BODY = "private question body";

function seedUser(id: string, role: "STUDENT" | "TEACHER" | "ADMIN") {
  db.users.push({ id, role, isActive: true, isEmailVerified: true, deletedAt: null });
  return { Authorization: `Bearer ${signAccessToken({ userId: id, role })}` };
}

beforeEach(() => {
  db.users.length = 0;
  db.courses.length = 0;
  db.enrollments.length = 0;
  db.threads.length = 0;

  db.courses.push({ id: COURSE, teacherId: "teacher-owner", isPublished: true, deletedAt: null });
  db.courses.push({ id: DRAFT, teacherId: "teacher-owner", isPublished: false, deletedAt: null });
  db.enrollments.push({ studentId: "student-enrolled", courseId: COURSE, status: "ACTIVE" });
  db.enrollments.push({ studentId: "student-enrolled-draft", courseId: DRAFT, status: "ACTIVE" });
  db.threads.push({ id: THREAD, courseId: COURSE, lessonId: null, studentId: "student-enrolled", title: "Q", body: PRIVATE_BODY, replies: [] });
  db.threads.push({ id: THREAD_DRAFT, courseId: DRAFT, lessonId: null, studentId: "student-enrolled-draft", title: "Draft Q", body: PRIVATE_BODY, replies: [] });
});

describe("discussion read routes require auth and course access (#300)", () => {
  it("refuses an anonymous caller on the course thread list", async () => {
    const res = await request(app).get(`/api/discussions/course/${COURSE}`);

    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain(PRIVATE_BODY);
  });

  it("refuses an anonymous caller on a single thread", async () => {
    const res = await request(app).get(`/api/discussions/threads/${THREAD}`);

    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain(PRIVATE_BODY);
  });

  it("refuses a signed-in student who is not enrolled, on both routes", async () => {
    const headers = seedUser("student-outsider", "STUDENT");

    const list = await request(app).get(`/api/discussions/course/${COURSE}`).set(headers);
    const thread = await request(app).get(`/api/discussions/threads/${THREAD}`).set(headers);

    expect(list.status).toBe(403);
    expect(thread.status).toBe(403);
    expect(JSON.stringify([list.body, thread.body])).not.toContain(PRIVATE_BODY);
  });

  it("returns 404 for an unpublished course to an enrolled student, on both routes", async () => {
    const headers = seedUser("student-enrolled-draft", "STUDENT");

    const list = await request(app).get(`/api/discussions/course/${DRAFT}`).set(headers);
    const thread = await request(app).get(`/api/discussions/threads/${THREAD_DRAFT}`).set(headers);

    expect(list.status).toBe(404);
    expect(thread.status).toBe(404);
    expect(JSON.stringify([list.body, thread.body])).not.toContain(PRIVATE_BODY);
  });

  it("returns the thread to an enrolled student (control case)", async () => {
    const headers = seedUser("student-enrolled", "STUDENT");

    const list = await request(app).get(`/api/discussions/course/${COURSE}`).set(headers);
    const thread = await request(app).get(`/api/discussions/threads/${THREAD}`).set(headers);

    expect(list.status).toBe(200);
    expect(thread.status).toBe(200);
    expect(thread.body.data.body).toBe(PRIVATE_BODY);
  });
});
