# Provider Abstraction

> The `ProviderAdapter` port that isolates the Fintra AI Gateway from provider protocols, plus the OpenRouter adapter spec, error contract, and runbook for adding providers.

## Why a port

D1 pins OpenRouter as the primary provider with direct OpenAI / Anthropic / Google adapters defined but built later. To keep the gateway, UI, and tests provider-agnostic, every provider sits behind one TypeScript interface. The gateway consumes only `GatewayChunk` streams and `GatewayError`s; the AI SDK v5 `streamText` internals can be swapped behind this port without touching callers.

## The port

```ts
// src/server/ai/providers/types.ts
export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string; // assembled text; media parts arrive in Phase 10
}

export interface ToolDefinition {
  id: string;            // e.g. "ratio.gross_margin" (Phase 8+)
  description: string;
  inputSchema: Record<string, unknown>; // Zod-derived JSON Schema
}

export interface RequestMetadata {
  requestId: string;        // ties stream to AIRequest row
  conversationId: string;
  promptVersion: string;
  userId: string;           // observability only — never sent to the provider
}

export interface ChatRequest {
  modelId: string;          // registry model id (source of truth: models.config.ts)
  messages: ChatMessage[];
  systemPrompt: string;
  temperature: number;      // gateway-clamped 0..2
  maxTokens: number;        // capped by registry maxOutput and headroom budget
  tools?: ToolDefinition[]; // optional; adapters reject if capability.tools is false
  metadata?: RequestMetadata;
}

export type GatewayChunk =
  | { type: "step"; stepId: string; label: string; status: "active" | "done"; detail?: string }
  | { type: "text-delta"; delta: string }
  | { type: "usage"; promptTokens: number; completionTokens: number }
  | { type: "error"; code: GatewayErrorCode; retryable: boolean; message: string }
  | { type: "done" };

export interface AvailabilityResult {
  available: boolean;
  reason?: string; // logged only; never surfaced raw to users
}

export interface AdapterModelInfo {
  id: string;              // provider-native model string
  contextWindow?: number;  // used to validate registry data, not to override it
}

export interface ProviderAdapter {
  readonly providerId: "openrouter" | "openai" | "anthropic" | "google";
  listModels(): Promise<AdapterModelInfo[]>;
  checkAvailability(modelId: string): Promise<AvailabilityResult>;
  streamChat(request: ChatRequest): AsyncIterable<GatewayChunk>;
}
```

`metadata` is for our observability only. Adapters must never forward it, user identifiers, or conversation content anywhere except the completion call itself.

## Unified error contract

Adapters map every native failure to a `GatewayError` with a code from this table. The gateway and UI copy depend on these codes; adapters must not leak provider-specific messages to users.

| Code | Meaning | Retryable | Typical source |
|---|---|---|---|
| `PROVIDER_TIMEOUT` | No response or stalled stream within the adapter timeout budget | Yes | Network stall, provider hang |
| `PROVIDER_RATE_LIMIT` | Provider 429 | Yes (with backoff) | Quota/throughput limits |
| `PROVIDER_UNAVAILABLE` | Provider 5xx or connection failure | Yes (triggers fallback chain) | Provider incident |
| `INVALID_API_KEY` | Provider 401/403 | No | Misconfigured `env.ts` secret |
| `CONTEXT_OVERFLOW` | Request exceeds the model's context window | Yes, after truncate + summarize | Budget bug or registry drift |
| `CONTENT_FILTERED` | Provider safety filter rejected the request | No | Provider policy |
| `MODEL_NOT_FOUND` | Provider rejected the model string | No (registry fix) | Registry/provider drift |
| `UNKNOWN` | Anything unmapped | No by default | Catch-all |

Mapping rules: status codes translate mechanically (401/403 -> `INVALID_API_KEY`, 429 -> `PROVIDER_RATE_LIMIT`, 5xx -> `PROVIDER_UNAVAILABLE`); timeout budgets come from the registry `latencyClass` (fast 30s, balanced 60s, reasoning 180s); a malformed or truncated SSE stream maps to `PROVIDER_UNAVAILABLE` if mid-stream, `UNKNOWN` if pre-stream. Gateway-level handling per code is defined in ai-system-design.md (failure taxonomy).

## OpenRouter adapter spec (primary)

- **Protocol**: OpenAI-compatible chat completions with `stream: true`. Endpoint and payload names below are illustrative; the adapter reads the base URL from `env.ts`.
- **Auth**: `Authorization: Bearer <OPENROUTER_API_KEY>` — the key comes exclusively from `src/server/env.ts` (Zod-validated), never from client code (D8).
- **Model string mapping**: taken from the registry field `openrouterModelId`, e.g. `"openai/gpt-4.1"` (illustrative — config is source of truth). The adapter never derives provider strings from display names.
- **Attribution headers**: per OpenRouter convention the adapter sends app attribution headers (`X-Title: Fintra` style, plus a referer-style header) so provider dashboards attribute traffic to Fintra (illustrative; exact header names confirmed at implementation).
- **SSE parsing**: parse `data:` lines, tolerate keep-alive comments, treat the `[DONE]` sentinel as stream end; map each choice delta to `text-delta`. A stream that closes without the sentinel emits `error` (`PROVIDER_UNAVAILABLE`) then `done`.
- **Usage accounting**: request usage in the final chunk (OpenAI-compatible include-usage option, illustrative) and emit one `usage` chunk. If usage is missing, the gateway estimates tokens and flags `usageEstimated` on the `AIRequest` row.
- **BYOK (future, deferred)**: user-supplied provider keys would be scoped per user, encrypted at rest, used in place of the platform key, with usage still recorded for billing. Not in MVP; revisit in the billing/scale phase (D5 Phase 12).

## Direct adapters: what differs

| Concern | OpenAI | Anthropic | Google |
|---|---|---|---|
| Auth header | `Authorization: Bearer` | `x-api-key` + `anthropic-version` | `x-goog-api-key` |
| System prompt | First system message | Top-level `system` param, not a message | `systemInstruction` field |
| Stream events | `chat.completion.chunk` objects, delta strings | `message_start` / `content_block_delta` / `message_delta` with usage in the delta | `generateContentStream` candidates with `parts` and `usageMetadata` |
| Tool-call shape | `delta.tool_calls` fragments assembled by index | `tool_use` content blocks with JSON `input` | `functionCall` parts |
| Quirks | Include-usage flag needed for token counts | Strict system/tool ordering; separate usage event | Parts array instead of string deltas; safety settings per category |

The point of the port: these differences (auth, event schemas, tool-call shapes, usage placement) are fully contained in the adapter. The gateway, prompt assembly, UI, and tests are unchanged when a direct adapter is added or when AI SDK internals are swapped (D1 escape hatch).

## Capability negotiation

Registry capabilities drive adapter behavior; unsupported combinations are rejected before any provider call:

| Registry capability | Adapter behavior |
|---|---|
| `capabilities.tools: true` | May receive `tools`; otherwise `ChatRequest.tools` must be empty or the adapter throws `MODEL_NOT_FOUND`-class validation error before streaming |
| `capabilities.reasoning: true` | Permits elevated `maxTokens` (up to headroom budget) and reasoning-specific params; timeout budget 180s |
| `capabilities.vision: true` | Required for image parts (Phase 10); until then always false in requests |
| `latencyClass` | Sets the adapter timeout budget: fast 30s, balanced 60s, reasoning 180s |

## Adding a provider: runbook

1. **Implement the adapter** class implementing `ProviderAdapter`, including the full error-mapping table and SSE parsing, with unit tests for each error code.
2. **Register in the factory** (`src/server/ai/providers/factory.ts`) keyed by `providerId`; the gateway resolves adapters through the factory only.
3. **Add models to registry config** (`src/config/models.config.ts`) with the correct provider-native ids, pricing, context windows, and capabilities.
4. **Seed** the `ModelCatalog` table and verify `/api/v1/models` reflects the new entries with correct availability.
5. **Contract tests** against recorded fixtures (no live keys) covering success, usage, rate limit, timeout, malformed stream.
6. **Capability validation**: run the golden-eval subset (../05-ai/evaluation-strategy.md) on the new models; confirm capability flags and pricing match provider docs.
7. **Enable behind a feature flag**; monitor error/fallback rates; remove the flag after a clean window.

## Testing adapters

- **Record/replay fixtures**: store real SSE transcripts (success, usage-only, 429, timeout, mid-stream disconnect, malformed) as fixtures; contract tests replay them so adapter behavior is deterministic. See ../07-testing/api-test-plan.md for the fixture approach.
- **No live keys in CI** (D8): CI runs only against fixtures and MSW-mocked HTTP. Live smoke tests against real providers are a manual pre-release step run by an engineer with a staging key.
- **Fixture freshness**: fixtures are re-recorded quarterly or when a provider announces protocol changes; fixture drift is a review checklist item in the monthly registry ritual (model-selection.md).

## Related docs

- [AI Subsystem Design](ai-system-design.md) — gateway components, streaming contract, failure handling
- [Model Selection](model-selection.md) — registry schema including `openrouterModelId`
- [Evaluation Strategy](evaluation-strategy.md) — capability validation evals for new providers
- [Testing: API Test Plan](../07-testing/api-test-plan.md) — adapter contract tests, recorded fixtures
- [Testing: Security Test Plan](../07-testing/security-test-plan.md) — key-handling guarantees
- Diagram: `../09-diagrams/model-routing-flow.svg`
