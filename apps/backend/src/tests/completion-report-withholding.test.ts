/**
 * Completion report withholding (ACA-025). Knowledge attempts and lesson acknowledgements on a revision that
 * another organisation also assigns to the same learner are withheld from this organisation's report.
 * Records are kept, not deleted. Calls the report service directly over the in-memory Prisma double.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "completion-withholding-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture } from "./support/academy-fixtures";
import { buildCompanyCompletionReport, buildLearnerCompletionReport } from "../modules/curriculum/completion-report.service";
import { NotFoundError } from "../utils/AppError";

// A second published course that places only revision B. Org 2 assigns it, so only lesson B is shared.
const COURSE_TWO = "course-2";
const TRACK_TWO = "tr-2";

const lessonOf = (report: { courses: Array<{ lessons: Array<{ lessonId: string }> }> }, lessonId: string) =>
  report.courses[0].lessons.find((lesson) => lesson.lessonId === lessonId);

async function assignFromOtherCompany(courseId: string): Promise<void> {
  // Sharing applies only while the other organisation still has the learner as a member.
  await seed("companyMember", [{ companyId: ids.org2, userId: ids.learner1, role: "LEARNER" }]);
  await seed("academyTrainingAssignment", [
    { companyId: ids.org2, learnerId: ids.learner1, assignedById: ids.manager, courseId, status: "ASSIGNED" },
  ]);
}

async function seedCourseTwoWithRevisionBOnly(): Promise<void> {
  await seed("course", [{ id: COURSE_TWO, title: "Second Course", slug: "second-course", isPublished: true, price: 0 }]);
  await seed("academyCurriculumTrack", [{ id: TRACK_TWO, slug: "tr-two", title: "Track Two", scope: "UNIVERSAL", status: "PUBLISHED" }]);
  await seed("academyLessonPlacement", [{ trackId: TRACK_TWO, lessonId: ids.lessonB, revisionId: ids.revisionB, position: 1, required: true }]);
  await seed("academyCourseTrack", [{ courseId: COURSE_TWO, trackId: TRACK_TWO, position: 1, required: true }]);
}

async function acknowledgeAndPassLessonA(): Promise<void> {
  await seed("academyLearnerCompletion", [
    { learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA, completedAt: new Date() },
  ]);
  await seed("academyKnowledgeAttempt", [
    { learnerId: ids.learner1, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true },
  ]);
}

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
});

describe("completion report withholds shared revisions", () => {
  it("withholds an acknowledgement and knowledge attempts on a revision another company also assigns", async () => {
    // Org 2 assigns the whole of course 1 to the same learner, so revisions A and B are both shared.
    await assignFromOtherCompany(ids.course);
    await acknowledgeAndPassLessonA();

    const report = await buildLearnerCompletionReport(ids.org1, ids.learner1);
    const lesson = lessonOf(report, ids.lessonA);
    expect(lesson).toMatchObject({
      withheldAsShared: true,
      acknowledgement: null,
      knowledgeCheck: { attempts: 0, passed: false, latest: null },
    });
    expect(report.courses[0]).toMatchObject({ completionState: "IN_PROGRESS" });
    expect(report.courses[0].summary).toMatchObject({ requiredAcknowledged: 0, requiredPercent: 0 });

    // Withheld from this report only. The records themselves are kept.
    expect(rows("academyLearnerCompletion")).toHaveLength(1);
    expect(rows("academyKnowledgeAttempt")).toHaveLength(1);
  });

  it("shows a revision that only this company assigns, and withholds only the shared revision", async () => {
    await seedCourseTwoWithRevisionBOnly();
    await assignFromOtherCompany(COURSE_TWO);
    await acknowledgeAndPassLessonA();
    // Lesson B acknowledgement on the shared revision B.
    await seed("academyLearnerCompletion", [
      { learnerId: ids.learner1, lessonId: ids.lessonB, revisionId: ids.revisionB, completedAt: new Date() },
    ]);

    const report = await buildLearnerCompletionReport(ids.org1, ids.learner1);
    // Only course 1 is assigned by org 1; course 2 belongs to org 2 and does not appear here.
    expect(report.courses.map((course) => course.courseId)).toEqual([ids.course]);

    const lessonA = lessonOf(report, ids.lessonA);
    expect(lessonA).toMatchObject({
      withheldAsShared: false,
      acknowledgement: { completedAt: expect.any(Date) },
      knowledgeCheck: { attempts: 1, passed: true, latest: { score: 2, total: 2, passed: true } },
    });
    expect(report.courses[0].completionState).toBe("REQUIRED_LESSONS_ACKNOWLEDGED");

    const lessonB = lessonOf(report, ids.lessonB);
    expect(lessonB).toMatchObject({ withheldAsShared: true, acknowledgement: null });
  });

  it("excludes an inactive learner from the learner report and from the organisation roll-up", async () => {
    await prisma.user.update({ where: { id: ids.learner1 }, data: { isActive: false } });

    await expect(buildLearnerCompletionReport(ids.org1, ids.learner1)).rejects.toBeInstanceOf(NotFoundError);

    const roll = await buildCompanyCompletionReport(ids.org1);
    const learnerIds = roll.learners.map((learner) => learner.learnerId);
    expect(learnerIds).not.toContain(ids.learner1);
    expect(learnerIds).toEqual([ids.learner2]);
    expect(roll.totals.learners).toBe(1);
  });
});
