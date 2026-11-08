/**
 * Curriculum publisher: idempotence, placement rules, answer-key loading and the no-review-gate publication path.
 * Runs the real publisher and lesson-review service against the in-memory Prisma double, with curriculum files
 * written to a temporary folder for each test. No database is needed.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

vi.mock("../config/env", () => ({ env: { CURRICULUM_DIR: "", NODE_ENV: "test" } }));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { numberOf, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { buildFileLessonIndex } from "../modules/curriculum/file-lesson-loader";
import {
  findAnswerKeyField,
  planPlacements,
  publishCurriculumFiles,
  readStructure,
  type PublishSummary,
} from "../modules/curriculum/curriculum-publisher";
import { createDraftRevision } from "../modules/curriculum/lesson-review.service";

const PUBLISHER = "publisher-1";
const COURSE_A = "tst-course-a";
const COURSE_B = "tst-course-b";
const TRACK_A = `${COURSE_A}-curriculum`;
const TRACK_B = `${COURSE_B}-curriculum`;

let root: string;

function writeJson(relative: string, value: unknown): void {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
}

const structure = () => ({
  meta: { generated: "test" },
  courses: [
    {
      slug: COURSE_A,
      title: "Course A",
      group: "Group X",
      modules: [
        { module: "Module one", lessons: [{ id: "TST-1", title: "Lesson one" }, { id: "TST-2", title: "Shared two" }] },
        { module: "Module two", lessons: [{ id: "TST-3", title: "Lesson three" }] },
      ],
    },
    {
      slug: COURSE_B,
      title: "Course B",
      group: "Group Y",
      modules: [{ module: "Only", lessons: [{ id: "TST-2", title: "Shared two" }, { id: "TST-4", title: "Secret" }, { id: "TST-5", title: "No file" }] }],
    },
    // Not in the database: its placements are skipped with a warning.
    { slug: "tst-course-missing", title: "Missing", group: "Group Z", modules: [{ module: "M", lessons: [{ id: "TST-3", title: "Lesson three" }] }] },
  ],
});

function lessonFile(id: string, title: string, courseSlugs: string[], checks: Array<Record<string, unknown>>, text = `Text for ${id}.`) {
  return {
    id,
    title,
    courseSlugs,
    moduleTitle: "Module",
    layer: "base",
    lessonType: "K",
    learningOutcomes: [`Explain ${id}`],
    instruction: [{ heading: "Step", body: text }],
    procedure: ["Do the step"],
    knowledgeChecks: checks,
    status: "DRAFT",
    reviewStatus: "NOT REVIEWED",
  };
}

const K_TST1 = [
  { id: "TST-1-K01", question: "Which step first?", options: ["A", "B", "C"] },
  { id: "TST-1-K02", question: "Which step second?", options: ["W", "X", "Y", "Z"] },
];
const K_TST2 = [{ id: "TST-2-K01", question: "Pick one", options: ["1", "2", "3"] }];
const K_TST3 = [{ id: "TST-3-K01", question: "Pick three", options: ["a", "b", "c"] }];

function writeBaseline(): void {
  writeJson("structure/COURSES-MODULES.json", structure());
  writeJson("courses/tst-course-a/TST-1.json", lessonFile("TST-1", "Lesson one", [COURSE_A], K_TST1));
  writeJson("courses/tst-course-a/TST-3.json", lessonFile("TST-3", "Lesson three", [COURSE_A], K_TST3));
  writeJson("shared/tst/TST-2.json", lessonFile("TST-2", "Shared two", [COURSE_A, COURSE_B], K_TST2));
  // Indexed but not placed in any course: the file alone grants nothing, so it is never published.
  writeJson("shared/tst/TST-9.json", lessonFile("TST-9", "Unplaced", [COURSE_A], []));
  // Carries an answer key in the lesson file: refused and held.
  writeJson("courses/tst-course-b/TST-4.json", lessonFile("TST-4", "Secret", [COURSE_B], [{ id: "TST-4-K01", question: "Q", options: ["a", "b"], correctIndex: 1 }]));
  writeJson("assessments/TST-1.assessment.json", {
    lessonId: "TST-1",
    passRule: "Two of two",
    knowledgeAnswers: [
      { id: "TST-1-K01", correctIndex: 0, rationale: "rationale one" },
      { id: "TST-1-K02", correctIndex: 3, rationale: "rationale two" },
    ],
  });
  writeJson("assessments/TST-2.assessment.json", { lessonId: "TST-2", knowledgeAnswers: [{ id: "TST-2-K01", correctIndex: 2, rationale: "r" }] });
  // No assessment file for TST-3: its check is refused, not guessed.
  // Answer keys load only with a named approval for the exact bytes of each assessment file (ACA-008).
  writeApprovals(["TST-1", "TST-2"]);
}

function writeApprovals(lessonIds: string[]): void {
  const approval = (lessonId: string) => ({
    status: "approved",
    reviewer: "Dana Reviewer",
    reviewedAt: "2026-01-15T10:00:00Z",
    sha256: createHash("sha256").update(readFileSync(path.join(root, "assessments", `${lessonId}.assessment.json`))).digest("hex"),
  });
  writeJson("assessment-publication-approvals.json", Object.fromEntries(lessonIds.map((id) => [id, approval(id)])));
}

const publish = (): Promise<PublishSummary> => publishCurriculumFiles({ root, actorId: PUBLISHER });
const lesson = (sourceId: string) => rows("academyContentLesson").find((row) => row.sourceId === sourceId);
const revisionsOf = (sourceId: string) => {
  const found = lesson(sourceId);
  return found ? rows("academyLessonRevision").filter((row) => row.lessonId === found.id).sort((a, b) => numberOf(a.version) - numberOf(b.version)) : [];
};
const trackNamed = (slug: string) => rows("academyCurriculumTrack").find((row) => row.slug === slug);
const placementsIn = (slug: string) => {
  const track = trackNamed(slug);
  if (!track) return [];
  return rows("academyLessonPlacement")
    .filter((row) => row.trackId === track.id)
    .map((row) => ({ sourceId: rows("academyContentLesson").find((l) => l.id === row.lessonId)!.sourceId, position: row.position, revisionId: row.revisionId }))
    .sort((a, b) => numberOf(a.position) - numberOf(b.position));
};
const snapshot = () => ({
  lessons: rows("academyContentLesson").length,
  revisions: rows("academyLessonRevision").length,
  tracks: rows("academyCurriculumTrack").length,
  courseTracks: rows("academyCourseTrack").length,
  placements: rows("academyLessonPlacement").length,
  keys: rows("academyKnowledgeAnswerKey").length,
  reviews: rows("academyLessonReview").length,
  audit: rows("auditLog").length,
});

beforeEach(async () => {
  resetFakeDb();
  root = mkdtempSync(path.join(tmpdir(), "curriculum-publisher-"));
  writeBaseline();
  await seed("user", [
    { id: PUBLISHER, email: "publisher@test.local", fullName: "Publisher" },
    { id: "teacher", email: "teacher@test.local", fullName: "Teacher", role: "TEACHER", passwordHash: "x" },
  ]);
  await seed("category", [{ id: "cat", name: "Cat", slug: "cat" }]);
  await seed("course", [
    { id: "course-a", slug: COURSE_A, title: "Course A", description: "", categoryId: "cat", teacherId: "teacher", isPublished: true },
    { id: "course-b", slug: COURSE_B, title: "Course B", description: "", categoryId: "cat", teacherId: "teacher", isPublished: true },
  ]);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

// The structural tests below check placement, idempotence and answer keys, not the review gate, so they run with the
// gate switched off for this file. The gate-on test at the end checks the default: unreviewed lessons are held.
const PRIOR_GATE = process.env.ACADEMY_PUBLICATION_GATE;
beforeAll(() => { process.env.ACADEMY_PUBLICATION_GATE = "off"; });
afterAll(() => { if (PRIOR_GATE === undefined) delete process.env.ACADEMY_PUBLICATION_GATE; else process.env.ACADEMY_PUBLICATION_GATE = PRIOR_GATE; });

describe("first publish", () => {
  it("publishes each placed lesson as one PUBLISHED revision when the gate is off", async () => {
    const summary = await publish();
    expect(summary.coursesPlaced).toBe(2);
    expect(summary.coursesMissingFromDatabase).toEqual(["tst-course-missing"]);

    for (const id of ["TST-1", "TST-2", "TST-3"]) {
      const versions = revisionsOf(id);
      expect(versions).toHaveLength(1);
      expect(versions[0].status).toBe("PUBLISHED");
      expect(versions[0].publishedAt).toBeInstanceOf(Date);
    }
    expect(lesson("TST-1")!.contentStatus).toBe("PUBLISHED");
    expect(rows("academyLessonReview")).toHaveLength(0);
    const gateOff = rows("auditLog").filter((row) => row.action === "LESSON_REVISION_PUBLISHED_GATE_OFF");
    expect(gateOff).toHaveLength(3);
  });

  it("refuses a lesson file that carries an answer key, and places nothing for it", async () => {
    const summary = await publish();
    expect(lesson("TST-4")).toBeUndefined();
    expect(placementsIn(TRACK_B).map((p) => p.sourceId)).toEqual(["TST-2"]);
    expect(summary.warnings.join("\n")).toMatch(/TST-4: lesson file carries an answer-key field/);
    expect(JSON.stringify(summary)).not.toContain("rationale one");
  });

  it("leaves a lesson with no file out, with a warning, and never publishes an unplaced file", async () => {
    const summary = await publish();
    expect(lesson("TST-5")).toBeUndefined();
    expect(lesson("TST-9")).toBeUndefined();
    expect(summary.lessons.unplacedFiles).toBe(1);
    expect(summary.warnings.join("\n")).toMatch(/TST-5: no usable lesson file/);
  });

  it("places each lesson in its course track by module order, one placement per course track", async () => {
    await publish();
    expect(placementsIn(TRACK_A)).toEqual([
      { sourceId: "TST-1", position: 1, revisionId: revisionsOf("TST-1")[0].id },
      { sourceId: "TST-2", position: 2, revisionId: revisionsOf("TST-2")[0].id },
      { sourceId: "TST-3", position: 3, revisionId: revisionsOf("TST-3")[0].id },
    ]);
    // TST-2 is shared: one placement in each of its two course tracks, pinned to the same revision.
    expect(placementsIn(TRACK_B).map((p) => p.sourceId)).toEqual(["TST-2"]);
    expect(placementsIn(TRACK_B)[0].revisionId).toBe(revisionsOf("TST-2")[0].id);
    expect(trackNamed(TRACK_A)!.status).toBe("PUBLISHED");
    expect(trackNamed(TRACK_B)!.status).toBe("PUBLISHED");
    const courseA = rows("course").find((c) => c.slug === COURSE_A)!;
    expect(rows("academyCourseTrack").some((link) => link.courseId === courseA.id && link.trackId === trackNamed(TRACK_A)!.id)).toBe(true);
  });

  it("loads answer keys for each check and writes nothing for a check with no key", async () => {
    const summary = await publish();
    const keysFor = (sourceId: string) => rows("academyKnowledgeAnswerKey").filter((k) => k.revisionId === revisionsOf(sourceId)[0].id);
    expect(keysFor("TST-1").map((k) => [k.checkId, k.correctIndex]).sort()).toEqual([["TST-1-K01", 0], ["TST-1-K02", 3]]);
    expect(keysFor("TST-2").map((k) => [k.checkId, k.correctIndex])).toEqual([["TST-2-K01", 2]]);
    expect(keysFor("TST-3")).toHaveLength(0);
    expect(summary.answerKeys.refused).toBe(1);
    expect(summary.warnings.join("\n")).toMatch(/TST-3 knowledge check TST-3-K01/);
  });
});

describe("idempotence", () => {
  it("a second run with no change adds no rows, no revisions, no keys and no audit entries", async () => {
    await publish();
    const before = snapshot();
    const revisionIds = rows("academyLessonRevision").map((r) => r.id);
    const second = await publish();
    expect(snapshot()).toEqual(before);
    expect(rows("academyLessonRevision").map((r) => r.id)).toEqual(revisionIds);
    expect(second.lessons.newRevisions).toBe(0);
    expect(second.lessons.unchanged).toBe(3);
    expect(second.placements).toEqual({ created: 0, updated: 0, removed: 0, unchanged: 4 });
    expect(second.answerKeys).toEqual({ created: 0, updated: 0, unchanged: 3, refused: 1 });
  });

  it("publishes a changed lesson as one new revision and moves its placement to it", async () => {
    await publish();
    const oldRevision = revisionsOf("TST-1")[0];
    writeJson("courses/tst-course-a/TST-1.json", lessonFile("TST-1", "Lesson one", [COURSE_A], K_TST1, "Changed text for TST-1."));
    const summary = await publish();

    expect(summary.lessons.newRevisions).toBe(1);
    const versions = revisionsOf("TST-1");
    expect(versions.map((v) => [v.version, v.status])).toEqual([[1, "PUBLISHED"], [2, "PUBLISHED"]]);
    expect(placementsIn(TRACK_A).find((p) => p.sourceId === "TST-1")!.revisionId).toBe(versions[1].id);
    expect(revisionsOf("TST-2")).toHaveLength(1);
    expect(oldRevision.body).not.toEqual(versions[1].body);
  });

  it("publishes a leftover draft with the same body instead of making a duplicate", async () => {
    await seed("academyContentLesson", [{ sourceId: "TST-1", layer: "base", serviceGroup: "", unit: "", title: "", objective: "", assessment: "", sourceVersion: "", sourceHash: "" }]);
    const index = await buildFileLessonIndex(root);
    await createDraftRevision({ sourceId: "TST-1", body: index.get("TST-1")!.body, actorId: PUBLISHER });

    const summary = await publish();
    expect(summary.lessons.draftsPublished).toBe(1);
    expect(revisionsOf("TST-1")).toHaveLength(1);
    expect(revisionsOf("TST-1")[0].status).toBe("PUBLISHED");
  });

  it("updates an answer key when only the assessment changes, without a new revision", async () => {
    await publish();
    const revisionId = revisionsOf("TST-1")[0].id;
    writeJson("assessments/TST-1.assessment.json", {
      lessonId: "TST-1",
      passRule: "Two of two",
      knowledgeAnswers: [
        { id: "TST-1-K01", correctIndex: 1, rationale: "rationale one" },
        { id: "TST-1-K02", correctIndex: 3, rationale: "rationale two" },
      ],
    });
    writeApprovals(["TST-1", "TST-2"]);
    const summary = await publish();
    expect(summary.answerKeys.updated).toBe(1);
    expect(revisionsOf("TST-1")).toHaveLength(1);
    expect(rows("academyKnowledgeAnswerKey").find((k) => k.revisionId === revisionId && k.checkId === "TST-1-K01")!.correctIndex).toBe(1);
  });

  it("refuses a check whose key is missing from the assessment, and reports it by check ID", async () => {
    writeJson("assessments/TST-2.assessment.json", { lessonId: "TST-2", knowledgeAnswers: [] });
    writeApprovals(["TST-2"]);
    const summary = await publish();
    expect(rows("academyKnowledgeAnswerKey").some((k) => k.checkId === "TST-2-K01")).toBe(false);
    expect(summary.warnings.join("\n")).toMatch(/TST-2 knowledge check TST-2-K01: no answer key in the assessment file/);
    expect(revisionsOf("TST-2")[0].status).toBe("PUBLISHED");
  });
});

describe("placement rules", () => {
  it("moves positions when lessons are reordered, without a unique-position clash", async () => {
    await publish();
    const reordered = structure();
    reordered.courses[0].modules = [
      { module: "Module one", lessons: [{ id: "TST-3", title: "Lesson three" }, { id: "TST-1", title: "Lesson one" }, { id: "TST-2", title: "Shared two" }] },
      { module: "Module two", lessons: [] },
    ];
    writeJson("structure/COURSES-MODULES.json", reordered);
    const summary = await publish();
    expect(placementsIn(TRACK_A).map((p) => [p.sourceId, p.position])).toEqual([["TST-3", 1], ["TST-1", 2], ["TST-2", 3]]);
    expect(summary.placements.updated).toBe(3);
  });

  it("removes the placement of a lesson taken out of the structure, and keeps the lesson and its history", async () => {
    await publish();
    const reduced = structure();
    reduced.courses[0].modules = [{ module: "Module one", lessons: [{ id: "TST-1", title: "Lesson one" }, { id: "TST-2", title: "Shared two" }] }, { module: "Module two", lessons: [] }];
    writeJson("structure/COURSES-MODULES.json", reduced);
    const summary = await publish();
    expect(placementsIn(TRACK_A).map((p) => p.sourceId)).toEqual(["TST-1", "TST-2"]);
    expect(summary.placements.removed).toBe(1);
    expect(lesson("TST-3")).toBeDefined();
    expect(revisionsOf("TST-3")).toHaveLength(1);
  });

  it("does not drop a lesson's placement when that lesson is held back this run", async () => {
    await publish();
    // The file now carries an answer key: TST-1 is held, so its existing placement stays where it is.
    writeJson("courses/tst-course-a/TST-1.json", { ...lessonFile("TST-1", "Lesson one", [COURSE_A], K_TST1), correctIndex: 0 });
    const summary = await publish();
    expect(placementsIn(TRACK_A).map((p) => p.sourceId)).toEqual(["TST-1", "TST-2", "TST-3"]);
    expect(summary.placements.removed).toBe(0);
    expect(revisionsOf("TST-1")).toHaveLength(1);
  });

  it("creates no course link and no placement for a course missing from the database", async () => {
    await publish();
    expect(rows("academyCurriculumTrack").some((t) => t.slug === "tst-course-missing-curriculum")).toBe(false);
  });
});

describe("refusals", () => {
  it("refuses to run without a real publish actor", async () => {
    await expect(publishCurriculumFiles({ root, actorId: "nobody" })).rejects.toThrow(/not a user/);
    expect(rows("academyContentLesson")).toHaveLength(0);
  });
});

describe("review gate on (default)", () => {
  it("holds every lesson as a draft, with a warning, and places nothing published", async () => {
    delete process.env.ACADEMY_PUBLICATION_GATE;
    const summary = await publish();
    for (const id of ["TST-1", "TST-2", "TST-3"]) {
      const versions = revisionsOf(id);
      expect(versions.length).toBeGreaterThan(0);
      expect(versions.every(v => v.status === "DRAFT")).toBe(true);
    }
    expect(rows("auditLog").filter(row => row.action === "LESSON_REVISION_PUBLISHED")).toHaveLength(0);
    expect(rows("auditLog").filter(row => row.action === "LESSON_REVISION_PUBLISHED_GATE_OFF")).toHaveLength(0);
    expect(summary.lessons.held).toBeGreaterThan(0);
    expect(summary.warnings.join("\n")).toMatch(/review gate/);
    expect(placementsIn(TRACK_B).length).toBe(0);
  });
});

describe("pure planning", () => {
  it("keeps the first placement of a lesson listed twice in one course, with a warning", () => {
    const plan = planPlacements({
      courses: [{ slug: "tst-x", title: "X", group: "G", modules: [{ module: "A", lessons: [{ id: "L1", title: "" }, { id: "L1", title: "" }, { id: "L2", title: "" }] }] }],
    });
    expect(plan.courses[0].placements.map((p) => [p.lessonId, p.position, p.moduleTitle])).toEqual([["L1", 1, "A"], ["L2", 2, "A"]]);
    expect(plan.warnings.join("\n")).toMatch(/L1 is listed twice in tst-x/);
  });

  it("ignores a second entry for the same course, and skips a course whose slug cannot form a track slug", () => {
    const plan = planPlacements({
      courses: [
        { slug: "tst-x", title: "X", group: "G", modules: [{ module: "A", lessons: [{ id: "L1", title: "" }] }] },
        { slug: "tst-x", title: "X again", group: "G", modules: [{ module: "B", lessons: [{ id: "L9", title: "" }] }] },
        { slug: "Bad_Slug", title: "Bad", group: "G", modules: [{ module: "A", lessons: [{ id: "L2", title: "" }] }] },
      ],
    });
    expect(plan.courses.map((c) => c.trackSlug)).toEqual(["tst-x-curriculum"]);
    expect(plan.warnings).toHaveLength(2);
  });

  it("finds an answer-key field at any depth, and reads no key from a clean body", () => {
    expect(findAnswerKeyField({ a: [{ b: { correctIndex: 1 } }] })).toBe("a[0].b.correctIndex");
    expect(findAnswerKeyField({ knowledgeChecks: [{ id: "K1", question: "Q", options: ["a", "b"] }] })).toBeNull();
  });

  it("skips a course on the unverified courses hold list, with a warning, and keeps the other courses", () => {
    const plan = planPlacements({
      courses: [
        { slug: "appliance", title: "Held", group: "G", modules: [{ module: "A", lessons: [{ id: "H1", title: "" }] }] },
        { slug: "tst-x", title: "X", group: "G", modules: [{ module: "A", lessons: [{ id: "L1", title: "" }] }] },
      ],
    });
    expect(plan.courses.map((c) => c.slug)).toEqual(["tst-x"]);
    expect(plan.courses.flatMap((c) => c.placements.map((p) => p.lessonId))).toEqual(["L1"]);
    expect(plan.warnings.join("\n")).toMatch(/appliance is on the unverified courses hold list/);
  });

  it("rejects a structure file with no courses array", () => {
    expect(() => readStructure({})).toThrow(/no courses array/);
  });
});
