/**
 * Tests for the Prisma chatbot storage (src/tutor/chatbot/chatbot-store-prisma.ts).
 *
 * The Prisma client is a fake. It applies the schema defaults and the composite foreign keys from
 * prisma/schema.prisma (the chatbot models), and it logs every query so the tests can check the tenant filter
 * on each one. No database, no generated client, no @prisma/client import.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaChatbotStorage, createPrismaChatbotStorage } from '../../../src/tutor/chatbot/chatbot-store-prisma.ts';
import { createChatbotService } from '../../../src/tutor/chatbot/chatbot-service.ts';
import {
  ChatbotError,
  isCompanyId,
  isCuidCompanyId,
  isUuidCompanyId,
  requireCompanyId,
} from '../../../src/tutor/chatbot/chatbot-scope.ts';
import {
  createBuilderRegistry,
  validateSpec,
  composeResponse,
} from '../../../src/tutor/chatbot/generative-ui/index.ts';

const COMPANY_A = '11111111-1111-4111-8111-111111111111';
const COMPANY_B = '22222222-2222-4222-8222-222222222222';
const NOW = new Date('2026-11-08T10:00:00.000Z');

// Column defaults from PROPOSED-SCHEMA.prisma. The Desk store relies on these, so the fake must apply them.
const DEFAULTS = {
  academyChatbot: { language: 'en', welcomeMessage: null, instructions: null, generativeUiEnabled: true, active: true },
  academyChatbotConversation: {
    channel: 'web',
    connectAgentAt: null,
    isShownOnHistory: true,
    ticketStatus: 'new',
    pinned: false,
  },
  academyChatbotMessage: {
    contentType: 'text',
    uiSpec: null,
    mediaUrl: null,
    mediaName: null,
    isInternalNote: false,
    readAt: null,
  },
};

const ALLOWED_UPDATE_FIELDS = {
  academyChatbot: ['updatedAt', 'title', 'language', 'welcomeMessage', 'instructions', 'generativeUiEnabled', 'active'],
  academyChatbotConversation: [
    'updatedAt', 'connectAgentAt', 'ticketStatus', 'pinned', 'lastActivityAt', 'isShownOnHistory',
  ],
};

function matches(row, where) {
  return Object.entries(where).every(([key, value]) => {
    if (value === null) return (row[key] ?? null) === null;
    return row[key] === value;
  });
}

function createFakePrisma() {
  const tables = {
    academyChatbot: new Map(),
    academyChatbotConversation: new Map(),
    academyChatbotMessage: new Map(),
  };
  const calls = [];

  const exists = (model, where) => [...tables[model].values()].some((row) => matches(row, where));

  const delegate = (model) => ({
    async create({ data }) {
      calls.push({ model, op: 'create', data: structuredClone(data) });
      const supplied = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
      const row = { id: randomUUID(), ...DEFAULTS[model], ...supplied };
      // Composite foreign keys: (companyId, chatbotId) and (companyId, conversationId).
      if (model === 'academyChatbotConversation' && !exists('academyChatbot', { companyId: row.companyId, id: row.chatbotId })) {
        throw new Error('Foreign key constraint failed: chatbot_conversations_company_chatbot_fk');
      }
      if (model === 'academyChatbotMessage' && !exists('academyChatbotConversation', { companyId: row.companyId, id: row.conversationId })) {
        throw new Error('Foreign key constraint failed: chatbot_messages_company_conversation_fk');
      }
      tables[model].set(row.id, row);
      return { ...row };
    },

    async findFirst({ where, select }) {
      calls.push({ model, op: 'findFirst', where: structuredClone(where) });
      const row = [...tables[model].values()].find((candidate) => matches(candidate, where));
      if (!row) return null;
      if (!select) return { ...row };
      return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, row[key]]));
    },

    async findMany({ where, orderBy }) {
      calls.push({ model, op: 'findMany', where: structuredClone(where), orderBy });
      let rows = [...tables[model].values()].filter((row) => matches(row, where));
      if (orderBy) {
        const [[field, direction]] = Object.entries(orderBy);
        const sign = direction === 'asc' ? 1 : -1;
        rows = rows.sort((a, b) => (a[field] - b[field]) * sign);
      }
      return rows.map((row) => ({ ...row }));
    },

    async updateMany({ where, data }) {
      calls.push({ model, op: 'updateMany', where: structuredClone(where), data: structuredClone(data) });
      let count = 0;
      for (const row of tables[model].values()) {
        if (!matches(row, where)) continue;
        Object.assign(row, data);
        count += 1;
      }
      return { count };
    },
  });

  return {
    academyChatbot: delegate('academyChatbot'),
    academyChatbotConversation: delegate('academyChatbotConversation'),
    academyChatbotMessage: delegate('academyChatbotMessage'),
    _tables: tables,
    _calls: calls,
  };
}

const registry = createBuilderRegistry({
  manifest: { allowed_actions: ['open_ticket'], surface_profiles: [] },
  collections: {
    components: {
      stack: { id: 'stack', name: 'Stack' },
      text: { id: 'text', name: 'Text' },
    },
  },
});

function validSpec() {
  return {
    version: '1.1',
    authority: 'presentation-only',
    surface: 'chat',
    root: 'root',
    state: {},
    meta: { title: 'Generated interface' },
    persistence: { scope: 'message' },
    elements: {
      root: { type: 'stack', props: {}, children: ['t'] },
      t: { type: 'text', props: { text: 'hello' } },
    },
  };
}

/** Seeds one chatbot, one conversation and one unread user message for a company. */
async function seed(storage, companyId) {
  const chatbot = await storage.insertChatbot(companyId, { title: 'Support' }, NOW);
  const conversation = await storage.insertConversation(companyId, { chatbotId: chatbot.id, sessionId: 's-1' }, NOW);
  const userMessage = await storage.insertMessage(companyId, {
    conversationId: conversation.id,
    role: 'user',
    message: 'Where is my invoice?',
    createdAt: NOW,
  });
  return { chatbot, conversation, userMessage };
}

test('every read and write carries the company id in its where or data', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const { chatbot, conversation } = await seed(storage, COMPANY_A);
  await storage.updateChatbot(COMPANY_A, chatbot.id, { title: 'Renamed' }, NOW);
  await storage.updateConversation(COMPANY_A, conversation.id, { pinned: true }, NOW);
  await storage.markUserMessagesRead(COMPANY_A, conversation.id, NOW);
  await storage.findChatbot(COMPANY_A, chatbot.id);
  await storage.listChatbots(COMPANY_A);
  await storage.findConversation(COMPANY_A, conversation.id);
  await storage.listConversations(COMPANY_A);
  await storage.listMessages(COMPANY_A, conversation.id);

  assert.ok(prisma._calls.length >= 12, 'expected the flow to issue several queries');
  for (const call of prisma._calls) {
    if (call.op === 'create') {
      assert.equal(call.data.companyId, COMPANY_A, `${call.model} create without company id`);
    } else {
      assert.equal(call.where.companyId, COMPANY_A, `${call.model} ${call.op} without company id in where`);
    }
  }
});

test('a read for another company returns nothing', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const { chatbot, conversation, userMessage } = await seed(storage, COMPANY_A);

  assert.equal(await storage.findChatbot(COMPANY_B, chatbot.id), null);
  assert.deepEqual(await storage.listChatbots(COMPANY_B), []);
  assert.equal(await storage.findConversation(COMPANY_B, conversation.id), null);
  assert.deepEqual(await storage.listConversations(COMPANY_B), []);
  assert.deepEqual(await storage.listMessages(COMPANY_B, conversation.id), []);

  // Company A still sees its own rows.
  assert.equal((await storage.findChatbot(COMPANY_A, chatbot.id)).id, chatbot.id);
  assert.equal((await storage.listMessages(COMPANY_A, conversation.id))[0].id, userMessage.id);
});

test('writes for another company change nothing and return null or zero', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const { chatbot, conversation } = await seed(storage, COMPANY_A);

  assert.equal(await storage.updateChatbot(COMPANY_B, chatbot.id, { title: 'Hijacked' }, NOW), null);
  assert.equal(await storage.updateConversation(COMPANY_B, conversation.id, { pinned: true }, NOW), null);
  assert.equal(
    await storage.insertMessage(COMPANY_B, { conversationId: conversation.id, role: 'assistant', message: 'x', createdAt: NOW }),
    null,
  );
  assert.equal(await storage.markUserMessagesRead(COMPANY_B, conversation.id, NOW), 0);

  assert.equal((await storage.findChatbot(COMPANY_A, chatbot.id)).title, 'Support');
  assert.equal((await storage.findConversation(COMPANY_A, conversation.id)).pinned, false);
  const messages = await storage.listMessages(COMPANY_A, conversation.id);
  assert.equal(messages.length, 1, 'no assistant message may be written into company A');
  assert.equal(messages[0].readAt, null, 'company B must not mark company A messages read');
});

test('a patch cannot move a row to another company', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const { chatbot } = await seed(storage, COMPANY_A);

  const updated = await storage.updateChatbot(COMPANY_A, chatbot.id, { title: 'New', companyId: COMPANY_B, id: 'other' }, NOW);
  assert.equal(updated.companyId, COMPANY_A);
  assert.equal(updated.id, chatbot.id);
  assert.equal(updated.title, 'New');

  const writes = prisma._calls.filter((call) => call.op === 'updateMany');
  for (const call of writes) {
    const allowed = ALLOWED_UPDATE_FIELDS[call.model];
    for (const key of Object.keys(call.data)) {
      assert.ok(allowed.includes(key), `${call.model} update wrote ${key}`);
    }
  }
});

test('invalid company scope fails closed before any query runs', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);

  await assert.rejects(storage.listChatbots('not-a-uuid'), (error) => error instanceof ChatbotError && error.status === 403);
  await assert.rejects(storage.findChatbot(undefined, 'x'), (error) => error instanceof ChatbotError && error.status === 403);
  await assert.rejects(
    storage.insertMessage('', { conversationId: 'x', role: 'user', message: 'y', createdAt: NOW }),
    (error) => error instanceof ChatbotError && error.status === 403,
  );
  assert.equal(prisma._calls.length, 0, 'no query may run without a valid company id');
});

test('the composite foreign key stops a message pointing at another company conversation', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const { conversation } = await seed(storage, COMPANY_A);

  // Bypasses the application ownership check on purpose, to test the database rule the DRAFT relies on.
  await assert.rejects(
    prisma.academyChatbotMessage.create({
      data: { companyId: COMPANY_B, conversationId: conversation.id, role: 'user', message: 'x', createdAt: NOW },
    }),
    /Foreign key constraint failed/,
  );
});

test('uiSpec is stored as a copy and stays null for plain text', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const { chatbot, conversation } = await seed(storage, COMPANY_A);
  const spec = { version: '1.1', root: 'root' };

  const stored = await storage.insertMessage(COMPANY_A, {
    conversationId: conversation.id,
    role: 'assistant',
    message: 'card',
    contentType: 'titan-ui',
    uiSpec: spec,
    createdAt: NOW,
  });
  spec.root = 'changed';
  assert.deepEqual(stored.uiSpec, { version: '1.1', root: 'root' });

  const plain = await storage.insertMessage(COMPANY_A, {
    conversationId: conversation.id,
    role: 'assistant',
    message: 'hi',
    createdAt: NOW,
  });
  assert.equal(plain.uiSpec, null);
  assert.equal(plain.contentType, 'text');
  assert.equal(chatbot.companyId, COMPANY_A);
});

test('markUserMessagesRead only changes unread user messages of the same conversation and company', async () => {
  const prisma = createFakePrisma();
  const storage = createPrismaChatbotStorage(prisma);
  const { conversation } = await seed(storage, COMPANY_A);
  await storage.insertMessage(COMPANY_A, { conversationId: conversation.id, role: 'assistant', message: 'a', createdAt: NOW });

  assert.equal(await storage.markUserMessagesRead(COMPANY_A, conversation.id, NOW), 1);
  assert.equal(await storage.markUserMessagesRead(COMPANY_A, conversation.id, NOW), 0);
  const messages = await storage.listMessages(COMPANY_A, conversation.id);
  assert.equal(messages.find((m) => m.role === 'assistant').readAt, null);
  assert.deepEqual(messages.find((m) => m.role === 'user').readAt, NOW);
});

test('the service runs on the Prisma store and rejects an invalid generated interface', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const service = createChatbotService({ storage, now: () => NOW, generativeUi: { registry } });

  const chatbot = await service.createChatbot(COMPANY_A, { title: '  Support  ' });
  assert.equal(chatbot.title, 'Support');
  const conversation = await service.startConversation(COMPANY_A, { chatbotId: chatbot.id, sessionId: 's-2' });

  // Another company cannot start a conversation on this chatbot.
  await assert.rejects(
    service.startConversation(COMPANY_B, { chatbotId: chatbot.id, sessionId: 's-3' }),
    (error) => error instanceof ChatbotError && error.status === 404,
  );

  // An unknown component type fails the validator, so the reply is stored as plain text.
  const badSpec = validSpec();
  badSpec.elements.t.type = 'iframe';
  const badReply = await service.recordAssistantReply(
    COMPANY_A,
    conversation.id,
    `Here you go.\n\`\`\`titan-ui\n${JSON.stringify(badSpec)}\n\`\`\``,
  );
  assert.equal(badReply.accepted, false);
  assert.equal(badReply.message.contentType, 'text');
  assert.equal(badReply.message.uiSpec, null);

  // A valid spec is accepted and stored.
  const goodReply = await service.recordAssistantReply(
    COMPANY_A,
    conversation.id,
    `Here you go.\n\`\`\`titan-ui\n${JSON.stringify(validSpec())}\n\`\`\``,
  );
  assert.equal(goodReply.accepted, true);
  assert.equal(goodReply.message.contentType, 'titan-ui');
  assert.equal(goodReply.message.uiSpec.root, 'root');
});

test('the copied spec validator rejects invalid specs and accepts a valid one', () => {
  const good = validateSpec(validSpec(), registry);
  assert.equal(good.valid, true, JSON.stringify(good.issues));

  const unknownType = validSpec();
  unknownType.elements.t.type = 'iframe';
  const byType = validateSpec(unknownType, registry);
  assert.equal(byType.valid, false);
  assert.ok(byType.issues.some((issue) => issue.path === '/elements/t/type' && issue.severity === 'error'));

  const offAllowList = validSpec();
  offAllowList.elements.t.on = { click: { action: 'delete_everything' } };
  const byAction = validateSpec(offAllowList, registry);
  assert.equal(byAction.valid, false);
  assert.ok(byAction.issues.some((issue) => issue.path === '/elements/t/on/click/0/action'));

  const rawHtml = validSpec();
  rawHtml.elements.t.props = { html: '<b>x</b>' };
  const byHtml = validateSpec(rawHtml, registry);
  assert.equal(byHtml.valid, false);
  assert.ok(byHtml.issues.some((issue) => issue.path === '/elements/t/props/html'));

  const reply = composeResponse(
    `Here.\n\`\`\`titan-ui\n${JSON.stringify(unknownType)}\n\`\`\``,
    registry,
    'chat',
  );
  assert.equal(reply.accepted, false);
  assert.equal(reply.spec, null);
});

// Tenant id rule for the LMS (decision 1 in src/tutor/chatbot/CHANGES.md). Cuid-style ids are accepted as-is.
const CUID_A = 'clx7k2m3p0000abcd1234efgh';
const CUID_B = 'cm9z8y7x6w0001qrst5678uvwx';

test('scope: a cuid-style LMS tenant id is accepted', () => {
  for (const id of [CUID_A, CUID_B, 'c'.repeat(20), 'A' + '1'.repeat(29)]) {
    assert.equal(isCuidCompanyId(id), true, `${id} should be a cuid-style id`);
    assert.equal(isCompanyId(id), true);
    assert.equal(requireCompanyId(id), id);
  }
});

test('scope: a UUID is still accepted, and the strict UUID rule still works for Desk', () => {
  assert.equal(isCompanyId(COMPANY_A), true);
  assert.equal(requireCompanyId(COMPANY_A), COMPANY_A);
  assert.equal(isUuidCompanyId(COMPANY_A), true);
  assert.equal(isUuidCompanyId(CUID_A), false, 'the strict UUID rule must not accept a cuid');
});

test('scope: empty, non-string and malformed ids are rejected with 403', () => {
  const rejected = [
    '',
    '   ',
    null,
    undefined,
    42,
    {},
    ['clx7k2m3p0000abcd1234efgh'],
    'c' + 'x'.repeat(18), // 19 characters: too short
    '1' + 'x'.repeat(23), // starts with a digit
    'x'.repeat(31), // 31 characters: too long
    'clx7k2m3p0000abcd1234 efgh', // space
    'clx7k2m3p0000abcd1234efg-', // hyphen, not a UUID
    'clx7k2m3p0000abcd1234efg_', // underscore
    "clx7k2m3p0000abcd'; DROP--", // injection-shaped
    'not-a-uuid',
    '11111111-1111-4111-8111-11111111111', // one character short of a UUID
  ];

  for (const value of rejected) {
    assert.equal(isCompanyId(value), false, `${JSON.stringify(value)} should be rejected`);
    assert.throws(
      () => requireCompanyId(value),
      (error) => error instanceof ChatbotError && error.status === 403,
      `${JSON.stringify(value)} should fail closed with 403`,
    );
  }
  assert.equal(isCompanyId('c' + 'x'.repeat(29)), true, '30 characters is the upper bound and is accepted');
  assert.equal(isCompanyId('c' + 'x'.repeat(19)), true, '20 characters is the lower bound and is accepted');
});

test('cross-tenant read with cuid tenants returns nothing', async () => {
  const prisma = createFakePrisma();
  const storage = new PrismaChatbotStorage(prisma);
  const { chatbot, conversation, userMessage } = await seed(storage, CUID_A);

  assert.equal(await storage.findChatbot(CUID_B, chatbot.id), null);
  assert.deepEqual(await storage.listChatbots(CUID_B), []);
  assert.equal(await storage.findConversation(CUID_B, conversation.id), null);
  assert.deepEqual(await storage.listConversations(CUID_B), []);
  assert.deepEqual(await storage.listMessages(CUID_B, conversation.id), []);
  assert.equal(await storage.updateChatbot(CUID_B, chatbot.id, { title: 'Hijacked' }, NOW), null);

  assert.equal((await storage.findChatbot(CUID_A, chatbot.id)).title, 'Support');
  assert.equal((await storage.listMessages(CUID_A, conversation.id))[0].id, userMessage.id);
});
