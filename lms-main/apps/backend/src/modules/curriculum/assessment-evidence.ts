/**
 * ACA-012 / ACA-013: evidence mapping for practical assessments and the guard
 * that allows a verified competency to be awarded only from approved evidence.
 *
 * Pure functions only. The curriculum routes call the guard; the report builder
 * is used by apps/backend/scripts/assessment-evidence-report.ts and its tests.
 */
import { ForbiddenError } from "../../utils/AppError";

/** The subset of a curriculum assessment file (curriculum/assessments/*.assessment.json) used here. */
export interface AssessmentSpec {
  lessonId: string;
  knowledgeAnswers?: unknown[];
  practicalCriteria?: string[];
  evidenceRequired?: string[];
  passRule?: string;
}

export interface EvidenceType {
  /** Stable key derived from the label, so the same evidence line maps to the same type across runs. */
  key: string;
  label: string;
}

export interface LessonEvidenceMapping {
  lessonId: string;
  /** A lesson requires practical evidence when its file lists practical criteria or evidence items. */
  requiresPracticalEvidence: boolean;
  evidenceTypes: EvidenceType[];
  /** True when the lesson requires practical evidence but no evidence type is listed. */
  gap: boolean;
}

export interface CourseEvidenceStatus {
  courseSlug: string;
  requiredLessons: number;
  lessonsRequiringEvidence: number;
  gapLessonIds: string[];
  missingAssessmentLessonIds: string[];
  /** Complete means every required lesson that needs practical evidence has at least one evidence type. */
  complete: boolean;
}

export function evidenceTypeKey(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function mapLessonEvidence(spec: AssessmentSpec): LessonEvidenceMapping {
  const criteria = (spec.practicalCriteria ?? []).filter(item => item.trim());
  const labels = (spec.evidenceRequired ?? []).map(item => item.trim()).filter(Boolean);
  const requiresPracticalEvidence = criteria.length > 0 || labels.length > 0;
  const seen = new Set<string>();
  const evidenceTypes: EvidenceType[] = [];
  for (const label of labels) {
    const key = evidenceTypeKey(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    evidenceTypes.push({ key, label });
  }
  return {
    lessonId: spec.lessonId,
    requiresPracticalEvidence,
    evidenceTypes,
    gap: requiresPracticalEvidence && evidenceTypes.length === 0,
  };
}

/** Course status across its required lessons. Lessons with no assessment file are reported, not silently skipped. */
export function courseEvidenceStatus(courseSlug: string, lessonIds: string[], specs: Map<string, AssessmentSpec>): CourseEvidenceStatus {
  const missingAssessmentLessonIds: string[] = [];
  const gapLessonIds: string[] = [];
  let lessonsRequiringEvidence = 0;
  for (const lessonId of lessonIds) {
    const spec = specs.get(lessonId);
    if (!spec) { missingAssessmentLessonIds.push(lessonId); continue; }
    const mapping = mapLessonEvidence(spec);
    if (mapping.requiresPracticalEvidence) lessonsRequiringEvidence += 1;
    if (mapping.gap) gapLessonIds.push(lessonId);
  }
  return {
    courseSlug,
    requiredLessons: lessonIds.length,
    lessonsRequiringEvidence,
    gapLessonIds,
    missingAssessmentLessonIds,
    complete: gapLessonIds.length === 0 && missingAssessmentLessonIds.length === 0,
  };
}

export interface EvidenceReport {
  assessmentFiles: number;
  courses: number;
  lessonsRequiringPracticalEvidence: number;
  lessonsWithEvidenceTypes: number;
  lessonsWithoutEvidenceType: string[];
  knowledgeOnlyLessons: number;
  coursesComplete: number;
  coursesWithGaps: { courseSlug: string; gapLessonIds: string[]; missingAssessmentLessonIds: string[] }[];
  courseLessonsWithoutAssessment: string[];
  courseLessonsWithoutKnowledgeChecks: string[];
}

/** Builds the coverage report. courseLessons maps each course slug to the lesson IDs it contains. */
export function buildEvidenceReport(specs: AssessmentSpec[], courseLessons: Record<string, string[]>): EvidenceReport {
  const specById = new Map(specs.map(spec => [spec.lessonId, spec] as const));
  const statuses = Object.entries(courseLessons).map(([slug, lessons]) => courseEvidenceStatus(slug, lessons, specById));
  const uniqueLessons = [...new Set(Object.values(courseLessons).flat())];
  const requiring = uniqueLessons.filter(id => specById.has(id) && mapLessonEvidence(specById.get(id)!).requiresPracticalEvidence);
  const withoutType = requiring.filter(id => mapLessonEvidence(specById.get(id)!).gap);
  const withoutAssessment = uniqueLessons.filter(id => !specById.has(id));
  const withoutKnowledge = uniqueLessons.filter(id => specById.has(id) && (specById.get(id)!.knowledgeAnswers?.length ?? 0) === 0);
  return {
    assessmentFiles: specs.length,
    courses: statuses.length,
    lessonsRequiringPracticalEvidence: requiring.length,
    lessonsWithEvidenceTypes: requiring.length - withoutType.length,
    lessonsWithoutEvidenceType: withoutType.sort(),
    knowledgeOnlyLessons: uniqueLessons.filter(id => specById.has(id) && !requiring.includes(id)).length,
    coursesComplete: statuses.filter(status => status.complete).length,
    coursesWithGaps: statuses
      .filter(status => !status.complete)
      .map(status => ({ courseSlug: status.courseSlug, gapLessonIds: status.gapLessonIds, missingAssessmentLessonIds: status.missingAssessmentLessonIds })),
    courseLessonsWithoutAssessment: withoutAssessment.sort(),
    courseLessonsWithoutKnowledgeChecks: withoutKnowledge.sort(),
  };
}

/** Subset of an AcademyPracticalEvidence row needed to decide whether a competency may be awarded. */
export interface EvidenceForAward {
  id: string;
  learnerId: string;
  status: string;
  assessorId: string | null;
}

/**
 * Throws unless the evidence was approved by the acting assessor and the learner is not that assessor.
 * Called inside the review transaction after the evidence has been marked APPROVED.
 */
export function assertCompetencyAwardable(evidence: EvidenceForAward | null | undefined, assessorId: string): asserts evidence is EvidenceForAward {
  if (!evidence) throw new ForbiddenError("Practical evidence not found");
  if (evidence.status !== "APPROVED") throw new ForbiddenError("Competency requires practical evidence approved by an assessor");
  if (!evidence.assessorId || evidence.assessorId !== assessorId) throw new ForbiddenError("Competency must be awarded by the assessor who approved the evidence");
  if (evidence.learnerId === assessorId) throw new ForbiddenError("An assessor cannot award competency from their own evidence");
}
