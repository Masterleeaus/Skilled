/**
 * Integration tests for the learner tutor, wired through its public entry points. Run with vitest.
 *
 * Real: tutor-wiring.ts (mountTutorRoute), tutor-route.ts, createAiRuntime, the tutor guardrail, the published-revision
 * index (rag/published-index.ts) and loadAccessibleLessons, the OpenAI and Anthropic clients, the failover chain,
 * PrismaTutorStore, retention.
 *
 * Access: the production access dependencies run Prisma queries the stub does not model (enrolments, course tracks,
 * level views). This file passes fixtureAccess() instead: learner-a and learner-b hold an active enrolment, and the
 * fixture lessons are published revisions with matching hashes. The real access dependencies are not exercised here.
 * Access rules are tested in tests/tutor/access/accessible-lessons.test.ts.
 *
 * Fakes, at the edges only:
 *   - model provider HTTP: globalThis.fetch is replaced for the duration of each test. The provider clients call
 *     the global fetch at call time when no fetch is injected, which is how tutor-wiring builds them.
 *   - config env, config logger, config Prisma client, learner auth: vi.mock of the four source modules that
 *     tutor-wiring.ts imports, each replaced by its stub under stubs/. Mocks are module-wide, so they apply to every
 *     importer of those four modules in this file's module graph.
 *
 * Not exercised: the real Prisma client, the real authenticate middleware, the real config and logger, and app.ts
 * itself (it needs the database and the full config). See scenario 9 for what is checked about app.ts.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mountTutorRouter } from '../../../src/tutor/route/tutor-route';
import { PrismaTutorStore, TutorStoreError } from '../../../src/tutor/store/prisma-store';
import { purgeExpiredTutorData } from '../../../src/tutor/store/retention';
import { documentIdForLesson } from '../../../src/tutor/rag/index';
import { learnerMessageFor } from '../../../src/tutor/policy/tutor-guardrail';
import type { TutorAccessDeps } from '../../../src/tutor/access/accessible-lessons';
import * as stubPrisma from './stubs/config-prisma.mjs';
import * as stubLogger from './stubs/config-logger.mjs';

// Edge mocks. vi.mock is hoisted above the imports, so the factories load the stubs with dynamic import.
// The paths are the source modules as tutor-wiring.ts resolves them (src/config/env.ts, and so on).
vi.mock('../../../src/config/env', () => import('./stubs/config-env.mjs'));
vi.mock('../../../src/config/logger', () => import('./stubs/config-logger.mjs'));
vi.mock('../../../src/config/prisma', () => import('./stubs/config-prisma.mjs'));
vi.mock('../../../src/middleware/authenticate', () => import('./stubs/middleware-authenticate.mjs'));

const realFetch = globalThis.fetch;
const APP_TS = fileURLToPath(new URL('../../../src/app.ts', import.meta.url));
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

const FAKE_OPENAI_KEY = 'sk-test-openai-DO-NOT-LEAK';
const FAKE_ANTHROPIC_KEY = 'sk-ant-test-DO-NOT-LEAK';
const REPLY_OPENAI = 'Clean the shower screen with a neutral detergent and a microfibre cloth, working from the top down.';
const REPLY_ANTHROPIC = 'Use a neutral detergent and a soft cloth, then rinse the glass with clean water.';
const LESSON_TITLE = 'Cleaning a shower screen safely';
const HAPPY_QUESTION = 'How should I clean a shower screen?';

const TUTOR_ENV = [
  'TUTOR_ENABLED',
  'TUTOR_RATE_PER_MINUTE',
  'OPENAI_API_KEY',
  'TUTOR_OPENAI_MODEL',
  'ANTHROPIC_API_KEY',
  'TUTOR_ANTHROPIC_MODEL',
  'TUTOR_OPENAI_TIMEOUT_MS',
  'TUTOR_ANTHROPIC_TIMEOUT_MS',
];

type ProviderFn = (url: string, callNumber: number) => Response;
type ChatBody = {
  reply?: string;
  citations?: { document_id: string }[];
  error?: string;
  reason?: string;
  message?: string;
};
type Rig = {
  calls: { url: string; body: { messages: { content: string }[] } }[];
  ask(learner: string, message: string): Promise<{ status: number; text: string; body: ChatBody }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const openAiOk = (content: string) =>
  json(200, { choices: [{ message: { content } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } });
const anthropicOk = (text: string) => json(200, { content: [{ type: 'text', text }], usage: { input_tokens: 10, output_tokens: 5 } });

/** Default provider behaviour: OpenAI answers, anything else fails the test loudly. */
const openAiAnswers: ProviderFn = (url) => (url === OPENAI_URL ? openAiOk(REPLY_OPENAI) : json(500, { error: 'unexpected provider' }));

let loadedWiring: typeof import('../../../src/tutor/route/tutor-wiring') | undefined;
const loadWiring = async () => (loadedWiring ??= await import('../../../src/tutor/route/tutor-wiring'));

/**
 * Access for the flow test. Every fixture lesson is a PUBLISHED revision whose stored hash matches its body, placed in
 * one course that learner-a and learner-b are enrolled in. learner-c has no enrolment, so nothing is retrievable for it.
 */
const FIXTURE_COURSE_DIR = fileURLToPath(new URL('./fixtures/curriculum/courses/clean-course', import.meta.url));
async function fixtureAccess(): Promise<TutorAccessDeps> {
  const { contentHash } = await import('../../../src/utils/content-hash');
  const { parseLicenceFile } = await import('../../../src/modules/curriculum/licence-track');
  const placements = readdirSync(FIXTURE_COURSE_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const body = JSON.parse(readFileSync(path.join(FIXTURE_COURSE_DIR, name), 'utf8'));
      return {
        lesson: { id: `db-${body.id}`, sourceId: body.id as string },
        revision: { id: `rev-${body.id}`, status: 'PUBLISHED', body, contentHash: contentHash(body) },
      };
    });
  const learners = new Set(['learner-a', 'learner-b']);
  return {
    activeEnrolments: async (learnerId) => (learners.has(learnerId) ? [{ courseId: 'course-clean', licenceTrack: 'non-licensed' }] : []),
    coursePlacements: async () => placements,
    savedSelection: async () => undefined,
    licenceIndex: async () => parseLicenceFile({ lessons: [] }),
    levelLockChecker: async () => () => false,
  };
}

/**
 * Starts the real mounted app on an ephemeral port, with the provider fetch faked and the learner data seeded.
 * Learner A (learner-a) is a LEARNER of org-1. Learner B (learner-b) is a LEARNER of org-2. learner-c has no membership.
 */
async function withRig({ providers = openAiAnswers, env = {} }: { providers?: ProviderFn; env?: Record<string, string> }, fn: (rig: Rig) => Promise<void>) {
  const saved = Object.fromEntries(TUTOR_ENV.map((k) => [k, process.env[k]]));
  for (const k of TUTOR_ENV) delete process.env[k];
  Object.assign(process.env, {
    TUTOR_ENABLED: 'true',
    OPENAI_API_KEY: FAKE_OPENAI_KEY,
    TUTOR_OPENAI_MODEL: 'fake-openai-model',
    ANTHROPIC_API_KEY: FAKE_ANTHROPIC_KEY,
    TUTOR_ANTHROPIC_MODEL: 'fake-anthropic-model',
    ...env,
  });

  stubPrisma.resetDb();
  stubLogger.entries.length = 0;
  stubPrisma.seed(stubPrisma.db.companyMembers, { id: 'mem-1', userId: 'learner-a', companyId: 'org-1', role: 'LEARNER', createdAt: new Date('2026-01-01') });
  stubPrisma.seed(stubPrisma.db.companyMembers, { id: 'mem-2', userId: 'learner-b', companyId: 'org-2', role: 'LEARNER', createdAt: new Date('2026-01-01') });

  const calls: Rig['calls'] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, body: JSON.parse(String(init?.body)) });
    return providers(url, calls.length);
  }) as typeof fetch;

  let server: http.Server | undefined;
  try {
    const { mountTutorRoute } = await loadWiring();
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    expect(mountTutorRoute(app, { access: await fixtureAccess() }), 'mountTutorRoute should mount with TUTOR_ENABLED=true').toBe(true);
    app.use((_req, res) => {
      res.status(404).json({ error: 'not_found' });
    });

    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', () => resolve()));
    const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

    const rig: Rig = {
      calls,
      async ask(learner, message) {
        const res = await realFetch(`${base}/api/tutor`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${learner}` },
          body: JSON.stringify({ message }),
        });
        const text = await res.text();
        let body: ChatBody | null = null;
        try {
          body = JSON.parse(text);
        } catch {
          body = null;
        }
        return { status: res.status, text, body };
      },
    };
    await fn(rig);
  } finally {
    globalThis.fetch = realFetch;
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    for (const k of TUTOR_ENV) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

const storedConversations = () => stubPrisma.db.conversations;
const storedMessages = (conversationId: string) => stubPrisma.db.messages.filter((m) => m.conversationId === conversationId);

describe('tutor integration', () => {
  beforeAll(() => {
    stubPrisma.resetDb();
  });

  afterAll(() => {
    stubPrisma.resetDb();
  });

  // -------------------------------------------------------------------------
  // 1. Happy path
  // -------------------------------------------------------------------------

  it('1. happy path: lesson answer, citation to the lesson, message stored under org-1', async () => {
    await withRig({}, async (rig) => {
      const r = await rig.ask('learner-a', HAPPY_QUESTION);
      expect(r.status, r.text).toBe(200);
      expect(Object.keys(r.body).sort()).toStrictEqual(['citations', 'reply']);
      expect(r.body.reply).toBe(REPLY_OPENAI);

      // Every citation is a chunk of the lesson. The assessment item matched the same words and must be dropped by the
      // grounding check, so no citation may point at it. A lesson can yield several chunks, one citation each.
      expect(r.body.citations.length).toBeGreaterThanOrEqual(1);
      for (const citation of r.body.citations) {
        expect(citation.document_id).toBe(documentIdForLesson('CLN-01'));
        expect(citation.title).toBe(LESSON_TITLE);
      }
      expect(
        r.body.citations.some((c: { document_id: string }) => c.document_id === documentIdForLesson('CLN-K01')),
        'assessment item must not be cited',
      ).toBeFalsy();

      // The model saw the lesson passage, and never the assessor key.
      expect(rig.calls.length).toBe(1);
      expect(rig.calls[0].url).toBe(OPENAI_URL);
      const systemPrompt: string = rig.calls[0].body.messages[0].content;
      expect(systemPrompt).toMatch(/microfibre cloth/);
      expect(systemPrompt.includes('ANSWERKEY-7731'), 'assessment answer key must not reach the prompt').toBeFalsy();

      // Stored under the learner's organisation, from membership.
      const conversations = storedConversations();
      expect(conversations.length).toBe(1);
      expect(conversations[0].companyId).toBe('org-1');
      expect(conversations[0].learnerId).toBe('learner-a');
      const messages = storedMessages(conversations[0].id);
      expect(messages.map((m) => [m.role, m.companyId, m.content])).toStrictEqual([
        ['user', 'org-1', HAPPY_QUESTION],
        ['assistant', 'org-1', REPLY_OPENAI],
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Assessment question
  // -------------------------------------------------------------------------

  it('2. assessment question: refused with a reason code, no answer text, no provider call', async () => {
    await withRig({}, async (rig) => {
      const r = await rig.ask('learner-a', 'Which option is the correct answer to knowledge check CLN-K01?');
      expect(r.status, r.text).toBe(422);
      // The message is the route's learner text for this reason code (learnerMessageFor, as the route calls it).
      expect(r.body).toStrictEqual({
        error: 'refused',
        reason: 'assessment_answer_request',
        message: learnerMessageFor('assessment_answer_request'),
      });
      expect(/ANSWERKEY-7731|Neutral detergent|correct answer/i.test(r.text), 'no answer text in the response').toBeFalsy();
      expect(rig.calls.length, 'the provider must not be called').toBe(0);
      expect(storedConversations().length, 'refused turns are not stored').toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Safety signal
  // -------------------------------------------------------------------------

  it('3a. safety signal: refused with reason safety_signal, normal answer suppressed, no provider call', async () => {
    await withRig({}, async (rig) => {
      const r = await rig.ask('learner-a', 'I want to kill myself');
      expect(r.status, r.text).toBe(422);
      expect(r.body).toStrictEqual({ error: 'refused', reason: 'safety_signal', message: learnerMessageFor('safety_signal') });
      expect('reply' in r.body || 'citations' in r.body, 'no normal answer fields').toBeFalsy();
      expect(rig.calls.length, 'the provider must not be called').toBe(0);
      expect(storedConversations().length).toBe(0);
    });
  });

  it('3b. safety signal: the safety message text itself is returned to the learner', async () => {
    await withRig({}, async (rig) => {
      const r = await rig.ask('learner-a', 'I want to kill myself');
      // The safety message from tutor-guardrail.ts (LEARNER_MESSAGES.safety_signal) names Lifeline and the emergency number.
      expect(r.text, 'the response should carry the safety message, not only the reason code').toMatch(/Lifeline/);
      expect(r.text).toMatch(/000/);
    });
  });

  // -------------------------------------------------------------------------
  // 4. No curriculum match
  // -------------------------------------------------------------------------

  it('4a. no curriculum match: refused with reason no_curriculum_match, no citation, no provider call', async () => {
    await withRig({}, async (rig) => {
      const r = await rig.ask('learner-a', 'Explain quantum chromodynamics.');
      expect(r.status, r.text).toBe(422);
      expect(r.body).toStrictEqual({ error: 'refused', reason: 'no_curriculum_match', message: learnerMessageFor('no_curriculum_match') });
      expect('citations' in r.body).toBeFalsy();
      expect(rig.calls.length).toBe(0);
    });
  });

  it('4b. no curriculum match: a common-word question is refused, not answered from an unrelated lesson', async () => {
    // "the" is a stopword in extractTerms (src/ai-runtime/retrieval.ts), so it does not match lesson text on its own.
    // The question must be refused on its remaining terms, with no model call.
    await withRig({}, async (rig) => {
      const r = await rig.ask('learner-a', 'What is the boiling temperature of mercury?');
      expect(r.status, `expected a refusal, got ${r.status}; the provider was called ${rig.calls.length} time(s)`).toBe(422);
      expect(rig.calls.length, 'no model call for a question the course does not cover').toBe(0);
    });
  });

  it('4c. no curriculum match: the response says the course material does not cover it', async () => {
    await withRig({}, async (rig) => {
      const r = await rig.ask('learner-a', 'Explain quantum chromodynamics.');
      expect(r.text).toMatch(/could not find that in the course material/);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Primary provider 429, fallback answers
  // -------------------------------------------------------------------------

  it('5. primary provider 429: the fallback answers once, and the reply is stored once', async () => {
    const providers: ProviderFn = (url) =>
      url === OPENAI_URL
        ? json(429, { error: { message: `Rate limit reached for key ${FAKE_OPENAI_KEY}` } })
        : anthropicOk(REPLY_ANTHROPIC);

    await withRig({ providers }, async (rig) => {
      const r = await rig.ask('learner-a', HAPPY_QUESTION);
      expect(r.status, r.text).toBe(200);
      expect(r.body.reply).toBe(REPLY_ANTHROPIC);
      expect(rig.calls.map((c) => c.url)).toStrictEqual([OPENAI_URL, ANTHROPIC_URL]);

      const [conversation] = storedConversations();
      const assistantRows = storedMessages(conversation.id).filter((m) => m.role === 'assistant');
      expect(assistantRows.length, 'the reply is stored once').toBe(1);
      expect(assistantRows[0].content).toBe(REPLY_ANTHROPIC);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Both providers fail
  // -------------------------------------------------------------------------

  it('6. both providers fail: generic 503, no key, no request body and no provider payload in the response', async () => {
    const providers: ProviderFn = (url) =>
      url === OPENAI_URL
        ? json(429, { error: { message: `Rate limit reached for key ${FAKE_OPENAI_KEY}` } })
        : json(500, { error: 'upstream-secret-payload-XYZ' });

    await withRig({ providers }, async (rig) => {
      const r = await rig.ask('learner-a', HAPPY_QUESTION);
      expect(r.status).toBe(503);
      expect(r.text).toBe('{"error":"tutor_unavailable"}');
      expect(rig.calls.length, 'both providers were tried').toBe(2);

      const logged = JSON.stringify(stubLogger.entries);
      for (const secret of [FAKE_OPENAI_KEY, FAKE_ANTHROPIC_KEY, 'upstream-secret-payload', 'Rate limit', 'DO-NOT-LEAK']) {
        expect(!r.text.includes(secret) && !logged.includes(secret), `"${secret}" must not reach the response or the log`).toBeTruthy();
      }
      expect(stubLogger.entries.some((e) => e.event === 'tutor_provider_failed'), 'the failure is logged by event name').toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // 7. Tenant isolation through the store
  // -------------------------------------------------------------------------

  it('7. tenant isolation: a learner of org-1 cannot read or write a conversation stored for org-2', async () => {
    stubPrisma.resetDb();
    const store = new PrismaTutorStore(stubPrisma.prisma);

    const org2Conversation = await store.createConversation({ companyId: 'org-2', learnerId: 'learner-b' });
    await store.appendMessage({ companyId: 'org-2', conversationId: org2Conversation.id, role: 'user', content: 'org-2 private question' });

    // Org-1 scope: the messages are not returned.
    expect(await store.listMessages({ companyId: 'org-1', conversationId: org2Conversation.id })).toStrictEqual([]);

    // Org-1 scope: a write into the org-2 conversation is refused as not found.
    const err = await store
      .appendMessage({ companyId: 'org-1', conversationId: org2Conversation.id, role: 'assistant', content: 'injected' })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(TutorStoreError);
    expect((err as TutorStoreError).code).toBe('conversation_not_found');

    // Sanity: the owning organisation still reads its own row, and the injected write did not land.
    const own = await store.listMessages({ companyId: 'org-2', conversationId: org2Conversation.id });
    expect(own.map((m) => m.content)).toStrictEqual(['org-2 private question']);
  });

  // -------------------------------------------------------------------------
  // 8. Retention
  // -------------------------------------------------------------------------

  it('8. retention: conversations older than 30 days are removed with their rows, newer ones are kept', async () => {
    stubPrisma.resetDb();
    const DAY = 86_400_000;
    const now = new Date('2026-11-08T00:00:00Z');
    const ago = (days: number) => new Date(now.getTime() - days * DAY);
    const { db, seed } = stubPrisma;

    seed(db.conversations, { id: 'c-old', companyId: 'org-1', learnerId: 'learner-a', createdAt: ago(31) });
    seed(db.messages, { id: 'm-old', companyId: 'org-1', conversationId: 'c-old', role: 'user', content: 'old', createdAt: ago(31) });
    seed(db.audits, { id: 'a-old', companyId: 'org-1', conversationId: 'c-old', createdAt: ago(31) });

    seed(db.conversations, { id: 'c-edge', companyId: 'org-1', learnerId: 'learner-a', createdAt: ago(30) });
    seed(db.messages, { id: 'm-edge', companyId: 'org-1', conversationId: 'c-edge', role: 'user', content: 'edge', createdAt: ago(30) });

    seed(db.conversations, { id: 'c-new', companyId: 'org-1', learnerId: 'learner-a', createdAt: ago(29) });
    seed(db.messages, { id: 'm-new', companyId: 'org-1', conversationId: 'c-new', role: 'user', content: 'new', createdAt: ago(29) });
    seed(db.audits, { id: 'a-new', companyId: 'org-1', conversationId: 'c-new', createdAt: ago(29) });

    seed(db.conversations, { id: 'c-old-org2', companyId: 'org-2', learnerId: 'learner-b', createdAt: ago(45) });
    seed(db.messages, { id: 'm-old-org2', companyId: 'org-2', conversationId: 'c-old-org2', role: 'user', content: 'old2', createdAt: ago(45) });

    const result = await purgeExpiredTutorData(stubPrisma.prisma, { now });

    expect(db.conversations.map((c) => c.id)).toStrictEqual(['c-edge', 'c-new']);
    expect(db.messages.map((m) => m.id)).toStrictEqual(['m-edge', 'm-new']);
    expect(db.audits.map((a) => a.id)).toStrictEqual(['a-new']);
    expect(result.conversations).toBe(2);
    expect(result.messages).toBe(2);
    expect(result.toolAudits).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 9. Flag off
  // -------------------------------------------------------------------------

  it('9. flag off: TUTOR_ENABLED unset gives 404 on /api/tutor, and app.ts guards the require', async () => {
    const saved = process.env.TUTOR_ENABLED;
    delete process.env.TUTOR_ENABLED;
    let server: http.Server | undefined;
    try {
      // app.ts only requires the wiring inside this guard. The line is checked as written, because app.ts cannot run here.
      const appSource = await readFile(APP_TS, 'utf8');
      const mountLine = appSource.split('\n').find((line) => line.includes('tutor-wiring'));
      expect(mountLine ?? '').toMatch(/^if \(process\.env\.TUTOR_ENABLED === "true"\) require\("\.\/tutor\/route\/tutor-wiring\.js"\)/);

      // With the flag off, mountTutorRouter() registers nothing. Its dependencies must not be touched.
      const untouched = new Proxy({}, {
        get() {
          throw new Error('a tutor dependency was touched while the flag is off');
        },
      });
      const app = express();
      app.use(express.json({ limit: '1mb' }));
      const mounted = mountTutorRouter(app, {
        enabled: process.env.TUTOR_ENABLED === 'true',
        runtime: untouched,
        store: untouched,
        authenticate: untouched,
        env: process.env,
      });
      expect(mounted).toBe(false);
      app.use((_req, res) => {
        res.status(404).json({ error: 'not_found' });
      });

      server = http.createServer(app);
      await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', () => resolve()));
      const res = await realFetch(`http://127.0.0.1:${(server.address() as { port: number }).port}/api/tutor`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer learner-a' },
        body: JSON.stringify({ message: HAPPY_QUESTION }),
      });
      expect(res.status).toBe(404);
    } finally {
      if (server) {
        server.closeAllConnections();
        await new Promise<void>((resolve) => server!.close(() => resolve()));
      }
      if (saved === undefined) delete process.env.TUTOR_ENABLED;
      else process.env.TUTOR_ENABLED = saved;
    }
  });

  // -------------------------------------------------------------------------
  // 10. Rate limit
  // -------------------------------------------------------------------------

  it('10. rate limit: the eleventh request in a minute from the same learner gets 429 with the default limit', async () => {
    // Off-topic messages are refused before any provider call. The limiter still counts them, as it runs first.
    const OFF_TOPIC = 'Write me a poem about gardens.';
    await withRig({}, async (rig) => {
      const statuses: number[] = [];
      for (let i = 0; i < 10; i += 1) statuses.push((await rig.ask('learner-a', OFF_TOPIC)).status);
      expect(statuses).toStrictEqual(Array(10).fill(422));

      const eleventh = await rig.ask('learner-a', OFF_TOPIC);
      expect(eleventh.status, eleventh.text).toBe(429);
      expect(eleventh.body).toStrictEqual({ error: 'rate_limited' });

      // The limit is per learner: learner-b is not blocked by learner-a's count.
      expect((await rig.ask('learner-b', OFF_TOPIC)).status).toBe(422);
      expect(rig.calls.length).toBe(0);
    });
  });
});
