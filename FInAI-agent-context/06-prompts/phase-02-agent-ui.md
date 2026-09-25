# Phase 2 — Agent UI shell: the full Workspace on mocked data

| Field | Value |
|---|---|
| Roadmap phase | P2 — Agent UI shell (mocked data, no backend) |
| Depends on | P1 (design tokens and site config in repo) |
| Estimated effort | M |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../02-ui-ux/agent-ui-spec.md` |

## OBJECTIVE

Build the complete Fintra Workspace UI at `/agent` — sidebar, thread canvas, composer, model selector, all interaction states — driven entirely by mocked data and a mock SSE event stream. No backend, no providers, no persistence.

## CONTEXT

Phase 1 made every homepage CTA point at `/agent`. This phase makes that destination a fully interactive product shell, canonical per `../02-ui-ux/agent-ui-spec.md` (layout, component map with build order, state machine, keyboard model, copy rules) and `../02-ui-ux/responsive-strategy.md`. Everything is mocked on purpose: the UI contract — component props, the SSE event taxonomy, the shared event types — is defined now so Phases 3–6 only swap the data source, never the components. Workspace vocabulary is fixed by D7: Thread, Composer, Model Selector, Run, Evidence, Financial Context, answer modes Quick answer / Deep analysis. Until Phase 4 adds auth, `/agent` must remain a development-only surface: it renders in development builds and shows a "coming soon" state in production builds.

## INPUTS

- `../02-ui-ux/agent-ui-spec.md` — canonical layout, component map + build order, state machine (empty → streaming → complete → error → stopped), SSE event taxonomy, keyboard shortcuts.
- `../02-ui-ux/responsive-strategy.md` — breakpoint behaviour (sidebar collapse, sticky composer, touch targets).
- `../01-context/project-context.md` — D4 model-catalog fields, D6 tokens, D7 glossary.
- Phase 1 output: tokens in `globals.css`, `src/config/site.config.ts`, the `/agent` placeholder route.

## TASKS

1. Scaffold the route: `src/app/agent/layout.tsx` + `src/app/agent/page.tsx`, gated by `src/config/features.config.ts` (`agentUiPreview: boolean`). Development builds always render the workspace; production builds render the "coming soon" card until Phase 4 enables auth.
2. Build the components in `src/components/agent/` following the component-map build order from `../02-ui-ux/agent-ui-spec.md`: `workspace-shell.tsx` (responsive chrome), `thread-sidebar.tsx` (thread list, new thread, rename, delete — local mock state only), `thread-canvas.tsx`, `message-list.tsx` with `message-part-renderers.tsx` (text, step, evidence, usage parts), `run-steps.tsx`, `composer.tsx` (auto-grow textarea, Quick/Deep mode selector, send and stop buttons), `model-selector.tsx` (popover grouped by provider with capability/latency metadata, switchable mid-thread — next answer uses the new model), `evidence-panel.tsx` (shell with mocked evidence items), `state-renderer.tsx`.
3. Create the static model registry `src/config/models.config.ts` with the D4 field set — id, provider, family, displayName, contextWindow, maxOutput, capabilities (reasoning/vision/tools), latencyClass (fast/balanced/reasoning), pricingTier 1–4, pricing per 1M tokens, availability, releaseDate, notes — and 8–12 illustrative entries across the Fast, Balanced, Reasoning and Open tiers. Mark the file header: "Illustrative examples — this config is the source of truth; refresh IDs without code changes." The Model Selector renders ONLY from this file.
4. Implement the mock SSE util `src/lib/mock-stream.ts`: `createMockStream(prompt, options)` returning a `ReadableStream` of the canonical events — `step` (id, label, status running/complete, index), `text-delta` (text), `usage` (model, promptTokens, completionTokens, costUsd), `error` (code, message, retryable), `done` (messageId). Scenario flags: `normal`, `error-mid-stream`, `stop-abort`, `empty-response`. Fixtures are deterministic so tests are stable.
5. Create the shared contract types `src/lib/sse-types.ts` (`SseEvent` union and payload types). Both the mock producer and the future real producer use these exact types; Phase 5 imports them unchanged.
6. Build the client streaming hook `src/lib/use-thread-stream.ts`, consuming the mock stream through the same parse path the real API will use (parse `event:` / `data:` frames from a `ReadableStream`).
7. Implement the full state machine per `../02-ui-ux/agent-ui-spec.md`: empty (composer-first with suggested prompts), streaming (Run steps plus progressive text), complete (parts rendered, follow-up suggestions), error (inline, with Retry when retryable), stopped (partial content plus a visible "stopped" marker). Every state must be reachable through mock scenarios.
8. Keyboard shortcuts per spec: Cmd/Ctrl+K new thread, Cmd/Ctrl+/ shortcut help overlay, Enter to send / Shift+Enter newline, Escape stops a running stream.
9. Responsive pass per `../02-ui-ux/responsive-strategy.md`: sidebar collapses to a drawer at the spec breakpoint, composer stays reachable, touch targets ≥ 40px, verified at 390 / 768 / 1280 px widths.
10. Optional: Storybook stories for Composer, Model Selector, RunSteps and the state catalogue in `src/components/agent/*.stories.tsx`. Do not block the phase on this.

## CONSTRAINTS

- No network calls, no provider SDKs, no server persistence. A localStorage thread cache is allowed for dev ergonomics only and must be clearly marked as mock.
- SSE event names and payload shapes must match the taxonomy exactly — later phases replace the producer, not the consumer contract.
- Tokens and typography per D6; Geist Mono for all figures, including mock token and cost usage.
- No auth in this phase; use the feature gate exactly as specified.
- No financial prompt logic or guardrails (Phase 7); mocked content may show example formatting only.

## EXPECTED OUTPUT

A demoable `/agent`: create a Thread, type in the Composer, pick model and mode, watch a mocked Run stream step-by-step into a complete answer with usage, trigger the error and stop scenarios, rename and delete mock threads, use every keyboard shortcut, and resize from 1280px down to 390px without breakage.

## FILES TO CREATE OR MODIFY

- `src/app/agent/layout.tsx`, `src/app/agent/page.tsx`
- `src/components/agent/*` — components per task 2
- `src/config/models.config.ts`, `src/config/features.config.ts`
- `src/lib/sse-types.ts`, `src/lib/mock-stream.ts`, `src/lib/use-thread-stream.ts`
- `src/components/ui/*` additions as needed (popover, tooltip, drawer)

## TEST REQUIREMENTS

- State-machine coverage (Vitest + Testing Library): empty, streaming, complete, error (retryable and non-retryable), stopped — each driven by a mock scenario.
- Mock stream unit tests: event order and payload shapes for the normal, error, and stop scenarios; deterministic across runs.
- Registry-rendering test: the Model Selector output is a snapshot derived from `models.config.ts`, proving no hard-coded model IDs exist in components.
- Keyboard shortcut unit tests: handlers fire for Cmd/Ctrl+K, Cmd/Ctrl+/, Enter, Shift+Enter, Escape.
- Type contract test: mock events type-check against the `SseEvent` union in `src/lib/sse-types.ts` (shared with Phase 5).

## ACCEPTANCE CRITERIA

- [ ] The full happy path is demoable with mocks end-to-end: new Thread → prompt → streamed Run → complete answer → follow-up.
- [ ] The states catalogue is complete and matches `../02-ui-ux/agent-ui-spec.md`: empty, streaming, complete, error, stopped.
- [ ] The Model Selector lists only registry models with tier grouping and metadata; zero hard-coded model IDs in components.
- [ ] The SSE event taxonomy matches the spec exactly, via shared types in `src/lib/sse-types.ts`.
- [ ] All keyboard shortcuts work and are documented in the shortcut help overlay.
- [ ] Responsive behaviour matches `../02-ui-ux/responsive-strategy.md` at 390 / 768 / 1280 px.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` clean; no real network calls anywhere in the phase.

## DO NOT DO

- Do not call real providers or add provider SDKs (Phase 5).
- Do not persist threads or messages server-side, and do not set up Prisma (Phase 3).
- Do not add authentication or middleware (Phase 4).
- Do not implement financial prompt logic, guardrails, or the Financial Context card content model (Phase 7).
- Do not change the SSE taxonomy or event names.

## NEXT STEP

Load `phase-03-backend.md` — data layer and service skeleton. It may proceed in parallel with any remaining polish of this phase, per the roadmap's parallel-track note.
