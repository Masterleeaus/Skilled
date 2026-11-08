/**
 * Per-learner level gates (PASS42). Pure rules with no Prisma import, so they are tested directly.
 *
 * Owner decisions (see PASS42/LEVEL-gates.md):
 * - A level is finished when every lesson in it is acknowledged on its pinned revision AND every
 *   lesson that has knowledge checks has a passed attempt on that revision. Practical sign-off is not part of the gate.
 * - base is always unlocked. group unlocks when base is finished. specialised unlocks when group is finished.
 *
 * Which level a lesson sits in is decided per course by curriculum/levels/<slug>.csv (the `level` column),
 * compiled into course-level-map.json. The lesson's layer field is NOT used. Map-only rows are excluded.
 * A lesson with no map entry for a course is not gated in that course. Layer app is never gated.
 */
import courseLevelMapFile from "./course-level-map.json";

export const LEVEL_ORDER = ["base", "group", "specialised"] as const;
export type LevelKey = (typeof LEVEL_ORDER)[number];

/** courseSlug -> sourceId -> level. */
export type CourseLevelMap = Record<string, Record<string, LevelKey>>;

const DEFAULT_LEVEL_MAP = (courseLevelMapFile as { courses: Record<string, Record<string, string>> }).courses as unknown as CourseLevelMap;
let activeLevelMap: CourseLevelMap = DEFAULT_LEVEL_MAP;

/** Test-only hook. Lets integration fixtures supply course entries. Pass null to restore the curriculum map. */
export function setCourseLevelMapForTests(map: CourseLevelMap | null): void {
  activeLevelMap = map ?? DEFAULT_LEVEL_MAP;
}

const own = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);

/** The level of a lesson within one course, or null when the course map does not place it in a level. */
export function courseLevelFor(courseSlug: string, sourceId: string, map: CourseLevelMap = activeLevelMap): LevelKey | null {
  if (!own(map, courseSlug)) return null;
  const lessons = map[courseSlug];
  return own(lessons, sourceId) ? lessons[sourceId] : null;
}

/** The full pool of a course from its level map: sourceId -> level. Empty when the course has no map entry. */
export function courseLevelEntries(courseSlug: string, map: CourseLevelMap = activeLevelMap): Record<string, LevelKey> {
  return own(map, courseSlug) ? map[courseSlug] : {};
}

/**
 * Whether a lesson counts for the gate in a course. A course with no saved selection (undefined) uses its full
 * level map. Once an owner saves a selection, only the selected lessons count; the others are not gated.
 */
export function isSelectedForGate(selected: ReadonlySet<string> | undefined, sourceId: string): boolean {
  return selected === undefined || selected.has(sourceId);
}

/** Same question selection as the knowledge-check attempt route. Zero means the lesson has no check to pass. */
export function knowledgeCheckCount(body: unknown): number {
  if (!body || typeof body !== "object") return 0;
  const record = body as Record<string, unknown>;
  const questions = Array.isArray(record.knowledgeChecks)
    ? record.knowledgeChecks
    : Array.isArray(record.knowledgeCheck)
      ? record.knowledgeCheck
      : [];
  return questions.length;
}

export const lessonKey = (lessonId: string, revisionId: string): string => `${lessonId}:${revisionId}`;

/** One lesson revision the learner is assigned through an enrolled course, placed in a level by that course's map. */
export interface GateLesson {
  lessonId: string;
  revisionId: string;
  sourceId: string;
  title: string;
  courseSlug: string;
  level: LevelKey;
  knowledgeChecks: number;
}

/** Learner facts keyed by lessonKey. `passed` holds lessons with at least one passed attempt on that revision. */
export interface LessonFacts {
  completed: Set<string>;
  passed: Set<string>;
}

export type LevelStatus = "locked" | "in_progress" | "finished";

export interface LevelSummary {
  level: LevelKey;
  status: LevelStatus;
  finished: boolean;
  unlocked: boolean;
  /** The earliest level that is not finished, when this level is locked. */
  waitingOn: LevelKey | null;
  /** Plain-language reason, present only when the level is locked. */
  reason: string | null;
  lessonCount: number;
  completedCount: number;
  knowledgeCheckLessons: number;
  knowledgeChecksPassed: number;
}

export interface LevelLock {
  level: LevelKey;
  waitingOn: LevelKey;
  reason: string;
}

const isLessonDone = (lesson: GateLesson, facts: LessonFacts): boolean => {
  const key = lessonKey(lesson.lessonId, lesson.revisionId);
  if (!facts.completed.has(key)) return false;
  return lesson.knowledgeChecks === 0 || facts.passed.has(key);
};

/**
 * Summaries for base, group and specialised. A level with no assigned lessons is finished
 * (nothing is outstanding). Unlocking is a chain: a level is unlocked only when every earlier level is finished.
 */
export function summariseLevels(lessons: GateLesson[], facts: LessonFacts): LevelSummary[] {
  const finishedByLevel = new Map<LevelKey, boolean>();
  const summaries: LevelSummary[] = [];
  LEVEL_ORDER.forEach((level, index) => {
    const inLevel = lessons.filter((lesson) => lesson.level === level);
    const finished = inLevel.every((lesson) => isLessonDone(lesson, facts));
    finishedByLevel.set(level, finished);
    const earlier = LEVEL_ORDER.slice(0, index);
    const unlocked = earlier.every((previous) => finishedByLevel.get(previous) === true);
    const waitingOn = unlocked ? null : (earlier.find((previous) => finishedByLevel.get(previous) !== true) ?? null);
    const withChecks = inLevel.filter((lesson) => lesson.knowledgeChecks > 0);
    summaries.push({
      level,
      status: !unlocked ? "locked" : finished ? "finished" : "in_progress",
      finished,
      unlocked,
      waitingOn,
      reason: waitingOn ? `The ${level} level is locked until the ${waitingOn} level is finished.` : null,
      lessonCount: inLevel.length,
      completedCount: inLevel.filter((lesson) => facts.completed.has(lessonKey(lesson.lessonId, lesson.revisionId))).length,
      knowledgeCheckLessons: withChecks.length,
      knowledgeChecksPassed: withChecks.filter((lesson) => facts.passed.has(lessonKey(lesson.lessonId, lesson.revisionId))).length,
    });
  });
  return summaries;
}

/** The lock on a level for this learner, or null when it is unlocked. */
export function lockForLevel(level: LevelKey, summaries: LevelSummary[]): LevelLock | null {
  const summary = summaries.find((item) => item.level === level);
  if (!summary || summary.unlocked || !summary.waitingOn) return null;
  return { level, waitingOn: summary.waitingOn, reason: summary.reason ?? `The ${level} level is locked.` };
}

/**
 * Levels the AI workforce may receive knowledge for: finished, reachable through finished earlier levels,
 * and holding at least one lesson assigned to the learner. A level with no assigned lessons is never
 * readable here, because competencies are not bound to the learner's courses.
 */
export function agentReadableLevels(summaries: LevelSummary[]): Set<LevelKey> {
  return new Set(summaries.filter((summary) => summary.finished && summary.unlocked && summary.lessonCount > 0).map((summary) => summary.level));
}
