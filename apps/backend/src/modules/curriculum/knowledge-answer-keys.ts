/**
 * Server-side knowledge-check answer keys (PASS43).
 *
 * Owner decision: answer keys never reach a learner. The keys live in curriculum/assessments/<lessonId>.assessment.json
 * (knowledgeAnswers: id, correctIndex, rationale). They are copied into academy_knowledge_answer_keys, one row per
 * pinned lesson revision and check ID, and grading reads them there. Nothing in this module is returned to a learner.
 *
 * Pure functions only, with no Prisma import, so the rules can be tested directly. The loader script
 * (apps/backend/prisma/load-knowledge-answer-keys.ts) performs the writes.
 */

export interface AnswerKey {
  checkId: string;
  correctIndex: number;
  rationale: string | null;
}

export interface KeyRefusal {
  checkId: string | null;
  reason: string;
}

export interface KeyPlan {
  keys: AnswerKey[];
  refused: KeyRefusal[];
}

/** The knowledge-check list a revision body carries. Same selection as the attempt route and level rules. */
export function knowledgeCheckList(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  if (Array.isArray(record.knowledgeChecks)) return record.knowledgeChecks;
  if (Array.isArray(record.knowledgeCheck)) return record.knowledgeCheck;
  return [];
}

/**
 * Reads the answer keys of one assessment file. Throws when the file does not describe the lesson it is named for,
 * or when an entry is malformed or duplicated, so that a bad file cannot silently grade a learner wrongly.
 */
export function readAssessmentKeys(assessment: unknown, lessonId: string): Map<string, AnswerKey> {
  if (!assessment || typeof assessment !== "object") throw new Error(`Assessment for ${lessonId} is not an object`);
  const record = assessment as Record<string, unknown>;
  if (record.lessonId !== lessonId) throw new Error(`Assessment lessonId "${String(record.lessonId)}" does not match "${lessonId}"`);
  if (!Array.isArray(record.knowledgeAnswers)) throw new Error(`Assessment for ${lessonId} has no knowledgeAnswers array`);
  const keys = new Map<string, AnswerKey>();
  for (const entry of record.knowledgeAnswers) {
    if (!entry || typeof entry !== "object") throw new Error(`Assessment for ${lessonId} has a non-object knowledgeAnswers entry`);
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== "string" || item.id.trim() === "") throw new Error(`Assessment for ${lessonId} has an entry without an id`);
    if (!Number.isInteger(item.correctIndex) || (item.correctIndex as number) < 0) throw new Error(`Assessment ${item.id} has no valid correctIndex`);
    if (keys.has(item.id)) throw new Error(`Assessment ${item.id} is duplicated`);
    keys.set(item.id, {
      checkId: item.id,
      correctIndex: item.correctIndex as number,
      rationale: typeof item.rationale === "string" ? item.rationale : null,
    });
  }
  return keys;
}

/**
 * Matches each knowledge check in a revision body to its key by check ID. A check with no key, no usable options or
 * an out-of-range key is refused and reported. No key is ever guessed or inferred from position.
 * `assessmentKeys` is null when the lesson has no assessment file.
 */
export function planAnswerKeys(body: unknown, assessmentKeys: Map<string, AnswerKey> | null): KeyPlan {
  const plan: KeyPlan = { keys: [], refused: [] };
  const seen = new Set<string>();
  for (const question of knowledgeCheckList(body)) {
    const item = question && typeof question === "object" ? (question as Record<string, unknown>) : null;
    const checkId = item && typeof item.id === "string" && item.id.trim() !== "" ? item.id : null;
    if (!checkId) {
      plan.refused.push({ checkId: null, reason: "check has no id" });
      continue;
    }
    if (seen.has(checkId)) {
      plan.refused.push({ checkId, reason: "check id appears more than once in the revision" });
      continue;
    }
    seen.add(checkId);
    if (!assessmentKeys) {
      plan.refused.push({ checkId, reason: "no assessment file for this lesson" });
      continue;
    }
    const key = assessmentKeys.get(checkId);
    if (!key) {
      plan.refused.push({ checkId, reason: "no answer key in the assessment file" });
      continue;
    }
    const options = Array.isArray(item!.options) ? item!.options : [];
    if (options.length < 2 || key.correctIndex >= options.length) {
      plan.refused.push({ checkId, reason: "answer key index is outside the check's options" });
      continue;
    }
    plan.keys.push(key);
  }
  return plan;
}
