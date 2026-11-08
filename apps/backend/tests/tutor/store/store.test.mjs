import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PrismaTutorStore, TutorStoreError } from '../../../src/tutor/store/prisma-store.ts';
import { purgeExpiredTutorData, tutorRetentionCutoff } from '../../../src/tutor/store/retention.ts';
import { AiRuntimeError } from '../../../src/ai-runtime/types.ts';

const DAY_MS = 86_400_000;
const NOW = new Date('2026-11-08T00:00:00.000Z');
const daysBefore = (days, ms = 0) => new Date(NOW.getTime() - days * DAY_MS - ms);

/** In-memory stand-in for the Prisma delegates the store and retention job use. Supports the where keys they use. */
function createFakePrisma() {
  const tables = { conversations: [], messages: [], audits: [] };
  const calls = [];
  let seq = 0;
  const nextId = (prefix) => `${prefix}_${++seq}`;

  const matches = (row, where = {}) =>
    Object.entries(where).every(([key, value]) => {
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        if ('in' in value) return value.in.includes(row[key]);
        if ('lt' in value) return row[key] < value.lt;
      }
      return row[key] === value;
    });

  const byCreatedAsc = (a, b) => a.createdAt - b.createdAt;

  const delegate = (name, table, prefix, extra = {}) => ({
    create({ data }) {
      calls.push([name, 'create', data]);
      const row = { id: nextId(prefix), createdAt: new Date(), ...data };
      table.push(row);
      return Promise.resolve({ ...row });
    },
    findFirst({ where }) {
      calls.push([name, 'findFirst', where]);
      const row = table.find((r) => matches(r, where));
      return Promise.resolve(row ? { ...row } : null);
    },
    findMany({ where, take }) {
      calls.push([name, 'findMany', where, take]);
      let rows = table.filter((r) => matches(r, where)).sort(byCreatedAsc);
      if (take !== undefined) rows = rows.slice(0, take);
      return Promise.resolve(rows.map((r) => ({ ...r })));
    },
    deleteMany({ where }) {
      calls.push([name, 'deleteMany', where]);
      let count = 0;
      for (let i = table.length - 1; i >= 0; i -= 1) {
        if (matches(table[i], where)) {
          table.splice(i, 1);
          count += 1;
        }
      }
      return Promise.resolve({ count });
    },
    ...extra,
  });

  const client = {
    academyTutorConversation: delegate('conversation', tables.conversations, 'conv'),
    academyTutorMessage: delegate('message', tables.messages, 'msg'),
    academyTutorToolAudit: delegate('audit', tables.audits, 'aud'),
    $transaction(operations) {
      return Promise.all(operations);
    },
  };

  return { client, tables, calls };
}

function seedGraph(tables, { id, companyId, createdAt }) {
  tables.conversations.push({ id, companyId, learnerId: 'learner-1', createdAt, updatedAt: createdAt });
  tables.messages.push({
    id: `${id}-msg`,
    companyId,
    conversationId: id,
    role: 'user',
    content: 'x',
    createdAt,
  });
  tables.audits.push({
    id: `${id}-aud`,
    companyId,
    conversationId: id,
    tool: 't',
    userId: null,
    inputHash: 'h',
    status: 'success',
    durationMs: 1,
    error: null,
    createdAt,
  });
}

test('retention deletes only conversations (and their messages and audits) strictly older than the cutoff', async () => {
  const { client, tables } = createFakePrisma();
  seedGraph(tables, { id: 'c-old', companyId: 'org-A', createdAt: daysBefore(31) });
  seedGraph(tables, { id: 'c-just-old', companyId: 'org-B', createdAt: daysBefore(30, 1) });
  seedGraph(tables, { id: 'c-edge', companyId: 'org-A', createdAt: daysBefore(30) });
  seedGraph(tables, { id: 'c-new', companyId: 'org-B', createdAt: daysBefore(1) });

  const result = await purgeExpiredTutorData(client, { now: NOW });

  assert.equal(result.cutoff.getTime(), NOW.getTime() - 30 * DAY_MS);
  assert.equal(result.conversations, 2);
  assert.equal(result.messages, 2);
  assert.equal(result.toolAudits, 2);
  assert.deepEqual(tables.conversations.map((r) => r.id).sort(), ['c-edge', 'c-new']);
  assert.deepEqual(tables.messages.map((r) => r.conversationId).sort(), ['c-edge', 'c-new']);
  assert.deepEqual(tables.audits.map((r) => r.conversationId).sort(), ['c-edge', 'c-new']);
});

test('retention period is a parameter; the default is 30 days', async () => {
  assert.equal(tutorRetentionCutoff(NOW).getTime(), NOW.getTime() - 30 * DAY_MS);
  assert.equal(tutorRetentionCutoff(NOW, 7).getTime(), NOW.getTime() - 7 * DAY_MS);

  const { client, tables } = createFakePrisma();
  seedGraph(tables, { id: 'c-10d', companyId: 'org-A', createdAt: daysBefore(10) });
  seedGraph(tables, { id: 'c-2d', companyId: 'org-A', createdAt: daysBefore(2) });

  const result = await purgeExpiredTutorData(client, { now: NOW, retentionDays: 7 });

  assert.equal(result.conversations, 1);
  assert.deepEqual(tables.conversations.map((r) => r.id), ['c-2d']);
});

test('retention works in batches until a short batch ends the run', async () => {
  const { client, tables, calls } = createFakePrisma();
  for (let i = 0; i < 5; i += 1) {
    seedGraph(tables, { id: `c-${i}`, companyId: 'org-A', createdAt: daysBefore(40 + i) });
  }
  seedGraph(tables, { id: 'c-keep', companyId: 'org-A', createdAt: daysBefore(3) });

  const result = await purgeExpiredTutorData(client, { now: NOW, batchSize: 2 });

  assert.equal(result.batches, 3);
  assert.equal(result.conversations, 5);
  assert.deepEqual(tables.conversations.map((r) => r.id), ['c-keep']);
  const takes = calls.filter((c) => c[0] === 'conversation' && c[1] === 'findMany').map((c) => c[3]);
  assert.deepEqual(takes, [2, 2, 2]);
});

test('retention refuses an invalid retention period or batch size before touching the database', async () => {
  const { client, calls } = createFakePrisma();
  for (const retentionDays of [0, 1.5, -1, '30', NaN]) {
    await assert.rejects(purgeExpiredTutorData(client, { now: NOW, retentionDays }), RangeError);
  }
  await assert.rejects(purgeExpiredTutorData(client, { now: NOW, batchSize: 0 }), RangeError);
  assert.equal(calls.length, 0);
});

test('store writes are scoped to the company id', async () => {
  const { client, tables } = createFakePrisma();
  const store = new PrismaTutorStore(client);

  const conv = await store.createConversation({ companyId: 'org-A', learnerId: 'learner-1' });
  assert.equal(conv.companyId, 'org-A');
  assert.equal(tables.conversations[0].companyId, 'org-A');

  const numeric = await store.createConversation({ companyId: 7, learnerId: 'learner-2' });
  assert.equal(numeric.companyId, '7');
  assert.equal(tables.conversations[1].companyId, '7');

  const msg = await store.appendMessage({ companyId: 'org-A', conversationId: conv.id, role: 'user', content: 'hello' });
  assert.equal(msg.companyId, 'org-A');
  assert.equal(tables.messages[0].companyId, 'org-A');
  assert.equal(tables.messages[0].conversationId, conv.id);

  const audit = await store.recordToolAudit({
    companyId: 'org-A',
    conversationId: conv.id,
    entry: {
      tool: 'lookup',
      company_id: 'org-A',
      user_id: 42,
      input_hash: 'abc',
      status: 'success',
      duration_ms: 12,
      error: null,
    },
  });
  assert.equal(audit.companyId, 'org-A');
  assert.equal(audit.userId, '42');
  assert.equal(tables.audits[0].companyId, 'org-A');
});

test('store does not return or write another company\'s conversation', async () => {
  const { client, tables } = createFakePrisma();
  const store = new PrismaTutorStore(client);
  const conv = await store.createConversation({ companyId: 'org-A', learnerId: 'learner-1' });
  await store.appendMessage({ companyId: 'org-A', conversationId: conv.id, role: 'user', content: 'secret' });

  await assert.rejects(
    store.appendMessage({ companyId: 'org-B', conversationId: conv.id, role: 'user', content: 'intrude' }),
    (err) => err instanceof TutorStoreError && err.code === 'conversation_not_found',
  );
  assert.deepEqual(await store.listMessages({ companyId: 'org-B', conversationId: conv.id }), []);
  await assert.rejects(
    store.recordToolAudit({
      companyId: 'org-B',
      conversationId: conv.id,
      entry: { tool: 't', company_id: 'org-B', user_id: null, input_hash: 'h', status: 'blocked', duration_ms: 0, error: null },
    }),
    (err) => err instanceof TutorStoreError && err.code === 'conversation_not_found',
  );
  assert.equal(tables.messages.length, 1);
  assert.equal(tables.audits.length, 0);
});

test('tool audit sink refuses an entry from a different company', async () => {
  const { client, tables } = createFakePrisma();
  const store = new PrismaTutorStore(client);
  const conv = await store.createConversation({ companyId: 'org-A', learnerId: 'learner-1' });
  const sink = store.toolAuditSink({ companyId: 'org-A', conversationId: conv.id });

  await assert.rejects(
    sink({ tool: 't', company_id: 'org-B', user_id: null, input_hash: 'h', status: 'success', duration_ms: 1, error: null }),
    (err) => err instanceof TutorStoreError && err.code === 'scope_mismatch',
  );
  assert.equal(tables.audits.length, 0);

  const ok = await sink({ tool: 't', company_id: 'org-A', user_id: null, input_hash: 'h', status: 'timed_out', duration_ms: 30000, error: 'timeout_after_30000ms' });
  assert.equal(ok.status, 'timed_out');
  assert.equal(tables.audits.length, 1);
  assert.equal(tables.audits[0].companyId, 'org-A');
});

test('recordExchange writes the conversation and both messages in one transaction, scoped to the company', async () => {
  const { client, tables } = createFakePrisma();
  let transactions = 0;
  const transaction = client.$transaction;
  client.$transaction = (operations) => {
    transactions += 1;
    return transaction(operations);
  };
  const store = new PrismaTutorStore(client);
  const result = await store.recordExchange({ companyId: 'org-A', learnerId: 'learner-1', userContent: 'q?', assistantContent: 'a.' });

  assert.equal(transactions, 1, 'one transaction for the turn');
  assert.equal(tables.conversations.length, 1);
  assert.equal(tables.conversations[0].id, result.id);
  assert.equal(tables.conversations[0].companyId, 'org-A');
  assert.equal(tables.conversations[0].learnerId, 'learner-1');
  const messages = await store.listMessages({ companyId: 'org-A', conversationId: result.id });
  assert.deepEqual(messages.map((m) => [m.role, m.content, m.companyId]), [
    ['user', 'q?', 'org-A'],
    ['assistant', 'a.', 'org-A'],
  ]);
  assert.deepEqual(await store.listMessages({ companyId: 'org-B', conversationId: result.id }), []);
});

test('recordExchange refuses bad input before any database call', async () => {
  const { client, calls } = createFakePrisma();
  const store = new PrismaTutorStore(client);
  await assert.rejects(store.recordExchange({ companyId: undefined, learnerId: 'l', userContent: 'q', assistantContent: 'a' }), (err) => err instanceof AiRuntimeError && err.code === 'company_id_required');
  await assert.rejects(store.recordExchange({ companyId: 'org-A', learnerId: '', userContent: 'q', assistantContent: 'a' }), (err) => err instanceof TutorStoreError && err.code === 'input_invalid');
  await assert.rejects(store.recordExchange({ companyId: 'org-A', learnerId: 'l', userContent: 'q', assistantContent: null }), (err) => err instanceof TutorStoreError && err.code === 'input_invalid');
  assert.equal(calls.length, 0);
});

test('store refuses calls without a company id before any database call', async () => {
  const { client, calls } = createFakePrisma();
  const store = new PrismaTutorStore(client);
  const entry = { tool: 't', company_id: 'org-A', user_id: null, input_hash: 'h', status: 'success', duration_ms: 1, error: null };

  for (const companyId of [undefined, null, '']) {
    await assert.rejects(store.createConversation({ companyId, learnerId: 'l' }), (err) => err instanceof AiRuntimeError && err.code === 'company_id_required');
    await assert.rejects(store.appendMessage({ companyId, conversationId: 'c', role: 'user', content: 'x' }), (err) => err instanceof AiRuntimeError && err.code === 'company_id_required');
    await assert.rejects(store.listMessages({ companyId, conversationId: 'c' }), (err) => err instanceof AiRuntimeError && err.code === 'company_id_required');
    await assert.rejects(store.recordToolAudit({ companyId, conversationId: 'c', entry }), (err) => err instanceof AiRuntimeError && err.code === 'company_id_required');
    assert.throws(() => store.toolAuditSink({ companyId, conversationId: 'c' }), (err) => err instanceof AiRuntimeError && err.code === 'company_id_required');
  }
  await assert.rejects(store.createConversation({ companyId: 'bad id!', learnerId: 'l' }), (err) => err instanceof AiRuntimeError && err.code === 'company_id_invalid');
  assert.equal(calls.length, 0);
});

test('store constructor requires an injected client with the tutor delegates and never builds PrismaClient', async () => {
  assert.throws(() => new PrismaTutorStore({}), (err) => err instanceof TutorStoreError && err.code === 'config_invalid');
  assert.throws(() => new PrismaTutorStore(undefined), (err) => err instanceof TutorStoreError && err.code === 'config_invalid');

  const source = readFileSync(fileURLToPath(new URL('../../../src/tutor/store/prisma-store.ts', import.meta.url)), 'utf8');
  assert.equal(/new PrismaClient\b/.test(source), false);
  assert.equal(/from ['"]@prisma\/client['"]/.test(source), false);
});
