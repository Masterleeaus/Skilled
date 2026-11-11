import { prisma } from "../../config/prisma";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import { enrollInCourse } from "../enrollment/enrollment.service";
import {
  computePathwayProgress,
  courseState,
  moduleState,
  PathwayItemInput,
  PathwayProgress,
} from "./pathway.progress";
import { BASE_MODULE_UNITS, MODULE_KEY_PREFIX, SERVICE_ITEM_KEY } from "./pathway.seed";

export interface PathwayActor {
  userId: string;
  role: string;
}

export interface EnrolInput {
  learnerId?: string;
  companyId?: string;
}

interface ItemRow {
  courseSlug: string;
  required: boolean;
  position: number;
}

// Same organisation roles the Academy training routes use for management actions.
const ORG_MANAGER_ROLES = ["OWNER", "MANAGER"];

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: unknown }).code === "P2002";
}

async function findPathway(code: string) {
  const pathway = await prisma.academyCurriculumPathway.findUnique({ where: { code } });
  if (!pathway) throw new NotFoundError("Pathway");
  return pathway;
}

async function membershipOf(companyId: string, userId: string) {
  return prisma.companyMember.findUnique({
    where: { companyId_userId: { companyId, userId } },
  });
}

async function requireOrgManager(companyId: string, userId: string) {
  const member = await membershipOf(companyId, userId);
  if (!member || !ORG_MANAGER_ROLES.includes(member.role)) {
    throw new ForbiddenError("Organisation owner or manager role required");
  }
}

/**
 * Enrolment rules:
 * - A learner may enrol themselves, with or without an organisation (if they belong to it).
 * - Enrolling another learner needs an organisation owner or manager, and that learner must belong to the organisation.
 */
export async function assertCanEnrol(actorId: string, learnerId: string, companyId: string | null) {
  if (learnerId === actorId) {
    if (companyId && !(await membershipOf(companyId, actorId))) {
      throw new ForbiddenError("You must belong to this organisation to enrol in its pathway");
    }
    return;
  }
  if (!companyId) throw new ForbiddenError("Only an organisation owner or manager can enrol another learner");
  await requireOrgManager(companyId, actorId);
  if (!(await membershipOf(companyId, learnerId))) {
    throw new ForbiddenError("Learner is not a member of this organisation");
  }
}

/** Progress for another learner is visible only to managers of the organisation that holds the enrolment. */
async function assertCanViewProgress(actorId: string, learnerId: string, pathwayId: string) {
  if (learnerId === actorId) return;
  const enrolment = await prisma.academyPathwayEnrolment.findUnique({
    where: { pathwayId_learnerId: { pathwayId, learnerId } },
  });
  // Same answer for "no enrolment" and "not a manager", so the response does not reveal who is enrolled.
  const member = enrolment?.companyId ? await membershipOf(enrolment.companyId, actorId) : null;
  if (!member || !ORG_MANAGER_ROLES.includes(member.role)) {
    throw new ForbiddenError("Pathway progress access denied");
  }
}

function isModuleKey(key: string) {
  return key.startsWith(MODULE_KEY_PREFIX);
}

function isCourseKey(key: string) {
  return !isModuleKey(key) && key !== SERVICE_ITEM_KEY;
}

interface LessonCount {
  total: number;
  completed: number;
}

/**
 * Base lessons for each unit, counted across the learner's enrolled courses.
 * A base lesson is delivered when a published track holding it is attached to a course the learner is enrolled in.
 * It is completed when the learner has an AcademyLearnerCompletion for it.
 */
async function baseLessonCounts(learnerId: string, units: string[]): Promise<Map<string, LessonCount>> {
  const counts = new Map<string, LessonCount>(units.map((unit) => [unit, { total: 0, completed: 0 }]));
  const enrolments = await prisma.enrollment.findMany({
    where: { studentId: learnerId, status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { courseId: true },
  });
  const courseIds = [...new Set(enrolments.map((row) => row.courseId))];
  if (courseIds.length === 0) return counts;

  const courseTracks = await prisma.academyCourseTrack.findMany({
    where: { courseId: { in: courseIds }, track: { status: "PUBLISHED" } },
    select: { trackId: true },
  });
  const trackIds = [...new Set(courseTracks.map((row) => row.trackId))];
  if (trackIds.length === 0) return counts;

  const placements = await prisma.academyLessonPlacement.findMany({
    where: { trackId: { in: trackIds } },
    select: { lessonId: true },
  });
  const lessonIds = [...new Set(placements.map((row) => row.lessonId))];
  if (lessonIds.length === 0) return counts;

  const lessons = await prisma.academyContentLesson.findMany({
    where: { id: { in: lessonIds }, layer: "Universal", unit: { in: units } },
    select: { id: true, unit: true },
  });
  if (lessons.length === 0) return counts;

  const completions = await prisma.academyLearnerCompletion.findMany({
    where: { learnerId, lessonId: { in: lessons.map((lesson) => lesson.id) } },
    select: { lessonId: true },
  });
  const completed = new Set(completions.map((row) => row.lessonId));

  for (const lesson of lessons) {
    const count = counts.get(lesson.unit)!;
    count.total += 1;
    if (completed.has(lesson.id)) count.completed += 1;
  }
  return counts;
}

/** Progress state for every item in a pathway, for one learner. */
async function itemStates(learnerId: string, rows: ItemRow[]): Promise<PathwayItemInput[]> {
  const units = rows
    .filter((row) => isModuleKey(row.courseSlug))
    .map((row) => BASE_MODULE_UNITS[row.courseSlug.slice(MODULE_KEY_PREFIX.length)])
    .filter((unit): unit is string => Boolean(unit));
  const lessonCounts = await baseLessonCounts(learnerId, [...new Set(units)]);

  const courseSlugs = [...new Set(rows.filter((row) => isCourseKey(row.courseSlug)).map((row) => row.courseSlug))];
  const catalogue = courseSlugs.length
    ? await prisma.course.findMany({ where: { slug: { in: courseSlugs } }, select: { id: true, slug: true, title: true } })
    : [];
  const bySlug = new Map(catalogue.map((course) => [course.slug, course]));
  const enrolments = catalogue.length
    ? await prisma.enrollment.findMany({
        where: { studentId: learnerId, courseId: { in: catalogue.map((course) => course.id) } },
        select: { courseId: true, status: true },
      })
    : [];
  // CANCELLED is treated as not enrolled, matching isEnrolled() in the enrolment service.
  const statusByCourse = new Map(enrolments.map((row) => [row.courseId, row.status as string]));

  return rows.map((row): PathwayItemInput => {
    const base = { key: row.courseSlug, required: row.required };
    if (isModuleKey(row.courseSlug)) {
      const title = row.courseSlug.slice(MODULE_KEY_PREFIX.length);
      const unit = BASE_MODULE_UNITS[title];
      const count = (unit && lessonCounts.get(unit)) || { total: 0, completed: 0 };
      return {
        ...base,
        kind: "MODULE",
        label: title,
        title,
        inCatalogue: null,
        state: moduleState(count.completed, count.total),
        lessonsCompleted: count.completed,
        lessonsTotal: count.total,
      };
    }
    if (row.courseSlug === SERVICE_ITEM_KEY) {
      return {
        ...base,
        kind: "SERVICE",
        label: "Service course of your choice",
        title: null,
        inCatalogue: null,
        state: "OPTIONAL",
        lessonsCompleted: null,
        lessonsTotal: null,
      };
    }
    const course = bySlug.get(row.courseSlug);
    const status = course ? statusByCourse.get(course.id) : undefined;
    return {
      ...base,
      kind: "COURSE",
      label: course?.title ?? row.courseSlug,
      title: course?.title ?? null,
      inCatalogue: Boolean(course),
      state: courseState(status === "ACTIVE" || status === "COMPLETED" ? status : null),
      lessonsCompleted: null,
      lessonsTotal: null,
    };
  });
}

async function pathwayRows(pathwayId: string): Promise<ItemRow[]> {
  return prisma.academyPathwayCourse.findMany({
    where: { pathwayId },
    orderBy: { position: "asc" },
    select: { courseSlug: true, required: true, position: true },
  });
}

export async function listPathways(actorId: string) {
  const [pathways, enrolments] = await Promise.all([
    prisma.academyCurriculumPathway.findMany({ orderBy: { code: "asc" } }),
    prisma.academyPathwayEnrolment.findMany({ where: { learnerId: actorId } }),
  ]);

  return Promise.all(
    pathways.map(async (pathway) => {
      const rows = await pathwayRows(pathway.id);
      const enrolment = enrolments.find((item) => item.pathwayId === pathway.id) ?? null;
      const progress = enrolment ? computePathwayProgress(await itemStates(actorId, rows)) : null;
      return {
        code: pathway.code,
        title: pathway.title,
        description: pathway.description,
        status: pathway.status,
        itemCount: rows.length,
        requiredCount: rows.filter((row) => row.required).length,
        enrolment: enrolment
          ? {
              id: enrolment.id,
              status: enrolment.status,
              enrolledAt: enrolment.enrolledAt,
              completedAt: enrolment.completedAt,
              companyId: enrolment.companyId,
            }
          : null,
        progress: progress && {
          percentage: progress.percentage,
          status: progress.status,
          requiredCompleted: progress.requiredCompleted,
          requiredTotal: progress.requiredTotal,
        },
      };
    }),
  );
}

export async function getPathway(actorId: string, code: string) {
  const pathway = await findPathway(code);
  const rows = await pathwayRows(pathway.id);
  const enrolment = await prisma.academyPathwayEnrolment.findUnique({
    where: { pathwayId_learnerId: { pathwayId: pathway.id, learnerId: actorId } },
  });
  const progress: PathwayProgress = computePathwayProgress(await itemStates(actorId, rows));

  return {
    code: pathway.code,
    title: pathway.title,
    description: pathway.description,
    status: pathway.status,
    items: progress.items,
    enrolment: enrolment ?? null,
    progress: enrolment ? progress : null,
  };
}

async function rollbackEnrolments(enrolmentIds: string[]) {
  for (const id of enrolmentIds) {
    await prisma.enrollment.delete({ where: { id } });
  }
}

/**
 * Enrol a learner in a pathway. Base modules need no enrolment: their lessons arrive through the courses the
 * learner enrols in. Any required course item goes through enrollInCourse, so course rules still apply. If a course
 * blocks enrolment, the course enrolments this call created are removed and no pathway row is written.
 * Optional and service items are never enrolled automatically.
 */
export async function enrolInPathway(actor: PathwayActor, code: string, input: EnrolInput) {
  const pathway = await findPathway(code);
  const learnerId = input.learnerId ?? actor.userId;
  const companyId = input.companyId ?? null;

  await assertCanEnrol(actor.userId, learnerId, companyId);

  const learner = await prisma.user.findUnique({ where: { id: learnerId }, select: { id: true, isActive: true } });
  if (!learner || !learner.isActive) throw new NotFoundError("Learner");

  const existing = await prisma.academyPathwayEnrolment.findUnique({
    where: { pathwayId_learnerId: { pathwayId: pathway.id, learnerId } },
  });
  if (existing) throw new AppError("Learner is already enrolled in this pathway", 409);

  const required = (await pathwayRows(pathway.id)).filter((row) => row.required && isCourseKey(row.courseSlug));
  const courses: Array<{ id: string; slug: string }> = [];
  for (const row of required) {
    const course = await prisma.course.findUnique({ where: { slug: row.courseSlug }, select: { id: true, slug: true } });
    if (!course) throw new AppError(`Pathway course "${row.courseSlug}" is not in the course catalogue`, 422);
    courses.push(course);
  }

  const createdCourseEnrolments: string[] = [];
  try {
    for (const course of courses) {
      try {
        const enrolment = await enrollInCourse(learnerId, course.id);
        createdCourseEnrolments.push(enrolment.id);
      } catch (err) {
        if (!(err instanceof AppError)) throw err;
        // enrollInCourse answers 409 for an existing enrolment. An ACTIVE or COMPLETED one is reused.
        // A CANCELLED one is not reused, because the course rules do not allow it.
        const current =
          err.statusCode === 409
            ? await prisma.enrollment.findUnique({
                where: { studentId_courseId: { studentId: learnerId, courseId: course.id } },
              })
            : null;
        if (!current || current.status === "CANCELLED") {
          throw new AppError(`Course "${course.slug}" blocks pathway enrolment: ${err.message}`, err.statusCode);
        }
      }
    }

    const enrolment = await prisma.academyPathwayEnrolment.create({
      data: {
        pathwayId: pathway.id,
        learnerId,
        companyId,
        status: "ACTIVE",
        enrolledAt: new Date(),
        completedAt: null,
      },
    });

    return {
      enrolment,
      courseEnrolmentsCreated: createdCourseEnrolments.length,
      courseEnrolmentsReused: courses.length - createdCourseEnrolments.length,
    };
  } catch (err) {
    await rollbackEnrolments(createdCourseEnrolments);
    if (isUniqueViolation(err)) throw new AppError("Learner is already enrolled in this pathway", 409);
    throw err;
  }
}

export async function getLearnerProgress(actorId: string, code: string, learnerId: string) {
  const pathway = await findPathway(code);
  await assertCanViewProgress(actorId, learnerId, pathway.id);

  const enrolment = await prisma.academyPathwayEnrolment.findUnique({
    where: { pathwayId_learnerId: { pathwayId: pathway.id, learnerId } },
  });
  if (!enrolment) throw new NotFoundError("Pathway enrolment");

  const rows = await pathwayRows(pathway.id);
  return {
    pathway: { code: pathway.code, title: pathway.title },
    learnerId,
    enrolment: { id: enrolment.id, status: enrolment.status, enrolledAt: enrolment.enrolledAt, completedAt: enrolment.completedAt },
    progress: computePathwayProgress(await itemStates(learnerId, rows)),
  };
}
