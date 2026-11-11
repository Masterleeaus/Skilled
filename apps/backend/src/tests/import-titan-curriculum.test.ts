/**
 * ACA-009: revision-safe brief import. Runs the real applyBriefImport against the schema-aware in-memory Prisma double.
 * Inline inventories only. Nothing here reads or writes the curriculum files on disk.
 */
import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import {
  applyBriefImport,
  BRIEF_INVENTORY_ID,
  briefContent,
  type BriefInventory,
  type BriefRow,
} from "../../prisma/curriculum-brief-import";
import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";

const db = fakePrisma as unknown as PrismaClient;

function brief(id: string, overrides: Partial<BriefRow> = {}): BriefRow {
  return {
    id,
    layer: "Universal",
    service_group: "All home services",
    unit: "Professional Induction",
    title: `Lesson ${id}`,
    objective: `Learner can apply ${id}.`,
    assessment: "Scenario check",
    status: "PLANNED",
    ...overrides,
  };
}

const V1: BriefInventory = { version: "draft-1", lessons: [brief("U01-01"), brief("U01-02"), brief("U01-03")] };

function lessonBy(sourceId: string) {
  return rows("academyContentLesson").find((row) => row.sourceId === sourceId);
}

function revisionsOf(sourceId: string) {
  const lesson = lessonBy(sourceId);
  return rows("academyLessonRevision").filter((row) => row.lessonId === lesson?.id).sort((a, b) => Number(a.version) - Number(b.version));
}

/** Every table a brief import could touch, reduced to comparable data. Ids and timestamps are excluded. */
function snapshot() {
  const volatile = new Set(["id", "createdAt", "updatedAt"]);
  const strip = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).filter(([key]) => !volatile.has(key)));
  const sourceOf = new Map(rows("academyContentLesson").map((row) => [String(row.id), String(row.sourceId)] as const));
  return {
    lessons: rows("academyContentLesson").map(strip),
    revisions: rows("academyLessonRevision").map((row) => ({ ...strip(row), lessonId: sourceOf.get(String(row.lessonId)) })),
    tracks: rows("academyCurriculumTrack").map(strip),
    placements: rows("academyLessonPlacement").map((row) => ({ ...strip(row), lessonId: sourceOf.get(String(row.lessonId)) })),
    courseTracks: rows("academyCourseTrack").map(strip),
  };
}

/** Fails the Nth write (create, update or delete on an academy table) inside the transaction, then lets the error propagate. */
function failingClient(failOnWrite: number): PrismaClient {
  let writes = 0;
  const WRITES = new Set(["create", "update", "delete", "updateMany", "deleteMany", "upsert"]);
  const wrapModel = (model: unknown): unknown =>
    new Proxy(model as object, {
      get(target, key) {
        const value = (target as Record<string | symbol, unknown>)[key];
        if (typeof value !== "function") return value;
        return (...args: unknown[]) => {
          if (typeof key === "string" && WRITES.has(key) && writes++ === failOnWrite) {
            throw new Error(`injected failure on write ${failOnWrite}`);
          }
          return (value as (...a: unknown[]) => unknown).apply(target, args);
        };
      },
    });
  const wrapTx = (tx: unknown): unknown =>
    new Proxy(tx as object, {
      get(target, key) {
        const value = (target as Record<string | symbol, unknown>)[key];
        if (typeof key === "string" && key.startsWith("academy")) return wrapModel(value);
        return value;
      },
    });
  const client = new Proxy(fakePrisma as object, {
    get(target, key) {
      if (key === "$transaction") {
        return (fn: (tx: unknown) => Promise<unknown>, options?: unknown) =>
          (target as { $transaction: (f: unknown, o?: unknown) => Promise<unknown> }).$transaction(
            (tx: unknown) => fn(wrapTx(tx)),
            options,
          );
      }
      return (target as Record<string | symbol, unknown>)[key];
    },
  });
  return client as unknown as PrismaClient;
}

beforeEach(() => {
  resetFakeDb();
});

describe("first import", () => {
  it("creates one BRIEF lesson and one DRAFT revision v1 per brief, with source identity and hashes", async () => {
    const stats = await applyBriefImport(db, V1);

    expect(stats).toMatchObject({ total: 3, lessonsCreated: 3, lessonsUpdated: 0, lessonsUnchanged: 0, revisionsCreated: 3, retired: 0 });
    expect(rows("academyContentLesson")).toHaveLength(3);
    expect(rows("academyLessonRevision")).toHaveLength(3);

    const lesson = lessonBy("U01-01");
    expect(lesson).toMatchObject({ contentStatus: "BRIEF", sourceVersion: "draft-1", title: "Lesson U01-01" });
    expect(typeof lesson?.sourceHash).toBe("string");

    const [revision] = revisionsOf("U01-01");
    expect(revision).toMatchObject({ version: 1, status: "DRAFT", publishedAt: null });
    expect(revision.body).toMatchObject({ sourceId: "U01-01", sourceVersion: "draft-1", sourceInventory: BRIEF_INVENTORY_ID });
  });

  it("creates no track, placement or course-track rows", async () => {
    await applyBriefImport(db, V1);
    expect(rows("academyCurriculumTrack")).toHaveLength(0);
    expect(rows("academyLessonPlacement")).toHaveLength(0);
    expect(rows("academyCourseTrack")).toHaveLength(0);
  });
});

describe("exact repeat", () => {
  it("writes nothing and leaves existing track and placement rows exactly as they were", async () => {
    await applyBriefImport(db, V1);
    await seed("academyCurriculumTrack", [{ id: "trk-1", slug: "base", title: "Base", scope: "all", status: "PUBLISHED" }]);
    await seed("academyLessonPlacement", [{ id: "plc-1", trackId: "trk-1", lessonId: lessonBy("U01-01")!.id, position: 1, required: true }]);
    const before = snapshot();

    const stats = await applyBriefImport(db, V1);

    expect(stats).toMatchObject({ lessonsCreated: 0, lessonsUpdated: 0, lessonsUnchanged: 3, revisionsCreated: 0, retired: 0, restored: 0 });
    expect(snapshot()).toEqual(before);
    expect(rows("academyLessonPlacement")).toHaveLength(1);
  });
});

describe("changed source revision", () => {
  it("updates an unreviewed row and appends revision v2, keeping v1 as lineage", async () => {
    await applyBriefImport(db, V1);
    const v1Hash = revisionsOf("U01-01")[0].contentHash;

    const next: BriefInventory = { version: "draft-2", lessons: [brief("U01-01", { title: "Revised title" }), brief("U01-02"), brief("U01-03")] };
    const stats = await applyBriefImport(db, next);

    // Only U01-01 has new content. The other two rows get the new sourceVersion, and no revision is written for them.
    expect(stats).toMatchObject({ lessonsUpdated: 3, revisionsCreated: 1 });
    expect(lessonBy("U01-01")).toMatchObject({ title: "Revised title", sourceVersion: "draft-2", contentStatus: "BRIEF" });
    expect(revisionsOf("U01-02")).toHaveLength(1);
    const revisions = revisionsOf("U01-01");
    expect(revisions.map((r) => r.version)).toEqual([1, 2]);
    expect(revisions[0].contentHash).toBe(v1Hash);
    expect(revisions[1]).toMatchObject({ status: "DRAFT", body: expect.objectContaining({ title: "Revised title", sourceVersion: "draft-2" }) });
  });

  it("does not draft a reviewed lesson's row over approved content and keeps its published revision", async () => {
    await applyBriefImport(db, V1);
    const published = revisionsOf("U01-02")[0];
    const approvedTitle = lessonBy("U01-02")!.title;
    // Approval through the same client the review path uses: lesson PUBLISHED, revision PUBLISHED.
    await db.academyLessonRevision.update({ where: { id: String(published.id) }, data: { status: "PUBLISHED", publishedAt: new Date("2026-11-01T00:00:00Z") } });
    await db.academyContentLesson.update({ where: { sourceId: "U01-02" }, data: { contentStatus: "PUBLISHED" } });

    const next: BriefInventory = { version: "draft-2", lessons: [brief("U01-01"), brief("U01-02", { title: "Source wording changed" }), brief("U01-03")] };
    const stats = await applyBriefImport(db, next);

    expect(stats.reviewedRevisionsDrafted).toBe(1);
    // U01-01 and U01-03 are unreviewed and only refresh their version. U01-02 keeps its row.
    expect(stats.lessonsUpdated).toBe(2);
    expect(lessonBy("U01-02")).toMatchObject({ title: approvedTitle, contentStatus: "PUBLISHED" });
    const revisions = revisionsOf("U01-02");
    expect(revisions).toHaveLength(2);
    expect(revisions[0]).toMatchObject({ version: 1, status: "PUBLISHED", contentHash: published.contentHash });
    expect(revisions[1]).toMatchObject({ version: 2, status: "DRAFT", body: expect.objectContaining({ title: "Source wording changed" }) });

    const again = await applyBriefImport(db, next);
    expect(again.revisionsCreated).toBe(0);
    expect(revisionsOf("U01-02")).toHaveLength(2);
  });

  it("a version bump with identical content writes no revision but refreshes the unreviewed row's version", async () => {
    await applyBriefImport(db, V1);
    const stats = await applyBriefImport(db, { version: "draft-2", lessons: V1.lessons });
    expect(stats).toMatchObject({ revisionsCreated: 0, lessonsUpdated: 3 });
    expect(rows("academyLessonRevision")).toHaveLength(3);
    expect(lessonBy("U01-01")).toMatchObject({ sourceVersion: "draft-2" });
    expect(revisionsOf("U01-01")[0].body).toMatchObject({ sourceVersion: "draft-1" });
  });

  it("treats a reverted source as a new revision only when it differs from the newest one", async () => {
    await applyBriefImport(db, V1);
    await applyBriefImport(db, { version: "draft-2", lessons: [brief("U01-01", { title: "Changed" }), brief("U01-02"), brief("U01-03")] });
    const back = await applyBriefImport(db, V1);
    expect(back.revisionsCreated).toBe(1);
    expect(lessonBy("U01-01")).toMatchObject({ title: "Lesson U01-01", sourceVersion: "draft-1" });
    expect(revisionsOf("U01-01").map((r) => r.version)).toEqual([1, 2, 3]);
  });
});

describe("retired content", () => {
  it("marks an unreviewed lesson RETIRED, keeps its rows, and restores it when it returns", async () => {
    await applyBriefImport(db, V1);
    const withoutThird: BriefInventory = { version: "draft-2", lessons: [brief("U01-01"), brief("U01-02")] };

    const retire = await applyBriefImport(db, withoutThird);
    expect(retire).toMatchObject({ retired: 1, retiredNeedsReview: [] });
    expect(lessonBy("U01-03")).toMatchObject({ contentStatus: "RETIRED" });
    expect(revisionsOf("U01-03")).toHaveLength(1);

    const repeatRetire = await applyBriefImport(db, withoutThird);
    expect(repeatRetire.retired).toBe(0);

    const back = await applyBriefImport(db, { version: "draft-3", lessons: [brief("U01-01"), brief("U01-02"), brief("U01-03")] });
    expect(back).toMatchObject({ restored: 1, lessonsUpdated: 3, revisionsCreated: 0 });
    expect(lessonBy("U01-03")).toMatchObject({ contentStatus: "BRIEF", sourceVersion: "draft-3" });
    expect(revisionsOf("U01-03")).toHaveLength(1);
  });

  it("reports a removed lesson that has reviewed content without changing its status", async () => {
    await applyBriefImport(db, V1);
    await db.academyContentLesson.update({ where: { sourceId: "U01-03" }, data: { contentStatus: "PUBLISHED" } });
    const stats = await applyBriefImport(db, { version: "draft-2", lessons: [brief("U01-01"), brief("U01-02")] });
    expect(stats.retired).toBe(0);
    expect(stats.retiredNeedsReview).toEqual(["U01-03"]);
    expect(lessonBy("U01-03")).toMatchObject({ contentStatus: "PUBLISHED" });
  });

  it("never retires lessons this inventory did not write", async () => {
    await applyBriefImport(db, V1);
    await seed("academyContentLesson", [{ sourceId: "MANUAL-1", layer: "Universal", serviceGroup: "x", unit: "u", title: "Manual", objective: "o", assessment: "a", contentStatus: "BRIEF", sourceVersion: "manual", sourceHash: "h" }]);
    const stats = await applyBriefImport(db, { version: "draft-2", lessons: [brief("U01-01"), brief("U01-02"), brief("U01-03")] });
    expect(stats.retired).toBe(0);
    expect(lessonBy("MANUAL-1")).toMatchObject({ contentStatus: "BRIEF" });
  });
});

describe("partial failure and retry", () => {
  it("rolls back every write when a later write fails, then a retry reaches the same state as a clean run", async () => {
    const clean = snapshot();
    await applyBriefImport(db, V1);
    const expected = snapshot();

    resetFakeDb();
    await expect(applyBriefImport(failingClient(4), V1)).rejects.toThrow("injected failure");
    expect(snapshot()).toEqual(clean);

    await applyBriefImport(db, V1);
    expect(snapshot()).toEqual(expected);
  });

  it("a failure during a changed-revision import leaves the previous revision state intact", async () => {
    await applyBriefImport(db, V1);
    const before = snapshot();
    const next: BriefInventory = { version: "draft-2", lessons: [brief("U01-01", { title: "New" }), brief("U01-02"), brief("U01-03")] };

    await expect(applyBriefImport(failingClient(1), next)).rejects.toThrow("injected failure");
    expect(snapshot()).toEqual(before);

    const stats = await applyBriefImport(db, next);
    expect(stats).toMatchObject({ lessonsUpdated: 3, revisionsCreated: 1 });
    expect(revisionsOf("U01-01").map((r) => r.version)).toEqual([1, 2]);
  });
});

describe("inventory validation", () => {
  it.each([
    ["duplicate source ID", { version: "v", lessons: [brief("U01-01"), brief("U01-01")] }],
    ["invalid source ID", { version: "v", lessons: [brief("bad id!")] }],
    ["missing title", { version: "v", lessons: [brief("U01-01", { title: " " })] }],
    ["no lessons", { version: "v", lessons: [] }],
    ["no version", { lessons: [brief("U01-01")] }],
  ])("refuses %s before any write", async (_label, payload) => {
    await expect(applyBriefImport(db, payload as unknown as BriefInventory)).rejects.toThrow();
    expect(rows("academyContentLesson")).toHaveLength(0);
    expect(rows("academyLessonRevision")).toHaveLength(0);
  });

  it("derives lesson-row content from the brief with no extra fields", () => {
    expect(briefContent(brief("U01-01", { service_group: "" }))).toEqual({
      layer: "Universal",
      serviceGroup: "",
      unit: "Professional Induction",
      title: "Lesson U01-01",
      objective: "Learner can apply U01-01.",
      assessment: "Scenario check",
    });
  });
});
