/**
 * Licence track saved on the enrolment. Covers: the track set at free enrolment, the track carried through paid checkout
 * (Stripe SDK mocked, the real StripeProvider runs), the saved track used on the outline, body and progress when no
 * ?track= is sent, and the completion refusal. Runs over the in-memory Prisma double. Curriculum files are written to a
 * temporary folder, so nothing reads the repo's curriculum.
 */
import request from "supertest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const stripe = vi.hoisted(() => ({ create: vi.fn(), retrieve: vi.fn() }));

vi.mock("stripe", () => {
  class StripeMock {
    checkout = { sessions: { create: stripe.create, retrieve: stripe.retrieve } };
    refunds = { create: vi.fn() };
    webhooks = { constructEvent: vi.fn() };
  }
  return { default: StripeMock };
});

vi.mock("../config/env", () => ({
  env: {
    JWT_ACCESS_SECRET: "licence-track-saved-test-secret",
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
    STRIPE_SECRET_KEY: "sk_test_licence_track",
    STRIPE_WEBHOOK_SECRET: "",
  },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { env } from "../config/env";
import { fakePrisma as prisma, resetFakeDb, seed } from "./support/fake-prisma";
import { ids, publishFileBodies, seedAcademyFixture, token } from "./support/academy-fixtures";
import { app } from "../app";
import { resetFileLessonIndexForTests } from "../modules/curriculum/file-lesson-loader";
import { CourseLevelMap, setCourseLevelMapForTests } from "../modules/levels/level-rules";
import { LICENCE_EXCLUDED_MESSAGE, resetLicenceIndexForTests } from "../modules/curriculum/licence-track";

// Course IDs must be cuid-shaped: the enrolment and checkout validators require it.
const FREE_COURSE = "cjld2cyuq0001t3rmniod1foz";
const PAID_COURSE = "cjld2cyuq0002t3rmniod1foa";
const SECOND_COURSE = "cjld2cyuq0003t3rmniod1fob";

const OUTLINE = (track?: string) => `/api/academy/curriculum/courses/${ids.course}/outline${track === undefined ? "" : `?track=${track}`}`;
const BODY = (lessonId: string, track?: string) => `/api/academy/curriculum/courses/${ids.course}/lessons/${lessonId}/body${track === undefined ? "" : `?track=${track}`}`;
const PROGRESS = (track?: string) => `/api/academy/curriculum/courses/${ids.course}/progress/me${track === undefined ? "" : `?track=${track}`}`;
const COMPLETIONS = (query = "") => `/api/academy/curriculum/completions${query}`;
const auth = (userId: string, role = "STUDENT") => ({ Authorization: `Bearer ${token(userId, role)}` });

const MAP: CourseLevelMap = { "field-safety": { "TST-A": "base", "TST-B": "base", "TST-D": "group" } };

const LICENCE_FILE = {
  generated: "2026-11-03",
  rule: "fixture",
  lessons: [
    { lessonId: "TST-A", status: "threshold", limit: "Work up to 3 metres high", officialWording: "Work over this height needs a licence.", officialUrl: null, pageDate: null, states: "QLD", note: "internal reviewer note", scanFile: "result-01.json" },
    { lessonId: "TST-B", status: "required", limit: null, officialWording: ["Gas fitting of any value needs a licensed gasfitter. (WebFetch summary; not verbatim.)"], officialUrl: null, pageDate: null, states: "VIC", note: "Reviewer remark", scanFile: "result-01.json" },
  ],
};

let root: string;

function writeFile(base: string, relative: string, record: unknown): void {
  const file = path.join(base, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(record));
}

const sourceIdsOf = (body: any) => body.data.tracks.flatMap((t: any) => t.track.placements).map((p: any) => p.lesson.sourceId).sort();

beforeAll(() => {
  root = mkdtempSync(path.join(tmpdir(), "licence-track-saved-"));
  writeFile(root, "courses/field-safety/TST-A.json", { id: "TST-A", title: "Lesson A", courseSlugs: ["field-safety"], introduction: "Read this from the file." });
  writeFile(root, "courses/field-safety/TST-B.json", { id: "TST-B", title: "Lesson B", courseSlugs: ["field-safety"], introduction: "Gas fitting text that needs the licensed track." });
  writeFile(root, "courses/field-safety/TST-D.json", { id: "TST-D", title: "Lesson D", courseSlugs: ["field-safety"], introduction: "Group level text." });
  writeFile(root, "licence/lesson-licence.json", LICENCE_FILE);
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = root;
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = "";
  setCourseLevelMapForTests(null);
  resetLicenceIndexForTests();
});

beforeEach(async () => {
  resetFakeDb();
  resetFileLessonIndexForTests();
  resetLicenceIndexForTests();
  stripe.create.mockReset();
  stripe.retrieve.mockReset();
  (env as { CURRICULUM_DIR: string }).CURRICULUM_DIR = root;
  setCourseLevelMapForTests(MAP);
  await seedAcademyFixture();
  // Lesson D has no licence entry and sits in the group level. Same shape as the licence track suite.
  await seed("academyContentLesson", [{ id: "lesson-d", sourceId: "TST-D", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson D", objective: "O", assessment: "A", sourceVersion: "1", sourceHash: "h-d" }]);
  await seed("academyLessonRevision", [{ id: "rev-d1", lessonId: "lesson-d", version: 1, body: { introduction: "Group level text." }, contentHash: "d", status: "PUBLISHED", publishedAt: new Date() }]);
  await seed("academyLessonPlacement", [{ trackId: ids.track, lessonId: "lesson-d", revisionId: "rev-d1", position: 3, required: false }]);
  await publishFileBodies({
    "TST-B": { id: "TST-B", title: "Lesson B", courseSlugs: ["field-safety"], introduction: "Gas fitting text that needs the licensed track." },
    "TST-D": { id: "TST-D", title: "Lesson D", courseSlugs: ["field-safety"], introduction: "Group level text." },
  });
  await seed("course", [
    { id: FREE_COURSE, title: "Free Safety", slug: "free-safety", isPublished: true, price: 0 },
    { id: PAID_COURSE, title: "Paid Safety", slug: "paid-safety", isPublished: true, price: 25 },
    { id: SECOND_COURSE, title: "Second Safety", slug: "second-safety", isPublished: true, price: 0 },
  ]);
  // learner-1 keeps the default (non-licensed) enrolment from the fixture. learner-2 chose the licensed track.
  await prisma.enrollment.update({ where: { studentId_courseId: { studentId: ids.learner2, courseId: ids.course } }, data: { licenceTrack: "licensed" } });
});

describe("saved track is used when no ?track= is sent", () => {
  it("the outline follows the saved licensed track", async () => {
    const res = await request(app).get(OUTLINE()).set(auth(ids.learner2));
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("licensed");
    expect(sourceIdsOf(res.body)).toEqual(["TST-A", "TST-B", "TST-D"]);
  });

  it("the outline follows the saved non-licensed track", async () => {
    const res = await request(app).get(OUTLINE()).set(auth(ids.learner1));
    expect(res.body.data.licenceTrack).toBe("non-licensed");
    expect(sourceIdsOf(res.body)).toEqual(["TST-A", "TST-D"]);
  });

  it("a ?track= in the URL does not override the saved track on the outline", async () => {
    const licensedLearner = await request(app).get(OUTLINE("non-licensed")).set(auth(ids.learner2));
    expect(licensedLearner.body.data.licenceTrack).toBe("licensed");
    expect(sourceIdsOf(licensedLearner.body)).toEqual(["TST-A", "TST-B", "TST-D"]);
    const nonLicensedLearner = await request(app).get(OUTLINE("licensed")).set(auth(ids.learner1));
    expect(nonLicensedLearner.body.data.licenceTrack).toBe("non-licensed");
    expect(sourceIdsOf(nonLicensedLearner.body)).toEqual(["TST-A", "TST-D"]);
  });

  it("the body follows the saved track, and an excluded body is refused with the same code as before", async () => {
    const licensed = await request(app).get(BODY("TST-B")).set(auth(ids.learner2));
    expect(licensed.status).toBe(200);
    expect(licensed.body.data.introduction).toBe("Gas fitting text that needs the licensed track.");

    const nonLicensed = await request(app).get(BODY("TST-B")).set(auth(ids.learner1));
    expect(nonLicensed.status).toBe(403);
    expect(nonLicensed.body.message).toBe(LICENCE_EXCLUDED_MESSAGE);
    expect(nonLicensed.body.errors).toEqual([{ code: "LICENCE_TRACK_EXCLUDED", track: "non-licensed" }]);
  });

  it("a non-licensed enrolled learner gets 403 for a licence-required lesson body even with ?track=licensed", async () => {
    const res = await request(app).get(BODY("TST-B", "licensed")).set(auth(ids.learner1));
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(LICENCE_EXCLUDED_MESSAGE);
    expect(res.body.errors).toEqual([{ code: "LICENCE_TRACK_EXCLUDED", track: "non-licensed" }]);
    expect(JSON.stringify(res.body)).not.toContain("Gas fitting text");
  });

  it("a licensed enrolled learner with ?track=non-licensed still reads the licence-required body, because the saved track wins", async () => {
    const res = await request(app).get(BODY("TST-B", "non-licensed")).set(auth(ids.learner2));
    expect(res.status).toBe(200);
    expect(res.body.data.introduction).toBe("Gas fitting text that needs the licensed track.");
  });

  it("an enrolled learner with ?track=everything gets the saved track on the outline, not a 422", async () => {
    const res = await request(app).get(OUTLINE("everything")).set(auth(ids.learner1));
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("non-licensed");
    expect(sourceIdsOf(res.body)).toEqual(["TST-A", "TST-D"]);
  });

  it("staff enrolled on the course keep the ?track= preview, and the saved track applies when none is sent", async () => {
    await seed("enrollment", [{ studentId: ids.manager, courseId: ids.course, status: "ACTIVE", licenceTrack: "non-licensed" }]);
    const preview = await request(app).get(OUTLINE("licensed")).set(auth(ids.manager, "TEACHER"));
    expect(preview.body.data.licenceTrack).toBe("licensed");
    expect(sourceIdsOf(preview.body)).toEqual(["TST-A", "TST-B", "TST-D"]);
    const saved = await request(app).get(OUTLINE()).set(auth(ids.manager, "TEACHER"));
    expect(saved.body.data.licenceTrack).toBe("non-licensed");
  });

  it("progress counts follow the saved track", async () => {
    const licensed = await request(app).get(PROGRESS()).set(auth(ids.learner2));
    expect(licensed.body.data.lessonCount).toBe(3);
    const nonLicensed = await request(app).get(PROGRESS()).set(auth(ids.learner1));
    expect(nonLicensed.body.data.lessonCount).toBe(2);
    expect(nonLicensed.body.data.lessons.map((l: any) => l.sourceId).sort()).toEqual(["TST-A", "TST-D"]);
  });
});

describe("the track is set at free enrolment", () => {
  it("saves the licensed track when the learner enrols with it", async () => {
    const res = await request(app).post("/api/enrollments").set(auth(ids.outsider)).send({ courseId: FREE_COURSE, licenceTrack: "licensed" });
    expect(res.status).toBe(201);
    expect(res.body.data.licenceTrack).toBe("licensed");
    const saved = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: ids.outsider, courseId: FREE_COURSE } } });
    expect(saved.licenceTrack).toBe("licensed");
  });

  it("saves the non-licensed default when no track is sent", async () => {
    const res = await request(app).post("/api/enrollments").set(auth(ids.outsider)).send({ courseId: FREE_COURSE });
    expect(res.status).toBe(201);
    expect(res.body.data.licenceTrack).toBe("non-licensed");
  });

  it("refuses an unknown track at enrolment with a validation error", async () => {
    const res = await request(app).post("/api/enrollments").set(auth(ids.outsider)).send({ courseId: FREE_COURSE, licenceTrack: "everything" });
    expect(res.status).toBe(422);
    expect(await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: ids.outsider, courseId: FREE_COURSE } } })).toBeNull();
  });
});

describe("the track passes through paid checkout", () => {
  const session = (overrides: Record<string, unknown>) => ({
    id: "cs_test_licence_track",
    payment_status: "paid",
    status: "complete",
    amount_total: 2500,
    currency: "usd",
    metadata: { courseId: PAID_COURSE, studentId: ids.outsider, licenceTrack: "licensed" },
    ...overrides,
  });

  it("sends the track to Stripe in the return URL and metadata, and records it on the payment", async () => {
    stripe.create.mockResolvedValue({ id: "cs_test_licence_track", url: "https://checkout.example.test/cs_test_licence_track" });
    const res = await request(app).post("/api/payments/checkout").set(auth(ids.outsider)).send({ courseId: PAID_COURSE, licenceTrack: "licensed" });
    expect(res.status).toBe(200);
    expect(res.body.data.checkoutUrl).toBe("https://checkout.example.test/cs_test_licence_track");
    const args = stripe.create.mock.calls[0][0];
    expect(args.success_url).toBe("http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}&track=licensed");
    expect(args.metadata).toMatchObject({ courseId: PAID_COURSE, studentId: ids.outsider, licenceTrack: "licensed" });
    const payment = await prisma.payment.findUnique({ where: { transactionId: "cs_test_licence_track" } });
    expect(payment.licenceTrack).toBe("licensed");
  });

  it("uses the non-licensed default when checkout is started without a track", async () => {
    stripe.create.mockResolvedValue({ id: "cs_test_default", url: "https://checkout.example.test/cs_test_default" });
    await request(app).post("/api/payments/checkout").set(auth(ids.outsider)).send({ courseId: PAID_COURSE });
    expect(stripe.create.mock.calls[0][0].success_url).toMatch(/&track=non-licensed$/);
    expect((await prisma.payment.findUnique({ where: { transactionId: "cs_test_default" } })).licenceTrack).toBe("non-licensed");
  });

  it("the verified payment creates the enrolment on the licensed track", async () => {
    stripe.create.mockResolvedValue({ id: "cs_test_licence_track", url: "https://checkout.example.test/x" });
    await request(app).post("/api/payments/checkout").set(auth(ids.outsider)).send({ courseId: PAID_COURSE, licenceTrack: "licensed" });
    stripe.retrieve.mockResolvedValue(session({}));
    const res = await request(app).get("/api/payments/verify/cs_test_licence_track").set(auth(ids.outsider));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("SUCCEEDED");
    const enrolment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: ids.outsider, courseId: PAID_COURSE } } });
    expect(enrolment.licenceTrack).toBe("licensed");
  });

  it("refuses to enrol when the Stripe session carries a different track from the checkout record", async () => {
    stripe.create.mockResolvedValue({ id: "cs_test_licence_track", url: "https://checkout.example.test/x" });
    await request(app).post("/api/payments/checkout").set(auth(ids.outsider)).send({ courseId: PAID_COURSE, licenceTrack: "licensed" });
    stripe.retrieve.mockResolvedValue(session({ metadata: { courseId: PAID_COURSE, studentId: ids.outsider, licenceTrack: "non-licensed" } }));
    const res = await request(app).get("/api/payments/verify/cs_test_licence_track").set(auth(ids.outsider));
    expect(res.status).toBe(409);
    expect(await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: ids.outsider, courseId: PAID_COURSE } } })).toBeNull();
  });
});

describe("the verify step refuses a payment for a different track than the enrolment", () => {
  it("leaves the payment PENDING and enrols nothing when an enrolment already exists on another track", async () => {
    stripe.create.mockResolvedValue({ id: "cs_test_conflict", url: "https://checkout.example.test/x" });
    await request(app).post("/api/payments/checkout").set(auth(ids.outsider)).send({ courseId: PAID_COURSE, licenceTrack: "licensed" });
    // A second checkout on another track completed first (or a race): the learner is already enrolled on non-licensed.
    await seed("enrollment", [{ studentId: ids.outsider, courseId: PAID_COURSE, status: "ACTIVE", licenceTrack: "non-licensed" }]);
    stripe.retrieve.mockResolvedValue({
      id: "cs_test_conflict", payment_status: "paid", status: "complete", amount_total: 2500, currency: "usd",
      metadata: { courseId: PAID_COURSE, studentId: ids.outsider, licenceTrack: "licensed" },
    });
    const res = await request(app).get("/api/payments/verify/cs_test_conflict").set(auth(ids.outsider));
    expect(res.status).toBe(409);
    expect((await prisma.payment.findUnique({ where: { transactionId: "cs_test_conflict" } })).status).toBe("PENDING");
    expect((await enrolmentOf(ids.outsider, PAID_COURSE)).licenceTrack).toBe("non-licensed");
  });
});

describe("POST /completions refuses a lesson the saved track excludes", () => {
  it("refuses a required lesson for a learner on the non-licensed track, with the body endpoint's code and message", async () => {
    const res = await request(app).post(COMPLETIONS()).set(auth(ids.learner1)).send({ lessonId: ids.lessonB, revisionId: ids.revisionB });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe(LICENCE_EXCLUDED_MESSAGE);
    expect(res.body.errors).toEqual([{ code: "LICENCE_TRACK_EXCLUDED", track: "non-licensed" }]);
    expect(await prisma.academyLearnerCompletion.findUnique({ where: { learnerId_lessonId_revisionId: { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB } } })).toBeNull();
  });

  it("a ?track=licensed in the URL does not lift the refusal, because completions use the saved track", async () => {
    const res = await request(app).post(COMPLETIONS("?track=licensed")).set(auth(ids.learner1)).send({ lessonId: ids.lessonB, revisionId: ids.revisionB });
    expect(res.status).toBe(403);
    expect(res.body.errors).toEqual([{ code: "LICENCE_TRACK_EXCLUDED", track: "non-licensed" }]);
  });

  it("acknowledges a required lesson for a learner whose saved track is licensed", async () => {
    const res = await request(app).post(COMPLETIONS()).set(auth(ids.learner2)).send({ lessonId: ids.lessonB, revisionId: ids.revisionB });
    expect(res.status).toBe(200);
    expect(res.body.data.lessonId).toBe(ids.lessonB);
  });

  it("acknowledges a threshold lesson for a non-licensed learner", async () => {
    const res = await request(app).post(COMPLETIONS()).set(auth(ids.learner1)).send({ lessonId: ids.lessonA, revisionId: ids.revisionA });
    expect(res.status).toBe(200);
  });

  it("allows a required lesson when another enrolment of the learner, on the licensed track, assigns it", async () => {
    // The lesson is completed per learner, not per course. A licensed enrolment in another course that assigns it is enough.
    await seed("academyCourseTrack", [{ courseId: SECOND_COURSE, trackId: ids.track, position: 1, required: false }]);
    await seed("enrollment", [{ studentId: ids.learner1, courseId: SECOND_COURSE, status: "ACTIVE", licenceTrack: "licensed" }]);
    const res = await request(app).post(COMPLETIONS()).set(auth(ids.learner1)).send({ lessonId: ids.lessonB, revisionId: ids.revisionB });
    expect(res.status).toBe(200);
  });
});

const SWITCH = (courseId = ids.course) => `/api/enrollments/${courseId}/licence-track`;
const enrolmentOf = (studentId: string, courseId = ids.course) => prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } });

describe("a learner switches the saved licence track", () => {
  it("changes non-licensed to licensed, and the outline follows the new saved track without ?track=", async () => {
    const res = await request(app).patch(SWITCH()).set(auth(ids.learner1)).send({ licenceTrack: "licensed" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ courseId: ids.course, status: "ACTIVE", licenceTrack: "licensed" });
    expect((await enrolmentOf(ids.learner1)).licenceTrack).toBe("licensed");
    const outline = await request(app).get(OUTLINE()).set(auth(ids.learner1));
    expect(sourceIdsOf(outline.body)).toEqual(["TST-A", "TST-B", "TST-D"]);
  });

  it("changes licensed back to non-licensed", async () => {
    const res = await request(app).patch(SWITCH()).set(auth(ids.learner2)).send({ licenceTrack: "non-licensed" });
    expect(res.status).toBe(200);
    expect((await enrolmentOf(ids.learner2)).licenceTrack).toBe("non-licensed");
    const body = await request(app).get(BODY("TST-B")).set(auth(ids.learner2));
    expect(body.status).toBe(403);
  });

  it("keeps progress, completions and the enrolment status when the track changes", async () => {
    await prisma.enrollment.update({ where: { studentId_courseId: { studentId: ids.learner1, courseId: ids.course } }, data: { progressPercentage: 40 } });
    await seed("academyLearnerCompletion", [{ learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA }]);
    const completionsBefore = (await prisma.academyLearnerCompletion.findMany({ where: { learnerId: ids.learner1 } })).length;

    const res = await request(app).patch(SWITCH()).set(auth(ids.learner1)).send({ licenceTrack: "licensed" });
    expect(res.status).toBe(200);
    const enrolment = await enrolmentOf(ids.learner1);
    expect(enrolment).toMatchObject({ status: "ACTIVE", progressPercentage: 40, completedAt: null, licenceTrack: "licensed" });
    expect((await prisma.academyLearnerCompletion.findMany({ where: { learnerId: ids.learner1 } })).length).toBe(completionsBefore);
  });

  it("refuses an unknown track and leaves the saved track unchanged", async () => {
    const res = await request(app).patch(SWITCH()).set(auth(ids.learner1)).send({ licenceTrack: "everything" });
    expect(res.status).toBe(422);
    expect((await enrolmentOf(ids.learner1)).licenceTrack).toBe("non-licensed");
  });

  it("refuses a missing track and leaves the saved track unchanged", async () => {
    const res = await request(app).patch(SWITCH()).set(auth(ids.learner2)).send({});
    expect(res.status).toBe(422);
    expect((await enrolmentOf(ids.learner2)).licenceTrack).toBe("licensed");
  });

  it("refuses a learner with no enrolment in the course, and creates none", async () => {
    const res = await request(app).patch(SWITCH()).set(auth(ids.outsider)).send({ licenceTrack: "licensed" });
    expect(res.status).toBe(403);
    expect(await enrolmentOf(ids.outsider)).toBeNull();
  });

  it("refuses a cancelled enrolment, and leaves the saved track unchanged", async () => {
    await prisma.enrollment.update({ where: { studentId_courseId: { studentId: ids.learner1, courseId: ids.course } }, data: { status: "CANCELLED" } });
    const res = await request(app).patch(SWITCH()).set(auth(ids.learner1)).send({ licenceTrack: "licensed" });
    expect(res.status).toBe(403);
    expect((await enrolmentOf(ids.learner1)).licenceTrack).toBe("non-licensed");
  });

  it("refuses an unauthenticated request", async () => {
    const res = await request(app).patch(SWITCH()).send({ licenceTrack: "licensed" });
    expect(res.status).toBe(401);
    expect((await enrolmentOf(ids.learner1)).licenceTrack).toBe("non-licensed");
  });
});

describe("the course detail endpoint uses the saved track", () => {
  const COURSE_PAGE = "/api/courses/field-safety";

  it("an enrolled learner with a saved licensed track gets licensed, with no ?track=", async () => {
    const res = await request(app).get(COURSE_PAGE).set(auth(ids.learner2));
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("licensed");
  });

  it("an enrolled learner with the default gets non-licensed", async () => {
    const res = await request(app).get(COURSE_PAGE).set(auth(ids.learner1));
    expect(res.body.data.licenceTrack).toBe("non-licensed");
  });

  it("a ?track= in the URL does not override the saved track on the course detail for an enrolled learner", async () => {
    const licensed = await request(app).get(`${COURSE_PAGE}?track=non-licensed`).set(auth(ids.learner2));
    expect(licensed.body.data.licenceTrack).toBe("licensed");
    const nonLicensed = await request(app).get(`${COURSE_PAGE}?track=licensed`).set(auth(ids.learner1));
    expect(nonLicensed.body.data.licenceTrack).toBe("non-licensed");
  });

  it("an enrolled learner with an unknown ?track= gets the saved track on the course detail, not a 422", async () => {
    const res = await request(app).get(`${COURSE_PAGE}?track=everything`).set(auth(ids.learner2));
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("licensed");
  });

  it("a visitor with no enrolment previews the track with ?track= on the public course page", async () => {
    const res = await request(app).get(`${COURSE_PAGE}?track=licensed`).set(auth(ids.outsider));
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("licensed");
  });

  it("an anonymous request gets the non-licensed default, as before", async () => {
    const res = await request(app).get(COURSE_PAGE);
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("non-licensed");
  });

  it("a bad or expired token does not stop the public course page, which gets the default", async () => {
    const res = await request(app).get(COURSE_PAGE).set({ Authorization: "Bearer not-a-real-token" });
    expect(res.status).toBe(200);
    expect(res.body.data.licenceTrack).toBe("non-licensed");
  });

  it("an unknown ?track= on the course detail is still refused", async () => {
    const res = await request(app).get(`${COURSE_PAGE}?track=everything`);
    expect(res.status).toBe(422);
  });
});
