/**
 * Lesson body integrity (GET /api/academy/curriculum/courses/:courseId/lessons/:lessonId/body).
 * The served body is the published revision's stored body. It must still hash to the stored revision hash,
 * otherwise the route answers 409. A placed lesson with no published revision answers 404.
 * Lesson files are written to a temporary curriculum folder. Runs over the in-memory Prisma double.
 *
 * Status: written, not run.
 */
import express from "express";
import request from "supertest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "body-integrity-test-secret", JWT_ACCESS_EXPIRES: "15m", CURRICULUM_DIR: "" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { env } from "../config/env";
import { fakePrisma as prisma, resetFakeDb, seed } from "./support/fake-prisma";
import { KNOWLEDGE_CHECK, ids, revisionBodyA, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import { resetFileLessonIndexForTests } from "../modules/curriculum/file-lesson-loader";
import { contentHashOf } from "../modules/curriculum/lesson-review.service";
import { CourseLevelMap, setCourseLevelMapForTests } from "../modules/levels/level-rules";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use(errorHandler);

const BODY = (lessonId: string, courseId = ids.course) => `/api/academy/curriculum/courses/${courseId}/lessons/${lessonId}/body`;
const auth = (userId: string) => ({ Authorization: `Bearer ${token(userId, "STUDENT")}` });

// TST-A is a base lesson, so the learner can open it without finishing another level.
const MAP: CourseLevelMap = { "field-safety": { "TST-A": "base", "TST-C": "base" } };

let root: string;

function writeLesson(relative: string, record: unknown): void {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(record));
}

async function setRevisionA(changes: Record<string, unknown>): Promise<void> {
  await prisma.academyLessonRevision.update({ where: { id: ids.revisionA }, data: changes });
}

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "body-integrity-test-"));
  writeLesson("courses/field-safety/TST-A.json", { id: "TST-A", title: "Lesson A", courseSlugs: ["field-safety"], knowledgeChecks: KNOWLEDGE_CHECK });
  writeLesson("courses/field-safety/TST-C.json", { id: "TST-C", title: "Lesson C", courseSlugs: ["field-safety"] });
  // The default track is non-licensed, which reads the licence file. Empty: no lesson has a licence status here.
  writeLesson("licence/lesson-licence.json", { lessons: [] });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = root;
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = "";
  setCourseLevelMapForTests(null);
});

beforeEach(async () => {
  resetFakeDb();
  resetFileLessonIndexForTests();
  setCourseLevelMapForTests(MAP);
  await seedAcademyFixture();
  // TST-C is placed with no revision pinned.
  await seed("academyContentLesson", [{ id: "lesson-c", sourceId: "TST-C", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson C", objective: "O", assessment: "A", sourceVersion: "1", sourceHash: "h-c" }]);
  await seed("academyLessonPlacement", [{ trackId: ids.track, lessonId: "lesson-c", revisionId: null, position: 3, required: false }]);
});

describe("[written, not run] lesson body hash check", () => {
  it("returns the pinned revision body when its stored hash matches the body", async () => {
    await setRevisionA({ contentHash: contentHashOf(revisionBodyA()) });

    const res = await request(app).get(BODY("TST-A")).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(revisionBodyA());
    expect(res.headers["cache-control"]).toContain("no-store");
  });

  it("returns 409 when the stored body was changed after its hash was recorded", async () => {
    await setRevisionA({ contentHash: contentHashOf(revisionBodyA()) });
    // Body edited in place; the stored hash still describes the original text.
    await setRevisionA({ body: { ...revisionBodyA(), introduction: "Edited after publication." } });

    const res = await request(app).get(BODY("TST-A")).set(auth(ids.learner1));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/integrity check/);
    expect(JSON.stringify(res.body)).not.toContain("Edited after publication.");
    expect(res.body.data).toBeUndefined();
  });

  it("returns 409 when the stored hash does not match the body at all", async () => {
    await setRevisionA({ contentHash: "0".repeat(64) });

    const res = await request(app).get(BODY("TST-A")).set(auth(ids.learner1));
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/integrity check/);
    expect(JSON.stringify(res.body)).not.toContain("Work top to bottom");
  });

  it("returns 404 for a placed lesson that has no revision pinned", async () => {
    // The lesson file exists, so the 404 comes from the missing revision, not from the file index.
    const res = await request(app).get(BODY("TST-C")).set(auth(ids.learner1));
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
  });

  it("returns 404 when the pinned revision is no longer published", async () => {
    await setRevisionA({ contentHash: contentHashOf(revisionBodyA()), status: "DRAFT" });

    const res = await request(app).get(BODY("TST-A")).set(auth(ids.learner1));
    expect(res.status).toBe(404);
    expect(res.body.data).toBeUndefined();
  });
});
