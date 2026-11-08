/**
 * Anthropic (Claude) chat client for the tutor. Fallback provider.
 *
 * - Key: ANTHROPIC_API_KEY, read from the environment at call time. Never stored on the instance, never logged.
 * - Model: TUTOR_ANTHROPIC_MODEL. No default. Unset means every call is refused with model_not_configured.
 * - Timeout: TUTOR_ANTHROPIC_TIMEOUT_MS, default 20000. A constructor option of the same meaning takes precedence.
 * - max_tokens: the Messages API requires it. Taken from options.max_tokens, else DEFAULT_MAX_TOKENS.
 * - System messages are joined into the top-level `system` field, as the Messages API expects.
 * - Returns reply text, usage counts and a status code only. No raw provider payload leaves this file.
 */
import type { ChatCallInput, ChatMessage, ChatProviderContract, ProviderChatResult, ProviderHealth, ProviderUsage } from '../contracts.js';
import { PROVIDER_NOT_CONFIGURED } from '../contracts.js';
import { DEFAULT_TIMEOUT_MS, ProviderConfigError, disabledResult, failure, parseTimeoutMs, postJson, readKey, resolveModel, type EnvLike, type FetchLike } from './shared.js';

const PROVIDER = 'anthropic';
const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const KEY_VAR = 'ANTHROPIC_API_KEY';
const MODEL_VAR = 'TUTOR_ANTHROPIC_MODEL';
const TIMEOUT_VAR = 'TUTOR_ANTHROPIC_TIMEOUT_MS';
const DEFAULT_MAX_TOKENS = 1024;

export interface AnthropicChatClientOptions {
  /** Injected fetch. Defaults to the global fetch. Tests pass a fake here. */
  fetch?: FetchLike;
  /** Environment source. Defaults to process.env. Read at call time. */
  env?: EnvLike;
  /** Explicit timeout in ms. Overrides TUTOR_ANTHROPIC_TIMEOUT_MS. */
  timeoutMs?: number;
}

interface AnthropicWireMessage {
  role: 'user' | 'assistant';
  content: string;
}

function splitMessages(messages: ChatMessage[]): { system: string | null; turns: AnthropicWireMessage[] } | null {
  const systemParts: string[] = [];
  const turns: AnthropicWireMessage[] = [];
  for (const message of messages) {
    if (message.role === 'system') {
      systemParts.push(message.content);
    } else if (message.role === 'user' || message.role === 'assistant') {
      turns.push({ role: message.role, content: message.content });
    } else {
      return null;
    }
  }
  return { system: systemParts.length > 0 ? systemParts.join('\n\n') : null, turns };
}

function maxTokens(options: Record<string, unknown> | undefined): number {
  const value = options?.max_tokens;
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_MAX_TOKENS;
}

function toUsage(raw: unknown): ProviderUsage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const usage = raw as Record<string, unknown>;
  const input = typeof usage.input_tokens === 'number' ? usage.input_tokens : undefined;
  const output = typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined;
  if (input === undefined && output === undefined) return null;
  return {
    prompt_tokens: input,
    completion_tokens: output,
    total_tokens: input !== undefined && output !== undefined ? input + output : undefined,
  };
}

export class AnthropicChatClient implements ChatProviderContract {
  private readonly fetchImpl: FetchLike;
  private readonly env: EnvLike;
  private readonly timeoutOverride: number | undefined;

  constructor(options: AnthropicChatClientOptions = {}) {
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

    const split = splitMessages(input.messages ?? []);
    if (split === null) return failure(PROVIDER, 'unsupported_role', null, false, null);
    if (split.turns.length === 0) return failure(PROVIDER, 'input_invalid', null, false, null);

    const timeoutMs = this.timeoutOverride ?? parseTimeoutMs(this.env[TIMEOUT_VAR], DEFAULT_TIMEOUT_MS);

    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens(input.options),
      messages: split.turns,
    };
    if (split.system !== null) body.system = split.system;
    if (typeof input.options?.temperature === 'number') body.temperature = input.options.temperature;

    const result = await postJson({
      provider: PROVIDER,
      url: ENDPOINT,
      headers: { 'x-api-key': key, 'anthropic-version': API_VERSION },
      body,
      fetchImpl: this.fetchImpl,
      timeoutMs,
    });
    if (!result.ok) return result;

    const payload = result.json as { content?: Array<{ type?: unknown; text?: unknown }>; usage?: unknown } | null;
    const text = (payload?.content ?? [])
      .filter((block) => block?.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('');
    if (text.trim() === '') {
      return failure(PROVIDER, 'empty_reply', null, false, result.latency_ms);
    }

    return {
      ok: true,
      provider: PROVIDER,
      model,
      content: text,
      usage: toUsage(payload?.usage),
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
