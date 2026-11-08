/**
 * Keyword index over published lesson revisions. The learner route builds one of these per request, from the
 * revisions the learner may open (see tutor/access/accessible-lessons.ts). Nothing here reads files.
 *
 * Rules:
 * - The input is the revision body, the same object the lesson-body route serves. Raw curriculum files are never read.
 * - body.id must equal the lesson's sourceId. Any other body is skipped.
 * - If one sourceId arrives with two different revision ids, the sourceId is skipped entirely. It is not guessed.
 * - A retired body is skipped. Body status is not used as a gate: the revision status and hash are checked upstream.
 */
import type { ChunkCandidate, RetrievalStore } from '../../ai-runtime/retrieval.js';
import { chunkLesson, documentIdForLesson, LESSON_DOC_TYPE, parseLesson } from './chunker.js';
import { createPlatformChunkStore, indexChunk, PLATFORM_CURRICULUM_COMPANY_ID, type IndexedChunk } from './curriculum-store.js';

export interface PublishedLessonInput {
  /** The lesson's source id, as the learner sees it. */
  sourceId: string;
  /** The published revision the body came from. */
  revisionId: string;
  /** The revision body, already checked against its stored content hash by the caller. */
  body: unknown;
}

export interface PublishedIndexReport {
  lessons_in: number;
  lessons_indexed: number;
  lessons_skipped_unparsed: number;
  lessons_skipped_id_mismatch: number;
  lessons_skipped_retired: number;
  lessons_skipped_revision_conflict: number;
  lessons_without_text: number;
  chunks: number;
}

export interface PublishedLessonStore extends RetrievalStore {
  readonly report: PublishedIndexReport;
}

export function createPublishedLessonStore(lessons: readonly PublishedLessonInput[]): PublishedLessonStore {
  const report: PublishedIndexReport = {
    lessons_in: lessons.length,
    lessons_indexed: 0,
    lessons_skipped_unparsed: 0,
    lessons_skipped_id_mismatch: 0,
    lessons_skipped_retired: 0,
    lessons_skipped_revision_conflict: 0,
    lessons_without_text: 0,
    chunks: 0,
  };

  // First pass: a sourceId that appears with two revisions is dropped whole.
  const revisionsBySource = new Map<string, Set<string>>();
  for (const lesson of lessons) {
    const set = revisionsBySource.get(lesson.sourceId) ?? new Set<string>();
    set.add(lesson.revisionId);
    revisionsBySource.set(lesson.sourceId, set);
  }

  const chunks: IndexedChunk[] = [];
  const seen = new Set<string>();
  for (const lesson of lessons) {
    if (seen.has(lesson.sourceId)) continue;
    seen.add(lesson.sourceId);
    if ((revisionsBySource.get(lesson.sourceId)?.size ?? 0) > 1) {
      report.lessons_skipped_revision_conflict++;
      continue;
    }

    let parsed: ReturnType<typeof parseLesson> = null;
    try {
      parsed = parseLesson(lesson.body, `published:${lesson.sourceId}`);
    } catch {
      // parseLesson throws for a body with no title. That lesson is skipped; the others still index.
      parsed = null;
    }
    if (parsed === null) {
      report.lessons_skipped_unparsed++;
      continue;
    }
    if (parsed.lessonId !== lesson.sourceId) {
      report.lessons_skipped_id_mismatch++;
      continue;
    }
    if (parsed.retired) {
      report.lessons_skipped_retired++;
      continue;
    }

    const lessonChunks = chunkLesson(parsed);
    if (lessonChunks.length === 0) {
      report.lessons_without_text++;
      continue;
    }

    const documentId = documentIdForLesson(lesson.sourceId);
    const document = Object.freeze({
      title: parsed.title,
      doc_type: LESSON_DOC_TYPE,
      authority_level: null,
      jurisdiction: null,
      is_superseded: false,
      preferred_weight: 0,
      source: `published:${lesson.sourceId}`,
    });
    for (const chunk of lessonChunks) {
      const candidate: ChunkCandidate = Object.freeze({
        company_id: PLATFORM_CURRICULUM_COMPANY_ID,
        document_id: documentId,
        chunk_index: chunk.chunkIndex,
        content: chunk.text,
        document,
      });
      chunks.push(indexChunk(candidate));
    }
    report.lessons_indexed++;
    report.chunks += lessonChunks.length;
  }

  return Object.freeze({
    report: Object.freeze(report),
    findCandidates: createPlatformChunkStore(chunks).findCandidates,
  });
}
