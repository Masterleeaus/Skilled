/**
 * Publication gate on the curriculum publisher path (ACA-008, ACA-026). The publisher runs with the gate on (the default),
 * against the in-memory Prisma double, with curriculum files written to a temporary folder for each test.
 *
 * Covers: an unreviewed revision is held, a structurally incomplete revision is refused, an approved revision passes,
 * a changed revision after approval is refused (stale approval), and a held revision leaves the lesson's title alone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

vi.mock("../config/env", () => ({ env: { CURRICULUM_DIR: "", NODE_ENV: "test" } }));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { numberOf, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { publishCurriculumFiles, type PublishSummary } from "../modules/curriculum/curriculum-publisher";
import { recordReview } from "../modules/curriculum/lesson-review.service";

const PUBLISHER = "publisher-gate-1";
const REVIEWER = "reviewer-gate-1";
const COURSE = "tst-gate-course";
const TRACK = `${COURSE}-curriculum`;
const LESSON = "TST-G1";

const GATE_ENV = "ACADEMY_PUBLICATION_GATE";
let root: string;
let priorGate: string | undefined;

/** A lesson file that passes every structural check: instruction, summary, quality standard and 3 or 4 option checks. */
function completeFile(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: LESSON,
    title: "Gate lesson one",
    courseSlugs: [COURSE],
    moduleTitle: "Module",
    layer: "base",
    lessonType: "K",
    learningOutcomes: ["Explain the gate"],
    instruction: [{ heading: "Step", body: "Check the kit before the job starts." }],
    procedure: ["Open the kit"],
    summary: ["The kit is checked before every job"],
    qualityStandard: ["All items are present"],
    knowledgeChecks: [{ id: `${LESSON}-K01`, question: "When is the kit checked?", options: ["Before", "After", "Never"] }],
    status: "DRAFT",
    reviewStatus: "NOT REVIEWED",
    ...overrides,
  };
}

function writeJson(relative: string, value: unknown): void {
  const file = path.join(root, relative);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value, null, 2));
}

function writeLesson(file: Record<string, unknown>): void {
  writeJson(`courses/${COURSE}/${LESSON}.json`, file);
}

function writeStructure(): void {
  writeJson("structure/COURSES-MODULES.json", {
    courses: [{ slug: COURSE, title: "Gate course", group: "Group G", modules: [{ module: "Module", lessons: [{ id: LESSON, title: "Gate lesson one" }] }] }],
  });
}

const publish = (): Promise<PublishSummary> => publishCurriculumFiles({ root, actorId: PUBLISHER });
const lesson = () => rows("academyContentLesson").find((row) => row.sourceId === LESSON);
const revisions = () => {
  const found = lesson();
  return found ? rows("academyLessonRevision").filter((row) => row.lessonId === found.id).sort((a, b) => numberOf(a.version) - numberOf(b.version)) : [];
};
const latestRevision = () => revisions()[revisions().length - 1];
const placements = () => {
  const track = rows("academyCurriculumTrack").find((row) => row.slug === TRACK);
  return track ? rows("academyLessonPlacement").filter((row) => row.trackId === track.id) : [];
};
const publishedAudit = () => rows("auditLog").filter((row) => row.action === "LESSON_REVISION_PUBLISHED");

/** Approves the revision the publisher drafted, for the exact content hash it holds. */
async function approveLatest(): Promise<void> {
  const revision = latestRevision();
  await recordReview({ revisionId: String(revision.id), reviewerId: REVIEWER, decision: "APPROVED", contentHash: String(revision.contentHash) });
}

beforeEach(async () => {
  priorGate = process.env[GATE_ENV];
  delete process.env[GATE_ENV];
  resetFakeDb();
  root = mkdtempSync(path.join(tmpdir(), "curriculum-gate-paths-"));
  writeStructure();
  await seed("user", [
    { id: PUBLISHER, email: "publisher-gate@test.local", fullName: "Publisher" },
    { id: REVIEWER, email: "reviewer-gate@test.local", fullName: "Reviewer Gate", role: "ADMIN", isActive: true, isEmailVerified: true },
  ]);
  await seed("category", [{ id: "cat-gate", name: "Cat", slug: "cat-gate" }]);
  await seed("course", [{ id: "course-gate", slug: COURSE, title: "Gate course", description: "", categoryId: "cat-gate", teacherId: PUBLISHER, isPublished: true }]);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
  if (priorGate === undefined) delete process.env[GATE_ENV];
  else process.env[GATE_ENV] = priorGate;
});

describe("publisher path, gate on: unreviewed content", () => {
  it("holds a new lesson as a DRAFT revision, places nothing, and publishes no audit entry", async () => {
    writeLesson(completeFile());
    const summary = await publish();

    expect(latestRevision().status).toBe("DRAFT");
    expect(lesson()!.contentStatus).toBe("BRIEF");
    expect(placements()).toHaveLength(0);
    expect(publishedAudit()).toHaveLength(0);
    expect(summary.lessons.held).toBe(1);
    expect(summary.warnings.join("\n")).toMatch(/review gate/);
  });

  it("holds a changed revision of an already published lesson, and keeps the approved version live", async () => {
    // First, publish the approved version: gate off for this one run only, then back on.
    process.env[GATE_ENV] = "off";
    writeLesson(completeFile());
    await publish();
    delete process.env[GATE_ENV];
    const approvedId = revisions()[0].id;
    expect(revisions()[0].status).toBe("PUBLISHED");

    // The file changes text and title. The new body is unreviewed.
    writeLesson(completeFile({ title: "Changed title, unreviewed", instruction: [{ heading: "Step", body: "New unreviewed text." }] }));
    await publish();

    expect(revisions().map((r) => r.status)).toEqual(["PUBLISHED", "DRAFT"]);
    expect(placements()[0].revisionId).toBe(approvedId);
    expect(lesson()!.contentStatus).toBe("PUBLISHED");
  });

  it("does not rewrite a held lesson's title, objective or assessment, which learners see in the outline", async () => {
    process.env[GATE_ENV] = "off";
    writeLesson(completeFile());
    await publish();
    delete process.env[GATE_ENV];
    expect(lesson()!.title).toBe("Gate lesson one");

    writeLesson(completeFile({ title: "Unreviewed new title", learningOutcomes: ["Unreviewed new objective"] }));
    await publish();

    expect(revisions()[1].status).toBe("DRAFT");
    expect(lesson()!.title).toBe("Gate lesson one");
    expect(lesson()!.objective).toBe("Explain the gate");
  });
});

describe("publisher path, gate on: structural completeness", () => {
  it("refuses an approved revision that is structurally incomplete, and writes no published state", async () => {
    writeLesson(completeFile({ summary: [] }));
    await publish();
    await approveLatest();

    const summary = await publish();

    expect(latestRevision().status).toBe("DRAFT");
    expect(lesson()!.contentStatus).toBe("BRIEF");
    expect(placements()).toHaveLength(0);
    expect(publishedAudit()).toHaveLength(0);
    expect(summary.warnings.join("\n")).toMatch(/publish failed \(Publication blocked by the lesson review gate\)/);
  });
});

describe("publisher path, gate on: approved content", () => {
  it("publishes an approved, structurally complete revision, and places it in the course track", async () => {
    writeLesson(completeFile());
    await publish();
    await approveLatest();

    const summary = await publish();

    expect(revisions()).toHaveLength(1);
    expect(revisions()[0].status).toBe("PUBLISHED");
    expect(lesson()!.contentStatus).toBe("PUBLISHED");
    expect(placements()).toHaveLength(1);
    expect(placements()[0].revisionId).toBe(revisions()[0].id);
    expect(summary.lessons.draftsPublished).toBe(1);
    expect(publishedAudit()).toHaveLength(1);
  });

  it("writes a changed title only when the changed revision is approved and published", async () => {
    process.env[GATE_ENV] = "off";
    writeLesson(completeFile({ title: "Old title" }));
    await publish();
    delete process.env[GATE_ENV];
    expect(lesson()!.title).toBe("Old title");

    writeLesson(completeFile({ title: "Approved title", instruction: [{ heading: "Step", body: "Reviewed text." }] }));
    await publish();
    expect(lesson()!.title).toBe("Old title");

    await approveLatest();
    await publish();
    expect(lesson()!.title).toBe("Approved title");
    expect(revisions()[1].status).toBe("PUBLISHED");
  });
});

describe("publisher path, gate on: stale approval", () => {
  it("refuses to publish a draft whose body changed after it was approved, and keeps the old approval off the new body", async () => {
    writeLesson(completeFile());
    await publish();
    await approveLatest();
    const approvedDraft = latestRevision();

    // The file is edited after the approval, before publication.
    writeLesson(completeFile({ instruction: [{ heading: "Step", body: "Edited after approval." }] }));
    const summary = await publish();

    expect(revisions()).toHaveLength(2);
    expect(revisions()[0].id).toBe(approvedDraft.id);
    expect(revisions()[0].status).toBe("DRAFT");
    expect(latestRevision().status).toBe("DRAFT");
    expect(latestRevision().contentHash).not.toBe(approvedDraft.contentHash);
    expect(placements()).toHaveLength(0);
    expect(lesson()!.contentStatus).toBe("BRIEF");
    expect(summary.lessons.held).toBe(1);
  });

  it("keeps the approved revision live when a later edit to the same lesson is refused", async () => {
    writeLesson(completeFile());
    await publish();
    await approveLatest();
    await publish();
    expect(revisions()[0].status).toBe("PUBLISHED");

    writeLesson(completeFile({ summary: ["Edited summary after approval"] }));
    await publish();

    expect(revisions()[1].status).toBe("DRAFT");
    expect(rows("academyLessonReview").filter((review) => review.revisionId === revisions()[1].id)).toHaveLength(0);
    expect(placements()[0].revisionId).toBe(revisions()[0].id);
  });
});
