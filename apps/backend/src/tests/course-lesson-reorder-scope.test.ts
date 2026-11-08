/**
 * Lesson reorder scope (issue #46). A teacher may reorder only the lessons of a module in a course they own, and
 * the order must be a complete permutation of that module's lessons. Every rejected request leaves all rows
 * unchanged. Database-independent: runs against the in-memory Prisma double.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { reorderLessons } from "../modules/courses/lesson.service";

const TEACHER = "teacher-a";
const OTHER_TEACHER = "teacher-b";
const COURSE_A = "course-a";
const COURSE_B = "course-b";

async function setup() {
  resetFakeDb();
  await seed("category", [{ id: "cat-1", name: "Safety", slug: "safety" }]);
  await seed("user", [
    { id: TEACHER, email: "a@example.test", passwordHash: "x", role: "TEACHER" },
    { id: OTHER_TEACHER, email: "b@example.test", passwordHash: "x", role: "TEACHER" },
  ]);
  await seed("course", [
    { id: COURSE_A, title: "A", slug: "a", description: "a", categoryId: "cat-1", teacherId: TEACHER },
    { id: COURSE_B, title: "B", slug: "b", description: "b", categoryId: "cat-1", teacherId: OTHER_TEACHER },
  ]);
  await seed("module", [
    { id: "m1", courseId: COURSE_A, title: "A module one", orderIndex: 0 },
    { id: "m2", courseId: COURSE_A, title: "A module two", orderIndex: 1 },
    { id: "mB", courseId: COURSE_B, title: "B module", orderIndex: 0 },
  ]);
  await seed("lesson", [
    { id: "l1", moduleId: "m1", title: "One", orderIndex: 0 },
    { id: "l2", moduleId: "m1", title: "Two", orderIndex: 1 },
    { id: "l3", moduleId: "m1", title: "Three", orderIndex: 2 },
    { id: "l4", moduleId: "m2", title: "Four", orderIndex: 0 },
    { id: "l5", moduleId: "m2", title: "Five", orderIndex: 1 },
    { id: "lb1", moduleId: "mB", title: "Foreign one", orderIndex: 0 },
    { id: "lb2", moduleId: "mB", title: "Foreign two", orderIndex: 1 },
  ]);
}

function orderSnapshot(): Record<string, number> {
  return Object.fromEntries(rows("lesson").map((l) => [String(l.id), Number(l.orderIndex)]));
}

function moduleSnapshot(): Record<string, string> {
  return Object.fromEntries(rows("lesson").map((l) => [String(l.id), String(l.moduleId)]));
}

describe("reorderLessons scope (issue #46)", () => {
  beforeEach(setup);
  afterEach(() => vi.restoreAllMocks());

  it("reorders a complete list of the owned module's lessons", async () => {
    await reorderLessons("m1", ["l3", "l1", "l2"], TEACHER, "TEACHER" as never);

    expect(orderSnapshot()).toEqual({ l1: 1, l2: 2, l3: 0, l4: 0, l5: 1, lb1: 0, lb2: 1 });
  });

  it("rejects a foreign lesson ID from another teacher's course and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderLessons("m1", ["l2", "lb1", "l1", "l3"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects a nonexistent lesson ID and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderLessons("m1", ["l1", "l2", "ghost"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects a lesson from another module in the same course and leaves its module unchanged", async () => {
    const before = orderSnapshot();
    const modulesBefore = moduleSnapshot();

    await expect(
      reorderLessons("m1", ["l1", "l4", "l2", "l3"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400, message: "Lesson IDs must belong to the parent being reordered" });

    expect(orderSnapshot()).toEqual(before);
    expect(moduleSnapshot()).toEqual(modulesBefore);
  });

  it("rejects duplicate IDs and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderLessons("m1", ["l1", "l1", "l2"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400, message: "Duplicate Lesson ID in reorder request" });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects an omitted lesson and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderLessons("m1", ["l2", "l1"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects a teacher who does not own the course and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderLessons("m1", ["l3", "l2", "l1"], OTHER_TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rolls back earlier writes when a scoped write matches no row", async () => {
    const before = orderSnapshot();
    const lessonApi = fakePrisma.lesson as unknown as {
      updateMany: (args: unknown) => Promise<{ count: number }>;
    };
    const realUpdateMany = lessonApi.updateMany;
    let call = 0;
    vi.spyOn(lessonApi, "updateMany").mockImplementation((args: unknown) => {
      call += 1;
      // The second scoped write finds no row, as if the lesson had left the module after the check.
      if (call === 2) return Promise.resolve({ count: 0 });
      return realUpdateMany(args);
    });

    await expect(
      reorderLessons("m1", ["l3", "l2", "l1"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400, message: "Lesson reorder failed; no changes were saved" });

    expect(call).toBe(2);
    expect(orderSnapshot()).toEqual(before);
  });
});
