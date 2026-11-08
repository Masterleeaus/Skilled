/**
 * File-backed lesson bodies over HTTP (GET /api/academy/curriculum/courses/:courseId/lessons/:lessonId/body).
 * Lesson files are written to a temporary curriculum folder for the run. Runs over the in-memory Prisma double.
 */
import request from "supertest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "file-lesson-body-test-secret",
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
import { resetFakeDb, seed } from "./support/fake-prisma";
import { KNOWLEDGE_CHECK, ids, publishFileBodies, seedAcademyFixture, token } from "./support/academy-fixtures";
import { app } from "../app";
import { resetFileLessonIndexForTests } from "../modules/curriculum/file-lesson-loader";
import { knowledgeChecksAgree } from "../modules/curriculum/curriculum.routes";
import { CourseLevelMap, setCourseLevelMapForTests } from "../modules/levels/level-rules";

type Placement = { lesson: { sourceId: string }; [key: string]: unknown };
type TrackEntry = { track: { placements: Placement[] } };

const BODY = (lessonId: string, courseId = ids.course) => `/api/academy/curriculum/courses/${courseId}/lessons/${lessonId}/body`;
const OUTLINE = (courseId = ids.course) => `/api/academy/curriculum/courses/${courseId}/outline`;
const auth = (userId: string, role = "STUDENT") => ({ Authorization: `Bearer ${token(userId, role)}` });

// TST-A is base, TST-B is group, so TST-B is locked until TST-A is finished (acknowledged and its check passed).
const MAP: CourseLevelMap = { "field-safety": { "TST-A": "base", "TST-B": "group" } };

let root: string;

function writeLesson(relative: string, record: unknown): void {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, typeof record === "string" ? record : JSON.stringify(record));
}

// The learner's text for TST-A carries an answer key that the response must not show.
const FILE_A = {
  id: "TST-A",
  title: "Lesson A",
  courseSlugs: ["field-safety"],
  lessonType: "K",
  introduction: "Read this from the file.",
  knowledgeChecks: KNOWLEDGE_CHECK.map(q => ({ ...q, correctIndex: 1, rationale: "secret rationale" })),
};
const FILE_B = { id: "TST-B", title: "Lesson B", courseSlugs: ["field-safety"], introduction: "Group level text." };

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "lesson-body-test-"));
  writeLesson("courses/field-safety/TST-A.json", FILE_A);
  writeLesson("courses/field-safety/TST-B.json", FILE_B);
  writeLesson("courses/field-safety/TST-C.json", { id: "TST-C", title: "Lesson C", courseSlugs: ["field-safety"], introduction: "Unpublished text." });
  // Not indexed: no id, and not valid JSON.
  writeLesson("courses/field-safety/no-id.json", { title: "No id", courseSlugs: ["field-safety"] });
  writeLesson("courses/field-safety/broken.json", "{ not json");
  // Shared lesson that no course places: indexed, but never served.
  writeLesson("shared/app/TST-S.json", { id: "TST-S", title: "Shared", courseSlugs: [], introduction: "Shared text." });
  // Same id in two files: both refused.
  writeLesson("courses/field-safety/dup-one.json", { id: "TST-DUP", courseSlugs: ["field-safety"], introduction: "One" });
  writeLesson("shared/app/dup-two.json", { id: "TST-DUP", courseSlugs: [], introduction: "Two" });
  // The default track is non-licensed, which needs the licence file. Empty: no lesson has a licence status here.
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
  await publishFileBodies({ "TST-A": FILE_A, "TST-B": FILE_B });
  // TST-C is placed in the course with no published revision. The outline lists it; the body is not served.
  await seed("academyContentLesson", [{ id: "lesson-c", sourceId: "TST-C", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson C", objective: "O", assessment: "A", sourceVersion: "1", sourceHash: "h-c" }]);
  await seed("academyLessonPlacement", [{ trackId: ids.track, lessonId: "lesson-c", revisionId: null, position: 3, required: false }]);
});

describe("lesson body endpoint", () => {
  it("serves the file's body to an enrolled learner, without answer data", async () => {
    const res = await request(app).get(BODY("TST-A")).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data.introduction).toBe("Read this from the file.");
    const text = JSON.stringify(res.body);
    expect(text).not.toContain("correctIndex");
    expect(text).not.toContain("secret rationale");
    expect(res.body.data.knowledgeChecks).toEqual(KNOWLEDGE_CHECK);
    expect(res.headers["cache-control"]).toContain("no-store");
  });

  it("refuses a learner who is not enrolled", async () => {
    const res = await request(app).get(BODY("TST-A")).set(auth(ids.outsider));
    expect(res.status).toBe(403);
    expect(JSON.stringify(res.body)).not.toContain("Read this from the file.");
  });

  it("requires authentication", async () => {
    const res = await request(app).get(BODY("TST-A"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a lesson that is not in the file index", async () => {
    const res = await request(app).get(BODY("TST-NOPE")).set(auth(ids.learner1));
    expect(res.status).toBe(404);
  });

  it("returns 404 for a shared lesson that no course places", async () => {
    const res = await request(app).get(BODY("TST-S")).set(auth(ids.learner1));
    expect(res.status).toBe(404);
  });

  it("refuses a lesson id that appears in two files", async () => {
    const res = await request(app).get(BODY("TST-DUP")).set(auth(ids.learner1));
    expect(res.status).toBe(404);
  });

  it("returns 404 for a placed lesson with no published revision", async () => {
    const res = await request(app).get(BODY("TST-C")).set(auth(ids.learner1));
    expect(res.status).toBe(404);
  });

  it("returns 403 for a group lesson while the base level is unfinished", async () => {
    const res = await request(app).get(BODY("TST-B")).set(auth(ids.learner1));
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/locked/);
    expect(JSON.stringify(res.body)).not.toContain("Group level text.");
  });

  it("opens the group lesson once the base lesson is acknowledged and its check passed", async () => {
    await seed("academyLearnerCompletion", [{ learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA }]);
    await seed("academyKnowledgeAttempt", [{ learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true }]);
    const res = await request(app).get(BODY("TST-B")).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data.introduction).toBe("Group level text.");
  });

  it("keeps the outline listing a placed lesson that has no revision, with no body and no lock", async () => {
    const res = await request(app).get(OUTLINE()).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    const placements: Placement[] = res.body.data.tracks.flatMap((t: TrackEntry) => t.track.placements);
    const lessonC = placements.find((p) => p.lesson.sourceId === "TST-C");
    expect(lessonC).toBeDefined();
    expect(lessonC?.revision).toBeNull();
    expect(lessonC?.levelLock ?? null).toBeNull();
  });

  it("shows the outline lock with no body for a locked lesson", async () => {
    const res = await request(app).get(OUTLINE()).set(auth(ids.learner1));
    const lessonB = res.body.data.tracks.flatMap((t: TrackEntry) => t.track.placements).find((p: Placement) => p.lesson.sourceId === "TST-B");
    expect(lessonB.levelLock).toMatchObject({ level: "group", waitingOn: "base" });
    expect(lessonB.revision).not.toHaveProperty("body");
  });
});

describe("knowledge-check agreement", () => {
  it("agrees when the learner-visible checks match, ignoring answer data", () => {
    const fileBody = { knowledgeChecks: KNOWLEDGE_CHECK.map(q => ({ ...q, correctIndex: 0 })) };
    expect(knowledgeChecksAgree(fileBody, { knowledgeChecks: KNOWLEDGE_CHECK })).toBe(true);
  });

  it("disagrees when option order differs, so answer positions would not line up", () => {
    const reordered = KNOWLEDGE_CHECK.map(q => ({ ...q, options: [...q.options].reverse() }));
    expect(knowledgeChecksAgree({ knowledgeChecks: reordered }, { knowledgeChecks: KNOWLEDGE_CHECK })).toBe(false);
  });

  it("disagrees when the file has checks and the revision has none", () => {
    expect(knowledgeChecksAgree({ knowledgeChecks: KNOWLEDGE_CHECK }, { introduction: "x" })).toBe(false);
  });
});
