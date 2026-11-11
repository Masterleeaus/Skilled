/**
 * Completion report validation against persisted records (issue #36).
 *
 * Each report figure is recomputed here from the raw rows in the in-memory Prisma double, with no shared code
 * from the service, and compared with the report. The oracle covers required and optional lesson progress,
 * knowledge-check attempts, approved competencies (with expiry), organisation membership and tenant isolation.
 */
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env", () => ({
  env: { JWT_ACCESS_SECRET: "completion-validation-test-secret", JWT_ACCESS_EXPIRES: "15m" },
}));
vi.mock("../config/prisma", async () => ({ prisma: (await import("./support/fake-prisma")).fakePrisma }));

import { fakePrisma as prisma, resetFakeDb, rows, seed } from "./support/fake-prisma";
import { ids, seedAcademyFixture, token } from "./support/academy-fixtures";
import curriculumRoutes from "../modules/curriculum/curriculum.routes";
import completionReportRoutes from "../modules/curriculum/completion-report.routes";
import {
  buildCompanyCompletionReport,
  buildCourseLessonProgress,
  buildLearnerCompletionReport,
  type CourseEvidence,
} from "../modules/curriculum/completion-report.service";
import { NotFoundError } from "../utils/AppError";
import { errorHandler } from "../middleware/errorHandler";

const app = express();
app.use(express.json());
app.use("/api/academy/curriculum", curriculumRoutes);
app.use("/api/academy/curriculum", completionReportRoutes);
app.use(errorHandler);

const CURRICULUM = "/api/academy/curriculum";
const auth = (userId: string, role?: string) => ({ Authorization: `Bearer ${token(userId, role)}` });
const learnerReportUrl = (learnerId: string, companyId = ids.org1) => `${CURRICULUM}/companies/${companyId}/completion-reports/learners/${learnerId}`;
const orgReportUrl = (companyId = ids.org1) => `${CURRICULUM}/companies/${companyId}/completion-reports`;

const LEARNER = ids.learner1;
const OTHER_LEARNER = ids.learner2;
const COURSE_TWO = "course-2";
const TRACK_TWO = "tr-2";

// Organisation one assigns course one on C1 and course two on C2. Both courses contain lesson A on revision A.
const C1 = new Date("2026-03-01T00:00:00Z");
const C2 = new Date("2026-04-01T00:00:00Z");
const BEFORE = new Date("2026-02-10T00:00:00Z");
const MID = new Date("2026-03-15T00:00:00Z");
const AFTER = new Date("2026-05-01T00:00:00Z");
const EXPIRES = new Date("2026-06-01T00:00:00Z");
const NOW = new Date("2026-05-15T00:00:00Z");
const AFTER_EXPIRY = new Date("2026-07-01T00:00:00Z");

type Slot = { lessonId: string; revisionId: string; required: boolean };
// Course one: lesson A (required) and lesson B (optional). Course two: lesson A (required) only.
const COURSE_ONE_SLOTS: Slot[] = [
  { lessonId: ids.lessonA, revisionId: ids.revisionA, required: true },
  { lessonId: ids.lessonB, revisionId: ids.revisionB, required: false },
];
const COURSE_TWO_SLOTS: Slot[] = [{ lessonId: ids.lessonA, revisionId: ids.revisionA, required: true }];

const sameSlot = (row: { lessonId?: unknown; revisionId?: unknown }, slot: Slot) => row.lessonId === slot.lessonId && row.revisionId === slot.revisionId;
const timeOf = (row: { createdAt?: Date; reviewedAt?: Date | null }) => (row.reviewedAt ? row.reviewedAt : row.createdAt) as Date;

/** Independent oracle: what the report should say for one course, given the persisted rows. */
function oracle(slots: Slot[], cutoff: Date, now: Date, learnerId = LEARNER) {
  const completions = rows("academyLearnerCompletion").filter((row) => row.learnerId === learnerId);
  const attempts = rows("academyKnowledgeAttempt").filter((row) => row.learnerId === learnerId);
  const evidence = rows("academyPracticalEvidence").filter((row) => row.learnerId === learnerId && row.companyId === ids.org1);
  const competencies = rows("academyVerifiedCompetency").filter((row) => row.learnerId === learnerId && row.companyId === ids.org1);
  const result = { requiredAcknowledged: 0, optionalAcknowledged: 0, practicalPending: 0, activeCompetencies: 0, excludedBeforeAssignment: 0, attemptsByLesson: {} as Record<string, number> };
  for (const slot of slots) {
    const ack = completions.find((row) => sameSlot(row, slot));
    if (ack && (ack.completedAt as Date) >= cutoff) {
      if (slot.required) result.requiredAcknowledged += 1;
      else result.optionalAcknowledged += 1;
    } else if (ack) result.excludedBeforeAssignment += 1;

    const onSlot = attempts.filter((row) => sameSlot(row, slot));
    result.attemptsByLesson[slot.lessonId] = onSlot.filter((row) => (row.createdAt as Date) >= cutoff).length;
    result.excludedBeforeAssignment += onSlot.length - result.attemptsByLesson[slot.lessonId];

    const slotEvidence = evidence.filter((row) => sameSlot(row, slot));
    result.practicalPending += slotEvidence.filter((row) => row.status === "PENDING" && timeOf(row) >= cutoff).length;
    result.excludedBeforeAssignment += slotEvidence.filter((row) => timeOf(row) < cutoff).length;

    const slotCompetencies = competencies.filter((row) => sameSlot(row, slot));
    result.activeCompetencies += slotCompetencies.filter((row) => (row.verifiedAt as Date) >= cutoff && (!row.expiresAt || (row.expiresAt as Date) > now)).length;
    result.excludedBeforeAssignment += slotCompetencies.filter((row) => (row.verifiedAt as Date) < cutoff).length;
  }
  return result;
}

async function courseTwo(): Promise<void> {
  await seed("course", [{ id: COURSE_TWO, title: "Second Course", slug: "second-course", isPublished: true, price: 0 }]);
  await seed("academyCurriculumTrack", [{ id: TRACK_TWO, slug: "tr-two", title: "Track Two", scope: "UNIVERSAL", status: "PUBLISHED" }]);
  await seed("academyLessonPlacement", [{ trackId: TRACK_TWO, lessonId: ids.lessonA, revisionId: ids.revisionA, position: 1, required: true }]);
  await seed("academyCourseTrack", [{ courseId: COURSE_TWO, trackId: TRACK_TWO, position: 1, required: true }]);
  await seed("academyTrainingAssignment", [
    { companyId: ids.org1, learnerId: LEARNER, assignedById: ids.manager, courseId: COURSE_TWO, status: "ASSIGNED", createdAt: C2 },
  ]);
}

async function evidence(id: string, companyId: string, status: string, createdAt: Date, reviewedAt: Date | null = null, learnerId = LEARNER) {
  await seed("academyPracticalEvidence", [{
    id, companyId, learnerId, lessonId: ids.lessonA, revisionId: ids.revisionA,
    description: "Practical evidence recorded for the validation tests.", evidenceUrls: [], status,
    assessorId: status === "PENDING" ? null : ids.assessor, reviewedAt, createdAt,
  }]);
}

async function competency(id: string, companyId: string, evidenceId: string, verifiedAt: Date, expiresAt: Date | null, learnerId = LEARNER) {
  await seed("academyVerifiedCompetency", [{ id, companyId, learnerId, lessonId: ids.lessonA, revisionId: ids.revisionA, evidenceId, assessorId: ids.assessor, verifiedAt, expiresAt }]);
}

/** Learner one's record set: acknowledgements, attempts, evidence and competencies on both sides of the cut-offs. */
async function seedLearnerOneRecords(): Promise<void> {
  await seed("academyLearnerCompletion", [
    { learnerId: LEARNER, lessonId: ids.lessonA, revisionId: ids.revisionA, completedAt: MID }, // counted by C1 only
    { learnerId: LEARNER, lessonId: ids.lessonB, revisionId: ids.revisionB, completedAt: BEFORE }, // before C1: never counted
  ]);
  await seed("academyKnowledgeAttempt", [
    { learnerId: LEARNER, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [0, 0], score: 0, total: 2, passed: false, createdAt: BEFORE },
    { learnerId: LEARNER, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 0], score: 1, total: 2, passed: false, createdAt: MID },
    { learnerId: LEARNER, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true, createdAt: AFTER },
  ]);
  await evidence("ev-pending-before", ids.org1, "PENDING", BEFORE);
  await evidence("ev-pending-mid", ids.org1, "PENDING", MID);
  await evidence("ev-approved-after", ids.org1, "APPROVED", AFTER, AFTER);
  await competency("cmp-approved-after", ids.org1, "ev-approved-after", AFTER, null);
  await evidence("ev-approved-expiring", ids.org1, "APPROVED", AFTER, AFTER);
  await competency("cmp-approved-expiring", ids.org1, "ev-approved-expiring", AFTER, EXPIRES);
  await evidence("ev-rejected-mid", ids.org1, "REJECTED", MID, MID);
}

beforeEach(async () => {
  resetFakeDb();
  await seedAcademyFixture();
  await prisma.academyTrainingAssignment.updateMany({ where: { companyId: ids.org1, learnerId: LEARNER, courseId: ids.course }, data: { createdAt: C1 } });
  await prisma.academyTrainingAssignment.updateMany({ where: { companyId: ids.org1, learnerId: OTHER_LEARNER, courseId: ids.course }, data: { createdAt: C1 } });
  await courseTwo();
});

describe("report output matches persisted lesson progress, assessment results and competencies", () => {
  it("matches the oracle for each course at a fixed report time", async () => {
    await seedLearnerOneRecords();
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const byCourse = new Map(report.courses.map((course) => [course.courseId, course]));

    for (const [courseId, slots, cutoff] of [[ids.course, COURSE_ONE_SLOTS, C1], [COURSE_TWO, COURSE_TWO_SLOTS, C2]] as const) {
      const course = byCourse.get(courseId);
      expect(course).toBeDefined();
      const expected = oracle(slots, cutoff, NOW);
      expect(course!.countedFrom).toEqual(cutoff);
      expect(course!.summary).toMatchObject({
        requiredAcknowledged: expected.requiredAcknowledged,
        optionalAcknowledged: expected.optionalAcknowledged,
        practicalPending: expected.practicalPending,
        activeCompetencies: expected.activeCompetencies,
        excludedBeforeAssignment: expected.excludedBeforeAssignment,
      });
      for (const lesson of course!.lessons) {
        const persisted = rows("academyLearnerCompletion").find((row) => row.learnerId === LEARNER && row.lessonId === lesson.lessonId && row.revisionId === lesson.revisionId);
        const counted = persisted && (persisted.completedAt as Date) >= cutoff;
        expect(lesson.acknowledgement).toEqual(counted ? { completedAt: persisted!.completedAt } : null);
        expect(lesson.knowledgeCheck.attempts).toBe(expected.attemptsByLesson[lesson.lessonId]);
      }
    }
  });

  it("reports required and optional lesson progress exactly as the persisted acknowledgements, after the cut-off", async () => {
    await seedLearnerOneRecords();
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const [courseOne] = report.courses.filter((course) => course.courseId === ids.course);
    // Lesson A was acknowledged after C1 and counts. Lesson B was acknowledged before C1 and does not.
    expect(courseOne.summary).toMatchObject({ requiredLessons: 1, requiredAcknowledged: 1, requiredPercent: 100, optionalLessons: 1, optionalAcknowledged: 0 });
    expect(courseOne.completionState).toBe("REQUIRED_LESSONS_ACKNOWLEDGED");
    expect(courseOne.lessons.find((lesson) => lesson.lessonId === ids.lessonB)).toMatchObject({ acknowledgement: null, excludedBeforeAssignment: 1 });
  });

  it("reports assessment results as the latest counted attempt and whether any counted attempt passed", async () => {
    await seedLearnerOneRecords();
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const [courseOne] = report.courses.filter((course) => course.courseId === ids.course);
    const lessonA = courseOne.lessons.find((lesson) => lesson.lessonId === ids.lessonA)!;
    // The BEFORE attempt was passed-false and is excluded. The latest counted attempt is the AFTER pass.
    expect(lessonA.knowledgeCheck).toEqual({
      attempts: 2,
      passed: true,
      latest: { score: 2, total: 2, passed: true, createdAt: AFTER },
    });
  });

  it("does not let a pre-assignment pass count toward the assessment result", async () => {
    await seed("academyKnowledgeAttempt", [{ learnerId: LEARNER, lessonId: ids.lessonA, revisionId: ids.revisionA, answers: [1, 1], score: 2, total: 2, passed: true, createdAt: BEFORE }]);
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const lessonA = report.courses[0].lessons.find((lesson) => lesson.lessonId === ids.lessonA)!;
    expect(lessonA.knowledgeCheck).toEqual({ attempts: 0, passed: false, latest: null });
  });

  it("counts approved competencies and practical pending items exactly as persisted, with expiry applied", async () => {
    await seedLearnerOneRecords();
    const inDate = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const expected = oracle(COURSE_ONE_SLOTS, C1, NOW);
    expect(course(inDate, ids.course).summary).toMatchObject({ practicalPending: expected.practicalPending, activeCompetencies: 2 });
    expect(expected.practicalPending).toBe(1);

    const afterExpiry = await buildLearnerCompletionReport(ids.org1, LEARNER, AFTER_EXPIRY);
    const expiredOracle = oracle(COURSE_ONE_SLOTS, C1, AFTER_EXPIRY);
    expect(course(afterExpiry, ids.course).summary.activeCompetencies).toBe(expiredOracle.activeCompetencies);
    expect(expiredOracle.activeCompetencies).toBe(1);
    const expiring = course(afterExpiry, ids.course).lessons.flatMap((lesson) => lesson.competencies).find((row) => row.id === "cmp-approved-expiring");
    expect(expiring).toMatchObject({ active: false });
  });

  it("does not treat an acknowledgement as a verified competency", async () => {
    await seedLearnerOneRecords();
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const lessonB = course(report, ids.course).lessons.find((lesson) => lesson.lessonId === ids.lessonB)!;
    expect(lessonB.competencies).toEqual([]);
    expect(lessonB.acknowledgement).toBeNull();
  });

  it("takes required status from the course-track link, not from the records", async () => {
    await seedLearnerOneRecords();
    await prisma.academyCourseTrack.updateMany({ where: { courseId: ids.course }, data: { required: false } });
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    // Every lesson in the course is now optional, so the required count is zero even though records exist.
    expect(course(report, ids.course).summary).toMatchObject({ requiredLessons: 0, requiredPercent: null });
    expect(course(report, ids.course).completionState).toBe("NO_REQUIRED_LESSONS");
  });
});

describe("shared records are counted once across the learner's assigned courses", () => {
  it("counts one competency once in learner and roll-up totals although both courses contain its lesson", async () => {
    await seedLearnerOneRecords();
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    // Both courses count the AFTER competencies (cmp-approved-after, cmp-approved-expiring), each once per course.
    expect(course(report, ids.course).summary.activeCompetencies).toBe(2);
    expect(course(report, COURSE_TWO).summary.activeCompetencies).toBe(2);
    expect(report.totals).toEqual({ practicalPending: 1, activeCompetencies: 2 });

    const roll = await buildCompanyCompletionReport(ids.org1, NOW);
    expect(roll.learners.find((learner) => learner.learnerId === LEARNER)?.totals).toEqual({ practicalPending: 1, activeCompetencies: 2 });
    expect(roll.totals.activeCompetencies).toBe(2);
    expect(roll.totals.practicalPending).toBe(1);
  });

  it("keeps the roll-up equal to the sum of distinct learner records", async () => {
    await seedLearnerOneRecords();
    await evidence("ev-learner2-pending", ids.org1, "PENDING", AFTER, null, OTHER_LEARNER);
    const roll = await buildCompanyCompletionReport(ids.org1, NOW);
    const learnerTotals = roll.learners.map((learner) => learner.totals);
    expect(roll.totals.practicalPending).toBe(learnerTotals.reduce((sum, totals) => sum + totals.practicalPending, 0));
    expect(roll.totals.activeCompetencies).toBe(learnerTotals.reduce((sum, totals) => sum + totals.activeCompetencies, 0));
    expect(roll.totals).toMatchObject({ practicalPending: 2, activeCompetencies: 2 });
  });
});

describe("organisation membership changes", () => {
  it("returns not found for a learner who has left the organisation, and keeps their records", async () => {
    await seedLearnerOneRecords();
    await prisma.companyMember.deleteMany({ where: { companyId: ids.org1, userId: LEARNER } });

    await expect(buildLearnerCompletionReport(ids.org1, LEARNER, NOW)).rejects.toBeInstanceOf(NotFoundError);
    const res = await request(app).get(learnerReportUrl(LEARNER)).set(auth(ids.manager));
    expect(res.status).toBe(404);

    const roll = await buildCompanyCompletionReport(ids.org1, NOW);
    expect(roll.learners.map((learner) => learner.learnerId)).toEqual([OTHER_LEARNER]);
    expect(rows("academyVerifiedCompetency").filter((row) => row.learnerId === LEARNER)).toHaveLength(2);
  });

  it("restores the same figures once the learner rejoins the organisation", async () => {
    await seedLearnerOneRecords();
    const before = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    await prisma.companyMember.deleteMany({ where: { companyId: ids.org1, userId: LEARNER } });
    await seed("companyMember", [{ companyId: ids.org1, userId: LEARNER, role: "LEARNER" }]);
    const after = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(after.courses).toEqual(before.courses);
    expect(after.totals).toEqual(before.totals);
  });

  it("lifts withholding of a shared revision once the other organisation removes the learner", async () => {
    await seedLearnerOneRecords();
    // Organisation two assigns the same course to the learner, so lesson A's records are withheld from organisation one.
    await seed("companyMember", [{ companyId: ids.org2, userId: LEARNER, role: "LEARNER" }]);
    await seed("academyTrainingAssignment", [{ companyId: ids.org2, learnerId: LEARNER, assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED", createdAt: BEFORE }]);
    const shared = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(course(shared, ids.course).lessons.find((lesson) => lesson.lessonId === ids.lessonA)).toMatchObject({ withheldAsShared: true, acknowledgement: null });

    await prisma.companyMember.deleteMany({ where: { companyId: ids.org2, userId: LEARNER } });
    const unshared = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(course(unshared, ids.course).lessons.find((lesson) => lesson.lessonId === ids.lessonA)).toMatchObject({
      withheldAsShared: false,
      acknowledgement: { completedAt: MID },
    });
  });
});

describe("tenant isolation", () => {
  async function otherOrganisationRecords(): Promise<void> {
    // Learner one is also a member of organisation two, which holds its own evidence and competency for the same lesson.
    await seed("companyMember", [{ companyId: ids.org2, userId: LEARNER, role: "LEARNER" }]);
    await evidence("ev-org2-pending", ids.org2, "PENDING", AFTER);
    await evidence("ev-org2-approved", ids.org2, "APPROVED", AFTER, AFTER);
    await competency("cmp-org2", ids.org2, "ev-org2-approved", AFTER, null);
    await seed("academyTrainingAssignment", [{ companyId: ids.org2, learnerId: LEARNER, assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED", createdAt: BEFORE }]);
  }

  it("hides another organisation's evidence and competencies from this organisation's learner report", async () => {
    await seedLearnerOneRecords();
    await otherOrganisationRecords();
    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    const ids1 = report.courses.flatMap((c) => c.lessons.flatMap((l) => [...l.practicalEvidence.map((e) => e.id), ...l.competencies.map((c2) => c2.id)]));
    expect(ids1).not.toContain("ev-org2-pending");
    expect(ids1).not.toContain("ev-org2-approved");
    expect(ids1).not.toContain("cmp-org2");
    expect(report.totals).toEqual({ practicalPending: 1, activeCompetencies: 2 });
    expect(report.courses.map((course) => course.courseId).sort()).toEqual([COURSE_TWO, ids.course].sort());
  });

  it("hides this organisation's records from the other organisation's report, and reports its own", async () => {
    await seedLearnerOneRecords();
    await otherOrganisationRecords();
    const report = await buildLearnerCompletionReport(ids.org2, LEARNER, NOW);
    const found = report.courses.flatMap((c) => c.lessons.flatMap((l) => [...l.practicalEvidence.map((e) => e.id), ...l.competencies.map((c2) => c2.id)]));
    expect(found.sort()).toEqual(["cmp-org2", "ev-org2-approved", "ev-org2-pending"].sort());
    expect(report.totals).toEqual({ practicalPending: 1, activeCompetencies: 1 });
  });

  it("keeps another organisation's pending evidence out of this organisation's roll-up", async () => {
    await evidence("ev-org2-only", ids.org2, "PENDING", AFTER, null, OTHER_LEARNER);
    await seed("companyMember", [{ companyId: ids.org2, userId: OTHER_LEARNER, role: "LEARNER" }]);
    const roll = await buildCompanyCompletionReport(ids.org1, NOW);
    expect(roll.totals.practicalPending).toBe(0);
    expect(JSON.stringify(roll)).not.toContain("ev-org2-only");
  });

  it("refuses reports across organisations: a non-member cannot read a learner report, and a manager cannot read another organisation's roll-up", async () => {
    await seedLearnerOneRecords();
    expect((await request(app).get(learnerReportUrl(LEARNER, ids.org1)).set(auth(ids.outsider))).status).toBe(403);
    const crossed = await request(app).get(orgReportUrl(ids.org2)).set(auth(ids.manager));
    expect(crossed.status).toBe(403);
    expect(crossed.body.data).toBeUndefined();
  });

  it("returns this organisation's report through the route, with no other organisation's records", async () => {
    await seedLearnerOneRecords();
    await otherOrganisationRecords();
    // The route reads the clock, so pin it to NOW: the expiring competency is still in date at that time.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    try {
      const res = await request(app).get(learnerReportUrl(LEARNER)).set(auth(ids.manager));
      expect(res.status).toBe(200);
      expect(JSON.stringify(res.body.data)).not.toContain("ev-org2");
      expect(res.body.data.totals).toEqual({ practicalPending: 1, activeCompetencies: 2 });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("the learner's course progress endpoint differs from the report only by the assignment cut-off", () => {
  it("counts a pre-assignment acknowledgement in course progress but not in the report", async () => {
    await seedLearnerOneRecords();
    const progress = await buildCourseLessonProgress(ids.course, LEARNER);
    const lessonB = progress.lessons.find((lesson) => lesson.lessonId === ids.lessonB);
    expect(lessonB).toMatchObject({ completed: true, completedAt: BEFORE.toISOString() });

    const report = await buildLearnerCompletionReport(ids.org1, LEARNER, NOW);
    expect(course(report, ids.course).lessons.find((lesson) => lesson.lessonId === ids.lessonB)?.acknowledgement).toBeNull();
    expect(progress.required).toEqual({ total: 1, completed: 1 });
  });
});

/** Narrows a report to one course, failing the test if it is missing. */
function course(report: { courses: CourseEvidence[] }, courseId: string): CourseEvidence {
  const found = report.courses.find((item) => item.courseId === courseId);
  if (!found) throw new Error(`course ${courseId} missing from report`);
  return found;
}
