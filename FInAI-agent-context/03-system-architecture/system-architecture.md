# System Architecture

> Purpose: Define Fintra's end-to-end architecture — system context, containers, server core components, layering rules, request lifecycles, scalability path, and key risks — as the authoritative map that all other architecture documents elaborate.

## Architectural goals and constraints

Fintra is an AI-native financial intelligence platform. The MVP product surface is the **Fintra Workspace** (`/agent`): financial AI threads with model selection through the Fintra AI Gateway (OpenRouter first), authentication, persistence, and financial guardrails. Every architectural decision below serves four goals and respects six constraints.

| Goals | Constraint baseline |
|---|---|
| G1 — Auditable AI: every AI output traceable to request, model, prompt version, cost, and status | C1 — Single Next.js 16 App Router application (React 19, TypeScript strict); no monorepo tooling |
| G2 — Streaming-first UX: incremental answers with visible run steps | C2 — Vercel + Neon PostgreSQL 16 hosting; serverless functions, no always-on services |
| G3 — Cost control: per-request budgets, per-user daily caps, tiered model routing | C3 — No background jobs in MVP; Trigger.dev reserved for Phase 8+ |
| G4 — Provider independence: swap AI providers without UI or service changes | C4 — OpenRouter as primary AI route; direct provider adapters interface-defined, built later |
| | C5 — Rate limiting in-memory MVP; Upstash Redis later behind the same `RateLimiter` port |
| | C6 — No org/team entities in MVP; user-scoped ownership only |

The stack is pinned by decision ledger D1 and the rationale is recorded in [01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md). Canonical directory layout follows D2.

## Level 1 — System context

One system boundary: the Fintra platform (browser client + Next.js server + database). Everything else is an actor or an external system. See [09-diagrams/system-architecture.svg](../09-diagrams/system-architecture.svg).

**Actors**

| Actor | Type | Interaction with Fintra |
|---|---|---|
| Finance professional | Primary human | Signs in, creates Threads, asks financial questions via the Composer, selects models in the Model Selector, consumes streamed runs and Evidence |
| Admin (Fintra operator) | Secondary human | Manages model catalog availability, inspects usage/audit data, rotates secrets; roles-lite USER/ADMIN in MVP |
| AI provider (acting system) | Machine | Receives normalized chat-completion requests from the AI Gateway, returns SSE streams; never sees Fintra users' identities, only pseudonymous request metadata |
| Future integrations (acting systems) | Machine (Phase 7+) | Xero, QuickBooks, Stripe, and bank feeds supplying financial data that becomes Financial Context and Evidence |

**External systems**

| System | Role | Boundary notes |
|---|---|---|
| OpenRouter | Primary AI gateway route — one OpenAI-compatible contract to many providers (OpenAI, Anthropic, Google, open models) | All AI traffic flows Fintra backend → OpenRouter; browser never contacts providers (D8) |
| OpenAI / Anthropic / Google direct | Future fallback routes | Defined by `ProviderAdapter` port; not built in MVP (D4) |
| Neon PostgreSQL 16 | System of record | Users, sessions, threads, messages, model catalog, AI observability, usage, audit |
| Google OAuth | Identity provider | Auth.js v5 flow; credentials (email + argon2) as secondary MVP path |
| Trigger.dev / Upstash / Langfuse | Reserved | Background jobs (Phase 8), distributed rate limit + cache (Phase 9), tracing adapter (optional, post-MVP). Interfaces reserved, not built |

## Level 2 — Container view

| Container | Technology | Responsibilities |
|---|---|---|
| Browser client | React 19 SPA islands under Next.js App Router; RSC payload + client islands (Composer, thread canvas streaming, Model Selector) | Renders workspace, consumes SSE stream, optimistic thread list updates; holds no secrets |
| Next.js server | Route handlers (`/api/v1/*`), application services, Fintra AI Gateway, Prisma client | Auth gate, validation, orchestration, AI routing/policy, persistence, usage metering, audit |
| PostgreSQL (Neon) | PostgreSQL 16 via Prisma, pooled endpoint (pgBouncer) | Durable state; no business logic; accessed only through the server container |
| External AI providers | OpenRouter (primary) | Model inference over SSE; stateless from Fintra's perspective |

Deployment of these containers (regions, function duration, connection budget) is specified in [deployment-architecture.md](deployment-architecture.md).

## Level 3 — Server core component notes

| Component | Path (D2) | Notes |
|---|---|---|
| Route handlers | `src/server/api/` | Thin controllers: authenticate, validate with Zod, delegate to one service, map errors to the uniform envelope |
| Application services | `src/server/services/` | `conversationService`, `chatService` (orchestrator), `usageService`, `auditService`, `userService` — own transactions and authorization checks |
| Domain | `src/server/domain/` | Pure TypeScript: context-window arithmetic, cost computation, routing heuristics, guardrail value types; zero I/O |
| AI Gateway | `src/server/ai/` (`gateway/`, `providers/`, `registry/`, `prompts/`) | Policy enforcement, model routing, prompt assembly, provider adapters, stream normalization — detailed in [ai-architecture.md](ai-architecture.md) |
| Database layer | `src/server/db/` | Prisma schema + singleton client; schema-first with committed migrations |
| Env gateway | `src/server/env.ts` | Zod-validated environment access; the only module allowed to read `process.env` (D8) |
| Config | `src/config/` | `models.config.ts`, `site.config.ts`, `features.config.ts` — data, not code (D4) |

## Layering rules

Dependency direction is strictly downward: `API → Services → Domain / AI / Infra`, with `env` and `config` as leaves.

| Rule | Statement |
|---|---|
| L1 | Route handlers are thin: no business logic, no direct Prisma or gateway calls |
| L2 | Services orchestrate: transactions, authorization, cross-module coordination live here |
| L3 | Domain is pure: no imports from services, db, ai, or framework code |
| L4 | Infra adapters (db, ai providers) know nothing about services or HTTP |
| L5 | Client code never imports `src/server/**`; server code never imports client components |

**"What may import what" matrix**

| Importer | May import | Must not import |
|---|---|---|
| Route handler (`src/server/api`) | Services; domain types; `src/lib` validation/auth helpers; `env.ts` | `src/server/db` client directly; `src/server/ai` internals; other handlers |
| Service (`src/server/services`) | Domain; db client; AI Gateway public API; `env.ts`; `src/config` | Route handlers; React |
| Domain (`src/server/domain`) | Standard library only | Anything else in `src/server` or `src/app` |
| AI modules (`src/server/ai`) | Domain types; `src/config`; `env.ts` | db client; services; HTTP layer |
| Infra (`src/server/db`) | `env.ts` | Services; API |
| RSC pages / server components | Services (read path — deliberate exception to L1 so RSC avoids an HTTP hop); domain types; UI primitives | Route handlers; client-only modules |
| Client components | Public API client helpers and shared types (`src/lib/**`) | Anything under `src/server` (enforced by ESLint `no-restricted-imports`) |

## Request lifecycles

### T1 — `GET /agent` (authenticated render)

1. Middleware (edge) verifies the JWT session cookie and applies security headers; unauthenticated requests redirect to `/sign-in?next=/agent`.
2. The `/agent` RSC route calls `conversationService.listForUser` (cursor-paginated, soft-delete filtered) and the registry snapshot for the Model Selector.
3. The shell renders server-side: sidebar thread list, composer-first empty state; only interactive islands (Composer, Model Selector) ship client JS.
4. Hydration attaches TanStack Query for live thread-list updates and streaming status. Budgets: server first byte < 1s, thread list interaction < 100 ms optimistic (D10).

### T2 — `POST /api/v1/chat/stream` (end-to-end)

1. Middleware authenticates; the handler validates the Zod body (`conversationId?`, `content`, `modelId | "auto"`, answer mode).
2. Rate limiter consumes from the per-user+IP AI bucket; `usageService.preflight` rejects over-cap users (`USAGE_CAP_REACHED`).
3. `conversationService` enforces ownership (or creates a new Thread); the user Message is persisted immediately so refreshes never lose input.
4. `chatService` assembles context (windowing per [05-ai/context-management.md](../05-ai/context-management.md)), resolves the model via routing rules ([model-routing.md](model-routing.md)), and builds the layered prompt from the versioned `prompts/` library.
5. The AI Gateway applies policy (token budget, capability filter, fallback chain) and calls the OpenRouter adapter (`streamText` behind the `ProviderAdapter` port).
6. Provider SSE is normalized to unified chunks (`step`, `text-delta`, `usage`, `error`, `done`) and re-emitted to the client as SSE. Client abort propagates via `AbortController`/`request.signal`.
7. On `done` (or abort/error): usage is extracted and priced from registry rates; one transaction writes the `AIRequest` row and the assistant `Message` (parts array); `usageService` upserts the per-user-per-day `UsageRecord`; `auditService` records the event. All log lines carry the `requestId`.

### T3 — Sign-in

1. `/sign-in` offers Google OAuth and credentials (argon2 verify). Both are Auth.js v5 flows under `/api/v1/auth/[...nextauth]`.
2. On success Auth.js issues an encrypted JWT session cookie (`httpOnly`, `secure`, `sameSite=lax`, 30-day sliding window) and redirects to `next`.
3. `auditService` writes a `SIGN_IN` audit event; failed attempts are logged without credentials. Detail: [security-architecture.md](security-architecture.md).

## Technology decision summary

| Decision | Choice | Primary rationale |
|---|---|---|
| Framework | Next.js 16 App Router + React 19 + TS strict | One deployable unit; RSC keeps client JS small; serverless-friendly |
| Backend shape | Route handlers + layered services | Thin API surface testable at service layer; SSE via POST handler |
| DB/ORM | PostgreSQL 16 (Neon) + Prisma | Schema-first, typed queries, branch databases for previews |
| Auth | Auth.js v5, JWT cookie | Standard OAuth + credentials flows; edge-verifiable session |
| AI layer | Custom gateway on Vercel AI SDK v5 `streamText` behind `ProviderAdapter` | AI SDK removes SSE/protocol boilerplate; our port keeps provider independence (swap-out documented in [ai-architecture.md](ai-architecture.md)) |
| Rate limiting | In-memory `RateLimiter` → Upstash later | Zero-infra MVP; interface stable across swap |
| Jobs | None in MVP; Trigger.dev Phase 8 | Every MVP flow is request-scoped |

Full rationale and rejected alternatives: [01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md).

## Scalability path

Vertical first; each next step is adopted on a measured trigger, notspeculatively.

| Step | What changes | Adopt when (trigger metric) |
|---|---|---|
| 0 — Vertical scale | Larger Neon compute / Vercel function memory | Sustained p95 latency growth with flat error rate |
| 1 — Read replicas | Neon read replica for analytics + heavy reads | Read p95 > 150 ms or analytics queries degrade OLTP p95 |
| 2 — Queue for AI | Trigger.dev executes non-interactive runs (Deep analysis, batch, cadences) | Concurrent streams near plan concurrency, or runs exceeding function duration limits |
| 3 — Cache layers | Upstash: shared rate-limit state, registry snapshot, prompt-fragment cache | Multi-instance rate-limit drift, or registry reads > 50 req/s |
| 4 — Org multi-tenancy | `Organization`/`Membership`, `orgId` scoping (+ optional RLS) | First team/organization customer or org-based billing |

## Key risks

| Risk | Impact | Mitigation |
|---|---|---|
| OpenRouter outage or degradation | No AI answers | Fallback chains cross-provider per tier; `ProviderAdapter` port allows direct-provider adapters; circuit breaker per provider ([model-routing.md](model-routing.md)) |
| Serverless SSE limits (duration, cold starts) | Truncated long runs | `maxDuration` explicitly configured, abort handling, queue adoption at trigger 2 |
| AI cost overrun | Margin loss | Per-request token budget, per-user daily cap with 80% warning, tiered routing to cheap models |
| Prompt injection via user content | Guardrail bypass | Phase 7+: untrusted-content fencing, instruction hierarchy, tool allow-lists, injection eval suite |
| Financial hallucination | User harm, trust loss | D9 guardrails: evidence-first answers, uncertainty language, explicit assumptions, disclaimers |
| Vendor lock-in (Vercel/Neon/AI SDK) | Migration cost | Ports and adapters (gateway, rate limiter, env); documented container alternative ([deployment-architecture.md](deployment-architecture.md)) |
| Data loss | Irrecoverable threads | Neon PITR, RPO ≤ 5 min / RTO ≤ 1 h, restore runbook ([data-architecture.md](data-architecture.md)) |

## Related docs

- [frontend-architecture.md](frontend-architecture.md) — route map, RSC/client split, streaming UI
- [backend-architecture.md](backend-architecture.md) — layering deep-dive, service catalog, API conventions
- [ai-architecture.md](ai-architecture.md) / [model-routing.md](model-routing.md) — AI pipeline and routing rules
- [security-architecture.md](security-architecture.md) / [data-architecture.md](data-architecture.md) — trust boundaries and data lifecycle
- [deployment-architecture.md](deployment-architecture.md) — environments, CI/CD, cost model
- [../04-data-model/database-design.md](../04-data-model/database-design.md) — persistence conventions
- [../01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md) — decision ledger rationale
- [../09-diagrams/system-architecture.svg](../09-diagrams/system-architecture.svg) · [../09-diagrams/ai-request-flow.svg](../09-diagrams/ai-request-flow.svg) — diagrams
