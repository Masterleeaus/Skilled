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

export interface LessonEvidence {
  lessonId: string;
  sourceId: string;
  title: string;
  revisionId: string;
  required: boolean;
  /** True when another organisation also assigns this learner the same revision, so its acknowledgement and scores are withheld here. */
  withheldAsShared: boolean;
  acknowledgement: { completedAt: Date } | null;
  knowledgeCheck: {
    attempts: number;
    passed: boolean;
    latest: { score: number; total: number; passed: boolean; createdAt: Date } | null;
  };
  practicalEvidence: Array<{ id: string; status: string; submittedAt: Date; reviewedAt: Date | null }>;
  competencies: Array<{ id: string; verifiedAt: Date; expiresAt: Date | null; active: boolean }>;
}

export interface CourseEvidence {
  courseId: string;
  courseTitle: string;
  assignmentStatus: string;
  dueAt: Date | null;
  completionState: CompletionState;
  summary: {
    requiredLessons: number;
    requiredAcknowledged: number;
    optionalLessons: number;
    optionalAcknowledged: number;
    requiredPercent: number | null;
    practicalPending: number;
    activeCompetencies: number;
  };
  lessons: LessonEvidence[];
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
 * organisation. A learner's record on a revision is withheld from this organisation's report when another
 * organisation also assigns that learner a course containing the same revision. Records are kept, not deleted.
 */
async function sharedRevisionKeys(companyId: string, learnerId: string): Promise<Set<string>> {
  const otherAssignments = await prisma.academyTrainingAssignment.findMany({
    where: { learnerId, companyId: { not: companyId }, status: { in: ASSIGNED_STATUSES }, course: { isPublished: true } },
    select: { courseId: true },
  });
  const keys = new Set<string>();
  for (const courseId of [...new Set(otherAssignments.map((row) => row.courseId))]) {
    for (const slot of await courseSlots(courseId)) keys.add(`${slot.lessonId}:${slot.revisionId}`);
  }
  return keys;
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

  const [completions, attempts, evidence, competencies] = await Promise.all([
    prisma.academyLearnerCompletion.findMany({ where: { learnerId, lessonId: { in: lessonIds } } }),
    prisma.academyKnowledgeAttempt.findMany({ where: { learnerId, lessonId: { in: lessonIds } }, orderBy: { createdAt: "desc" } }),
    prisma.academyPracticalEvidence.findMany({ where: { learnerId, companyId, lessonId: { in: lessonIds } }, orderBy: { createdAt: "desc" } }),
    prisma.academyVerifiedCompetency.findMany({ where: { companyId, learnerId, lessonId: { in: lessonIds } }, orderBy: { verifiedAt: "desc" } }),
  ]);

  const lessons: LessonEvidence[] = slots.map((slot) => {
    const withheldAsShared = sharedKeys.has(`${slot.lessonId}:${slot.revisionId}`);
    // Owner rule: only records made after this company's assignment was created count toward its report.
    const countsForCompany = (at: Date) => at >= assignment.createdAt;
    const acknowledgement = withheldAsShared ? undefined : completions.find((row) => sameLesson(row, slot) && countsForCompany(row.completedAt));
    const lessonAttempts: typeof attempts = withheldAsShared ? [] : attempts.filter((row) => sameLesson(row, slot) && countsForCompany(row.createdAt));
    const lessonEvidence = evidence.filter((row) => sameLesson(row, slot));
    const lessonCompetencies = competencies.filter((row) => sameLesson(row, slot));
    return {
      lessonId: slot.lessonId,
      sourceId: slot.sourceId,
      title: slot.title,
      revisionId: slot.revisionId,
      required: slot.required,
      withheldAsShared,
      acknowledgement: acknowledgement ? { completedAt: acknowledgement.completedAt } : null,
      knowledgeCheck: {
        attempts: lessonAttempts.length,
        passed: lessonAttempts.some((row) => row.passed),
        latest: lessonAttempts[0]
          ? { score: lessonAttempts[0].score, total: lessonAttempts[0].total, passed: lessonAttempts[0].passed, createdAt: lessonAttempts[0].createdAt }
          : null,
      },
      practicalEvidence: lessonEvidence.map((row) => ({ id: row.id, status: row.status, submittedAt: row.createdAt, reviewedAt: row.reviewedAt })),
      competencies: lessonCompetencies.map((row) => ({
        id: row.id,
        verifiedAt: row.verifiedAt,
        expiresAt: row.expiresAt,
        active: row.expiresAt === null || row.expiresAt > now,
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
    completionState,
    summary: {
      requiredLessons: requiredLessons.length,
      requiredAcknowledged,
      optionalLessons: optionalLessons.length,
      optionalAcknowledged,
      requiredPercent: requiredLessons.length ? Math.round((requiredAcknowledged / requiredLessons.length) * 100) : null,
      practicalPending: lessons.reduce((total, lesson) => total + lesson.practicalEvidence.filter((row) => row.status === "PENDING").length, 0),
      activeCompetencies: lessons.reduce((total, lesson) => total + lesson.competencies.filter((row) => row.active).length, 0),
    },
    lessons,
  };
}

/** Evidence for one learner across every course assigned to them by this organisation. */
export async function buildLearnerCompletionReport(companyId: string, learnerId: string, now = new Date()) {
  // Deactivated or deleted learners have no report in this organisation.
  const learner = await prisma.user.findUnique({ where: { id: learnerId }, select: { isActive: true, isEmailVerified: true, deletedAt: true } });
  if (!isActiveAccount(learner)) throw new NotFoundError("Learner in organisation");
  const assignments = await prisma.academyTrainingAssignment.findMany({
    where: { companyId, learnerId, status: { in: ASSIGNED_STATUSES }, course: { isPublished: true } },
    include: { course: { select: { title: true } } },
    orderBy: { createdAt: "asc" },
  });
  const sharedKeys = await sharedRevisionKeys(companyId, learnerId);
  const courses: CourseEvidence[] = [];
  for (const assignment of assignments) courses.push(await courseEvidence(companyId, learnerId, assignment, now, sharedKeys));
  return { companyId, learnerId, generatedAt: now.toISOString(), courses };
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
      courses: report.courses.map((course) => ({
        courseId: course.courseId,
        courseTitle: course.courseTitle,
        assignmentStatus: course.assignmentStatus,
        completionState: course.completionState,
        requiredPercent: course.summary.requiredPercent,
        practicalPending: course.summary.practicalPending,
        activeCompetencies: course.summary.activeCompetencies,
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
      practicalPending: allCourses.reduce((total, course) => total + course.practicalPending, 0),
      activeCompetencies: allCourses.reduce((total, course) => total + course.activeCompetencies, 0),
    },
    learners,
  };
}
