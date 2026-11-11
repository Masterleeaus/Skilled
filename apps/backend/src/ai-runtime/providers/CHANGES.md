# Tutor chat providers: changes log

## Added (build agent T1)

- `shared.ts`: fetch wrapper with AbortController timeout, HTTP status classifier, env readers, `ProviderConfigError`.
- `openai.ts`: `OpenAiChatClient` implementing `ChatProviderContract`. Primary provider.
- `anthropic.ts`: `AnthropicChatClient` implementing `ChatProviderContract`. Fallback provider.
- `tests/ai-runtime/providers.test.mjs` (outside this folder, at the path the brief named): 26 tests, fake fetch only.

## Environment variables

| Variable | Used by | Default |
| --- | --- | --- |
| `OPENAI_API_KEY` | openai | none. Missing means the disabled-provider refusal. |
| `TUTOR_OPENAI_MODEL` | openai | none. Missing means `model_not_configured`. |
| `TUTOR_OPENAI_TIMEOUT_MS` | openai | 20000 |
| `ANTHROPIC_API_KEY` | anthropic | none. Missing means the disabled-provider refusal. |
| `TUTOR_ANTHROPIC_MODEL` | anthropic | none. Missing means `model_not_configured`. |
| `TUTOR_ANTHROPIC_TIMEOUT_MS` | anthropic | 20000 |

## Decisions taken without review

- Missing model returns a non-retryable failure with error `model_not_configured`. It does not throw, because the failover chain turns a throw into a retryable failure.
- Anthropic `max_tokens` defaults to 1024 when `options.max_tokens` is absent. The Messages API requires the field.
- OpenAI `options.max_tokens` is sent as `max_completion_tokens`.
- Only `temperature` and `max_tokens` are forwarded from `options`. Other options are dropped.
- Role `tool` is refused with `unsupported_role`. Neither client has the tool-call ids a tool message needs.
- Status 529 (Anthropic overloaded) is classed retryable, but the chain's default statuses do not include it, so it does not fail over unless the chain is configured to.
- A 200 response with no reply text is `empty_reply`, non-retryable.
- `health()` makes no network call. It only checks the key and the model.

## Not done

- No `tsc` run, per the brief.
- No real API calls. Both clients are verified only against a fake fetch.
