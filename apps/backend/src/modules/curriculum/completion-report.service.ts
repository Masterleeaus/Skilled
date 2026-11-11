/**
 * ACA-025: evidence-backed completion reports for one learner and for an organisation.
 *
 * Canonical sources: AcademyTrainingAssignment (what is assigned), AcademyCourseTrack and
 * AcademyLessonPlacement (what a course contains and which items are required), and the
 * AcademyLearnerCompletion, AcademyKnowledgeAttempt, AcademyPracticalEvidence and
 * AcademyVerifiedCompetency records (what was evidenced).
 *
 * A lesson acknowledgement is a learning record only. It is never reported as a verified
 * practical competency or a certificate.
 *
 * Attribution policy (ACA-025, issue #56). An organisation's report counts a learner's record only when
 * that record's authoritative timestamp is at or after the organisation's assignment for the course
 * (AcademyTrainingAssignment.createdAt, the cut-off):
 *   - lesson acknowledgement: completedAt
 *   - knowledge-check attempt: createdAt
 *   - practical evidence: reviewedAt once an assessor has decided it, otherwise createdAt (submission)
 *   - verified competency: verifiedAt
 * Records on other revisions never count toward the pinned revision. Practical evidence and competencies are
 * organisation-scoped (companyId), so another organisation's records never appear. A learner must be a member
 * of the organisation to have a report there. Membership changes do not delete records: a learner who leaves
 * has no report, and their earlier records reappear if they rejoin.
 *
 * Reassignment. The organisation's assignment row is reused on reassignment (the upsert keeps createdAt), so the
 * cut-off is the organisation's first assignment of the course. Records made since then count across
 * reassignment. This is deliberate and visible: each course reports `countedFrom` (the cut-off) and each
 * lesson reports `excludedBeforeAssignment`, so earlier records are never mixed in silently.
 *
 * Expiry. A competency is active while expiresAt is null or later than the report time. Expired competencies are
 * listed with active=false and are not counted.
 *
 * Shared revisions. A learner's acknowledgement and attempts on a revision are withheld while another organisation
 * that the learner is still a member of also assigns that revision.
 */
import { prisma } from "../../config/prisma";
import { knowledgeCheckCount } from "../levels/level-rules";
import { loadSavedSelection } from "../course-selection/course-selection.service";
import { NotFoundError } from "../../utils/AppError";

const ASSIGNED_STATUSES = ["ASSIGNED", "IN_PROGRESS", "COMPLETED"];

// Same account rule as the authenticate middleware: active, email verified and not soft-deleted.
const ACTIVE_ACCOUNT = { isActive: true, isEmailVerified: true, deletedAt: null };
const isActiveAccount = (user: { isActive: boolean; isEmailVerified: boolean; deletedAt: Date | null } | null) =>
  Boolean(user && user.isActive && user.isEmailVerified && !user.deletedAt);

export type CompletionState = "NO_REQUIRED_LESSONS" | "IN_PROGRESS" | "REQUIRED_LESSONS_ACKNOWLEDGED";

export type PracticalAttribution = "SUBMISSION" | "REVIEW";

export interface LessonEvidence {
  lessonId: string;
  sourceId: string;
  title: string;
  revisionId: string;
  required: boolean;
  /** True when another organisation also assigns this learner the same revision, so its acknowledgement and scores are withheld here. */
  withheldAsShared: boolean;
  /** Records on this pinned revision made before the organisation's cut-off. They are not counted. */
  excludedBeforeAssignment: number;
  acknowledgement: { completedAt: Date } | null;
  knowledgeCheck: {
    attempts: number;
    passed: boolean;
    latest: { score: number; total: number; passed: boolean; createdAt: Date } | null;
  };
  practicalEvidence: Array<{
    id: string;
    status: string;
    submittedAt: Date;
    reviewedAt: Date | null;
    /** The timestamp that placed this record under the cut-off: the review when decided, else the submission. */
    attributedAt: Date;
    attributedBy: PracticalAttribution;
  }>;
  competencies: Array<{
    id: string;
    evidenceId: string;
    /** When the underlying evidence was submitted. Provenance only; the competency is attributed by verifiedAt. */
    evidenceSubmittedAt: Date | null;
    verifiedAt: Date;
    expiresAt: Date | null;
    active: boolean;
  }>;
}

export interface CourseEvidence {
  courseId: string;
  courseTitle: string;
  assignmentStatus: string;
  dueAt: Date | null;
  /** The organisation's assignment cut-off. Only records at or after this time are counted. */
  countedFrom: Date;
  completionState: CompletionState;
  summary: {
    requiredLessons: number;
    requiredAcknowledged: number;
    optionalLessons: number;
    optionalAcknowledged: number;
    requiredPercent: number | null;
    practicalPending: number;
    activeCompetencies: number;
    excludedBeforeAssignment: number;
  };
  lessons: LessonEvidence[];
}

/** Distinct learner-level counts. A record shared by two assigned courses is counted once. */
export interface LearnerTotals {
  practicalPending: number;
  activeCompetencies: number;
}

export interface LessonSlot {
  lessonId: string;
  revisionId: string;
  sourceId: string;
  title: string;
  required: boolean;
  /** Knowledge checks on the pinned revision. Zero when the lesson has none. */
  knowledgeChecks: number;
}

function sameLesson(row: { lessonId: string; revisionId: string }, slot: LessonSlot): boolean {
  return row.lessonId === slot.lessonId && row.revisionId === slot.revisionId;
}

/** Only published, pinned revisions count; this matches the learner outline and completion endpoints. */
export async function courseSlots(courseId: string): Promise<LessonSlot[]> {
  const courseTracks = await prisma.academyCourseTrack.findMany({
    where: { courseId, track: { status: "PUBLISHED" } },
    orderBy: { position: "asc" },
    include: {
      track: {
        include: {
          placements: { orderBy: { position: "asc" }, include: { lesson: true, revision: true } },
        },
      },
    },
  });
  const slots = new Map<string, LessonSlot>();
  for (const courseTrack of courseTracks) {
    for (const placement of courseTrack.track.placements) {
      if (!placement.revisionId || !placement.revision || placement.revision.status !== "PUBLISHED") continue;
      const required = courseTrack.required && placement.required;
      const key = `${placement.lessonId}:${placement.revisionId}`;
      const existing = slots.get(key);
      if (existing) {
        // A lesson reached through any required path is required for the course.
        existing.required = existing.required || required;
      } else {
        slots.set(key, {
          lessonId: placement.lessonId,
          revisionId: placement.revisionId,
          sourceId: placement.lesson.sourceId,
          title: placement.lesson.title,
          required,
          knowledgeChecks: knowledgeCheckCount(placement.revision.body),
        });
      }
    }
  }
  return [...slots.values()];
}

/**
 * Knowledge attempts and lesson acknowledgements have no companyId, so they cannot be attributed to one
 * organisation. A learner's record on a revision is withheld from this organisation's report while another
 * organisation the learner still belongs to also assigns a course containing the same revision. Records are
 * kept, not deleted. A removed membership ends the sharing.
 */
async function sharedRevisionKeys(companyId: string, learnerId: string): Promise<Set<string>> {
  const otherMemberships = await prisma.companyMember.findMany({
    where: { userId: learnerId, companyId: { not: companyId } },
    select: { companyId: true },
  });
  const otherCompanyIds = otherMemberships.map((row) => row.companyId);
  const keys = new Set<string>();
  if (otherCompanyIds.length === 0) return keys;
  const otherAssignments = await prisma.academyTrainingAssignment.findMany({
    where: { learnerId, companyId: { in: otherCompanyIds }, status: { in: ASSIGNED_STATUSES }, course: { isPublished: true } },
    select: { courseId: true },
  });
  for (const courseId of [...new Set(otherAssignments.map((row) => row.courseId))]) {
    for (const slot of await courseSlots(courseId)) keys.add(`${slot.lessonId}:${slot.revisionId}`);
  }
  return keys;
}

/** The timestamp that places a practical evidence record under the cut-off: the review once decided, else the submission. */
function practicalAttribution(row: { createdAt: Date; reviewedAt: Date | null }): { at: Date; by: PracticalAttribution } {
  return row.reviewedAt ? { at: row.reviewedAt, by: "REVIEW" } : { at: row.createdAt, by: "SUBMISSION" };
}

async function courseEvidence(
  companyId: string,
  learnerId: string,
  assignment: { courseId: string; status: string; dueAt: Date | null; createdAt: Date; course: { title: string } },
  now: Date,
  sharedKeys: Set<string>,
): Promise<CourseEvidence> {
  const slots = await courseSlots(assignment.courseId);
  const lessonIds = [...new Set(slots.map((slot) => slot.lessonId))];
  // Cut-off: only records made at or after this organisation's assignment count (see the module header).
  const cutoff = assignment.createdAt;
  const countsFromCutoff = (at: Date) => at >= cutoff;

  const [completions, attempts, evidence, competencies] = await Promise.all([
    prisma.academyLearnerCompletion.findMany({ where: { learnerId, lessonId: { in: lessonIds } } }),
    prisma.academyKnowledgeAttempt.findMany({ where: { learnerId, lessonId: { in: lessonIds } }, orderBy: { createdAt: "desc" } }),
    prisma.academyPracticalEvidence.findMany({ where: { learnerId, companyId, lessonId: { in: lessonIds } }, orderBy: { createdAt: "desc" } }),
    prisma.academyVerifiedCompetency.findMany({ where: { companyId, learnerId, lessonId: { in: lessonIds } }, orderBy: { verifiedAt: "desc" } }),
  ]);
  const evidenceById = new Map(evidence.map((row) => [row.id, row]));

  const lessons: LessonEvidence[] = slots.map((slot) => {
    const withheldAsShared = sharedKeys.has(`${slot.lessonId}:${slot.revisionId}`);
    let excluded = 0;

    // Withheld records are neither counted nor counted as excluded, so a withheld revision reveals nothing.
    const completion = withheldAsShared ? undefined : completions.find((row) => sameLesson(row, slot));
    let acknowledgement: { completedAt: Date } | null = null;
    if (completion) {
      if (countsFromCutoff(completion.completedAt)) acknowledgement = { completedAt: completion.completedAt };
      else excluded += 1;
    }

    const lessonAttempts = withheldAsShared ? [] : attempts.filter((row) => sameLesson(row, slot));
    const countedAttempts = lessonAttempts.filter((row) => countsFromCutoff(row.createdAt));
    excluded += lessonAttempts.length - countedAttempts.length;

    const lessonEvidence = evidence
      .filter((row) => sameLesson(row, slot))
      .map((row) => ({ row, attribution: practicalAttribution(row) }));
    const countedEvidence = lessonEvidence.filter((item) => countsFromCutoff(item.attribution.at));
    excluded += lessonEvidence.length - countedEvidence.length;

    const lessonCompetencies = competencies.filter((row) => sameLesson(row, slot));
    const countedCompetencies = lessonCompetencies.filter((row) => countsFromCutoff(row.verifiedAt));
    excluded += lessonCompetencies.length - countedCompetencies.length;

    return {
      lessonId: slot.lessonId,
      sourceId: slot.sourceId,
      title: slot.title,
      revisionId: slot.revisionId,
      required: slot.required,
      withheldAsShared,
      excludedBeforeAssignment: excluded,
      acknowledgement,
      knowledgeCheck: {
        attempts: countedAttempts.length,
        passed: countedAttempts.some((row) => row.passed),
        latest: countedAttempts[0]
          ? { score: countedAttempts[0].score, total: countedAttempts[0].total, passed: countedAttempts[0].passed, createdAt: countedAttempts[0].createdAt }
          : null,
      },
      practicalEvidence: countedEvidence.map(({ row, attribution }) => ({
        id: row.id,
        status: row.status,
        submittedAt: row.createdAt,
        reviewedAt: row.reviewedAt,
        attributedAt: attribution.at,
        attributedBy: attribution.by,
      })),
      competencies: countedCompetencies.map((row) => ({
        id: row.id,
        evidenceId: row.evidenceId,
        evidenceSubmittedAt: evidenceById.get(row.evidenceId)?.createdAt ?? null,
        verifiedAt: row.verifiedAt,
        expiresAt: row.expiresAt,
        active: !row.expiresAt || row.expiresAt > now,
      })),
    };
  });

  const requiredLessons = lessons.filter((lesson) => lesson.required);
  const optionalLessons = lessons.filter((lesson) => !lesson.required);
  const requiredAcknowledged = requiredLessons.filter((lesson) => lesson.acknowledgement).length;
  const optionalAcknowledged = optionalLessons.filter((lesson) => lesson.acknowledgement).length;
  const completionState: CompletionState = requiredLessons.length === 0
    ? "NO_REQUIRED_LESSONS"
    : requiredAcknowledged === requiredLessons.length
      ? "REQUIRED_LESSONS_ACKNOWLEDGED"
      : "IN_PROGRESS";

  return {
    courseId: assignment.courseId,
    courseTitle: assignment.course.title,
    assignmentStatus: assignment.status,
    dueAt: assignment.dueAt,
    countedFrom: cutoff,
    completionState,
    summary: {
      requiredLessons: requiredLessons.length,
      requiredAcknowledged,
      optionalLessons: optionalLessons.length,
      optionalAcknowledged,
      requiredPercent: requiredLessons.length ? Math.round((requiredAcknowledged / requiredLessons.length) * 100) : null,
      practicalPending: lessons.reduce((total, lesson) => total + lesson.practicalEvidence.filter((row) => row.status === "PENDING").length, 0),
      activeCompetencies: lessons.reduce((total, lesson) => total + lesson.competencies.filter((row) => row.active).length, 0),
      excludedBeforeAssignment: lessons.reduce((total, lesson) => total + lesson.excludedBeforeAssignment, 0),
    },
    lessons,
  };
}

/** Evidence for one learner across every course assigned to them by this organisation. */
export async function buildLearnerCompletionReport(companyId: string, learnerId: string, now = new Date()) {
  // Deactivated or deleted learners have no report in this organisation.
  const learner = await prisma.user.findUnique({ where: { id: learnerId }, select: { isActive: true, isEmailVerified: true, deletedAt: true } });
  if (!isActiveAccount(learner)) throw new NotFoundError("Learner in organisation");
  // A learner who is no longer a member has no report here, even though their assignment rows remain.
  const membership = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId: learnerId } }, select: { id: true } });
  if (!membership) throw new NotFoundError("Learner in organisation");
  const assignments = await prisma.academyTrainingAssignment.findMany({
    where: { companyId, learnerId, status: { in: ASSIGNED_STATUSES }, course: { isPublished: true } },
    include: { course: { select: { title: true } } },
    orderBy: { createdAt: "asc" },
  });
  const sharedKeys = await sharedRevisionKeys(companyId, learnerId);
  const courses: CourseEvidence[] = [];
  for (const assignment of assignments) courses.push(await courseEvidence(companyId, learnerId, assignment, now, sharedKeys));
  return { companyId, learnerId, generatedAt: now.toISOString(), totals: learnerTotals(courses), courses };
}

/** Counts each practical record and competency once, even when two assigned courses share its lesson. */
function learnerTotals(courses: CourseEvidence[]): LearnerTotals {
  const pending = new Set<string>();
  const active = new Set<string>();
  for (const course of courses) {
    for (const lesson of course.lessons) {
      for (const row of lesson.practicalEvidence) if (row.status === "PENDING") pending.add(row.id);
      for (const row of lesson.competencies) if (row.active) active.add(row.id);
    }
  }
  return { practicalPending: pending.size, activeCompetencies: active.size };
}

/**
 * Learner progress through one course's shared lessons. Uses the same de-duplicated slots and
 * required flags as the completion report. Acknowledgement only; it does not certify competency.
 */
export async function buildCourseLessonProgress(courseId: string, learnerId: string, options: { excludeSourceId?: (sourceId: string) => boolean } = {}) {
  // The learner's organisation selection (else the course-wide default) counts only the chosen lessons. With none, the full list stays.
  const selected = await loadSavedSelection(courseId, learnerId);
  // The licence track may leave lessons out of the learner's view. Those are not counted either.
  const slots = (await courseSlots(courseId)).filter((slot) => (!selected || selected.has(slot.sourceId)) && !options.excludeSourceId?.(slot.sourceId));
  const completions = await prisma.academyLearnerCompletion.findMany({
    where: { learnerId, lessonId: { in: slots.map((slot) => slot.lessonId) } },
  });
  const lessons = slots.map((slot) => {
    const acknowledgement = completions.find((row) => sameLesson(row, slot));
    return {
      lessonId: slot.lessonId,
      revisionId: slot.revisionId,
      sourceId: slot.sourceId,
      title: slot.title,
      required: slot.required,
      completed: Boolean(acknowledgement),
      completedAt: acknowledgement ? acknowledgement.completedAt.toISOString() : null,
    };
  });
  const requiredLessons = lessons.filter((lesson) => lesson.required);
  const optionalLessons = lessons.filter((lesson) => !lesson.required);
  const completedLessons = lessons.filter((lesson) => lesson.completed);
  return {
    courseId,
    lessonCount: lessons.length,
    completedCount: completedLessons.length,
    completionPercent: lessons.length ? Math.round((completedLessons.length / lessons.length) * 100) : 0,
    required: { total: requiredLessons.length, completed: requiredLessons.filter((lesson) => lesson.completed).length },
    optional: { total: optionalLessons.length, completed: optionalLessons.filter((lesson) => lesson.completed).length },
    lessons,
  };
}

/** Organisation roll-up for managers. Each row is derived from the same learner-level evidence. */
export async function buildCompanyCompletionReport(companyId: string, now = new Date()) {
  const members = await prisma.companyMember.findMany({
    where: { companyId, role: "LEARNER", user: ACTIVE_ACCOUNT },
    include: { user: { select: { fullName: true } } },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  const learners = [];
  for (const member of members) {
    const report = await buildLearnerCompletionReport(companyId, member.userId, now);
    learners.push({
      learnerId: member.userId,
      fullName: member.user?.fullName ?? null,
      totals: report.totals,
      courses: report.courses.map((course) => ({
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        assignmentStatus: course.assignmentStatus,
        countedFrom: course.countedFrom.toISOString(),
        completionState: course.completionState,
        requiredPercent: course.summary.requiredPercent,
        practicalPending: course.summary.practicalPending,
        activeCompetencies: course.summary.activeCompetencies,
        excludedBeforeAssignment: course.summary.excludedBeforeAssignment,
      })),
    });
  }
  const allCourses = learners.flatMap((learner) => learner.courses);
  return {
    companyId,
    generatedAt: now.toISOString(),
    totals: {
      learners: learners.length,
      assignedCourses: allCourses.length,
      coursesWithRequiredLessonsAcknowledged: allCourses.filter((course) => course.completionState === "REQUIRED_LESSONS_ACKNOWLEDGED").length,
      // Learner-level distinct counts, so a record reached through two assigned courses is not counted twice.
      practicalPending: learners.reduce((total, learner) => total + learner.totals.practicalPending, 0),
      activeCompetencies: learners.reduce((total, learner) => total + learner.totals.activeCompetencies, 0),
    },
    learners,
  };
}
