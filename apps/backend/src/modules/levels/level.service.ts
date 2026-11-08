/**
 * Per-learner level gates (PASS42): data loading and access checks over the pure rules in level-rules.ts.
 *
 * Learner scope is every published course the learner is enrolled in (ACTIVE or COMPLETED). Each course's
 * lessons are placed in levels by that course's curriculum/levels CSV map. Facts come from the existing
 * AcademyLearnerCompletion and AcademyKnowledgeAttempt rows. No new storage.
 */
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { courseSlots } from "../curriculum/completion-report.service";
import { loadSavedSelection } from "../course-selection/course-selection.service";
import { getLicenceIndex, isLicenceOnly } from "../curriculum/licence-track";
import {
  agentReadableLevels,
  courseLevelFor,
  GateLesson,
  isSelectedForGate,
  LessonFacts,
  LevelKey,
  LevelLock,
  LevelSummary,
  lessonKey,
  lockForLevel,
  summariseLevels,
} from "./level-rules";

export interface LearnerLevelView {
  levels: LevelSummary[];
  /** Assigned lessons that no course map places in a level. They are not gated. */
  ungatedLessonCount: number;
  lessons: GateLesson[];
}

/** Refused lesson access. The message is the reason; `errors` carries the structured level and waitingOn. */
export class LevelLockedError extends AppError {
  readonly level: LevelKey;
  readonly waitingOn: LevelKey;
  constructor(lock: LevelLock) {
    super(lock.reason, 403, [{ code: "LEVEL_LOCKED", level: lock.level, waitingOn: lock.waitingOn }]);
    this.level = lock.level;
    this.waitingOn = lock.waitingOn;
  }
}

/** Staff and assessors are never gated: platform staff, and organisation owners, managers and assessors. */
export async function isLevelGateExempt(actor: { userId: string; role: string }): Promise<boolean> {
  if (actor.role === "ADMIN" || actor.role === "TEACHER") return true;
  const staff = await prisma.companyMember.findFirst({
    where: { userId: actor.userId, role: { in: ["OWNER", "MANAGER", "ASSESSOR"] } },
    select: { id: true },
  });
  return Boolean(staff);
}

/**
 * Lesson revisions assigned to the learner across every published course they are enrolled in, each with the
 * level its course gives it. Lessons a course map does not place in a level are returned in `ungated`.
 */
export async function loadLearnerLessons(learnerId: string): Promise<{ gated: GateLesson[]; ungated: string[] }> {
  // Licence-only lessons never gate a level. A non-licensed learner could not finish them, so they would block every later level.
  const licence = await getLicenceIndex();
  const enrolments = await prisma.enrollment.findMany({
    where: { studentId: learnerId, status: { in: ["ACTIVE", "COMPLETED"] }, course: { isPublished: true } },
    select: { courseId: true },
  });
  const courses = enrolments.length
    ? await prisma.course.findMany({ where: { id: { in: enrolments.map((e) => e.courseId) } }, select: { id: true, slug: true } })
    : [];
  const gated = new Map<string, GateLesson>();
  const ungated = new Set<string>();
  for (const course of courses) {
    // The learner's own organisation selection, else the course-wide default, else undefined (the full level map).
    const selected = await loadSavedSelection(course.id, learnerId);
    for (const slot of await courseSlots(course.id)) {
      if (isLicenceOnly(licence, slot.sourceId)) continue;
      const level = courseLevelFor(course.slug, slot.sourceId);
      const key = lessonKey(slot.lessonId, slot.revisionId);
      // Outside the owner's selection, a lesson is not gated in this course and does not block anything.
      if (!level || !isSelectedForGate(selected, slot.sourceId)) { ungated.add(key); continue; }
      const entryKey = `${key}|${course.slug}`;
      if (gated.has(entryKey)) continue;
      gated.set(entryKey, {
        lessonId: slot.lessonId,
        revisionId: slot.revisionId,
        sourceId: slot.sourceId,
        title: slot.title,
        courseSlug: course.slug,
        level,
        knowledgeChecks: slot.knowledgeChecks,
      });
    }
  }
  const gatedKeys = new Set([...gated.values()].map((lesson) => lessonKey(lesson.lessonId, lesson.revisionId)));
  return { gated: [...gated.values()], ungated: [...ungated].filter((key) => !gatedKeys.has(key)) };
}

/** Completions and passed knowledge checks for exactly these pinned revisions. Other revisions never count. */
export async function loadLessonFacts(learnerId: string, lessons: GateLesson[]): Promise<LessonFacts> {
  const facts: LessonFacts = { completed: new Set(), passed: new Set() };
  const lessonIds = [...new Set(lessons.map((lesson) => lesson.lessonId))];
  if (!lessonIds.length) return facts;
  const [completions, attempts] = await Promise.all([
    prisma.academyLearnerCompletion.findMany({ where: { learnerId, lessonId: { in: lessonIds } }, select: { lessonId: true, revisionId: true } }),
    prisma.academyKnowledgeAttempt.findMany({ where: { learnerId, lessonId: { in: lessonIds }, passed: true }, select: { lessonId: true, revisionId: true } }),
  ]);
  for (const row of completions) facts.completed.add(lessonKey(row.lessonId, row.revisionId));
  for (const row of attempts) facts.passed.add(lessonKey(row.lessonId, row.revisionId));
  return facts;
}

/** Summaries and assigned lessons for one learner, without any staff exemption. Used by the learner view and the integration filter. */
export async function getLearnerLevelView(learnerId: string): Promise<LearnerLevelView> {
  const { gated, ungated } = await loadLearnerLessons(learnerId);
  const facts = await loadLessonFacts(learnerId, gated);
  return {
    levels: summariseLevels(gated, facts),
    ungatedLessonCount: ungated.length,
    lessons: gated,
  };
}

/** The lock on a lesson for this learner: any enrolled course that places it in a locked level blocks it. */
export function lockForLesson(lessonId: string, view: LearnerLevelView): LevelLock | null {
  for (const lesson of view.lessons) {
    if (lesson.lessonId !== lessonId) continue;
    const lock = lockForLevel(lesson.level, view.levels);
    if (lock) return lock;
  }
  return null;
}

/**
 * Returns the lock check for the caller, by course and lesson source ID. Exempt callers get no locks.
 * Used where a list is returned (course outline) so each lesson can be marked locked without a 403 on the whole list.
 */
export async function resolveLevelLocks(actor: { userId: string; role: string }): Promise<(courseSlug: string, sourceId: string) => LevelLock | null> {
  if (await isLevelGateExempt(actor)) return () => null;
  const view = await getLearnerLevelView(actor.userId);
  // Only lessons that count for the gate can lock. A lesson the owner left out of the course selection cannot.
  return (courseSlug, sourceId) => {
    const entry = view.lessons.find((lesson) => lesson.courseSlug === courseSlug && lesson.sourceId === sourceId);
    return entry ? lockForLevel(entry.level, view.levels) : null;
  };
}

/** Refuses a learner who opens a lesson in a locked level. Staff and assessors pass. */
export async function assertLessonOpen(actor: { userId: string; role: string }, lessonId: string): Promise<void> {
  if (await isLevelGateExempt(actor)) return;
  const view = await getLearnerLevelView(actor.userId);
  const lock = lockForLesson(lessonId, view);
  if (lock) throw new LevelLockedError(lock);
}

/**
 * Keeps only the items whose lesson is in finished levels. A lesson is kept only when every course entry it
 * has for this learner is in a finished, unlocked level. Lessons outside any level are dropped.
 * Used by the AI workforce integration.
 */
export async function filterToFinishedLevels<T extends { lessonId: string }>(learnerId: string, items: T[]): Promise<T[]> {
  if (!items.length) return [];
  const view = await getLearnerLevelView(learnerId);
  const readable = agentReadableLevels(view.levels);
  const readableLessons = new Set<string>();
  const blockedLessons = new Set<string>();
  for (const lesson of view.lessons) {
    if (readable.has(lesson.level)) readableLessons.add(lesson.lessonId);
    else blockedLessons.add(lesson.lessonId);
  }
  return items.filter((item) => readableLessons.has(item.lessonId) && !blockedLessons.has(item.lessonId));
}
