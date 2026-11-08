import { api } from "@/lib/api-client";

export interface CurriculumRevision { id: string; version: number; status: string; body: Record<string, unknown> }
export interface CurriculumLesson { id: string; sourceId: string; title: string; layer: string; serviceGroup: string | null }
// Level gate (PASS42). A locked lesson is listed with its reason, and its body is withheld.
export type LevelKey = "base" | "group" | "specialised";
export interface LevelLock { level: LevelKey; waitingOn: LevelKey; reason: string }
// Licence track. Non-licensed is the default. Licensed adds the lessons that need a licence. Chosen per course.
export type LicenceTrack = "non-licensed" | "licensed";
export const DEFAULT_LICENCE_TRACK: LicenceTrack = "non-licensed";
// What a learner may see about a lesson's licence position. Only threshold and required lessons carry one.
export interface LicenceNotice { status: "required" | "threshold"; limit: string | null; reason: string | null }
export interface CurriculumPlacement { id: string; position: number; required: boolean; lesson: CurriculumLesson; revision: CurriculumRevision | null; levelLock?: LevelLock | null; licence?: LicenceNotice | null }
export interface LevelSummary {
  level: LevelKey;
  status: "locked" | "in_progress" | "finished";
  finished: boolean;
  unlocked: boolean;
  waitingOn: LevelKey | null;
  reason: string | null;
  lessonCount: number;
  completedCount: number;
  knowledgeCheckLessons: number;
  knowledgeChecksPassed: number;
}
export interface LearnerLevels { levels: LevelSummary[]; ungatedLessonCount: number }
export interface CurriculumTrack { id: string; slug: string; title: string; scope: "UNIVERSAL" | "GROUP" | "VERTICAL"; placements: CurriculumPlacement[] }
export interface CourseTrack { id: string; position: number; required: boolean; track: CurriculumTrack }
export interface CourseOutline { courseId: string; licenceTrack?: LicenceTrack; tracks: CourseTrack[] }
export interface LessonCompletion { id: string; lessonId: string; revisionId: string; completedAt: string }

export async function fetchCurriculumOutline(courseId: string, track: LicenceTrack = DEFAULT_LICENCE_TRACK): Promise<CourseOutline> {
  const { data } = await api.get(`/academy/curriculum/courses/${encodeURIComponent(courseId)}/outline`, { params: { track } });
  return data.data;
}
// Counts and the excluded lessons per licence track, shown before enrolment. Titles and licence wording only.
export interface LicenceTrackSummary {
  courseId: string;
  defaultTrack: LicenceTrack;
  lessonCount: number;
  counts: Record<LicenceTrack, number>;
  needsLicence: Array<{ title: string; reason: string }>;
  limited: Array<{ title: string; limit: string }>;
}
export async function fetchLicenceTrackSummary(courseId: string): Promise<LicenceTrackSummary> {
  const { data } = await api.get(`/academy/curriculum/courses/${encodeURIComponent(courseId)}/licence-tracks`);
  return data.data;
}
// Server-calculated learner progress for one course. Acknowledgement only; not a competency or certificate.
export interface AcademyCourseProgressLesson { lessonId: string; revisionId: string; sourceId: string; title: string; required: boolean; completed: boolean; completedAt: string | null }
export interface AcademyCourseProgress {
  courseId: string;
  lessonCount: number;
  completedCount: number;
  completionPercent: number;
  required: { total: number; completed: number };
  optional: { total: number; completed: number };
  lessons: AcademyCourseProgressLesson[];
}
function isCourseProgress(value: unknown): value is AcademyCourseProgress {
  const v = value as Partial<AcademyCourseProgress> | null;
  return Boolean(
    v && typeof v === "object" && Array.isArray(v.lessons) &&
    typeof v.lessonCount === "number" && typeof v.completedCount === "number" && typeof v.completionPercent === "number" &&
    typeof v.required?.total === "number" && typeof v.required?.completed === "number" &&
    typeof v.optional?.total === "number" && typeof v.optional?.completed === "number",
  );
}
export async function fetchAcademyCourseProgress(courseId: string, track: LicenceTrack = DEFAULT_LICENCE_TRACK): Promise<AcademyCourseProgress> {
  const { data } = await api.get(`/academy/curriculum/courses/${encodeURIComponent(courseId)}/progress/me`, { params: { track } });
  // A malformed body is an error, so the player falls back to outline counts instead of rendering it.
  if (!isCourseProgress(data.data)) throw new Error("Unexpected course progress response");
  return data.data;
}
// The caller's own level status across every enrolled course. Shows why a level is locked.
export async function fetchMyLevels(): Promise<LearnerLevels> {
  const { data } = await api.get("/academy/curriculum/levels/me");
  const value = data.data as Partial<LearnerLevels> | null;
  if (!value || !Array.isArray(value.levels)) throw new Error("Unexpected level status response");
  return value as LearnerLevels;
}
// Lesson text for one lesson. Served only to enrolled learners who may open the lesson; 403 carries the reason.
export async function fetchCurriculumLessonBody(courseId: string, sourceId: string, track: LicenceTrack = DEFAULT_LICENCE_TRACK): Promise<Record<string, unknown>> {
  const { data } = await api.get(`/academy/curriculum/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(sourceId)}/body`, { params: { track } });
  return data.data;
}
export async function fetchMyCurriculumCompletions(): Promise<LessonCompletion[]> {
  const { data } = await api.get("/academy/curriculum/completions/me");
  return data.data;
}
export async function acknowledgeCurriculumLesson(lessonId: string, revisionId: string): Promise<LessonCompletion> {
  const { data } = await api.post("/academy/curriculum/completions", { lessonId, revisionId });
  return data.data;
}

export interface KnowledgeAttempt { id: string; score: number; total: number; passed: boolean; createdAt: string }
export async function submitKnowledgeCheck(lessonId: string, revisionId: string, answers: number[]): Promise<KnowledgeAttempt> {
  const { data } = await api.post("/academy/curriculum/knowledge-checks/attempts", { lessonId, revisionId, answers });
  return data.data;
}

// Learner-scoped organisation context and immutable presentation history.
export interface AcademyMembership { companyId: string; role?: string; company: { id: string; name: string } }
export interface LessonContextSnapshot { contextSnapshotId: string; lessonRevisionId: string; presentedAt: string; contentHash: string }
export interface LessonContextPage { items: LessonContextSnapshot[]; nextCursor: string | null }
export interface LessonContextDetail extends LessonContextSnapshot { companyId: string; body: Record<string, unknown> }
export async function fetchAcademyMemberships(): Promise<AcademyMembership[]> {
  const { data } = await api.get("/academy/curriculum/companies/me");
  return data.data;
}
export async function presentContextLesson(companyId: string, revisionId: string): Promise<LessonContextDetail> {
  const { data } = await api.post(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/lessons/${encodeURIComponent(revisionId)}/context`);
  return data.data;
}
export async function fetchContextHistory(companyId: string, revisionId: string, cursor?: string): Promise<LessonContextPage> {
  const { data } = await api.get(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/lesson-context-snapshots`, { params: { revisionId, limit: 20, ...(cursor ? { cursor } : {}) } });
  return data.data;
}
export async function fetchContextSnapshot(companyId: string, snapshotId: string): Promise<LessonContextDetail> {
  const { data } = await api.get(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/lesson-context-snapshots/${encodeURIComponent(snapshotId)}`);
  return data.data;
}

// Manager-only configuration: server independently enforces organisation role.
export interface BusinessField { fieldKey: string; value: string | number | boolean | string[]; status: "DRAFT" | "APPROVED" | "RETIRED"; revision: number; sourceSystem?: string | null; updatedAt: string }
export async function fetchBusinessFieldRegistry(): Promise<string[]> {
  const { data } = await api.get("/academy/curriculum/business-fields/registry");
  return data.data.keys;
}
export async function fetchOrganisationBusinessFields(companyId: string): Promise<BusinessField[]> {
  const { data } = await api.get(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/business-fields`);
  return data.data;
}
export async function saveOrganisationBusinessField(companyId: string, fieldKey: string, value: BusinessField["value"]): Promise<BusinessField> {
  const { data } = await api.put(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/business-fields/${encodeURIComponent(fieldKey)}`, { value });
  return data.data;
}
export async function approveOrganisationBusinessField(companyId: string, fieldKey: string): Promise<void> {
  await api.post(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/business-fields/${encodeURIComponent(fieldKey)}/approve`);
}
export async function retireOrganisationBusinessField(companyId: string, fieldKey: string): Promise<void> {
  await api.post(`/academy/curriculum/companies/${encodeURIComponent(companyId)}/business-fields/${encodeURIComponent(fieldKey)}/retire`);
}
