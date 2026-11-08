/**
 * Shared Academy fixture for PASS42 quality tests. All identifiers are synthetic.
 * Seeds go through the fake Prisma create path, so defaults and uniqueness apply.
 */
import { signAccessToken } from "../../modules/auth/token.utils";
import { contentHashOf } from "../../modules/curriculum/lesson-review.service";
import { fakePrisma, seed } from "./fake-prisma";

export const ids = {
  learner1: "learner-1",
  learner2: "learner-2",
  manager: "manager-1",
  assessor: "assessor-1",
  outsider: "outsider-1",
  org1: "org-1",
  org2: "org-2",
  course: "course-1",
  track: "tr-1",
  lessonA: "lesson-a",
  lessonB: "lesson-b",
  revisionA: "rev-a1",
  revisionB: "rev-b1",
  revisionDraft: "rev-b2-draft",
};

// Learner-facing check text only. The answer keys are server-side (academy_knowledge_answer_keys), never in the body.
export const KNOWLEDGE_CHECK = [
  { id: "TST-A-K01", question: "Which tool is used first?", options: ["Scanner", "Vacuum", "Brush"] },
  { id: "TST-A-K02", question: "What is the approved cleaner?", options: ["Water", "Approved product"] },
];

/** Server-side keys for KNOWLEDGE_CHECK. Correct answers: index 1 for both checks. */
export const KNOWLEDGE_KEYS = [
  { checkId: "TST-A-K01", correctIndex: 1, rationale: "Fixture rationale, server-side only." },
  { checkId: "TST-A-K02", correctIndex: 1, rationale: null },
];

/** Loads KNOWLEDGE_KEYS for one published revision, as the loader script does. */
export async function seedKnowledgeKeys(revisionId: string): Promise<void> {
  await seed("academyKnowledgeAnswerKey", KNOWLEDGE_KEYS.map((key) => ({ revisionId, ...key })));
}

export function revisionBodyA(): Record<string, unknown> {
  return {
    introduction: "Training for {{business:business.name}} crews.",
    procedure: ["Prepare kit for {{business:business.name}}", "Work top to bottom"],
    resource: { url: "https://example.test/guide", label: "Guide" },
    knowledgeChecks: KNOWLEDGE_CHECK,
  };
}

export function token(userId: string, role = "STUDENT"): string {
  return signAccessToken({ userId, role: role as never });
}

export async function seedAcademyFixture(): Promise<void> {
  await seed("user", [
    { id: ids.learner1, email: "learner1@example.test", fullName: "Learner One", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: ids.learner2, email: "learner2@example.test", fullName: "Learner Two", role: "STUDENT", isActive: true, isEmailVerified: true },
    { id: ids.manager, email: "manager@example.test", fullName: "Manager Example", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: ids.assessor, email: "assessor@example.test", fullName: "Assessor Example", role: "TEACHER", isActive: true, isEmailVerified: true },
    { id: ids.outsider, email: "outsider@example.test", fullName: "Outsider Example", role: "STUDENT", isActive: true, isEmailVerified: true },
  ]);
  await seed("company", [
    { id: ids.org1, name: "Organisation One" },
    { id: ids.org2, name: "Organisation Two" },
  ]);
  await seed("companyMember", [
    { companyId: ids.org1, userId: ids.manager, role: "MANAGER" },
    { companyId: ids.org1, userId: ids.assessor, role: "ASSESSOR" },
    { companyId: ids.org1, userId: ids.learner1, role: "LEARNER" },
    { companyId: ids.org1, userId: ids.learner2, role: "LEARNER" },
    { companyId: ids.org2, userId: ids.outsider, role: "LEARNER" },
  ]);
  await seed("course", [{ id: ids.course, title: "Field Safety", slug: "field-safety", isPublished: true, price: 0 }]);
  await seed("academyContentLesson", [
    { id: ids.lessonA, sourceId: "TST-A", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson A", objective: "Objective A", assessment: "Assess A", sourceVersion: "1", sourceHash: "h-a" },
    { id: ids.lessonB, sourceId: "TST-B", layer: "UNIVERSAL", serviceGroup: "GENERAL", unit: "U1", title: "Lesson B", objective: "Objective B", assessment: "Assess B", sourceVersion: "1", sourceHash: "h-b" },
  ]);
  await seed("academyLessonRevision", [
    { id: ids.revisionA, lessonId: ids.lessonA, version: 1, body: revisionBodyA(), contentHash: contentHashOf(revisionBodyA()), status: "PUBLISHED", publishedAt: new Date() },
    { id: ids.revisionB, lessonId: ids.lessonB, version: 1, body: { introduction: "Lesson B body" }, contentHash: contentHashOf({ introduction: "Lesson B body" }), status: "PUBLISHED", publishedAt: new Date() },
    { id: ids.revisionDraft, lessonId: ids.lessonB, version: 2, body: { introduction: "Draft only" }, contentHash: "z", status: "DRAFT" },
  ]);
  await seedKnowledgeKeys(ids.revisionA);
  await seed("academyCurriculumTrack", [{ id: ids.track, slug: "tr-one", title: "Track One", scope: "UNIVERSAL", status: "PUBLISHED" }]);
  await seed("academyLessonPlacement", [
    { trackId: ids.track, lessonId: ids.lessonA, revisionId: ids.revisionA, position: 1, required: true },
    { trackId: ids.track, lessonId: ids.lessonB, revisionId: ids.revisionB, position: 2, required: false },
  ]);
  await seed("academyCourseTrack", [{ courseId: ids.course, trackId: ids.track, position: 1, required: true }]);
  await seed("enrollment", [
    { studentId: ids.learner1, courseId: ids.course, status: "ACTIVE" },
    { studentId: ids.learner2, courseId: ids.course, status: "ACTIVE" },
  ]);
  await seed("academyTrainingAssignment", [
    { companyId: ids.org1, learnerId: ids.learner1, assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED" },
    { companyId: ids.org1, learnerId: ids.learner2, assignedById: ids.manager, courseId: ids.course, status: "ASSIGNED" },
  ]);
  await seed("academyBusinessLessonField", [
    { companyId: ids.org1, fieldKey: "business.name", value: "Acme Field Services", status: "APPROVED", approvedById: ids.manager, approvedAt: new Date(), revision: 1 },
  ]);
}

/**
 * Stores each lesson file's record as the body of its published revision, with the hash the publisher would store.
 * The learner body route serves the published revision, never the live file, so tests that read a file's text
 * must publish that text first. Call after the lessons and revisions are seeded.
 */
export async function publishFileBodies(bodies: Record<string, Record<string, unknown>>): Promise<void> {
  for (const [sourceId, body] of Object.entries(bodies)) {
    const lesson = await fakePrisma.academyContentLesson.findUnique({ where: { sourceId } });
    if (!lesson) throw new Error(`publishFileBodies: no lesson ${sourceId} in the fixture`);
    const revision = await fakePrisma.academyLessonRevision.findFirst({ where: { lessonId: lesson.id, status: "PUBLISHED" } });
    if (!revision) throw new Error(`publishFileBodies: no published revision for ${sourceId}`);
    await fakePrisma.academyLessonRevision.update({ where: { id: revision.id }, data: { body, contentHash: contentHashOf(body) } });
  }
}
