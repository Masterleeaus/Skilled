/**
 * In-memory keyword retrieval store over the shared platform curriculum. Implements the runtime's
 * RetrievalStore (apps/backend/src/ai-runtime/retrieval.ts).
 *
 * Tenant rule: the curriculum is shared platform-wide, so every chunk is owned by PLATFORM_CURRICULUM_COMPANY_ID.
 * findCandidates() accepts only that id and throws for any other id, including a learner's company id.
 *
 * Source rule: only <root>/courses and <root>/shared are read. The root is injected. Nothing outside it is opened,
 * symlinks are skipped, and retired/, superseded/ and archive/ folders are never entered. See CHANGES.md.
 */
import { lstatSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { requireCompanyId } from '../../ai-runtime/company.js';
import { MIN_TERM_LENGTH, type ChunkCandidate, type DocumentMetadata, type RetrievalStore, type RetrievalStoreQuery } from '../../ai-runtime/retrieval.js';
import { AiRuntimeError, type CompanyId } from '../../ai-runtime/types.js';
import { chunkLesson, documentIdForLesson, LESSON_DOC_TYPE, parseLesson, type ParsedLesson } from './chunker.js';

/**
 * Owner id of every curriculum chunk. Platform-level content, not a tenant. It must never be assigned to a learner
 * company (the company registry has to reserve it; that is not enforced in this folder).
 */
export const PLATFORM_CURRICULUM_COMPANY_ID: CompanyId = 'platform-curriculum';

/** Curriculum subfolders that are read. Anything else under the root is ignored. */
export const CURRICULUM_SCAN_FOLDERS = ['courses', 'shared'] as const;

/** Folder names never entered, at any depth below a scan folder. */
const SKIPPED_FOLDER_NAMES = new Set(['retired', 'superseded', 'archive']);

export interface CurriculumIndexOptions {
  /** Folder that holds courses/ and shared/. Required. Resolved to an absolute path. */
  curriculumRoot: string;
  /** Include lessons whose status is DRAFT. Default false. READY lessons are always included. */
  includeDrafts?: boolean;
  /**
   * Must be exactly true to build this index. It reads lesson text from the raw files, which is not the approved
   * content (the published revision is). The learner route never sets it; it uses published-index.ts. This switch is
   * for offline reports and fixtures only, and the default is refusal.
   */
  allowRawFileIndex?: boolean;
}

export interface CurriculumIndexReport {
  root: string;
  json_files_seen: number;
  lessons_indexed: number;
  lessons_excluded_draft: number;
  lessons_excluded_other_status: number;
  lessons_excluded_retired: number;
  lessons_without_text: number;
  non_lesson_json_skipped: number;
  assessment_files_skipped: number;
  folders_skipped: number;
  symlinks_skipped: number;
  chunks: number;
}

export interface CurriculumRetrievalStore extends RetrievalStore {
  readonly report: CurriculumIndexReport;
}

export interface IndexedChunk {
  candidate: ChunkCandidate;
  /** Lower-cased chunk text, computed once at build time for case-insensitive matching. */
  lower: string;
}

export function indexChunk(candidate: ChunkCandidate): IndexedChunk {
  return { candidate, lower: candidate.content.toLowerCase() };
}

/**
 * Keyword store over a fixed set of chunks. Owns the tenant guard: only PLATFORM_CURRICULUM_COMPANY_ID is served.
 * Shared by the raw-file index (opt-in only) and the published-revision index used by the learner route.
 */
export function createPlatformChunkStore(chunks: readonly IndexedChunk[]): RetrievalStore {
  return {
    async findCandidates(query: RetrievalStoreQuery): Promise<ChunkCandidate[]> {
      // Throws company_id_required / company_id_invalid for a missing or malformed id.
      const companyId = requireCompanyId(query?.companyId);
      if (companyId !== PLATFORM_CURRICULUM_COMPANY_ID) {
        throw new AiRuntimeError('input_invalid', 'the curriculum store serves only PLATFORM_CURRICULUM_COMPANY_ID');
      }

      const limit = Math.floor(Number(query.limit));
      if (!Number.isFinite(limit) || limit < 1) return [];

      const terms = (Array.isArray(query.terms) ? query.terms : [])
        .filter((term): term is string => typeof term === 'string')
        .map((term) => term.trim().toLowerCase())
        .filter((term) => [...term].length >= MIN_TERM_LENGTH);
      if (terms.length === 0) return [];

      // Filter first, then limit. Results keep index order (file path, then chunk index), never recency.
      const matches: ChunkCandidate[] = [];
      for (const chunk of chunks) {
        if (terms.some((term) => chunk.lower.includes(term))) {
          matches.push(chunk.candidate);
          if (matches.length >= limit) break;
        }
      }
      return matches;
    },
  };
}

function isDirectory(target: string, follow: boolean): boolean {
  try {
    return (follow ? statSync(target) : lstatSync(target)).isDirectory();
  } catch {
    return false;
  }
}

function configError(message: string): AiRuntimeError {
  return new AiRuntimeError('config_invalid', message);
}

/** Lists .json files under one scan folder, in sorted order. Skips symlinks, assessment files and skipped folders. */
function collectJsonFiles(root: string, relDir: string, report: CurriculumIndexReport, out: string[]): void {
  const dir = path.join(root, relDir);
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const rel = path.posix.join(relDir, entry.name);
    if (entry.isSymbolicLink()) {
      report.symlinks_skipped++;
    } else if (entry.isDirectory()) {
      if (SKIPPED_FOLDER_NAMES.has(entry.name.toLowerCase())) {
        report.folders_skipped++;
      } else {
        collectJsonFiles(root, rel, report, out);
      }
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      if (entry.name.endsWith('.assessment.json')) {
        // Assessor-only answers and rationales. Never indexed.
        report.assessment_files_skipped++;
      } else {
        out.push(rel);
      }
    }
  }
}

/**
 * Reads the curriculum folder once and builds the in-memory index. Throws AiRuntimeError('config_invalid') when the
 * root or a scan folder is missing, or when a JSON file cannot be parsed. Throws Error on duplicate lesson ids,
 * duplicate document ids, or a lesson with no title.
 */
export function createCurriculumRetrievalStore(options: CurriculumIndexOptions): CurriculumRetrievalStore {
  // Refused before any file is opened unless the caller opts in. Learner retrieval uses published revisions only.
  if (options?.allowRawFileIndex !== true) {
    throw configError('raw file indexing is disabled: learner retrieval must use the published revision store (published-index.ts)');
  }
  if (typeof options?.curriculumRoot !== 'string' || options.curriculumRoot.trim() === '') {
    throw configError('curriculumRoot is required');
  }
  const root = path.resolve(options.curriculumRoot);
  if (!isDirectory(root, true)) throw configError(`curriculum folder not found: ${root}`);
  for (const folder of CURRICULUM_SCAN_FOLDERS) {
    // lstat: a scan folder that is itself a symlink could point outside the root, so it is refused.
    if (!isDirectory(path.join(root, folder), false)) throw configError(`curriculum folder missing or not a real directory: ${folder}`);
  }

  const includeDrafts = options.includeDrafts === true;
  const report: CurriculumIndexReport = {
    root,
    json_files_seen: 0,
    lessons_indexed: 0,
    lessons_excluded_draft: 0,
    lessons_excluded_other_status: 0,
    lessons_excluded_retired: 0,
    lessons_without_text: 0,
    non_lesson_json_skipped: 0,
    assessment_files_skipped: 0,
    folders_skipped: 0,
    symlinks_skipped: 0,
    chunks: 0,
  };

  const files: string[] = [];
  for (const folder of CURRICULUM_SCAN_FOLDERS) collectJsonFiles(root, folder, report, files);
  files.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const seenLessonIds = new Map<string, string>();
  const seenDocumentIds = new Map<number, string>();
  const chunks: IndexedChunk[] = [];

  for (const rel of files) {
    report.json_files_seen++;
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(path.join(root, rel), 'utf8'));
    } catch (error) {
      throw configError(`curriculum file is not valid JSON: ${rel} (${(error as Error).message})`);
    }

    const lesson: ParsedLesson | null = parseLesson(raw, rel);
    if (lesson === null) {
      report.non_lesson_json_skipped++;
      continue;
    }

    const previous = seenLessonIds.get(lesson.lessonId);
    if (previous !== undefined) throw configError(`duplicate lesson id ${lesson.lessonId}: ${previous} and ${rel}`);
    seenLessonIds.set(lesson.lessonId, rel);

    if (lesson.retired) {
      report.lessons_excluded_retired++;
      continue;
    }
    if (lesson.status === 'DRAFT') {
      if (!includeDrafts) {
        report.lessons_excluded_draft++;
        continue;
      }
    } else if (lesson.status !== 'READY') {
      // Allow-list: anything other than READY or DRAFT (including a missing status) is excluded.
      report.lessons_excluded_other_status++;
      continue;
    }

    const lessonChunks = chunkLesson(lesson);
    if (lessonChunks.length === 0) {
      report.lessons_without_text++;
      continue;
    }

    const documentId = documentIdForLesson(lesson.lessonId);
    const owner = seenDocumentIds.get(documentId);
    if (owner !== undefined && owner !== lesson.lessonId) {
      throw configError(`document id collision between ${owner} and ${lesson.lessonId}`);
    }
    seenDocumentIds.set(documentId, lesson.lessonId);

    const document: DocumentMetadata = Object.freeze({
      title: lesson.title,
      doc_type: LESSON_DOC_TYPE,
      authority_level: null,
      jurisdiction: null,
      is_superseded: false,
      preferred_weight: 0,
      source: rel,
    });

    for (const chunk of lessonChunks) {
      const candidate: ChunkCandidate = Object.freeze({
        company_id: PLATFORM_CURRICULUM_COMPANY_ID,
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        content: chunk.text,
        document,
      });
      chunks.push({ candidate, lower: chunk.text.toLowerCase() });
    }
    report.lessons_indexed++;
    report.chunks += lessonChunks.length;
  }

  return Object.freeze({
    report: Object.freeze(report),
    findCandidates: createPlatformChunkStore(chunks).findCandidates,
  });
}
