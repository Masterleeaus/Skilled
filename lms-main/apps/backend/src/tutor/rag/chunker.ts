/**
 * Lesson parsing and chunking for the tutor retrieval store.
 *
 * Reads the current curriculum lesson shape (see curriculum/SCHEMA.md "Lesson JSON"). Pure: no file access.
 * Rules are documented in CHANGES.md in this folder.
 */
import { createHash } from 'node:crypto';

/** Largest chunk text in characters, heading line included. */
export const MAX_CHUNK_CHARS = 1200;

/** Value stored in the document metadata doc_type field for every curriculum lesson. */
export const LESSON_DOC_TYPE = 'lesson';

/** One labelled group of text inside a lesson, such as one instruction section or the procedure. */
export interface LessonBlock {
  heading: string | null;
  /** Atomic text pieces (paragraph, line or list item). Chunks are packed from these, never cut inside one unless it is too long. */
  units: string[];
}

export interface ParsedLesson {
  lessonId: string;
  title: string;
  /** Status exactly as written in the file, trimmed. Empty string when missing. */
  status: string;
  /** True when the file carries an explicit retired or superseded marker. */
  retired: boolean;
  blocks: LessonBlock[];
}

export interface TextChunk {
  chunkIndex: number;
  heading: string | null;
  text: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Returns the parsed lesson, or null when the JSON is not a lesson (for example a course manifest or a
 * SHARED-REFERENCES file). A lesson must have a string id and an instruction array. A lesson with a missing
 * title throws, because a curriculum file that half-matches the lesson shape is an authoring error.
 */
export function parseLesson(raw: unknown, sourcePath: string): ParsedLesson | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id.trim() === '' || !Array.isArray(raw.instruction)) return null;

  const lessonId = raw.id.trim();
  const title = text(raw.title);
  if (title === '') throw new Error(`${sourcePath}: lesson ${lessonId} has no title`);

  const blocks: LessonBlock[] = [];
  const push = (heading: string | null, units: string[]): void => {
    const clean = units.map((unit) => unit.trim()).filter((unit) => unit !== '');
    if (clean.length > 0) blocks.push({ heading, units: clean });
  };

  push('Learning outcomes', strings(raw.learningOutcomes));

  for (const section of raw.instruction) {
    if (!isRecord(section)) continue;
    const heading = text(section.heading);
    // Body lines are kept apart: a numbered line or a short paragraph is one unit.
    const body = text(section.body);
    push(heading === '' ? null : heading, body === '' ? [] : body.split(/\n+/));
  }

  push('Procedure', strings(raw.procedure));

  if (Array.isArray(raw.workedExamples)) {
    push(
      'Worked examples',
      raw.workedExamples.filter(isRecord).map((example) =>
        [
          `Situation: ${text(example.situation)}`,
          `Decision prompt: ${text(example.decisionPrompt)}`,
          `Reasoning: ${text(example.reasoning)}`,
        ].join('\n'),
      ),
    );
  }

  push('Equipment and PPE', strings(raw.equipmentAndPpe));

  if (Array.isArray(raw.commonErrors)) {
    push(
      'Common errors',
      raw.commonErrors
        .filter(isRecord)
        .map((item) => `Error: ${text(item.error)}\nPrevention: ${text(item.prevention)}`),
    );
  }

  if (Array.isArray(raw.safetyAndRegulatory)) {
    push(
      'Safety and regulatory',
      raw.safetyAndRegulatory
        .filter(isRecord)
        .map((item) => (item.licenceNotice === true ? `Licence notice: ${text(item.point)}` : text(item.point))),
    );
  }

  push('Quality standard', strings(raw.qualityStandard));
  push('Documentation and evidence', strings(raw.documentationEvidence));
  push('Summary', strings(raw.summary));

  const retired = raw.retired === true || raw.superseded === true || Boolean(raw.supersededBy);

  return {
    lessonId,
    title,
    status: text(raw.status),
    retired,
    blocks,
  };
}

/**
 * Stable numeric document id for a lesson id: the first 52 bits of its SHA-256, so the value is a safe integer.
 * The index build throws if two lesson ids map to the same number.
 */
export function documentIdForLesson(lessonId: string): number {
  const hex = createHash('sha256').update(lessonId, 'utf8').digest('hex').slice(0, 13);
  return parseInt(hex, 16);
}

/** Splits one oversize unit at sentence ends, then at the last space before the limit. */
function hardSlice(piece: string, budget: number): string[] {
  const out: string[] = [];
  let rest = piece;
  while (rest.length > budget) {
    let cut = rest.lastIndexOf(' ', budget);
    if (cut <= 0) cut = budget;
    const head = rest.slice(0, cut).trim();
    if (head !== '') out.push(head);
    rest = rest.slice(cut).trim();
  }
  if (rest !== '') out.push(rest);
  return out;
}

function splitOversize(unit: string, budget: number): string[] {
  if (unit.length <= budget) return [unit];
  const out: string[] = [];
  let current = '';
  for (const sentence of unit.split(/(?<=[.!?])\s+/)) {
    for (const piece of hardSlice(sentence, budget)) {
      if (current === '') current = piece;
      else if (current.length + 1 + piece.length <= budget) current += ` ${piece}`;
      else {
        out.push(current);
        current = piece;
      }
    }
  }
  if (current !== '') out.push(current);
  return out;
}

/** Greedy packing of units into strings no longer than budget. Units are joined with a newline. */
function packUnits(units: readonly string[], budget: number): string[] {
  const pieces: string[] = [];
  for (const unit of units) pieces.push(...splitOversize(unit, budget));

  const out: string[] = [];
  let current = '';
  for (const piece of pieces) {
    if (current === '') current = piece;
    else if (current.length + 1 + piece.length <= budget) current += `\n${piece}`;
    else {
      out.push(current);
      current = piece;
    }
  }
  if (current !== '') out.push(current);
  return out;
}

/**
 * Chunks a lesson block by block. Each chunk text starts with its block heading line (when there is one), so
 * a term in a heading matches the chunk. chunk_index counts from 0 across the whole lesson.
 */
export function chunkLesson(lesson: ParsedLesson, maxChars: number = MAX_CHUNK_CHARS): TextChunk[] {
  const chunks: TextChunk[] = [];
  for (const block of lesson.blocks) {
    const heading = block.heading;
    const headingCost = heading ? heading.length + 1 : 0;
    const budget = maxChars - headingCost;
    if (budget < 1) throw new Error(`lesson ${lesson.lessonId}: heading "${heading}" is too long for ${maxChars} characters`);
    for (const packed of packUnits(block.units, budget)) {
      chunks.push({
        chunkIndex: chunks.length,
        heading,
        text: heading ? `${heading}\n${packed}` : packed,
      });
    }
  }
  return chunks;
}
