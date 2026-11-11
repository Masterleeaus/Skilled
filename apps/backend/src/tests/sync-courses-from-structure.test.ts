/**
 * Course sync (scripts/sync-courses-from-structure.ts): dry-run writes nothing, a second run is a no-op, existing rows
 * are never deleted or re-described, and missing settings fail before any database read. Runs against an in-memory
 * double of the three Prisma models it uses. No database is needed.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({ env: { CURRICULUM_DIR: "", NODE_ENV: "test" } }));
vi.mock("../config/prisma", () => ({ prisma: {} }));

import {
  parseSyncArgs,
  readSyncSettings,
  syncCoursesFromStructure,
  type SyncSettings,
} from "../../scripts/sync-courses-from-structure";
import { readStructure } from "../modules/curriculum/curriculum-publisher";

type Prisma = Parameters<typeof syncCoursesFromStructure>[0]["db"];

interface Row {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  teacherId: string;
  price: number;
  level: string;
  isPublished: boolean;
  deletedAt: Date | null;
}

const CATEGORY = "cat-test";
const TEACHER = "user-test";
const SETTINGS: SyncSettings = { categoryId: CATEGORY, teacherId: TEACHER };

/** In-memory double. It mirrors the soft-delete extension: queries hide deleted rows unless the caller filters on deletedAt. */
function createFakeDb(seed: { courses?: Partial<Row>[]; categories?: string[]; users?: string[]; deletedCategories?: string[] } = {}) {
  const courses: Row[] = (seed.courses ?? []).map((row, index) => ({
    id: `seed-${index}`,
    slug: "",
    title: "",
    description: "",
    categoryId: CATEGORY,
    teacherId: TEACHER,
    price: 0,
    level: "BEGINNER",
    isPublished: false,
    deletedAt: null,
    ...row,
  }));
  const writes: string[] = [];
  let nextId = 1;
  const categories = new Set(seed.categories ?? [CATEGORY]);
  const deletedCategories = new Set(seed.deletedCategories ?? []);
  const users = new Set(seed.users ?? [TEACHER]);

  const db = {
    writes,
    courses,
    course: {
      findMany: async (args: { where: { slug?: { in: string[] }; deletedAt?: unknown }; select: Record<string, true> }) => {
        const wantDeleted = args.where.deletedAt !== undefined;
        let rows = courses.filter((row) => (wantDeleted ? row.deletedAt !== null : row.deletedAt === null));
        if (args.where.slug) rows = rows.filter((row) => args.where.slug!.in.includes(row.slug));
        return rows.map((row) => Object.fromEntries(Object.keys(args.select).map((key) => [key, row[key as keyof Row]])));
      },
      create: async (args: { data: Omit<Row, "id" | "price" | "level" | "isPublished" | "deletedAt"> }) => {
        writes.push(`create:${args.data.slug}`);
        if (courses.some((row) => row.slug === args.data.slug)) throw new Error("Unique constraint failed on slug");
        const row: Row = { ...args.data, id: `new-${nextId++}`, price: 0, level: "BEGINNER", isPublished: false, deletedAt: null };
        courses.push(row);
        return row;
      },
      update: async (args: { where: { id: string }; data: { title: string } }) => {
        writes.push(`update:${args.where.id}`);
        const row = courses.find((candidate) => candidate.id === args.where.id);
        if (!row) throw new Error("not found");
        Object.assign(row, args.data);
        return row;
      },
    },
    category: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        categories.has(where.id) && !deletedCategories.has(where.id) ? { id: where.id } : null,
    },
    user: {
      findFirst: async ({ where }: { where: { id: string; isActive: boolean } }) =>
        users.has(where.id) ? { id: where.id } : null,
    },
  };
  return db;
}

type FakeDb = ReturnType<typeof createFakeDb>;

const structureData = {
  meta: { generated: "test" },
  courses: [
    { slug: "sync-test-a", title: "Sync test A", group: "G", modules: [{ module: "M", lessons: [{ id: "T-1", title: "One" }] }] },
    { slug: "sync-test-b", title: "Sync test B", group: "G", modules: [{ module: "M", lessons: [{ id: "T-2", title: "Two" }] }] },
    { slug: "sync-test-c", title: "Sync test C", group: "G", modules: [{ module: "M", lessons: [{ id: "T-3", title: "Three" }] }] },
  ],
};

const structure = () => readStructure(structureData).courses;

const asPrisma = (db: FakeDb) => db as unknown as Prisma;

describe("readSyncSettings and parseSyncArgs", () => {
  it("fails clearly when both IDs are missing", () => {
    expect(() => readSyncSettings({})).toThrow(/CURRICULUM_SYNC_CATEGORY_ID.*CURRICULUM_SYNC_TEACHER_ID/);
  });

  it("names only the one that is missing", () => {
    let message = "";
    try {
      readSyncSettings({ CURRICULUM_SYNC_CATEGORY_ID: "cat" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/CURRICULUM_SYNC_TEACHER_ID/);
    expect(message).not.toMatch(/CURRICULUM_SYNC_CATEGORY_ID/);
  });

  it("returns the trimmed IDs when both are set", () => {
    expect(readSyncSettings({ CURRICULUM_SYNC_CATEGORY_ID: " cat ", CURRICULUM_SYNC_TEACHER_ID: "usr" })).toEqual({
      categoryId: "cat",
      teacherId: "usr",
    });
  });

  it("refuses unknown arguments", () => {
    expect(parseSyncArgs(["--dry-run"])).toEqual({ dryRun: true });
    expect(parseSyncArgs([])).toEqual({ dryRun: false });
    expect(() => parseSyncArgs(["--apply"])).toThrow(/Unknown argument/);
  });
});

describe("syncCoursesFromStructure", () => {
  let db: FakeDb;

  beforeEach(() => {
    db = createFakeDb({ courses: [{ slug: "sync-test-b", title: "Old title", description: "Keep me", teacherId: "other-teacher" }] });
  });

  it("dry-run reports what would change and writes nothing", async () => {
    const summary = await syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: SETTINGS, dryRun: true });
    expect(summary).toMatchObject({ dryRun: true, courses: 3, created: 2, updated: 1, unchanged: 0 });
    expect(summary.createdSlugs).toEqual(["sync-test-a", "sync-test-c"]);
    expect(summary.updatedSlugs).toEqual(["sync-test-b"]);
    expect(db.writes).toEqual([]);
    expect(db.courses).toHaveLength(1);
    expect(db.courses[0].title).toBe("Old title");
  });

  it("apply creates missing rows with the given category and teacher, and fixes only the changed title", async () => {
    const summary = await syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: SETTINGS, dryRun: false });
    expect(summary).toMatchObject({ created: 2, updated: 1, unchanged: 0 });
    const created = db.courses.find((row) => row.slug === "sync-test-a")!;
    expect(created).toMatchObject({ title: "Sync test A", description: "", categoryId: CATEGORY, teacherId: TEACHER, price: 0, level: "BEGINNER", isPublished: false });
    const existing = db.courses.find((row) => row.slug === "sync-test-b")!;
    expect(existing).toMatchObject({ title: "Sync test B", description: "Keep me", teacherId: "other-teacher" });
  });

  it("a second run is a no-op", async () => {
    await syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: SETTINGS, dryRun: false });
    db.writes.length = 0;
    const second = await syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: SETTINGS, dryRun: false });
    expect(second).toMatchObject({ created: 0, updated: 0, unchanged: 3 });
    expect(db.writes).toEqual([]);
    expect(db.courses).toHaveLength(3);
  });

  it("never deletes rows, including rows the structure does not name", async () => {
    db.courses.push({ id: "extra", slug: "hand-made", title: "Hand made", description: "d", categoryId: CATEGORY, teacherId: TEACHER, price: 0, level: "BEGINNER", isPublished: true, deletedAt: null });
    await syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: SETTINGS, dryRun: false });
    expect(db.courses.find((row) => row.slug === "hand-made")).toMatchObject({ title: "Hand made", isPublished: true });
    expect(db.courses).toHaveLength(4);
  });

  it("refuses a category that does not exist, before any write", async () => {
    await expect(
      syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: { categoryId: "nope", teacherId: TEACHER }, dryRun: false }),
    ).rejects.toThrow(/CURRICULUM_SYNC_CATEGORY_ID does not match/);
    expect(db.writes).toEqual([]);
  });

  it("refuses a teacher that does not exist, before any write", async () => {
    await expect(
      syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: { categoryId: CATEGORY, teacherId: "nope" }, dryRun: false }),
    ).rejects.toThrow(/CURRICULUM_SYNC_TEACHER_ID does not match/);
    expect(db.writes).toEqual([]);
  });

  it("refuses a slug held by a soft-deleted row, before any write", async () => {
    db.courses.push({ id: "gone", slug: "sync-test-c", title: "Gone", description: "", categoryId: CATEGORY, teacherId: TEACHER, price: 0, level: "BEGINNER", isPublished: false, deletedAt: new Date() });
    await expect(
      syncCoursesFromStructure({ db: asPrisma(db), structure: structure(), settings: SETTINGS, dryRun: false }),
    ).rejects.toThrow(/Soft-deleted course rows already use these slugs: sync-test-c/);
    expect(db.writes).toEqual([]);
  });

  it("keeps the first of a duplicated slug and reports the second", async () => {
    const dup = [...structure(), { slug: "sync-test-a", title: "Second copy", group: "G", modules: [] }];
    const summary = await syncCoursesFromStructure({ db: asPrisma(db), structure: dup, settings: SETTINGS, dryRun: false });
    expect(summary.courses).toBe(3);
    expect(summary.warnings).toHaveLength(1);
    expect(db.courses.find((row) => row.slug === "sync-test-a")!.title).toBe("Sync test A");
  });
});

describe("missing settings", () => {
  it("fails before the database is touched", () => {
    const db = createFakeDb();
    expect(() => readSyncSettings({})).toThrow(/Not set/);
    expect(db.writes).toEqual([]);
  });
});
