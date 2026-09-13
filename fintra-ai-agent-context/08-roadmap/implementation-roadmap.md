# Implementation Roadmap — Fintra MVP (P0–P12)

This roadmap is the execution plan behind the phase prompts in `../06-prompts/`. Each phase maps to exactly one prompt file; the mapping table below is canonical per the DECISION LEDGER (D5) in `../01-context/project-context.md`.

## Phase table (P0–P12)

| Phase | Name | Prompt file | Status in this package |
|---|---|---|---|
| P0 | Architecture & design package | — | This documentation package |
| P1 | Homepage polish (real CTAs → /agent) | `../06-prompts/phase-01-homepage.md` | Prompted |
| P2 | Agent UI shell (mocked data, no backend) | `../06-prompts/phase-02-agent-ui.md` | Prompted |
| P3 | Backend foundation (Prisma, services, health, env) | `../06-prompts/phase-03-backend.md` | Prompted |
| P4 | Authentication (Auth.js v5, protected /agent) | `../06-prompts/phase-04-authentication.md` | Prompted |
| P5 | Model layer (registry, gateway, OpenRouter adapter, streaming API) | `../06-prompts/phase-05-model-layer.md` | Prompted |
| P6 | Conversations & chat (persistence, streaming wire-up, history, retry/stop) | `../06-prompts/phase-06-chat.md` | Prompted |
| P7 | Financial AI (prompt library, guardrails, context, structured outputs) | `../06-prompts/phase-07-financial-ai.md` | Prompted |
| P8 | Testing hardening + CI gates | `../06-prompts/phase-08-testing.md` | Prompted |
| P9 | Production (deployment, observability, security, performance) | `../06-prompts/phase-09-deployment.md` | Prompted |
| P10 | Files & data | — | Post-MVP, detailed in `future-capabilities.md` |
| P11 | Advanced agents & tools | — | Post-MVP, detailed in `future-capabilities.md` |
| P12 | Billing & scale | — | Post-MVP, detailed in `future-capabilities.md` |

### Reconciliation note (original brief numbering vs execution order)

The original product brief listed Model Layer as Phase 3 and Files & Data as Phase 7. Execution order was adjusted on dependency grounds and is authoritative: the model layer needs the database, env validation and service conventions (backend foundation) before anything else, and it needs authentication to exist before the streaming endpoint can be protected; Files & Data depends on the finished chat loop and the prompt/guardrail layer. The canonical mapping is the table above (identical to D5): backend before model layer; Files & Data at P10; Advanced agents/tools at P11; Billing/scale at P12.

## Phase details

Effort scale: S ≈ 1 week, M ≈ 1–2 weeks, L ≈ 2–3 weeks of focused single-engineer work. Weekly figures assume the solo baseline; see "Team-shaped delivery notes" for the split model.

### P1 — Homepage polish (effort: S)

- Goal: a production marketing surface whose every primary CTA routes to `/agent` and which previews the real Workspace.
- Scope in: demo-claim cleanup, "Meet the Financial AI Agent" teaser section, CTA plumbing to `/agent` (plus honest placeholder route), a11y/motion pass, D10 performance budget, `site.config.ts` extraction. Scope out: any agent backend, any UI beyond the placeholder, section redesign.
- Key deliverables: honest announcement bar, teaser section, `/agent` placeholder, Lighthouse ≥ 95 perf / ≥ 95 a11y on mobile and desktop.
- Exit criteria: all `phase-01` acceptance criteria checked; status table updated.
- Risks: removing fabricated stats weakens perceived traction — mitigated by design-target labeling language; animation budget creep — mitigated by hard Lighthouse gate.

### P2 — Agent UI shell (effort: M)

- Goal: the complete `/agent` Workspace on mocks — sidebar, thread canvas, Composer, Model Selector, full state machine, keyboard shortcuts.
- Scope in: component map build order from `../02-ui-ux/agent-ui-spec.md`, static model registry `src/config/models.config.ts`, mock SSE stream, shared `sse-types.ts`, responsive behaviour. Scope out: real providers, persistence, auth, financial prompt logic.
- Key deliverables: demoable happy path with mocks; states catalogue (empty/streaming/complete/error/stopped); registry-only Model Selector.
- Exit criteria: `phase-02` acceptance criteria; UI contract (SSE types, component props) frozen for Phases 5–6.
- Risks: UI/spec drift — mitigated by the spec's component map being the build order; premature polish on mocked data — mitigated by the phase's explicit no-backend boundary.

### P3 — Backend foundation (effort: M)

- Goal: data layer + service skeleton + API conventions + health, with zero AI and zero auth.
- Scope in: Prisma schema for the ten MVP entities, migrations, seed (`ModelCatalog` + dev admin), `src/server/env.ts`, error envelope + codes, conversationService skeleton, `/api/v1/health`, structured logging with requestId, `RateLimiter` interface + in-memory implementation. Scope out: AI calls, real auth (dev-user stub), org entities, background jobs.
- Key deliverables: clean-migration database, ownership-enforcing services, canonical error envelope.
- Exit criteria: `phase-03` acceptance criteria including the 403/404 ownership matrix.
- Risks: schema drift against `../04-data-model/entities.md` — mitigated by that document being the review baseline; conventions skipped under time pressure — mitigated by the envelope/env tests.

### P4 — Authentication (effort: S–M)

- Goal: real accounts — Auth.js v5 with Google OAuth + credentials (argon2), JWT session cookie, protected `/agent` and `/api/v1`.
- Scope in: middleware, sign-in page, session helpers replacing the stub, audit log entries, rate-limited sign-in, seeded admin. Scope out: roles beyond USER/ADMIN, orgs, session-management UI, additional OAuth providers.
- Key deliverables: gate screen on unauthenticated `/agent`; full sign-in/sign-out loop; auth matrix green.
- Exit criteria: `phase-04` acceptance criteria including cookie-flag assertions.
- Risks: OAuth credential setup friction (external dependency, see `dependencies.md`); middleware/edge constraints — mitigated by keeping middleware DB-free.

### P5 — Model layer (effort: M–L)

- Goal: registry + gateway + OpenRouter adapter + streaming API with usage accounting.
- Scope in: `ProviderAdapter` port, OpenRouter adapter (Vercel AI SDK v5 inside), registry merge (config + `ModelCatalog`), `/api/v1/models`, `/api/v1/chat/stream` SSE per taxonomy, fallback engine + circuit breaker, `AIRequest`/`UsageRecord` rows, error mapping, abort handling. Scope out: message persistence, financial prompts, direct provider adapters.
- Key deliverables: real streamed answer from at least one OpenRouter model; fallback proven by forced failure; usage rows for every call.
- Exit criteria: `phase-05` acceptance criteria; key material provably env-only.
- Risks: OpenRouter availability/latency — mitigated by fallback chain and circuit breaker; model-ID churn — mitigated by the config-as-data registry.

### P6 — Conversations & chat (effort: M)

- Goal: real authenticated threads — persistence, streaming wire-up, history, retry/stop.
- Scope in: chatService orchestration, thread endpoints wired to the UI, mock-stream replaced in production paths, stop = abort + partial-save policy, regenerate semantics, context windowing, optimistic UI + error recovery, auto-generated titles. Scope out: financial prompt specialization, files, tools.
- Key deliverables: full thread lifecycle on real models; reload-safe history; unit-tested windowing.
- Exit criteria: `phase-06` acceptance criteria including persistence-after-stream and abort partial-save tests.
- Risks: partial-save ambiguity — mitigated by the documented stopped/partial policy; duplicate messages on retry — mitigated by idempotency keys.

### P7 — Financial AI (effort: M–L)

- Goal: the trust layer — versioned prompt library, D9-compliant base financial system prompt, Quick/Deep modes, structured outputs, guardrails, injection fencing, 20 golden evals.
- Scope in: `prompts/` library per D2, prompt assembler with version recording, financial tables in Geist Mono, Financial Context placeholder, guardrail hooks, eval dataset + workflow. Scope out: real data integrations, tools, agent runtime, billing.
- Key deliverables: variance-analysis demo that is labeled, assumption-explicit and table-formatted; refusal case that refuses to invent numbers; evals green.
- Exit criteria: `phase-07` acceptance criteria.
- Risks: guardrails over-firing (annotation fatigue) — mitigated by warn-not-rewrite design; eval set bias — mitigated by covering refusal and uncertainty cases explicitly.

### P8 — Testing hardening (effort: M)

- Goal: all `../07-testing/` plans implemented as CI-enforced gates; budgets met; a11y clean.
- Scope in: e2e suite, security tests (secret scan, bundle check, authz matrix, headers), rate-limit tests, eval workflow in CI (manual trigger), flaky quarantine, performance passes vs D10, a11y audit, dependency hygiene. Scope out: new features.
- Key deliverables: required green CI; D10 budgets enforced; zero axe critical/serious issues.
- Exit criteria: `phase-08` acceptance criteria.
- Risks: flaky e2e eroding trust — mitigated by the two-week quarantine rule with review dates; budget misses — mitigated by the no-relaxation rule forcing code fixes.

### P9 — Production (effort: M)

- Goal: Vercel + Neon production per `../03-system-architecture/deployment-architecture.md`; operable, observable, drillable.
- Scope in: env matrix, pooling, maxDuration for SSE, migrations in CD with expand-contract rule, final pipeline + branch protection, log drains + alerts, production rate-limit choice, header verification, PITR drill, runbooks, pre-launch checklist. Scope out: billing, integrations.
- Key deliverables: production deploy green; alerts armed; restore drill documented; checklist signed.
- Exit criteria: `phase-09` acceptance criteria.
- Risks: serverless streaming limits — mitigated by maxDuration config and verified first-token p50; alert noise — mitigated by initial thresholds marked as tune-later.

### P10–P12 — Post-MVP (documented, not prompted)

Summaries only; full capability detail, prerequisites and approval requirements live in `future-capabilities.md`.

- P10 Files & data: uploads, document/spreadsheet analysis, canonical financial model, real Financial Context. Depends on: P9, P7.
- P11 Advanced agents & tools: agent runtime (`../05-ai/agent-architecture.md`), tools interface, scheduled runs (Trigger.dev), approvals queue, 8-agent roster activation. Depends on: P10.
- P12 Billing & scale: orgs/RBAC, usage-based billing, enterprise controls, SLA posture. Depends on: P11.

## Critical path

Ordered (solo baseline): P0 → P1 → P2 → P3 → P4 → P5 → P6 → P7 → P8 → P9. P10–P12 follow post-MVP in that order.

Parallel tracks: P2 (workspace shell) and P3 (backend foundation) share no code and can run simultaneously — the roadmap's marketing-polish-parallel-workspace-shell note applies here; P1 and P2 can also overlap for a front-end-heavy pairing since P2 only consumes P1's tokens and config. P8's performance and a11y work is continuous by nature and can start on finished surfaces (homepage after P1, workspace after P6) before the formal hardening phase. Everything else is sequential: P4 blocks P5's protected routes, P5 blocks P6, P6 blocks P7, P7+P8 block P9.

## Team-shaped delivery notes

- Solo developer: run the phases strictly in order with the P2∥P3 overlap optional; expect roughly 11–14 weeks to a production beta (P1 1w, P2 2w, P3 1.5w, P4 1w, P5 2.5w, P6 2w, P7 2.5w, P8 1.5w, P9 1.5w, plus buffer).
- Two engineers: split by surface. Engineer A (frontend): P1, P2, the UI half of P6 (stream-client, optimistic UI, states), a11y/performance fixes in P8. Engineer B (backend): P3, P4, P5, the service half of P6 (chat-service, windowing, persistence), P7, P9. Merge point: pair on P6 — it is the phase where both halves meet; after P6, B owns P7 while A runs early P8 passes on finished surfaces. This saves roughly 3–4 weeks against the solo baseline.
- Either model: the status tables in `../06-prompts/README.md` and `../01-context/project-context.md` are the coordination mechanism — update them on every phase completion, and never let two phases run concurrently on the same files.
