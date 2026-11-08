/**
 * Tests for the tutor chat clients in src/ai-runtime/providers. Every HTTP call goes through a fake fetch
 * injected by constructor option. No network, no real keys.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAiChatClient } from '../../src/ai-runtime/providers/openai.ts';
import { AnthropicChatClient } from '../../src/ai-runtime/providers/anthropic.ts';
import { resolveModel, parseTimeoutMs, ProviderConfigError, classifyHttpStatus } from '../../src/ai-runtime/providers/shared.ts';
import { ProviderFailoverChain } from '../../src/ai-runtime/failover.ts';
import { PROVIDER_NOT_CONFIGURED } from '../../src/ai-runtime/contracts.ts';

const OPENAI_KEY = 'sk-test-openai-SECRETVALUE-0001';
const ANTHROPIC_KEY = 'sk-ant-test-SECRETVALUE-0002';
const REQUEST = { companyId: 7, messages: [{ role: 'system', content: 'Be a tutor.' }, { role: 'user', content: 'What is pH?' }] };

function openAiEnv(extra = {}) {
  return { OPENAI_API_KEY: OPENAI_KEY, TUTOR_OPENAI_MODEL: 'test-openai-model', ...extra };
}

function anthropicEnv(extra = {}) {
  return { ANTHROPIC_API_KEY: ANTHROPIC_KEY, TUTOR_ANTHROPIC_MODEL: 'test-claude-model', ...extra };
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function recordingFetch(responder) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    return responder(url, init);
  };
  return { fetchImpl, calls };
}

/** Captures console output so the tests can assert that no key reaches a log. */
function captureConsole(fn) {
  const lines = [];
  const methods = ['log', 'info', 'warn', 'error', 'debug'];
  const originals = {};
  for (const m of methods) {
    originals[m] = console[m];
    console[m] = (...args) => lines.push(args.map(String).join(' '));
  }
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const m of methods) console[m] = originals[m];
    })
    .then((value) => ({ value, lines }));
}

const OPENAI_OK = {
  id: 'x',
  model: 'test-openai-model',
  choices: [{ index: 0, message: { role: 'assistant', content: 'pH is a measure of acidity.' } }],
  usage: { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 },
};

const ANTHROPIC_OK = {
  id: 'msg_1',
  type: 'message',
  role: 'assistant',
  content: [{ type: 'text', text: 'pH is a measure of acidity.' }],
  usage: { input_tokens: 12, output_tokens: 7 },
};

// ---------- config helpers ----------

test('resolveModel refuses an unset or blank model name with a typed error', () => {
  assert.throws(() => resolveModel({}, 'TUTOR_OPENAI_MODEL'), (err) => err instanceof ProviderConfigError && err.code === 'model_not_configured');
  assert.throws(() => resolveModel({ TUTOR_OPENAI_MODEL: '   ' }, 'TUTOR_OPENAI_MODEL'), ProviderConfigError);
  assert.equal(resolveModel({ TUTOR_OPENAI_MODEL: ' m1 ' }, 'TUTOR_OPENAI_MODEL'), 'm1');
});

test('timeout parsing accepts positive integers and falls back to 20 seconds otherwise', () => {
  assert.equal(parseTimeoutMs(undefined), 20_000);
  assert.equal(parseTimeoutMs('abc'), 20_000);
  assert.equal(parseTimeoutMs('0'), 20_000);
  assert.equal(parseTimeoutMs('-5'), 20_000);
  assert.equal(parseTimeoutMs('1500'), 1500);
});

test('classifyHttpStatus marks 429 and 500/502/503/504 as retryable', () => {
  for (const status of [429, 500, 502, 503, 504]) assert.equal(classifyHttpStatus(status).retryable, true, String(status));
  assert.equal(classifyHttpStatus(401).retryable, false);
});

// ---------- OpenAI ----------

test('openai: missing key returns the disabled-provider refusal and never calls fetch', async () => {
  const { fetchImpl, calls } = recordingFetch(() => jsonResponse(200, OPENAI_OK));
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: { TUTOR_OPENAI_MODEL: 'm' } });
  const result = await client.chat(REQUEST);
  assert.deepEqual(result, { ok: false, provider: 'disabled', error: PROVIDER_NOT_CONFIGURED, status: null, retryable: false, latency_ms: null });
  assert.equal(calls.length, 0);
});

test('openai: missing model refuses with model_not_configured and never calls fetch', async () => {
  const { fetchImpl, calls } = recordingFetch(() => jsonResponse(200, OPENAI_OK));
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: { OPENAI_API_KEY: OPENAI_KEY } });
  const result = await client.chat(REQUEST);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'model_not_configured');
  assert.equal(result.retryable, false);
  assert.equal(calls.length, 0);
});

test('openai: success maps the reply text, usage and model, and sends the key in the header', async () => {
  const { fetchImpl, calls } = recordingFetch(() => jsonResponse(200, OPENAI_OK));
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() });
  const result = await client.chat({ ...REQUEST, options: { temperature: 0.2, max_tokens: 300 } });

  assert.equal(result.ok, true);
  assert.equal(result.provider, 'openai');
  assert.equal(result.model, 'test-openai-model');
  assert.equal(result.content, 'pH is a measure of acidity.');
  assert.deepEqual(result.usage, { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 });
  assert.equal(typeof result.latency_ms, 'number');
  assert.deepEqual(Object.keys(result).sort(), ['content', 'latency_ms', 'model', 'ok', 'provider', 'usage']);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(calls[0].init.headers.authorization, `Bearer ${OPENAI_KEY}`);
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.model, 'test-openai-model');
  assert.equal(sent.temperature, 0.2);
  assert.equal(sent.max_completion_tokens, 300);
  assert.deepEqual(sent.messages, REQUEST.messages);
});

test('openai: a 429 maps to a retryable failure with status 429 and no provider text', async () => {
  const { fetchImpl } = recordingFetch(() => jsonResponse(429, { error: { message: `rate limit for ${OPENAI_KEY}` } }));
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() });
  const result = await client.chat(REQUEST);
  assert.equal(result.ok, false);
  assert.equal(result.status, 429);
  assert.equal(result.error, 'rate_limited');
  assert.equal(result.retryable, true);
  assert.ok(!JSON.stringify(result).includes(OPENAI_KEY));
});

test('openai: 500, 502, 503 and 504 map to retryable failures', async () => {
  for (const status of [500, 502, 503, 504]) {
    const { fetchImpl } = recordingFetch(() => jsonResponse(status, {}));
    const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() });
    const result = await client.chat(REQUEST);
    assert.equal(result.status, status);
    assert.equal(result.retryable, true, String(status));
  }
});

test('openai: 401 is not retryable, so the chain would stop on it', async () => {
  const { fetchImpl } = recordingFetch(() => jsonResponse(401, {}));
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() });
  const result = await client.chat(REQUEST);
  assert.equal(result.status, 401);
  assert.equal(result.error, 'auth_failed');
  assert.equal(result.retryable, false);
});

test('openai: a timeout maps to a retryable transport failure with status null', async () => {
  const fetchImpl = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv(), timeoutMs: 25 });
  const started = Date.now();
  const result = await client.chat(REQUEST);
  assert.ok(Date.now() - started < 2000, 'timeout should fire quickly');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'timeout');
  assert.equal(result.status, null);
  assert.equal(result.retryable, true);
});

test('openai: timeout is read from TUTOR_OPENAI_TIMEOUT_MS when no option is given', async () => {
  const fetchImpl = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv({ TUTOR_OPENAI_TIMEOUT_MS: '30' }) });
  const result = await client.chat(REQUEST);
  assert.equal(result.error, 'timeout');
});

test('openai: a thrown fetch error that contains the key is reduced to a fixed code', async () => {
  const fetchImpl = async () => {
    throw new Error(`socket hang up while using ${OPENAI_KEY}`);
  };
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() });
  const { value: result, lines } = await captureConsole(() => client.chat(REQUEST));
  assert.equal(result.error, 'transport_error');
  assert.equal(result.status, null);
  assert.equal(result.retryable, true);
  assert.ok(!JSON.stringify(result).includes(OPENAI_KEY));
  assert.ok(!lines.some((line) => line.includes(OPENAI_KEY)));
});

test('openai: an empty reply is a non-retryable failure', async () => {
  const { fetchImpl } = recordingFetch(() => jsonResponse(200, { choices: [{ message: { content: '' } }] }));
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() });
  const result = await client.chat(REQUEST);
  assert.equal(result.error, 'empty_reply');
  assert.equal(result.retryable, false);
});

test('openai: key and request body never appear in console output across success and failure', async () => {
  const { fetchImpl } = recordingFetch((_url, init) => (init.body.includes('What is pH') ? jsonResponse(503, {}) : jsonResponse(200, OPENAI_OK)));
  const client = new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() });
  const { lines } = await captureConsole(async () => {
    await client.chat(REQUEST);
    await client.chat({ ...REQUEST, messages: [{ role: 'user', content: 'other' }] });
  });
  for (const line of lines) {
    assert.ok(!line.includes(OPENAI_KEY));
    assert.ok(!line.includes('What is pH'));
  }
});

test('openai: health reports missing key and missing model without calling the network', async () => {
  const { fetchImpl, calls } = recordingFetch(() => jsonResponse(200, OPENAI_OK));
  assert.equal((await new OpenAiChatClient({ fetch: fetchImpl, env: {} }).health()).reason, PROVIDER_NOT_CONFIGURED);
  assert.equal((await new OpenAiChatClient({ fetch: fetchImpl, env: { OPENAI_API_KEY: OPENAI_KEY } }).health()).reason, 'model_not_configured');
  assert.equal((await new OpenAiChatClient({ fetch: fetchImpl, env: openAiEnv() }).health()).ok, true);
  assert.equal(calls.length, 0);
});

// ---------- Anthropic ----------

test('anthropic: missing key returns the disabled-provider refusal and never calls fetch', async () => {
  const { fetchImpl, calls } = recordingFetch(() => jsonResponse(200, ANTHROPIC_OK));
  const client = new AnthropicChatClient({ fetch: fetchImpl, env: { TUTOR_ANTHROPIC_MODEL: 'm' } });
  const result = await client.chat(REQUEST);
  assert.equal(result.ok, false);
  assert.equal(result.error, PROVIDER_NOT_CONFIGURED);
  assert.equal(result.retryable, false);
  assert.equal(calls.length, 0);
});

test('anthropic: missing model refuses with model_not_configured and never calls fetch', async () => {
  const { fetchImpl, calls } = recordingFetch(() => jsonResponse(200, ANTHROPIC_OK));
  const client = new AnthropicChatClient({ fetch: fetchImpl, env: { ANTHROPIC_API_KEY: ANTHROPIC_KEY } });
  const result = await client.chat(REQUEST);
  assert.equal(result.error, 'model_not_configured');
  assert.equal(calls.length, 0);
});

test('anthropic: success maps the reply text and usage, and moves system text to the system field', async () => {
  const { fetchImpl, calls } = recordingFetch(() => jsonResponse(200, ANTHROPIC_OK));
  const client = new AnthropicChatClient({ fetch: fetchImpl, env: anthropicEnv() });
  const result = await client.chat(REQUEST);

  assert.equal(result.ok, true);
  assert.equal(result.provider, 'anthropic');
  assert.equal(result.model, 'test-claude-model');
  assert.equal(result.content, 'pH is a measure of acidity.');
  assert.deepEqual(result.usage, { prompt_tokens: 12, completion_tokens: 7, total_tokens: 19 });

  assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages');
  assert.equal(calls[0].init.headers['x-api-key'], ANTHROPIC_KEY);
  assert.equal(calls[0].init.headers['anthropic-version'], '2023-06-01');
  const sent = JSON.parse(calls[0].init.body);
  assert.equal(sent.system, 'Be a tutor.');
  assert.deepEqual(sent.messages, [{ role: 'user', content: 'What is pH?' }]);
  assert.equal(sent.max_tokens, 1024);
});

test('anthropic: a 429 maps to a retryable failure with status 429', async () => {
  const { fetchImpl } = recordingFetch(() => jsonResponse(429, { error: { message: ANTHROPIC_KEY } }));
  const client = new AnthropicChatClient({ fetch: fetchImpl, env: anthropicEnv() });
  const result = await client.chat(REQUEST);
  assert.equal(result.status, 429);
  assert.equal(result.retryable, true);
  assert.ok(!JSON.stringify(result).includes(ANTHROPIC_KEY));
});

test('anthropic: 500, 502, 503 and 504 map to retryable failures', async () => {
  for (const status of [500, 502, 503, 504]) {
    const { fetchImpl } = recordingFetch(() => jsonResponse(status, {}));
    const client = new AnthropicChatClient({ fetch: fetchImpl, env: anthropicEnv() });
    const result = await client.chat(REQUEST);
    assert.equal(result.status, status);
    assert.equal(result.retryable, true, String(status));
  }
});

test('anthropic: a timeout maps to a retryable transport failure', async () => {
  const fetchImpl = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    });
  const client = new AnthropicChatClient({ fetch: fetchImpl, env: anthropicEnv(), timeoutMs: 25 });
  const result = await client.chat(REQUEST);
  assert.equal(result.error, 'timeout');
  assert.equal(result.status, null);
  assert.equal(result.retryable, true);
});

test('anthropic: a thrown error containing the key never leaks into the result or logs', async () => {
  const fetchImpl = async () => {
    throw new Error(`reset while sending ${ANTHROPIC_KEY}`);
  };
  const client = new AnthropicChatClient({ fetch: fetchImpl, env: anthropicEnv() });
  const { value: result, lines } = await captureConsole(() => client.chat(REQUEST));
  assert.equal(result.error, 'transport_error');
  assert.ok(!JSON.stringify(result).includes(ANTHROPIC_KEY));
  assert.ok(!lines.some((line) => line.includes(ANTHROPIC_KEY)));
});

test('anthropic: text blocks are joined and non-text blocks are ignored', async () => {
  const body = { content: [{ type: 'thinking', text: 'hidden' }, { type: 'text', text: 'Part one. ' }, { type: 'text', text: 'Part two.' }] };
  const { fetchImpl } = recordingFetch(() => jsonResponse(200, body));
  const client = new AnthropicChatClient({ fetch: fetchImpl, env: anthropicEnv() });
  const result = await client.chat(REQUEST);
  assert.equal(result.content, 'Part one. Part two.');
});

// ---------- failover with both clients ----------

test('chain: OpenAI 429 fails over to Anthropic, which replies', async () => {
  const openai = new OpenAiChatClient({ fetch: recordingFetch(() => jsonResponse(429, {})).fetchImpl, env: openAiEnv() });
  const anthropic = new AnthropicChatClient({ fetch: recordingFetch(() => jsonResponse(200, ANTHROPIC_OK)).fetchImpl, env: anthropicEnv() });
  const events = [];
  const chain = new ProviderFailoverChain({ chatProviders: [openai, anthropic], onFailure: (e) => events.push(e) });
  const result = await chain.chat(REQUEST);
  assert.equal(result.ok, true);
  assert.equal(result.provider, 'anthropic');
  assert.equal(events.length, 1);
  assert.equal(events[0].failover, true);
  assert.equal(events[0].status, 429);
});

test('chain: OpenAI timeout fails over to Anthropic', async () => {
  const hang = (_url, init) =>
    new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))));
  const openai = new OpenAiChatClient({ fetch: hang, env: openAiEnv(), timeoutMs: 20 });
  const anthropic = new AnthropicChatClient({ fetch: recordingFetch(() => jsonResponse(200, ANTHROPIC_OK)).fetchImpl, env: anthropicEnv() });
  const chain = new ProviderFailoverChain({ chatProviders: [openai, anthropic] });
  const result = await chain.chat(REQUEST);
  assert.equal(result.provider, 'anthropic');
});

test('chain: a 401 from OpenAI does not fail over', async () => {
  const openai = new OpenAiChatClient({ fetch: recordingFetch(() => jsonResponse(401, {})).fetchImpl, env: openAiEnv() });
  const anthropicRec = recordingFetch(() => jsonResponse(200, ANTHROPIC_OK));
  const anthropic = new AnthropicChatClient({ fetch: anthropicRec.fetchImpl, env: anthropicEnv() });
  const chain = new ProviderFailoverChain({ chatProviders: [openai, anthropic] });
  const result = await chain.chat(REQUEST);
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  assert.equal(anthropicRec.calls.length, 0);
});
