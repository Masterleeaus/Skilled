/**
 * Admin-only lesson preview (GET /api/academy/curriculum/preview/lessons/:lessonId).
 * Admins read a lesson's latest revision, draft or unapproved, marked preview: true. Everyone else is refused.
 * The learner body route keeps refusing a draft. Runs over the in-memory Prisma double.
 */
import request from "supertest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "lesson-preview-test-secret",
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

import { env } from "../config/env";
import { fakePrisma, resetFakeDb, seed } from "./support/fake-prisma";
import { KNOWLEDGE_CHECK, ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import { app } from "../app";
import { contentHashOf } from "../modules/curriculum/lesson-review.service";
import { resetFileLessonIndexForTests } from "../modules/curriculum/file-lesson-loader";

const PREVIEW = (sourceId: string) => `/api/academy/curriculum/preview/lessons/${sourceId}`;
const BODY = (sourceId: string) => `/api/academy/curriculum/courses/${ids.course}/lessons/${sourceId}/body`;
const auth = (userId: string, role: string) => ({ Authorization: `Bearer ${token(userId, role)}` });

const ADMIN = "admin-preview-1";
const DRAFT_TEXT = "Unapproved draft text for TST-D.";
// The draft carries an answer key. The preview is the learner view, so the key must not appear.
const DRAFT_BODY = {
  introduction: DRAFT_TEXT,
  knowledgeChecks: KNOWLEDGE_CHECK.map(q => ({ ...q, correctIndex: 1, rationale: "draft secret rationale" })),
};

let root: string;

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "lesson-preview-test-"));
  const write = (relative: string, record: unknown) => {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify(record));
  };
  // TST-A is published (control for the learner route). TST-D has only a draft revision.
  write("courses/field-safety/TST-A.json", { id: "TST-A", title: "Lesson A", courseSlugs: ["field-safety"], lessonType: "K", introduction: "Read this from the file.", knowledgeChecks: KNOWLEDGE_CHECK });
  write("courses/field-safety/TST-D.json", { id: "TST-D", title: "Lesson D", courseSlugs: ["field-safety"], introduction: DRAFT_TEXT });
  write("licence/lesson-licence.json", { lessons: [] });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = root;
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = "";
});

beforeEach(async () => {
  resetFakeDb();
  resetFileLessonIndexForTests();
  await seedAcademyFixture();
  await seed("user", [{ id: ADMIN, email: "admin-preview@example.test", fullName: "Admin Preview", role: "ADMIN", isActive: true, isEmailVerified: true }]);
  await seed("academyContentLesson", [{ id: "lesson-d", sourceId: "TST-D", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson D", objective: "O", assessment: "A", sourceVersion: "1", sourceHash: "h-d" }]);
  await seed("academyLessonRevision", [
    { id: "rev-d1-draft", lessonId: "lesson-d", version: 1, body: DRAFT_BODY, contentHash: contentHashOf(DRAFT_BODY), status: "DRAFT" },
  ]);
  // Placed in the course with no published revision: the learner body route must refuse it.
  await seed("academyLessonPlacement", [{ trackId: ids.track, lessonId: "lesson-d", revisionId: null, position: 3, required: false }]);
});

describe("admin lesson preview", () => {
  it("lets an admin preview a draft, marked preview: true, with its review status", async () => {
    const res = await request(app).get(PREVIEW("TST-D")).set(auth(ADMIN, "ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body.data.preview).toBe(true);
    expect(res.body.data.body.introduction).toBe(DRAFT_TEXT);
    expect(res.body.data.revision.status).toBe("DRAFT");
    expect(res.body.data.revision.publishedAt).toBeNull();
    expect(res.body.data.review.approved).toBe(false);
    expect(res.body.data.review.latestDecision).toBeNull();
    expect(res.body.data.review.reasons.map((r: { code: string }) => r.code)).toContain("NOT_APPROVED_FOR_CURRENT_HASH");
    expect(res.headers["cache-control"]).toContain("no-store");
  });

  it("returns the latest revision, which is the unpublished version 2 for TST-B", async () => {
    const res = await request(app).get(PREVIEW("TST-B")).set(auth(ADMIN, "ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body.data.revision.version).toBe(2);
    expect(res.body.data.revision.id).toBe(ids.revisionDraft);
    expect(res.body.data.revision.status).toBe("DRAFT");
    expect(res.body.data.body.introduction).toBe("Draft only");
  });

  it("never reports a draft as published, and strips answer material from the preview", async () => {
    const res = await request(app).get(PREVIEW("TST-D")).set(auth(ADMIN, "ADMIN"));
    expect(res.status).toBe(200);
    expect(res.body.data.revision.status).not.toBe("PUBLISHED");
    expect(res.body.data.revision.publishedAt).toBeNull();
    expect(res.body.data.published).toBeUndefined();
    const text = JSON.stringify(res.body);
    expect(text).not.toContain("correctIndex");
    expect(text).not.toContain("draft secret rationale");
  });

  it("records every preview in the audit log without changing the revision", async () => {
    await request(app).get(PREVIEW("TST-D")).set(auth(ADMIN, "ADMIN"));
    const audit = await fakePrisma.auditLog.findMany({ where: { action: "LESSON_REVISION_PREVIEWED", entityId: "rev-d1-draft" } });
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ userId: ADMIN, entity: "AcademyLessonRevision" });
    const revision = await fakePrisma.academyLessonRevision.findUnique({ where: { id: "rev-d1-draft" } });
    expect(revision).toMatchObject({ status: "DRAFT", publishedAt: null });
  });

  it("returns 404 for a lesson that does not exist", async () => {
    const res = await request(app).get(PREVIEW("TST-NOPE")).set(auth(ADMIN, "ADMIN"));
    expect(res.status).toBe(404);
  });

  it("refuses a teacher, who can edit lessons but is not an admin", async () => {
    const res = await request(app).get(PREVIEW("TST-D")).set(auth(ids.manager, "TEACHER"));
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(DRAFT_TEXT);
  });

  it("refuses a learner", async () => {
    const res = await request(app).get(PREVIEW("TST-D")).set(auth(ids.learner1, "STUDENT"));
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain(DRAFT_TEXT);
  });

  it("refuses an unauthenticated request", async () => {
    const res = await request(app).get(PREVIEW("TST-D"));
    expect(res.status).toBe(401);
    expect(JSON.stringify(res.body)).not.toContain(DRAFT_TEXT);
  });

  it("refuses a request with a malformed token", async () => {
    const res = await request(app).get(PREVIEW("TST-D")).set({ Authorization: "Bearer not-a-token" });
    expect(res.status).toBe(401);
  });
});

describe("learner routes are unchanged by the preview", () => {
  it("serves a published lesson to an enrolled learner (control)", async () => {
    const res = await request(app).get(BODY("TST-A")).set(auth(ids.learner1, "STUDENT"));
    expect(res.status).toBe(200);
    expect(res.body.data.introduction).toBe("Training for {{business:business.name}} crews.");
  });

  it("still refuses a draft-only lesson to an enrolled learner", async () => {
    const res = await request(app).get(BODY("TST-D")).set(auth(ids.learner1, "STUDENT"));
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(DRAFT_TEXT);
  });

  it("does not serve the draft through the learner route even when the admin has previewed it", async () => {
    await request(app).get(PREVIEW("TST-D")).set(auth(ADMIN, "ADMIN"));
    const res = await request(app).get(BODY("TST-D")).set(auth(ids.learner1, "STUDENT"));
    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain(DRAFT_TEXT);
  });
});
