/**
 * PASS42 pathway enrolment, progress and access rules.
 * Runs the real pathway and enrolment services against the in-memory Prisma double.
 * Access checks also run through the pathway router over HTTP.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../config/logger", () => ({
  logger: { error: () => undefined, warn: () => undefined, info: () => undefined },
  httpLogStream: { write: () => undefined },
}));
// The real middleware needs JWT configuration. The stub reads the user id from a test header.
vi.mock("../middleware/authenticate", () => ({
  authenticate: (req: { headers: Record<string, unknown>; user?: unknown }, res: { status: (n: number) => { json: (b: unknown) => void } }, next: () => void) => {
    const userId = req.headers["x-test-user"];
    if (typeof userId !== "string") return res.status(401).json({ success: false, message: "No token provided" });
    req.user = { userId, role: "STUDENT" };
    next();
  },
}));

import { readFileSync } from "node:fs";
import path from "node:path";
import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { seedPathways, PathwaysFile, SERVICE_ITEM_KEY } from "../modules/pathways/pathway.seed";
import { enrolInPathway, getLearnerProgress, listPathways, assertCanEnrol } from "../modules/pathways/pathway.service";
import { enrollInCourse } from "../modules/enrollment/enrollment.service";
import pathwayRoutes from "../modules/pathways/pathway.routes";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler";

const LEARNER = "learner-1";
const OTHER = "learner-2";
const OWNER = "owner-1";
const MANAGER_ELSEWHERE = "manager-2";
const OUTSIDER = "outsider-1";
const ORG = "org-1";
const OTHER_ORG = "org-2";

const TEAM = "PATH-TEAM-MEMBER";
const SOLO = "PATH-SOLO";
const SAFETY = "module:Workplace safety and risk";

const app = express();
app.use(express.json());
app.use("/api/academy/pathways", pathwayRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const pathwaysFile = JSON.parse(readFileSync(path.resolve(__dirname, "../../../../curriculum/structure/PATHWAYS.json"), "utf8")) as PathwaysFile;

function pathwayId(code: string) {
  return rows("academyCurriculumPathway").find((row) => row.code === code)!.id;
}

/** Fixture course items, added after seeding. They exercise the course rules. Base modules come from the seed. */
async function addCourseItems(code: string, items: Array<{ slug: string; required: boolean }>, startPosition = 100) {
  await seed(
    "academyPathwayCourse",
    items.map((item, index) => ({ pathwayId: pathwayId(code), courseSlug: item.slug, required: item.required, position: startPosition + index, createdAt: new Date() })),
  );
}

async function setUp() {
  await seed("user", [LEARNER, OTHER, OWNER, MANAGER_ELSEWHERE, OUTSIDER].map((id) => ({ id, email: `${id}@example.test`, fullName: id, role: "STUDENT", passwordHash: "x" })));
  await seed("company", [{ id: ORG, name: "Org one" }, { id: OTHER_ORG, name: "Org two" }]);
  await seed("companyMember", [
    { companyId: ORG, userId: OWNER, role: "OWNER" },
    { companyId: ORG, userId: LEARNER, role: "LEARNER" },
    { companyId: ORG, userId: OTHER, role: "LEARNER" },
    { companyId: OTHER_ORG, userId: MANAGER_ELSEWHERE, role: "MANAGER" },
  ]);
  await seed("course", [
    { id: "c-residential", title: "Residential", slug: "residential", isPublished: true, price: 0 },
    { id: "c-bond", title: "Bond", slug: "bond", isPublished: true, price: 0 },
    { id: "c-carpet", title: "Carpet", slug: "carpet", isPublished: true, price: 0 },
    { id: "c-strata", title: "Strata", slug: "strata", isPublished: false, price: 0 },
  ]);
  await seedPathways(fakePrisma as never, pathwaysFile);
  await addCourseItems(TEAM, [
    { slug: "residential", required: true },
    { slug: "bond", required: true },
    { slug: "strata", required: false },
  ]);
}

/** Three Universal "Workplace Safety & Risk" lessons placed in a track on residential, plus one not on any enrolled course. */
async function addSafetyLessons() {
  const lesson = (id: string, layer: string, title: string) => ({
    id, sourceId: id, layer, serviceGroup: "All home services", unit: "Workplace Safety & Risk", title,
    objective: "o", assessment: "a", sourceVersion: "v1", sourceHash: id, contentStatus: "PUBLISHED",
  });
  await seed("academyContentLesson", [
    lesson("L1", "Universal", "One"), lesson("L2", "Universal", "Two"), lesson("L3", "Universal", "Three"),
    lesson("VERT", "Vertical", "Vertical lesson, same unit"), lesson("CARPET-ONLY", "Universal", "Not on an enrolled course"),
  ]);
  // Completions reference a revision of their lesson (foreign key); complete() uses the id rev-<lessonId>.
  await seed("academyLessonRevision", ["L1", "L2", "L3", "VERT", "CARPET-ONLY"].map((id) => ({
    id: `rev-${id}`, lessonId: id, version: 1, body: {}, contentHash: `h-${id}`, status: "PUBLISHED", publishedAt: new Date(),
  })));
  await seed("academyCurriculumTrack", [
    { id: "track-safety", slug: "safety", title: "Safety", serviceGroup: null, status: "PUBLISHED" },
    { id: "track-carpet", slug: "carpet-safety", title: "Carpet", serviceGroup: null, status: "PUBLISHED" },
  ]);
  await seed("academyCourseTrack", [
    { courseId: "c-residential", trackId: "track-safety", position: 1, required: true },
    { courseId: "c-carpet", trackId: "track-carpet", position: 1, required: true },
  ]);
  await seed("academyLessonPlacement", [
    { trackId: "track-safety", lessonId: "L1", position: 1 },
    { trackId: "track-safety", lessonId: "L2", position: 2 },
    { trackId: "track-safety", lessonId: "L3", position: 3 },
    { trackId: "track-safety", lessonId: "VERT", position: 4 },
    { trackId: "track-carpet", lessonId: "CARPET-ONLY", position: 1 },
  ]);
}

async function complete(learnerId: string, lessonId: string) {
  await seed("academyLearnerCompletion", [{ learnerId, lessonId, revisionId: `rev-${lessonId}` }]);
}

function enrolmentsFor(studentId: string) {
  return rows("enrollment").filter((row) => row.studentId === studentId);
}

function pathwayEnrolmentsFor(learnerId: string) {
  return rows("academyPathwayEnrolment").filter((row) => row.learnerId === learnerId);
}

beforeEach(() => {
  resetFakeDb();
});

describe("PASS42 pathway enrolment", () => {
  it("enrols a learner in required course items only, and not in optional ones", async () => {
    await setUp();
    const result = await enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {});

    expect(result.enrolment).toMatchObject({ learnerId: LEARNER, status: "ACTIVE", companyId: null });
    expect(result.courseEnrolmentsCreated).toBe(2);
    expect(enrolmentsFor(LEARNER).map((row) => row.courseId).sort()).toEqual(["c-bond", "c-residential"]);
  });

  it("prevents a duplicate pathway enrolment and creates no second course enrolment", async () => {
    await setUp();
    await enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {});

    await expect(enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {})).rejects.toMatchObject({ statusCode: 409 });
    expect(pathwayEnrolmentsFor(LEARNER)).toHaveLength(1);
    expect(enrolmentsFor(LEARNER)).toHaveLength(2);
  });

  it("reuses an existing course enrolment instead of duplicating it", async () => {
    await setUp();
    await enrollInCourse(LEARNER, "c-residential");
    const existing = enrolmentsFor(LEARNER)[0];

    const result = await enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {});

    expect(result).toMatchObject({ courseEnrolmentsCreated: 1, courseEnrolmentsReused: 1 });
    expect(enrolmentsFor(LEARNER)).toHaveLength(2);
    expect(enrolmentsFor(LEARNER).find((row) => row.courseId === "c-residential")?.id).toBe(existing.id);
  });

  it("removes course enrolments it created when a required course blocks enrolment, and writes no pathway row", async () => {
    await setUp();
    await addCourseItems(SOLO, [{ slug: "residential", required: true }, { slug: "strata", required: true }]);

    await expect(enrolInPathway({ userId: OTHER, role: "STUDENT" }, SOLO, { learnerId: OTHER })).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('Course "strata" blocks pathway enrolment'),
    });
    expect(enrolmentsFor(OTHER)).toHaveLength(0);
    expect(pathwayEnrolmentsFor(OTHER)).toHaveLength(0);
  });

  it("answers 422 when a required course item is missing from the catalogue", async () => {
    await setUp();
    await addCourseItems(TEAM, [{ slug: "ghost", required: true }], 200);
    await expect(enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {})).rejects.toMatchObject({ statusCode: 422 });
    expect(enrolmentsFor(LEARNER)).toHaveLength(0);
  });
});

describe("PASS42 pathway progress", () => {
  it("counts base-module progress from lessons delivered through enrolled courses only", async () => {
    await setUp();
    await addSafetyLessons();
    await enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {});

    const itemFor = async () => (await getLearnerProgress(LEARNER, TEAM, LEARNER)).progress.items.find((item) => item.key === SAFETY)!;

    // Three Universal lessons are on the enrolled course. The Vertical lesson and the carpet-only lesson are not counted.
    expect(await itemFor()).toMatchObject({ kind: "MODULE", state: "NOT_STARTED", lessonsCompleted: 0, lessonsTotal: 3 });

    await complete(LEARNER, "L1");
    expect(await itemFor()).toMatchObject({ state: "IN_PROGRESS", lessonsCompleted: 1, lessonsTotal: 3 });

    await complete(LEARNER, "L2");
    await complete(LEARNER, "L3");
    expect(await itemFor()).toMatchObject({ state: "COMPLETED", lessonsCompleted: 3, lessonsTotal: 3 });
  });

  it("reports a partly complete pathway by required items, with the service slot optional and not counted", async () => {
    await setUp();
    await addSafetyLessons();
    await enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {});

    let progress = (await getLearnerProgress(LEARNER, TEAM, LEARNER)).progress;
    // Team member: 7 required base modules + 2 required course items. Service slot and strata are excluded.
    expect(progress.requiredTotal).toBe(9);
    expect(progress.requiredCompleted).toBe(0);
    expect(progress.items.find((item) => item.key === SERVICE_ITEM_KEY)).toMatchObject({ kind: "SERVICE", required: false, state: "OPTIONAL" });
    expect(progress.items.find((item) => item.key === "strata")).toMatchObject({ required: false, state: "NOT_STARTED" });

    // Completing the residential course counts 1 required course, and the base lessons it delivers count too.
    await fakePrisma.enrollment.update({
      where: { id: enrolmentsFor(LEARNER).find((row) => row.courseId === "c-residential")!.id },
      data: { status: "COMPLETED", progressPercentage: 100, completedAt: new Date() },
    });
    for (const id of ["L1", "L2", "L3"]) await complete(LEARNER, id);
    progress = (await getLearnerProgress(LEARNER, TEAM, LEARNER)).progress;
    expect(progress).toMatchObject({ requiredCompleted: 2, requiredTotal: 9, percentage: 22, status: "IN_PROGRESS" });
  });

  it("shows the learner's progress on the pathway list", async () => {
    await setUp();
    await addSafetyLessons();
    await enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, {});
    await complete(LEARNER, "L1");

    const list = await listPathways(LEARNER);
    expect(list.find((item) => item.code === TEAM)?.progress).toMatchObject({ requiredTotal: 9, status: "IN_PROGRESS" });
    expect(list.find((item) => item.code === SOLO)?.enrolment).toBeNull();
  });
});

describe("PASS42 pathway access rules", () => {
  it("does not let a learner enrol another learner (service)", async () => {
    await setUp();
    await expect(enrolInPathway({ userId: LEARNER, role: "STUDENT" }, TEAM, { learnerId: OTHER, companyId: ORG })).rejects.toMatchObject({ statusCode: 403 });
    expect(pathwayEnrolmentsFor(OTHER)).toHaveLength(0);
    expect(enrolmentsFor(OTHER)).toHaveLength(0);
  });

  it("answers 403 over HTTP when a learner tries to enrol another learner, and writes nothing", async () => {
    await setUp();
    const res = await request(app).post(`/api/academy/pathways/${TEAM}/enrolments`).set("x-test-user", LEARNER).send({ learnerId: OTHER, companyId: ORG });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(pathwayEnrolmentsFor(OTHER)).toHaveLength(0);
    expect(enrolmentsFor(OTHER)).toHaveLength(0);
  });

  it("lets an organisation owner enrol a member of that organisation", async () => {
    await setUp();
    const res = await request(app).post(`/api/academy/pathways/${TEAM}/enrolments`).set("x-test-user", OWNER).send({ learnerId: OTHER, companyId: ORG });

    expect(res.status).toBe(201);
    expect(pathwayEnrolmentsFor(OTHER)).toMatchObject([{ companyId: ORG, status: "ACTIVE" }]);
  });

  it("refuses a manager of another organisation, an owner enrolling a non-member, and a learner claiming a foreign organisation", async () => {
    await setUp();
    await expect(assertCanEnrol(MANAGER_ELSEWHERE, OTHER, ORG)).rejects.toMatchObject({ statusCode: 403 });
    await expect(assertCanEnrol(OWNER, OUTSIDER, ORG)).rejects.toMatchObject({ statusCode: 403 });
    await expect(assertCanEnrol(LEARNER, LEARNER, OTHER_ORG)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("does not let a learner read another learner's progress, but lets the organisation owner read it", async () => {
    await setUp();
    await enrolInPathway({ userId: OWNER, role: "STUDENT" }, TEAM, { learnerId: OTHER, companyId: ORG });

    await expect(getLearnerProgress(LEARNER, TEAM, OTHER)).rejects.toMatchObject({ statusCode: 403 });
    const denied = await request(app).get(`/api/academy/pathways/${TEAM}/learners/${OTHER}/progress`).set("x-test-user", LEARNER);
    expect(denied.status).toBe(403);

    const allowed = await request(app).get(`/api/academy/pathways/${TEAM}/learners/${OTHER}/progress`).set("x-test-user", OWNER);
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.progress.requiredTotal).toBe(9);
  });

  it("answers 404 for an unknown pathway and 401 with no identity", async () => {
    await setUp();
    const unknown = await request(app).get("/api/academy/pathways/PATH-NOPE").set("x-test-user", LEARNER);
    expect(unknown.status).toBe(404);
    const anonymous = await request(app).get("/api/academy/pathways");
    expect(anonymous.status).toBe(401);
  });

  it("lets a learner see the pathway list and enrol themselves over HTTP", async () => {
    await setUp();
    const list = await request(app).get("/api/academy/pathways").set("x-test-user", LEARNER);
    expect(list.status).toBe(200);
    expect(list.body.data.map((item: { code: string }) => item.code)).toEqual(["PATH-SOLO", "PATH-TEAM-MEMBER", "PATH-TEAM-OWNER"]);

    const enrol = await request(app).post(`/api/academy/pathways/${TEAM}/enrolments`).set("x-test-user", LEARNER).send({});
    expect(enrol.status).toBe(201);
    expect(pathwayEnrolmentsFor(LEARNER)).toHaveLength(1);
  });
});
