/**
 * Admin-only preview of a lesson's latest revision, which may be a draft or unapproved.
 *
 * Read-only. Nothing here approves, publishes or changes a revision, and the publication gate is not touched.
 * Learner routes never call this module; they keep serving only the approved, published revision.
 */
import { prisma } from "../../config/prisma";
import { NotFoundError } from "../../utils/AppError";
import { recordAuditLog } from "../audit/audit.service";
import { getRevisionForReview } from "./lesson-review.service";

export const PREVIEW_AUDIT_ACTION = "LESSON_REVISION_PREVIEWED";

/**
 * Returns the latest revision of the lesson with its review status. `body` is the stored body, unstripped;
 * the route applies the learner view before responding.
 */
export async function previewLatestRevision(sourceId: string, actorId: string) {
  const lesson = await prisma.academyContentLesson.findUnique({ where: { sourceId } });
  if (!lesson) throw new NotFoundError("Lesson not found");
  const latest = await prisma.academyLessonRevision.findFirst({ where: { lessonId: lesson.id }, orderBy: { version: "desc" } });
  if (!latest) throw new NotFoundError("No revision exists for this lesson");

  const review = await getRevisionForReview(latest.id);
  await recordAuditLog({
    userId: actorId,
    action: PREVIEW_AUDIT_ACTION,
    entity: "AcademyLessonRevision",
    entityId: latest.id,
    newValue: { sourceId, version: latest.version, status: latest.status },
  });

  return {
    preview: true as const,
    lesson: review.lesson,
    // The revision's own stored status. A draft stays DRAFT here; nothing in the preview sets PUBLISHED.
    revision: review.revision,
    review: {
      latestDecision: review.gate.latestDecisionForHash,
      approved: review.gate.approved,
      hashIntegrity: review.gate.hashIntegrity,
      publicationGateAllows: review.gate.allowed,
      reasons: review.gate.reasons,
      reviews: review.reviews,
    },
    body: review.body,
  };
}
