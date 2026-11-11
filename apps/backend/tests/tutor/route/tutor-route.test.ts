/**
 * Tests for POST /api/tutor (src/tutor/route/tutor-route.ts).
 *
 * The runtime is the real createAiRuntime() with the real tutor guardrail, a fake chat provider and a fake retrieval
 * stage. The store and the auth middleware are fakes. The rate limiter is the real express-rate-limit. No network,
 * no keys, no database.
 */
import { test, expect } from 'vitest';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import {
  createTutorRouter,
  mountTutorRouter,
  parseRatePerMinute,
  parseTutorBody,
  MAX_MESSAGE_CHARS,
} from '../../../src/tutor/route/tutor-route.ts';
import { createAiRuntime } from '../../../src/ai-runtime/index.ts';
import { createTutorGuardrail, learnerMessageFor } from '../../../src/tutor/policy/tutor-guardrail.ts';

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

// Auth token format for the fake: "user=<learner id>,org=<company id>". Either part may be left out.
// The token "boom" makes the fake fail with a non-401 error that carries a secret-looking message.
function fakeAuth(req, res, next) {
  const header = req.headers.authorization ?? '';
  if (!header.startsWith('Bearer ')) {
    next(Object.assign(new Error('Invalid or expired token'), { statusCode: 401 }));
    return;
  }
  const token = header.slice(7);
  if (token === 'boom') {
    next(new Error('connect ECONNREFUSED db-password-hunter2'));
    return;
  }
  const claims = Object.fromEntries(token.split(',').map((part) => part.split('=')));
  req.user = { userId: claims.user || undefined, role: 'STUDENT', companyId: claims.org || undefined };
  next();
}

const AUTH_LEARNER_A = 'user=learner-1,org=org-A';

function fakeProvider(respond) {
  const calls = [];
  return {
    calls,
    providerName: () => 'fake',
    health: async () => ({ ok: true, provider: 'fake', reason: null }),
    async chat(input) {
      calls.push(input);
      return respond(input, calls.length);
    },
  };
}

const okChat = () => ({
  ok: true,
  provider: 'fake',
  model: 'fake-model',
  content: 'Gloves protect your hands when handling chemicals.',
  usage: null,
  latency_ms: 1,
});

/** In-memory store. recordExchange writes the conversation and both messages together, as the Prisma store does. */
function fakeStore() {
  const conversations = [];
  const messages = [];
  return {
    conversations,
    messages,
    store: {
      async recordExchange(input) {
        const id = `conv-${conversations.length + 1}`;
        conversations.push({ id, companyId: input.companyId, learnerId: input.learnerId });
        messages.push(
          { conversationId: id, companyId: input.companyId, role: 'user', content: input.userContent },
          { conversationId: id, companyId: input.companyId, role: 'assistant', content: input.assistantContent },
        );
        return { id };
      },
    },
  };
}

const PASSAGE = {
  chunk_id: '7:0',
  document_id: 7,
  chunk_index: 0,
  text: 'Wear gloves when handling chemicals.',
  metadata: {
    title: 'Chemical handling',
    doc_type: 'lesson',
    authority_level: null,
    jurisdiction: null,
    is_superseded: false,
    preferred_weight: 0,
    company_id: 'platform-curriculum',
  },
  score: 2,
};

const ASSESSMENT = {
  chunk_id: '9:0',
  document_id: 9,
  chunk_index: 0,
  text: 'knowledgeAnswers: correctIndex 2',
  metadata: {
    title: 'ACE-01 knowledge check',
    doc_type: 'assessment',
    authority_level: null,
    jurisdiction: null,
    is_superseded: false,
    preferred_weight: 0,
    company_id: 'platform-curriculum',
  },
  score: 5,
};

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

async function setup({ enabled = true, provider, retrieval, env = {}, rateLimit, failRetrieval = false } = {}) {
  const prov = provider ?? fakeProvider(okChat);
  const guardEntries = [];
  const logged = [];
  const runtime = createAiRuntime({
    chatProviders: [prov],
    stages: {
      guardrail: createTutorGuardrail({ logger: (entry) => guardEntries.push(entry) }),
    },
  });
  // Learner-scoped retrieval, as the wiring provides it. The fake ignores the learner, so the route tests stay about
  // the route. Access rules are tested in tests/tutor/access.
  const retrieve = async () => {
    if (failRetrieval) throw new Error('db secret leaked: postgres://user:pw@host');
    return retrieval ?? [PASSAGE];
  };
  const { store, conversations, messages } = fakeStore();

  // No app-level JSON parser here: the route parses its own body, so its 400 path is what the tests exercise.
  const app = express();
  mountTutorRouter(app, {
    enabled,
    runtime,
    retrieve,
    store,
    authenticate: fakeAuth,
    env,
    rateLimit,
    log: (event, fields) => logged.push({ event, fields }),
  });
  // Stands in for the app's notFoundHandler, so a route that is not mounted gives a 404.
  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    prov,
    guardEntries,
    logged,
    conversations,
    messages,
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}

async function post(url, { auth, body, raw, contentType = 'application/json' } = {}) {
  const headers = { 'content-type': contentType };
  if (auth !== undefined) headers.authorization = `Bearer ${auth}`;
  const payload = raw !== undefined ? raw : body === undefined ? undefined : JSON.stringify(body);
  const res = await fetch(`${url}/api/tutor`, { method: 'POST', headers, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

const GOOD_BODY = { message: 'How do I handle chemicals safely?' };

// ---------------------------------------------------------------------------
// Authentication, identity and flag
// ---------------------------------------------------------------------------

test('unauthenticated request gets 401 and never reaches the model', async () => {
  const t = await setup();
  try {
    const r = await post(t.url, { body: GOOD_BODY });
    assert.equal(r.status, 401);
    assert.deepEqual(r.json, { error: 'unauthenticated' });
    assert.equal(t.prov.calls.length, 0);
    assert.equal(t.conversations.length, 0);
  } finally {
    await t.close();
  }
});

test('authenticated user with no learner id gets 401', async () => {
  const t = await setup();
  try {
    const r = await post(t.url, { auth: 'org=org-A', body: GOOD_BODY });
    assert.equal(r.status, 401);
    assert.equal(t.prov.calls.length, 0);
  } finally {
    await t.close();
  }
});

test('authenticated learner with no company gets 403', async () => {
  const t = await setup();
  try {
    const r = await post(t.url, { auth: 'user=learner-1', body: GOOD_BODY });
    assert.equal(r.status, 403);
    assert.deepEqual(r.json, { error: 'no_organisation' });
    assert.equal(t.prov.calls.length, 0);
  } finally {
    await t.close();
  }
});

test('an auth failure that is not a 401 gets a generic 503 with no internal detail', async () => {
  const t = await setup();
  try {
    const r = await post(t.url, { auth: 'boom', body: GOOD_BODY });
    assert.equal(r.status, 503);
    assert.deepEqual(r.json, { error: 'unavailable' });
    assert.ok(!r.text.includes('hunter2'));
    assert.ok(!r.text.includes('ECONNREFUSED'));
  } finally {
    await t.close();
  }
});

test('flag off: the route is not mounted and POST /api/tutor returns 404', async () => {
  const t = await setup({ enabled: false });
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 404);
    assert.deepEqual(r.json, { error: 'not_found' });
    assert.equal(t.prov.calls.length, 0);
  } finally {
    await t.close();
  }
});

test('flag on: the route is mounted and answers an authenticated learner', async () => {
  const t = await setup({ enabled: true });
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 200);
  } finally {
    await t.close();
  }
});

test('createTutorRouter refuses to build without the authenticate middleware', () => {
  assert.throws(() => createTutorRouter({ runtime: {}, store: {}, env: {} }), /authenticate middleware is required/);
});

// ---------------------------------------------------------------------------
// Body validation and tenant key
// ---------------------------------------------------------------------------

test('bad bodies get 400', async () => {
  const t = await setup();
  try {
    const bad = [
      {},
      { message: '' },
      { message: '   ' },
      { message: 42 },
      { message: ['a'] },
      { message: 'hi', conversationId: 'conv-1' },
      { message: 'x'.repeat(MAX_MESSAGE_CHARS + 1) },
      [],
    ];
    for (const body of bad) {
      const r = await post(t.url, { auth: AUTH_LEARNER_A, body });
      assert.equal(r.status, 400, `expected 400 for ${JSON.stringify(body).slice(0, 60)}`);
      assert.deepEqual(r.json, { error: 'invalid_request' });
    }
    const notJson = await post(t.url, { auth: AUTH_LEARNER_A, raw: 'not json{' });
    assert.equal(notJson.status, 400);
    assert.equal(t.prov.calls.length, 0);
  } finally {
    await t.close();
  }
});

test('a declared body over the route limit gets 413', async () => {
  const t = await setup();
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: { message: 'a'.repeat(4500) } });
    assert.equal(r.status, 413);
    assert.deepEqual(r.json, { error: 'body_too_large' });
  } finally {
    await t.close();
  }
});

test('company id from the request body is rejected, and the tenant comes from auth', async () => {
  const t = await setup();
  try {
    const smuggled = await post(t.url, {
      auth: AUTH_LEARNER_A,
      body: { message: 'How do I handle chemicals?', companyId: 'org-EVIL' },
    });
    assert.equal(smuggled.status, 400);
    assert.equal(t.prov.calls.length, 0);

    const ok = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(ok.status, 200);
    assert.equal(t.prov.calls[0].companyId, 'org-A');
    assert.equal(t.conversations[0].companyId, 'org-A');
    assert.equal(t.messages[0].companyId, 'org-A');
    assert.ok(t.prov.calls.every((c) => c.companyId === 'org-A'));
  } finally {
    await t.close();
  }
});

test('parseTutorBody accepts one trimmed message and rejects everything else', () => {
  assert.deepEqual(parseTutorBody({ message: '  hi  ' }), { ok: true, message: 'hi' });
  assert.deepEqual(parseTutorBody({ message: 'hi', extra: 1 }), { ok: false });
  assert.deepEqual(parseTutorBody(null), { ok: false });
  assert.deepEqual(parseTutorBody('hi'), { ok: false });
});

test('parseRatePerMinute defaults to 10 and rejects bad values', () => {
  assert.equal(parseRatePerMinute(undefined), 10);
  assert.equal(parseRatePerMinute(''), 10);
  assert.equal(parseRatePerMinute('5'), 5);
  assert.throws(() => parseRatePerMinute('0'), /TUTOR_RATE_PER_MINUTE/);
  assert.throws(() => parseRatePerMinute('abc'), /TUTOR_RATE_PER_MINUTE/);
});

// ---------------------------------------------------------------------------
// Rate limit
// ---------------------------------------------------------------------------

test('learner over the per-minute limit gets 429, and another learner is not affected', async () => {
  const t = await setup({ env: { TUTOR_RATE_PER_MINUTE: '2' } });
  try {
    const a1 = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    const a2 = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    const a3 = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(a1.status, 200);
    assert.equal(a2.status, 200);
    assert.equal(a3.status, 429);
    assert.deepEqual(a3.json, { error: 'rate_limited' });

    const other = await post(t.url, { auth: 'user=learner-2,org=org-A', body: GOOD_BODY });
    assert.equal(other.status, 200);
  } finally {
    await t.close();
  }
});

// ---------------------------------------------------------------------------
// Policy, grounding and output
// ---------------------------------------------------------------------------

test('a policy refusal returns the reason code and no reply, and no learner text is logged', async () => {
  const t = await setup();
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: { message: 'I want to kill myself' } });
    assert.equal(r.status, 422);
    assert.deepEqual(r.json, { error: 'refused', reason: 'safety_signal', message: learnerMessageFor('safety_signal') });
    assert.match(r.json.message, /Lifeline/, 'the learner gets the safety message');
    assert.equal(r.json.reply, undefined);
    assert.ok(!r.text.includes('kill myself'), 'the learner text is not echoed back');
    assert.equal(t.prov.calls.length, 0);
    assert.equal(t.conversations.length, 0);
    assert.ok(!JSON.stringify(t.guardEntries).includes('kill myself'));
    assert.ok(!JSON.stringify(t.logged).includes('kill myself'));
    assert.ok(!JSON.stringify(t.logged).includes('Lifeline'), 'the log carries the reason code only');
    assert.deepEqual(t.logged.find((e) => e.event === 'tutor_refused')?.fields, { reason: 'safety_signal' });
  } finally {
    await t.close();
  }
});

test('an assessment answer request is refused with its reason code', async () => {
  const t = await setup();
  try {
    const r = await post(t.url, {
      auth: AUTH_LEARNER_A,
      body: { message: 'what is the correct answer to knowledge check 3?' },
    });
    assert.equal(r.status, 422);
    assert.equal(r.json.reason, 'assessment_answer_request');
    assert.equal(r.json.message, learnerMessageFor('assessment_answer_request'));
    assert.equal(r.json.reply, undefined);
    assert.equal(t.prov.calls.length, 0);
  } finally {
    await t.close();
  }
});

test('when retrieval leaves only assessment material, the route refuses without a model call', async () => {
  const t = await setup({ retrieval: [ASSESSMENT] });
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 422);
    assert.deepEqual(r.json, { error: 'refused', reason: 'no_curriculum_match', message: learnerMessageFor('no_curriculum_match') });
    assert.equal(t.prov.calls.length, 0);
  } finally {
    await t.close();
  }
});

test('happy path returns only reply and citations, and assessment chunks never reach the prompt or citations', async () => {
  const t = await setup({ retrieval: [PASSAGE, ASSESSMENT] });
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 200);
    assert.deepEqual(Object.keys(r.json).sort(), ['citations', 'reply']);
    assert.equal(r.json.reply, 'Gloves protect your hands when handling chemicals.');
    assert.equal(r.json.citations.length, 1);
    assert.equal(r.json.citations[0].document_id, 7);

    const systemPrompt = t.prov.calls[0].messages[0].content;
    assert.ok(systemPrompt.includes('Wear gloves when handling chemicals.'));
    assert.ok(!systemPrompt.includes('correctIndex'));

    assert.equal(t.conversations.length, 1);
    assert.equal(t.messages.length, 2);
    assert.equal(t.messages[0].role, 'user');
    assert.equal(t.messages[0].content, GOOD_BODY.message);
    assert.equal(t.messages[1].role, 'assistant');
  } finally {
    await t.close();
  }
});

test('model output that leaks an answer key is refused with its reason code', async () => {
  const t = await setup({
    provider: fakeProvider(() => ({
      ok: true,
      provider: 'fake',
      model: 'fake-model',
      content: 'The correct answer is option B (correctIndex 1).',
      usage: null,
      latency_ms: 1,
    })),
  });
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 422);
    assert.deepEqual(r.json, { error: 'refused', reason: 'output_answer_leak', message: learnerMessageFor('output_answer_leak') });
    assert.equal(r.json.reply, undefined);
    assert.ok(!r.text.includes('correctIndex'));
    assert.equal(t.conversations.length, 0, 'a refused reply is not stored');
    assert.equal(t.messages.length, 0);
  } finally {
    await t.close();
  }
});

// ---------------------------------------------------------------------------
// Failures
// ---------------------------------------------------------------------------

test('provider failure returns a generic error with no key, payload or learner text in the body or log', async () => {
  const secretPayload = 'upstream 500 sk-live-SECRET123 {"messages":[{"role":"user","content":"how do I handle chemicals"}]}';
  const t = await setup({
    provider: fakeProvider(() => ({
      ok: false,
      provider: 'openai',
      error: secretPayload,
      status: 500,
      retryable: true,
      latency_ms: 2,
    })),
  });
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 503);
    assert.deepEqual(r.json, { error: 'tutor_unavailable' });
    assert.ok(!r.text.includes('sk-live'));
    assert.ok(!r.text.includes('SECRET123'));
    assert.ok(!r.text.includes('messages'));
    const logText = JSON.stringify(t.logged);
    assert.ok(!logText.includes('SECRET123'));
    assert.ok(!logText.includes('how do I handle chemicals'));
    assert.equal(t.logged.find((e) => e.event === 'tutor_provider_failed')?.fields.provider, 'openai');
    // No half-written turn: no conversation, and no learner message without a reply.
    assert.equal(t.conversations.length, 0);
    assert.equal(t.messages.length, 0);
  } finally {
    await t.close();
  }
});

test('a thrown error inside the route returns a generic 503 with no stack or message', async () => {
  const t = await setup({ failRetrieval: true });
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 503);
    assert.deepEqual(r.json, { error: 'tutor_unavailable' });
    assert.ok(!r.text.includes('secret'));
    assert.ok(!r.text.includes('postgres://'));
    assert.ok(!r.text.includes('at '));
    assert.deepEqual(t.logged.find((e) => e.event === 'tutor_error')?.fields, { error_name: 'Error' });
  } finally {
    await t.close();
  }
});

test('the learner message is not stored before the model has replied', async () => {
  let rowsAtModelCall = null;
  let view = null;
  const t = await setup({
    provider: fakeProvider(() => {
      rowsAtModelCall = { conversations: view.conversations.length, messages: view.messages.length };
      return okChat();
    }),
  });
  view = t;
  try {
    const r = await post(t.url, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
    assert.equal(r.status, 200);
    assert.deepEqual(rowsAtModelCall, { conversations: 0, messages: 0 });
    assert.equal(t.messages.length, 2);
  } finally {
    await t.close();
  }
});

test('a store failure after a reply returns a generic 503 and no reply', async () => {
  const t = await setup();
  try {
    const failing = createTutorRouter({
      runtime: createAiRuntime({
        chatProviders: [fakeProvider(okChat)],
        stages: {
          guardrail: createTutorGuardrail({ logger: () => {} }),
        },
      }),
      retrieve: async () => [PASSAGE],
      store: {
        async recordExchange() {
          throw new Error('connection to db-host:5432 refused');
        },
      },
      authenticate: fakeAuth,
      env: {},
      log: () => {},
    });
    const app = express();
    app.use('/api/tutor', failing);
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const { port } = server.address();
      const r = await post(`http://127.0.0.1:${port}`, { auth: AUTH_LEARNER_A, body: GOOD_BODY });
      assert.equal(r.status, 503);
      assert.deepEqual(r.json, { error: 'tutor_unavailable' });
      assert.ok(!r.text.includes('db-host'));
      assert.equal(r.json.reply, undefined);
    } finally {
      server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  } finally {
    await t.close();
  }
});

// ---------------------------------------------------------------------------
// Body size: the route's own limit, with and without the app-level parser having already read the body
// ---------------------------------------------------------------------------

function rawChunkedPost(url: string, payload: string) {
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    const req = http.request(
      `${url}/api/tutor`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${AUTH_LEARNER_A}`, 'transfer-encoding': 'chunked' },
      },
      (res) => {
        let text = '';
        res.on('data', (chunk) => (text += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, text }));
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

test('an undeclared (chunked) body over the route limit gets 413, not a model call', async () => {
  const t = await setup();
  try {
    const r = await rawChunkedPost(t.url, JSON.stringify({ message: 'a'.repeat(4500) }));
    expect(r.status).toBe(413);
    expect(JSON.parse(r.text)).toEqual({ error: 'body_too_large' });
    expect(t.prov.calls.length).toBe(0);
  } finally {
    await t.close();
  }
});

test('a body the app-level parser already read is still refused above the route limit', async () => {
  // Mirrors app.ts: express.json(1 MB) runs first, so the route's own parser never reads the body.
  const runtime = createAiRuntime({ chatProviders: [fakeProvider(okChat)], stages: { guardrail: createTutorGuardrail({ logger: () => {} }) } });
  const router = createTutorRouter({
    runtime,
    retrieve: async () => [PASSAGE],
    store: fakeStore().store,
    authenticate: fakeAuth,
    env: {},
    rateLimit: (_req, _res, next) => next(),
    log: () => {},
  });
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/tutor', router);
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try {
    const big = await fetch(`http://127.0.0.1:${port}/api/tutor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${AUTH_LEARNER_A}` },
      body: JSON.stringify({ message: 'a'.repeat(4500) }),
    });
    expect(big.status).toBe(413);
    const ok = await fetch(`http://127.0.0.1:${port}/api/tutor`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${AUTH_LEARNER_A}` },
      body: JSON.stringify({ message: 'How do I handle chemicals safely?' }),
    });
    expect(ok.status).toBe(200);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('createTutorRouter refuses to build without learner-scoped retrieval', () => {
  const runtime = createAiRuntime({ chatProviders: [], stages: {} });
  expect(() =>
    createTutorRouter({ runtime, store: fakeStore().store, authenticate: fakeAuth, env: {} } as unknown as Parameters<typeof createTutorRouter>[0]),
  ).toThrow(/learner-scoped retrieval is required/);
});
