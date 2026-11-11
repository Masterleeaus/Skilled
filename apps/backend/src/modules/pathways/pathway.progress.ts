/**
 * Pure pathway progress calculation (PASS42).
 *
 * A pathway has three kinds of item:
 * - MODULE: a base module, required. Complete when every base lesson delivered to the learner is completed.
 * - COURSE: a course row, required or optional. Complete when the learner's Enrollment is COMPLETED.
 * - SERVICE: the learner-chosen service course slot, always optional. Never counted.
 *
 * Percentage and status count required items only.
 */

export type PathwayItemKind = "MODULE" | "COURSE" | "SERVICE";

export type PathwayItemState = "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED" | "NO_LESSONS" | "OPTIONAL";

export type PathwayProgressStatus = "NO_REQUIRED_ITEMS" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface PathwayItemInput {
  key: string;
  kind: PathwayItemKind;
  label: string;
  title: string | null;
  /** Course items only: false when no course with this slug exists. Null for other kinds. */
  inCatalogue: boolean | null;
  required: boolean;
  state: PathwayItemState;
  lessonsCompleted: number | null;
  lessonsTotal: number | null;
}

export interface PathwayProgress {
  requiredTotal: number;
  requiredCompleted: number;
  percentage: number;
  status: PathwayProgressStatus;
  items: PathwayItemInput[];
}

/** Module state from base lessons delivered to the learner through their enrolled courses. */
export function moduleState(lessonsCompleted: number, lessonsTotal: number): PathwayItemState {
  if (lessonsTotal === 0) return "NO_LESSONS";
  if (lessonsCompleted >= lessonsTotal) return "COMPLETED";
  if (lessonsCompleted > 0) return "IN_PROGRESS";
  return "NOT_STARTED";
}

/** Course state from the learner's Enrollment for that course. CANCELLED is passed in as null. */
export function courseState(enrolmentStatus: "ACTIVE" | "COMPLETED" | null): PathwayItemState {
  if (enrolmentStatus === "COMPLETED") return "COMPLETED";
  if (enrolmentStatus === "ACTIVE") return "IN_PROGRESS";
  return "NOT_STARTED";
}

export function computePathwayProgress(items: PathwayItemInput[]): PathwayProgress {
  const required = items.filter((item) => item.required);
  const requiredCompleted = required.filter((item) => item.state === "COMPLETED").length;
  const requiredStarted = required.some((item) => item.state === "COMPLETED" || item.state === "IN_PROGRESS");

  let status: PathwayProgressStatus;
  if (required.length === 0) status = "NO_REQUIRED_ITEMS";
  else if (requiredCompleted === required.length) status = "COMPLETED";
  else if (requiredStarted) status = "IN_PROGRESS";
  else status = "NOT_STARTED";

  return {
    requiredTotal: required.length,
    requiredCompleted,
    percentage: required.length === 0 ? 0 : Math.round((requiredCompleted * 100) / required.length),
    status,
    items,
  };
}
