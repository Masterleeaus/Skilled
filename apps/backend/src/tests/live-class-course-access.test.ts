/**
 * GET /api/classes/course/:courseId (issue #301).
 * The list holds meeting links and recording URLs, so it needs authentication and course access. Anonymous callers,
 * unenrolled students and students on unpublished courses are refused, and the join data is not returned to them.
 * Runs the real router and authenticate middleware over an in-memory Prisma stub.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  users: [] as Array<Record<string, unknown>>,
  courses: [] as Array<Record<string, unknown>>,
  enrollments: [] as Array<Record<string, unknown>>,
  liveClasses: [] as Array<Record<string, unknown>>,
}));

function matches(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Compound unique key, for example studentId_courseId
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
    liveClass: { findMany: (args: { where?: Record<string, unknown> }) => find(db.liveClasses).findMany(args) },
  },
}));
vi.mock("../config/logger", () => ({
  logger: { error: () => undefined, warn: () => undefined, info: () => undefined },
  httpLogStream: { write: () => undefined },
}));

import { signAccessToken } from "../modules/auth/token.utils";
import classRoutes from "../modules/classes/class.routes";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/classes", classRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const COURSE = "course-live";
const SECRET_LINK = "https://meet.example.test/private-room";
const SECRET_RECORDING = "https://video.example.test/recording-42";

function seedUser(id: string, role: "STUDENT" | "TEACHER" | "ADMIN") {
  db.users.push({ id, role, isActive: true, isEmailVerified: true, deletedAt: null });
  return { Authorization: `Bearer ${signAccessToken({ userId: id, role })}` };
}

beforeEach(() => {
  db.users.length = 0;
  db.courses.length = 0;
  db.enrollments.length = 0;
  db.liveClasses.length = 0;

  db.courses.push({ id: COURSE, teacherId: "teacher-owner", isPublished: true, deletedAt: null });
  db.courses.push({ id: "course-draft", teacherId: "teacher-owner", isPublished: false, deletedAt: null });
  db.enrollments.push({ studentId: "student-enrolled", courseId: COURSE, status: "ACTIVE" });
  db.enrollments.push({ studentId: "student-enrolled-draft", courseId: "course-draft", status: "ACTIVE" });
  db.liveClasses.push({
    id: "class-1",
    courseId: COURSE,
    title: "Week 1",
    scheduledAt: new Date("2026-12-01T09:00:00Z"),
    durationMinutes: 60,
    status: "SCHEDULED",
    meetingLink: SECRET_LINK,
    recordingUrl: SECRET_RECORDING,
  });
});

describe("GET /api/classes/course/:courseId access (#301)", () => {
  it("refuses an anonymous caller and returns no meeting links or recordings", async () => {
    const res = await request(app).get(`/api/classes/course/${COURSE}`);

    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_LINK);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_RECORDING);
  });

  it("refuses a signed-in student who is not enrolled in the course", async () => {
    const headers = seedUser("student-outsider", "STUDENT");
    const res = await request(app).get(`/api/classes/course/${COURSE}`).set(headers);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_LINK);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_RECORDING);
  });

  it("refuses an enrolled student when the course is not published", async () => {
    const headers = seedUser("student-enrolled-draft", "STUDENT");
    db.liveClasses.push({ id: "class-draft", courseId: "course-draft", title: "Draft", scheduledAt: new Date(), durationMinutes: 30, status: "SCHEDULED", meetingLink: SECRET_LINK, recordingUrl: null });
    const res = await request(app).get("/api/classes/course/course-draft").set(headers);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_LINK);
  });

  it("does not disclose meeting links or recordings for cancelled sessions", async () => {
    const headers = seedUser("student-enrolled", "STUDENT");
    db.liveClasses[0].status = "CANCELLED";
    const res = await request(app).get(`/api/classes/course/${COURSE}`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe("CANCELLED");
    expect(res.body.data[0].title).toBe("Week 1");
    expect(res.body.data[0].meetingLink).toBeNull();
    expect(res.body.data[0].recordingUrl).toBeNull();
    expect(JSON.stringify(res.body)).not.toContain(SECRET_LINK);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_RECORDING);
  });

  it("returns an ended recording to an enrolled student without an obsolete join link", async () => {
    const headers = seedUser("student-enrolled", "STUDENT");
    db.liveClasses[0].status = "ENDED";
    const res = await request(app).get(`/api/classes/course/${COURSE}`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data[0].meetingLink).toBeNull();
    expect(res.body.data[0].recordingUrl).toBe(SECRET_RECORDING);
  });

  it("authorises the course owner and administrators, not unrelated teachers", async () => {
    const owner = seedUser("teacher-owner", "TEACHER");
    const other = seedUser("teacher-other", "TEACHER");
    const admin = seedUser("administrator", "ADMIN");
    expect((await request(app).get(`/api/classes/course/${COURSE}`).set(owner)).status).toBe(200);
    const forbidden = await request(app).get(`/api/classes/course/${COURSE}`).set(other);
    expect(forbidden.status).toBe(403);
    expect(forbidden.text).not.toContain(SECRET_LINK);
    expect((await request(app).get(`/api/classes/course/${COURSE}`).set(admin)).status).toBe(200);
  });

  it("refuses a revoked enrollment, including access to a recording", async () => {
    const headers = seedUser("student-enrolled", "STUDENT");
    db.enrollments.splice(0, 1);
    const res = await request(app).get(`/api/classes/course/${COURSE}`).set(headers);

    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(SECRET_RECORDING);
  });

  it("returns the join data to an enrolled student (control case)", async () => {
    const headers = seedUser("student-enrolled", "STUDENT");
    const res = await request(app).get(`/api/classes/course/${COURSE}`).set(headers);

    expect(res.status).toBe(200);
    expect(res.body.data[0].meetingLink).toBe(SECRET_LINK);
    expect(res.body.data[0].recordingUrl).toBe(SECRET_RECORDING);
  });
});
