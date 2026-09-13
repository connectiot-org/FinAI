# Model Routing

> Purpose: Define how every AI request resolves to a model — ordered routing rules, the Auto-mode complexity heuristic, tier definitions, fallback chains, availability/circuit breakers, cost controls, the registry schema, and worked examples.

Basis: decision ledger D4 (model strategy). The registry is data, not code: `src/config/models.config.ts` mirrored into the seeded `ModelCatalog` table; the UI renders model choices exclusively from the registry. All example model IDs below are illustrative — config is the source of truth.

## Routing decision flow

Rules apply in order; the first rule that resolves wins. Resolution happens in the gateway before any provider call.

| Order | Rule | Detail |
|---|---|---|
| 1 | User explicit model → sticky | If the conversation has a selected model (set via Model Selector), it is reused for subsequent turns; changing mid-thread affects the **next** answer only. Sticky choice still passes rules 3–4 |
| 2 | Auto mode → complexity heuristic | Input analysis (below) picks a tier: Fast / Balanced / Reasoning; then the best available model in that tier by latency class and price |
| 3 | Capability requirements filter | Vision, tools (future), or long-context needs prune the candidate set regardless of tier — a request needing >128k context can only route to models whose `contextWindow` allows it |
| 4 | Availability + budget check | Candidates must be `available` (not degraded if alternatives exist, never retired) and within the user's remaining daily cost budget; then fallback chain applies on failure |

## Auto-mode complexity heuristic

Signals are cheap and local (no extra model call in MVP):

| Signal | Source | Use |
|---|---|---|
| Answer mode | User toggle: Quick answer / Deep analysis | Deep analysis biases one tier up (floor Balanced) |
| Topic/input tokens | Prompt + attached file token estimate (Phase 7+ for files; prompt length today) | Large inputs bias toward long-context/stronger models |
| Question type | Lightweight keyword/pattern classifier in domain code: **lookup** ("what was X?") vs **analysis** ("why did X change?") vs **multi-step** (forecast, variance decomposition, multi-part questions) | Lookup → Fast; analysis → Balanced; multi-step → Reasoning |
| Thread history depth | Message count and cumulative context tokens | Deep threads (>8 turns or >8k context tokens) bias up one tier |

| Outcome | Typical combination |
|---|---|
| Fast | Lookup question, short prompt, shallow thread, Quick answer |
| Balanced | Default: analysis question or mixed signals |
| Reasoning | Multi-step questions, Deep analysis mode, or Deep analysis + deep thread |

Heuristic lives in `src/server/domain` as a pure function (`resolveTier(signals): Tier`) and is unit-tested; it is intentionally conservative — Balanced wins ties.

## Tier definitions

| Tier | Intent | Example model classes (illustrative) | Notes |
|---|---|---|---|
| Fast | Cheap, low-latency lookups and short answers | gpt-4o-mini class, gemini-flash class, claude-haiku class | Default for lookup traffic |
| Balanced | Everyday financial analysis | gpt-4.1 class, claude-sonnet class, gemini-flash/pro class | Workhorse tier |
| Reasoning | Multi-step decomposition, deep variance/forecast work | o-series class, claude-opus class, deepseek-r1 class, gemini-pro class | Higher cost/latency; no silent degradation |
| Open & value | Self-hostable/open models for cost-sensitive volume | llama class, qwen class, deepseek-v3 class | Tier 4 pricing; used when explicitly selected or configured |

`pricingTier` (1–4) is a registry field aligned with these tiers and drives cost caps and routing economics.

## Fallback chains

Chain for a failed or unavailable selection:

1. **Primary** — the resolved model.
2. **Same-tier alternate, different provider preferred** — e.g. claude-sonnet-class → gpt-4.1-class.
3. **Adjacent tier** — Balanced→Fast for latency-sensitive; Fast→Balanced or Balanced→Reasoning only when the heuristic demanded the lower tier's capability and it is unavailable (documented in `fallbackReason`).

Hard rules:

- **Never silently degrade the Reasoning tier**: if the Reasoning selection fails, the user is asked (UI prompt) before a lower tier answers.
- Every fallback is logged (`AIRequest.fallbackFrom`, `fallbackReason`) and surfaced in the UI as a one-line note on the answer.
- The chain executes inside a single request; total added latency is bounded (one retry per chain step, max two steps) before `MODEL_UNAVAILABLE` with `details.alternatives`.

## Availability and health

| Mechanism | Spec |
|---|---|
| Registry status | `availability: available \| degraded \| retired`; routing skips `retired` always and `degraded` when an `available` alternative exists; status changes are config/DB updates, no deploys |
| Circuit breaker | Per provider: after **N = 5** consecutive failures within the window, the circuit opens for **T = 5 minutes**; requests route straight to the next chain step; a half-open probe request tests recovery |
| Health inputs | Adapter probe on gateway boot + rolling failure rate from `AIRequest` rows; breakers are in-memory per instance in MVP (acceptable drift; Upstash-shared state at Phase 9) |
| User visibility | Degraded models show a status dot in the Model Selector; open circuits remove the model from Auto candidates but remain user-selectable with a warning |

## Cost controls

| Control | Spec |
|---|---|
| Per-request token budget | `maxOutput` capped per tier (Fast 2k, Balanced 4k, Reasoning 8k tokens default, config-driven); input context windowing per [05-ai/context-management.md](../05-ai/context-management.md) |
| Per-user daily cap | `USAGE_DAILY_CAP_USD` (default $10); `usageService.preflight` projects request cost and rejects with `USAGE_CAP_REACHED` when the cap would be exceeded |
| 80% warning | At 80% of the daily cap, `/api/v1/usage` returns a warning flag; the workspace shows a dismissible banner with remaining budget |
| Config-driven limits | All thresholds (caps, tier output limits, breaker N/T) live in `src/config/` — tunable without code changes |

## Registry schema

```ts
interface ModelDefinition {
  id: string;                      // e.g. "openrouter/anthropic/claude-sonnet" (illustrative)
  provider: "openrouter" | "openai" | "anthropic" | "google";
  family: string;                  // e.g. "claude", "gpt", "gemini", "llama"
  displayName: string;             // UI label
  contextWindow: number;           // tokens
  maxOutput: number;               // tokens
  capabilities: { reasoning: boolean; vision: boolean; tools: boolean };
  latencyClass: "fast" | "balanced" | "reasoning";
  pricingTier: 1 | 2 | 3 | 4;
  pricing: { inputPer1MUsd: number; outputPer1MUsd: number };
  availability: "available" | "degraded" | "retired";
  releaseDate: string;             // ISO date
  notes?: string;
}
```

## Worked examples

**1 — Quick margin question.** "What was gross margin last month vs budget?" User leaves Auto on; no files; thread depth 2. Classifier: lookup; signals low. Tier = Fast → resolves to a Fast-tier gpt-4o-mini-class model. Output cap 2k tokens. Cost ≈ $0.0015. If that model's circuit is open, chain step 2 picks claude-haiku-class (different provider); the answer carries a fallback note.

**2 — Long variance analysis.** "Explain the EBITDA decline vs budget across contractors, price, and volume, with a driver decomposition." Deep analysis mode; prompt ~1.8k tokens; thread depth 12. Classifier: multi-step; history deep. Tier = Reasoning → claude-opus-class (or gpt-4.1-class if the user's sticky choice said Balanced — sticky wins at rule 1, and Deep analysis only biases Auto). Output cap 8k. Cost ≈ $0.05. If the Reasoning model errors: no silent downgrade — the UI asks "Reasoning model unavailable — answer with a Balanced model instead?"

**3 — 200k-context document review (future, Phase 10 file ingestion).** User attaches a 180k-token board pack and asks for risks. Rule 3 (capability: long-context) prunes candidates to models with `contextWindow ≥ 200k` regardless of the heuristic's tier pick. `usageService.preflight` projects input cost (e.g. 180k tokens on a $3/M model ≈ $0.54) and confirms headroom under the daily cap; a request projected to breach the cap is rejected before any provider call. Long runtimes are expected to move to the queued path when trigger 2 (background jobs) is adopted.

## Related docs

- [ai-architecture.md](ai-architecture.md) — gateway, adapters, stream contract
- [backend-architecture.md](backend-architecture.md) — usage preflight, caps, rate limits
- [system-architecture.md](system-architecture.md) — where routing sits in the lifecycle
- [../05-ai/context-management.md](../05-ai/context-management.md) — context windowing feeding signal calculations
- [../05-ai/provider-abstraction.md](../05-ai/provider-abstraction.md) — adapter contract behind routing
- [../04-data-model/entities.md](../04-data-model/entities.md) — ModelCatalog and AIRequest fallback fields
- [../01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md) — D4 decision rationale
