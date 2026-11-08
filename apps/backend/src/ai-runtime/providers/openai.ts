/**
 * OpenAI chat client for the tutor. Primary provider.
 *
 * - Key: OPENAI_API_KEY, read from the environment at call time. Never stored on the instance, never logged.
 * - Model: TUTOR_OPENAI_MODEL. No default. Unset means every call is refused with model_not_configured.
 * - Timeout: TUTOR_OPENAI_TIMEOUT_MS, default 20000. A constructor option of the same meaning takes precedence.
 * - Returns reply text, usage counts and a status code only. No raw provider payload leaves this file.
 */
import type { ChatCallInput, ChatMessage, ChatProviderContract, ProviderChatResult, ProviderHealth, ProviderUsage } from '../contracts.js';
import { PROVIDER_NOT_CONFIGURED } from '../contracts.js';
import { DEFAULT_TIMEOUT_MS, ProviderConfigError, disabledResult, failure, parseTimeoutMs, postJson, readKey, resolveModel, type EnvLike, type FetchLike } from './shared.js';

const PROVIDER = 'openai';
const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const KEY_VAR = 'OPENAI_API_KEY';
const MODEL_VAR = 'TUTOR_OPENAI_MODEL';
const TIMEOUT_VAR = 'TUTOR_OPENAI_TIMEOUT_MS';

export interface OpenAiChatClientOptions {
  /** Injected fetch. Defaults to the global fetch. Tests pass a fake here. */
  fetch?: FetchLike;
  /** Environment source. Defaults to process.env. Read at call time. */
  env?: EnvLike;
  /** Explicit timeout in ms. Overrides TUTOR_OPENAI_TIMEOUT_MS. */
  timeoutMs?: number;
}

interface OpenAiWireMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function toWireMessages(messages: ChatMessage[]): OpenAiWireMessage[] | null {
  const out: OpenAiWireMessage[] = [];
  for (const message of messages) {
    if (message.role !== 'system' && message.role !== 'user' && message.role !== 'assistant') return null;
    out.push({ role: message.role, content: message.content });
  }
  return out;
}

function pickOptions(options: Record<string, unknown> | undefined): Record<string, number> {
  const picked: Record<string, number> = {};
  if (typeof options?.temperature === 'number') picked.temperature = options.temperature;
  if (typeof options?.max_tokens === 'number') picked.max_completion_tokens = options.max_tokens;
  return picked;
}

function toUsage(raw: unknown): ProviderUsage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const usage = raw as Record<string, unknown>;
  const prompt = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined;
  const completion = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined;
  const total = typeof usage.total_tokens === 'number' ? usage.total_tokens : undefined;
  if (prompt === undefined && completion === undefined && total === undefined) return null;
  return { prompt_tokens: prompt, completion_tokens: completion, total_tokens: total };
}

export class OpenAiChatClient implements ChatProviderContract {
  private readonly fetchImpl: FetchLike;
  private readonly env: EnvLike;
  private readonly timeoutOverride: number | undefined;

  constructor(options: OpenAiChatClientOptions = {}) {
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    this.env = options.env ?? process.env;
    this.timeoutOverride = options.timeoutMs;
  }

  providerName(): string {
    return PROVIDER;
  }

  async chat(input: ChatCallInput): Promise<ProviderChatResult> {
    const key = readKey(this.env, KEY_VAR);
    if (key === null) return disabledResult();

    let model: string;
    try {
      model = resolveModel(this.env, MODEL_VAR);
    } catch (err) {
      if (err instanceof ProviderConfigError) return failure(PROVIDER, err.code, null, false, null);
      throw err;
    }

    const messages = toWireMessages(input.messages ?? []);
    if (messages === null) return failure(PROVIDER, 'unsupported_role', null, false, null);
    if (messages.length === 0) return failure(PROVIDER, 'input_invalid', null, false, null);

    const timeoutMs = this.timeoutOverride ?? parseTimeoutMs(this.env[TIMEOUT_VAR], DEFAULT_TIMEOUT_MS);

    const result = await postJson({
      provider: PROVIDER,
      url: ENDPOINT,
      headers: { authorization: `Bearer ${key}` },
      body: { model, messages, ...pickOptions(input.options) },
      fetchImpl: this.fetchImpl,
      timeoutMs,
    });
    if (!result.ok) return result;

    const body = result.json as { choices?: Array<{ message?: { content?: unknown } }>; usage?: unknown } | null;
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      return failure(PROVIDER, 'empty_reply', null, false, result.latency_ms);
    }

    return {
      ok: true,
      provider: PROVIDER,
      model,
      content,
      usage: toUsage(body?.usage),
      latency_ms: result.latency_ms,
    };
  }

  async health(): Promise<ProviderHealth> {
    if (readKey(this.env, KEY_VAR) === null) return { ok: false, provider: PROVIDER, reason: PROVIDER_NOT_CONFIGURED };
    try {
      resolveModel(this.env, MODEL_VAR);
    } catch {
      return { ok: false, provider: PROVIDER, reason: 'model_not_configured' };
    }
    return { ok: true, provider: PROVIDER, reason: null };
  }
}
