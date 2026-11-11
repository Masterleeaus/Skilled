/**
 * Module reorder scope (issue #46). A teacher may reorder only the modules of a course they own. Every
 * rejected request leaves all rows unchanged. Database-independent: runs against the in-memory Prisma double.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { AppError } from "../utils/AppError";
import { assertCompleteOrder, reorderModules } from "../modules/courses/module.service";
import { resetFakeDb, rows, seed } from "./support/fake-prisma";

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
    { id: "a1", courseId: COURSE_A, title: "A one", orderIndex: 0 },
    { id: "a2", courseId: COURSE_A, title: "A two", orderIndex: 1 },
    { id: "a3", courseId: COURSE_A, title: "A three", orderIndex: 2 },
    { id: "b1", courseId: COURSE_B, title: "B one", orderIndex: 0 },
    { id: "b2", courseId: COURSE_B, title: "B two", orderIndex: 1 },
  ]);
}

function orderSnapshot(): Record<string, number> {
  return Object.fromEntries(rows("module").map((m) => [String(m.id), Number(m.orderIndex)]));
}

describe("reorderModules scope (issue #46)", () => {
  beforeEach(setup);

  it("reorders a complete list of the owned course's modules", async () => {
    await reorderModules(COURSE_A, ["a3", "a1", "a2"], TEACHER, "TEACHER" as never);

    expect(orderSnapshot()).toEqual({ a1: 1, a2: 2, a3: 0, b1: 0, b2: 1 });
  });

  it("rejects a foreign module ID from another course and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderModules(COURSE_A, ["a2", "b1", "a1", "a3"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects a list that mixes owned and foreign IDs even when the owned part is complete", async () => {
    const before = orderSnapshot();

    await expect(
      reorderModules(COURSE_A, ["a1", "a2", "b2"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects duplicate IDs and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderModules(COURSE_A, ["a1", "a1", "a2"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400, message: "Duplicate Module ID in reorder request" });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects an omitted sibling module and changes no rows", async () => {
    const before = orderSnapshot();

    await expect(
      reorderModules(COURSE_A, ["a2", "a1"], TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("rejects a teacher who does not own the course", async () => {
    const before = orderSnapshot();

    await expect(
      reorderModules(COURSE_A, ["a3", "a2", "a1"], OTHER_TEACHER, "TEACHER" as never),
    ).rejects.toMatchObject({ statusCode: 403 });

    expect(orderSnapshot()).toEqual(before);
  });

  it("lets an admin reorder any course's complete module list", async () => {
    await reorderModules(COURSE_B, ["b2", "b1"], TEACHER, "ADMIN" as never);

    expect(orderSnapshot()).toMatchObject({ b1: 1, b2: 0 });
  });
});

describe("assertCompleteOrder (shared policy for modules and lessons)", () => {
  it("accepts a complete permutation in any order", () => {
    expect(() => assertCompleteOrder(["l2", "l1"], ["l1", "l2"], "Lesson")).not.toThrow();
  });

  it("rejects lesson IDs that belong to another module", () => {
    expect(() => assertCompleteOrder(["l1", "foreign-lesson"], ["l1", "l2"], "Lesson")).toThrow(AppError);
  });

  it("rejects duplicate lesson IDs", () => {
    expect(() => assertCompleteOrder(["l1", "l1"], ["l1", "l2"], "Lesson")).toThrow(AppError);
  });

  it("rejects an omitted lesson", () => {
    expect(() => assertCompleteOrder(["l1"], ["l1", "l2"], "Lesson")).toThrow(AppError);
  });

  it("rejects any list against a parent with no children", () => {
    expect(() => assertCompleteOrder(["l1"], [], "Lesson")).toThrow(AppError);
  });
});
