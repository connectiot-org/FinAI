# Fintra Competitor Reference

> Purpose: extracts the interaction patterns worth borrowing (Perplexity, pattern-level only) and maps the finance-AI landscape, ending in explicit borrow / adapt / avoid guidance. We copy no branding, assets, colors, or copy from anyone.

## Part A — Perplexity interaction patterns and their Fintra translation

The live homepage inspection recorded the Perplexity-style principles worth adopting (see `worklog.md`, Task 1). The worklog lists ten; all ten are translated below. These are behavioral patterns, not visual imitation — Fintra's identity stays warm-paper/emerald/bronze (D6), never Perplexity's.

| # | Perplexity pattern | Fintra translation |
|---|---|---|
| 1 | Composer-first empty state: single centered input with inline selectors and suggested prompts | The Workspace empty state is a centered **Composer** with inline Answer mode and Model Selector plus finance-specific suggested prompts ("Why did margin drop?") |
| 2 | Conversation is a first-class thread: auto title, rename, delete, sidebar history, threaded follow-ups | **Threads** are first-class: automatic titles, rename/delete, history in the left sidebar, follow-ups as threaded turns within the Thread |
| 3 | Inline model selector: compact trigger, popover grouped by provider with capability/latency metadata, switchable mid-thread | The **Model Selector** shows a compact trigger; the popover groups models by tier (Fast / Balanced / Reasoning / Open) with capability and latency metadata; switching mid-Thread applies from the next Run, and the user's choice is sticky per Thread (D4) |
| 4 | Modes of operation ("Focus") | **Answer modes**: Quick answer for orientation, Deep analysis for methodical step-shown work; guided financial workflows arrive post-MVP (D7) |
| 5 | Streaming progressive rendering with a hard Answer/Sources separation | Answers stream with visible **Run** steps; AI interpretation is visually separated from the **Evidence** panel (data references) — a stricter separation than Perplexity's, because finance demands it (D9) |
| 6 | Related follow-up questions after each answer | Finance-shaped follow-ups: drill into a driver, change the reporting period, stress an assumption — offered after each Run |
| 7 | Keyboard-first operation (⌘K new thread, ⌘/ shortcuts), minimal chrome, calm dense typography | Keyboard-first Workspace: ⌘K new Thread, ⌘/ shortcut help; Geist-based dense-readable typography with restrained chrome (D6) |
| 8 | Explicit state machine everywhere: empty → streaming → complete → error (retry) → stopped | Every Run carries the same explicit state machine, including stopped-by-user; no silent hangs, ever |
| 9 | Spaces/Library for saved artifacts | Future **Reports library**: saved analyses and board packs as first-class artifacts (post-MVP, aligned with `ReportArtifact` in D3's deferred entities) |
| 10 | Engineered perceived latency: optimistic UI, progressive steps visible during work | D10 budgets plus instant streaming states: server first byte < 1s, first token < 2s p50, thread list < 100ms optimistic; steps appear while the model thinks |

What we deliberately do not take from Perplexity: its consumer query breadth, its advertising/monetization surfaces, its visual identity, and its "answer engine" framing — Fintra is a workspace, not a search engine.

## Part B — Finance-AI product landscape

| Category | Representative shapes (category names, not feature dumps) | What they prove / what buyers expect | Implication for Fintra |
|---|---|---|---|
| General AI research and chat assistants | Perplexity; ChatGPT, Claude, Gemini consumer and team apps | The interaction bar is already set: streaming, thread history, model choice, source separation are table stakes; professionals will not tolerate lag or dead ends | Match the interaction bar, then exceed it with Evidence and audit trails; do not try to out-generalize these products |
| Accounting-automation copilots | AI layers on bookkeeping and reconciliation workflows | Finance buyers expect integrations with the ledger, controls, and accuracy claims they can verify | MVP must be honest that connectors come at P10; sell auditability now, integrations on the roadmap |
| FP&A suites adding AI | Planning/forecasting platforms bolting assistants onto models | Buyers expect AI to respect the planning model, permissions, and versioning; "AI answers" that bypass the model are rejected | Financial Context (entity, period, currency) and explicit assumptions are our equivalent discipline |
| ERP-embedded assistants | Assistants inside large ERP suites | Enterprise buyers demand audit logs, data residency, security questionnaires, and approval flows as preconditions | D8 baseline (audit, auth, keys server-side) is table-stakes architecture, not differentiation to defer |

### Generic-chatbot antipatterns to avoid

- **Confident fabrication.** Numbers invented to complete a sentence destroy permanent trust in a finance audience; D9 forbids them structurally, not just tonally.
- **Working hidden.** Answers without visible method (assumptions, calculations, sources) are unusable for anyone who must defend them.
- **State-blind UX.** Silent failures, endless spinners, and unstopped streams signal unreliability faster than any bug report.
- **Model soup in the UI.** Exposing raw model name lists with no guidance shifts routing work onto the user; tiers and an opinionated Auto exist to prevent this.
- **Toy demos that break on real questions.** Staged interactions that cannot survive an actual close-cycle question confirm every skeptic's suspicion — the homepage's simulated sections must not reappear as the real product's behavior.
- **Advice without assumptions.** Forecast or recommendation outputs that hide their assumptions are both a trust failure and a liability; assumptions must be explicit (D9).

## Borrow / adapt / avoid

| Borrow (pattern) | Adapt (with finance shape) | Avoid |
|---|---|---|
| Composer-first empty state with suggested prompts | Finance-specific suggested questions; Financial Context defaults | Consumer query breadth as the product's frame |
| Threads with auto-title and sidebar history | Finance naming conventions (close cycle, entity, period) | Treating history as an undifferentiated log |
| Inline model selector with metadata | Tier grouping (Fast/Balanced/Reasoning/Open), cost and latency honesty | Hard-coded model lists in the UI (ADR-007 forbids it) |
| Answer/Sources separation | Run steps + Evidence panel; data vs computed facts vs AI interpretation | Presenting model output as authoritative fact |
| Explicit state machine incl. error/retry/stopped | Finance-grade error copy (what to check, what is missing) | Silent retries that hide failure |
| Perceived-latency engineering | D10 budgets; steps visible while thinking | Marketing animations inside the product |
| Keyboard-first minimal chrome | Finance verbs (new analysis, switch mode, export) | Feature bloat in the Workspace chrome |
| Spaces/Library for artifacts | Reports library for saved analyses (post-MVP) | Locking artifacts into a proprietary format |

## Related docs

- [Project context](./project-context.md) — the stack and phases referenced above.
- [Existing homepage analysis](./existing-homepage-analysis.md) — how far the homepage already implements these patterns.
- [Agent UI spec](../02-ui-ux/agent-ui-spec.md) — where the translations become components.
- [Model strategy](../05-ai/model-selection.md) — tiers, sticky selection, and Auto routing.
- [Financial AI safety](../05-ai/financial-ai-principles.md) — the D9 rules behind the antipattern list.
- [Future capabilities](../08-roadmap/future-capabilities.md) — Reports library and guided workflows.
