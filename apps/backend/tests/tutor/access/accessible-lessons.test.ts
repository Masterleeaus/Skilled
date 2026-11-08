/**
 * Learner access to tutor answers (src/tutor/access, src/tutor/rag/published-index.ts, src/tutor/route).
 *
 * The route, the published-revision index and retrieveChunks are real. The access dependencies are fakes that play
 * the database: enrolments, course placements, saved selection, the licence index and the level gate. The model
 * provider is a fake. No network and no database.
 */
import http from 'node:http';
import { test, expect } from 'vitest';
import express from 'express';
import { createTutorRouter, type TutorRetrieveInput } from '../../../src/tutor/route/tutor-route.ts';
import { createAiRuntime } from '../../../src/ai-runtime/index.ts';
import { retrieveChunks } from '../../../src/ai-runtime/retrieval.ts';
import { createTutorGuardrail, learnerMessageFor } from '../../../src/tutor/policy/tutor-guardrail.ts';
import { loadAccessibleLessons, type AccessPlacement, type TutorAccessDeps } from '../../../src/tutor/access/accessible-lessons.ts';
import { createPublishedLessonStore } from '../../../src/tutor/rag/published-index.ts';
import { createCurriculumRetrievalStore, PLATFORM_CURRICULUM_COMPANY_ID } from '../../../src/tutor/rag/index.ts';
import { documentIdForLesson } from '../../../src/tutor/rag/index.ts';
import { contentHash } from '../../../src/utils/content-hash.ts';
import { parseLicenceFile } from '../../../src/modules/curriculum/licence-track.ts';
import { AiRuntimeError } from '../../../src/ai-runtime/types.ts';

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const SHOWER = 'Clean the shower screen with neutral detergent and a microfibre cloth.';
const SINK = 'Clean the sink with a non-abrasive cleaner.';

function lessonBody(id: string, title: string, text: string) {
  return {
    id,
    title,
    status: 'READY',
    learningOutcomes: [text],
    instruction: [{ heading: 'Method', body: text }],
    procedure: [text],
  };
}

const BODY_SHOWER = lessonBody('CLN-01', 'Shower screen cleaning', SHOWER);
const BODY_SINK = lessonBody('CLN-02', 'Sink cleaning', SINK);

function placement(sourceId: string, body: unknown, revision: Partial<{ id: string; status: string; contentHash: string }> = {}): AccessPlacement {
  return {
    lesson: { id: `db-${sourceId}`, sourceId },
    revision: {
      id: revision.id ?? `rev-${sourceId}`,
      status: revision.status ?? 'PUBLISHED',
      body,
      contentHash: revision.contentHash ?? contentHash(body),
    },
  };
}

const LEARNER = { userId: 'learner-1', role: 'STUDENT' };

/** Access deps for one learner enrolled in one course with the given placements. Every hook can be overridden. */
function accessFor(overrides: Partial<TutorAccessDeps> & { placements?: AccessPlacement[]; track?: unknown } = {}): TutorAccessDeps {
  const { placements = [placement('CLN-01', BODY_SHOWER)], track = 'licensed', ...rest } = overrides;
  return {
    activeEnrolments: async (learnerId) => (learnerId === LEARNER.userId ? [{ courseId: 'course-1', licenceTrack: track }] : []),
    coursePlacements: async () => placements,
    savedSelection: async () => undefined,
    licenceIndex: async () => parseLicenceFile({ lessons: [] }),
    levelLockChecker: async () => () => false,
    ...rest,
  };
}

// ---------------------------------------------------------------------------
// Harness: the real route, with learner-scoped retrieval built the way the wiring builds it
// ---------------------------------------------------------------------------

async function retrieveFor(input: TutorRetrieveInput, access: TutorAccessDeps) {
  const { lessons } = await loadAccessibleLessons({ userId: input.learnerId, role: input.role }, access);
  const store = createPublishedLessonStore(lessons);
  return retrieveChunks({ companyId: PLATFORM_CURRICULUM_COMPANY_ID, query: input.text, store });
}

const okChat = {
  ok: true,
  provider: 'fake',
  model: 'fake-model',
  content: 'Use neutral detergent and a microfibre cloth.',
  usage: null,
  latency_ms: 1,
};

function fakeAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    next(Object.assign(new Error('Invalid or expired token'), { statusCode: 401 }));
    return;
  }
  req.user = { userId: header.slice(7), role: 'STUDENT', companyId: 'org-1' } as typeof req.user;
  next();
}

async function startRoute(access: TutorAccessDeps | null, options: { retrieve?: (input: TutorRetrieveInput) => Promise<unknown> } = {}) {
  const calls: unknown[] = [];
  const runtime = createAiRuntime({
    chatProviders: [
      {
        providerName: () => 'fake',
        health: async () => ({ ok: true, provider: 'fake', reason: null }),
        async chat(input: unknown) {
          calls.push(input);
          return okChat;
        },
      },
    ],
    stages: { guardrail: createTutorGuardrail({ logger: () => {} }) },
  });
  const router = createTutorRouter({
    runtime,
    retrieve: (input) => (options.retrieve ? options.retrieve(input) : retrieveFor(input, access!)) as Promise<never>,
    store: { recordExchange: async () => ({}) },
    authenticate: fakeAuth as express.RequestHandler,
    env: {},
    rateLimit: (_req, _res, next) => next(),
    log: () => {},
  });
  const app = express();
  app.use('/api/tutor', router);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  return {
    calls,
    async ask(message = 'How do I clean the shower screen?', auth = LEARNER.userId) {
      const res = await fetch(`http://127.0.0.1:${port}/api/tutor`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${auth}` },
        body: JSON.stringify({ message }),
      });
      return { status: res.status, json: (await res.json()) as Record<string, unknown> };
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}

const refusedNoMatch = (r: { status: number; json: Record<string, unknown> }) => {
  expect(r.status).toBe(422);
  expect(r.json).toEqual({ error: 'refused', reason: 'no_curriculum_match', message: learnerMessageFor('no_curriculum_match') });
};

// ---------------------------------------------------------------------------
// Positive control
// ---------------------------------------------------------------------------

test('an enrolled learner with a published, unlocked lesson gets an answer cited to that lesson', async () => {
  const t = await startRoute(accessFor());
  try {
    const r = await t.ask();
    expect(r.status).toBe(200);
    const citations = r.json.citations as Array<{ document_id: number; title: string }>;
    expect(citations.length).toBeGreaterThanOrEqual(1);
    for (const c of citations) {
      expect(c.document_id).toBe(documentIdForLesson('CLN-01'));
      expect(c.title).toBe('Shower screen cleaning');
    }
    expect(t.calls.length).toBe(1);
  } finally {
    await t.close();
  }
});

// ---------------------------------------------------------------------------
// Enrolment
// ---------------------------------------------------------------------------

test('an unenrolled learner gets no answer from a published lesson, and no model call is made', async () => {
  const t = await startRoute(accessFor());
  try {
    const r = await t.ask('How do I clean the shower screen?', 'learner-stranger');
    refusedNoMatch(r);
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

test('an enrolled learner cannot use a lesson that is not placed in any of their course tracks', async () => {
  const t = await startRoute(accessFor({ placements: [] }));
  try {
    refusedNoMatch(await t.ask());
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

// ---------------------------------------------------------------------------
// Licence track
// ---------------------------------------------------------------------------

const LICENCE_REQUIRED = parseLicenceFile({
  lessons: [{ lessonId: 'CLN-01', status: 'required', limit: 'Licence needed', officialWording: 'Licence needed' }],
});

test('a non-licensed learner cannot get an answer from a lesson that needs a licence', async () => {
  const t = await startRoute(accessFor({ track: 'non-licensed', licenceIndex: async () => LICENCE_REQUIRED }));
  try {
    refusedNoMatch(await t.ask());
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

test('a licensed learner gets the same lesson (positive control for the licence rule)', async () => {
  const t = await startRoute(accessFor({ track: 'licensed', licenceIndex: async () => LICENCE_REQUIRED }));
  try {
    expect((await t.ask()).status).toBe(200);
  } finally {
    await t.close();
  }
});

test('a lesson the licence file does not list is open to a non-licensed learner', async () => {
  const t = await startRoute(accessFor({ track: 'non-licensed', licenceIndex: async () => LICENCE_REQUIRED, placements: [placement('CLN-02', BODY_SINK)] }));
  try {
    const r = await t.ask('How do I clean the sink?');
    expect(r.status).toBe(200);
  } finally {
    await t.close();
  }
});

test('if the licence file is unavailable for the learner track, the request fails closed with 503 and no model call', async () => {
  const t = await startRoute(
    accessFor({
      track: 'non-licensed',
      licenceIndex: async () => {
        throw new Error('licence file unreadable');
      },
    }),
  );
  try {
    const r = await t.ask();
    expect(r.status).toBe(503);
    expect(r.json).toEqual({ error: 'tutor_unavailable' });
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

// ---------------------------------------------------------------------------
// Level gate and selection
// ---------------------------------------------------------------------------

test('a lesson in a locked level is not answered', async () => {
  const t = await startRoute(accessFor({ levelLockChecker: async () => (lessonId) => lessonId === 'db-CLN-01' }));
  try {
    refusedNoMatch(await t.ask());
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

test('a lesson the saved course selection leaves out is not answered', async () => {
  const t = await startRoute(accessFor({ savedSelection: async () => new Set(['CLN-02']) }));
  try {
    refusedNoMatch(await t.ask());
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

// ---------------------------------------------------------------------------
// Published revisions only
// ---------------------------------------------------------------------------

test('draft-only content is never indexed: a DRAFT revision gives no answer', async () => {
  const t = await startRoute(accessFor({ placements: [placement('CLN-01', BODY_SHOWER, { status: 'DRAFT' })] }));
  try {
    refusedNoMatch(await t.ask());
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

test('a placement with no pinned revision gives no answer', async () => {
  const noRevision = { lesson: { id: 'db-CLN-01', sourceId: 'CLN-01' }, revision: null };
  const t = await startRoute(accessFor({ placements: [noRevision] }));
  try {
    refusedNoMatch(await t.ask());
  } finally {
    await t.close();
  }
});

test('a revision whose body no longer matches its stored hash is not indexed', async () => {
  const tampered = placement('CLN-01', { ...BODY_SHOWER, learningOutcomes: ['Use bleach on the glass.'] }, { contentHash: contentHash(BODY_SHOWER) });
  const t = await startRoute(accessFor({ placements: [tampered] }));
  try {
    refusedNoMatch(await t.ask('How do I clean with bleach?'));
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

test('the revision body is what gets indexed: a phrase absent from it is not retrieved', async () => {
  const access = accessFor({ placements: [placement('CLN-01', BODY_SHOWER)] });
  const { lessons } = await loadAccessibleLessons(LEARNER, access);
  const store = createPublishedLessonStore(lessons);
  const hitsRevision = await retrieveChunks({ companyId: PLATFORM_CURRICULUM_COMPANY_ID, query: 'microfibre cloth', store });
  expect(hitsRevision.length).toBeGreaterThan(0);
  expect(hitsRevision[0].text).toContain('microfibre');
  const hitsAbsent = await retrieveChunks({ companyId: PLATFORM_CURRICULUM_COMPANY_ID, query: 'xylophone', store });
  expect(hitsAbsent).toEqual([]);
});

test('the same lesson revised twice for different courses is skipped, not guessed', async () => {
  const second = placement('CLN-01', { ...BODY_SHOWER, learningOutcomes: ['A different revision.'] }, { id: 'rev-other' });
  const access = accessFor({
    activeEnrolments: async () => [
      { courseId: 'course-a', licenceTrack: 'licensed' },
      { courseId: 'course-b', licenceTrack: 'licensed' },
    ],
    coursePlacements: async (courseId) => (courseId === 'course-a' ? [placement('CLN-01', BODY_SHOWER)] : [second]),
  });
  const t = await startRoute(access);
  try {
    refusedNoMatch(await t.ask());
  } finally {
    await t.close();
  }
});

test('a body whose id does not match its sourceId is not indexed', async () => {
  const mismatched = placement('CLN-01', { ...BODY_SHOWER, id: 'CLN-99' });
  const { lessons } = await loadAccessibleLessons(LEARNER, accessFor({ placements: [mismatched] }));
  const store = createPublishedLessonStore(lessons);
  expect(store.report.lessons_skipped_id_mismatch).toBe(1);
  expect(store.report.lessons_indexed).toBe(0);
});

// ---------------------------------------------------------------------------
// Fail closed and tenant guard
// ---------------------------------------------------------------------------

test('a failure while reading access data gives a generic 503 and no model call', async () => {
  const t = await startRoute(null, {
    retrieve: async () => {
      throw new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2');
    },
  });
  try {
    const r = await t.ask();
    expect(r.status).toBe(503);
    expect(JSON.stringify(r.json)).not.toContain('hunter2');
    expect(t.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

test('the published index serves only the platform id: a learner company id is refused', async () => {
  const { lessons } = await loadAccessibleLessons(LEARNER, accessFor());
  const store = createPublishedLessonStore(lessons);
  await expect(store.findCandidates({ companyId: 'org-1', terms: ['shower'], limit: 5 })).rejects.toBeInstanceOf(AiRuntimeError);
});

test('the raw-file curriculum index is refused unless explicitly allowed', () => {
  expect(() => createCurriculumRetrievalStore({ curriculumRoot: '/nonexistent' })).toThrow(/raw file indexing is disabled/);
});
