/**
 * PASS42 level gates: base, group and specialised levels per learner.
 * Uses the real routers and the level service over the in-memory Prisma double.
 * Layer mapping: base -> base, group -> group, business and high-risk -> specialised. app is not gated.
 */
import express from "express";
import { createHash } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-test-access-secret", JWT_ACCESS_EXPIRES: "15m", NODE_ENV: "test" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { resetFakeDb, rows, seed, stringOf } from "./support/fake-prisma";
import { KNOWLEDGE_CHECK, KNOWLEDGE_KEYS, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import templateRoutes from "../modules/templates/template.routes";
import { integrationRoutes } from "../modules/curriculum/integration.routes";
import { errorHandler } from "../middleware/errorHandler";
import {
  assertLessonOpen,
  filterToFinishedLevels,
  getLearnerLevelView,
  isLevelGateExempt,
  LevelLockedError,
} from "../modules/levels/level.service";
import {
  courseLevelFor,
  CourseLevelMap,
  GateLesson,
  knowledgeCheckCount,
  lockForLevel,
  setCourseLevelMapForTests,
  summariseLevels,
} from "../modules/levels/level-rules";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use("/api/academy/templates", templateRoutes);
app.use("/api/titan/integration", integrationRoutes);
app.use(errorHandler);

const CURRICULUM = "/api/academy/curriculum";
const LEARNER_A = "lvl-learner-a";
const LEARNER_B = "lvl-learner-b";
const TEACHER = "lvl-teacher";
const ORG_ASSESSOR = "lvl-org-assessor";
const ORG = "lvl-org";
const EXT_ORG = "ext-org-levels";
const EXT_USER_A = "ext-user-levels-a";
const COURSE = "lvl-course";
const TRACK = "lvl-track";
const INTEGRATION_TOKEN = "ai-workforce-levels-test-token-0123456789";

const LESSONS = [
  { key: "base1", layer: "base", checks: true },
  { key: "base2", layer: "base", checks: false },
  { key: "group1", layer: "group", checks: false },
  { key: "spec1", layer: "business", checks: false },
  { key: "spec2", layer: "high-risk", checks: true },
  { key: "app1", layer: "app", checks: false },
] as const;
const lessonId = (key: string) => `lesson-${key}`;
const revisionId = (key: string) => `rev-${key}`;
const auth = (userId: string, role = "STUDENT") => ({ Authorization: `Bearer ${token(userId, role)}` });

function bodyFor(checks: boolean): Record<string, unknown> {
  return checks ? { introduction: "Taught content.", knowledgeChecks: KNOWLEDGE_CHECK } : { introduction: "Taught content." };
}

// The fixture course is placed in levels by its own map entries. LVL-app1 has no entry, so it is not gated.
const FIXTURE_MAP: CourseLevelMap = {
  "level-course": {
    "LVL-base1": "base", "LVL-base2": "base", "LVL-group1": "group", "LVL-spec1": "specialised", "LVL-spec2": "specialised",
  },
};

afterEach(() => setCourseLevelMapForTests(null));

beforeEach(async () => {
  resetFakeDb();
  setCourseLevelMapForTests(FIXTURE_MAP);
  await seed("user", [
    { id: LEARNER_A, email: "level-a@example.test", fullName: "Level Learner A", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: LEARNER_B, email: "level-b@example.test", fullName: "Level Learner B", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: TEACHER, email: "level-teacher@example.test", fullName: "Level Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: ORG_ASSESSOR, email: "level-assessor@example.test", fullName: "Org Assessor", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("company", [{ id: ORG, name: "Level Organisation", externalRef: EXT_ORG }]);
  await seed("companyMember", [
    { companyId: ORG, userId: LEARNER_A, role: "LEARNER" },
    { companyId: ORG, userId: LEARNER_B, role: "LEARNER" },
    { companyId: ORG, userId: ORG_ASSESSOR, role: "ASSESSOR" },
  ]);
  await seed("course", [{ id: COURSE, title: "Level Course", slug: "level-course", isPublished: true, price: 0 }]);
  await seed("enrollment", [
    { studentId: LEARNER_A, courseId: COURSE, status: "ACTIVE" },
    { studentId: LEARNER_B, courseId: COURSE, status: "ACTIVE" },
  ]);
  await seed("academyTrainingAssignment", [
    { companyId: ORG, learnerId: LEARNER_A, assignedById: TEACHER, courseId: COURSE, status: "ASSIGNED" },
  ]);
  await seed("academyContentLesson", LESSONS.map((lesson) => ({
    id: lessonId(lesson.key), sourceId: `LVL-${lesson.key}`, layer: lesson.layer, serviceGroup: "GENERAL", unit: "U1",
    title: `Lesson ${lesson.key}`, objective: "Objective", assessment: "Assessment", sourceVersion: "1", sourceHash: `h-${lesson.key}`,
  })));
  await seed("academyLessonRevision", LESSONS.map((lesson) => ({
    id: revisionId(lesson.key), lessonId: lessonId(lesson.key), version: 1, body: bodyFor(lesson.checks), contentHash: `c-${lesson.key}`,
    status: "PUBLISHED", publishedAt: new Date(),
  })));
  // Server-side keys for every lesson revision that carries checks (one set per revision, by check ID).
  for (const lesson of LESSONS.filter((item) => item.checks)) {
    await seed("academyKnowledgeAnswerKey", KNOWLEDGE_KEYS.map((key) => ({ revisionId: revisionId(lesson.key), ...key })));
  }
  await seed("academyCurriculumTrack", [{ id: TRACK, slug: "level-track", title: "Level track", scope: "UNIVERSAL", status: "PUBLISHED" }]);
  await seed("academyLessonPlacement", LESSONS.map((lesson, index) => ({
    trackId: TRACK, lessonId: lessonId(lesson.key), revisionId: revisionId(lesson.key), position: index + 1, required: true,
  })));
  await seed("academyCourseTrack", [{ courseId: COURSE, trackId: TRACK, position: 1, required: true }]);
});

const complete = (learner: string, key: string) =>
  seed("academyLearnerCompletion", [{ learnerId: learner, lessonId: lessonId(key), revisionId: revisionId(key) }]);
const attempt = (learner: string, key: string, passed: boolean, onRevision = revisionId(key)) =>
  seed("academyKnowledgeAttempt", [{ learnerId: learner, lessonId: lessonId(key), revisionId: onRevision, answers: [1, 1], score: passed ? 2 : 0, total: 2, passed }]);

async function levelsFor(learner: string) {
  const view = await getLearnerLevelView(learner);
  return Object.fromEntries(view.levels.map((level) => [level.level, level]));
}

describe("level rules (pure)", () => {
  // The shared fixture map is set in beforeEach; these checks read the real curriculum map.
  beforeEach(() => setCourseLevelMapForTests(null));

  it("reads the level per course from the map, including the override rows", () => {
    expect(courseLevelFor("appliance", "BP-01")).toBe("base");
    // Override in appliance.csv: layer business, level base.
    expect(courseLevelFor("appliance", "NEW-APP-03")).toBe("base");
    expect(courseLevelFor("appliance", "ACE-02")).toBe("specialised");
  });

  it("does not gate lessons the level files do not list for a course, or courses that are not in the map", () => {
    // C01-L01 is not listed for appliance in the level files, so it is not gated there.
    expect(courseLevelFor("appliance", "C01-L01")).toBeNull();
    expect(courseLevelFor("no-such-course", "BP-01")).toBeNull();
  });

  it("counts knowledge checks the same way the attempt route selects them", () => {
    expect(knowledgeCheckCount({ knowledgeChecks: KNOWLEDGE_CHECK })).toBe(2);
    expect(knowledgeCheckCount({ knowledgeCheck: [{}] })).toBe(1);
    expect(knowledgeCheckCount({ introduction: "no checks" })).toBe(0);
    expect(knowledgeCheckCount(null)).toBe(0);
  });

  it("returns a lock naming the waited-on level only for locked levels", () => {
    const lessons: GateLesson[] = [
      { lessonId: "b", revisionId: "rb", sourceId: "b", title: "b", courseSlug: "c", level: "base", knowledgeChecks: 0 },
      { lessonId: "g", revisionId: "rg", sourceId: "g", title: "g", courseSlug: "c", level: "group", knowledgeChecks: 0 },
    ];
    const summaries = summariseLevels(lessons, { completed: new Set(), passed: new Set() });
    expect(lockForLevel("base", summaries)).toBeNull();
    expect(lockForLevel("group", summaries)).toMatchObject({ level: "group", waitingOn: "base" });
  });
});

describe("level status per learner", () => {
  it("unlocks base for a new learner and locks group and specialised", async () => {
    const levels = await levelsFor(LEARNER_A);
    expect(levels.base).toMatchObject({ status: "in_progress", unlocked: true, finished: false, lessonCount: 2, completedCount: 0 });
    expect(levels.group).toMatchObject({ status: "locked", unlocked: false, waitingOn: "base", lessonCount: 1 });
    expect(levels.specialised).toMatchObject({ status: "locked", unlocked: false, waitingOn: "base", lessonCount: 2 });
    expect(levels.group.reason).toContain("base");
    const view = await getLearnerLevelView(LEARNER_A);
    expect(view.ungatedLessonCount).toBe(1);
  });

  it("keeps group locked until base is finished, then unlocks it", async () => {
    await complete(LEARNER_A, "base1");
    await complete(LEARNER_A, "base2");
    expect((await levelsFor(LEARNER_A)).group).toMatchObject({ status: "locked" });

    await attempt(LEARNER_A, "base1", true);
    const levels = await levelsFor(LEARNER_A);
    expect(levels.base).toMatchObject({ finished: true, status: "finished", knowledgeChecksPassed: 1 });
    expect(levels.group).toMatchObject({ status: "in_progress", unlocked: true, reason: null });
    expect(levels.specialised).toMatchObject({ status: "locked", waitingOn: "group" });
  });

  it("does not finish a level when a lesson's knowledge check has failed or was passed on another revision", async () => {
    await complete(LEARNER_A, "base1");
    await complete(LEARNER_A, "base2");
    // An attempt must reference a revision that exists (foreign key), so the earlier revision is seeded first.
    await seed("academyLessonRevision", [
      { id: "rev-some-other-revision", lessonId: lessonId("base1"), version: 2, body: {}, contentHash: "c-other", status: "ARCHIVED" },
    ]);
    await attempt(LEARNER_A, "base1", false);
    await attempt(LEARNER_A, "base1", true, "rev-some-other-revision");
    const levels = await levelsFor(LEARNER_A);
    expect(levels.base).toMatchObject({ finished: false, status: "in_progress", knowledgeCheckLessons: 1, knowledgeChecksPassed: 0 });
    expect(levels.group).toMatchObject({ status: "locked", waitingOn: "base" });
  });

  it("does not require a knowledge check for lessons that have none", async () => {
    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    await complete(LEARNER_A, "base2");
    expect((await levelsFor(LEARNER_A)).base.finished).toBe(true);
  });

  it("unlocks specialised only after group is finished, and needs both business and high-risk lessons", async () => {
    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    await complete(LEARNER_A, "base2");
    await complete(LEARNER_A, "group1");
    let levels = await levelsFor(LEARNER_A);
    expect(levels.group.finished).toBe(true);
    expect(levels.specialised).toMatchObject({ status: "in_progress", unlocked: true });

    await complete(LEARNER_A, "spec1");
    levels = await levelsFor(LEARNER_A);
    expect(levels.specialised).toMatchObject({ finished: false, completedCount: 1, lessonCount: 2 });

    await complete(LEARNER_A, "spec2");
    await attempt(LEARNER_A, "spec2", true);
    levels = await levelsFor(LEARNER_A);
    expect(levels.specialised).toMatchObject({ finished: true, status: "finished" });
  });

  it("never gates app lessons, even when they are not completed", async () => {
    const levels = await levelsFor(LEARNER_A);
    const counted = Object.values(levels).reduce((sum, level) => sum + level.lessonCount, 0);
    expect(counted).toBe(5);
    await assertLessonOpen({ userId: LEARNER_A, role: "STUDENT" }, lessonId("app1"));
  });
});

describe("lesson access", () => {
  it("refuses an acknowledgement for a group lesson while base is unfinished, with reason and level", async () => {
    const res = await request(app).post(`${CURRICULUM}/completions`).set(auth(LEARNER_A))
      .send({ lessonId: lessonId("group1"), revisionId: revisionId("group1") });
    expect(res.status).toBe(403);
    expect(res.body.message).toContain("group");
    expect(res.body.errors).toEqual([expect.objectContaining({ code: "LEVEL_LOCKED", level: "group", waitingOn: "base" })]);
    expect(rows("academyLearnerCompletion").filter((row) => row.lessonId === lessonId("group1"))).toHaveLength(0);
  });

  it("refuses knowledge-check attempts on a locked specialised lesson and records nothing", async () => {
    const res = await request(app).post(`${CURRICULUM}/knowledge-checks/attempts`).set(auth(LEARNER_A))
      .send({ lessonId: lessonId("spec2"), revisionId: revisionId("spec2"), answers: [1, 1] });
    expect(res.status).toBe(403);
    expect(res.body.errors).toEqual([expect.objectContaining({ level: "specialised", waitingOn: "base" })]);
    expect(rows("academyKnowledgeAttempt")).toHaveLength(0);
  });

  it("refuses a presented context lesson in a locked level before any snapshot is written", async () => {
    const res = await request(app).post(`${CURRICULUM}/companies/${ORG}/lessons/${revisionId("group1")}/context`).set(auth(LEARNER_A));
    expect(res.status).toBe(403);
    expect(res.body.errors).toEqual([expect.objectContaining({ level: "group", waitingOn: "base" })]);
    expect(rows("academyLessonContextSnapshot")).toHaveLength(0);
  });

  it("refuses a locked template lesson read with the level it is waiting on", async () => {
    const res = await request(app).get(`/api/academy/templates/lessons/${lessonId("group1")}/revisions/${revisionId("group1")}`).set(auth(LEARNER_A));
    expect(res.status).toBe(403);
    expect(res.body.errors).toEqual([expect.objectContaining({ level: "group", waitingOn: "base" })]);
  });

  it("lists a locked lesson in the outline without its body, and opens it once base is finished", async () => {
    const before = await request(app).get(`${CURRICULUM}/courses/${COURSE}/outline`).set(auth(LEARNER_A));
    expect(before.status).toBe(200);
    const placements = before.body.data.tracks[0].track.placements as Array<{ lesson: { sourceId: string }; levelLock: unknown; revision: { body: unknown } }>;
    const group = placements.find((p) => p.lesson.sourceId === "LVL-group1")!;
    expect(group.levelLock).toMatchObject({ level: "group", waitingOn: "base" });
    expect(group.revision).not.toHaveProperty("body");
    const base1 = placements.find((p) => p.lesson.sourceId === "LVL-base1")!;
    expect(base1.levelLock).toBeNull();
    expect(base1.revision).not.toHaveProperty("body");
    expect(JSON.stringify(before.body)).not.toContain("correctIndex");

    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    await complete(LEARNER_A, "base2");
    const after = await request(app).get(`${CURRICULUM}/courses/${COURSE}/outline`).set(auth(LEARNER_A));
    const opened = after.body.data.tracks[0].track.placements.find((p: { lesson: { sourceId: string } }) => p.lesson.sourceId === "LVL-group1");
    expect(opened.levelLock).toBeNull();
    expect(opened.revision.body).not.toBeNull();
  });
});

describe("level unlock through the graded attempt route (PASS43)", () => {
  it("a wrong answer leaves base unfinished; the server-keyed correct answers finish base and unlock group", async () => {
    await complete(LEARNER_A, "base1");
    await complete(LEARNER_A, "base2");
    const submit = (answers: number[]) => request(app).post(`${CURRICULUM}/knowledge-checks/attempts`).set(auth(LEARNER_A))
      .send({ lessonId: lessonId("base1"), revisionId: revisionId("base1"), answers });

    const wrong = await submit([0, 0]);
    expect(wrong.status).toBe(200);
    expect(wrong.body.data).toMatchObject({ score: 0, total: 2, passed: false });
    expect((await levelsFor(LEARNER_A)).group).toMatchObject({ status: "locked", waitingOn: "base" });

    const right = await submit([1, 1]);
    expect(right.body.data).toMatchObject({ score: 2, total: 2, passed: true });
    const levels = await levelsFor(LEARNER_A);
    expect(levels.base).toMatchObject({ finished: true, status: "finished", knowledgeChecksPassed: 1 });
    expect(levels.group).toMatchObject({ status: "in_progress", unlocked: true, reason: null });
  });
});

describe("staff and assessors are not gated", () => {
  it("exempts platform staff and organisation assessors, and not a plain learner", async () => {
    expect(await isLevelGateExempt({ userId: TEACHER, role: "TEACHER" })).toBe(true);
    expect(await isLevelGateExempt({ userId: ORG_ASSESSOR, role: "STUDENT" })).toBe(true);
    expect(await isLevelGateExempt({ userId: LEARNER_A, role: "STUDENT" })).toBe(false);
  });

  it("lets staff open a group lesson that a learner cannot open, and still refuses the learner", async () => {
    await expect(assertLessonOpen({ userId: TEACHER, role: "TEACHER" }, lessonId("group1"))).resolves.toBeUndefined();
    await expect(assertLessonOpen({ userId: ORG_ASSESSOR, role: "STUDENT" }, lessonId("group1"))).resolves.toBeUndefined();
    const learnerAttempt = assertLessonOpen({ userId: LEARNER_A, role: "STUDENT" }, lessonId("group1"));
    await expect(learnerAttempt).rejects.toBeInstanceOf(LevelLockedError);
    await expect(learnerAttempt).rejects.toMatchObject({ statusCode: 403, level: "group", waitingOn: "base" });
  });
});

describe("agent knowledge (integration API)", () => {
  async function seedCompetencies() {
    await seed("academyServiceCredential", [{
      service: "ai-workforce", companyRef: EXT_ORG, label: "levels test",
      tokenHash: createHash("sha256").update(INTEGRATION_TOKEN).digest("hex"),
    }]);
    await seed("academyExternalIdentity", [{ service: "ai-workforce", externalUserRef: EXT_USER_A, userId: LEARNER_A, companyId: ORG }]);
    const keys = ["base1", "group1", "spec1", "app1"];
    await seed("academyPracticalEvidence", keys.map((key) => ({
      id: `ev-${key}`, companyId: ORG, learnerId: LEARNER_A, lessonId: lessonId(key), revisionId: revisionId(key),
      description: "Observed practical work for the level test.", evidenceUrls: ["https://example.test/e"], status: "APPROVED",
    })));
    await seed("academyVerifiedCompetency", keys.map((key) => ({
      id: `comp-${key}`, companyId: ORG, learnerId: LEARNER_A, lessonId: lessonId(key), revisionId: revisionId(key),
      evidenceId: `ev-${key}`, assessorId: TEACHER, expiresAt: null,
    })));
  }

  it("returns only competencies in finished levels, and never app or unfinished lessons", async () => {
    await seedCompetencies();
    const skills = [...rows("academyVerifiedCompetency")].map((row) => ({ lessonId: stringOf(row.lessonId) }));
    expect(await filterToFinishedLevels(LEARNER_A, skills)).toEqual([]);

    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    await complete(LEARNER_A, "base2");
    const afterBase = await filterToFinishedLevels(LEARNER_A, skills);
    expect(afterBase.map((s) => s.lessonId)).toEqual([lessonId("base1")]);

    await complete(LEARNER_A, "group1");
    const afterGroup = await filterToFinishedLevels(LEARNER_A, skills);
    expect(afterGroup.map((s) => s.lessonId).sort()).toEqual([lessonId("base1"), lessonId("group1")].sort());
  });

  it("returns no knowledge for a level the learner has no assigned lessons in", async () => {
    // An unenrolled learner has no assigned base lessons, so base is not treated as finished for the agent.
    const unenrolled = "lvl-learner-unenrolled";
    await seed("user", [{ id: unenrolled, email: "level-unenrolled@example.test", fullName: "Unenrolled", role: "STUDENT", isActive: true, isEmailVerified: true }]);
    const filtered = await filterToFinishedLevels(unenrolled, [{ lessonId: lessonId("base1") }, { lessonId: lessonId("group1") }]);
    expect(filtered).toEqual([]);
  });

  it("serves the integration route with the level filter and keeps the existing auth and scope checks", async () => {
    // Integration callers are denied unless INTEGRATION_SERVICE_SCOPES grants them a company (fail closed).
    const previousScopes = process.env.INTEGRATION_SERVICE_SCOPES;
    process.env.INTEGRATION_SERVICE_SCOPES = JSON.stringify({ "field-services": [], "ai-workforce": [EXT_ORG] });
    try {
    await seedCompetencies();
    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    await complete(LEARNER_A, "base2");

    const ok = await request(app).get(`/api/titan/integration/organisations/${EXT_ORG}/learners/${EXT_USER_A}/skills`)
      .set("x-titan-service", "ai-workforce").set("Authorization", `Bearer ${INTEGRATION_TOKEN}`);
    expect(ok.status).toBe(200);
    expect(ok.body.verifiedSkills.map((s: { lessonId: string }) => s.lessonId)).toEqual([lessonId("base1")]);

    const noToken = await request(app).get(`/api/titan/integration/organisations/${EXT_ORG}/learners/${EXT_USER_A}/skills`)
      .set("x-titan-service", "ai-workforce");
    expect(noToken.status).toBe(401);

    const otherOrg = await request(app).get(`/api/titan/integration/organisations/other-org/learners/${EXT_USER_A}/skills`)
      .set("x-titan-service", "ai-workforce").set("Authorization", `Bearer ${INTEGRATION_TOKEN}`);
    expect(otherOrg.status).toBe(404);
    } finally {
      if (previousScopes === undefined) delete process.env.INTEGRATION_SERVICE_SCOPES;
      else process.env.INTEGRATION_SERVICE_SCOPES = previousScopes;
    }
  });
});

describe("course lesson selection narrows the gate (PASS42)", () => {
  const select = (keys: string[]) =>
    seed("academyCourseLessonSelection", keys.map((key) => ({ courseId: COURSE, sourceId: `LVL-${key}`, savedById: TEACHER })));

  it("uses the full level map when no selection is saved", async () => {
    const levels = await levelsFor(LEARNER_A);
    expect(levels.base.lessonCount).toBe(2);
    expect(levels.group.lessonCount).toBe(1);
    expect(levels.specialised.lessonCount).toBe(2);
    expect((await getLearnerLevelView(LEARNER_A)).ungatedLessonCount).toBe(1);
  });

  it("counts only the selected lessons in each level, and leaves the rest ungated", async () => {
    await select(["base1", "group1"]);
    const levels = await levelsFor(LEARNER_A);
    expect(levels.base.lessonCount).toBe(1);
    expect(levels.group.lessonCount).toBe(1);
    expect(levels.specialised.lessonCount).toBe(0);
    // base2, spec1, spec2 are outside the selection and app1 has no map entry: five lessons are ungated.
    expect((await getLearnerLevelView(LEARNER_A)).ungatedLessonCount).toBe(4);
  });

  it("finishes base when only the selected base lesson is complete", async () => {
    await select(["base1", "group1"]);
    expect((await levelsFor(LEARNER_A)).group).toMatchObject({ status: "locked", waitingOn: "base" });

    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    const levels = await levelsFor(LEARNER_A);
    expect(levels.base).toMatchObject({ finished: true, status: "finished", lessonCount: 1, completedCount: 1 });
    expect(levels.group).toMatchObject({ status: "in_progress", unlocked: true, reason: null });
  });

  it("treats a level with no selected lessons as finished, so the next level opens on the earlier ones alone", async () => {
    await select(["base1", "spec1", "spec2"]);
    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    const levels = await levelsFor(LEARNER_A);
    expect(levels.group).toMatchObject({ lessonCount: 0, finished: true });
    expect(levels.specialised).toMatchObject({ status: "in_progress", unlocked: true, lessonCount: 2 });
  });

  it("does not block or list a deselected lesson, while a selected lesson in the same locked level stays locked", async () => {
    await select(["base1", "spec1", "spec2"]);
    // base is unfinished. group1 is outside the selection, so it is not gated and can be acknowledged.
    const ack = await request(app).post(`${CURRICULUM}/completions`).set(auth(LEARNER_A))
      .send({ lessonId: lessonId("group1"), revisionId: revisionId("group1") });
    expect(ack.status).toBe(200);

    // The outline lists only the selected lessons, so the deselected group1 is not shown.
    const outline = await request(app).get(`${CURRICULUM}/courses/${COURSE}/outline`).set(auth(LEARNER_A));
    const placements = outline.body.data.tracks[0].track.placements as Array<{ lesson: { sourceId: string }; levelLock: unknown; revision: { body: unknown } }>;
    expect(placements.find((p) => p.lesson.sourceId === "LVL-group1")).toBeUndefined();
    const spec = placements.find((p) => p.lesson.sourceId === "LVL-spec1")!;
    expect(spec.levelLock).toMatchObject({ level: "specialised", waitingOn: "base" });

    // A selected specialised lesson is still refused.
    const refused = await request(app).post(`${CURRICULUM}/knowledge-checks/attempts`).set(auth(LEARNER_A))
      .send({ lessonId: lessonId("spec2"), revisionId: revisionId("spec2"), answers: [1, 1] });
    expect(refused.status).toBe(403);
  });
});

describe("course lesson selection is scoped to each organisation (PASS42)", () => {
  const ORG_B = "lvl-org-b";
  const LEARNER_C = "lvl-learner-c";
  // companyId null is the course-wide default; a value is that organisation's own selection.
  const selectFor = (companyId: string | null, keys: string[]) =>
    seed("academyCourseLessonSelection", keys.map((key) => ({ courseId: COURSE, companyId, sourceId: `LVL-${key}`, savedById: TEACHER })));

  beforeEach(async () => {
    await seed("user", [{ id: LEARNER_C, email: "level-c@example.test", fullName: "Level Learner C", role: "STUDENT", isActive: true, isEmailVerified: true }]);
    await seed("company", [{ id: ORG_B, name: "Second Level Organisation", externalRef: "ext-org-levels-b" }]);
    await seed("enrollment", [{ studentId: LEARNER_C, courseId: COURSE, status: "ACTIVE" }]);
    await seed("academyTrainingAssignment", [
      { companyId: ORG_B, learnerId: LEARNER_C, assignedById: TEACHER, courseId: COURSE, status: "ASSIGNED" },
    ]);
  });

  it("organisation A's selection does not change organisation B's gate", async () => {
    await selectFor(ORG, ["base1", "group1"]);
    const a = await levelsFor(LEARNER_A);
    expect([a.base.lessonCount, a.group.lessonCount, a.specialised.lessonCount]).toEqual([1, 1, 0]);
    // Organisation B has no selection and there is no default, so its learner sees the full level map.
    const b = await levelsFor(LEARNER_C);
    expect([b.base.lessonCount, b.group.lessonCount, b.specialised.lessonCount]).toEqual([2, 1, 2]);
  });

  it("the course-wide default still applies to an organisation with no selection of its own", async () => {
    await selectFor(null, ["base1", "spec1"]);
    const b = await levelsFor(LEARNER_C);
    expect([b.base.lessonCount, b.group.lessonCount, b.specialised.lessonCount]).toEqual([1, 0, 1]);
    // A learner with no organisation assignment at all also gets the default.
    const plain = await levelsFor(LEARNER_B);
    expect([plain.base.lessonCount, plain.group.lessonCount, plain.specialised.lessonCount]).toEqual([1, 0, 1]);
  });

  it("an organisation's own selection overrides the course-wide default for its learners only", async () => {
    await selectFor(null, ["base1", "spec1"]);
    await selectFor(ORG, ["base2"]);
    const a = await levelsFor(LEARNER_A);
    expect([a.base.lessonCount, a.group.lessonCount, a.specialised.lessonCount]).toEqual([1, 0, 0]);
    const b = await levelsFor(LEARNER_C);
    expect([b.base.lessonCount, b.group.lessonCount, b.specialised.lessonCount]).toEqual([1, 0, 1]);
  });
});

describe("learner isolation", () => {
  it("returns only the caller's own levels", async () => {
    await complete(LEARNER_A, "base1");
    await attempt(LEARNER_A, "base1", true);
    await complete(LEARNER_A, "base2");

    const mine = await request(app).get(`${CURRICULUM}/levels/me`).set(auth(LEARNER_A));
    expect(mine.status).toBe(200);
    expect(mine.body.data.levels[0]).toMatchObject({ level: "base", finished: true, completedCount: 2 });

    const theirs = await request(app).get(`${CURRICULUM}/levels/me`).set(auth(LEARNER_B));
    expect(theirs.status).toBe(200);
    expect(theirs.body.data.levels[0]).toMatchObject({ level: "base", finished: false, completedCount: 0, status: "in_progress" });
    expect(theirs.body.data.levels[1]).toMatchObject({ level: "group", status: "locked" });
  });

  it("has no route that takes another learner's id, and requires authentication", async () => {
    const other = await request(app).get(`${CURRICULUM}/levels/${LEARNER_A}`).set(auth(LEARNER_B));
    expect(other.status).toBe(404);
    const anonymous = await request(app).get(`${CURRICULUM}/levels/me`);
    expect(anonymous.status).toBe(401);
  });
});
