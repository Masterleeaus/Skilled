/**
 * PASS42 course lesson selection API: pool, selection read and save, and who may change it.
 * Uses the real router over the in-memory Prisma double. All identifiers are synthetic except the real
 * `appliance` level CSV, which is read from the compiled map.
 */
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "pass42-selection-test-secret", JWT_ACCESS_EXPIRES: "15m", NODE_ENV: "test" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { resetFakeDb, rows, seed } from "./support/fake-prisma";
import { token } from "./support/academy-fixtures";
import courseSelectionRoutes from "../modules/course-selection/course-selection.routes";
import { loadSavedSelection } from "../modules/course-selection/course-selection.service";
import { courseLevelEntries, CourseLevelMap, setCourseLevelMapForTests } from "../modules/levels/level-rules";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/course-selection", courseSelectionRoutes);
app.use(errorHandler);

const BASE = "/api/academy/course-selection";
const OWNER = "sel-owner";
const OTHER_TEACHER = "sel-other-teacher";
const LEARNER = "sel-learner";
const ADMIN = "sel-admin";
const ORG_OWNER = "sel-org-owner";
const ORG_OWNER_UNASSIGNED = "sel-org-owner-unassigned";
const COURSE = "sel-course";
const OTHER_COURSE = "sel-other-course";
const APPLIANCE_COURSE = "sel-appliance";
const ORG = "sel-org";
const ORG_UNASSIGNED = "sel-org-unassigned";
const ORG_B = "sel-org-b";
const ORG_B_OWNER = "sel-org-b-owner";
const LEARNER_B = "sel-learner-b";

// Fixture map for the test course. Keys are curriculum sourceIds, as in the level CSVs.
const FIXTURE_MAP: CourseLevelMap = {
  [COURSE]: { "LVL-base1": "base", "LVL-base2": "base", "LVL-group1": "group", "LVL-spec1": "specialised" },
  [OTHER_COURSE]: { "LVL-other1": "base" },
};

const auth = (userId: string, role: string) => ({ Authorization: `Bearer ${token(userId, role)}` });
const poolUrl = (courseId: string) => `${BASE}/courses/${courseId}/lesson-pool`;
const selectionUrl = (courseId: string) => `${BASE}/courses/${courseId}/lesson-selection`;
const selectedIds = (courseId: string) => rows("academyCourseLessonSelection").filter((row) => row.courseId === courseId).map((row) => row.sourceId).sort();
/** Saved sourceIds for one scope only: an organisation, or the course-wide default when null. */
const scopedIds = (courseId: string, companyId: string | null) => rows("academyCourseLessonSelection")
  .filter((row) => row.courseId === courseId && (row.companyId ?? null) === companyId)
  .map((row) => row.sourceId)
  .sort();

beforeEach(async () => {
  resetFakeDb();
  setCourseLevelMapForTests(FIXTURE_MAP);
  await seed("user", [
    { id: OWNER, email: "sel-owner@example.test", fullName: "Owner Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: OTHER_TEACHER, email: "sel-other@example.test", fullName: "Other Teacher", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: LEARNER, email: "sel-learner@example.test", fullName: "Learner", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: ADMIN, email: "sel-admin@example.test", fullName: "Admin", role: "ADMIN", isActive: true, isEmailVerified: true },
    { id: ORG_OWNER, email: "sel-org-owner@example.test", fullName: "Org Owner", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: ORG_OWNER_UNASSIGNED, email: "sel-org-owner2@example.test", fullName: "Org Owner Two", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: ORG_B_OWNER, email: "sel-org-b-owner@example.test", fullName: "Org B Owner", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: LEARNER_B, email: "sel-learner-b@example.test", fullName: "Learner B", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("course", [
    { id: COURSE, title: "Selection Course", slug: COURSE, teacherId: OWNER, isPublished: true },
    { id: OTHER_COURSE, title: "Other Course", slug: OTHER_COURSE, teacherId: OTHER_TEACHER, isPublished: true },
    { id: APPLIANCE_COURSE, title: "Appliance Course", slug: "appliance", teacherId: OWNER, isPublished: true },
  ]);
  await seed("company", [{ id: ORG, name: "Selection Org" }, { id: ORG_UNASSIGNED, name: "Unassigned Org" }, { id: ORG_B, name: "Second Org" }]);
  await seed("companyMember", [
    { companyId: ORG, userId: ORG_OWNER, role: "OWNER" },
    { companyId: ORG_UNASSIGNED, userId: ORG_OWNER_UNASSIGNED, role: "OWNER" },
    { companyId: ORG_B, userId: ORG_B_OWNER, role: "OWNER" },
  ]);
  await seed("academyTrainingAssignment", [
    { companyId: ORG, learnerId: LEARNER, assignedById: OWNER, courseId: COURSE, status: "ASSIGNED" },
    { companyId: ORG_B, learnerId: LEARNER_B, assignedById: OWNER, courseId: COURSE, status: "ASSIGNED" },
  ]);
  await seed("academyContentLesson", [
    { id: "lesson-sel-base1", sourceId: "LVL-base1", layer: "base", serviceGroup: "GENERAL", unit: "U1", title: "Base one", objective: "o", assessment: "a", sourceVersion: "1", sourceHash: "h1" },
  ]);
});

afterEach(() => setCourseLevelMapForTests(null));

describe("pool and default selection", () => {
  it("returns the course pool from the level map, in level order, with counts and titles where a lesson exists", async () => {
    const res = await request(app).get(poolUrl(COURSE)).set(auth(OWNER, "TEACHER"));
    expect(res.status).toBe(200);
    expect(res.body.data.lessons.map((lesson: { sourceId: string }) => lesson.sourceId)).toEqual(["LVL-base1", "LVL-base2", "LVL-group1", "LVL-spec1"]);
    expect(res.body.data.lessons[0]).toMatchObject({ sourceId: "LVL-base1", level: "base", title: "Base one" });
    expect(res.body.data.lessons[1].title).toBeNull();
    expect(res.body.data.countsByLevel).toEqual({ base: 2, group: 1, specialised: 1 });
  });

  it("uses the full level CSV for the appliance course, including override rows and without map-only rows", async () => {
    setCourseLevelMapForTests(null);
    const res = await request(app).get(poolUrl(APPLIANCE_COURSE)).set(auth(OWNER, "TEACHER"));
    expect(res.status).toBe(200);
    const byId = Object.fromEntries(res.body.data.lessons.map((lesson: { sourceId: string; level: string }) => [lesson.sourceId, lesson.level]));
    expect(byId["NEW-APP-03"]).toBe("base");
    expect(byId["C01-L01"]).toBeUndefined();
    expect(res.body.data.lessons).toHaveLength(Object.keys(courseLevelEntries("appliance")).length);
  });

  it("reports a course with no saved selection as using its full level", async () => {
    const res = await request(app).get(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER"));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ usesFullLevel: true, sourceIds: [], savedAt: null, countsByLevel: { base: 2, group: 1, specialised: 1 } });
  });
});

describe("saving a selection", () => {
  it("lets the course owner save a selection, which then narrows the counts and records who saved it", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER"))
      .send({ sourceIds: ["LVL-base1", "LVL-group1"] });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ usesFullLevel: false, sourceIds: ["LVL-base1", "LVL-group1"], countsByLevel: { base: 1, group: 1, specialised: 0 } });
    expect(rows("academyCourseLessonSelection").every((row) => row.savedById === OWNER)).toBe(true);

    const read = await request(app).get(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER"));
    expect(read.body.data.usesFullLevel).toBe(false);
    expect(read.body.data.savedAt).not.toBeNull();
  });

  it("replaces the previous selection and collapses duplicate IDs", async () => {
    await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["LVL-base1", "LVL-base2"] });
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["LVL-spec1", "LVL-spec1"] });
    expect(res.status).toBe(200);
    expect(selectedIds(COURSE)).toEqual(["LVL-spec1"]);
  });

  it("lets a platform admin save any course's selection", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(ADMIN, "ADMIN")).send({ sourceIds: ["LVL-base2"] });
    expect(res.status).toBe(200);
    expect(selectedIds(COURSE)).toEqual(["LVL-base2"]);
  });

  it("lets an organisation owner save their own organisation's selection, and refuses one with no assignment", async () => {
    const allowed = await request(app).put(selectionUrl(COURSE)).set(auth(ORG_OWNER, "STUDENT")).send({ companyId: ORG, sourceIds: ["LVL-base1"] });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data).toMatchObject({ companyId: ORG, source: "ORGANISATION", ownSelection: true, sourceIds: ["LVL-base1"] });

    const refused = await request(app).put(selectionUrl(COURSE)).set(auth(ORG_OWNER_UNASSIGNED, "STUDENT")).send({ companyId: ORG_UNASSIGNED, sourceIds: ["LVL-base2"] });
    expect(refused.status).toBe(403);
    expect(scopedIds(COURSE, ORG)).toEqual(["LVL-base1"]);
    expect(scopedIds(COURSE, ORG_UNASSIGNED)).toEqual([]);
  });
});

describe("organisation scope", () => {
  it("keeps each organisation's selection separate, so one organisation's change does not reach another", async () => {
    await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["LVL-base2"] });
    const b = await request(app).put(selectionUrl(COURSE)).set(auth(ORG_B_OWNER, "STUDENT")).send({ companyId: ORG_B, sourceIds: ["LVL-spec1"] });
    expect(b.status).toBe(200);
    const a = await request(app).put(selectionUrl(COURSE)).set(auth(ORG_OWNER, "STUDENT")).send({ companyId: ORG, sourceIds: ["LVL-base1", "LVL-group1"] });
    expect(a.status).toBe(200);

    expect(scopedIds(COURSE, ORG)).toEqual(["LVL-base1", "LVL-group1"]);
    expect(scopedIds(COURSE, ORG_B)).toEqual(["LVL-spec1"]);
    expect(scopedIds(COURSE, null)).toEqual(["LVL-base2"]);
    expect(await loadSavedSelection(COURSE, LEARNER)).toEqual(new Set(["LVL-base1", "LVL-group1"]));
    expect(await loadSavedSelection(COURSE, LEARNER_B)).toEqual(new Set(["LVL-spec1"]));
  });

  it("applies the course-wide default to an organisation with no selection of its own", async () => {
    await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["LVL-base2"] });
    const read = await request(app).get(selectionUrl(COURSE)).query({ companyId: ORG }).set(auth(ORG_OWNER, "STUDENT"));
    expect(read.status).toBe(200);
    expect(read.body.data).toMatchObject({ companyId: ORG, source: "COURSE_DEFAULT", usesFullLevel: false, ownSelection: false, sourceIds: ["LVL-base2"] });
    expect(await loadSavedSelection(COURSE, LEARNER)).toEqual(new Set(["LVL-base2"]));
    expect(await loadSavedSelection(COURSE, "sel-no-assignment")).toEqual(new Set(["LVL-base2"]));
  });

  it("gives a learner their organisation's selection, and the full level when no selection applies", async () => {
    expect(await loadSavedSelection(COURSE, LEARNER)).toBeUndefined();
    await request(app).put(selectionUrl(COURSE)).set(auth(ORG_OWNER, "STUDENT")).send({ companyId: ORG, sourceIds: ["LVL-base1"] });
    expect(await loadSavedSelection(COURSE, LEARNER)).toEqual(new Set(["LVL-base1"]));
    expect(await loadSavedSelection(COURSE, LEARNER_B)).toBeUndefined();
  });

  it("refuses an organisation owner the course-wide default, and another organisation's selection, on read and write", async () => {
    const writeDefault = await request(app).put(selectionUrl(COURSE)).set(auth(ORG_OWNER, "STUDENT")).send({ sourceIds: ["LVL-base1"] });
    const readDefault = await request(app).get(selectionUrl(COURSE)).set(auth(ORG_OWNER, "STUDENT"));
    const writeOther = await request(app).put(selectionUrl(COURSE)).set(auth(ORG_B_OWNER, "STUDENT")).send({ companyId: ORG, sourceIds: ["LVL-base1"] });
    const readOther = await request(app).get(selectionUrl(COURSE)).query({ companyId: ORG }).set(auth(ORG_B_OWNER, "STUDENT"));
    expect([writeDefault.status, readDefault.status, writeOther.status, readOther.status]).toEqual([403, 403, 403, 403]);
    expect(rows("academyCourseLessonSelection")).toHaveLength(0);
  });

  it("lets the course teacher manage a named organisation's selection without touching the course-wide default", async () => {
    await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["LVL-base2"] });
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ companyId: ORG, sourceIds: ["LVL-spec1"] });
    expect(res.status).toBe(200);
    expect(scopedIds(COURSE, ORG)).toEqual(["LVL-spec1"]);
    expect(scopedIds(COURSE, null)).toEqual(["LVL-base2"]);
  });

  it("keeps an organisation's previous selection when its new save names a lesson outside the pool", async () => {
    await request(app).put(selectionUrl(COURSE)).set(auth(ORG_OWNER, "STUDENT")).send({ companyId: ORG, sourceIds: ["LVL-base1"] });
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(ORG_OWNER, "STUDENT")).send({ companyId: ORG, sourceIds: ["NO-SUCH-LESSON"] });
    expect(res.status).toBe(422);
    expect(scopedIds(COURSE, ORG)).toEqual(["LVL-base1"]);
  });

  it("refuses an companyId that is not a non-empty string", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ companyId: 5, sourceIds: ["LVL-base1"] });
    expect(res.status).toBe(422);
    expect(rows("academyCourseLessonSelection")).toHaveLength(0);
  });
});

describe("refusals", () => {
  it("refuses a learner on every route, and writes nothing", async () => {
    const pool = await request(app).get(poolUrl(COURSE)).set(auth(LEARNER, "STUDENT"));
    const read = await request(app).get(selectionUrl(COURSE)).set(auth(LEARNER, "STUDENT"));
    const save = await request(app).put(selectionUrl(COURSE)).set(auth(LEARNER, "STUDENT")).send({ sourceIds: ["LVL-base1"] });
    expect([pool.status, read.status, save.status]).toEqual([403, 403, 403]);
    expect(rows("academyCourseLessonSelection")).toHaveLength(0);
  });

  it("refuses an owner of a different course", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OTHER_TEACHER, "TEACHER")).send({ sourceIds: ["LVL-base1"] });
    expect(res.status).toBe(403);
    expect(rows("academyCourseLessonSelection")).toHaveLength(0);
  });

  it("refuses an unauthenticated caller", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).send({ sourceIds: ["LVL-base1"] });
    expect(res.status).toBe(401);
  });

  it("returns 404 for a course that does not exist", async () => {
    const res = await request(app).put(selectionUrl("no-such-course")).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["LVL-base1"] });
    expect(res.status).toBe(404);
  });

  it("refuses a lesson ID that is not in the course's pool, and keeps the previous selection", async () => {
    await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["LVL-base1"] });
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER"))
      .send({ sourceIds: ["LVL-base2", "NO-SUCH-LESSON"] });
    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual([expect.objectContaining({ code: "UNKNOWN_LESSON", sourceIds: ["NO-SUCH-LESSON"] })]);
    expect(selectedIds(COURSE)).toEqual(["LVL-base1"]);
  });

  it("refuses a lesson ID that is only an inherited object property", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: ["constructor"] });
    expect(res.status).toBe(422);
    expect(selectedIds(COURSE)).toEqual([]);
  });

  it("refuses an empty selection, so a course cannot silently drop all gating", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: [] });
    expect(res.status).toBe(422);
    expect(selectedIds(COURSE)).toEqual([]);
  });

  it("refuses a body that is not a list of IDs", async () => {
    const res = await request(app).put(selectionUrl(COURSE)).set(auth(OWNER, "TEACHER")).send({ sourceIds: "LVL-base1" });
    expect(res.status).toBe(422);
  });
});
