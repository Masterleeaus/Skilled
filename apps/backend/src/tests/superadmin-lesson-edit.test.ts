/**
 * Superadmin lesson source editing (ADMIN only). Lesson files are written to a temporary curriculum folder.
 */
import request from "supertest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "superadmin-lesson-test-secret",
    JWT_ACCESS_EXPIRES: "15m",
    NODE_ENV: "test",
    CLIENT_URL: "http://localhost:3000",
    REDIS_URL: "redis://127.0.0.1:6399",
    MINIO_ENDPOINT: "127.0.0.1",
    MINIO_PORT: 9099,
    MINIO_USE_SSL: false,
    MINIO_ACCESS_KEY: "test-access",
    MINIO_SECRET_KEY: "test-secret",
    MINIO_BUCKET: "test-bucket",
    CURRICULUM_DIR: "",
  },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../modules/audit/audit.service", () => ({ recordAuditLog: vi.fn(async () => ({})) }));

import { env } from "../config/env";
import { resetFakeDb, seed } from "./support/fake-prisma";
import { token } from "./support/academy-fixtures";
import { app } from "../app";
import { resetFileLessonIndexForTests } from "../modules/curriculum/file-lesson-loader";
import { sourceHashOf, updateLessonSource } from "../modules/curriculum/superadmin-lesson.service";
import { recordAuditLog } from "../modules/audit/audit.service";

const auth = (userId: string, role: string) => ({ Authorization: `Bearer ${token(userId, role)}` });
const LESSON = (id = "SA-1") => `/api/academy/curriculum/superadmin/lessons/${id}`;
const COURSE_LIST = (slug = "field-safety") => `/api/academy/curriculum/superadmin/courses/${slug}/lessons`;

let root: string;
let lessonFile: string;

function writeLesson(relative: string, record: unknown): string {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, typeof record === "string" ? record : JSON.stringify(record, null, 2) + "\n");
  return file;
}

function baseRecord(): Record<string, unknown> {
  return {
    id: "SA-1",
    title: "Superadmin lesson",
    courseSlugs: ["field-safety"],
    moduleTitle: "Module one",
    lessonType: "K",
    status: "DRAFT",
    reviewStatus: "NOT REVIEWED",
    introduction: "Original introduction.",
    procedure: [{ step: "Do the first thing." }],
    knowledgeChecks: [{ question: "Q?", options: ["a", "b"] }],
  };
}

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "superadmin-lesson-test-"));
  lessonFile = writeLesson("courses/field-safety/SA-1.json", baseRecord());
  writeLesson("courses/field-safety/SA-2.json", { id: "SA-2", title: "Other", courseSlugs: ["field-safety"], introduction: "Other text." });
  writeLesson("courses/other-course/SA-3.json", { id: "SA-3", title: "Elsewhere", courseSlugs: ["other-course"], introduction: "Elsewhere." });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = root;
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = "";
});

const USERS = [
  { id: "admin-1", email: "admin@example.test", fullName: "Admin Example", role: "ADMIN" },
  { id: "teacher-1", email: "teacher@example.test", fullName: "Teacher Example", role: "TEACHER" },
  { id: "u-TEACHER", email: "t2@example.test", fullName: "Teacher Two", role: "TEACHER" },
  { id: "u-STUDENT", email: "s@example.test", fullName: "Student Example", role: "STUDENT" },
];

beforeEach(async () => {
  resetFakeDb();
  await seed("user", USERS.map(u => ({ ...u, isActive: true, isEmailVerified: true })));
  resetFileLessonIndexForTests();
  vi.mocked(recordAuditLog).mockClear();
  writeFileSync(lessonFile, JSON.stringify(baseRecord(), null, 2) + "\n");
});

const currentHash = () => sourceHashOf(readFileSync(lessonFile, "utf8"));

describe("superadmin lesson editing", () => {
  it("refuses everyone who is not ADMIN, including teachers and learners", async () => {
    for (const role of ["TEACHER", "STUDENT"]) {
      const res = await request(app).get(LESSON()).set(auth("u-" + role, role));
      expect(res.status).toBe(403);
      expect(JSON.stringify(res.body)).not.toContain("Original introduction.");
    }
    const anonymous = await request(app).get(LESSON());
    expect(anonymous.status).toBe(401);
  });

  it("lists only the lessons of the requested course, with their status", async () => {
    const res = await request(app).get(COURSE_LIST()).set(auth("admin-1", "ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body.data.map((row: { id: string }) => row.id)).toEqual(["SA-1", "SA-2"]);
    expect(res.body.data[0]).toMatchObject({ id: "SA-1", status: "DRAFT", moduleTitle: "Module one", lessonType: "K" });
  });

  it("reads the file from disk with its hash, and sends no-store", async () => {
    const res = await request(app).get(LESSON()).set(auth("admin-1", "ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body.data.sourceHash).toBe(currentHash());
    expect(res.body.data.record.introduction).toBe("Original introduction.");
    expect(res.headers["cache-control"]).toContain("no-store");
  });

  it("saves edited text and status, keeps other keys and their order, and records the audit entry", async () => {
    const admin = auth("admin-1", "ADMIN");
    const before = await request(app).get(LESSON()).set(admin);
    const res = await request(app).patch(LESSON()).set(admin).send({
      expectedHash: before.body.data.sourceHash,
      changes: { introduction: "Revised introduction.", procedure: [{ step: "Revised step." }] },
      status: "READY",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.changedKeys.sort()).toEqual(["introduction", "procedure", "status"]);
    expect(res.body.data.status).toBe("READY");

    const saved = JSON.parse(readFileSync(lessonFile, "utf8"));
    expect(saved.introduction).toBe("Revised introduction.");
    expect(saved.procedure).toEqual([{ step: "Revised step." }]);
    expect(saved.status).toBe("READY");
    expect(saved.knowledgeChecks).toEqual([{ question: "Q?", options: ["a", "b"] }]);
    expect(Object.keys(saved)).toEqual(Object.keys(baseRecord()));

    expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: "admin-1",
      action: "LESSON_SOURCE_UPDATED",
      entityId: "SA-1",
    }));
    const audit = vi.mocked(recordAuditLog).mock.calls[0][0] as { newValue: { changedKeys: string[] } };
    expect(audit.newValue.changedKeys).toContain("introduction");
  });

  it("refuses a save when the file changed since it was loaded", async () => {
    const admin = auth("admin-1", "ADMIN");
    const stale = await request(app).get(LESSON()).set(admin);
    writeFileSync(lessonFile, JSON.stringify({ ...baseRecord(), introduction: "Someone else's edit." }, null, 2) + "\n");
    resetFileLessonIndexForTests();

    const res = await request(app).patch(LESSON()).set(admin).send({ expectedHash: stale.body.data.sourceHash, changes: { introduction: "Mine." } });
    expect(res.status).toBe(409);
    expect(readFileSync(lessonFile, "utf8")).toContain("Someone else's edit.");
  });

  it("refuses protected keys, including knowledge checks and the title", async () => {
    const admin = auth("admin-1", "ADMIN");
    const before = await request(app).get(LESSON()).set(admin);
    for (const key of ["knowledgeChecks", "title", "id", "courseSlugs", "lessonType", "reviewStatus"]) {
      const res = await request(app).patch(LESSON()).set(admin).send({ expectedHash: before.body.data.sourceHash, changes: { [key]: "x" } });
      expect(res.status).toBe(400);
    }
    expect(readFileSync(lessonFile, "utf8")).toBe(JSON.stringify(baseRecord(), null, 2) + "\n");
  });

  it("rejects an invalid status and an empty save", async () => {
    const admin = auth("admin-1", "ADMIN");
    const before = await request(app).get(LESSON()).set(admin);
    const badStatus = await request(app).patch(LESSON()).set(admin).send({ expectedHash: before.body.data.sourceHash, status: "PUBLISHED" });
    expect(badStatus.status).toBe(422);
    const empty = await request(app).patch(LESSON()).set(admin).send({ expectedHash: before.body.data.sourceHash, changes: {} });
    expect(empty.status).toBe(422);
  });

  it("validates status sent inside changes, so it cannot bypass the DRAFT and READY check", async () => {
    const admin = auth("admin-1", "ADMIN");
    for (const status of ["PUBLISHED", null, ""]) {
      const before = await request(app).get(LESSON()).set(admin);
      const res = await request(app).patch(LESSON()).set(admin).send({ expectedHash: before.body.data.sourceHash, changes: { status } });
      expect(res.status).toBe(422);
    }
    expect(readFileSync(lessonFile, "utf8")).toBe(JSON.stringify(baseRecord(), null, 2) + "\n");
  });

  it("refuses a __proto__ key in the service instead of reporting a change that was never written", async () => {
    const changes = JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, unknown>;
    await expect(updateLessonSource({ lessonId: "SA-1", actorId: "admin-1", expectedHash: currentHash(), changes }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(readFileSync(lessonFile, "utf8")).toBe(JSON.stringify(baseRecord(), null, 2) + "\n");
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it("refuses a save that changes nothing", async () => {
    const admin = auth("admin-1", "ADMIN");
    const before = await request(app).get(LESSON()).set(admin);
    const res = await request(app).patch(LESSON()).set(admin).send({ expectedHash: before.body.data.sourceHash, changes: { introduction: "Original introduction." } });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Nothing has changed");
  });

  it("returns 404 for a lesson that is not in the curriculum", async () => {
    const res = await request(app).get(LESSON("NOPE")).set(auth("admin-1", "ADMIN"));
    expect(res.status).toBe(404);
  });

  it("does not let a non-ADMIN save over the file", async () => {
    const res = await request(app).patch(LESSON()).set(auth("teacher-1", "TEACHER")).send({ expectedHash: currentHash(), changes: { introduction: "Teacher edit." } });
    expect(res.status).toBe(403);
    expect(readFileSync(lessonFile, "utf8")).toContain("Original introduction.");
  });
});
