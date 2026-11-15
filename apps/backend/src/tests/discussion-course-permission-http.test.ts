/**
 * Discussion access regressions: anonymous, unenrolled, unpublished,
 * cross-course teacher, revoked membership and thread-body privacy (#300).
 *
 * Uses the real Express router, real JWT middleware and service with only the
 * database calls mocked. No network, credentials or production learner data.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@prisma/client";

const db = vi.hoisted(() => ({
  user: vi.fn(), course: vi.fn(), enrollment: vi.fn(),
  thread: vi.fn(), threads: vi.fn(), createThread: vi.fn(),
  updateThread: vi.fn(), createReply: vi.fn(), reply: vi.fn(),
  updateReply: vi.fn(),
}));

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "discussion-permission-test-secret", JWT_ACCESS_EXPIRES: "15m", NODE_ENV: "test" },
}));
vi.mock("../config/prisma", () => ({
  prisma: {
    user: { findUnique: db.user },
    course: { findUnique: db.course },
    enrollment: { findUnique: db.enrollment },
    discussionThread: {
      findUnique: db.thread, findMany: db.threads,
      create: db.createThread, update: db.updateThread,
    },
    discussionReply: { findUnique: db.reply, create: db.createReply, update: db.updateReply },
  },
}));

import routes from "../modules/discussions/discussion.routes";
import { signAccessToken } from "../modules/auth/token.utils";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/discussions", routes);
app.use(errorHandler);

const users: Record<string, Role> = {
  "student-a": "STUDENT", "student-b": "STUDENT",
  "teacher-a": "TEACHER", "teacher-b": "TEACHER", admin: "ADMIN",
};
const courses: Record<string, { id: string; teacherId: string; isPublished: boolean; deletedAt: Date | null }> = {
  "course-a": { id: "course-a", teacherId: "teacher-a", isPublished: true, deletedAt: null },
  "course-b": { id: "course-b", teacherId: "teacher-b", isPublished: true, deletedAt: null },
  "course-draft": { id: "course-draft", teacherId: "teacher-a", isPublished: false, deletedAt: null },
  "course-deleted": { id: "course-deleted", teacherId: "teacher-a", isPublished: true, deletedAt: new Date() },
};
const records: Record<string, { id: string; courseId: string; studentId: string; title: string; body: string }> = {
  "thread-a": { id: "thread-a", courseId: "course-a", studentId: "student-a", title: "Field safety", body: "Student-only reply context" },
  "thread-draft": { id: "thread-draft", courseId: "course-draft", studentId: "teacher-a", title: "Draft", body: "Not published" },
  "thread-deleted": { id: "thread-deleted", courseId: "course-deleted", studentId: "teacher-a", title: "Deleted", body: "Removed course" },
};

let currentEnrollment: Set<string>;
function auth(id: string, claimedRole?: Role): Record<string, string> {
  return { Authorization: "Bearer " + signAccessToken({ userId: id, role: claimedRole ?? users[id] }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  currentEnrollment = new Set(["student-a:course-a", "student-b:course-b", "student-a:course-draft"]);
  db.user.mockImplementation(async ({ where }: { where: { id: string } }) => {
    const role = users[where.id];
    return role ? { id: where.id, role, isActive: true, isEmailVerified: true, deletedAt: null } : null;
  });
  db.course.mockImplementation(async ({ where }: { where: { id: string; deletedAt?: null } }) => {
    const course = courses[where.id];
    if (!course || (where.deletedAt === null && course.deletedAt !== null)) return null;
    return course;
  });
  db.enrollment.mockImplementation(async ({ where }: { where: { studentId_courseId: { studentId: string; courseId: string } } }) => {
    const { studentId, courseId } = where.studentId_courseId;
    return currentEnrollment.has(studentId + ":" + courseId)
      ? { studentId, courseId, status: "ACTIVE" } : null;
  });
  db.thread.mockImplementation(async ({ where, select }: { where: { id: string }; select?: { courseId: boolean } }) => {
    const record = records[where.id];
    if (!record) return null;
    return select?.courseId ? { courseId: record.courseId }
      : { ...record, student: { fullName: "Fixture", avatarUrl: null }, replies: [{ id: "reply-a", body: "Sensitive reply" }] };
  });
  db.threads.mockImplementation(async ({ where }: { where: { courseId: string } }) =>
    Object.values(records).filter(record => record.courseId === where.courseId));
  db.updateThread.mockImplementation(async ({ where }: { where: { id: string } }) =>
    ({ ...records[where.id], isResolved: true }));
  db.createThread.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "created-thread", ...data }));
  db.createReply.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: "new-reply", ...data }));
});

describe("discussion HTTP access", () => {
  it("rejects anonymous course and thread reads and replies", async () => {
    for (const path of ["/api/discussions/course/course-a", "/api/discussions/threads/thread-a"]) {
      expect((await request(app).get(path)).status).toBe(401);
    }
    expect((await request(app).post("/api/discussions/threads/thread-a/replies").send({ body: "hello" })).status).toBe(401);
    expect(db.thread).not.toHaveBeenCalled();
  });

  it("allows a current enrolled student to read the course and its thread", async () => {
    const list = await request(app).get("/api/discussions/course/course-a").set(auth("student-a"));
    expect(list.status).toBe(200);
    const thread = await request(app).get("/api/discussions/threads/thread-a").set(auth("student-a"));
    expect(thread.status).toBe(200);
    expect(thread.body.data.replies[0].body).toBe("Sensitive reply");
  });

  it("rejects unenrolled and cross-course students before loading any thread bodies", async () => {
    expect((await request(app).get("/api/discussions/course/course-a").set(auth("student-b"))).status).toBe(403);
    const thread = await request(app).get("/api/discussions/threads/thread-a").set(auth("student-b"));
    expect(thread.status).toBe(403);
    expect(thread.text).not.toContain("Sensitive reply");
    expect(db.thread.mock.calls.some(([arg]) => arg.select?.courseId !== true)).toBe(false);
  });

  it("does not let an enrolled student read or write in an unpublished course", async () => {
    expect((await request(app).get("/api/discussions/course/course-draft").set(auth("student-a"))).status).toBe(404);
    expect((await request(app).post("/api/discussions/threads/thread-draft/replies").set(auth("student-a")).send({ body: "Draft leak?" })).status).toBe(404);
    expect(db.createReply).not.toHaveBeenCalled();
  });

  it("rejects a teacher resolving threads belonging to another teacher", async () => {
    const response = await request(app).patch("/api/discussions/threads/thread-a/resolve").set(auth("teacher-b"));
    expect(response.status).toBe(403);
    expect(db.updateThread).not.toHaveBeenCalled();
  });

  it("permits the owning teacher to resolve a course thread", async () => {
    const response = await request(app).patch("/api/discussions/threads/thread-a/resolve").set(auth("teacher-a"));
    expect(response.status).toBe(200);
    expect(response.body.data.isResolved).toBe(true);
  });

  it("denies a former enrolled student resolving their own thread after access is revoked", async () => {
    currentEnrollment.delete("student-a:course-a");
    const response = await request(app).patch("/api/discussions/threads/thread-a/resolve").set(auth("student-a"));
    expect(response.status).toBe(403);
    expect(db.updateThread).not.toHaveBeenCalled();
  });

  it("denies all discussion writes on a deleted course including the original teacher", async () => {
    const response = await request(app).post("/api/discussions/threads/thread-deleted/replies")
      .set(auth("teacher-a")).send({ body: "Should not write" });
    expect(response.status).toBe(404);
    expect(db.createReply).not.toHaveBeenCalled();
  });

  it("takes the current database role, not a stale ADMIN role in a JWT", async () => {
    const response = await request(app).get("/api/discussions/threads/thread-a").set(auth("student-b", "ADMIN"));
    expect(response.status).toBe(403);
  });

  it("allows an admin to access a draft discussion while students cannot", async () => {
    const response = await request(app).get("/api/discussions/threads/thread-draft").set(auth("admin"));
    expect(response.status).toBe(200);
  });
});
