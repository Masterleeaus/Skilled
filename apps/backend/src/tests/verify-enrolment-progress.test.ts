/**
 * ACA-014 verification: enrolment, completion and progress calculation, comparing the API result, the persisted
 * rows and the completion calculation. Runs the real enrolment, certificate-eligibility and curriculum progress
 * code over the in-memory Prisma double.
 *
 * Two progress models exist. The course model (Enrollment.progressPercentage, LessonProgress.completed, used for
 * certificates) counts every lesson in the course. The academy curriculum model (AcademyLearnerCompletion over
 * placements and course tracks) carries the required and optional split. Both are covered here, and their
 * independence and the other ACA-014 findings are recorded in lms-main/docs/ACA-028-external-identity-uniqueness.md
 * (section "ACA-014 and ACA-017 findings").
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));
vi.mock("../jobs/certificate.queue", () => ({ queueCertificateIssuance: vi.fn(async () => undefined) }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { queueCertificateIssuance } from "../jobs/certificate.queue";
import {
  enrollInCourse,
  getCourseProgress,
  recalculateCourseProgress,
  updateLessonProgress,
} from "../modules/enrollment/enrollment.service";
import { evaluateCertificateEligibility } from "../modules/certificates/certificate-eligibility.service";
import { buildCourseLessonProgress } from "../modules/curriculum/completion-report.service";

const STUDENT = "verify-student-1";
const OTHER = "verify-student-2";
const COURSE = "verify-course-1";
const OTHER_COURSE = "verify-course-2";

async function seedCourse(lessonCount: number, options: { courseId?: string; moduleId?: string; published?: boolean } = {}) {
  const courseId = options.courseId ?? COURSE;
  const moduleId = options.moduleId ?? "verify-module-1";
  const known = new Set(rows("user").map((r) => r.id));
  const learners = [
    { id: STUDENT, email: "verify-s1@example.test", fullName: "Verify One", role: "STUDENT" },
    { id: OTHER, email: "verify-s2@example.test", fullName: "Verify Two", role: "STUDENT" },
  ];
  await seed("user", learners.filter((u) => !known.has(u.id)));
  await seed("course", [{ id: courseId, title: `Course ${courseId}`, slug: courseId, isPublished: options.published ?? true, price: 0 }]);
  await seed("module", [{ id: moduleId, courseId, title: "Module", orderIndex: 1 }]);
  if (lessonCount > 0) {
    await seed("lesson", Array.from({ length: lessonCount }, (_, i) => ({
      id: `${courseId}-lesson-${i + 1}`, moduleId, title: `Lesson ${i + 1}`, orderIndex: i + 1,
    })));
  }
}

const lessonId = (n: number, courseId = COURSE) => `${courseId}-lesson-${n}`;
type EnrolmentRow = { status: string; progressPercentage: number; completedAt: Date | null };
const enrolment = async (studentId = STUDENT, courseId = COURSE): Promise<EnrolmentRow | null> =>
  (await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId, courseId } } })) as unknown as EnrolmentRow | null;
const queued = () => vi.mocked(queueCertificateIssuance).mock.calls.length;

beforeEach(() => {
  resetFakeDb();
  vi.mocked(queueCertificateIssuance).mockClear();
});

describe("ACA-014 repeated and retried requests", () => {
  it("repeating the same completion leaves one progress row, the same percentage, and no certificate job", async () => {
    await seedCourse(4);
    await enrollInCourse(STUDENT, COURSE);
    for (let i = 0; i < 3; i += 1) await updateLessonProgress(STUDENT, lessonId(1), 300, true);
    expect(rows("lessonProgress").filter((r) => r.studentId === STUDENT)).toHaveLength(1);
    expect((await enrolment())?.progressPercentage).toBe(25);
    expect(queued()).toBe(0);
  });

  it("a repeated 100% completion does not queue a second certificate", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, lessonId(1), 300, true);
    await updateLessonProgress(STUDENT, lessonId(2), 300, true);
    await updateLessonProgress(STUDENT, lessonId(2), 301, true);
    await updateLessonProgress(STUDENT, lessonId(2), 302, true);
    expect(await enrolment()).toMatchObject({ status: "COMPLETED", progressPercentage: 100 });
    expect(queued()).toBe(1);
  });

  it("a write refused for a learner who is not yet enrolled leaves no row, and the retry after enrolment records once", async () => {
    await seedCourse(2);
    await expect(updateLessonProgress(OTHER, lessonId(1), 10, true)).rejects.toMatchObject({ statusCode: 403 });
    expect(rows("lessonProgress")).toHaveLength(0);
    await enrollInCourse(OTHER, COURSE);
    await updateLessonProgress(OTHER, lessonId(1), 10, true);
    expect(rows("lessonProgress").filter((r) => r.studentId === OTHER)).toHaveLength(1);
    expect((await enrolment(OTHER))?.progressPercentage).toBe(50);
  });

  it("re-completing after a reversion stamps a new completedAt and queues the certificate again", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, lessonId(1), 300, true);
    await updateLessonProgress(STUDENT, lessonId(2), 300, true);
    const first = (await enrolment())!.completedAt!;
    await updateLessonProgress(STUDENT, lessonId(2), 300, false);
    expect(await enrolment()).toMatchObject({ status: "ACTIVE", completedAt: null });
    await new Promise((r) => setTimeout(r, 5));
    await updateLessonProgress(STUDENT, lessonId(2), 300, true);
    const again = await enrolment();
    expect(again).toMatchObject({ status: "COMPLETED", progressPercentage: 100 });
    expect(again!.completedAt!.getTime()).toBeGreaterThan(first.getTime());
    // Certificate idempotency is enforced by the certificate table and the queue job id, not here.
    expect(queued()).toBe(2);
  });

  it("persisted percentage, status and completedAt agree with the lesson rows after a mixed sequence of writes", async () => {
    await seedCourse(5);
    await enrollInCourse(STUDENT, COURSE);
    const steps: Array<[number, boolean]> = [[1, true], [3, true], [3, false], [2, true], [5, true], [4, true], [4, false], [4, true], [3, true], [1, false]];
    for (const [n, completed] of steps) {
      await updateLessonProgress(STUDENT, lessonId(n), 60, completed);
      const done = rows("lessonProgress").filter((r) => r.studentId === STUDENT && r.completed === true).length;
      const enr = (await enrolment())!;
      expect(enr.progressPercentage).toBe(Math.round((done / 5) * 100));
      expect(enr.status === "COMPLETED").toBe(done === 5);
      expect(enr.completedAt === null).toBe(done !== 5);
      const api = await getCourseProgress(STUDENT, COURSE);
      expect(api.enrollment?.progressPercentage).toBe(enr.progressPercentage);
      expect(api.lessonProgress.filter((r) => r.completed).length).toBe(done);
    }
  });
});

describe("ACA-014 course membership, cancelled and unpublished courses", () => {
  it("refuses a completion for a lesson in a course the learner is not enrolled in, and writes no row", async () => {
    await seedCourse(2);
    await seedCourse(1, { courseId: OTHER_COURSE, moduleId: "verify-module-2" });
    await enrollInCourse(STUDENT, COURSE);
    await expect(updateLessonProgress(STUDENT, lessonId(1, OTHER_COURSE), 10, true)).rejects.toMatchObject({ statusCode: 403 });
    expect(rows("lessonProgress")).toHaveLength(0);
    expect(await enrolment(STUDENT, OTHER_COURSE)).toBeNull();
  });

  it("a course with no lessons never reaches COMPLETED or queues a certificate", async () => {
    await seedCourse(0);
    await enrollInCourse(STUDENT, COURSE);
    const result = await recalculateCourseProgress(STUDENT, COURSE);
    expect(result.eligible).toBe(false);
    expect(result.blockers).toContain("Incomplete lessons");
    expect(await enrolment()).toMatchObject({ status: "ACTIVE", progressPercentage: 0 });
    expect(queued()).toBe(0);
  });

  it("a CANCELLED enrolment keeps its status and percentage and queues nothing, even when every lesson row is complete", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await prisma.lessonProgress.create({ data: { studentId: STUDENT, lessonId: lessonId(1), completed: true } });
    await prisma.lessonProgress.create({ data: { studentId: STUDENT, lessonId: lessonId(2), completed: true } });
    await prisma.enrollment.update({ where: { studentId_courseId: { studentId: STUDENT, courseId: COURSE } }, data: { status: "CANCELLED", progressPercentage: 0 } });
    await recalculateCourseProgress(STUDENT, COURSE);
    expect(await enrolment()).toMatchObject({ status: "CANCELLED", progressPercentage: 0, completedAt: null });
    expect(queued()).toBe(0);
  });

  it("a CANCELLED learner cannot re-enrol through the API, which answers 409 (current behaviour, recorded in the doc)", async () => {
    await seedCourse(1);
    await enrollInCourse(STUDENT, COURSE);
    await prisma.enrollment.update({ where: { studentId_courseId: { studentId: STUDENT, courseId: COURSE } }, data: { status: "CANCELLED" } });
    await expect(enrollInCourse(STUDENT, COURSE)).rejects.toMatchObject({ statusCode: 409 });
    expect(rows("enrollment").filter((r) => r.studentId === STUDENT)).toHaveLength(1);
  });

  it("an unpublished course stays ACTIVE at 100% lesson progress, and the eligibility blocker says why", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await prisma.course.update({ where: { id: COURSE }, data: { isPublished: false } });
    await updateLessonProgress(STUDENT, lessonId(1), 10, true);
    await updateLessonProgress(STUDENT, lessonId(2), 10, true);
    expect(await enrolment()).toMatchObject({ status: "ACTIVE", progressPercentage: 100 });
    const eligibility = await evaluateCertificateEligibility(STUDENT, COURSE);
    expect(eligibility.blockers).toContain("Published course required");
    expect(queued()).toBe(0);
  });

  it("a published quiz the learner has not passed keeps a fully read course ACTIVE, and a passing graded attempt completes it", async () => {
    await seedCourse(2);
    await prisma.quiz.create({ data: { id: "verify-quiz-1", courseId: COURSE, title: "Final", totalMarks: 10, passingMarks: 6, timeLimitMinutes: 10, isPublished: true } });
    await enrollInCourse(STUDENT, COURSE);
    await updateLessonProgress(STUDENT, lessonId(1), 10, true);
    await updateLessonProgress(STUDENT, lessonId(2), 10, true);
    // Lesson percentage is 100 while the course is not yet complete: the quiz gate is separate from progressPercentage.
    expect(await enrolment()).toMatchObject({ status: "ACTIVE", progressPercentage: 100 });
    await prisma.quizAttempt.create({ data: { studentId: STUDENT, quizId: "verify-quiz-1", status: "GRADED", marksObtained: 5, submittedAt: new Date() } });
    await recalculateCourseProgress(STUDENT, COURSE);
    expect(await enrolment()).toMatchObject({ status: "ACTIVE" });
    await prisma.quizAttempt.create({ data: { studentId: STUDENT, quizId: "verify-quiz-1", status: "GRADED", marksObtained: 6, submittedAt: new Date() } });
    await recalculateCourseProgress(STUDENT, COURSE);
    expect(await enrolment()).toMatchObject({ status: "COMPLETED" });
    expect(queued()).toBe(1);
  });

  it("one learner's completions never change another learner's enrolment or percentage", async () => {
    await seedCourse(2);
    await enrollInCourse(STUDENT, COURSE);
    await enrollInCourse(OTHER, COURSE);
    await updateLessonProgress(STUDENT, lessonId(1), 10, true);
    await updateLessonProgress(STUDENT, lessonId(2), 10, true);
    expect(await enrolment(OTHER)).toMatchObject({ status: "ACTIVE", progressPercentage: 0 });
    expect(rows("lessonProgress").filter((r) => r.studentId === OTHER)).toHaveLength(0);
  });
});

describe("ACA-014 academy curriculum progress: required versus optional", () => {
  const LEARNER = "verify-curr-learner";
  const CO = "verify-curr-course";

  beforeEach(async () => {
    await seed("user", [{ id: LEARNER, email: "verify-curr@example.test", fullName: "Curr Learner", role: "STUDENT", isActive: true, isEmailVerified: true }]);
    await seed("course", [{ id: CO, title: "Curriculum course", slug: "verify-curr-course", isPublished: true, price: 0 }]);
    await seed("academyCurriculumTrack", [
      { id: "verify-tr-core", slug: "verify-core", title: "Core", scope: "UNIVERSAL", status: "PUBLISHED" },
      { id: "verify-tr-extra", slug: "verify-extra", title: "Extra", scope: "UNIVERSAL", status: "PUBLISHED" },
      { id: "verify-tr-draft", slug: "verify-draft", title: "Draft", scope: "UNIVERSAL", status: "DRAFT" },
    ]);
    const lessons = ["L1", "L2", "L3", "L4"].map((code) => ({
      id: `verify-${code}`, sourceId: `VERIFY-${code}`, layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1",
      title: `Lesson ${code}`, objective: "o", assessment: "a", sourceVersion: "1", sourceHash: `h-${code}`,
    }));
    await seed("academyContentLesson", lessons);
    await seed("academyLessonRevision", ["L1", "L2", "L3", "L4"].map((code) => ({
      id: `verify-rev-${code}`, lessonId: `verify-${code}`, version: 1, body: {}, contentHash: `h-${code}`, status: "PUBLISHED", publishedAt: new Date(),
    })));
    // core track: L1 required, L2 optional at placement level. extra track: L3 required lesson on an optional course link.
    // draft track: L4 is never part of the course.
    await seed("academyLessonPlacement", [
      { trackId: "verify-tr-core", lessonId: "verify-L1", revisionId: "verify-rev-L1", position: 1, required: true },
      { trackId: "verify-tr-core", lessonId: "verify-L2", revisionId: "verify-rev-L2", position: 2, required: false },
      { trackId: "verify-tr-extra", lessonId: "verify-L3", revisionId: "verify-rev-L3", position: 1, required: true },
      { trackId: "verify-tr-draft", lessonId: "verify-L4", revisionId: "verify-rev-L4", position: 1, required: true },
    ]);
    await seed("academyCourseTrack", [
      { courseId: CO, trackId: "verify-tr-core", position: 1, required: true },
      { courseId: CO, trackId: "verify-tr-extra", position: 2, required: false },
      { courseId: CO, trackId: "verify-tr-draft", position: 3, required: true },
    ]);
  });

  it("counts required and optional lessons separately and draft tracks not at all", async () => {
    const progress = await buildCourseLessonProgress(CO, LEARNER);
    expect(progress.lessonCount).toBe(3);
    expect(progress.required.total).toBe(1);
    expect(progress.optional.total).toBe(2);
    expect(progress.lessons.map((l) => l.sourceId).sort()).toEqual(["VERIFY-L1", "VERIFY-L2", "VERIFY-L3"]);
  });

  it("an optional acknowledgement moves the optional count and the headline percentage, not the required count", async () => {
    await seed("academyLearnerCompletion", [{ learnerId: LEARNER, lessonId: "verify-L2", revisionId: "verify-rev-L2" }]);
    const progress = await buildCourseLessonProgress(CO, LEARNER);
    expect(progress.required).toEqual({ total: 1, completed: 0 });
    expect(progress.optional).toEqual({ total: 2, completed: 1 });
    expect(progress.completedCount).toBe(1);
    expect(progress.completionPercent).toBe(33);
  });

  it("required completion is reported on the required lesson alone", async () => {
    await seed("academyLearnerCompletion", [{ learnerId: LEARNER, lessonId: "verify-L1", revisionId: "verify-rev-L1" }]);
    const progress = await buildCourseLessonProgress(CO, LEARNER);
    expect(progress.required).toEqual({ total: 1, completed: 1 });
    expect(progress.lessons.find((l) => l.sourceId === "VERIFY-L1")).toMatchObject({ required: true, completed: true });
  });

  it("API counts equal the persisted acknowledgement rows for this learner and nobody else's", async () => {
    await seed("academyLearnerCompletion", [
      { learnerId: LEARNER, lessonId: "verify-L1", revisionId: "verify-rev-L1" },
      { learnerId: "verify-someone-else", lessonId: "verify-L3", revisionId: "verify-rev-L3" },
    ]);
    const progress = await buildCourseLessonProgress(CO, LEARNER);
    const persisted = rows("academyLearnerCompletion").filter((r) => r.learnerId === LEARNER).length;
    expect(progress.completedCount).toBe(persisted);
    expect(progress.lessons.find((l) => l.sourceId === "VERIFY-L3")?.completed).toBe(false);
  });
});
