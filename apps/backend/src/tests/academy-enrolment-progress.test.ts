/**
 * ACA-014: enrolment, lesson completion, quiz attempts and progress calculation.
 * Runs the real enrolment and quiz services against an in-memory Prisma double.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../jobs/certificate.queue", () => ({ queueCertificateIssuance: vi.fn(async () => undefined) }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { queueCertificateIssuance } from "../jobs/certificate.queue";
import {
  enrollInCourse,
  getCourseProgress,
  updateLessonProgress,
} from "../modules/enrollment/enrollment.service";
import { startAttempt, submitAttempt } from "../modules/quizzes/quiz.service";

const STUDENT = "student-1";
const OTHER_STUDENT = "student-2";
const COURSE = "course-1";

async function seedCourse(lessonCount: number, options: { published?: boolean; price?: number } = {}) {
  await seed("user", [
    { id: STUDENT, email: "s1@example.test", fullName: "Student One", role: "STUDENT" },
    { id: OTHER_STUDENT, email: "s2@example.test", fullName: "Student Two", role: "STUDENT" },
  ]);
  await seed("course", [{ id: COURSE, title: "Course", slug: "course", isPublished: options.published ?? true, price: options.price ?? 0 }]);
  await seed("module", [{ id: "module-1", courseId: COURSE, title: "Module", orderIndex: 1 }]);
  await seed(
    "lesson",
    Array.from({ length: lessonCount }, (_, index) => ({
      id: `lesson-${index + 1}`,
      moduleId: "module-1",
      title: `Lesson ${index + 1}`,
      orderIndex: index + 1,
    })),
  );
}

async function enrolmentRow(studentId = STUDENT) {
  return prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId: COURSE } } });
}

beforeEach(() => {
  resetFakeDb();
  vi.mocked(queueCertificateIssuance).mockClear();
});

describe("ACA-014 enrolment", () => {
  it("enrols a learner in a published free course at 0% and ACTIVE", async () => {
    await seedCourse(4);
    const enrollment = await enrollInCourse(STUDENT, COURSE);
    expect(enrollment).toMatchObject({ studentId: STUDENT, courseId: COURSE, progressPercentage: 0, status: "ACTIVE" });
    expect(rows("enrollment")).toHaveLength(1);
  });

  it("rejects duplicate enrolment, unpublished courses and paid courses without creating rows", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await expect(enrollInCourse(STUDENT, COURSE)).rejects.toMatchObject({ statusCode: 409 });
    await expect(enrollInCourse(OTHER_STUDENT, "missing-course")).rejects.toMatchObject({ statusCode: 404 });

    await prisma.course.update({ where: { id: COURSE }, data: { isPublished: false } });
    await expect(enrollInCourse(OTHER_STUDENT, COURSE)).rejects.toMatchObject({ statusCode: 400 });

    await prisma.course.update({ where: { id: COURSE }, data: { isPublished: true, price: 49 } });
    await expect(enrollInCourse(OTHER_STUDENT, COURSE)).rejects.toMatchObject({ statusCode: 402 });
    expect(rows("enrollment")).toHaveLength(1);
  });
});

describe("ACA-014 lesson completion and progress percentage", () => {
  it("records watch time without completion and leaves progress unchanged", async () => {
    await seedCourse(4);
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, "lesson-1", 120, false);
    const enrollment = await enrolmentRow();
    expect(enrollment?.progressPercentage).toBe(0);
    expect(enrollment?.status).toBe("ACTIVE");
    expect(rows("lessonProgress")[0]).toMatchObject({ watchedSeconds: 120, completed: false });
  });

  it("rounds progress to whole percentages across completions", async () => {
    await seedCourse(3);
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, "lesson-1", 300, true);
    expect((await enrolmentRow())?.progressPercentage).toBe(33);
    await updateLessonProgress(STUDENT, "lesson-2", 300, true);
    expect((await enrolmentRow())?.progressPercentage).toBe(67);
  });

  it("moves to COMPLETED at 100%, stamps completedAt and queues one certificate", async () => {
    await seedCourse(4);
    await enrollInCourse(STUDENT, COURSE);
    for (let i = 1; i <= 4; i += 1) await updateLessonProgress(STUDENT, `lesson-${i}`, 300, true);
    const enrollment = await enrolmentRow();
    expect(enrollment).toMatchObject({ progressPercentage: 100, status: "COMPLETED" });
    expect(enrollment?.completedAt).toBeInstanceOf(Date);
    expect(queueCertificateIssuance).toHaveBeenCalledTimes(1);
    expect(queueCertificateIssuance).toHaveBeenCalledWith(STUDENT, COURSE);
  });

  it("reverts from COMPLETED when a lesson is marked incomplete again", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, "lesson-1", 300, true);
    await updateLessonProgress(STUDENT, "lesson-2", 300, true);
    await updateLessonProgress(STUDENT, "lesson-2", 300, false);
    expect(await enrolmentRow()).toMatchObject({ progressPercentage: 50, status: "ACTIVE", completedAt: null });
  });

  it("denies progress writes to non-enrolled learners and creates no progress row", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await expect(updateLessonProgress(OTHER_STUDENT, "lesson-1", 10, true)).rejects.toMatchObject({ statusCode: 403 });
    expect(rows("lessonProgress").filter((row) => row.studentId === OTHER_STUDENT)).toHaveLength(0);
  });

  it("treats a CANCELLED enrolment as not enrolled for progress writes", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await prisma.enrollment.update({ where: { studentId_courseId: { studentId: STUDENT, courseId: COURSE } }, data: { status: "CANCELLED" } });
    await expect(updateLessonProgress(STUDENT, "lesson-1", 10, true)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("returns the enrolment and every lesson progress row for the course", async () => {
    await seedCourse(3);
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, "lesson-1", 10, true);
    await updateLessonProgress(STUDENT, "lesson-3", 5, false);
    const result = await getCourseProgress(STUDENT, COURSE);
    expect(result.enrollment?.progressPercentage).toBe(33);
    expect(result.lessonProgress.map((row) => row.lessonId).sort()).toEqual(["lesson-1", "lesson-3"]);
  });
});

describe("ACA-014 quiz attempts do not drive course completion", () => {
  it("auto-grades a single-choice quiz without changing lesson progress or enrolment status", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, "lesson-1", 300, true);
    const before = await enrolmentRow();

    await seed("quiz", [{ id: "quiz-1", courseId: COURSE, title: "Check", totalMarks: 2, passingMarks: 1, timeLimitMinutes: 10, isPublished: true }]);
    await seed("question", [
      { id: "q-1", quizId: "quiz-1", text: "Pick A", type: "SINGLE_CHOICE", marks: 2, orderIndex: 1 },
    ]);
    await seed("option", [
      { id: "q-1-a", questionId: "q-1", text: "A", isCorrect: true },
      { id: "q-1-b", questionId: "q-1", text: "B", isCorrect: false },
    ]);

    const attempt = await startAttempt("quiz-1", STUDENT);
    const graded = await submitAttempt(attempt.id, STUDENT, { answers: [{ questionId: "q-1", selectedOptionId: "q-1-a" }] } as never);

    expect(graded).toMatchObject({ status: "GRADED", marksObtained: 2 });
    const after = await enrolmentRow();
    expect(after?.progressPercentage).toBe(before?.progressPercentage);
    expect(after?.status).toBe("ACTIVE");
    expect(after?.progressPercentage).toBe(50);
  });

  it("rejects quiz attempts from learners who are not enrolled", async () => {
    await seedCourse(1);
    await seed("quiz", [{ id: "quiz-2", courseId: COURSE, title: "Check", totalMarks: 1, passingMarks: 1, timeLimitMinutes: 5, isPublished: true }]);
    await expect(startAttempt("quiz-2", OTHER_STUDENT)).rejects.toMatchObject({ statusCode: 403 });
  });
});
