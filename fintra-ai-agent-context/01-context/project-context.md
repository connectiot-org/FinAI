# Fintra Project Context

> Purpose: the master context file for the entire Fintra project — any future engineer or AI coding agent loads this document first before writing a single line of code.

## Product summary

Fintra is an AI-native financial intelligence platform for finance professionals (CFOs, Finance Directors, Financial Controllers, Management Accountants, FP&A Leads, Financial Analysts, Business Owners). Its MVP core is the **Fintra Workspace** at `/agent`: a premium financial AI thread experience where a question becomes a streaming **Run** with visible steps, answers carry **Evidence**, and every output is auditable to request, model, and prompt version. Multi-model access flows through the custom **Fintra AI Gateway** with OpenRouter as the primary provider. The visual identity — warm paper, evergreen emerald, bronze accents — is inherited from the live homepage at https://fintra.space-z.ai/. This package (Phase 0) defines how the product will be built; it builds nothing.

## Glossary (canonical terms — use exactly)

| Term | Definition |
|---|---|
| **Fintra Workspace** | The agent product at `/agent` |
| **Thread** | A conversation |
| **Composer** | The input box |
| **Model Selector** | The model picker |
| **Run** | One agent/AI execution with visible steps |
| **Evidence** | Data references attached to claims |
| **Financial Context** | Injected workspace profile (entity, reporting period, currency, integrations — future) |
| **Answer modes** | Quick answer / Deep analysis |
| **Tiers** | Fast / Balanced / Reasoning / Open |
| **Personas** | CFO, Finance Director (FD), Financial Controller (FC), Management Accountant, FP&A Lead, Financial Analyst, Business Owner |

## Architecture principles (summary)

- Layered backend: API (thin route handlers) → Application services (`src/server/services`) → Domain (`src/server/domain`, pure TypeScript) → Infrastructure (`src/server/infra`). Zod validation at every boundary.
- RSC by default; client data via TanStack Query; no global state library in MVP.
- Browser → Fintra backend → Gateway → Provider. Keys never leave the server.
- Model catalog is data, not code; the UI renders from the registry only.
- Auditability and observability are schema-level concerns (`AIRequest`, `UsageRecord`, `AuditLog`), not afterthoughts.

Full detail: [System architecture](../03-system-architecture/system-architecture.md).

## Technology choices (authoritative, D1)

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router + React 19 + TypeScript (strict mode) |
| Styling | Tailwind CSS 4 + shadcn/ui + CSS-variable design tokens matching the homepage palette (D6) |
| Fonts | Geist Sans (UI), Geist Mono (all numerics/code), Playfair Display (editorial accents only), via `next/font` |
| State/data | React Server Components by default; TanStack Query for client data (threads, streaming status); no global state library in MVP |
| Backend | Next.js Route Handlers under `/api/v1/*`; layered API → services → domain → infrastructure; Zod validation at every boundary |
| Database | PostgreSQL 16 + Prisma ORM (schema-first, committed migrations); Neon managed Postgres |
| Auth | Auth.js v5 (NextAuth) — Google OAuth + credentials (argon2), JWT session cookie, middleware-protected `/agent`; roles-lite (USER/ADMIN) in MVP |
| AI layer | Custom Fintra AI Gateway (`src/server/ai/`) owning registry/routing/policy/observability; Vercel AI SDK v5 `streamText` + provider instances for protocol/stream normalization (OpenAI-compatible provider points at OpenRouter); thin `ChatCompletion` port plus `ProviderAdapter` interface as lock-in mitigation |
| Streaming | SSE via POST route handler (`/api/v1/chat/stream`); UI consumes incremental parts (steps, text deltas, usage, errors) |
| Rate limiting | In-memory token bucket in MVP → Upstash Redis in Phase 9; interface stays `RateLimiter` |
| Background jobs | None in MVP; Trigger.dev planned for Phase 8 (scheduled agent runs/cadences) — documented, not implemented |
| Hosting | Vercel (primary) + Neon Postgres; containerized Node alternative documented; single Next.js app, no monorepo tooling |
| Observability | Structured JSON logs + `AIRequest`/`UsageRecord` DB tables; Langfuse optional future adapter (interface reserved, not built) |

## UI principles (summary)

1. Warm-paper + evergreen + bronze identity from the homepage (D6 tokens); no dark mode in MVP — dark ink panels only.
2. Geist Sans for UI; Geist Mono for every financial figure (tabular); Playfair Display only for editorial accents.
3. 1px borders over shadows; 12px card radius / 8px control radius; 4px spacing grid; 150–250ms ease-out motion with reduced-motion respected.
4. Progressive disclosure on calm surfaces: Composer-first, collapsed detail, explicit states (empty → streaming → complete → error/retry → stopped).
5. The product Workspace may use a slightly cooler paper variant but must stay inside the warm-paper system; demo-staged marketing claims never leak into product UI.

Full detail: [Agent UI spec](../02-ui-ux/agent-ui-spec.md) and [Design tokens](../02-ui-ux/design-system.md).

## AI principles (summary)

- Distinguish user-provided data / computed facts / AI interpretation — visually and in the data model (D9).
- Evidence-first answers; uncertainty language policy; explicit assumptions; calculations shown step by step.
- No hallucinated figures — state missing data needs; standard "not financial advice" disclaimer policy.
- Model registry is config + seeded table; sticky model per Thread; "Auto" heuristic routes by complexity with logged, UI-surfaced fallbacks (D4).
- Every AI output traceable to request, model, and prompt version.

Full detail: [Model strategy](../05-ai/model-selection.md), [Financial AI safety](../05-ai/financial-ai-principles.md), [Prompt library](../06-prompts/README.md).

## Security requirements (summary, D8)

- API keys server-side only via Zod-validated `env.ts` (`OPENROUTER_API_KEY`, `OPENAI_API_KEY`, ...); never in client bundles, git, docs, or localStorage.
- Auth required for all `/api/v1` routes except health; ownership checks on every Thread/Message read and write.
- Rate limit AI endpoints per user + IP behind the `RateLimiter` interface.
- Audit log for auth events and AI requests; CSP and security headers; no PII in logs.
- Prompt-injection defenses land at Phase 7+: input framing, file scanning, tool allow-lists, approval gates.

Full detail: [System architecture](../03-system-architecture/system-architecture.md).

## Model strategy (summary, D4)

- OpenRouter is the primary gateway (one contract → many providers); direct OpenAI/Anthropic/Google adapters are interface-defined and built on demand later.
- Model catalog is data: `src/config/models.config.ts` + seeded `ModelCatalog` table (id, provider, family, displayName, contextWindow, maxOutput, capabilities, latencyClass, pricingTier, pricing per 1M tokens, availability, releaseDate, notes). UI never hard-codes model names.
- Initial tiers: **Fast** (gpt-4o-mini / gemini-flash / claude-haiku class — illustrative IDs; config is the source of truth), **Balanced** (gpt-4.1 / claude-sonnet / gemini-flash-pro class), **Reasoning** (o-series / claude-opus / deepseek-r1 / gemini-pro class), **Open & value** (llama / qwen / deepseek-v3 class).
- Routing: user-selected model is sticky per conversation; Auto mode is a complexity→tier heuristic with same-tier-then-adjacent-tier, cross-provider-preferred fallback; every fallback is logged and surfaced in the UI.

Full detail: [Model strategy](../05-ai/model-selection.md).

## Database strategy (summary, D3)

- Implement now: `User`, `Account`, `Session`, `VerificationToken` (Auth.js standard), `Conversation`, `Message` (jsonb `parts` array for text/step/tool/evidence parts), `ModelCatalog` (seeded, mirrors config), `AIRequest` (provider, model, latency, tokens, cost, status), `UsageRecord` (per-user aggregation), `AuditLog`.
- Defer (documented only): `Organization`, `Membership`, `Attachment`, `Prompt` (versioned rows), `AgentRun`, `ToolCall`, `ReportArtifact`, `BillingRecord`.
- Conventions: `cuid` uuid ids; `createdAt`/`updatedAt`; soft delete on Conversation only; enum-backed statuses; indexes on every FK and `(userId, updatedAt)` on Conversation.

Full detail: [Database design](../04-data-model/database-design.md).

## Canonical directory layout (D2 — reference exactly)

```
src/app/                     (routes: page.tsx home, agent/, sign-in, api/v1/*)
src/components/ui/           (primitives, shadcn-based)
src/components/agent/        (workspace: Thread, Composer, ModelSelector, RunSteps, EvidencePanel…)
src/components/marketing/    (homepage sections)
src/server/api/              (route handlers, thin controllers)
src/server/services/         (conversationService, aiGatewayService, usageService, auditService)
src/server/domain/           (pure domain logic/types)
src/server/ai/               (gateway/, providers/, registry/, prompts/ assembly)
src/server/db/               (prisma schema + client)
src/server/env.ts            (Zod-validated env, single access point)
src/config/                  (models.config.ts, site.config.ts, features.config.ts)
prompts/                     (versioned prompt library: system/, financial/, analysis/, reporting/, forecasting/, error-detection/, agent/, model-specific/)
```

## Current implementation status (honest)

- The live homepage exists at https://fintra.space-z.ai/ (Next.js App Router, Turbopack) and is fully audited in [existing-homepage-analysis](./existing-homepage-analysis.md).
- The Fintra Workspace at `/agent` is **not built**. The homepage CTA currently promises a demo with no real destination.
- Nothing else exists: no auth flow, no API routes, no database, no AI gateway, no prompt library.
- Marketing copy includes demo-staged claims (fictional Series A announcement, simulated statistics, fictional customer logos) that must never leak into product UI and must be resolved during Phase 1 polish.

| Phase | Scope | Status |
|---|---|---|
| P0 | This documentation package (00–09) | Done |
| P1 | Homepage polish (real CTAs → `/agent`) | Completed |
| P2 | Agent UI shell (mocked data, no backend) | Completed |
| P3 | Backend foundation (Prisma, services, health, env) | Completed |
| P4 | Authentication (Auth.js, protected `/agent`) | Completed |
| P5 | Model layer (registry, gateway, OpenRouter adapter, streaming API) | Completed |
| P6 | Conversations and chat (persistence, streaming wire-up, history, retry/stop) | Completed |
| P7 | Financial AI (prompt library, guardrails, context, structured outputs) | Completed |
| P8 | Testing hardening + CI gates (testing continuous from P1) | Completed |
| P9 | Production (deployment, observability, security, performance) | Completed |
| P10–P12 | Files and data; advanced agents/tools; billing and scale | Post-MVP, documented in [future capabilities](../08-roadmap/future-capabilities.md) |

## Outstanding decisions

These remain open and are tracked here so no coding agent invents an answer silently:

1. **Exact model IDs and pricing at build time** — the tier structure is fixed; concrete IDs live in `models.config.ts` and must be refreshed when implementation starts (docs show illustrative IDs only).
2. **Org RBAC timing** — roles-lite (USER/ADMIN) for MVP; decide whether `Organization`/`Membership` arrive at P12 or earlier based on pilot demand.
3. **Langfuse adoption** — interface reserved; adopt if AI request volume makes DB-based observability insufficient.
4. **Dark mode** — excluded from MVP by D6; revisit only after the Workspace proves itself in the warm-paper system.
5. **Homepage demo-staged claims** — when and how the fictional Series A bar, simulated statistics, and fictional logos are removed or reframed during Phase 1.
6. **Pricing-to-usage mapping** — homepage pricing tiers (Starter/Growth/Enterprise) need a concrete metering design before P12.
7. **Provider data-retention policy** — whether zero-retention routing is required for any tier via OpenRouter settings.
8. **Direct provider adapters** — build only when OpenRouter demonstrably blocks a need (ADR-005).
9. **Auto-mode heuristic tuning** — complexity signals (thread length, mode, question type) to be calibrated against real usage at P6+.
10. **CTA wording** — whether "Open the live demo" survives once a real product exists, given the honesty rule (principle 12).

## Related docs

- [Existing homepage analysis](./existing-homepage-analysis.md) — the visual and copy source of truth.
- [Competitor reference](./competitor-reference.md) — Perplexity patterns and the finance-AI landscape.
- [Assumptions and decisions](./assumptions-and-decisions.md) — ADR-001 through ADR-016.
- [Agent UI spec](../02-ui-ux/agent-ui-spec.md) — the Workspace made concrete.
- [System architecture](../03-system-architecture/system-architecture.md) — layers, gateway, streaming.
- [Entities](../04-data-model/entities.md) — entities and conventions.
- [Roadmap](../08-roadmap/implementation-roadmap.md) — phase definitions and prompt-file mapping.
