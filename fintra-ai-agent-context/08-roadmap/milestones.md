# Milestones — Fintra MVP (M0–M5)

Milestones are the reviewable, demoable checkpoints between roadmap phases (`implementation-roadmap.md`). Each milestone lists scope, a demo script written for a CFO audience, done criteria, and a target week-of-effort range (solo baseline; see the delivery notes in the roadmap for team splits).

| Milestone | Name | Phases | Target effort |
|---|---|---|---|
| M0 | Architecture package | P0 (this package) | Complete at package delivery |
| M1 | Homepage that sells the agent | P1 | Week 1 |
| M2 | Agent you can try | P2 + P5 (demo path, mock → real) | Weeks 2–5 |
| M3 | Authenticated MVP | P3 + P4 + P6 | Weeks 4–8 (overlaps M2) |
| M4 | Financial AI you can trust | P7 | Weeks 8–11 |
| M5 | Production beta | P8 + P9 | Weeks 11–14 |

## M0 — Architecture package (done)

Scope: the complete documentation package — vision, context, UI/UX specs, system architecture, data model, AI layer design, prompt system (this folder), testing plans, roadmap, diagrams — with no application code.

Done criteria (condensed from the package's 20-point completion checklist):

- [ ] All folders 00–09 populated; every document cross-references its siblings by valid relative paths.
- [ ] The DECISION LEDGER (D1–D11) is recorded and every document conforms to it.
- [ ] Stack is pinned and justified (Next.js 16 / React 19 / TS strict / Tailwind 4 + shadcn / Prisma + Postgres / Auth.js v5 / AI Gateway over Vercel AI SDK v5 / OpenRouter / SSE).
- [ ] Directory layout (D2), MVP entities (D3), model strategy (D4) and phase model (D5) are canonical and mutually consistent.
- [ ] Design tokens (D6) extracted from the live homepage; glossary (D7) used uniformly.
- [ ] Security baseline (D8) and financial-safety principles (D9) embedded in architecture, data model and prompts.
- [ ] Performance budgets (D10) stated with measurement points.
- [ ] Roadmap reconciled with the original brief numbering; mapping table present.
- [ ] Ten phase prompts with the full 11-section contract; execution order table present.
- [ ] Testing plans cover unit, integration, e2e, security, authz matrix, rate limits, evals.
- [ ] Documentation rules (D11) respected: English, GFM, tables/lists, no diagrams-in-docs, no filler, no emoji.
- [ ] Diagrams (09-diagrams) referenced where they clarify architecture or flow.

## M1 — "Homepage that sells the agent" (Phase 1)

Scope: honest marketing surface — demo-claim cleanup, "Meet the Financial AI Agent" teaser, every primary CTA → `/agent`, `/agent` placeholder route, a11y/motion pass, Lighthouse ≥ 95 perf / ≥ 95 a11y on mobile and desktop.

Demo script (CFO): open the homepage → read the hero ("Your finance team, run by agents you can audit") → walk the teaser section showing a real Run with steps and an evidence chain → click "Open the live demo" → land on the honest `/agent` placeholder ("being built — Phase 2") → note zero fabricated claims anywhere on the page.

Done criteria: `phase-01` acceptance criteria all checked; scores recorded in the status table; site copy centralized in `src/config/site.config.ts`.

## M2 — "Agent you can try" (Phases 2 + 5)

Scope: the Workspace exists and answers questions — Phase 2 delivers the full UI on mocks; Phase 5 delivers the real registry, gateway and streaming API. The demo path crosses from mock to real: after P5, the same Composer and state machine stream a genuine OpenRouter answer.

Demo script (CFO): open `/agent` → start a Thread → pick a Reasoning-tier model from the Model Selector (grouped by provider, with latency metadata) → ask a question → watch the Run stream step-by-step to an answer with token/usage figures in Geist Mono → switch model mid-thread → ask again → stop a long answer and see the partial result labeled → note the model list comes from a registry, not hard-coded UI.

Done criteria: `phase-02` and `phase-05` acceptance criteria checked; `AIRequest` rows written for every call; fallback proven by forced failure; SSE contract shared between mock and real producer.

## M3 — "Authenticated MVP" (Phases 3 + 4 + 6)

Scope: real accounts and real memory — database, services and conventions (P3); Google OAuth + credentials auth with protected `/agent` and `/api/v1` (P4); persisted threads with streamed answers, history, stop/regenerate, windowing, auto-titles (P6).

Demo script (CFO): sign in with Google → the Workspace loads your (empty) thread list → ask "Why did EBITDA decrease this month?" → watch the streamed answer → start a follow-up in the same Thread → reload the page — the Thread and full history are intact → stop an answer mid-stream and see the partial, labeled result → sign out and confirm `/agent` gates again.

Done criteria: `phase-03`, `phase-04` and `phase-06` acceptance criteria checked; ownership matrix green; persistence-after-stream and abort partial-save tests green; titles auto-generate.

## M4 — "Financial AI you can trust" (Phase 7)

Scope: the trust layer — versioned prompt library, D9-compliant financial system prompt, Quick/Deep modes, structured tables, Financial Context placeholder, guardrails, injection fencing, 20 golden evals green.

Demo script (CFO): in Deep mode ask for a variance analysis → the answer separates data, computed facts and Interpretation blocks → the Assumptions block lists what it had to assume → the calculation walks step-by-step in a Geist Mono table → uncertainty is stated in words, not fake precision → the disclaimer is present → then try to bait it into inventing a revenue number — it refuses and names the missing data → show the guardrail warning appearing when a label is missing.

Done criteria: `phase-07` acceptance criteria checked; every AI call records prompt id + version; all 20 golden cases pass; guardrail unit tests green.

## M5 — "Production beta" (Phases 8 + 9)

Scope: CI-enforced hardening (e2e, security gates, budgets, a11y) and production (Vercel + Neon, alerts, runbooks, drills, signed checklist).

Demo script (CFO): show the production URL with the homepage and Workspace live → run the M4 demo script on production with a real sign-in → show the ops view: green CI pipeline with all gates, the armed alert table (error rate, streaming p95, fallback spike, cost anomaly, DB), the completed PITR restore drill record, and the runbooks — incident, rollback, key rotation → close on the pre-launch checklist signatures.

Done criteria: `phase-08` and `phase-09` acceptance criteria checked; D10 budgets verified on production; all gates required for merge; checklist signed in the status table.
