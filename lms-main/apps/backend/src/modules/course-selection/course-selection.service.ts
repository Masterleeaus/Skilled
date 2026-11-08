/**
 * Course lesson selection (PASS42). Chooses which lessons from a course's level CSV count for the level gates.
 *
 * Scopes. Each organisation has its own selection for a course (companyId set). The course-wide default
 * (companyId null) applies to an organisation that has no selection of its own. With no rows at all, the full
 * level CSV applies. A saved selection is never empty.
 *
 * Who may read or save:
 * - A platform ADMIN or the course's teacher (Course.teacherId) manages the course-wide default, or any organisation's
 *   selection for an organisation the course is assigned to (when companyId is named).
 * - An OWNER of an organisation the course is assigned to manages only that organisation's selection, and must name it.
 *   An owner cannot read or write the course-wide default or another organisation's selection.
 * - Everyone else, including learners, gets 403.
 */
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { ForbiddenError, NotFoundError, ValidationError } from "../../utils/AppError";
import { courseLevelEntries, LEVEL_ORDER, LevelKey } from "../levels/level-rules";

export interface SelectionActor { userId: string; role: string }

/** The organisation whose selection is read or changed, or null for the course-wide default. */
export type SelectionScope = string | null;

export interface PoolLesson { sourceId: string; level: LevelKey; title: string | null }
export interface CoursePool { courseId: string; lessons: PoolLesson[]; countsByLevel: Record<LevelKey, number> }
export interface CourseSelection {
  courseId: string;
  /** The scope this answer is for: an organisation, or null for the course-wide default. */
  companyId: SelectionScope;
  /** Which selection applies to this scope: its own, the course-wide default, or the full level CSV. */
  source: "ORGANISATION" | "COURSE_DEFAULT" | "FULL_LEVEL";
  /** True when no selection applies, so the full level CSV is used. */
  usesFullLevel: boolean;
  /** The lessons that apply to this scope. Empty when usesFullLevel is true. */
  sourceIds: string[];
  /** True when this scope has its own saved rows, rather than inheriting the course-wide default. */
  ownSelection: boolean;
  savedAt: string | null;
  /** Lessons that count for the gate in each level: the selection, or the full pool when usesFullLevel is true. */
  countsByLevel: Record<LevelKey, number>;
}

const saveSchema = z.object({
  sourceIds: z.array(z.string().trim().min(1).max(64)).min(1, "Select at least one lesson").max(1000),
});

const inPool = (entries: Record<string, LevelKey>, sourceId: string): boolean => Object.prototype.hasOwnProperty.call(entries, sourceId);

const emptyCounts = (): Record<LevelKey, number> => ({ base: 0, group: 0, specialised: 0 });

function countByLevel(levels: LevelKey[]): Record<LevelKey, number> {
  const counts = emptyCounts();
  for (const level of levels) counts[level] += 1;
  return counts;
}

/** The organisation a caller named: undefined when none is named (course-wide), otherwise a non-empty string. */
export function namedCompany(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim()) return value.trim();
  throw new ValidationError([{ path: ["companyId"], message: "companyId must be a non-empty string" }]);
}

async function loadCourse(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, slug: true, teacherId: true } });
  if (!course) throw new NotFoundError("Course");
  return course;
}

/**
 * Resolves the scope the caller may read or change, or throws 403. Course managers get the course-wide default when
 * no organisation is named. An organisation owner must name an organisation they own, which the course is assigned to.
 */
export async function resolveManageScope(
  actor: SelectionActor,
  course: { id: string; teacherId: string },
  companyId: string | undefined,
): Promise<SelectionScope> {
  const manager = actor.role === "ADMIN" || course.teacherId === actor.userId;
  if (!companyId) {
    if (manager) return null;
    throw new ForbiddenError("Name your organisation (companyId) to choose its lessons");
  }
  if (!manager) {
    const owner = await prisma.companyMember.findFirst({
      where: { userId: actor.userId, companyId, role: "OWNER" },
      select: { id: true },
    });
    if (!owner) throw new ForbiddenError("Only the course owner, its teacher, an administrator or an owner of the organisation can choose its lessons");
  }
  const assigned = await prisma.academyTrainingAssignment.findFirst({
    where: { courseId: course.id, companyId },
    select: { id: true },
  });
  if (!assigned) throw new ForbiddenError("This course is not assigned to that organisation");
  return companyId;
}

/** The shared lessons this course could include, from its level CSV, in level order. */
export async function getCoursePool(actor: SelectionActor, courseId: string, companyId?: string): Promise<CoursePool> {
  const course = await loadCourse(courseId);
  await resolveManageScope(actor, course, companyId);
  const entries = courseLevelEntries(course.slug);
  const sourceIds = Object.keys(entries);
  const records = sourceIds.length
    ? await prisma.academyContentLesson.findMany({ where: { sourceId: { in: sourceIds } }, select: { sourceId: true, title: true } })
    : [];
  const titles = new Map(records.map((record) => [record.sourceId, record.title]));
  const lessons: PoolLesson[] = sourceIds
    .map((sourceId) => ({ sourceId, level: entries[sourceId], title: titles.get(sourceId) ?? null }))
    .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) || a.sourceId.localeCompare(b.sourceId));
  return { courseId: course.id, lessons, countsByLevel: countByLevel(lessons.map((lesson) => lesson.level)) };
}

/** Saved rows for one scope (an organisation, or the course-wide default when null), in sourceId order. */
async function ownRows(courseId: string, scope: SelectionScope) {
  return prisma.academyCourseLessonSelection.findMany({
    where: { courseId, companyId: scope },
    select: { sourceId: true, savedAt: true },
    orderBy: { sourceId: "asc" },
  });
}

/**
 * The selection that applies to a scope: its own rows; else, for an organisation, the course-wide default rows;
 * else none (the full level CSV).
 */
async function effectiveSelection(courseId: string, scope: SelectionScope) {
  const own = await ownRows(courseId, scope);
  if (own.length) return { source: scope ? ("ORGANISATION" as const) : ("COURSE_DEFAULT" as const), rows: own, ownSelection: true };
  if (scope) {
    const inherited = await ownRows(courseId, null);
    if (inherited.length) return { source: "COURSE_DEFAULT" as const, rows: inherited, ownSelection: false };
  }
  return { source: "FULL_LEVEL" as const, rows: [], ownSelection: false };
}

/**
 * The lessons that apply to a learner on a course, as a set of sourceIds, or undefined when the full level CSV applies.
 * The learner's organisation selection applies first (the organisation of their earliest training assignment for the
 * course), then the course-wide default. Outline and progress use it to list only the chosen lessons.
 */
export async function loadSavedSelection(courseId: string, learnerId: string): Promise<Set<string> | undefined> {
  const assignment = await prisma.academyTrainingAssignment.findFirst({
    where: { courseId, learnerId },
    orderBy: { createdAt: "asc" },
    select: { companyId: true },
  });
  const effective = await effectiveSelection(courseId, assignment?.companyId ?? null);
  return effective.rows.length ? new Set(effective.rows.map((row) => row.sourceId)) : undefined;
}

/** The selection that applies to the scope the caller may manage, or the full-level default when none applies. */
export async function getCourseSelection(actor: SelectionActor, courseId: string, companyId?: string): Promise<CourseSelection> {
  const course = await loadCourse(courseId);
  const scope = await resolveManageScope(actor, course, companyId);
  return readSelection(course.id, course.slug, scope);
}

async function readSelection(courseId: string, courseSlug: string, scope: SelectionScope): Promise<CourseSelection> {
  const effective = await effectiveSelection(courseId, scope);
  const entries = courseLevelEntries(courseSlug);
  const poolIds = Object.keys(entries);
  const counted = effective.rows.length ? effective.rows.map((row) => row.sourceId).filter((id) => inPool(entries, id)) : poolIds;
  const savedAt = effective.rows.reduce<Date | null>((latest, row) => (!latest || row.savedAt > latest ? row.savedAt : latest), null);
  return {
    courseId,
    companyId: scope,
    source: effective.source,
    usesFullLevel: effective.rows.length === 0,
    sourceIds: effective.rows.map((row) => row.sourceId),
    ownSelection: effective.ownSelection,
    savedAt: savedAt ? savedAt.toISOString() : null,
    countsByLevel: countByLevel(counted.map((id) => entries[id])),
  };
}

/**
 * Replaces the selection of the scope the caller manages with the given lessons. Every ID must be in the course pool,
 * or the save is refused. Duplicates are collapsed. Other scopes are never touched. The replacement runs in one transaction.
 */
export async function saveCourseSelection(actor: SelectionActor, courseId: string, body: unknown): Promise<CourseSelection> {
  const course = await loadCourse(courseId);
  const named = namedCompany((body as { companyId?: unknown } | null | undefined)?.companyId);
  const scope = await resolveManageScope(actor, course, named);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError(parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })));
  const requested = [...new Set(parsed.data.sourceIds)];
  const entries = courseLevelEntries(course.slug);
  const unknown = requested.filter((id) => !inPool(entries, id));
  if (unknown.length) throw new ValidationError([{ code: "UNKNOWN_LESSON", sourceIds: unknown }], "Some lessons are not in this course's pool");
  await prisma.$transaction(async (tx) => {
    await tx.academyCourseLessonSelection.deleteMany({ where: { courseId: course.id, companyId: scope } });
    await tx.academyCourseLessonSelection.createMany({
      data: requested.map((sourceId) => ({ courseId: course.id, companyId: scope, sourceId, savedById: actor.userId })),
    });
  });
  return readSelection(course.id, course.slug, scope);
}
