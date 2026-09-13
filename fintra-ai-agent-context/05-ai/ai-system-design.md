# AI Subsystem Design

> End-to-end design of the Fintra AI Gateway subsystem: components, streaming contract, context budgeting, cost accounting, failure handling, and latency engineering.

## Position in the stack

The AI subsystem lives server-side at `src/server/ai/` (per D2: `gateway/`, `providers/`, `registry/`, `prompts/` assembly) and is reachable only through the Fintra backend. The traffic path is fixed by D8: **Browser -> Fintra backend -> Gateway -> Provider**. Provider API keys never leave the server; the browser only ever talks to `/api/v1/*` route handlers.

The gateway orchestrates a chat completion end to end: it resolves the model from the registry, assembles context, calls a provider adapter, normalizes the stream into SSE events, applies financial guardrails, and records observability data. It uses **Vercel AI SDK v5 `streamText`** for protocol/stream normalization behind our own `ProviderAdapter` port (D1 trade-off: a thin port keeps us un-locked; the AI SDK removes SSE and tool-call boilerplate). Component topology is illustrated in `../09-diagrams/model-routing-flow.svg`.

## Component map

| Component | Location | Responsibility | Key inputs / outputs |
|---|---|---|---|
| Model Registry | `src/server/ai/registry/` + `src/config/models.config.ts` + seeded `ModelCatalog` table | Single source of truth for models: contextWindow, capabilities, pricing, availability. UI renders from registry only, never hard-coded names (D4) | Config -> registry cache; consumers: gateway, Model Selector, Auto heuristic |
| Fintra AI Gateway | `src/server/ai/gateway/` | Orchestrates a request: resolve model, enforce policy (rate limit, budgets), select adapter, drive streaming, handle failures and fallback | Route handler -> SSE event stream |
| Provider Adapters | `src/server/ai/providers/` | Translate `ChatRequest` to a provider protocol and normalize native streams/errors into `GatewayChunk` and `GatewayError` | Gateway -> provider HTTP; see provider-abstraction.md |
| Prompt Assembler | `src/server/ai/prompts/` + versioned `prompts/` library | Build the system prompt from versioned blocks: persona, financial safety, answer mode, model-specific adjustments | Prompt version id -> gateway |
| Context Manager | `src/server/ai/gateway/context` | Enforce the context budget, window thread history, trigger rolling summarization | Message history -> budgeted prompt |
| Stream Normalizer | inside gateway, on top of AI SDK `streamText` | Convert adapter chunks into the canonical SSE event taxonomy; guarantee terminal `done` event | Adapter `GatewayChunk` -> SSE |
| Post-Processor | `src/server/ai/gateway/postprocess` | Guardrail pass: figure-fidelity check hooks, evidence chip extraction (Phase 7+), disclaimer attachment per financial-ai-principles.md | Model output -> persisted Message parts |
| Observability Hooks | `src/server/services/usageService`, `auditService` | Write `AIRequest` per request, aggregate `UsageRecord` per user/day, structured JSON logs, `AuditLog` for AI events (D3) | Gateway lifecycle -> DB rows |

## Streaming contract

Transport: `POST /api/v1/chat/stream` returns `text/event-stream`. Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no` (proxy-safe). Each SSE frame is `event: <type>` plus a `data:` JSON payload.

### SSE event taxonomy

| Event | Payload (JSON) | When it is emitted |
|---|---|---|
| `step` | `{ stepId, label, status: "active" \| "done", detail? }` | Run-step start/update: context assembly, retrieval (Phase 7+), analysis, validation, assembly. Drives the visible Run Steps panel |
| `text-delta` | `{ delta }` | Each incremental text chunk from the model |
| `usage` | `{ promptTokens, completionTokens, costEstimateUsd, model }` | Once, after the provider reports usage (or gateway estimate if the provider omits it) |
| `message-complete` | `{ messageId }` | After the assembled message is persisted; confirms integrity of parts |
| `error` | `{ code, message, retryable }` | Any failure; codes come from the gateway error catalog (see failure taxonomy) |
| `done` | `{}` | Terminal marker; stream closes immediately after |

Contract rules: every stream ends with `message-complete` -> `usage` -> `done` on success, or `error` -> `done` on failure. A connection that drops before `done` is treated by the client as an error (network class). `step` events are never fabricated to look like multi-agent work; in the MVP they reflect real gateway stages (see agent-architecture.md for the honesty rule).

### Client consumption notes

- Consume via `fetch` + `ReadableStream` parsing; TanStack Query holds streaming status (D1 state approach).
- **Abort**: the Composer Stop button calls `AbortController.abort()`; the route handler propagates cancellation to the provider stream and persists partial output marked `incomplete`.
- **Reconnect policy**: POST streams are not resumed. No auto-retry: a retry would start a new billed AI request and duplicate partial answers. If the stream dies before `done`, the UI marks the message "Connection lost" and offers an explicit **Retry** action, matching the state machine empty -> streaming -> complete -> error(retry) -> stopped (D7). Retry creates a new request; the partial message remains visible and labeled.

## Context window management

`contextWindow` comes from the registry per model (never a hard-coded constant). The Context Manager allocates the window before assembly:

| Segment | Share of `contextWindow` | Example at 128k | Content |
|---|---|---|---|
| System prompt | ~8% | 10.2k | Persona + financial safety + answer mode |
| Financial Context | ~12% | 15.4k | Workspace profile (Phase 7); mocked placeholder until then |
| Thread history | 60% | 76.8k | Recent turns verbatim, older turns rolling summary |
| Response headroom | 20% | 25.6k | `maxOutput` is capped at this share |

When history would exceed its budget, the Context Manager truncates + summarizes (trigger thresholds and the no-number-loss rule in context-management.md). On `CONTEXT_OVERFLOW` from the provider despite budgeting, the gateway applies the overflow handling in the failure taxonomy below and retries once.

## Token and cost accounting

- **Per request**: one `AIRequest` row (D3): userId, conversationId, provider, model, promptVersion, promptTokens, completionTokens, latencyMs, costUsd (estimate), status, errorCode. Written when the stream finishes (success or error); message bodies are never stored in observability rows.
- **Per day aggregation**: `UsageRecord` upserts per user per day (requestCount, tokens in/out, cost) on the same request path — no background jobs in MVP (D1). Aggregation correctness is covered by an integration test (see ../07-testing/api-test-plan.md).
- **Pricing**: computed from registry fields `inputPricePer1M` / `outputPricePer1M` of the serving model: `cost = promptTokens/1e6 * input + completionTokens/1e6 * output`.
- **Estimate disclaimer**: provider invoices may round or differ; every cost figure shown in the UI is labeled "estimated". Fallback-served responses record the fallback model's pricing and note the original request.

## Structured outputs policy

- **Markdown tables are the preferred structure for financial data** (comparisons, line items, variance tables). They render directly in chat, remain human-readable, match the "Answers not spreadsheets" positioning, and are reliably followed by all four tiers.
- **JSON mode is reserved** for future tool/eval flows (Phase 8+). It is not exposed in the MVP UI. Where JSON is needed internally (e.g., summarizer validation), it is parsed defensively and never surfaced raw.
- Figures inside tables must be reproduced verbatim from context; the post-processor never reformats numbers (digit fidelity is a guardrail, not styling).

## Model failure taxonomy

| Failure (code) | Detection | Gateway handling | User-facing result |
|---|---|---|---|
| `PROVIDER_TIMEOUT` | No first byte / stalled stream within adapter timeout budget | Retry same provider once with backoff (x1), then treat as unavailable | Progress steps + answer; if retried, `step` event notes retry |
| Provider 5xx (`PROVIDER_UNAVAILABLE`) | HTTP 5xx from provider | Fallback chain: same tier -> adjacent tier, cross-provider preferred (D4); fallback logged and surfaced | Answer served by fallback model; UI notes "answered by <model>" |
| `CONTEXT_OVERFLOW` | Provider rejects request as too long | Truncate + summarize history, rebuild prompt, retry once; then fail | Answer, or explicit failure with retry suggestion |
| `CONTENT_FILTERED` | Provider safety block | No retry; logged | Clear message that the request was blocked, with guidance to rephrase |
| `INVALID_API_KEY` | 401/403 from provider | No user retry; alert/page on-call; generic banner | "Service temporarily misconfigured" copy; no key details leaked |
| `PROVIDER_RATE_LIMIT` | 429 from provider | Queue/backoff per rate limiter; no immediate provider retry | "High demand — try again shortly" with retry action |
| `MODEL_NOT_FOUND` | Provider rejects model id | Registry drift signal: refresh registry, fall back to tier default; log error | Answer via fallback or explicit failure; engineering ticket |
| `UNKNOWN` | Anything else | Log full context (no message bodies); map to retryable=false by default | Generic error envelope with retry action |

The codes and envelope shape (`{ code, message, retryable }`) are the single error vocabulary for UI copy, tests, and the backend error catalog (../03-system-architecture/backend-architecture.md).

## Latency engineering

Budgets (D10): server first byte < 1s, first streamed token < 2s p50, echoing the homepage "median answer time 3.2s" claim. Tactics, in request order:

1. **Preflight on the hot path only**: Zod body parse, auth check, in-memory rate limit, registry cache hit — no external calls before the provider request.
2. **Registry cache**: models are read from an in-memory cache mirrored from `models.config.ts` / seeded `ModelCatalog`; no DB round trip per request.
3. **Warm adapter**: provider clients are singletons with HTTP keep-alive; no client construction per request.
4. **Early step-event emission**: a `step` event ("Assembling context") is emitted immediately so the UI shows progress before the first token arrives.
5. **Prompt-cache friendliness**: stable system prefix (see context-management.md) so provider-side prompt caching reduces time-to-first-token where available.
6. **Deferred writes**: `AIRequest`/`UsageRecord` writes happen at stream end, off the first-byte path.
7. **Auto-mode routing**: lookup-shaped questions route to Fast-tier models, cutting first-token time for the most common simple asks.

## Related docs

- [Provider Abstraction](provider-abstraction.md) — the `ProviderAdapter` port, error mapping, OpenRouter adapter spec
- [Model Selection](model-selection.md) — registry schema, catalog, Auto-mode heuristic
- [Context Management](context-management.md) — assembly pipeline, budget allocation, summarization
- [Agent Architecture](agent-architecture.md) — run steps honesty, future agent runtime
- [Financial AI Principles](financial-ai-principles.md) — guardrails applied by the post-processor
- [Testing: API Test Plan](../07-testing/api-test-plan.md) — SSE contract and integration tests
- Diagrams: `../09-diagrams/model-routing-flow.svg`, `../09-diagrams/ai-request-flow.svg`
