/**
 * Superadmin lesson editing. Reads and writes the lesson JSON files that the file-backed loader serves.
 *
 * Rules:
 * - Only the ADMIN role reaches this code (the route checks it).
 * - Reads go to disk, not the in-memory index, so the editor always sees the file as it is now.
 * - Writes need the SHA-256 of the file as the editor loaded it (expectedHash). A changed file is refused with 409,
 *   so an edit can never overwrite a change made by someone else.
 * - Protected keys (id, course membership, lesson type, status history, knowledge checks and the title) cannot be
 *   changed here. Knowledge checks are graded against the database revision, so editing them would break grading.
 *   The title is held in the database, so changing it here would make the outline and the file disagree.
 * - Writes are serialised in this process and replace the file atomically (temp file, then rename).
 * - Every write is recorded in the audit log with the changed keys and the before and after hashes, not the content.
 */
import { createHash, randomBytes } from "node:crypto";
import { readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError, NotFoundError } from "../../utils/AppError";
import { recordAuditLog } from "../audit/audit.service";
import { curriculumRoot, getFileLessonIndex, resetFileLessonIndex } from "./file-lesson-loader";

export const LESSON_STATUSES = ["DRAFT", "READY"] as const;
export type LessonStatus = (typeof LESSON_STATUSES)[number];

function isLessonStatus(value: unknown): value is LessonStatus {
  return typeof value === "string" && (LESSON_STATUSES as readonly string[]).includes(value);
}

const PROTECTED_KEYS = new Set(["id", "title", "courseSlugs", "lessonType", "reviewStatus", "knowledgeChecks", "knowledgeCheck"]);
const MAX_SOURCE_BYTES = 300_000;

export function sourceHashOf(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function resolveLessonPath(relative: string): string {
  const root = path.resolve(curriculumRoot());
  const full = path.resolve(root, relative);
  if (!full.startsWith(root + path.sep)) throw new AppError("Lesson file is outside the curriculum folder", 500);
  return full;
}

interface LoadedSource {
  relative: string;
  full: string;
  text: string;
  record: Record<string, unknown>;
}

async function loadSource(lessonId: string): Promise<LoadedSource> {
  const indexed = (await getFileLessonIndex()).get(lessonId);
  if (!indexed) throw new NotFoundError("Lesson");
  const full = resolveLessonPath(indexed.file);
  const text = await readFile(full, "utf8");
  let record: unknown;
  try {
    record = JSON.parse(text);
  } catch {
    throw new AppError("Lesson file is not valid JSON and cannot be edited until it is repaired", 500);
  }
  if (!record || typeof record !== "object" || Array.isArray(record)) throw new AppError("Lesson file is not a JSON object", 500);
  return { relative: indexed.file, full, text, record: record as Record<string, unknown> };
}

export interface LessonListRow {
  id: string;
  title: string;
  status: string;
  moduleTitle: string | null;
  lessonType: string | null;
  file: string;
}

/** Every lesson file that lists this course slug, with its status. Read from disk. */
export async function listCourseLessonSources(courseSlug: string): Promise<LessonListRow[]> {
  const index = await getFileLessonIndex();
  const rows: LessonListRow[] = [];
  for (const lesson of index.values()) {
    if (!lesson.courseSlugs.includes(courseSlug)) continue;
    const { record } = await loadSource(lesson.id);
    rows.push({
      id: lesson.id,
      title: typeof record.title === "string" ? record.title : lesson.title,
      status: typeof record.status === "string" ? record.status : "DRAFT",
      moduleTitle: typeof record.moduleTitle === "string" ? record.moduleTitle : null,
      lessonType: typeof record.lessonType === "string" ? record.lessonType : null,
      file: lesson.file,
    });
  }
  return rows.sort((a, b) => a.file.localeCompare(b.file));
}

export async function readLessonSource(lessonId: string) {
  const source = await loadSource(lessonId);
  return {
    id: lessonId,
    file: source.relative,
    sourceHash: sourceHashOf(source.text),
    status: typeof source.record.status === "string" ? source.record.status : "DRAFT",
    record: source.record,
  };
}

export interface LessonSourceUpdate {
  lessonId: string;
  actorId: string;
  expectedHash: string;
  changes?: Record<string, unknown>;
  status?: LessonStatus;
}

let writeQueue: Promise<unknown> = Promise.resolve();

export function updateLessonSource(input: LessonSourceUpdate): Promise<{ sourceHash: string; status: string; changedKeys: string[] }> {
  const run = writeQueue.then(() => applyUpdate(input));
  writeQueue = run.catch(() => undefined);
  return run;
}

async function applyUpdate(input: LessonSourceUpdate) {
  const source = await loadSource(input.lessonId);
  const beforeHash = sourceHashOf(source.text);
  if (beforeHash !== input.expectedHash) {
    throw new AppError("This lesson changed since you opened it. Reload it, then apply your edit again.", 409);
  }

  const next: Record<string, unknown> = { ...source.record };
  const changed: string[] = [];

  for (const [key, value] of Object.entries(input.changes ?? {})) {
    if (key === "__proto__") throw new AppError(`"${key}" is not a lesson field`, 400);
    if (PROTECTED_KEYS.has(key)) throw new AppError(`"${key}" cannot be edited here`, 400);
    if (value === undefined) continue;
    if (key === "status" && !isLessonStatus(value)) throw new AppError(`"status" must be DRAFT or READY`, 422);
    if (value === null) {
      if (key in next) {
        delete next[key];
        changed.push(key);
      }
      continue;
    }
    if (typeof value !== "string" && typeof value !== "object") throw new AppError(`"${key}" must be text, a list or an object`, 400);
    if (JSON.stringify(next[key]) === JSON.stringify(value)) continue;
    next[key] = value;
    changed.push(key);
  }

  if (input.status !== undefined && next.status !== input.status) {
    next.status = input.status;
    changed.push("status");
  }

  if (changed.length === 0) throw new AppError("Nothing has changed", 400);

  const output = JSON.stringify(next, null, 2) + "\n";
  if (Buffer.byteLength(output, "utf8") > MAX_SOURCE_BYTES) throw new AppError("The lesson is too large to save in one edit", 400);

  const temp = `${source.full}.${randomBytes(6).toString("hex")}.tmp`;
  await writeFile(temp, output, "utf8");
  await rename(temp, source.full);
  resetFileLessonIndex();

  const afterHash = sourceHashOf(output);
  await recordAuditLog({
    userId: input.actorId,
    action: "LESSON_SOURCE_UPDATED",
    entity: "CurriculumLessonSource",
    entityId: input.lessonId,
    oldValue: { file: source.relative, sourceHash: beforeHash },
    newValue: { file: source.relative, sourceHash: afterHash, changedKeys: changed },
  });

  return { sourceHash: afterHash, status: String(next.status ?? "DRAFT"), changedKeys: changed };
}
