/**
 * Course soft delete (issue #50) and the lesson video keys it leaves in storage (issue #51, course level).
 * Runs the real course and enrolment services against the in-memory Prisma double. The audit service is stubbed.
 */
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../config/logger", () => ({
  logger: { error: () => undefined, warn: () => undefined, info: () => undefined, debug: () => undefined },
  httpLogStream: { write: () => undefined },
}));
vi.mock("../modules/audit/audit.service", () => ({ recordAuditLog: vi.fn(async () => undefined) }));

import { fakePrisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { assertCourseOwnership, deleteCourse, listCourseVideoObjectKeys, setPublishStatus } from "../modules/courses/course.service";
import { enrollInCourse } from "../modules/enrollment/enrollment.service";
import { recordAuditLog } from "../modules/audit/audit.service";
import { NotFoundError, ForbiddenError } from "../utils/AppError";

const TEACHER = "teacher-1";
const OTHER_TEACHER = "teacher-2";
const ADMIN = "admin-1";
const LEARNER = "learner-1";
const COURSE = "course-1";
const VIDEO_KEY = "lessons/course-1/intro.mp4";

async function seedCourse(): Promise<void> {
  await seed("user", [
    { id: TEACHER, email: "teacher@example.test", passwordHash: "x", fullName: "Teacher", role: "TEACHER" },
    { id: OTHER_TEACHER, email: "other@example.test", passwordHash: "x", fullName: "Other", role: "TEACHER" },
    { id: ADMIN, email: "admin@example.test", passwordHash: "x", fullName: "Admin", role: "ADMIN" },
    { id: LEARNER, email: "learner@example.test", passwordHash: "x", fullName: "Learner", role: "STUDENT" },
  ]);
  await seed("category", [{ id: "cat-1", name: "Safety", slug: "safety" }]);
  await seed("course", [
    {
      id: COURSE,
      title: "Workplace safety",
      slug: "workplace-safety",
      description: "Course description text",
      categoryId: "cat-1",
      teacherId: TEACHER,
      price: 0,
      level: "BEGINNER",
      isPublished: true,
      deletedAt: null,
    },
  ]);
  await seed("module", [{ id: "mod-1", courseId: COURSE, title: "Module 1", orderIndex: 0 }]);
  await seed("lesson", [
    { id: "les-1", moduleId: "mod-1", title: "Intro", videoUrl: VIDEO_KEY, orderIndex: 0 },
    { id: "les-2", moduleId: "mod-1", title: "Text only", videoUrl: null, orderIndex: 1 },
  ]);
  await seed("enrollment", [{ id: "enr-1", studentId: LEARNER, courseId: COURSE }]);
}

function courseRow() {
  const row = rows("course").find((candidate) => candidate.id === COURSE);
  if (!row) throw new Error("course row missing");
  return row;
}

beforeEach(async () => {
  resetFakeDb();
  vi.mocked(recordAuditLog).mockClear();
  await seedCourse();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deleteCourse (soft delete only)", () => {
  it("sets deletedAt and unpublishes in one write, and keeps the course row", async () => {
    await deleteCourse(COURSE, TEACHER, "TEACHER");

    const row = courseRow();
    expect(row.deletedAt).toBeInstanceOf(Date);
    expect(row.isPublished).toBe(false);
    expect(rows("course")).toHaveLength(1);
  });

  it("makes no hard delete call on the course or on any historical model", async () => {
    const courseDelete = vi.spyOn(fakePrisma.course, "delete");
    const courseDeleteMany = vi.spyOn(fakePrisma.course, "deleteMany");
    const moduleDelete = vi.spyOn(fakePrisma.module, "delete");
    const lessonDelete = vi.spyOn(fakePrisma.lesson, "delete");
    const enrollmentDelete = vi.spyOn(fakePrisma.enrollment, "delete");

    await deleteCourse(COURSE, TEACHER, "TEACHER");

    expect(courseDelete).not.toHaveBeenCalled();
    expect(courseDeleteMany).not.toHaveBeenCalled();
    expect(moduleDelete).not.toHaveBeenCalled();
    expect(lessonDelete).not.toHaveBeenCalled();
    expect(enrollmentDelete).not.toHaveBeenCalled();
  });

  it("keeps modules, lessons and enrolments intact", async () => {
    await deleteCourse(COURSE, TEACHER, "TEACHER");

    expect(rows("module").map((m) => m.id)).toEqual(["mod-1"]);
    expect(rows("lesson").map((l) => l.id).sort()).toEqual(["les-1", "les-2"]);
    expect(rows("enrollment").map((e) => e.id)).toEqual(["enr-1"]);
  });

  it("records COURSE_DELETED with the title and prior publish state", async () => {
    await deleteCourse(COURSE, TEACHER, "TEACHER");

    expect(recordAuditLog).toHaveBeenCalledTimes(1);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "COURSE_DELETED",
        entity: "Course",
        entityId: COURSE,
        oldValue: { title: "Workplace safety", isPublished: true },
      }),
    );
  });

  it("refuses a second delete of the same course as not found and writes no second audit entry", async () => {
    await deleteCourse(COURSE, TEACHER, "TEACHER");
    await expect(deleteCourse(COURSE, TEACHER, "TEACHER")).rejects.toBeInstanceOf(NotFoundError);
    expect(recordAuditLog).toHaveBeenCalledTimes(1);
  });

  it("refuses a teacher who does not own the course, and leaves it untouched", async () => {
    await expect(deleteCourse(COURSE, OTHER_TEACHER, "TEACHER")).rejects.toBeInstanceOf(ForbiddenError);
    expect(courseRow().deletedAt).toBeNull();
    expect(courseRow().isPublished).toBe(true);
  });
});

describe("lesson video object keys on course deletion (course level)", () => {
  it("lists the lesson videoUrl keys under the course without deleting them", async () => {
    expect(await listCourseVideoObjectKeys(COURSE)).toEqual([VIDEO_KEY]);

    await deleteCourse(COURSE, TEACHER, "TEACHER");

    expect(rows("lesson").find((l) => l.id === "les-1")?.videoUrl).toBe(VIDEO_KEY);
  });
});

describe("deleted courses are not found by write, publish and enrolment paths", () => {
  beforeEach(async () => {
    await deleteCourse(COURSE, TEACHER, "TEACHER");
  });

  it("setPublishStatus cannot republish a deleted course", async () => {
    await expect(setPublishStatus(COURSE, true, TEACHER, "TEACHER")).rejects.toBeInstanceOf(NotFoundError);
    expect(courseRow().isPublished).toBe(false);
  });

  it("assertCourseOwnership reports not found for the owner and for an administrator", async () => {
    await expect(assertCourseOwnership(COURSE, TEACHER, "TEACHER")).rejects.toBeInstanceOf(NotFoundError);
    await expect(assertCourseOwnership(COURSE, ADMIN, "ADMIN")).rejects.toBeInstanceOf(NotFoundError);
  });

  // The double has no soft-delete extension, so enrolment is refused here because deletion unpublished the course.
  // In production the extension also hides the row (NotFound). Explicit deletedAt checks in enrolment are a follow-up.
  it("enrolment refuses a deleted course and creates no enrolment row", async () => {
    await expect(enrollInCourse("learner-2", COURSE)).rejects.toThrow();
    expect(rows("enrollment").some((e) => e.studentId === "learner-2")).toBe(false);
  });
});
