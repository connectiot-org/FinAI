# Model Selection

> Registry deep-dive per D4: the `ModelDefinition` schema, the initial tiered catalog, the Model Selector contract, the Auto-mode heuristic, and model governance.

## The registry is data, not code

The model catalog is DATA, not code (D4): `src/config/models.config.ts` plus a seeded `ModelCatalog` table that mirrors it. The UI renders exclusively from the registry — component code never contains model names, prices, or context windows. All ids and prices below are **illustrative — config is source of truth**; refreshing a price or adding a model must never require a code change.

### Config schema

```ts
// src/config/models.config.ts — single source of truth for model metadata
export type LatencyClass = "fast" | "balanced" | "reasoning";
export type PricingTier = 1 | 2 | 3 | 4; // 1 cheapest, 4 premium
export type Availability = "available" | "deprecated" | "retired";

export interface ModelDefinition {
  id: string;               // registry id, e.g. "openai/gpt-4.1" (illustrative)
  provider: "openrouter";   // serving adapter (direct adapters later per D4)
  family: string;           // "gpt-4.1", "claude-4", "gemini", "llama" ...
  displayName: string;      // shown in the Model Selector
  contextWindow: number;    // tokens; drives context budgeting (ai-system-design.md)
  maxOutput: number;        // max completion tokens
  capabilities: { reasoning: boolean; vision: boolean; tools: boolean };
  latencyClass: LatencyClass;
  pricingTier: PricingTier;
  inputPricePer1M: number;  // USD, refreshed monthly
  outputPricePer1M: number; // USD, refreshed monthly
  availability: Availability;
  releaseDate: string;      // ISO date
  notes?: string;           // finance-fit guidance surfaced as tooltip
  openrouterModelId?: string; // provider-routed model string, e.g. "openai/gpt-4.1"
}
```

## Initial catalog

Thirteen illustrative entries across the four tiers (Fast / Balanced / Reasoning / Open). Prices are per 1M tokens, USD, illustrative.

| Registry id (illustrative) | Tier | Context | In / Out $ | latencyClass |
|---|---|---|---|---|
| `openai/gpt-4o-mini` | Fast | 128k | 0.15 / 0.60 | fast |
| `anthropic/claude-haiku` | Fast | 200k | 0.80 / 4.00 | fast |
| `google/gemini-flash-lite` | Fast | 1M | 0.10 / 0.40 | fast |
| `openai/gpt-4.1` | Balanced | 1M | 2.00 / 8.00 | balanced |
| `anthropic/claude-sonnet` | Balanced | 200k | 3.00 / 15.00 | balanced |
| `google/gemini-flash` | Balanced | 1M | 0.15 / 0.60 | balanced |
| `openai/o-series` | Reasoning | 200k | 2.00 / 8.00 | reasoning |
| `anthropic/claude-opus` | Reasoning | 200k | 15.00 / 75.00 | reasoning |
| `deepseek/deepseek-r1` | Reasoning | 128k | 0.55 / 2.20 | reasoning |
| `google/gemini-pro` | Reasoning | 1M | 1.25 / 10.00 | reasoning |
| `meta-llama/llama-3.3-70b` | Open | 128k | 0.12 / 0.30 | balanced |
| `qwen/qwen-2.5-72b` | Open | 128k | 0.35 / 0.40 | balanced |
| `deepseek/deepseek-v3` | Open | 128k | 0.27 / 1.10 | balanced |

### Finance fit and watch-outs

| Registry id (illustrative) | Strengths for finance work | Watch-outs |
|---|---|---|
| `openai/gpt-4o-mini` | Quick lookups, ratio recomputes, title/thread summarization | Weaker on multi-step variance narratives; enforce calculation scaffolding |
| `anthropic/claude-haiku` | Fast, careful tone; good for follow-ups and reformulations | Small output ceiling for long tables |
| `google/gemini-flash-lite` | Cheapest high-volume asks; huge context for long statements | Numeric formatting drift; post-processor fidelity check matters |
| `openai/gpt-4.1` | Default workhorse: long financial documents + balanced reasoning | Mid price; Auto should not escalate here for pure lookups |
| `anthropic/claude-sonnet` | Long documents + careful reasoning; strong on document-grounded answers with low drift | Premium output price for long answers |
| `google/gemini-flash` | 1M context for full-year ledgers at fast-tier pricing | Verify table fidelity on dense statements |
| `openai/o-series` | Multi-step variance decomposition, driver trees, what-if chains | Slow and chatty; cap output; never for lookups |
| `anthropic/claude-opus` | Hardest analysis: reconciliation forensics, complex scenario critique | Highest cost tier; approval-worthy spend per run |
| `deepseek/deepseek-r1` | Reasoning quality at commodity price for internal analyses | Unknown provenance concerns for customer-facing tone; latency spikes |
| `google/gemini-pro` | Big-context reasoning across full-period data | Check citation discipline (evidence chips, Phase 7+) |
| `meta-llama/llama-3.3-70b` | Open-weight value tier for bulk internal tasks | Weakest instruction-following; guardrail prompts must be strict |
| `qwen/qwen-2.5-72b` | Value tier; decent multilingual edge for global entities | Conservative on nuance; verify uncertainty-language compliance |
| `deepseek/deepseek-v3` | Best price/performance in Open tier for structured analysis | Verify availability stability; keep fallback chain healthy |

Every model's finance-fit guidance is refined continuously by the model comparison harness (evaluation-strategy.md); the table above is the seed, not the conclusion.

## Selection UX <-> registry contract

The Model Selector (`src/components/agent/ModelSelector`) renders only registry fields:

| Registry field | Rendering |
|---|---|
| `displayName` | Trigger label (current model) and option row label |
| `family` | Group headers within the popover |
| `latencyClass` | Badge: Fast / Balanced / Reasoning |
| `pricingTier` | Cost indicator (dots), title tooltip with per-1M prices |
| `capabilities` | Icons: reasoning, vision (Phase 10), tools (Phase 8+) |
| `availability` | State styling and gating, see below |
| `notes` | Tooltip: one-line finance-fit guidance |

**Availability states**: `available` (selectable), `deprecated` (selectable but badged "Deprecated"; sticky threads using it keep working), `retired` (not selectable for new use; existing threads show it disabled with "Retired" — a thread never breaks because its sticky model retired; it falls back per the chain and the UI says so). **Sorting rules**: available first, then `pricingTier` ascending (cheaper first), then `displayName` alphabetically; deprecated rows sink below available ones; retired rows render last, disabled.

**Sticky model per conversation** (D4): the selected model is sticky for the thread; switching mid-thread applies to the next message only, with a one-line notice ("Next answer will use X"). Fallback events always surface which model actually answered.

## Auto-mode heuristic

Auto picks a tier, then the cheapest available model in that tier. Signals, evaluated in order:

1. **Answer mode**: Deep analysis forces at least Balanced (D7 modes: Quick answer / Deep analysis).
2. **Question verb class** (first user verb classification):

| Verb class | Example | Suggested tier |
|---|---|---|
| lookup | "What was September revenue?" | Fast |
| compare | "Compare Q2 vs Q3 opex" | Fast or Balanced |
| calculate | "What is our current ratio?" | Balanced |
| analyze | "Why did EBITDA decrease this month?" | Balanced or Reasoning |
| forecast | "Project Q4 cash runway" | Reasoning |

3. **Attached context size**: estimated input tokens > 25k -> prefer models with `contextWindow` >= 200k within the suggested tier.
4. **Prompt length**: < 120 characters biases one tier cheaper.
5. **Thread depth**: beyond ~8 turns, keep the thread's sticky model rather than re-deciding, to protect coherence.

Tie-breaks resolve to the cheaper model; Auto never picks `retired` models (and picks `deprecated` only if the thread is already pinned to one). Every Auto decision logs `chosenModel` + a reason code (e.g. `AUTO_VERB_ANALYZE`) to the `AIRequest` metadata for later tuning by the model comparison harness.

## Governance

- **Monthly registry review ritual**: verify each model's `availability` via `checkAvailability`, refresh `inputPricePer1M` / `outputPricePer1M` from provider price pages, review error/fallback rates per model, and re-run the model comparison harness for models whose scores drifted. Output: a registry changelog entry.
- **Deprecation policy**: provider-announced deprecations move a model to `deprecated`; the Model Selector shows a "Deprecated" badge and 30-day notice. After 30 days it becomes `retired` (hidden from new selection; sticky threads fall back).
- **How to add a model (checklist)**: (1) confirm specs from provider docs (context, pricing, capabilities); (2) add a `ModelDefinition` to config with measured `latencyClass`; (3) seed and verify `/api/v1/models`; (4) run the golden-eval subset and the comparison harness on the candidate; (5) assign tier based on eval results, not marketing; (6) add finance-fit `notes`; (7) ship behind a flag, then announce in the registry changelog.

## Related docs

- [AI Subsystem Design](ai-system-design.md) — how the gateway consumes registry fields
- [Provider Abstraction](provider-abstraction.md) — `openrouterModelId` mapping and capability negotiation
- [Context Management](context-management.md) — how `contextWindow` drives budgeting
- [Evaluation Strategy](evaluation-strategy.md) — comparison harness that informs tiering
- [Agent Architecture](agent-architecture.md) — future per-agent model policy
