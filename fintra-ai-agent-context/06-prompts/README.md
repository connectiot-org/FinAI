# 06-prompts — Sequential Execution Prompts for Fintra

This folder is the execution layer of the Fintra documentation package: one standing master prompt and one self-contained phase prompt per delivery phase. A future AI coding agent (or a human engineer) executes the phase prompts in order to build the Fintra MVP — the **Fintra Workspace** at `/agent` plus the marketing homepage that leads to it — exactly as specified by the architecture documents.

The prompts are documentation, not code. They encode the authoritative decisions of the DECISION LEDGER v1.0 recorded in `../01-context/project-context.md` (D1 stack, D2 layout, D3 entities, D4 model strategy, D5 phase model, D6 tokens, D7 glossary, D8 security, D9 financial safety, D10 budgets, D11 doc rules).

## How to use this system

1. Start every working session by loading `master-development-prompt.md` into context. It is the standing prompt and applies to all phases.
2. Then load exactly one phase prompt — the lowest-numbered phase whose status is "Not started" in the status tracking table below.
3. Read every document listed in the phase prompt's INPUTS section before writing code.
4. Execute the phase. Do not start the next phase until every acceptance criterion of the current phase is met and verified.
5. When a phase completes, update the "Implementation status" table in `../01-context/project-context.md` and the status tracking table in this README.

## Execution order

Phase numbering, prompt-file mapping and dependencies are canonical per the DECISION LEDGER (D5).

| Order | Prompt file | Roadmap phase | Depends on | Rough deliverable |
|---|---|---|---|---|
| 0 | `master-development-prompt.md` | Standing prompt (all phases) | P0 package | Session-level role, rules, quality bar |
| 1 | `phase-01-homepage.md` | P1 — Homepage polish | P0 package | Production homepage; every primary CTA routes to `/agent`; honest copy |
| 2 | `phase-02-agent-ui.md` | P2 — Agent UI shell | P1 (design tokens in repo) | Full `/agent` workspace on mocked data + mock SSE stream |
| 3 | `phase-03-backend.md` | P3 — Backend foundation | P2 (may run in parallel with it) | Prisma schema + migrations, services skeleton, API conventions, health |
| 4 | `phase-04-authentication.md` | P4 — Authentication | P3 | Auth.js v5 sign-in, protected `/agent` and `/api/v1`, audit log |
| 5 | `phase-05-model-layer.md` | P5 — Model layer | P3 (auth helpers from P4) | Model registry, AI Gateway, OpenRouter adapter, SSE streaming API |
| 6 | `phase-06-chat.md` | P6 — Conversations and chat | P4 + P5 | Real authenticated threads, persisted streamed answers, history |
| 7 | `phase-07-financial-ai.md` | P7 — Financial AI | P6 | Prompt library, guardrails, answer modes, golden evals |
| 8 | `phase-08-testing.md` | P8 — Hardening | P1–P7 | CI-enforced test, security, performance and a11y gates |
| 9 | `phase-09-deployment.md` | P9 — Production | P8 | Vercel + Neon production deploy, observability, runbooks, checklist |

Post-MVP phases 10–12 (Files & data, Advanced agents/tools, Billing/scale) are documented in `../08-roadmap/future-capabilities.md` and summarized in `../08-roadmap/implementation-roadmap.md`; they have no phase prompts in this package.

The reconciliation note in `../08-roadmap/implementation-roadmap.md` explains why execution order differs from the original product-brief numbering (Model Layer moved after Backend/Auth; Files & Data moved to Phase 10).

## Rules of engagement for the coding agent

- Read `../01-context/project-context.md` first in every session, before any code. It is the single source of truth for decisions.
- One phase at a time. Never execute two phase prompts in the same session, except the one explicitly parallelizable pair (P2 and P3).
- Never skip or soften acceptance criteria. If a criterion cannot be met, stop, document the blocker in the status table Notes column, and escalate — do not proceed past a failing phase.
- Keep every implementation consistent with the ledger and the canonical documents referenced by each prompt (`../02-ui-ux/`, `../04-data-model/`, `../05-ai/`, `../07-testing/`, `../03-system-architecture/`).
- If a phase prompt and an architecture document disagree, the architecture document wins; record the conflict in the status table Notes column and continue with the document's version.
- When a phase completes, update the "Implementation status" table in `../01-context/project-context.md` with status, completion date and one-line notes (key deviations, known debt left behind).
- Match the master prompt's quality bar on every commit: `pnpm typecheck`, `pnpm lint` and `pnpm test` clean before declaring work done.

## Prompt contract format

Every phase prompt uses the same 11 mandatory sections, always in this order:

| Section | Purpose |
|---|---|
| OBJECTIVE | The single outcome the phase must achieve |
| CONTEXT | Why this phase exists now and what came before it |
| INPUTS | Documents, configs and prior outputs to read before starting |
| TASKS | Ordered, concrete work items with exact paths and commands |
| CONSTRAINTS | Non-negotiable technical and design boundaries |
| EXPECTED OUTPUT | What a reviewer should be able to see at the end of the phase |
| FILES TO CREATE OR MODIFY | Exact paths under `src/`, `prisma/`, `prompts/`, `evals/`, `.github/` |
| TEST REQUIREMENTS | Test suites and cases that must exist and pass |
| ACCEPTANCE CRITERIA | Verifiable checklist that closes the phase |
| DO NOT DO | Scope boundaries that protect later phases |
| NEXT STEP | The next phase prompt to load |

## Status tracking table

Keep this table current in this file, and mirror the same statuses in the "Implementation status" table of `../01-context/project-context.md`.

| Phase | Status | Completed date | Notes |
|---|---|---|---|
| P1 — Homepage polish | Completed | 2026-09-11 | Site config extracted, honest CTAs route to /agent |
| P2 — Agent UI shell | Completed | 2026-09-11 | Full modular /agent workspace, models.config.ts, SSE types |
| P3 — Backend foundation | Completed | 2026-09-11 | Prisma 10 MVP entities, services, error envelope, rate limiter |
| P4 — Authentication | Completed | 2026-09-11 | NextAuth/Auth.js v5 route, sign-in page, edge middleware |
| P5 — Model layer | Completed | 2026-09-11 | ProviderAdapter, OpenRouter adapter, AI Gateway, fallback, circuit breaker |
| P6 — Conversations and chat | Completed | 2026-09-11 | ChatService turn orchestration, context windowing, streaming persistence |
| P7 — Financial AI | Completed | 2026-09-11 | Versioned prompt library, prompt assembler, D9 guardrails |
| P8 — Testing hardening | Completed | 2026-09-11 | Golden evaluation suite, test runner, scoring rubric |
| P9 — Production | Completed | 2026-09-11 | Production runbooks, alert matrices, pre-launch checklist signed |

## Related documents

- Standing context and decision ledger: `../01-context/project-context.md`
- Workspace spec and responsive strategy: `../02-ui-ux/agent-ui-spec.md`, `../02-ui-ux/responsive-strategy.md`
- Data model: `../04-data-model/entities.md`
- AI layer: `../05-ai/provider-abstraction.md`, `../05-ai/context-management.md`, `../05-ai/financial-ai-principles.md`, `../05-ai/agent-architecture.md`
- Testing plans: `../07-testing/api-test-plan.md` (plus companion plans in `../07-testing/`)
- Roadmap, milestones, dependencies, post-MVP capabilities: `../08-roadmap/`
