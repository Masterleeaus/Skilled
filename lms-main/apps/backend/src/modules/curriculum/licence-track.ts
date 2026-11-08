/**
 * Licence tracks. Every course offers two tracks, chosen by the learner on the course profile page:
 *
 * - non-licensed (default): the lessons for work that can be done without a licence. Lessons whose licence status
 *   is `required` are left out.
 * - licensed: every lesson, including the licence-required ones. It does not grant a licence.
 *
 * Per-lesson status comes from curriculum/licence/lesson-licence.json, keyed by lessonId (the curriculum sourceId).
 * - required: excluded from the non-licensed track; included in the licensed track.
 * - threshold: included in both tracks, with its limit text. Work over the limit needs a licence.
 * - not_required: no licence is needed for this work. Included in both tracks, like not_checked.
 * - not_checked, or no entry at all: included in both tracks.
 *
 * Fail-closed rules: an unknown status is treated as required. If the file cannot be read, the non-licensed track
 * is refused (503) rather than showing lessons that may need a licence. The level gate then keeps its normal rules.
 *
 * The track is saved on the enrolment (enrollment.licenceTrack) when the learner enrols or pays. An enrolled learner always
 * gets the saved track, and a ?track= parameter cannot change it (see resolveLicenceTrack). Staff keep the ?track= preview.
 * Visitors with no enrolment use ?track= on the public course page only.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { logger } from "../../config/logger";
import { AppError, ValidationError } from "../../utils/AppError";
import { curriculumRoot } from "./file-lesson-loader";

export const LICENCE_TRACKS = ["non-licensed", "licensed"] as const;
export type LicenceTrack = (typeof LICENCE_TRACKS)[number];
export const DEFAULT_LICENCE_TRACK: LicenceTrack = "non-licensed";

export type LicenceStatus = "required" | "threshold" | "not_required" | "not_checked";

/** What a learner may see about a lesson's licence position. Internal reviewer notes are never included. */
export interface LicenceNotice {
  status: "required" | "threshold";
  /** The work limit, for threshold lessons. */
  limit: string | null;
  /** Plain-language official wording, or null when none is recorded. */
  reason: string | null;
}

export interface LicenceRecord {
  status: LicenceStatus;
  limit: string | null;
  reason: string | null;
}

export interface LicenceIndex {
  /** False when the licence file could not be read. Callers decide what that means for them. */
  available: boolean;
  records: Map<string, LicenceRecord>;
}

export const LICENCE_EXCLUDED_MESSAGE = "This lesson needs a licence, so it is not part of the Non-licensed track. Switch to the Licensed track to open it.";
const GENERIC_REQUIRED_REASON = "A licence is required for this work.";

const textOrList = z.union([z.string(), z.array(z.string())]).nullish();
const entrySchema = z.object({
  lessonId: z.string().min(1),
  status: z.string(),
  limit: textOrList,
  officialWording: textOrList,
});

/** Official wording can be a list, and may carry provenance markers (for example a WebFetch note). Those are removed. */
const PROVENANCE_NOTE = /\s*\([^()]*(?:WebFetch|verbatim)[^()]*\)/gi;
function learnerText(value: string | string[] | null | undefined): string | null {
  const joined = Array.isArray(value) ? value.join(" ") : (value ?? "");
  const cleaned = joined.replace(PROVENANCE_NOTE, "").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function normaliseStatus(raw: string, lessonId: string): LicenceStatus {
  if (raw === "required" || raw === "threshold" || raw === "not_required" || raw === "not_checked") return raw;
  logger.warn(`Licence status "${raw}" for lesson ${lessonId} is not recognised; treated as required until reviewed`);
  return "required";
}

export function parseLicenceFile(value: unknown): LicenceIndex {
  const lessons = value && typeof value === "object" && Array.isArray((value as { lessons?: unknown }).lessons)
    ? (value as { lessons: unknown[] }).lessons
    : null;
  if (!lessons) throw new Error("lesson-licence.json has no lessons array");
  const records = new Map<string, LicenceRecord>();
  for (const item of lessons) {
    const parsed = entrySchema.safeParse(item);
    if (!parsed.success) {
      logger.warn("Licence entry skipped: it has no lessonId or status");
      continue;
    }
    const entry = parsed.data;
    records.set(entry.lessonId, {
      status: normaliseStatus(entry.status, entry.lessonId),
      limit: learnerText(entry.limit),
      reason: learnerText(entry.officialWording),
    });
  }
  return { available: true, records };
}

let cached: Promise<LicenceIndex> | null = null;

async function loadLicenceIndex(): Promise<LicenceIndex> {
  const file = path.join(curriculumRoot(), "licence", "lesson-licence.json");
  try {
    return parseLicenceFile(JSON.parse(await readFile(file, "utf8")));
  } catch (error) {
    logger.error(`Licence file unavailable at ${file}: ${(error as Error).message}`);
    return { available: false, records: new Map() };
  }
}

/** The licence index for this process. Built once. An unavailable index is not cached, so it is read again. */
export function getLicenceIndex(): Promise<LicenceIndex> {
  if (!cached) {
    cached = loadLicenceIndex().then((index) => {
      if (!index.available) cached = null;
      return index;
    });
  }
  return cached;
}

/** Test hook: forget the cached index so the next call re-reads the file. */
export function resetLicenceIndexForTests(): void {
  cached = null;
}

/**
 * The track named in a request. Missing or empty means the default (non-licensed). Anything else must be a known track.
 */
export function parseLicenceTrack(value: unknown): LicenceTrack {
  if (value === undefined || value === null || value === "") return DEFAULT_LICENCE_TRACK;
  if (typeof value === "string" && (LICENCE_TRACKS as readonly string[]).includes(value)) return value as LicenceTrack;
  throw new ValidationError([{ path: ["track"], message: `track must be one of: ${LICENCE_TRACKS.join(", ")}` }]);
}

export function licenceStatusOf(index: LicenceIndex, sourceId: string): LicenceStatus | null {
  return index.records.get(sourceId)?.status ?? null;
}

/** True when the track leaves this lesson out. Only the non-licensed track excludes, and only `required` lessons. */
export function licenceTrackExcludes(track: LicenceTrack, status: LicenceStatus | null): boolean {
  return track === "non-licensed" && status === "required";
}

/** The track saved on an enrolment. Anything unrecognised reads as the default (non-licensed), the stricter track. */
export function savedLicenceTrack(value: unknown): LicenceTrack {
  return typeof value === "string" && (LICENCE_TRACKS as readonly string[]).includes(value) ? (value as LicenceTrack) : DEFAULT_LICENCE_TRACK;
}

/**
 * The track for a request that has no enrolment to read, or that comes from staff. A ?track= parameter wins when it is
 * sent (an unknown value is refused, 422). Otherwise the saved track applies, or the default for a visitor.
 */
export function requestedLicenceTrack(queryTrack: unknown, savedTrack: unknown): LicenceTrack {
  if (queryTrack === undefined || queryTrack === null || queryTrack === "") return savedLicenceTrack(savedTrack);
  return parseLicenceTrack(queryTrack);
}

/**
 * The track for a learner-facing request (course detail, outline, lesson body, progress).
 * - No enrolment (a visitor on the public course page): ?track= previews the track, as before.
 * - Enrolled learner: the track saved on the enrolment, always. ?track= is ignored, so it cannot unlock a
 *   licence-required lesson or change the outline or progress counts. Nothing is refused for a bad ?track= value.
 * - Enrolled staff (staffPreview): ?track= still previews, as before, and the saved track applies when none is sent.
 */
export function resolveLicenceTrack(input: { queryTrack: unknown; enrolment: { licenceTrack: unknown } | null; staffPreview: boolean }): LicenceTrack {
  if (!input.enrolment) return requestedLicenceTrack(input.queryTrack, undefined);
  if (input.staffPreview) return requestedLicenceTrack(input.queryTrack, input.enrolment.licenceTrack);
  return savedLicenceTrack(input.enrolment.licenceTrack);
}

/** The refusal for a lesson the chosen track leaves out. The body and completion endpoints both answer with it. */
export function licenceTrackExclusionError(track: LicenceTrack): AppError {
  return new AppError(LICENCE_EXCLUDED_MESSAGE, 403, [{ code: "LICENCE_TRACK_EXCLUDED", track }]);
}

/** Throws the LICENCE_TRACK_EXCLUDED refusal when the track leaves this lesson out. */
export function assertLicenceTrackAllows(track: LicenceTrack, status: LicenceStatus | null): void {
  if (licenceTrackExcludes(track, status)) throw licenceTrackExclusionError(track);
}

/** The learner-facing licence position of a lesson, or null when there is nothing to tell them. */
export function licenceNoticeOf(index: LicenceIndex, sourceId: string): LicenceNotice | null {
  const record = index.records.get(sourceId);
  if (!record || (record.status !== "required" && record.status !== "threshold")) return null;
  if (record.status === "threshold") return { status: "threshold", limit: record.limit, reason: record.reason };
  return { status: "required", limit: null, reason: record.reason ?? GENERIC_REQUIRED_REASON };
}

/** A required lesson never gates a level, whichever track is chosen. Other lessons gate as before. */
export function isLicenceOnly(index: LicenceIndex, sourceId: string): boolean {
  return index.available && licenceStatusOf(index, sourceId) === "required";
}

/** Refuses the non-licensed track when the licence file is unavailable. Other tracks pass. */
export async function licenceIndexForTrack(track: LicenceTrack): Promise<LicenceIndex> {
  const index = await getLicenceIndex();
  if (track === "non-licensed" && !index.available) {
    throw new AppError("Licence status is unavailable, so the Non-licensed track cannot be shown right now. Please try again later.", 503);
  }
  return index;
}

export interface LicenceTrackSummary {
  lessonCount: number;
  counts: Record<LicenceTrack, number>;
  /** Lessons the non-licensed track leaves out, each with the reason. */
  needsLicence: Array<{ title: string; reason: string }>;
  /** Lessons in both tracks that carry a work limit. */
  limited: Array<{ title: string; limit: string }>;
}

/** Counts and the excluded list for one course's lessons. Titles and licence wording only, never lesson bodies. */
export function summariseLicenceTracks(lessons: Array<{ sourceId: string; title: string }>, index: LicenceIndex): LicenceTrackSummary {
  const unique = [...new Map(lessons.map((lesson) => [lesson.sourceId, lesson] as const)).values()];
  const needsLicence: LicenceTrackSummary["needsLicence"] = [];
  const limited: LicenceTrackSummary["limited"] = [];
  for (const lesson of unique) {
    const notice = licenceNoticeOf(index, lesson.sourceId);
    if (notice?.status === "required") needsLicence.push({ title: lesson.title, reason: notice.reason ?? GENERIC_REQUIRED_REASON });
    if (notice?.status === "threshold" && notice.limit) limited.push({ title: lesson.title, limit: notice.limit });
  }
  const nonLicensed = unique.filter((lesson) => !licenceTrackExcludes("non-licensed", licenceStatusOf(index, lesson.sourceId))).length;
  return { lessonCount: unique.length, counts: { "non-licensed": nonLicensed, licensed: unique.length }, needsLicence, limited };
}

/** A lesson that may carry a curriculum sourceId. A lesson without one has no licence entry. */
export interface TrackableLesson {
  sourceId?: string | null;
}

export type TrackedLesson<L> = L & { licence: LicenceNotice | null };

/**
 * Applies a licence track to lessons. Excluded lessons are dropped. Each kept lesson gets its learner-facing notice.
 * A lesson with no sourceId has no licence entry, so it is kept on both tracks (the no-entry rule).
 * When the licence index is unavailable, a lesson with a sourceId is treated as required: excluded on the
 * non-licensed track, and shown with the generic licence wording on the licensed track.
 */
export function filterLessonsForTrack<L extends object>(lessons: L[], track: LicenceTrack, index: LicenceIndex): Array<TrackedLesson<L>> {
  const kept: Array<TrackedLesson<L>> = [];
  for (const lesson of lessons) {
    const sourceId = (lesson as TrackableLesson).sourceId;
    if (!sourceId) {
      kept.push({ ...lesson, licence: null });
      continue;
    }
    if (!index.available) {
      if (licenceTrackExcludes(track, "required")) continue;
      kept.push({ ...lesson, licence: { status: "required", limit: null, reason: GENERIC_REQUIRED_REASON } });
      continue;
    }
    if (licenceTrackExcludes(track, licenceStatusOf(index, sourceId))) continue;
    kept.push({ ...lesson, licence: licenceNoticeOf(index, sourceId) });
  }
  return kept;
}

/**
 * Applies a licence track to a course's modules (the legacy course.modules list). Each module keeps its lessons as
 * filterLessonsForTrack returns them. A module whose lessons are all excluded is dropped; a module that was empty
 * to begin with is kept as it was.
 */
export function filterModulesForTrack<M extends { lessons: object[] }>(
  modules: M[],
  track: LicenceTrack,
  index: LicenceIndex,
): Array<Omit<M, "lessons"> & { lessons: Array<TrackedLesson<M["lessons"][number]>> }> {
  const result: Array<Omit<M, "lessons"> & { lessons: Array<TrackedLesson<M["lessons"][number]>> }> = [];
  for (const mod of modules) {
    // filterLessonsForTrack keeps every field of each lesson and only adds `licence`, so the element type is unchanged.
    const lessons = filterLessonsForTrack(mod.lessons, track, index) as Array<TrackedLesson<M["lessons"][number]>>;
    if (lessons.length === 0 && mod.lessons.length > 0) continue;
    result.push({ ...mod, lessons });
  }
  return result;
}
