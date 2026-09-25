# Phase 5 — Model layer: registry, gateway, OpenRouter adapter, streaming API

| Field | Value |
|---|---|
| Roadmap phase | P5 — Model layer (registry, gateway, OpenRouter adapter, streaming API) |
| Depends on | P3 (schema, env, services); uses P4 session helpers for protected routes |
| Estimated effort | M–L |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../05-ai/provider-abstraction.md` |

## OBJECTIVE

Implement the model layer: the `ProviderAdapter` port, the OpenRouter adapter, the model registry with config/DB availability merge, the AI Gateway with fallback and circuit breaker, `GET /api/v1/models`, and the real SSE streaming endpoint `POST /api/v1/chat/stream` with usage accounting — no message persistence yet.

## CONTEXT

The UI consumes the SSE taxonomy defined in Phase 2 (`src/lib/sse-types.ts`); this phase builds the server producer behind it. The architecture is fixed by D1: Vercel AI SDK v5 (`streamText` + an OpenAI-compatible provider instance pointed at OpenRouter) normalizes protocol details inside a thin adapter, wrapped by our own `ProviderAdapter` port so internals can be swapped without UI changes. The adapter contract is canonical in `../05-ai/provider-abstraction.md`. Model strategy is D4: the catalog is data (config + seeded table), tiers are Fast/Balanced/Reasoning/Open, the user-selected model is sticky per conversation, fallback goes same tier → adjacent tier with cross-provider preferred, and every fallback is logged and surfaced.

## INPUTS

- `../05-ai/provider-abstraction.md` — port interface, adapter contract, error-mapping table.
- `../05-ai/context-management.md` — the trimmed-context shape the gateway must accept now (windowing itself lands in Phase 6).
- `../01-context/project-context.md` — D4 model strategy, D8 secrets, D2 layout.
- Phase 2 output: `src/lib/sse-types.ts`, `src/config/models.config.ts`.
- Phase 3 output: `ModelCatalog`, `AIRequest`, `UsageRecord`, `src/server/env.ts`, logger, envelope.

## TASKS

1. Port: `src/server/ai/providers/provider-adapter.ts` — the `ProviderAdapter` interface per `../05-ai/provider-abstraction.md`: given a chat request (model id, messages, parameters, abort signal) it returns an async iterable of gateway events (steps, text deltas, usage, errors) using the shared event types.
2. Adapter: `src/server/ai/providers/openrouter-adapter.ts` — OpenRouter via Vercel AI SDK v5 (`createOpenAICompatible` provider instance + `streamText`), base URL `https://openrouter.ai/api/v1`, key from `src/server/env.ts` only; maps upstream failures through the error-mapping table (task 7) and emits the usage frame from AI SDK usage/finish data. Record fixtures under `src/server/ai/providers/__fixtures__/`.
3. Env: add `OPENROUTER_API_KEY` (required for live runs) and `AI_LIVE_TESTS` (default `false`; tests use fixtures unless explicitly enabled).
4. Registry: `src/server/ai/registry/model-registry.ts` — loads `src/config/models.config.ts` merged with the seeded `ModelCatalog` table; DB `availability` and `notes` win on conflict. Exposes `listModels()`, `getModel(id)`, `getFallbackChain(modelId)` implementing the D4 fallback rule (same tier → adjacent tier, cross-provider preferred). The public DTO exposes pricingTier and availability; raw per-token pricing stays in admin/usage contexts.
5. Gateway: `src/server/ai/gateway/ai-gateway.ts` — resolve model → adapter stream → event normalization → fallback engine `src/server/ai/gateway/fallback.ts` (on retryable failures, walk the fallback chain) → circuit breaker `src/server/ai/gateway/circuit-breaker.ts` (per-provider open/half-open/closed states with configurable thresholds).
6. Routes: `src/app/api/v1/models/route.ts` (GET, registry DTO); `src/app/api/v1/chat/stream/route.ts` (POST, authenticated, SSE) — validate the body (model id or `auto`, messages, mode), pipe gateway events as `event:` + `data:` SSE frames sharing `src/lib/sse-types.ts`, write an `AIRequest` row (provider, model, latencyMs, promptTokens, completionTokens, costUsd, status) via `src/server/services/usage-service.ts` including `UsageRecord` aggregation, and honour client abort (propagate `AbortSignal`; record status `aborted`).
7. Error mapping (implement and test): upstream 401/403 → `UPSTREAM_AUTH` (non-retryable, alert-level log); 402 → `MODEL_UNAVAILABLE` (non-retryable, surfaced as "model unavailable"); 408/504 → `UPSTREAM_TIMEOUT` (retryable); 429 → `RATE_LIMITED` (retryable after reset; also triggers fallback); 5xx → `UPSTREAM_ERROR` (retryable); malformed stream → `UPSTREAM_ERROR`. Clients only ever see Fintra codes, never raw provider errors.
8. `src/server/services/usage-service.ts`: `AIRequest` insert plus per-user `UsageRecord` aggregation update.
9. `src/server/services/ai-gateway-service.ts`: the thin application-service wrapper controllers call, preserving D2 layering.

## CONSTRAINTS

- Key material only via `src/server/env.ts`; never in client bundles, logs, or fixtures.
- No hard-coded model IDs anywhere outside `src/config/models.config.ts`.
- No message or conversation persistence yet (Phase 6) — the endpoint is stateless beyond `AIRequest`/`UsageRecord`.
- SSE frames must reuse `src/lib/sse-types.ts`; the producer and consumer share the contract.
- Export an appropriate `maxDuration` on the streaming route per `../03-system-architecture/deployment-architecture.md` (placeholder value acceptable pre-deploy).

## EXPECTED OUTPUT

`GET /api/v1/models` lists the merged registry; `POST /api/v1/chat/stream` returns a real streamed answer from at least one OpenRouter model when a key is configured — or documented fixture mode when it is not — with a usage frame, abort support, fallback on forced failure, and `AIRequest` rows visible in the database.

## FILES TO CREATE OR MODIFY

- `src/server/ai/providers/provider-adapter.ts`, `src/server/ai/providers/openrouter-adapter.ts`, `src/server/ai/providers/__fixtures__/*`
- `src/server/ai/registry/model-registry.ts`
- `src/server/ai/gateway/ai-gateway.ts`, `src/server/ai/gateway/fallback.ts`, `src/server/ai/gateway/circuit-breaker.ts`
- `src/server/services/ai-gateway-service.ts`, `src/server/services/usage-service.ts`
- `src/app/api/v1/models/route.ts`, `src/app/api/v1/chat/stream/route.ts`
- `src/server/env.ts`, `.env.example`

## TEST REQUIREMENTS

- Adapter contract tests with recorded fixtures: given fixture chunks, the adapter yields the expected event sequence, concatenated text deltas equal the fixture text, and a usage frame is present.
- SSE sequence contract test against the route (mocked adapter): `step` (optional) → `text-delta`* → `usage` → `done`, or `error` → `done` on failure; content-type `text/event-stream`.
- Fallback unit tests: primary unavailable → next chain entry attempted and the fallback recorded; chain exhausted → `MODEL_UNAVAILABLE` error frame.
- Circuit-breaker unit tests: opens after the failure threshold, half-open probe, closes on success.
- Usage accounting: an `AIRequest` row is written with tokens/cost/latency/status; `UsageRecord` increments; an aborted run is recorded as `aborted`.
- Optional live test, gated by `AI_LIVE_TESTS=true` plus a key: one real streamed completion.

## ACCEPTANCE CRITERIA

- [ ] A real streamed answer arrives from at least one OpenRouter model, with fixture mode documented if no key is present; the key reaches the adapter only via `src/server/env.ts`.
- [ ] The SSE event sequence matches the Phase 2 taxonomy and shared types exactly.
- [ ] `/api/v1/models` reflects the config + DB merge; changing DB availability changes the response.
- [ ] A forced upstream failure triggers the fallback chain and the fallback is logged and surfaced (D4).
- [ ] Every AI call writes an `AIRequest` with tokens/cost/latency/status, including aborted runs.
- [ ] No model IDs are hard-coded in the UI, and a client-bundle grep finds no key-shaped strings.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` clean.

## DO NOT DO

- Do not persist messages or threads (Phase 6).
- Do not add financial prompt logic or guardrails (Phase 7).
- Do not expose provider keys or raw upstream errors — Fintra codes only, per the mapping.
- Do not build direct OpenAI/Anthropic/Google adapters (the port allows them later; OpenRouter only now).
- Do not let the UI select models outside the registry.

## NEXT STEP

Load `phase-06-chat.md`.
