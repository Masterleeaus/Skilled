/**
 * Real dependencies for the tutor route. Loaded only when TUTOR_ENABLED is "true" (see app.ts). Nothing here runs at
 * import time, so with the flag off this file is never evaluated.
 *
 * - Auth: the existing authenticate middleware, plus one lookup that sets req.user.companyId from the learner's LEARNER
 *   membership. The route reads the organisation only from req.user.
 * - Retrieval: learner-scoped. For each request, the lessons the learner may open are read from the database (the
 *   published revisions the lesson-body route would serve, with the same enrolment, licence, selection and level
 *   rules). Only those revision bodies are indexed. The raw curriculum files are not read. See access/ and rag/.
 * - Providers: OpenAI and Anthropic clients. Each reads its own key and model from the environment at call time.
 *   With no key or model, the call is refused and the route returns tutor_unavailable.
 *
 * Not verified in this change: the Prisma client has no academyTutor* models until the migration is applied, so
 * store calls fail until then.
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Express } from 'express';
import { logger } from '../../config/logger';
import { prisma } from '../../config/prisma';
import { authenticate } from '../../middleware/authenticate';
import { createAiRuntime } from '../../ai-runtime/index.js';
import { AnthropicChatClient } from '../../ai-runtime/providers/anthropic.js';
import { OpenAiChatClient } from '../../ai-runtime/providers/openai.js';
import { retrieveChunks } from '../../ai-runtime/retrieval.js';
import { PLATFORM_CURRICULUM_COMPANY_ID } from '../rag/index.js';
import { createPublishedLessonStore } from '../rag/published-index.js';
import { createTutorGuardrail } from '../policy/tutor-guardrail.js';
import { PrismaTutorStore, type TutorPrismaClient } from '../store/prisma-store.js';
import { loadAccessibleLessons, type TutorAccessDeps } from '../access/accessible-lessons.js';
import { isLevelGateExempt, getLearnerLevelView, lockForLesson } from '../../modules/levels/level.service';
import { loadSavedSelection } from '../../modules/course-selection/course-selection.service';
import { licenceIndexForTrack } from '../../modules/curriculum/licence-track';
import { mountTutorRouter, type TutorRetrieveInput } from './tutor-route.js';

/** Sets req.user.companyId from the learner's LEARNER membership. Runs after the existing authenticate middleware. */
const authenticateWithOrganisation: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  authenticate(req, res, (err?: unknown) => {
    if (err) return next(err);
    const userId = req.user?.userId;
    if (!userId) return next();
    // Take the learner's company only when there is exactly one LEARNER membership. With two or more, the company is
    // ambiguous, so it is left unset and the tutor route refuses the request (403) instead of guessing a tenant.
    prisma.companyMember
      .findMany({
        where: { userId, role: 'LEARNER' },
        select: { companyId: true },
        take: 2,
      })
      .then((memberships) => {
        (req as unknown as { user: { userId: string; companyId?: string } }).user = {
          ...req.user!,
          companyId: memberships.length === 1 ? memberships[0].companyId : undefined,
        };
        next();
      }, (lookupError: unknown) => next(lookupError));
  });
};

/** Structured log for the route. Receives event names and small fields only. */
const log = (event: string, fields: Record<string, string | number | boolean | null>) => {
  logger.warn(event, fields);
};

/**
 * The production access dependencies. Each one calls the same service the lesson-body route calls, so the tutor and
 * the body route share one set of rules. Nothing here is cached between requests.
 */
export const prismaAccessDeps: TutorAccessDeps = {
  activeEnrolments: (learnerId) =>
    prisma.enrollment.findMany({
      where: { studentId: learnerId, status: { in: ['ACTIVE', 'COMPLETED'] }, course: { isPublished: true } },
      select: { courseId: true, licenceTrack: true },
    }),
  coursePlacements: async (courseId) => {
    const courseTracks = await prisma.academyCourseTrack.findMany({
      where: { courseId, track: { status: 'PUBLISHED' } },
      include: { track: { include: { placements: { include: { lesson: true, revision: true } } } } },
    });
    return courseTracks.flatMap((ct) => ct.track.placements);
  },
  savedSelection: (courseId, learnerId) => loadSavedSelection(courseId, learnerId),
  licenceIndex: (track) => licenceIndexForTrack(track),
  levelLockChecker: async (learner) => {
    // Same gate as assertLessonOpen: staff and assessors are exempt, everyone else is checked per lesson.
    if (await isLevelGateExempt(learner)) return () => false;
    const view = await getLearnerLevelView(learner.userId);
    return (lessonId) => lockForLesson(lessonId, view) !== null;
  },
};

export interface TutorWiringOptions {
  /** Access dependencies. Defaults to the production set. Tests pass fakes. */
  access?: TutorAccessDeps;
}

/**
 * Mounts /api/tutor when TUTOR_ENABLED is "true". Returns whether the route was mounted. app.ts calls this only when the
 * flag is set, and mountTutorRouter checks the flag again.
 */
export function mountTutorRoute(app: Express, wiring: TutorWiringOptions = {}): boolean {
  const enabled = process.env.TUTOR_ENABLED === 'true';
  if (!enabled) return false;

  const access = wiring.access ?? prismaAccessDeps;

  const runtime = createAiRuntime({
    chatProviders: [new OpenAiChatClient(), new AnthropicChatClient()],
    stages: {
      guardrail: createTutorGuardrail(),
    },
  });

  // Cast: the Prisma client is checked against TutorPrismaClient at build time only, and tsc has not been run here.
  const store = new PrismaTutorStore(prisma as unknown as TutorPrismaClient);

  return mountTutorRouter(app, {
    enabled,
    runtime,
    store,
    authenticate: authenticateWithOrganisation,
    env: process.env,
    log,
    retrieve: async ({ learnerId, role, text }: TutorRetrieveInput) => {
      const { lessons, report } = await loadAccessibleLessons({ userId: learnerId, role }, access);
      const index = createPublishedLessonStore(lessons);
      log('tutor_index_built', {
        enrolments: report.enrolments,
        placements_seen: report.placements_seen,
        accessible: report.accessible,
        excluded_licence: report.excluded_licence,
        excluded_level_lock: report.excluded_level_lock,
        excluded_integrity: report.excluded_integrity,
        lessons_indexed: index.report.lessons_indexed,
        chunks: index.report.chunks,
      });
      // The company id is the platform id: the index serves only that id, so the learner's company is not searched.
      return retrieveChunks({ companyId: PLATFORM_CURRICULUM_COMPANY_ID, query: text, store: index });
    },
  });
}
