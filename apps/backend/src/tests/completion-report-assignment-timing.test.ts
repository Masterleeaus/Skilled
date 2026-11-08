/**
 * Completion report timing (owner decision, ACA-025). A manager's report counts a learner's lesson
 * acknowledgement or knowledge attempt only if it was made after that organisation's assignment for the
 * course was created. Earlier self-enrolment records are hidden from that organisation's report, and another
 * organisation's assignment dates never change this organisation's cut-off. Calls the report service over the
 * in-memory Prisma double.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "completion-timing-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { resetFakeDb, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture } from "./support/academy-fixtures";
import { buildLearnerCompletionReport } from "../modules/curriculum/completion-report.service";

const LEARNER_BEFORE = "learner-before";
const LEARNER_AFTER = "learner-after";
const COURSE_TWO = "course-2";
const TRACK_TWO = "tr-2";

// Organisation one assigns course one on ASSIGNED_AT. Organisation two assigns course two (revision B only)
// earlier, so lesson A is not shared and the cut-off is the only thing that can hide a record.
const ASSIGNED_AT = new Date("2026-03-01T00:00:00Z");
const ORG_TWO_ASSIGNED_AT = new Date("2026-02-09T00:00:00Z");
const BEFORE_ASSIGNMENT = new Date("2026-02-19T00:00:00Z");
const AFTER_ASSIGNMENT = new Date("2026-03-05T00:00:00Z");

async function seedCourseTwoWithRevisionBOnly(): Promise<void> {
  await seed("course", [{ id: COURSE_TWO, title: "Second Course", slug: "second-course", isPublished: true, price: 0 }]);
  await seed("academyCurriculumTrack", [{ id: TRACK_TWO, slug: "tr-two", title: "Track Two", scope: "UNIVERSAL", status: "PUBLISHED" }]);
  await seed("academyLessonPlacement", [{ trackId: TRACK_TWO, lessonId: ids.lessonB, revisionId: ids.revisionB, position: 1, required: true }]);
  await seed("academyCourseTrack", [{ courseId: COURSE_TWO, trackId: TRACK_TWO, position: 1, required: true }]);
}

type ReportLesson = { lessonId: string; acknowledgement: unknown; withheldAsShared: unknown };
const lessonA = (report: { courses: Array<{ lessons: ReportLesson[] }> }) =>
  report.courses[0].lessons.find((lesson) => lesson.lessonId === ids.lessonA);

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
  await seed("user", [
    { id: LEARNER_BEFORE, email: "before@example.test", fullName: "Before Learner", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: LEARNER_AFTER, email: "after@example.test", fullName: "After Learner", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("companyMember", [
    { companyId: ids.org1, userId: LEARNER_BEFORE, role: "LEARNER" },
    { companyId: ids.org1, userId: LEARNER_AFTER, role: "LEARNER" },
  ]);
  await seedCourseTwoWithRevisionBOnly();
  // Organisation one's assignments are dated explicitly, so the fixture's default assignments do not matter here.
  await seed("academyTrainingAssignment", [
    { companyId: ids.org1, learnerId: LEARNER_BEFORE, assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED", createdAt: ASSIGNED_AT },
    { companyId: ids.org1, learnerId: LEARNER_AFTER, assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED", createdAt: ASSIGNED_AT },
    { companyId: ids.org2, learnerId: LEARNER_BEFORE, assignedById: ids.manager, courseId: COURSE_TWO, status: "ASSIGNED", createdAt: ORG_TWO_ASSIGNED_AT },
  ]);
});

describe("completion report counts only records made after the assignment", () => {
  it("excludes a self-enrolment acknowledgement and attempt made before the assignment", async () => {
    await seed("academyLearnerCompletion", [
      { learnerId: LEARNER_BEFORE, lessonId: ids.lessonA, revisionId: ids.revisionA, completedAt: BEFORE_ASSIGNMENT },
    ]);
    await seed("academyKnowledgeAttempt", [
      { learnerId: LEARNER_BEFORE, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true, createdAt: BEFORE_ASSIGNMENT },
    ]);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER_BEFORE);
    expect(lessonA(report)).toMatchObject({
      acknowledgement: null,
      knowledgeCheck: { attempts: 0, passed: false, latest: null },
    });
    expect(report.courses[0].completionState).toBe("IN_PROGRESS");
  });

  it("includes an acknowledgement and attempt made after the assignment", async () => {
    await seed("academyLearnerCompletion", [
      { learnerId: LEARNER_AFTER, lessonId: ids.lessonA, revisionId: ids.revisionA, completedAt: AFTER_ASSIGNMENT },
    ]);
    await seed("academyKnowledgeAttempt", [
      { learnerId: LEARNER_AFTER, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true, createdAt: AFTER_ASSIGNMENT },
    ]);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER_AFTER);
    expect(lessonA(report)).toMatchObject({
      acknowledgement: { completedAt: AFTER_ASSIGNMENT },
      knowledgeCheck: { attempts: 1, passed: true, latest: { score: 2, total: 2, passed: true } },
    });
  });

  it("uses this organisation's assignment date, not another organisation's, as the cut-off", async () => {
    // Organisation two assigned this learner earlier than the record, so a leak would include it.
    // Lesson A is not on organisation two's course, so the record is excluded by organisation one's date alone.
    await seed("academyLearnerCompletion", [
      { learnerId: LEARNER_BEFORE, lessonId: ids.lessonA, revisionId: ids.revisionA, completedAt: BEFORE_ASSIGNMENT },
    ]);
    expect(ORG_TWO_ASSIGNED_AT < BEFORE_ASSIGNMENT).toBe(true);

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER_BEFORE);
    expect(lessonA(report)?.acknowledgement).toBeNull();
    expect(lessonA(report)?.withheldAsShared).toBe(false);
  });
});
