/**
 * Lesson review and publication gate (ACA-008) and source-draft protection (ACA-026).
 *
 * This module is the only code path that moves an AcademyLessonRevision to PUBLISHED.
 * Imported, normalised and bulk-created material is always written as DRAFT.
 */
import { prisma } from "../../config/prisma";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import { contentHash } from "../../utils/content-hash";
import { recordAuditLog } from "../audit/audit.service";

/** Environment switch for the publication gate. Unset, empty or any unrecognised value keeps the gate ON. */
export const PUBLICATION_GATE_ENV = "ACADEMY_PUBLICATION_GATE";

export const REVIEW_DECISIONS = ["APPROVED", "REJECTED", "CHANGES_REQUESTED"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

type Body = Record<string, unknown>;

/** Returns false only for an explicit off value. Default is ON (ACA-008 is P0). */
export function publicationGateEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env[PUBLICATION_GATE_ENV]?.trim().toLowerCase();
  return !(raw === "off" || raw === "false" || raw === "0");
}

/**
 * Content hash of a lesson body. Uses the shared canonical form (sorted keys at every level),
 * so the hash is the same whether the body is hashed before or after a Postgres jsonb round trip.
 * Revisions written before this change carry the old JSON.stringify hash and are not rewritten.
 */
export function contentHashOf(body: unknown): string {
  return contentHash(body);
}

// ---------------------------------------------------------------------------
// Structural checks. Rules follow curriculum/SCHEMA.md (lesson JSON and template
// lessons) and the section and identity rules in scripts/reconcile-lesson-formats.mjs
// (ported, because that script sits outside the backend rootDir).
// ---------------------------------------------------------------------------

export interface StructuralCheck { id: string; label: string; passed: boolean; detail: string }
export interface StructuralResult { lessonKind: string; passed: boolean; checks: StructuralCheck[] }

const isText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const hasItems = (value: unknown): value is unknown[] => Array.isArray(value) && value.length > 0;

function hasInstructionSection(body: Body): boolean {
  const entries = Array.isArray(body.instruction) ? body.instruction : [];
  return entries.some((entry) => isText(entry) || (isObject(entry) && [entry.body, entry.text, entry.content, entry.instruction, entry.explanation].some(isText)));
}

function knowledgeChecksProblem(body: Body): string | null {
  if (!hasItems(body.knowledgeChecks)) return "no knowledge checks";
  for (const check of body.knowledgeChecks) {
    if (!isObject(check) || !isText(check.question)) return "knowledge check without a question";
    const options = check.options;
    if (!Array.isArray(options) || (options.length !== 3 && options.length !== 4) || !options.every(isText)) return "knowledge check must have 3 or 4 non-empty options";
  }
  return null;
}

function templateProblem(body: Body): string | null {
  if (!hasItems(body.editableTemplates)) return "no editableTemplates";
  if (!hasItems(body.assessmentRubric)) return "no assessmentRubric";
  if (!isObject(body.outputDocument) || !hasItems(body.outputDocument.sections)) return "no outputDocument sections";
  const expected: string[] = [];
  for (const template of body.editableTemplates) {
    if (!isObject(template) || !isText(template.templateId) || !hasItems(template.fields)) return "template without templateId or fields";
    for (const field of template.fields) {
      if (!isObject(field) || !isText(field.fieldId)) return "template field without fieldId";
      expected.push(field.fieldId);
    }
  }
  if (new Set(expected).size !== expected.length) return "duplicate template fieldId";
  const placed: string[] = [];
  for (const section of body.outputDocument.sections) {
    if (!isObject(section) || !Array.isArray(section.fieldIds) || !section.fieldIds.every(isText)) return "output section without fieldIds";
    placed.push(...(section.fieldIds as string[]));
  }
  const unplaced = expected.filter((id) => placed.filter((p) => p === id).length !== 1);
  const unknown = placed.filter((id) => !expected.includes(id));
  if (unplaced.length || unknown.length) return `output sections must place each field exactly once (unplaced: ${unplaced.join(", ") || "none"}; unknown: ${unknown.join(", ") || "none"})`;
  return null;
}

export function evaluateStructure(body: Body): StructuralResult {
  const checks: StructuralCheck[] = [];
  const add = (id: string, label: string, problem: string | null) => checks.push({ id, label, passed: problem === null, detail: problem ?? "ok" });

  add("identity", "Lesson has an id and title", isText(body.id) && isText(body.title) ? null : "missing id or title");
  const hasProcedure = hasItems(body.procedure) && body.procedure.some(isText);
  add("instruction-or-procedure", "Has instruction sections or a procedure", hasInstructionSection(body) || hasProcedure ? null : "no instruction section or procedure step");
  add("summary", "Has a summary", hasItems(body.summary) && body.summary.some(isText) ? null : "no summary");
  add("quality-standard", "Has a quality standard", hasItems(body.qualityStandard) && body.qualityStandard.some(isText) ? null : "no quality standard");

  const lessonKind = body.lessonKind === undefined ? "knowledge" : String(body.lessonKind);
  if (lessonKind === "knowledge") add("knowledge-checks", "Has knowledge checks", knowledgeChecksProblem(body));
  else if (lessonKind === "template") add("template", "Has editable template, rubric and output document", templateProblem(body));
  else add("lesson-kind", "Lesson kind is recognised", `unknown lessonKind "${lessonKind}"`);

  return { lessonKind, passed: checks.every((check) => check.passed), checks };
}

// ---------------------------------------------------------------------------
// Gate evaluation. Pure function over the revision row and its review history.
// ---------------------------------------------------------------------------

export interface ReviewRecord { id: string; reviewerId: string; contentHash: string; decision: string; decidedAt: Date }
export type GateReasonCode = "CONTENT_HASH_MISMATCH" | "NOT_APPROVED_FOR_CURRENT_HASH" | "APPROVER_NOT_INDEPENDENT" | "STRUCTURE_INCOMPLETE";
export interface GateReason { code: GateReasonCode; message: string }
export interface GateEvaluation {
  gateEnabled: boolean;
  currentHash: string;
  storedHash: string;
  hashIntegrity: boolean;
  latestDecisionForHash: string | null;
  approved: boolean;
  structure: StructuralResult;
  allowed: boolean;
  reasons: GateReason[];
}

/** Newest first. Ties on decidedAt fall back to id, descending. */
export function sortReviewsNewestFirst<T extends { id: string; decidedAt: Date }>(reviews: T[]): T[] {
  return [...reviews].sort((a, b) => b.decidedAt.getTime() - a.decidedAt.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
}

export function evaluatePublicationGate(input: { body: Body; storedHash: string; reviews: ReviewRecord[]; gateEnabled: boolean; authorId: string | null; editorIds?: string[] }): GateEvaluation {
  const currentHash = contentHashOf(input.body);
  const hashIntegrity = currentHash === input.storedHash;
  const forCurrentHash = sortReviewsNewestFirst(input.reviews.filter((review) => review.contentHash === currentHash));
  const latest = forCurrentHash[0];
  const latestDecisionForHash = latest?.decision ?? null;
  // An approval counts only if its reviewer is known to be someone other than the author and every editor of the lesson.
  const independent = input.authorId !== null && latest !== undefined && latest.reviewerId !== input.authorId && !(input.editorIds ?? []).includes(latest.reviewerId);
  const approved = latestDecisionForHash === "APPROVED" && independent;
  const structure = evaluateStructure(input.body);

  const reasons: GateReason[] = [];
  if (!hashIntegrity) reasons.push({ code: "CONTENT_HASH_MISMATCH", message: "Stored content hash does not match the revision body" });
  if (!approved && latestDecisionForHash === "APPROVED") reasons.push({ code: "APPROVER_NOT_INDEPENDENT", message: "The latest approval was not given by an independent reviewer" });
  else if (!approved) reasons.push({ code: "NOT_APPROVED_FOR_CURRENT_HASH", message: latestDecisionForHash ? `Latest review for this content is ${latestDecisionForHash}` : "No review exists for this content" });
  if (!structure.passed) reasons.push({ code: "STRUCTURE_INCOMPLETE", message: `Failed checks: ${structure.checks.filter((c) => !c.passed).map((c) => c.id).join(", ")}` });

  // With the gate off, nothing is checked. The bypass is recorded by publishRevision.
  const allowed = !input.gateEnabled || reasons.length === 0;
  return { gateEnabled: input.gateEnabled, currentHash, storedHash: input.storedHash, hashIntegrity, latestDecisionForHash, approved, structure, allowed, reasons: input.gateEnabled ? reasons : [] };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Refuses any caller-supplied status other than DRAFT, and any publishedAt value. */
function assertDraftOnly(input: { sourceId: string; status?: string; publishedAt?: Date | null }): void {
  if ((input.status !== undefined && input.status !== "DRAFT") || (input.publishedAt ?? null) !== null) {
    throw new ForbiddenError(`Revision for ${input.sourceId} must be created as DRAFT; publication goes through the lesson review path`);
  }
}

export interface RevisionProvenance {
  /** The person recorded as author of the draft: the latest source editor when one exists, otherwise the drafting actor. Null when no draft record exists. */
  authorId: string | null;
  /** Every user who has edited the lesson source file (LESSON_SOURCE_UPDATED), plus the recorded author. */
  editorIds: string[];
}

/**
 * Author and editors of a revision. Editors are read live from the source-edit audit trail, so a revision drafted
 * before the author was recorded still cannot be approved by someone who edited the lesson.
 */
async function provenanceOf(tx: Tx, revision: { id: string; lessonId: string }): Promise<RevisionProvenance> {
  const draft = await tx.auditLog.findFirst({ where: { action: "LESSON_REVISION_DRAFTED", entity: "AcademyLessonRevision", entityId: revision.id } });
  const lesson = await tx.academyContentLesson.findUnique({ where: { id: revision.lessonId }, select: { sourceId: true } });
  const edits = lesson
    ? await tx.auditLog.findMany({ where: { action: "LESSON_SOURCE_UPDATED", entity: "CurriculumLessonSource", entityId: lesson.sourceId }, select: { userId: true } })
    : [];
  const recorded = draft?.newValue && typeof draft.newValue === "object" ? (draft.newValue as Record<string, unknown>) : {};
  const recordedAuthor = typeof recorded.authorId === "string" ? recorded.authorId : null;
  const authorId = draft ? (recordedAuthor ?? draft.userId) : null;
  const editorIds = [...new Set([...edits.map((edit) => edit.userId), ...(authorId ? [authorId] : [])])];
  return { authorId, editorIds };
}

/** The user who most recently edited a lesson source file, or null when the file has no recorded edit. */
export async function latestSourceEditor(sourceId: string): Promise<string | null> {
  const latest = await prisma.auditLog.findFirst({ where: { action: "LESSON_SOURCE_UPDATED", entity: "CurriculumLessonSource", entityId: sourceId }, orderBy: { createdAt: "desc" }, select: { userId: true } });
  return latest?.userId ?? null;
}

async function insertDraft(tx: Tx, input: { sourceId: string; body: Body; expectedVersion?: number; actorId: string; authorId?: string }) {
  const lesson = await tx.academyContentLesson.findUnique({ where: { sourceId: input.sourceId } });
  if (!lesson) throw new NotFoundError("Lesson");
  const latest = await tx.academyLessonRevision.findFirst({ where: { lessonId: lesson.id }, orderBy: { version: "desc" } });
  const current = latest?.version ?? 0;
  if (input.expectedVersion !== undefined && current !== input.expectedVersion) throw new ForbiddenError("Revision conflict");
  const revision = await tx.academyLessonRevision.create({
    data: { lessonId: lesson.id, version: current + 1, body: input.body, contentHash: contentHashOf(input.body), status: "DRAFT", publishedAt: null },
  });
  await tx.auditLog.create({ data: { userId: input.actorId, action: "LESSON_REVISION_DRAFTED", entity: "AcademyLessonRevision", entityId: revision.id, newValue: { lessonId: lesson.id, version: revision.version, authorId: input.authorId ?? input.actorId } } });
  return revision;
}

/** Every revision enters the system as DRAFT. Imported or normalised material cannot carry another status. */
export async function createDraftRevision(input: { sourceId: string; body: Body; expectedVersion?: number; status?: string; publishedAt?: Date | null; actorId: string; authorId?: string }) {
  assertDraftOnly(input);
  return prisma.$transaction((tx) => insertDraft(tx, input), { isolationLevel: "Serializable" });
}

/**
 * Bulk import of normalised or imported drafts. Every item is checked first, then all rows
 * are written in one transaction, so a refused or failing item leaves nothing behind.
 */
export async function importDraftRevisions(items: Array<{ sourceId: string; body: Body; status?: string; publishedAt?: Date | null }>, actorId: string) {
  for (const item of items) assertDraftOnly(item);
  return prisma.$transaction(async (tx) => {
    const created = [];
    for (const item of items) created.push(await insertDraft(tx, { sourceId: item.sourceId, body: item.body, actorId }));
    return created;
  }, { isolationLevel: "Serializable" });
}

export async function recordReview(input: { revisionId: string; reviewerId: string; decision: ReviewDecision; notes?: string | null; contentHash: string }) {
  const review = await prisma.$transaction(async (tx) => {
    const revision = await tx.academyLessonRevision.findUnique({ where: { id: input.revisionId } });
    if (!revision) throw new NotFoundError("Revision");
    if (revision.status !== "DRAFT") throw new ForbiddenError("Only draft revisions can be reviewed");
    const currentHash = contentHashOf(revision.body);
    if (currentHash !== revision.contentHash) throw new AppError("Stored content hash does not match the revision body", 409);
    if (input.contentHash !== currentHash) throw new AppError("Review was made against a different content hash; reload the revision before deciding", 409);
    if (input.decision === "APPROVED") {
      const provenance = await provenanceOf(tx, revision);
      if (provenance.authorId === null) throw new AppError("The author of this revision is not recorded, so it cannot be approved", 409);
      if (provenance.authorId === input.reviewerId || provenance.editorIds.includes(input.reviewerId)) throw new ForbiddenError("Reviewers cannot approve a revision they authored or edited");
    }
    return tx.academyLessonReview.create({
      data: { revisionId: revision.id, contentHash: currentHash, reviewerId: input.reviewerId, decision: input.decision, notes: input.notes ?? null },
    });
  }, { isolationLevel: "Serializable" });

  await recordAuditLog({ userId: input.reviewerId, action: `LESSON_REVIEW_${input.decision}`, entity: "AcademyLessonRevision", entityId: input.revisionId, newValue: { reviewId: review.id, contentHash: review.contentHash } });
  return review;
}

/** The only function in the backend that sets a revision to PUBLISHED. */
export async function publishRevision(revisionId: string, actorId: string, env: NodeJS.ProcessEnv = process.env) {
  const gateEnabled = publicationGateEnabled(env);
  const outcome = await prisma.$transaction(async (tx) => {
    const revision = await tx.academyLessonRevision.findUnique({ where: { id: revisionId } });
    if (!revision) throw new NotFoundError("Revision");
    if (revision.status === "PUBLISHED") return { revision, changed: false, evaluation: null as GateEvaluation | null };
    if (revision.status !== "DRAFT") throw new ForbiddenError("Only drafts can be published");
    const reviews = await tx.academyLessonReview.findMany({ where: { revisionId }, orderBy: [{ decidedAt: "desc" }, { id: "desc" }] });
    const provenance = await provenanceOf(tx, revision);
    const evaluation = evaluatePublicationGate({ body: revision.body as Body, storedHash: revision.contentHash, reviews, gateEnabled, authorId: provenance.authorId, editorIds: provenance.editorIds });
    if (!evaluation.allowed) throw new AppError("Publication blocked by the lesson review gate", 409, evaluation.reasons);
    const updated = await tx.academyLessonRevision.update({ where: { id: revision.id }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    await tx.academyContentLesson.update({ where: { id: revision.lessonId }, data: { contentStatus: "PUBLISHED" } });
    return { revision: updated, changed: true, evaluation };
  }, { isolationLevel: "Serializable" });

  if (outcome.changed) {
    await recordAuditLog({
      userId: actorId,
      action: gateEnabled ? "LESSON_REVISION_PUBLISHED" : "LESSON_REVISION_PUBLISHED_GATE_OFF",
      entity: "AcademyLessonRevision",
      entityId: revisionId,
      newValue: { contentHash: outcome.evaluation?.currentHash ?? null, gateEnabled, approvedForHash: outcome.evaluation?.approved ?? null },
    });
  }
  return outcome.revision;
}

// ---------------------------------------------------------------------------
// Reads for the reviewer UI
// ---------------------------------------------------------------------------

export interface ReviewQueueItem {
  revisionId: string;
  lessonId: string;
  sourceId: string;
  title: string;
  layer: string;
  version: number;
  contentHash: string;
  reviewState: string;
  hashIntegrity: boolean;
  createdAt: Date;
}

export interface ReviewQueueOptions { page?: number; limit?: number }

const QUEUE_BATCH_SIZE = 200;

function queueItemOf(revision: { id: string; lessonId: string; version: number; body: unknown; contentHash: string; createdAt: Date; lesson: { sourceId: string; title: string; layer: string }; lessonReviews: ReviewRecord[] }): ReviewQueueItem {
  const currentHash = contentHashOf(revision.body);
  const latest = sortReviewsNewestFirst(revision.lessonReviews.filter((r) => r.contentHash === currentHash))[0];
  return {
    revisionId: revision.id,
    lessonId: revision.lessonId,
    sourceId: revision.lesson.sourceId,
    title: revision.lesson.title,
    layer: revision.lesson.layer,
    version: revision.version,
    contentHash: currentHash,
    reviewState: latest?.decision ?? "NOT_REVIEWED",
    hashIntegrity: currentHash === revision.contentHash,
    createdAt: revision.createdAt,
  };
}

/**
 * Reviewer queue: every DRAFT revision whose current content is not approved, paginated.
 * The status filter runs in the database. The approval test depends on the hash of the stored
 * body, which only the application can compute, so it runs on each database batch. Batches are
 * read until the last draft, so a draft at any position reaches the queue; nothing is cut off
 * by a row limit applied before filtering.
 */
export async function listReviewQueue(options: ReviewQueueOptions = {}): Promise<{ items: ReviewQueueItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const limit = Math.max(1, Math.floor(options.limit ?? 200));
  const pending: ReviewQueueItem[] = [];
  for (let skip = 0; ; skip += QUEUE_BATCH_SIZE) {
    const batch = await prisma.academyLessonRevision.findMany({
      where: { status: "DRAFT" },
      include: {
        lesson: { select: { id: true, sourceId: true, title: true, layer: true } },
        lessonReviews: { select: { id: true, reviewerId: true, contentHash: true, decision: true, decidedAt: true }, orderBy: [{ decidedAt: "desc" }, { id: "desc" }] },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip,
      take: QUEUE_BATCH_SIZE,
    });
    for (const revision of batch) {
      const item = queueItemOf(revision);
      if (item.reviewState !== "APPROVED") pending.push(item);
    }
    if (batch.length < QUEUE_BATCH_SIZE) break;
  }
  const total = pending.length;
  return {
    items: pending.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getRevisionForReview(revisionId: string) {
  const revision = await prisma.academyLessonRevision.findUnique({
    where: { id: revisionId },
    include: {
      lesson: { select: { id: true, sourceId: true, title: true, layer: true, unit: true, objective: true } },
      lessonReviews: { include: { reviewer: { select: { id: true, fullName: true } } }, orderBy: [{ decidedAt: "desc" }, { id: "desc" }] },
    },
  });
  if (!revision) throw new NotFoundError("Revision");
  const body = revision.body as Body;
  const provenance = await provenanceOf(prisma as unknown as Tx, revision);
  const gate = evaluatePublicationGate({ body, storedHash: revision.contentHash, reviews: revision.lessonReviews, gateEnabled: publicationGateEnabled(), authorId: provenance.authorId, editorIds: provenance.editorIds });
  return {
    revision: { id: revision.id, lessonId: revision.lessonId, version: revision.version, status: revision.status, contentHash: revision.contentHash, createdAt: revision.createdAt, publishedAt: revision.publishedAt },
    lesson: revision.lesson,
    body,
    gate,
    publicationGate: { setting: PUBLICATION_GATE_ENV, enabled: publicationGateEnabled() },
    reviews: revision.lessonReviews.map((review) => ({ id: review.id, contentHash: review.contentHash, decision: review.decision, notes: review.notes, decidedAt: review.decidedAt, reviewer: review.reviewer })),
  };
}
