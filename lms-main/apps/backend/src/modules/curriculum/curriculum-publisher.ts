/**
 * Publishes the curriculum files into the Academy tables: lessons, revisions, track placements, course links and
 * knowledge-check answer keys. Placement comes from curriculum/structure/COURSES-MODULES.json. Content comes from the
 * lesson files indexed by file-lesson-loader.ts. Answer keys come from curriculum/assessments/<id>.assessment.json.
 *
 * Owner decisions this module implements:
 * - Publication runs on every change to the curriculum files (scripts/publish-curriculum.ts, watch mode).
 * - Publication waits for the review gate (owner decision 23, 2026-11-04). Each revision written here goes through
 *   createDraftRevision, then publishRevision with the process gate setting. A revision with no approving review for its
 *   current content hash is refused, so the lesson is held as a draft with a warning and its placements are left as they are.
 *   ACADEMY_PUBLICATION_GATE=off is the only way to publish without review, and it is not set by this module.
 *
 * Idempotence:
 * - A lesson gets a new revision only when the hash of its file body differs from the hash of its latest revision.
 *   Hashes are recomputed from the stored body, so a Postgres jsonb round trip does not cause a republish.
 * - Lessons, tracks, course links and placements are matched on their unique keys and updated only when they differ.
 * - Answer keys are matched on revision and check ID, and written only when they differ.
 * A second run with no file change writes nothing and adds no audit entries.
 *
 * Refusals (the lesson is left as it is and a warning is returned, never a guessed value):
 * - A lesson file with no usable file in the index, or a file that carries an answer-key field.
 * - A lesson whose publish throws. Its placements are left as they are.
 * - A lesson whose assessment file has no approval record matching its exact bytes (sha256, status approved, a named or
 *   known reviewer, a past ISO reviewedAt). Its answer keys are not loaded and the lesson is held. Approvals are read from
 *   ACADEMY_ASSESSMENT_APPROVALS when set, else <root>/assessment-publication-approvals.json.
 * A course slug that is not in the database is skipped with a warning. Courses are never created here.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../config/prisma";
import { buildFileLessonIndex, type FileLesson } from "./file-lesson-loader";
import { planAnswerKeys, readAssessmentKeys, type AnswerKey } from "./knowledge-answer-keys";
import { contentHashOf, createDraftRevision, latestSourceEditor, publishRevision } from "./lesson-review.service";
import { UNVERIFIED_COURSES_HOLD_LIST } from "./unverified-courses-hold-list";

// ---------------------------------------------------------------------------
// Structure and placement (pure)
// ---------------------------------------------------------------------------

export interface StructureLesson { id: string; title: string }
export interface StructureModule { module: string; lessons: StructureLesson[] }
export interface StructureCourse { slug: string; title: string; group: string; modules: StructureModule[] }
export interface CurriculumStructure { courses: StructureCourse[] }

export interface PlannedPlacement {
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  /** 1-based, counted across the course's modules in file order. Unique within the course track. */
  position: number;
}

export interface CoursePlan {
  slug: string;
  title: string;
  group: string;
  trackSlug: string;
  placements: PlannedPlacement[];
}

export interface PlacementPlan {
  courses: CoursePlan[];
  warnings: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const TRACK_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ANSWER_KEY_FIELDS = new Set(["correctIndex", "correctAnswer", "correctAnswers", "answerKey", "rationale", "isCorrect"]);

/** Checks the shape of COURSES-MODULES.json. Throws on a malformed file, so nothing is written from it. */
export function readStructure(data: unknown): CurriculumStructure {
  if (!isRecord(data) || !Array.isArray(data.courses)) throw new Error("COURSES-MODULES.json has no courses array");
  return {
    courses: data.courses.map((course, courseIndex): StructureCourse => {
      if (!isRecord(course) || typeof course.slug !== "string" || course.slug.trim() === "" || !Array.isArray(course.modules)) {
        throw new Error(`COURSES-MODULES.json course at index ${courseIndex} needs a slug and a modules array`);
      }
      return {
        slug: course.slug,
        title: typeof course.title === "string" && course.title.trim() ? course.title : course.slug,
        group: typeof course.group === "string" ? course.group : "",
        modules: course.modules.map((module): StructureModule => {
          if (!isRecord(module) || !Array.isArray(module.lessons)) throw new Error(`COURSES-MODULES.json module in ${course.slug} needs a lessons array`);
          return {
            module: typeof module.module === "string" ? module.module : "",
            lessons: module.lessons.map((lesson): StructureLesson => {
              if (!isRecord(lesson) || typeof lesson.id !== "string" || lesson.id.trim() === "") {
                throw new Error(`COURSES-MODULES.json lesson in ${course.slug} needs an id`);
              }
              return { id: lesson.id, title: typeof lesson.title === "string" ? lesson.title : "" };
            }),
          };
        }),
      };
    }),
  };
}

/**
 * Flattens each course into one ordered track. A course listed twice keeps its first entry. A lesson listed twice in
 * one course keeps its first placement, because the track allows one placement per lesson.
 */
export function planPlacements(structure: CurriculumStructure): PlacementPlan {
  const warnings: string[] = [];
  const courses: CoursePlan[] = [];
  const seenCourses = new Set<string>();
  for (const course of structure.courses) {
    if (seenCourses.has(course.slug)) {
      warnings.push(`Course ${course.slug} is listed twice in COURSES-MODULES.json; the second entry is ignored`);
      continue;
    }
    seenCourses.add(course.slug);
    if (UNVERIFIED_COURSES_HOLD_LIST.includes(course.slug)) {
      warnings.push(`Course ${course.slug} is on the unverified courses hold list (cost-rule verdict UNCLEAR); its placements are skipped until it is verified`);
      continue;
    }
    const trackSlug = `${course.slug}-curriculum`;
    if (!TRACK_SLUG_PATTERN.test(trackSlug)) {
      warnings.push(`Course slug ${course.slug} cannot form a track slug; the course is skipped`);
      continue;
    }
    const placements: PlannedPlacement[] = [];
    const seenLessons = new Set<string>();
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (seenLessons.has(lesson.id)) {
          warnings.push(`${lesson.id} is listed twice in ${course.slug}; the first placement is kept`);
          continue;
        }
        seenLessons.add(lesson.id);
        placements.push({ courseSlug: course.slug, lessonId: lesson.id, lessonTitle: lesson.title, moduleTitle: module.module, position: placements.length + 1 });
      }
    }
    courses.push({ slug: course.slug, title: course.title, group: course.group, trackSlug, placements });
  }
  return { courses, warnings };
}

/** Returns the path of the first answer-key field found in a lesson body, or null. Lesson files must never carry one. */
export function findAnswerKeyField(value: unknown, location = ""): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = findAnswerKeyField(value[i], `${location}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      const here = location ? `${location}.${key}` : key;
      if (ANSWER_KEY_FIELDS.has(key)) return here;
      const found = findAnswerKeyField(item, here);
      if (found) return found;
    }
  }
  return null;
}

export interface LessonFields {
  layer: string;
  serviceGroup: string;
  unit: string;
  title: string;
  objective: string;
  assessment: string;
  sourceVersion: string;
  sourceHash: string;
}

/** The AcademyContentLesson columns derived from a lesson file and its first placement. Pure. */
export function lessonFields(input: { file: FileLesson; structureTitle: string; group: string; moduleTitle: string; passRule: string | null }): LessonFields {
  const body = input.file.body;
  const layer = typeof body.layer === "string" && body.layer.trim() ? body.layer : "unspecified";
  const outcomes = Array.isArray(body.learningOutcomes) ? body.learningOutcomes.filter((item): item is string => typeof item === "string") : [];
  const content = {
    layer,
    serviceGroup: input.group,
    unit: input.moduleTitle,
    title: input.file.title || input.structureTitle,
    objective: outcomes.join("\n"),
    assessment: input.passRule ?? "NOT SET",
  };
  return { ...content, sourceVersion: contentHashOf(body), sourceHash: contentHashOf(content) };
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export interface PublishSummary {
  coursesPlaced: number;
  coursesMissingFromDatabase: string[];
  lessons: { placed: number; unplacedFiles: number; created: number; updated: number; newRevisions: number; draftsPublished: number; unchanged: number; held: number };
  placements: { created: number; updated: number; removed: number; unchanged: number };
  tracks: { created: number };
  courseLinks: { created: number };
  answerKeys: { created: number; updated: number; unchanged: number; refused: number };
  warnings: string[];
}

function emptySummary(): PublishSummary {
  return {
    coursesPlaced: 0,
    coursesMissingFromDatabase: [],
    lessons: { placed: 0, unplacedFiles: 0, created: 0, updated: 0, newRevisions: 0, draftsPublished: 0, unchanged: 0, held: 0 },
    placements: { created: 0, updated: 0, removed: 0, unchanged: 0 },
    tracks: { created: 0 },
    courseLinks: { created: 0 },
    answerKeys: { created: 0, updated: 0, unchanged: 0, refused: 0 },
    warnings: [],
  };
}

// ---------------------------------------------------------------------------
// Database writes
// ---------------------------------------------------------------------------

interface AssessmentInfo { keys: Map<string, AnswerKey> | null; passRule: string | null; warning: string | null; hold: boolean }

/** One approval record from the assessment approval file, keyed by lesson ID. Fields are checked by approvalProblem. */
type AssessmentApprovals = Record<string, unknown>;

const PLACEHOLDER_REVIEWER = /^(tbd|todo|n\/?a|none|null|unknown|test|placeholder|changeme|pending|reviewer|admin|example|dummy|x+|-+)$/i;
const NAMED_REVIEWER = /^[A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*)+$/;
const USER_ID_SHAPE = /^c[a-z0-9]{20,30}$/;
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

/** Reads the approval records. A missing file means no approvals, so every answer key is held. */
async function loadAssessmentApprovals(root: string): Promise<AssessmentApprovals> {
  const file = process.env.ACADEMY_ASSESSMENT_APPROVALS || path.join(root, "assessment-publication-approvals.json");
  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) throw new Error("assessment approval file must be a JSON object keyed by lesson ID");
  return parsed;
}

/** Why no approval covers these exact file bytes, or null when one does. A reviewer must be a named person or a user ID in the database. */
async function approvalProblem(lessonId: string, bytes: Buffer, approvals: AssessmentApprovals): Promise<string | null> {
  const approval = Object.prototype.hasOwnProperty.call(approvals, lessonId) ? approvals[lessonId] : undefined;
  if (!isRecord(approval)) return "no approval record";
  if (approval.status !== "approved") return "approval status is not approved";
  if (approval.sha256 !== createHash("sha256").update(bytes).digest("hex")) return "approval does not match the file (sha256)";
  const reviewer = typeof approval.reviewer === "string" ? approval.reviewer.trim() : "";
  if (!reviewer || PLACEHOLDER_REVIEWER.test(reviewer)) return "reviewer is missing or a placeholder";
  if (!NAMED_REVIEWER.test(reviewer)) {
    const known = USER_ID_SHAPE.test(reviewer) ? await prisma.user.findUnique({ where: { id: reviewer }, select: { id: true } }) : null;
    if (!known) return "reviewer is neither a named person nor a known user ID";
  }
  const reviewedAt = typeof approval.reviewedAt === "string" ? approval.reviewedAt : "";
  if (!ISO_WITH_ZONE.test(reviewedAt) || !Number.isFinite(Date.parse(reviewedAt)) || Date.parse(reviewedAt) > Date.now()) return "reviewedAt is not a parseable ISO date in the past";
  return null;
}

/**
 * Reads one assessment file. A missing file is a warning and does not stop the lesson publishing. A file with no approval
 * for its exact bytes is held: its answer keys are not loaded and the lesson is not published. A malformed file is refused.
 */
async function loadAssessment(root: string, lessonId: string, approvals: AssessmentApprovals): Promise<AssessmentInfo> {
  const file = path.join(root, "assessments", `${lessonId}.assessment.json`);
  let bytes: Buffer;
  try {
    bytes = await readFile(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { keys: null, passRule: null, warning: `${lessonId}: no assessment file; knowledge checks cannot be graded`, hold: false };
    }
    throw error;
  }
  const problem = await approvalProblem(lessonId, bytes, approvals);
  if (problem) return { keys: null, passRule: null, warning: `${lessonId}: answer keys held, not published (${problem})`, hold: true };
  const raw = bytes.toString("utf8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    return { keys: readAssessmentKeys(parsed, lessonId), passRule: isRecord(parsed) && typeof parsed.passRule === "string" ? parsed.passRule : null, warning: null, hold: false };
  } catch (error) {
    return { keys: null, passRule: null, warning: `${lessonId}: assessment file refused (${(error as Error).message})`, hold: false };
  }
}

async function ensureLesson(sourceId: string, fields: LessonFields): Promise<{ id: string; status: string; created: boolean; updated: boolean }> {
  const existing = await prisma.academyContentLesson.findUnique({ where: { sourceId } });
  if (!existing) {
    const row = await prisma.academyContentLesson.create({ data: { sourceId, ...fields } });
    return { id: row.id, status: row.contentStatus, created: true, updated: false };
  }
  const current = existing as unknown as Record<string, unknown>;
  const changed = (Object.keys(fields) as Array<keyof LessonFields>).some((key) => current[key] !== fields[key]);
  if (!changed) return { id: existing.id, status: existing.contentStatus, created: false, updated: false };
  const row = await prisma.academyContentLesson.update({ where: { sourceId }, data: fields });
  return { id: row.id, status: row.contentStatus, created: false, updated: true };
}

/**
 * Returns the revision that carries the file body, published. A new revision is made only when the body differs
 * from the latest revision. A latest draft with the same body is published rather than duplicated.
 */
async function ensurePublishedRevision(lessonDbId: string, sourceId: string, body: Record<string, unknown>, actorId: string): Promise<{ revisionId: string; outcome: "unchanged" | "new" | "draft" }> {
  const latest = await prisma.academyLessonRevision.findFirst({ where: { lessonId: lessonDbId }, orderBy: { version: "desc" } });
  if (latest && contentHashOf(latest.body) === contentHashOf(body)) {
    if (latest.status === "PUBLISHED") return { revisionId: latest.id, outcome: "unchanged" };
    const published = await publishRevision(latest.id, actorId);
    return { revisionId: published.id, outcome: "draft" };
  }
  // The recorded author is the latest person who edited the lesson source, so the editor cannot approve their own change.
  const draft = await createDraftRevision({ sourceId, body, actorId, authorId: (await latestSourceEditor(sourceId)) ?? actorId });
  const published = await publishRevision(draft.id, actorId);
  return { revisionId: published.id, outcome: "new" };
}

/** Upserts answer keys for one revision. Returns refusal reasons, which name check IDs and never key values. */
async function syncAnswerKeys(revisionId: string, body: Record<string, unknown>, keys: Map<string, AnswerKey> | null, summary: PublishSummary): Promise<string[]> {
  const plan = planAnswerKeys(body, keys);
  const existing = await prisma.academyKnowledgeAnswerKey.findMany({ where: { revisionId } });
  const byCheck = new Map(existing.map((row) => [row.checkId, row]));
  for (const key of plan.keys) {
    const row = byCheck.get(key.checkId);
    if (!row) {
      await prisma.academyKnowledgeAnswerKey.create({ data: { revisionId, checkId: key.checkId, correctIndex: key.correctIndex, rationale: key.rationale } });
      summary.answerKeys.created += 1;
    } else if (row.correctIndex !== key.correctIndex || (row.rationale ?? null) !== (key.rationale ?? null)) {
      await prisma.academyKnowledgeAnswerKey.update({ where: { revisionId_checkId: { revisionId, checkId: key.checkId } }, data: { correctIndex: key.correctIndex, rationale: key.rationale } });
      summary.answerKeys.updated += 1;
    } else {
      summary.answerKeys.unchanged += 1;
    }
  }
  summary.answerKeys.refused += plan.refused.length;
  return plan.refused.map((refusal) => `${refusal.checkId ?? "(no id)"}: ${refusal.reason}`);
}

interface DesiredPlacement { lessonDbId: string; position: number; revisionId: string }

/**
 * Makes one course track match its plan in one transaction. Stale placements are removed, except for lessons held
 * back this run. Positions are moved in two phases so that a swap cannot clash on [trackId, position].
 */
async function syncCoursePlacements(input: {
  courseId: string;
  course: CoursePlan;
  desired: DesiredPlacement[];
  heldLessonDbIds: string[];
}): Promise<{ created: number; updated: number; removed: number; unchanged: number; trackCreated: boolean; linkCreated: boolean }> {
  const counts = { created: 0, updated: 0, removed: 0, unchanged: 0, trackCreated: false, linkCreated: false };
  await prisma.$transaction(async (tx) => {
    let track = await tx.academyCurriculumTrack.findUnique({ where: { slug: input.course.trackSlug } });
    if (!track) {
      track = await tx.academyCurriculumTrack.create({ data: { slug: input.course.trackSlug, title: `${input.course.title} curriculum`, scope: "VERTICAL", serviceGroup: input.course.group || null, status: "DRAFT" } });
      counts.trackCreated = true;
    }
    const link = await tx.academyCourseTrack.findFirst({ where: { courseId: input.courseId, trackId: track.id } });
    if (!link) {
      const links = await tx.academyCourseTrack.findMany({ where: { courseId: input.courseId }, select: { position: true } });
      const next = Math.max(0, ...links.map((item) => item.position)) + 1;
      await tx.academyCourseTrack.create({ data: { courseId: input.courseId, trackId: track.id, position: next, required: true } });
      counts.linkCreated = true;
    }

    const current = await tx.academyLessonPlacement.findMany({ where: { trackId: track.id } });
    const keep = new Set([...input.desired.map((item) => item.lessonDbId), ...input.heldLessonDbIds]);
    for (const row of current) {
      if (!keep.has(row.lessonId)) {
        await tx.academyLessonPlacement.delete({ where: { id: row.id } });
        counts.removed += 1;
      }
    }
    const byLesson = new Map(current.filter((row) => keep.has(row.lessonId)).map((row) => [row.lessonId, row]));

    const moving = input.desired.map((item) => ({ item, row: byLesson.get(item.lessonDbId) })).filter((entry) => entry.row && entry.row.position !== entry.item.position);
    for (let i = 0; i < moving.length; i += 1) {
      await tx.academyLessonPlacement.update({ where: { id: moving[i].row!.id }, data: { position: -(i + 1) } });
    }
    for (const item of input.desired) {
      const row = byLesson.get(item.lessonDbId);
      if (!row) {
        await tx.academyLessonPlacement.create({ data: { trackId: track.id, lessonId: item.lessonDbId, revisionId: item.revisionId, position: item.position, required: true } });
        counts.created += 1;
      } else if (row.position !== item.position || row.revisionId !== item.revisionId || !row.required) {
        await tx.academyLessonPlacement.update({ where: { id: row.id }, data: { position: item.position, revisionId: item.revisionId, required: true } });
        counts.updated += 1;
      } else {
        counts.unchanged += 1;
      }
    }

    if (track.status !== "PUBLISHED") await tx.academyCurriculumTrack.update({ where: { id: track.id }, data: { status: "PUBLISHED" } });
  }, { timeout: 120000 });
  return counts;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export interface PublishOptions {
  /** Curriculum root: the folder holding structure/, courses/, shared/ and assessments/. */
  root: string;
  /** Existing user ID, recorded as the actor on every revision and audit entry this run writes. */
  actorId: string;
}

/** Publishes the curriculum files. Safe to run repeatedly. Writes only what has changed. */
export async function publishCurriculumFiles(options: PublishOptions): Promise<PublishSummary> {
  const { root, actorId } = options;
  const structure = readStructure(JSON.parse(await readFile(path.join(root, "structure", "COURSES-MODULES.json"), "utf8")) as unknown);
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { id: true } });
  if (!actor) throw new Error("The publish actor is not a user in the database");

  const plan = planPlacements(structure);
  const approvals = await loadAssessmentApprovals(root);
  const index = await buildFileLessonIndex(root);
  const summary = emptySummary();
  summary.warnings.push(...plan.warnings);

  // Each lesson takes its group, module and title from its first placement, in structure order.
  const firstPlacement = new Map<string, { course: CoursePlan; placement: PlannedPlacement }>();
  for (const course of plan.courses) {
    for (const placement of course.placements) {
      if (!firstPlacement.has(placement.lessonId)) firstPlacement.set(placement.lessonId, { course, placement });
    }
  }
  const lessonOrder = [...firstPlacement.keys()];
  summary.lessons.placed = lessonOrder.length;
  summary.lessons.unplacedFiles = [...index.keys()].filter((id) => !firstPlacement.has(id)).length;

  const published = new Map<string, { dbId: string; revisionId: string }>();
  const held = new Set<string>();
  for (const lessonId of lessonOrder) {
    const { course, placement } = firstPlacement.get(lessonId)!;
    const file = index.get(lessonId);
    if (!file) {
      held.add(lessonId);
      summary.lessons.held += 1;
      summary.warnings.push(`${lessonId}: no usable lesson file; its placements are left as they are`);
      continue;
    }
    const secretPath = findAnswerKeyField(file.body);
    if (secretPath) {
      held.add(lessonId);
      summary.lessons.held += 1;
      summary.warnings.push(`${lessonId}: lesson file carries an answer-key field (${secretPath}); not published`);
      continue;
    }
    try {
      const assessment = await loadAssessment(root, lessonId, approvals);
      if (assessment.warning) summary.warnings.push(assessment.warning);
      if (assessment.hold) {
        held.add(lessonId);
        summary.lessons.held += 1;
        continue;
      }
      const fields = lessonFields({ file, structureTitle: placement.lessonTitle, group: course.group, moduleTitle: placement.moduleTitle, passRule: assessment.passRule });
      const lesson = await ensureLesson(lessonId, fields);
      if (lesson.created) summary.lessons.created += 1;
      if (lesson.updated) summary.lessons.updated += 1;
      const revision = await ensurePublishedRevision(lesson.id, lessonId, file.body, actorId);
      if (revision.outcome === "new") summary.lessons.newRevisions += 1;
      else if (revision.outcome === "draft") summary.lessons.draftsPublished += 1;
      else summary.lessons.unchanged += 1;
      if (lesson.status !== "PUBLISHED") await prisma.academyContentLesson.update({ where: { id: lesson.id }, data: { contentStatus: "PUBLISHED" } });
      for (const refusal of await syncAnswerKeys(revision.revisionId, file.body, assessment.keys, summary)) {
        summary.warnings.push(`${lessonId} knowledge check ${refusal}`);
      }
      published.set(lessonId, { dbId: lesson.id, revisionId: revision.revisionId });
    } catch (error) {
      held.add(lessonId);
      summary.lessons.held += 1;
      summary.warnings.push(`${lessonId}: publish failed (${(error as Error).message}); its placements are left as they are`);
    }
  }

  for (const course of plan.courses) {
    if (course.placements.length === 0) continue;
    const row = await prisma.course.findUnique({ where: { slug: course.slug }, select: { id: true } });
    if (!row) {
      summary.coursesMissingFromDatabase.push(course.slug);
      summary.warnings.push(`Course ${course.slug} is not in the database; its placements are not written`);
      continue;
    }
    const desired: DesiredPlacement[] = [];
    const heldSourceIds: string[] = [];
    for (const placement of course.placements) {
      const ref = published.get(placement.lessonId);
      if (ref) desired.push({ lessonDbId: ref.dbId, position: placement.position, revisionId: ref.revisionId });
      else if (held.has(placement.lessonId)) heldSourceIds.push(placement.lessonId);
    }
    const heldLessonDbIds = (await Promise.all(heldSourceIds.map((sourceId) => prisma.academyContentLesson.findUnique({ where: { sourceId }, select: { id: true } }))))
      .flatMap((item) => (item ? [item.id] : []));
    const result = await syncCoursePlacements({ courseId: row.id, course, desired, heldLessonDbIds });
    summary.coursesPlaced += 1;
    summary.placements.created += result.created;
    summary.placements.updated += result.updated;
    summary.placements.removed += result.removed;
    summary.placements.unchanged += result.unchanged;
    if (result.trackCreated) summary.tracks.created += 1;
    if (result.linkCreated) summary.courseLinks.created += 1;
  }

  return summary;
}
