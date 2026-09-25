# Context Management

> How the Context Manager assembles every request: fixed assembly order, token budgeting, history summarization with number-loss rules, prompt-cache strategy, and the never-in-context list.

## Assembly pipeline (order matters)

The Context Manager builds the final prompt in this fixed order. Order is a contract: the stable prefix must come first for provider-side prompt caching, and financial safety text must precede any user content so instructions frame the data.

| # | Segment | Source | Notes |
|---|---|---|---|
| 1 | Base system prompt | Versioned `prompts/system/` blocks | Persona + financial safety rules per financial-ai-principles.md; prompt version recorded on the `AIRequest` row |
| 2 | Capability module | Versioned `prompts/` | Answer mode instructions: Quick answer vs Deep analysis (D7) |
| 3 | Model-specific adjustments | `prompts/model-specific/` | e.g. reasoning models get minimal scaffolding (no "think step by step" nannies); Fast models get explicit "show formula, inputs, result" scaffolding |
| 4 | Financial Context block | Gateway (Phase 7: workspace profile) | Entity, reporting period, currency, data freshness, integration sources. Until Phase 7 this is a mocked placeholder clearly labeled as demo context — it must never read as real user data |
| 5 | Thread history | Conversation rows | Windowed: recent turns verbatim, older turns as rolling summary (rules below) |
| 6 | User message | Current request | Always last, verbatim |

Segments 1–4 form the stable prefix for a given (thread, model, mode); segment 5 grows; segment 6 changes per request. The pipeline is illustrated in `../09-diagrams/ai-request-flow.svg`.

## Token budgeting

Budgets are computed from the registry `contextWindow` of the serving model (never hard-coded):

| Segment | Share of `contextWindow` | Example at 128k | Overflow behavior |
|---|---|---|---|
| System prompt | ~8% | 10.2k | Prompt blocks are trimmed by priority; never below safety module |
| Financial Context | ~12% | 15.4k | Profile fields are compact key-value lines; drop optional sources first |
| Thread history | 60% | 76.8k | Summarize oldest turns until it fits (thresholds below) |
| Response headroom | 20% | 25.6k | `maxOutput` capped at this share; untouched by input assembly |

If input still exceeds the window after summarization, the gateway truncates + summarizes once more and retries (ai-system-design.md failure taxonomy, `CONTEXT_OVERFLOW`).

## Thread history windowing and loss rules

- Recent turns (target: the last 6 messages, tuned by token size) are included **verbatim**.
- Older turns are replaced by a **rolling summary** maintained per thread. Loss rules are strict because numbers are the product:
  - **Never summarize numbers.** A summary must not restate figures at all; each retired figure becomes an explicit reference, e.g. "September revenue discussed earlier in the thread (earlier figure)".
  - Verbatim-quoted user figures inside an assistant's computed result are preserved as "computed earlier: <result> from <earlier figure> inputs" only when the user refers back within the verbatim window.
  - Summaries keep: decisions, assumptions accepted by the user, open questions, data gaps the user was told about.
  - Summaries drop: pleasantries, reformulations, superseded drafts.
- Follow-up questions that need exact prior numbers are answered from the verbatim window; if the figure is only in the summary, the assistant asks the user to re-provide or re-connect the data rather than reconstruct it (financial-ai-principles.md: prefer asking over guessing).

## Summarization policy

- **Trigger**: when projected history tokens exceed the 60% budget, or a single past turn exceeds ~10% of the window.
- **Who summarizes**: a cheap Fast-tier model call (registry: cheapest available Fast model), never the serving model — summarization must not burn the user's answer budget or latency.
- **Prompt**: stored and versioned at `prompts/system/summarize.md`; it encodes the loss rules verbatim and outputs the summary plus a list of "earlier figure" references.
- **Validation (no invented numbers)**: after summarization, a deterministic check extracts every numeric token from the summary and asserts each appears in the source messages; any mismatch rejects the summary and retries once with a stricter instruction. Persistent failure marks the thread for manual review — a fabricated figure must never enter context.
- **Cost control**: summarization runs only on the delta turns since the last summary; it is written back to the conversation row, not recomputed per request.

## Cache strategy

- The prefix (segments 1–4) is kept **byte-stable within a thread**: no timestamps, no per-request counters, no volatile randomness inside the prefix. This enables provider-side prompt caching where available (OpenRouter/OpenAI-compatible), cutting time-to-first-token and cost.
- Model-specific blocks are keyed by model family, so switching models changes only that block, not the safety/persona prefix.
- Cache-hostile content (live "current time", rotating ids) belongs in the user message or post-prefix blocks only.

## Multi-turn consistency rules

- **Sticky model per conversation** (D4): the model is fixed for the thread; a mid-thread switch applies to the next message and is announced in the UI.
- **Context format is model-agnostic**: the same assembly pipeline serves every model; only segment 3 varies. This guarantees that switching models mid-thread does not silently change what the model knows about the workspace.
- Assumptions accepted by the user persist across turns: they live in the rolling summary (and, Phase 7+, in the Financial Context block) so they are carried through follow-ups (financial-ai-principles.md).

## What is NEVER in context

Hard exclusions, enforced in the Context Manager and covered by tests (../07-testing/security-test-plan.md):

- **Other users' data** — every query is ownership-scoped at the service layer; cross-user leakage is a blocking test failure.
- **Raw API keys or any `env.ts` secrets** — server env never enters prompts.
- **Unapproved tools output** — only allow-listed tool results may enter context (Phase 8+).
- **Other conversations** — context is thread-scoped only.
- **Observability metadata** — request ids, costs, and internal traces are not prompt material.
- **Marketing/demo claims** — homepage demo-staged content (fictional Series A, fake metrics) must never leak into product prompts.

## Related docs

- [AI Subsystem Design](ai-system-design.md) — budget allocation and overflow retry
- [Financial AI Principles](financial-ai-principles.md) — safety module content, assumptions discipline
- [Model Selection](model-selection.md) — `contextWindow`, sticky model policy
- [Prompts Library](../06-prompts/README.md) — versioned prompt sources incl. `prompts/system/summarize.md`
- [Testing: Security Test Plan](../07-testing/security-test-plan.md) — data-leakage tests for context scoping
- Diagram: `../09-diagrams/ai-request-flow.svg`
