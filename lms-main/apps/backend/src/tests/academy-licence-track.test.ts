/**
 * Licence tracks (non-licensed default, licensed). Outline, body, progress and summary over the in-memory Prisma double.
 * The licence file and lesson files are written to a temporary curriculum folder for the run. Nothing reads the repo's curriculum.
 */
import request from "supertest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "licence-track-test-secret",
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
import { fakePrisma as prisma, resetFakeDb, seed } from "./support/fake-prisma";
import { ids, publishFileBodies, seedAcademyFixture, token } from "./support/academy-fixtures";
import { app } from "../app";
import { resetFileLessonIndexForTests } from "../modules/curriculum/file-lesson-loader";
import { CourseLevelMap, setCourseLevelMapForTests } from "../modules/levels/level-rules";
import { LICENCE_EXCLUDED_MESSAGE, filterLessonsForTrack, filterModulesForTrack, parseLicenceFile, parseLicenceTrack, resetLicenceIndexForTests, summariseLicenceTracks, licenceNoticeOf } from "../modules/curriculum/licence-track";

const OUTLINE = (track?: string) => `/api/academy/curriculum/courses/${ids.course}/outline${track === undefined ? "" : `?track=${track}`}`;
const BODY = (lessonId: string, track?: string) => `/api/academy/curriculum/courses/${ids.course}/lessons/${lessonId}/body${track === undefined ? "" : `?track=${track}`}`;
const PROGRESS = (track?: string) => `/api/academy/curriculum/courses/${ids.course}/progress/me${track === undefined ? "" : `?track=${track}`}`;
const SUMMARY = `/api/academy/curriculum/courses/${ids.course}/licence-tracks`;
const auth = (userId: string) => ({ Authorization: `Bearer ${token(userId, "STUDENT")}` });

// TST-A (threshold, base), TST-B (required, base), TST-D (no licence entry, group).
// TST-B sits in base, so if required lessons gated levels the group lesson TST-D would stay locked for ever.
const MAP: CourseLevelMap = { "field-safety": { "TST-A": "base", "TST-B": "base", "TST-D": "group" } };

const LICENCE_FILE = {
  generated: "2026-11-03",
  rule: "fixture",
  lessons: [
    { lessonId: "TST-A", status: "threshold", limit: "Work up to 3 metres high", officialWording: "Work over this height needs a licence.", officialUrl: null, pageDate: null, states: "QLD", note: "internal reviewer note that must never reach a learner", scanFile: "result-01.json" },
    { lessonId: "TST-B", status: "required", limit: null, officialWording: ["Gas fitting of any value needs a licensed gasfitter. (WebFetch summary; not verbatim.)"], officialUrl: null, pageDate: null, states: "VIC", note: "Reviewer remark", scanFile: "result-01.json" },
    { lessonId: "TST-C", status: "not_checked", limit: null, officialWording: null, officialUrl: null, pageDate: null, states: "not checked", note: null, scanFile: "result-01.json" },
  ],
};

let root: string;
let emptyRoot: string;

function writeFile(base: string, relative: string, record: unknown): void {
  const file = path.join(base, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, typeof record === "string" ? record : JSON.stringify(record));
}

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "licence-track-test-"));
  emptyRoot = mkdtempSync(path.join(tmpdir(), "licence-track-empty-"));
  writeFile(root, "courses/field-safety/TST-A.json", { id: "TST-A", title: "Lesson A", courseSlugs: ["field-safety"], introduction: "Read this from the file.", knowledgeChecks: [{ id: "TST-A-K01", question: "Which tool is used first?", options: ["Scanner", "Vacuum", "Brush"], correctIndex: 1 }, { id: "TST-A-K02", question: "What is the approved cleaner?", options: ["Water", "Approved product"], correctIndex: 1 }] });
  writeFile(root, "courses/field-safety/TST-B.json", { id: "TST-B", title: "Lesson B", courseSlugs: ["field-safety"], introduction: "Gas fitting text that must not reach the non-licensed track." });
  writeFile(root, "courses/field-safety/TST-D.json", { id: "TST-D", title: "Lesson D", courseSlugs: ["field-safety"], introduction: "Group level text." });
  writeFile(root, "licence/lesson-licence.json", LICENCE_FILE);
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = root;
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  rmSync(emptyRoot, { recursive: true, force: true });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = "";
  setCourseLevelMapForTests(null);
  resetLicenceIndexForTests();
});

beforeEach(async () => {
  resetFakeDb();
  resetFileLessonIndexForTests();
  resetLicenceIndexForTests();
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = root;
  setCourseLevelMapForTests(MAP);
  await seedAcademyFixture();
  // TST-B (required) is already placed by the fixture with a published revision. Add TST-D (no licence entry) in group.
  await seed("academyContentLesson", [{ id: "lesson-d", sourceId: "TST-D", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson D", objective: "O", assessment: "A", sourceVersion: "1", sourceHash: "h-d" }]);
  await seed("academyLessonRevision", [{ id: "rev-d1", lessonId: "lesson-d", version: 1, body: { introduction: "Group level text." }, contentHash: "d", status: "PUBLISHED", publishedAt: new Date() }]);
  await seed("academyLessonPlacement", [{ trackId: ids.track, lessonId: "lesson-d", revisionId: "rev-d1", position: 3, required: false }]);
  await publishFileBodies({
    "TST-A": { id: "TST-A", title: "Lesson A", courseSlugs: ["field-safety"], introduction: "Read this from the file.", knowledgeChecks: [{ id: "TST-A-K01", question: "Which tool is used first?", options: ["Scanner", "Vacuum", "Brush"], correctIndex: 1 }, { id: "TST-A-K02", question: "What is the approved cleaner?", options: ["Water", "Approved product"], correctIndex: 1 }] },
    "TST-B": { id: "TST-B", title: "Lesson B", courseSlugs: ["field-safety"], introduction: "Gas fitting text that must not reach the non-licensed track." },
    "TST-D": { id: "TST-D", title: "Lesson D", courseSlugs: ["field-safety"], introduction: "Group level text." },
  });
  // learner-1 keeps the default (non-licensed) enrolment from the fixture. learner-2 is saved on the licensed track.
  await prisma.enrollment.update({ where: { studentId_courseId: { studentId: ids.learner2, courseId: ids.course } }, data: { licenceTrack: "licensed" } });
});

const placementsOf = (body: any) => body.data.tracks.flatMap((t: any) => t.track.placements);
const sourceIdsOf = (body: any) => placementsOf(body).map((p: any) => p.lesson.sourceId).sort();

describe("licence track choice", () => {
  it("defaults to the non-licensed track when no track is sent", () => {
    expect(parseLicenceTrack(undefined)).toBe("non-licensed");
    expect(parseLicenceTrack("")).toBe("non-licensed");
  });

  it("refuses a track name that is not known", () => {
    expect(() => parseLicenceTrack("everything")).toThrow();
    expect(() => parseLicenceTrack(["licensed", "non-licensed"])).toThrow();
  });

  it("outline with no track is the non-licensed track: required lessons are excluded", async () => {
    const res = await request(app).get(OUTLINE()).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("non-licensed");
    expect(sourceIdsOf(res.body)).toEqual(["TST-A", "TST-D"]);
  });

  it("non-licensed outline includes a threshold lesson with its limit text and no licence note", async () => {
    const res = await request(app).get(OUTLINE("non-licensed")).set(auth(ids.learner1));
    const lessonA = placementsOf(res.body).find((p: any) => p.lesson.sourceId === "TST-A");
    expect(lessonA.licence).toEqual({ status: "threshold", limit: "Work up to 3 metres high", reason: "Work over this height needs a licence." });
    expect(JSON.stringify(res.body)).not.toContain("internal reviewer note");
  });

  it("a lesson with no licence entry is included in both tracks", async () => {
    for (const track of ["non-licensed", "licensed"]) {
      const res = await request(app).get(OUTLINE(track)).set(auth(ids.learner1));
      expect(sourceIdsOf(res.body)).toContain("TST-D");
      const lessonD = placementsOf(res.body).find((p: any) => p.lesson.sourceId === "TST-D");
      expect(lessonD.licence).toBeNull();
    }
  });

  it("licensed outline includes the required lessons for a learner saved on the licensed track, with the licence requirement and the wording without provenance notes", async () => {
    const res = await request(app).get(OUTLINE()).set(auth(ids.learner2));
    expect(res.body.data.licenceTrack).toBe("licensed");
    expect(sourceIdsOf(res.body)).toEqual(["TST-A", "TST-B", "TST-D"]);
    const lessonB = placementsOf(res.body).find((p: any) => p.lesson.sourceId === "TST-B");
    expect(lessonB.licence).toEqual({ status: "required", limit: null, reason: "Gas fitting of any value needs a licensed gasfitter." });
    expect(JSON.stringify(res.body)).not.toContain("WebFetch");
    expect(JSON.stringify(res.body)).not.toContain("Reviewer remark");
  });

  it("ignores an unknown track on the outline for an enrolled learner, who gets the saved track", async () => {
    const res = await request(app).get(OUTLINE("everything")).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("non-licensed");
  });

  it("refuses the body of a required lesson on the non-licensed track with a clear reason", async () => {
    const res = await request(app).get(BODY("TST-B", "non-licensed")).set(auth(ids.learner1));
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(LICENCE_EXCLUDED_MESSAGE);
    expect(JSON.stringify(res.body)).not.toContain("Gas fitting text");
  });

  it("refuses the body of a required lesson when no track is sent, because the default is non-licensed", async () => {
    const res = await request(app).get(BODY("TST-B")).set(auth(ids.learner1));
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(LICENCE_EXCLUDED_MESSAGE);
  });

  it("serves the body of a required lesson to a learner saved on the licensed track", async () => {
    const res = await request(app).get(BODY("TST-B")).set(auth(ids.learner2));
    expect(res.status).toBe(200);
    expect(res.body.data.introduction).toBe("Gas fitting text that must not reach the non-licensed track.");
  });

  it("serves the body of a threshold lesson on the non-licensed track", async () => {
    const res = await request(app).get(BODY("TST-A")).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data.introduction).toBe("Read this from the file.");
  });

  it("does not let required lessons block a later level: a non-licensed learner reaches a group lesson after the base threshold lesson", async () => {
    // TST-A is the only base lesson a non-licensed learner can finish. TST-D is in group.
    await seed("academyLearnerCompletion", [{ learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA }]);
    await seed("academyKnowledgeAttempt", [{ learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true }]);
    const res = await request(app).get(BODY("TST-D", "non-licensed")).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data.introduction).toBe("Group level text.");
  });

  it("counts progress on the saved track, so excluded lessons are not counted, and a ?track= does not change the count", async () => {
    const nonLicensed = await request(app).get(PROGRESS("non-licensed")).set(auth(ids.learner1));
    expect(nonLicensed.body.data.lessonCount).toBe(2);
    expect(nonLicensed.body.data.lessons.map((l: any) => l.sourceId).sort()).toEqual(["TST-A", "TST-D"]);
    const withLicensedQuery = await request(app).get(PROGRESS("licensed")).set(auth(ids.learner1));
    expect(withLicensedQuery.body.data.lessonCount).toBe(2);
    const licensed = await request(app).get(PROGRESS()).set(auth(ids.learner2));
    expect(licensed.body.data.lessonCount).toBe(3);
  });

  it("publishes a summary before enrolment: counts, the lessons that need a licence, and the limited lessons", async () => {
    const res = await request(app).get(SUMMARY);
    expect(res.status).toBe(200);
    expect(res.body.data.defaultTrack).toBe("non-licensed");
    expect(res.body.data.counts).toEqual({ "non-licensed": 2, licensed: 3 });
    expect(res.body.data.needsLicence).toEqual([{ title: "Lesson B", reason: "Gas fitting of any value needs a licensed gasfitter." }]);
    expect(res.body.data.limited).toEqual([{ title: "Lesson A", limit: "Work up to 3 metres high" }]);
    expect(JSON.stringify(res.body)).not.toContain("internal reviewer note");
  });

  it("refuses the non-licensed track when the licence file cannot be read, rather than showing everything", async () => {
    (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = emptyRoot;
    resetLicenceIndexForTests();
    const res = await request(app).get(OUTLINE("non-licensed")).set(auth(ids.learner1));
    expect(res.status).toBe(503);
    // learner-1 is saved on non-licensed, so ?track=licensed does not reach the licensed track either.
    const withLicensedQuery = await request(app).get(OUTLINE("licensed")).set(auth(ids.learner1));
    expect(withLicensedQuery.status).toBe(503);
    const licensed = await request(app).get(OUTLINE()).set(auth(ids.learner2));
    expect(licensed.status).toBe(200);
  });
});

describe("licence file rules", () => {
  it("treats an unrecognised status as required, so it is excluded from the non-licensed track", () => {
    const index = parseLicenceFile({ lessons: [{ lessonId: "X-1", status: "maybe", limit: null, officialWording: null }] });
    expect(index.records.get("X-1")?.status).toBe("required");
  });

  it("skips an entry with no lessonId", () => {
    const index = parseLicenceFile({ lessons: [{ status: "required" }, { lessonId: "X-2", status: "threshold", limit: "5 m" }] });
    expect([...index.records.keys()]).toEqual(["X-2"]);
  });

  it("refuses a file with no lessons array", () => {
    expect(() => parseLicenceFile({ generated: "x" })).toThrow();
  });

  it("gives a learner-facing notice only for threshold and required lessons", () => {
    const index = parseLicenceFile(LICENCE_FILE);
    expect(licenceNoticeOf(index, "TST-C")).toBeNull();
    expect(licenceNoticeOf(index, "TST-A")?.status).toBe("threshold");
    expect(licenceNoticeOf(index, "TST-B")?.reason).toBe("Gas fitting of any value needs a licensed gasfitter.");
  });

  it("summarises counts with a missing lesson and a not_checked lesson both included in each track", () => {
    const index = parseLicenceFile(LICENCE_FILE);
    const summary = summariseLicenceTracks([{ sourceId: "TST-A", title: "A" }, { sourceId: "TST-B", title: "B" }, { sourceId: "TST-C", title: "C" }, { sourceId: "TST-MISSING", title: "M" }], index);
    expect(summary.counts).toEqual({ "non-licensed": 3, licensed: 4 });
    expect(summary.needsLicence.map((item) => item.title)).toEqual(["B"]);
  });
});

describe("legacy course modules follow the licence track", () => {
  const index = parseLicenceFile(LICENCE_FILE);
  const unavailable = { available: false, records: new Map() };
  const lessons = [
    { id: "l1", title: "Threshold lesson", sourceId: "TST-A" },
    { id: "l2", title: "Required lesson", sourceId: "TST-B" },
    { id: "l3", title: "No licence entry", sourceId: "TST-D" },
    { id: "l4", title: "No sourceId" },
  ];
  const idsOf = (list: Array<{ id: string }>) => list.map((item) => item.id);

  it("non-licensed drops required lessons and keeps the rest with their notice", () => {
    const kept = filterLessonsForTrack(lessons, "non-licensed", index);
    expect(idsOf(kept)).toEqual(["l1", "l3", "l4"]);
    expect(kept[0].licence).toEqual({ status: "threshold", limit: "Work up to 3 metres high", reason: "Work over this height needs a licence." });
    expect(kept[1].licence).toBeNull();
    expect(kept[2].licence).toBeNull();
  });

  it("licensed keeps every lesson, and a required lesson carries its licence requirement", () => {
    const kept = filterLessonsForTrack(lessons, "licensed", index);
    expect(idsOf(kept)).toEqual(["l1", "l2", "l3", "l4"]);
    expect(kept[1].licence).toEqual({ status: "required", limit: null, reason: "Gas fitting of any value needs a licensed gasfitter." });
  });

  it("the lesson output keeps the original fields and adds only the licence notice", () => {
    const [first] = filterLessonsForTrack([{ id: "l1", title: "Threshold lesson", sourceId: "TST-A" }], "licensed", index);
    expect(Object.keys(first).sort()).toEqual(["id", "licence", "sourceId", "title"]);
    expect(JSON.stringify(first)).not.toContain("internal reviewer note");
  });

  it("drops a module whose lessons are all excluded, and keeps a module that was empty to begin with", () => {
    const modules = [
      { id: "m1", title: "Required only", lessons: [{ id: "l2", sourceId: "TST-B" }] },
      { id: "m2", title: "Mixed", lessons: [{ id: "l1", sourceId: "TST-A" }, { id: "l2", sourceId: "TST-B" }] },
      { id: "m3", title: "Empty", lessons: [] as Array<{ id: string; sourceId?: string }> },
    ];
    const nonLicensed = filterModulesForTrack(modules, "non-licensed", index);
    expect(nonLicensed.map((m) => m.id)).toEqual(["m2", "m3"]);
    expect(idsOf(nonLicensed[0].lessons)).toEqual(["l1"]);
    const licensed = filterModulesForTrack(modules, "licensed", index);
    expect(licensed.map((m) => m.id)).toEqual(["m1", "m2", "m3"]);
  });

  it("with the licence file unavailable, a lesson with a sourceId is excluded on non-licensed and shown as required on licensed", () => {
    expect(idsOf(filterLessonsForTrack(lessons, "non-licensed", unavailable))).toEqual(["l4"]);
    const licensed = filterLessonsForTrack(lessons, "licensed", unavailable);
    expect(idsOf(licensed)).toEqual(["l1", "l2", "l3", "l4"]);
    expect(licensed[0].licence).toEqual({ status: "required", limit: null, reason: "A licence is required for this work." });
    expect(licensed[3].licence).toBeNull();
  });
});

describe("GET /api/courses/:slug lists legacy modules for the chosen licence track", () => {
  const COURSE = "/api/courses/field-safety";

  beforeEach(async () => {
    await seed("module", [
      { id: "legacy-mod-1", courseId: ids.course, title: "Legacy module one", orderIndex: 0 },
      { id: "legacy-mod-2", courseId: ids.course, title: "Legacy module two", orderIndex: 1 },
    ]);
    // sourceId on a legacy lesson is not a column in the Prisma model today. This seeds a row that carries one, to
    // check the route applies the track to it. Legacy lessons without one are kept on both tracks.
    await seed("lesson", [
      { id: "legacy-les-1", moduleId: "legacy-mod-1", title: "Legacy plain lesson", orderIndex: 0 },
      { id: "legacy-les-2", moduleId: "legacy-mod-1", title: "Legacy gas lesson", orderIndex: 1, sourceId: "TST-B" },
      { id: "legacy-les-3", moduleId: "legacy-mod-2", title: "Legacy gas lesson two", orderIndex: 0, sourceId: "TST-B" },
    ]);
  });

  const legacyTitles = (body: any) => body.data.modules.map((m: any) => ({ title: m.title, lessons: m.lessons.map((l: any) => l.title) }));

  it("defaults to non-licensed: the required lessons and any module left empty are not listed", async () => {
    const res = await request(app).get(COURSE);
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("non-licensed");
    expect(legacyTitles(res.body)).toEqual([{ title: "Legacy module one", lessons: ["Legacy plain lesson"] }]);
  });

  it("licensed lists the required lessons with the licence requirement", async () => {
    const res = await request(app).get(`${COURSE}?track=licensed`);
    expect(res.status).toBe(200);
    expect(legacyTitles(res.body)).toEqual([
      { title: "Legacy module one", lessons: ["Legacy plain lesson", "Legacy gas lesson"] },
      { title: "Legacy module two", lessons: ["Legacy gas lesson two"] },
    ]);
    const gas = res.body.data.modules[0].lessons[1];
    expect(gas.licence).toEqual({ status: "required", limit: null, reason: "Gas fitting of any value needs a licensed gasfitter." });
  });

  it("refuses an unknown track with a validation error", async () => {
    const res = await request(app).get(`${COURSE}?track=everything`);
    expect(res.status).toBe(422);
  });
});
