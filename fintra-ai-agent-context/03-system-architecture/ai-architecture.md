# AI Architecture

> Purpose: Specify the Fintra AI Gateway pipeline stage by stage — component responsibilities and failure modes, gateway/registry/adapter/normalizer specs, AI SDK v5 insulation, layered system prompts, structured outputs, and reserved tool-calling and evaluation hooks.

The end-to-end flow is diagrammed in [09-diagrams/ai-request-flow.svg](../09-diagrams/ai-request-flow.svg).

## Pipeline overview

The chat turn is a fixed pipeline (product specification §13). Each stage has one component owner and a declared failure mode; no stage may skip its predecessor's guarantees.

| # | Stage | Component | Responsibility | Failure mode |
|---|---|---|---|---|
| 1 | User input | Composer (client) | Capture prompt + model choice + answer mode | Client-side length guard before submit |
| 2 | Auth | Middleware + handler session check | Verify JWT session | `AUTH_REQUIRED` |
| 3 | Request validation | Zod schema in route handler | Shape/length/enum checks | `VALIDATION_FAILED` |
| 4 | Conversation context | `chatService` + domain windowing | Load thread, enforce ownership, window history per [05-ai/context-management.md](../05-ai/context-management.md) | `NOT_FOUND`, `CONTEXT_OVERFLOW` |
| 5 | Financial Context | Context injector (Phase 7) | Inject workspace profile (entity, period, currency, integrations) as labeled context | Skipped gracefully in MVP (no profile yet) |
| 6 | Model selection | Registry + routing rules ([model-routing.md](model-routing.md)) | Resolve sticky user choice or Auto-tier heuristic; capability filter | `MODEL_UNAVAILABLE` after fallbacks |
| 7 | Prompt assembly | `src/server/ai/prompts` + `prompts/` library | Layer base persona → financial safety → capability module → model-specific → thread context | Missing file = build-time error (versioned library) |
| 8 | AI Gateway | `src/server/ai/gateway` | Policy: token budget, cost preflight, fallback chain, circuit breaker | `RATE_LIMITED`, `USAGE_CAP_REACHED` |
| 9 | Provider adapter | `providers/openrouter` (OpenAI-compatible) | Translate `ChatCompletionPort` call into provider protocol via AI SDK `streamText` | `UPSTREAM_TIMEOUT`, adapter errors normalized |
| 10 | Streaming response | Stream normalizer + route handler | Normalize provider SSE to unified chunks; re-emit SSE to client | Partial stream → `error` chunk, request marked `FAILED`/`ABORTED` |
| 11 | Post-processing | `chatService` + guardrail hooks | Usage extraction/pricing, financial guardrail hooks (Phase 7), transactional persistence (AIRequest + assistant Message), usage aggregate, audit | Persistence failure → logged with requestId; client sees `done` with warning flag |
| 12 | UI | Thread canvas | Incremental rendering, steps, usage footer, evidence slots | Client abort → server persists `ABORTED` |

Stages 2–11 execute inside one `requestId` scope; every stage failure is logged and mapped to the uniform error envelope ([backend-architecture.md](backend-architecture.md)).

## Gateway module (`src/server/ai/gateway`)

The gateway is the single authority for talking to any model. It owns policy (what is allowed to be spent and sent), routing (which model), and observability (what happened), while adapters own protocol.

```ts
interface ChatCompletionPort {
  stream(req: ChatRequest, ctx: GatewayContext): AsyncIterable<StreamChunk>;
}
interface GatewayContext {
  userId: string;
  requestId: string;
  conversationId: string;
  answerMode: "QUICK_ANSWER" | "DEEP_ANALYSIS";
  budget: RequestBudget;
}
```

Rules: the gateway never touches the database (persistence belongs to services); it receives resolved settings and returns normalized chunks plus usage; all policy denials throw typed errors mapped to the error catalog.

## Registry (`src/config/models.config.ts` + seeded `ModelCatalog`)

The catalog is **data, not code** (D4). Fields: `id`, `provider`, `family`, `displayName`, `contextWindow`, `maxOutput`, `capabilities {reasoning, vision, tools}`, `latencyClass` (fast/balanced/reasoning), `pricingTier` (1–4), per-1M-token pricing, `availability` (available/degraded/retired), `releaseDate`, `notes`. The UI renders from the registry only — model names never appear hard-coded. Config is the source of truth; the seeded table mirrors it for querying/joins (see [../04-data-model/entities.md](../04-data-model/entities.md) `ModelCatalog`). Example IDs in docs are illustrative only.

## Adapters

Each provider implements `ProviderAdapter` (full contract: [05-ai/provider-abstraction.md](../05-ai/provider-abstraction.md)). MVP ships exactly one adapter: **OpenRouter**, using the OpenAI-compatible provider of Vercel AI SDK v5 pointed at the OpenRouter base URL. Direct OpenAI/Anthropic/Google adapters are interface-defined and built on demand (D4) — a config change plus one adapter file, no UI or service changes.

## Stream normalizer

Provider-specific SSE is normalized once, at the adapter boundary, into unified chunk types consumed by the route handler and the UI:

```ts
type StreamChunk =
  | { type: "step"; label: string; detail?: Record<string, unknown> }
  | { type: "text-delta"; delta: string }
  | { type: "usage"; promptTokens: number; completionTokens: number; costUsd: number }
  | { type: "error"; code: string; message: string; retryable: boolean }
  | { type: "done"; messageId: string; modelId: string; fallbackFrom?: string };
```

Rules: `text-delta`s only append; `step` chunks map to visible run steps; `usage` may arrive once, before `done`; `error` is terminal except when `retryable: true` (client may re-request); `done` always closes the stream, even after errors, so the client state machine resolves.

## Fallback engine

Executes the fallback chain from [model-routing.md](model-routing.md): same-tier alternate (cross-provider preferred) → adjacent tier, before surfacing `MODEL_UNAVAILABLE`. Reasoning tier never silently degrades. Every fallback sets `fallbackFrom` on the `AIRequest` row and surfaces a one-line UI note ("Answered with X — selected model Y was unavailable"), keeping answers auditable.

## Token and cost accounting

Usage arrives in the provider stream; the normalizer converts it via registry pricing into `costUsd`. Where a provider omits usage (rare OpenRouter edge cases), the gateway estimates from token counts and flags `estimated: true` on the `AIRequest` row — estimates are visible in observability queries, never silently blended. Costs feed `usageService` aggregates and the daily cap ([backend-architecture.md](backend-architecture.md)).

## AI SDK v5: rationale and insulation

| Aspect | Decision |
|---|---|
| Why AI SDK v5 | `streamText` removes SSE parsing, tool-call protocol, and provider quirk boilerplate; maintained provider definitions (OpenAI-compatible covers OpenRouter) |
| Risk accepted | SDK API churn; occasional features lag provider releases |
| Insulation | Our `ChatCompletionPort` is the only API the rest of the codebase sees; AI SDK types never escape `src/server/ai/providers` |
| Swap-out strategy | If the SDK blocks a need (protocol quirk, pricing feature, nonstandard stream event), we replace its internals inside the adapter — or write a raw `fetch` SSE adapter — without touching services, route handlers, or UI. D1 documents this exact trade-off |

## System prompt architecture

Prompts are versioned files in the `prompts/` library (`system/`, `financial/`, `analysis/`, `reporting/`, `forecasting/`, `error-detection/`, `agent/`, `model-specific/`), assembled in layers:

| Layer | Content | Source |
|---|---|---|
| 1 — Base persona | Fintra assistant identity, tone, audience (CFO, FD, FC, Management Accountant, FP&A Lead, Financial Analyst, Business Owner) | `system/base.md` |
| 2 — Financial safety | Uncertainty language policy, explicit assumptions, step-by-step calculations, no hallucinated figures, "not financial advice" disclaimer (D9) | `financial/safety.md` |
| 3 — Capability modules | Answer-mode instructions (Quick answer vs Deep analysis), task-specific modules (variance, forecasting, reporting) | `analysis/`, `forecasting/`, `reporting/` |
| 4 — Model-specific adjustments | Verbosity/format adaptations per family (e.g., reasoning models get condensed instruction variants) | `model-specific/` |
| 5 — User thread context | Windowed thread history, user-provided data labeled as such, Financial Context (Phase 7) | Assembled at request time |

Versioning discipline (D11): every prompt file carries a version header; the assembled set is stamped as `promptVersion` on each `AIRequest` row, so any answer is traceable to the exact prompt text. Prompt changes ship through review like code; no runtime prompt editing in MVP.

## Structured outputs policy

| Need | Policy |
|---|---|
| Financial tables (comparisons, variances, schedules) | Markdown tables rendered from a constrained instruction set — tables are the default presentation for tabular financial data |
| Machine-readable data (Phase 7+: saved analyses, downstream agents) | Zod schema → JSON Schema via AI SDK structured outputs; schema failures retried once, then degraded to prose with a UI flag |
| Numbers integrity | Computed figures must show their calculation steps (D9); the model is instructed to state missing data rather than invent values |
| Data-class separation | User-provided data, computed facts, and AI interpretation remain distinguishable in message parts (evidence/tool parts carry source refs), per D9 |

## Tool-calling readiness (Phase 8+ / roadmap phase 11)

`Message.parts` already reserves a `tool` part shape, and the gateway interface accepts tool definitions — **but no tools are wired in the MVP.** When introduced: a strict allow-list per capability, an approval gate for any state-changing action (human approval before execution, per the auditable-agents positioning), and per-tool budget accounting. The `ToolCall` deferred entity ([../04-data-model/entities.md](../04-data-model/entities.md)) captures the future record shape.

## Evaluation hooks

No runtime evaluation infra in MVP; hooks are reserved for the strategy in [05-ai/evaluation-strategy.md](../05-ai/evaluation-strategy.md): a golden-set of financial Q&A scored offline pre-release, guardrail evals (disclaimer presence, uncertainty language, calculation display), and a prompt-injection suite. Because `AIRequest` persists model + `promptVersion` + status, any recorded thread can be replayed against a candidate prompt/model change as an eval input.

## Related docs

- [model-routing.md](model-routing.md) — tier definitions, fallback chains, cost controls
- [backend-architecture.md](backend-architecture.md) — orchestration, transactional boundaries, usage metering
- [system-architecture.md](system-architecture.md) — T2 lifecycle end to end
- [security-architecture.md](security-architecture.md) — prompt-injection defenses
- [../05-ai/context-management.md](../05-ai/context-management.md) / [../05-ai/provider-abstraction.md](../05-ai/provider-abstraction.md) / [../05-ai/evaluation-strategy.md](../05-ai/evaluation-strategy.md) — deep-dive specs
- [../04-data-model/entities.md](../04-data-model/entities.md) — AIRequest, Message parts, ModelCatalog
- [../09-diagrams/ai-request-flow.svg](../09-diagrams/ai-request-flow.svg) — pipeline diagram
