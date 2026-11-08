/**
 * File-backed lesson loader. Reads lesson JSON from the curriculum folder at runtime, on first use, and keeps
 * the index in memory for the life of the process. Nothing is read from the frontend bundle or from build output.
 *
 * Root: env CURRICULUM_DIR, else the repo's curriculum/ folder (five levels above this file, in src or dist).
 *
 * What is indexed:
 * - <root>/courses/<course>/*.json (one level, as the lesson authoring contract describes)
 * - <root>/shared/**\/*.json (shared lessons, which course level maps and placements reference)
 * Never indexed: curriculum/assessments (answer keys are loaded into the database by prisma/load-knowledge-answer-keys.ts),
 * research, planning and report files.
 *
 * Rules for each file: must parse as a JSON object with a string `id` and an array `courseSlugs`. Otherwise the file is
 * skipped and logged. An id that appears in more than one file is refused entirely (both files are dropped and logged),
 * so one lesson can never be served from an ambiguous source.
 *
 * Serving is NOT decided here. The route serves an indexed lesson only when a published placement in one of the
 * learner's enrolled courses lists it. Being in the index alone grants nothing.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

export interface FileLesson {
  id: string;
  title: string;
  courseSlugs: string[];
  file: string;
  /** Learner-visible lesson content: every top-level field except the metadata below. Answer keys are not removed here. */
  body: Record<string, unknown>;
}

// Top-level fields that describe the lesson rather than its content. Same set as scripts/build-embedded-lessons.mjs used.
const METADATA_KEYS = new Set(["id", "title", "courseSlugs", "moduleTitle", "lessonType", "status", "reviewStatus"]);

export function curriculumRoot(): string {
  return env.CURRICULUM_DIR || path.resolve(__dirname, "../../../../../curriculum");
}

async function jsonFilesIn(dir: string, recursive: boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const found: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && recursive) found.push(...(await jsonFilesIn(full, true)));
    else if (entry.isFile() && entry.name.endsWith(".json")) found.push(full);
  }
  return found.sort();
}

async function listLessonFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  // courses/<course>/*.json: one level below each course folder.
  // A missing folder is logged, because every lesson would otherwise answer 404 with no clue why.
  const courseDirs = await readdir(path.join(root, "courses"), { withFileTypes: true }).catch((error: unknown) => {
    logger.warn(`Curriculum courses folder not readable at ${root}: ${(error as Error).message}`);
    return [];
  });
  for (const dir of courseDirs) {
    if (dir.isDirectory()) files.push(...(await jsonFilesIn(path.join(root, "courses", dir.name), false)));
  }
  // shared/**: read recursively.
  files.push(...(await jsonFilesIn(path.join(root, "shared"), true).catch((error: unknown) => {
    logger.warn(`Curriculum shared folder not readable at ${root}: ${(error as Error).message}`);
    return [] as string[];
  })));
  return files;
}

export async function buildFileLessonIndex(root: string = curriculumRoot()): Promise<Map<string, FileLesson>> {
  const index = new Map<string, FileLesson>();
  const duplicates = new Set<string>();
  for (const file of await listLessonFiles(root)) {
    const relative = path.relative(root, file);
    let record: unknown;
    try {
      record = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      logger.warn(`Curriculum file skipped (not valid JSON): ${relative} (${(error as Error).message})`);
      continue;
    }
    if (!record || typeof record !== "object" || Array.isArray(record)) continue;
    const item = record as Record<string, unknown>;
    if (typeof item.id !== "string" || item.id.trim() === "" || !Array.isArray(item.courseSlugs)) continue;
    if (index.has(item.id) || duplicates.has(item.id)) {
      logger.error(`Curriculum lesson id ${item.id} appears in more than one file; both are refused (${index.get(item.id)?.file ?? "earlier file"}, ${relative})`);
      index.delete(item.id);
      duplicates.add(item.id);
      continue;
    }
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(item)) if (!METADATA_KEYS.has(key)) body[key] = value;
    index.set(item.id, { id: item.id, title: typeof item.title === "string" ? item.title : "", courseSlugs: item.courseSlugs as string[], file: relative, body });
  }
  return index;
}

let cached: Promise<Map<string, FileLesson>> | null = null;

/** The lesson index for this process. Built once, on first use. A failed build is not cached, so it is retried. */
export function getFileLessonIndex(): Promise<Map<string, FileLesson>> {
  if (!cached) {
    cached = buildFileLessonIndex().catch((error: unknown) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}

export async function getFileLesson(lessonId: string): Promise<FileLesson | null> {
  return (await getFileLessonIndex()).get(lessonId) ?? null;
}

/** Forget the cached index so the next call re-reads the files. Used after a superadmin edit and by tests. */
export function resetFileLessonIndex(): void {
  cached = null;
}

/** Test hook: forget the cached index so the next call re-reads the files. */
export const resetFileLessonIndexForTests = resetFileLessonIndex;
