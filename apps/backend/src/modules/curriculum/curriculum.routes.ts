import { param } from "../../utils/requestParams";
import { Router, Request, Response, NextFunction } from "express";
import { createHash } from "node:crypto";
import { knowledgeCheckList } from "./knowledge-answer-keys";
import { getFileLesson } from "./file-lesson-loader";
import { BUSINESS_LESSON_FIELDS, isBusinessLessonFieldKey, resolveApprovedBusinessFields, resolveLessonText } from "./business-lesson-fields";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission, requireRole } from "../../middleware/permission";
import { sendSuccess } from "../../utils/response";
import { AppError, ForbiddenError, NotFoundError } from "../../utils/AppError";
import lessonReviewRoutes from "./lesson-review.routes";
import superadminLessonRoutes from "./superadmin-lesson.routes";
import { contentHashOf, createDraftRevision } from "./lesson-review.service";
import { previewLatestRevision } from "./lesson-preview.service";
import { assertCompetencyAwardable } from "./assessment-evidence";
import { buildCourseLessonProgress } from "./completion-report.service";
import { assertEnrolled } from "../enrollment/enrollment.service";
import { assertLessonOpen, getLearnerLevelView, isLevelGateExempt, resolveLevelLocks } from "../levels/level.service";
import { loadSavedSelection } from "../course-selection/course-selection.service";
import { assertLicenceTrackAllows, licenceIndexForTrack, licenceNoticeOf, licenceStatusOf, licenceTrackExcludes, licenceTrackExclusionError, resolveLicenceTrack, savedLicenceTrack, summariseLicenceTracks } from "./licence-track";

const router = Router();
const editor = [authenticate, requirePermission("course:create")] as const;
const run = (fn: (req: Request, res: Response) => Promise<unknown>) => async (req: Request, res: Response, next: NextFunction) => { try { await fn(req, res); } catch (e) { next(e); } };
const revisionSchema = z.object({ body: z.record(z.string(), z.unknown()), expectedVersion: z.number().int().nonnegative().optional() });
const trackSchema = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), title: z.string().min(3), scope: z.enum(["UNIVERSAL", "GROUP", "VERTICAL"]), serviceGroup: z.string().nullable().optional() });
const placementSchema = z.object({ sourceId: z.string().min(1), position: z.number().int().positive(), required: z.boolean().default(true), revisionId: z.string().optional() });

router.get("/lessons", ...editor, run(async (req, res) => {
  const q = z.object({ layer: z.string().optional(), serviceGroup: z.string().optional(), take: z.coerce.number().int().min(1).max(100).default(30), skip: z.coerce.number().int().min(0).default(0) }).parse(req.query);
  const { take, skip, ...where } = q;
  const [items, total] = await Promise.all([prisma.academyContentLesson.findMany({ where, take, skip, orderBy: { sourceId: "asc" } }), prisma.academyContentLesson.count({ where })]);
  sendSuccess(res, { items, total, take, skip });
}));
router.get("/lessons/:sourceId", ...editor, run(async (req, res) => {
  const lesson = await prisma.academyContentLesson.findUnique({ where: { sourceId: param(req, "sourceId") }, include: { revisions: { orderBy: { version: "desc" } } } });
  if (!lesson) throw new NotFoundError("Lesson not found");
  sendSuccess(res, lesson);
}));
router.post("/lessons/:sourceId/revisions", ...editor, run(async (req, res) => {
  const input = revisionSchema.parse(req.body);
  // Always DRAFT. Publication is handled only by lesson-review.routes.ts (ACA-008, ACA-026).
  const result = await createDraftRevision({ sourceId: param(req, "sourceId"), body: input.body, expectedVersion: input.expectedVersion, actorId: req.user!.userId });
  sendSuccess(res, result, "Revision drafted", 201);
}));
// POST /revisions/:id/publish now lives in lesson-review.routes.ts and runs the publication gate.
router.post("/tracks", ...editor, run(async (req, res) => {
  sendSuccess(res, await prisma.academyCurriculumTrack.create({ data: trackSchema.parse(req.body) }), "Track created", 201);
}));
router.get("/tracks/:slug", ...editor, run(async (req, res) => {
  const track = await prisma.academyCurriculumTrack.findUnique({ where: { slug: param(req, "slug") }, include: { placements: { orderBy: { position: "asc" }, include: { lesson: true, revision: true } } } });
  if (!track) throw new NotFoundError("Track not found");
  sendSuccess(res, track);
}));
router.post("/tracks/:slug/placements", ...editor, run(async (req, res) => {
  const input = placementSchema.parse(req.body);
  const result = await prisma.$transaction(async (tx) => {
    const track = await tx.academyCurriculumTrack.findUnique({ where: { slug: param(req, "slug") } });
    const lesson = await tx.academyContentLesson.findUnique({ where: { sourceId: input.sourceId } });
    if (!track || !lesson) throw new NotFoundError("Track or lesson not found");
    if (track.status !== "DRAFT") throw new ForbiddenError("Track is locked");
    if (input.revisionId) {
      const revision = await tx.academyLessonRevision.findUnique({ where: { id: input.revisionId } });
      if (!revision || revision.lessonId !== lesson.id || revision.status !== "PUBLISHED") throw new ForbiddenError("Revision must be published and belong to lesson");
    }
    return tx.academyLessonPlacement.create({ data: { trackId: track.id, lessonId: lesson.id, revisionId: input.revisionId, position: input.position, required: input.required } });
  });
  sendSuccess(res, result, "Lesson placed", 201);
}));
router.post("/tracks/:slug/publish", ...editor, run(async (req, res) => {
  const result = await prisma.$transaction(async (tx) => {
    const track = await tx.academyCurriculumTrack.findUnique({ where: { slug: param(req, "slug") }, include: { placements: { include: { revision: true } } } });
    if (!track) throw new NotFoundError("Track not found");
    if (!track.placements.length || track.placements.some((p) => p.revision?.status !== "PUBLISHED")) throw new ForbiddenError("Pin published revisions for every placement");
    return tx.academyCurriculumTrack.update({ where: { id: track.id }, data: { status: "PUBLISHED" } });
  });
  sendSuccess(res, result);
}));
// Course composition references canonical tracks; original course modules remain intact.
const courseTrackInput = z.object({ trackSlug: z.string().min(1), position: z.number().int().positive(), required: z.boolean().default(true) });
router.post("/courses/:courseId/tracks", ...editor, run(async (req, res) => {
  const input = courseTrackInput.parse(req.body);
  const actor = req.user!;
  const courseId = param(req, "courseId");
  // The ownership check and the attachment share one transaction, so the course cannot change owner or be
  // soft-deleted between the check and the write. Rules match assertCourseOwnership in courses/course.service.ts:
  // soft-deleted courses are not found, and only ADMIN or the course's teacher may attach a track.
  const placement = await prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new NotFoundError("Course not found");
    if (actor.role !== "ADMIN" && course.teacherId !== actor.userId) throw new ForbiddenError("You do not own this course");
    const track = await tx.academyCurriculumTrack.findUnique({ where: { slug: input.trackSlug } });
    if (!track || track.status !== "PUBLISHED") throw new ForbiddenError("Track must be published");
    return tx.academyCourseTrack.create({ data: { courseId: course.id, trackId: track.id, position: input.position, required: input.required } });
  });
  sendSuccess(res, placement, "Track attached", 201);
}));
router.get("/courses/:courseId/outline", authenticate, run(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: param(req, "courseId") } });
  if (!course) throw new NotFoundError("Course not found");
  if (!course.isPublished) throw new ForbiddenError("Course is not published");
  const learnerId = (req as Request & { user?: { userId?: string } }).user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: learnerId, courseId: course.id, status: { in: ["ACTIVE", "COMPLETED"] } },
    select: { id: true, licenceTrack: true },
  });
  if (!enrollment) throw new ForbiddenError("Active course enrolment required");
  const tracks = await prisma.academyCourseTrack.findMany({ where: { courseId: course.id, track: { status: "PUBLISHED" } }, orderBy: { position: "asc" }, include: { track: { include: { placements: { orderBy: { position: "asc" }, include: { lesson: true, revision: true } } } } } });
  // Level gate: a locked lesson stays listed with its reason. The outline carries titles and lock status only.
  // Lesson text comes from the protected body endpoint, so no body, objective or assessment text is sent here.
  const lockFor = await resolveLevelLocks({ userId: learnerId, role: req.user?.role ?? "" });
  // The learner's organisation selection (else the course-wide default) lists only the chosen lessons. With none, the full list stays.
  const selected = await loadSavedSelection(course.id, learnerId);
  // Licence track: the saved enrolment track. ?track= is ignored for a learner (staff keep the preview). Lessons the track excludes are left out of the list entirely.
  const track = resolveLicenceTrack({ queryTrack: req.query.track, enrolment: enrollment, staffPreview: await isLevelGateExempt({ userId: learnerId, role: req.user?.role ?? "" }) });
  const licence = await licenceIndexForTrack(track);
  const outlineRevision = (revision: NonNullable<(typeof tracks)[number]["track"]["placements"][number]["revision"]>) =>
    ({ id: revision.id, lessonId: revision.lessonId, version: revision.version, status: revision.status, contentHash: revision.contentHash, publishedAt: revision.publishedAt });
  const visible = (p: (typeof tracks)[number]["track"]["placements"][number]) =>
    (!p.revision || p.revision.status === "PUBLISHED") && (!selected || selected.has(p.lesson.sourceId)) && !licenceTrackExcludes(track, licenceStatusOf(licence, p.lesson.sourceId));
  sendSuccess(res, { courseId: course.id, licenceTrack: track, tracks: tracks.map(t => ({ ...t, track: { ...t.track, placements: t.track.placements.filter(visible).map(p => { const levelLock = lockFor(course.slug, p.lesson.sourceId); return { ...p, lesson: { id: p.lesson.id, sourceId: p.lesson.sourceId, title: p.lesson.title }, levelLock, licence: licenceNoticeOf(licence, p.lesson.sourceId), revision: p.revision ? outlineRevision(p.revision) : null }; }) } })) });
}));
// Licence track summary for the course profile page, before enrolment. Counts, the excluded lessons with their reason,
// and the limited lessons. Titles and licence wording only: no lesson body, and no learner data.
router.get("/courses/:courseId/licence-tracks", run(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: param(req, "courseId") } });
  if (!course || !course.isPublished) throw new NotFoundError("Course");
  const courseTracks = await prisma.academyCourseTrack.findMany({ where: { courseId: course.id, track: { status: "PUBLISHED" } }, include: { track: { include: { placements: { include: { lesson: true, revision: true } } } } } });
  const lessons = courseTracks.flatMap(ct => ct.track.placements)
    .filter(p => !p.revision || p.revision.status === "PUBLISHED")
    .map(p => ({ sourceId: p.lesson.sourceId, title: p.lesson.title }));
  // The non-licensed count depends on the licence file, so an unreadable file is refused rather than counted as all included.
  const index = await licenceIndexForTrack("non-licensed");
  sendSuccess(res, { courseId: course.id, defaultTrack: "non-licensed", ...summariseLicenceTracks(lessons, index) });
}));
// Lesson text from the curriculum files (paywalled). Same enrolment, selection and level rules as the outline.
// The lesson must be placed in this course with a published revision, so the file alone grants nothing.
// Knowledge-check grading stays on that revision and its server-side answer keys.
router.get("/courses/:courseId/lessons/:lessonId/body", authenticate, run(async (req, res) => {
  const learnerId = req.user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  const courseId = param(req, "courseId");
  const sourceId = param(req, "lessonId");
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new NotFoundError("Course not found");
  if (!course.isPublished) throw new ForbiddenError("Course is not published");
  await assertEnrolled(learnerId, course.id);
  const activeEnrolment = await prisma.enrollment.findFirst({ where: { studentId: learnerId, courseId: course.id, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { id: true, licenceTrack: true } });
  if (!activeEnrolment) throw new ForbiddenError("Active course enrolment required");
  // The saved track only. ?track= cannot unlock a licence-required body for a learner (staff keep the preview).
  const track = resolveLicenceTrack({ queryTrack: req.query.track, enrolment: activeEnrolment, staffPreview: await isLevelGateExempt({ userId: learnerId, role: req.user?.role ?? "" }) });
  const file = await getFileLesson(sourceId);
  if (!file) throw new NotFoundError("Lesson");
  const selected = await loadSavedSelection(course.id, learnerId);
  if (selected && !selected.has(sourceId)) throw new NotFoundError("Lesson");
  const courseTracks = await prisma.academyCourseTrack.findMany({ where: { courseId: course.id, track: { status: "PUBLISHED" } }, include: { track: { include: { placements: { include: { lesson: true, revision: true } } } } } });
  const placement = courseTracks.flatMap(ct => ct.track.placements).find(p => p.lesson.sourceId === sourceId && p.revision?.status === "PUBLISHED");
  if (!placement?.revision) throw new NotFoundError("Lesson");
  // Licence track: a lesson the chosen track leaves out is refused, so its body cannot be fetched by any other route.
  const licence = await licenceIndexForTrack(track);
  assertLicenceTrackAllows(track, licenceStatusOf(licence, sourceId));
  // Level gate, keyed by the database lesson ID exactly as the completion and attempt routes use it. Staff are exempt there.
  await assertLessonOpen({ userId: learnerId, role: req.user?.role ?? "" }, placement.lesson.id);
  // The learner sees the file's checks and grading uses the revision's checks, so option positions must match. Otherwise refuse.
  if (!knowledgeChecksAgree(file.body, placement.revision.body)) throw new AppError("This lesson's knowledge check is out of step with its published revision. Please contact your training administrator.", 409);
  // Serve only the approved revision. Its stored body must still hash to the stored revision hash; the live file is never served.
  if (contentHashOf(placement.revision.body) !== placement.revision.contentHash) throw new AppError("This lesson's published content failed its integrity check. Please contact your training administrator.", 409);
  res.setHeader("Cache-Control", "private, no-store");
  sendSuccess(res, publicLessonBody(placement.revision.body));
}));

// Admin-only preview of a lesson's latest revision, draft or unapproved, under the admin login. The path takes the lesson's
// sourceId, as the other lesson routes do. The response is the learner view (answer material stripped) with
// preview: true and the review status. It approves, publishes and changes nothing; learners cannot reach it.
router.get("/preview/lessons/:lessonId", authenticate, requireRole("ADMIN"), run(async (req, res) => {
  const actorId = req.user!.userId;
  const preview = await previewLatestRevision(param(req, "lessonId"), actorId);
  res.setHeader("Cache-Control", "private, no-store");
  sendSuccess(res, { ...preview, body: publicLessonBody(preview.body) });
}));
// Learner progress through the shared lessons of one course. Enrolment rules match enrollment.service.
router.get("/courses/:courseId/progress/me", authenticate, run(async (req, res) => {
  const learnerId = req.user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  const courseId = param(req, "courseId");
  await assertEnrolled(learnerId, courseId);
  const enrolment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: learnerId, courseId } }, select: { licenceTrack: true } });
  // The saved track only, as the outline and body. Counts follow it, so excluded lessons are not counted. Staff keep the preview.
  const track = resolveLicenceTrack({ queryTrack: req.query.track, enrolment, staffPreview: await isLevelGateExempt({ userId: learnerId, role: req.user?.role ?? "" }) });
  const licence = await licenceIndexForTrack(track);
  sendSuccess(res, await buildCourseLessonProgress(courseId, learnerId, { excludeSourceId: (sourceId) => licenceTrackExcludes(track, licenceStatusOf(licence, sourceId)) }));
}));
router.post("/completions", authenticate, run(async (req, res) => {
  const input = z.object({ lessonId: z.string().min(1), revisionId: z.string().min(1) }).parse(req.body);
  const learnerId = (req as Request & { user?: { userId?: string } }).user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  const revision = await prisma.academyLessonRevision.findUnique({ where: { id: input.revisionId } });
  if (!revision || revision.lessonId !== input.lessonId || revision.status !== "PUBLISHED") throw new ForbiddenError("Published matching revision required");
  const enrolments = await prisma.enrollment.findMany({ where: { studentId: learnerId, status: "ACTIVE", course: { isPublished: true } }, select: { courseId: true, licenceTrack: true } });
  const assigning = await prisma.academyCourseTrack.findMany({ where: { track: { status: "PUBLISHED", placements: { some: { lessonId: input.lessonId, revisionId: input.revisionId } } }, courseId: { in: enrolments.map(e => e.courseId) } }, select: { courseId: true } });
  if (!assigning.length) throw new ForbiddenError("Lesson revision is not assigned through an active enrolled course");
  // Licence track: the learner's saved track in each enrolled course that assigns this lesson. The URL track is not used here.
  // The lesson is refused only when every such enrolment excludes it.
  const assigningIds = new Set(assigning.map(a => a.courseId));
  const savedTracks = enrolments.filter(e => assigningIds.has(e.courseId)).map(e => savedLicenceTrack(e.licenceTrack));
  const lesson = await prisma.academyContentLesson.findUnique({ where: { id: input.lessonId }, select: { sourceId: true } });
  if (!lesson) throw new NotFoundError("Lesson");
  // Only the non-licensed track reads the licence file, so the file is needed only when a non-licensed enrolment exists.
  const licence = await licenceIndexForTrack(savedTracks.includes("non-licensed") ? "non-licensed" : "licensed");
  const status = licenceStatusOf(licence, lesson.sourceId);
  if (!savedTracks.some(track => !licenceTrackExcludes(track, status))) throw licenceTrackExclusionError("non-licensed");
  await assertLessonOpen({ userId: learnerId, role: req.user?.role ?? "" }, input.lessonId);
  // Completion is a learning acknowledgement, not an assessed competency or credential.
  const completion = await prisma.academyLearnerCompletion.upsert({ where: { learnerId_lessonId_revisionId: { learnerId, lessonId: input.lessonId, revisionId: input.revisionId } }, create: { learnerId, lessonId: input.lessonId, revisionId: input.revisionId }, update: {} });
  sendSuccess(res, completion);
}));
// The caller's own level status across every enrolled course. There is no learner parameter, so no other learner can be requested.
router.get("/levels/me", authenticate, run(async (req, res) => {
  const learnerId = req.user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  const { levels, ungatedLessonCount } = await getLearnerLevelView(learnerId);
  sendSuccess(res, { levels, ungatedLessonCount });
}));
router.get("/completions/me", authenticate, run(async (req, res) => {
  const learnerId = (req as Request & { user?: { userId?: string } }).user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  sendSuccess(res, await prisma.academyLearnerCompletion.findMany({ where: { learnerId }, orderBy: { completedAt: "desc" } }));
}));

// The learner-visible part of each knowledge check (no answer data). Two bodies agree only when these match in order.
function learnerKnowledgeChecks(body: unknown): unknown[] {
  return knowledgeCheckList(body).map(question => {
    const item = (question && typeof question === "object" ? question : {}) as Record<string, unknown>;
    return { id: item.id, question: item.question, options: item.options };
  });
}
export function knowledgeChecksAgree(fileBody: unknown, revisionBody: unknown): boolean {
  return JSON.stringify(learnerKnowledgeChecks(fileBody)) === JSON.stringify(learnerKnowledgeChecks(revisionBody));
}

// Knowledge-check keys must never be delivered to the learner through course outlines.
/**
 * Snapshot hash over the resolved business fields and the rendered body. Postgres jsonb does not keep object key
 * order, so the fields are hashed in sorted key order: the hash taken at presentation must match the one
 * recomputed from the stored (jsonb) fields on read. Body key order is already fixed by the revision's jsonb.
 */
export function snapshotContentHash(revisionId: string, fields: Record<string, unknown>, body: unknown): string {
  const sortedFields = Object.fromEntries(Object.keys(fields).sort().map(key => [key, fields[key]]));
  return createHash("sha256").update(JSON.stringify({ revisionId, fields: sortedFields, body })).digest("hex");
}

export function publicLessonBody(body: unknown): unknown {
  // Recursively strip assessment keys, including nested sections and legacy formats.
  // Only server-side grading is permitted to access answer material.
  const secret = new Set(["correctIndex", "correctAnswer", "correctAnswers", "answerKey", "answer", "isCorrect", "explanation", "rationale", "feedbackCorrect", "feedbackIncorrect"]);
  function strip(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(strip);
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !secret.has(key))
      .map(([key, item]) => [key, strip(item)]));
  }
  return strip(body);
}

const attemptInput = z.object({ lessonId: z.string().min(1), revisionId: z.string().min(1), answers: z.array(z.number().int().min(0)).min(1).max(50) });
router.post("/knowledge-checks/attempts", authenticate, run(async (req, res) => {
  const input = attemptInput.parse(req.body);
  const learnerId = (req as Request & { user?: { userId?: string } }).user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  const revision = await prisma.academyLessonRevision.findUnique({ where: { id: input.revisionId } });
  if (!revision || revision.lessonId !== input.lessonId || revision.status !== "PUBLISHED") throw new ForbiddenError("Published matching revision required");
  await assertLessonOpen({ userId: learnerId, role: req.user?.role ?? "" }, input.lessonId);
  const enrollments = await prisma.enrollment.findMany({ where: { studentId: learnerId, status: "ACTIVE", course: { isPublished: true } }, select: { courseId: true } });
  const eligible = await prisma.academyCourseTrack.findFirst({ where: { courseId: { in: enrollments.map(e => e.courseId) }, track: { status: "PUBLISHED", placements: { some: { lessonId: input.lessonId, revisionId: input.revisionId } } } } });
  if (!eligible) throw new ForbiddenError("Knowledge check is not assigned through an active enrolled course");
  // Answer keys are server-side only (academy_knowledge_answer_keys, per revision and check ID). The stored body never holds one.
  const questions = knowledgeCheckList(revision.body) as Array<Record<string, unknown>>;
  if (!questions.length || questions.length > 50 || questions.length !== input.answers.length) throw new ForbiddenError("Answer count does not match the knowledge check");
  const valid = questions.every(q => q && typeof q === "object" && typeof q.id === "string" && Array.isArray(q.options) && q.options.length >= 2);
  if (!valid || !questions.every((q, i) => input.answers[i] < (q.options as unknown[]).length)) throw new ForbiddenError("Invalid knowledge-check questions or answers");
  const keyRows = await prisma.academyKnowledgeAnswerKey.findMany({ where: { revisionId: revision.id, checkId: { in: questions.map(q => q.id as string) } } });
  const keys = new Map(keyRows.map(row => [row.checkId, row]));
  // Fail closed: a check with no loaded key cannot be graded, so the attempt is refused rather than scored as wrong.
  const keyed = questions.every(q => {
    const key = keys.get(q.id as string);
    return key !== undefined && key.correctIndex < (q.options as unknown[]).length;
  });
  if (!keyed) throw new AppError("This knowledge check is not ready to be graded. Please contact your training administrator.", 409);
  const score = questions.filter((q, i) => keys.get(q.id as string)!.correctIndex === input.answers[i]).length;
  const total = questions.length;
  const passed = score / total >= 0.8;
  const attempt = await prisma.academyKnowledgeAttempt.create({ data: { learnerId, lessonId: input.lessonId, revisionId: input.revisionId, answers: input.answers, score, total, passed } });
  sendSuccess(res, { id: attempt.id, score, total, passed, createdAt: attempt.createdAt });
}));
router.get("/knowledge-checks/attempts/me", authenticate, run(async (req, res) => {
  const learnerId = (req as Request & { user?: { userId?: string } }).user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  sendSuccess(res, await prisma.academyKnowledgeAttempt.findMany({ where: { learnerId }, select: { id: true, lessonId: true, revisionId: true, score: true, total: true, passed: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 }));
}));

// Practical evidence is not a verified competency until an authorised assessor reviews it.
const evidenceInput = z.object({ companyId: z.string().min(1), lessonId: z.string().min(1), revisionId: z.string().min(1), description: z.string().min(20).max(5000), evidenceUrls: z.array(z.string().url().refine(u => new URL(u).protocol === "https:")).min(1).max(10) });
router.post("/practical-evidence", authenticate, run(async (req, res) => {
  const input = evidenceInput.parse(req.body);
  const learnerId = req.user?.userId;
  if (!learnerId) throw new ForbiddenError("Authenticated learner required");
  const revision = await prisma.academyLessonRevision.findFirst({ where: { id: input.revisionId, lessonId: input.lessonId, status: "PUBLISHED" } });
  if (!revision) throw new ForbiddenError("Published lesson revision required");
  const enrolled = await prisma.enrollment.findMany({ where: { studentId: learnerId, status: "ACTIVE", course: { isPublished: true } }, select: { courseId: true } });
  const assignedCourses = await prisma.academyTrainingAssignment.findMany({
    where: { companyId: input.companyId, learnerId, status: "ASSIGNED", courseId: { in: enrolled.map(e => e.courseId) } },
    select: { courseId: true },
  });
  const eligible = await prisma.academyCourseTrack.findFirst({ where: {
    courseId: { in: assignedCourses.map(a => a.courseId) },
    track: { status: "PUBLISHED", placements: { some: { lessonId: input.lessonId, revisionId: input.revisionId } } },
  } });
  if (!eligible) throw new ForbiddenError("No active organisation-assigned course contains this practical assessment");
  const membership = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId: input.companyId, userId: learnerId } } });
  if (!membership) throw new ForbiddenError("Learner must belong to the evidence organisation");
  const record = await prisma.academyPracticalEvidence.create({ data: { ...input, learnerId } });
  sendSuccess(res, record, "Evidence submitted for assessor review", 201);
}));
router.get("/practical-evidence/me", authenticate, run(async (req, res) => {
  if (!req.user?.userId) throw new ForbiddenError("Authenticated learner required");
  sendSuccess(res, await prisma.academyPracticalEvidence.findMany({ where: { learnerId: req.user.userId }, orderBy: { createdAt: "desc" }, take: 100 }));
}));
// Evidence review must be scoped to an organisation and its authorised assessor.
const assessorMembership = async (companyId: string, userId: string) => {
  const member = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId } } });
  if (!member || !["OWNER", "MANAGER", "ASSESSOR"].includes(member.role)) throw new ForbiddenError("Organisation assessor membership required");
  return member;
};
// Same account rule as the authenticate middleware: active, email verified and not soft-deleted.
const activeAccountWhere = { isActive: true, isEmailVerified: true, deletedAt: null };
export const isActiveAccount = (user: { isActive: boolean; isEmailVerified: boolean; deletedAt: Date | null } | null) =>
  Boolean(user && user.isActive && user.isEmailVerified && !user.deletedAt);
router.get("/companies/:companyId/practical-evidence/pending", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await assessorMembership(param(req, "companyId"), userId);
  const learnerIds = (await prisma.companyMember.findMany({ where: { companyId: param(req, "companyId"), user: activeAccountWhere }, select: { userId: true } })).map(m => m.userId);
  sendSuccess(res, await prisma.academyPracticalEvidence.findMany({ where: { status: "PENDING", companyId: param(req, "companyId"), learnerId: { in: learnerIds, not: userId } }, orderBy: { createdAt: "asc" }, take: 100 }));
}));
router.post("/companies/:companyId/practical-evidence/:id/review", authenticate, run(async (req, res) => {
  const input = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), feedback: z.string().min(10).max(5000), expiresAt: z.coerce.date().optional() }).parse(req.body);
  if (input.decision === "APPROVED" && input.expiresAt && input.expiresAt <= new Date()) {
    throw new ForbiddenError("Competency expiry must be in the future");
  }
  if (input.decision === "REJECTED" && input.expiresAt) {
    throw new ForbiddenError("Rejected evidence cannot create an expiring competency");
  }
  const assessorId = req.user?.userId;
  if (!assessorId) throw new ForbiddenError("Authentication required");
  const companyId = param(req, "companyId");
  await assessorMembership(companyId, assessorId);
  const result = await prisma.$transaction(async tx => {
    const evidence = await tx.academyPracticalEvidence.findUnique({ where: { id: param(req, "id") } });
    if (!evidence || evidence.companyId !== companyId || evidence.status !== "PENDING" || evidence.learnerId === assessorId) throw new ForbiddenError("Pending evidence from another learner required");
    const learnerMember = await tx.companyMember.findUnique({ where: { companyId_userId: { companyId, userId: evidence.learnerId } } });
    if (!learnerMember) throw new ForbiddenError("Learner does not belong to this organisation");
    // Inactive or soft-deleted learners cannot be reviewed, so no competency can be awarded to them.
    const learnerAccount = await tx.user.findUnique({ where: { id: evidence.learnerId }, select: { isActive: true, isEmailVerified: true, deletedAt: true } });
    if (!isActiveAccount(learnerAccount)) throw new ForbiddenError("Learner account is inactive or unavailable");
    const updated = await tx.academyPracticalEvidence.updateMany({ where: { id: evidence.id, companyId, status: "PENDING" }, data: { status: input.decision, assessorId, assessorFeedback: input.feedback, reviewedAt: new Date() } });
    if (updated.count !== 1) throw new ForbiddenError("Evidence already reviewed");
    if (input.decision === "APPROVED") {
      // ACA-013: re-read the approved row inside the transaction and refuse any award that does not trace to it.
      const approved = await tx.academyPracticalEvidence.findUnique({ where: { id: evidence.id } });
      assertCompetencyAwardable(approved, assessorId);
      await tx.academyVerifiedCompetency.create({ data: { companyId, learnerId: evidence.learnerId, lessonId: evidence.lessonId, revisionId: evidence.revisionId, evidenceId: approved.id, assessorId, expiresAt: input.expiresAt } });
    }
    return tx.academyPracticalEvidence.findUnique({ where: { id: evidence.id } });
  });
  sendSuccess(res, result);
}));
router.get("/companies/:companyId/skills/:learnerId", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  const companyId = param(req, "companyId");
  const member = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId } } });
  if (!member || (userId !== param(req, "learnerId") && !["OWNER", "MANAGER", "ASSESSOR"].includes(member.role))) throw new ForbiddenError("Skills passport access denied");
  const learnerMember = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId: param(req, "learnerId") } } });
  if (!learnerMember) throw new ForbiddenError("Learner is not a member of this organisation");
  sendSuccess(res, await prisma.academyVerifiedCompetency.findMany({ where: { companyId, learnerId: param(req, "learnerId") }, orderBy: { verifiedAt: "desc" } }));
}));

// A separate active-only view prevents expired competencies being mistaken for current authorisations.
// Historical records remain available through the full skills-passport endpoint.
router.get("/companies/:companyId/skills/:learnerId/active", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  const companyId = param(req, "companyId");
  const learnerId = param(req, "learnerId");
  const viewer = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId } } });
  if (!viewer || (userId !== learnerId && !["OWNER", "MANAGER", "ASSESSOR"].includes(viewer.role))) {
    throw new ForbiddenError("Active skills access denied");
  }
  const learner = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId: learnerId } } });
  if (!learner) throw new ForbiddenError("Learner is not a member of this organisation");
  const now = new Date();
  const skills = await prisma.academyVerifiedCompetency.findMany({
    where: { companyId, learnerId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    orderBy: { verifiedAt: "desc" },
  });
  sendSuccess(res, { asOf: now.toISOString(), skills });
}));

// Tenant-scoped training management: membership is checked for EVERY read and write.
const orgManagerRoles = ["OWNER", "MANAGER"];
const managerMembership = async (companyId: string, userId: string) => {
  const member = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId } } });
  if (!member || !orgManagerRoles.includes(member.role)) throw new ForbiddenError("Organisation manager membership required");
  return member;
};
router.post("/companies", ...editor, run(async (req, res) => {
  const input = z.object({ name: z.string().min(3).max(160) }).parse(req.body);
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  const company = await prisma.$transaction(async tx => {
    const org = await tx.company.create({ data: { name: input.name } });
    await tx.companyMember.create({ data: { companyId: org.id, userId, role: "OWNER" } });
    return org;
  });
  sendSuccess(res, company, "Organisation created", 201);
}));
router.get("/companies/me", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  sendSuccess(res, await prisma.companyMember.findMany({ where: { userId }, include: { company: true } }));
}));
router.post("/companies/:companyId/members", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await managerMembership(param(req, "companyId"), userId);
  const input = z.object({ userId: z.string().min(1), role: z.enum(["MANAGER", "ASSESSOR", "LEARNER"]) }).parse(req.body);
  // A missing, inactive or soft-deleted target gets the same refusal, so membership cannot be granted to an unavailable account.
  const target = await prisma.user.findUnique({ where: { id: input.userId }, select: { isActive: true, isEmailVerified: true, deletedAt: true } });
  if (!isActiveAccount(target)) throw new ForbiddenError("Target user is inactive or unavailable");
  // A duplicate membership raises Prisma P2002, which the error handler returns as 409.
  const member = await prisma.companyMember.create({ data: { companyId: param(req, "companyId"), ...input } });
  sendSuccess(res, member, "Member added", 201);
}));
router.post("/companies/:companyId/assignments", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await managerMembership(param(req, "companyId"), userId);
  const input = z.object({ learnerId: z.string().min(1), courseId: z.string().min(1), dueAt: z.coerce.date().optional() }).parse(req.body);
  const member = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId: param(req, "companyId"), userId: input.learnerId } } });
  if (!member) throw new ForbiddenError("Learner is not a member of this organisation");
  // Same account rule as the lesson-body and integration routes: no assignment for an inactive, unverified or deleted learner.
  const learnerAccount = await prisma.user.findUnique({ where: { id: input.learnerId }, select: { isActive: true, isEmailVerified: true, deletedAt: true } });
  if (!isActiveAccount(learnerAccount)) throw new ForbiddenError("Learner account is inactive or unavailable");
  const course = await prisma.course.findUnique({ where: { id: input.courseId } });
  if (!course || !course.isPublished) throw new ForbiddenError("Published course required");
  const assignment = await prisma.$transaction(async tx => {
    await tx.enrollment.upsert({ where: { studentId_courseId: { studentId: input.learnerId, courseId: input.courseId } }, create: { studentId: input.learnerId, courseId: input.courseId, status: "ACTIVE" }, update: {} });
    return tx.academyTrainingAssignment.upsert({ where: { companyId_learnerId_courseId: { companyId: param(req, "companyId"), learnerId: input.learnerId, courseId: input.courseId } }, create: { companyId: param(req, "companyId"), learnerId: input.learnerId, courseId: input.courseId, assignedById: userId, dueAt: input.dueAt }, update: { dueAt: input.dueAt, status: "ASSIGNED" } });
  });
  sendSuccess(res, assignment);
}));
router.get("/companies/:companyId/assignments", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await managerMembership(param(req, "companyId"), userId);
  sendSuccess(res, await prisma.academyTrainingAssignment.findMany({ where: { companyId: param(req, "companyId") }, orderBy: { createdAt: "desc" }, take: 100 }));
}));
router.get("/assignments/me", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  sendSuccess(res, await prisma.academyTrainingAssignment.findMany({ where: { learnerId: userId, company: { memberships: { some: { userId } } } }, orderBy: { createdAt: "desc" }, take: 100 }));
}));


// Business lesson context: manager-controlled values, learner-scoped delivery, immutable snapshots.
const businessValueInput = z.object({ value: z.union([z.string().max(8000), z.number(), z.boolean(), z.array(z.string().max(1000)).max(100)]), sourceSystem: z.string().max(80).optional(), sourceRecordRef: z.string().max(160).optional() });
const requireOrgMember = async (companyId: string, userId: string) => {
  const member = await prisma.companyMember.findUnique({ where: { companyId_userId: { companyId, userId } } });
  if (!member) throw new ForbiddenError("Organisation membership required");
  return member;
};
router.get("/business-fields/registry", authenticate, run(async (_req, res) => {
  sendSuccess(res, { keys: BUSINESS_LESSON_FIELDS });
}));
router.get("/companies/:companyId/business-fields", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await managerMembership(param(req, "companyId"), userId);
  sendSuccess(res, await prisma.academyBusinessLessonField.findMany({ where: { companyId: param(req, "companyId") }, orderBy: { fieldKey: "asc" } }));
}));
router.put("/companies/:companyId/business-fields/:fieldKey", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await managerMembership(param(req, "companyId"), userId);
  const companyId = param(req, "companyId");
  const fieldKey = param(req, "fieldKey");
  if (!isBusinessLessonFieldKey(fieldKey)) throw new ForbiddenError("Unrecognised business lesson field");
  const input = businessValueInput.parse(req.body);
  const field = await prisma.academyBusinessLessonField.upsert({
    where: { companyId_fieldKey: { companyId, fieldKey } },
    create: { companyId, fieldKey, value: input.value, sourceSystem: input.sourceSystem, sourceRecordRef: input.sourceRecordRef, status: "DRAFT" },
    update: { value: input.value, sourceSystem: input.sourceSystem, sourceRecordRef: input.sourceRecordRef, status: "DRAFT", approvedById: null, approvedAt: null, revision: { increment: 1 } },
  });
  sendSuccess(res, field);
}));
router.post("/companies/:companyId/business-fields/:fieldKey/approve", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await managerMembership(param(req, "companyId"), userId);
  if (!isBusinessLessonFieldKey(param(req, "fieldKey"))) throw new ForbiddenError("Unrecognised field");
  const result = await prisma.academyBusinessLessonField.updateMany({ where: { companyId: param(req, "companyId"), fieldKey: param(req, "fieldKey"), status: "DRAFT" }, data: { status: "APPROVED", approvedById: userId, approvedAt: new Date() } });
  if (!result.count) throw new ForbiddenError("Draft field not found");
  sendSuccess(res, { approved: true });
}));
router.post("/companies/:companyId/business-fields/:fieldKey/retire", authenticate, run(async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) throw new ForbiddenError("Authentication required");
  await managerMembership(param(req, "companyId"), userId);
  if (!isBusinessLessonFieldKey(param(req, "fieldKey"))) throw new ForbiddenError("Unrecognised field");
  const result = await prisma.academyBusinessLessonField.updateMany({ where: { companyId: param(req, "companyId"), fieldKey: param(req, "fieldKey") }, data: { status: "RETIRED", approvedAt: null, approvedById: null } });
  if (!result.count) throw new NotFoundError("Business field not found");
  sendSuccess(res, { retired: true });
}));
// POST ensures a new immutable snapshot is recorded for each presentation.
router.post("/companies/:companyId/lessons/:revisionId/context", authenticate, run(async (req, res) => {
  const learnerId = req.user?.userId;
  if (!learnerId) throw new ForbiddenError("Authentication required");
  const companyId = param(req, "companyId");
  await requireOrgMember(companyId, learnerId);
  const revision = await prisma.academyLessonRevision.findUnique({ where: { id: param(req, "revisionId") } });
  if (!revision || revision.status !== "PUBLISHED") throw new NotFoundError("Published lesson revision not found");
  await assertLessonOpen({ userId: learnerId, role: req.user?.role ?? "" }, revision.lessonId);
  const assignment = await prisma.academyTrainingAssignment.findFirst({ where: { companyId, learnerId, course: { isPublished: true }, status: { in: ["ASSIGNED", "IN_PROGRESS", "COMPLETED"] }, courseId: { in: (await prisma.academyCourseTrack.findMany({ where: { track: { status: "PUBLISHED", placements: { some: { lessonId: revision.lessonId, revisionId: revision.id } } } }, select: { courseId: true } })).map(t => t.courseId) } }, select: { courseId: true } });
  if (!assignment) throw new ForbiddenError("Lesson not assigned to learner by this organisation");
  const enrollment = await prisma.enrollment.findFirst({ where: { courseId: assignment.courseId, studentId: learnerId, status: "ACTIVE" }, select: { id: true } });
  if (!enrollment) throw new ForbiddenError("Active course enrolment required");
  const records = await prisma.academyBusinessLessonField.findMany({ where: { companyId, status: "APPROVED" } });
  const fields = resolveApprovedBusinessFields(records);
  const publicBody = publicLessonBody(revision.body);
  const render = (value: unknown): unknown => {
    if (typeof value === "string") return resolveLessonText(value, fields);
    if (Array.isArray(value)) return value.map(render);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, render(item)]));
    return value;
  };
  const body = render(publicBody);
  const contentHash = snapshotContentHash(revision.id, fields, body);
  const snapshot = await prisma.academyLessonContextSnapshot.create({ data: { companyId, learnerId, lessonRevisionId: revision.id, resolvedFields: JSON.parse(JSON.stringify(fields)), contentHash } });
  sendSuccess(res, { lessonRevisionId: revision.id, body, contextSnapshotId: snapshot.id, contentHash });
}));

// List only the caller's historical presentations. Never return raw business
// field values in list responses; full content requires a scoped detail read.
const snapshotListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().min(1).max(160).optional(),
  revisionId: z.string().min(1).max(160).optional(),
});
router.get("/companies/:companyId/lesson-context-snapshots", authenticate, run(async (req, res) => {
  const learnerId = req.user?.userId;
  if (!learnerId) throw new ForbiddenError("Authentication required");
  const companyId = param(req, "companyId");
  await requireOrgMember(companyId, learnerId);
  const query = snapshotListQuery.parse(req.query);
  // A cursor must belong to this same learner and organisation. This prevents
  // cross-tenant cursor probing and avoids revealing other users' row IDs.
  if (query.cursor) {
    const ownedCursor = await prisma.academyLessonContextSnapshot.findFirst({
      where: { id: query.cursor, companyId, learnerId, ...(query.revisionId ? { lessonRevisionId: query.revisionId } : {}) },
      select: { id: true },
    });
    if (!ownedCursor) throw new NotFoundError("Lesson context snapshot cursor not found");
  }
  const rows = await prisma.academyLessonContextSnapshot.findMany({
    where: { companyId, learnerId, ...(query.revisionId ? { lessonRevisionId: query.revisionId } : {}) },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    select: { id: true, lessonRevisionId: true, createdAt: true, contentHash: true },
  });
  const hasMore = rows.length > query.limit;
  const items = rows.slice(0, query.limit).map(row => ({
    contextSnapshotId: row.id,
    lessonRevisionId: row.lessonRevisionId,
    presentedAt: row.createdAt,
    contentHash: row.contentHash,
  }));
  sendSuccess(res, { items, nextCursor: hasMore ? items[items.length - 1].contextSnapshotId : null });
}));

// Historical snapshot reads never use today's business-field values. Only the
// learner who saw the lesson can retrieve their organisation-scoped evidence.
router.get("/companies/:companyId/lesson-context-snapshots/:snapshotId", authenticate, run(async (req, res) => {
  const learnerId = req.user?.userId;
  if (!learnerId) throw new ForbiddenError("Authentication required");
  const companyId = param(req, "companyId");
  await requireOrgMember(companyId, learnerId);
  const snapshot = await prisma.academyLessonContextSnapshot.findFirst({
    where: { id: param(req, "snapshotId"), companyId, learnerId },
  });
  if (!snapshot) throw new NotFoundError("Lesson context snapshot not found");
  const revision = await prisma.academyLessonRevision.findUnique({ where: { id: snapshot.lessonRevisionId } });
  if (!revision) throw new NotFoundError("Lesson revision unavailable");
  const fields = snapshot.resolvedFields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) throw new ForbiddenError("Invalid snapshot fields");
  const render = (value: unknown): unknown => {
    if (typeof value === "string") return resolveLessonText(value, fields as Record<string, unknown>);
    if (Array.isArray(value)) return value.map(render);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, render(item)]));
    return value;
  };
  const body = render(publicLessonBody(revision.body));
  const contentHash = snapshotContentHash(revision.id, fields as Record<string, unknown>, body);
  if (contentHash !== snapshot.contentHash) throw new ForbiddenError("Lesson snapshot integrity verification failed");
  sendSuccess(res, { contextSnapshotId: snapshot.id, companyId, lessonRevisionId: revision.id, presentedAt: snapshot.createdAt, contentHash, body });
}));

// Review queue, review decisions and the publish path (ACA-008).
router.use(lessonReviewRoutes);
// Superadmin lesson source editing (ADMIN only). Learner routes above are unchanged.
router.use(superadminLessonRoutes);

export default router;
