# Frontend Architecture

> Purpose: Specify the Next.js App Router frontend — route map, RSC/client component split, data fetching, SSE streaming UI wiring, error UX, middleware, environment exposure rules, and performance engineering for the Fintra Workspace.

## Rendering strategy overview

The frontend is a single Next.js 16 App Router application (React 19, TypeScript strict). React Server Components are the default: every page renders on the server, and client components are islands added only where interactivity requires them (streaming thread canvas, Composer, Model Selector). There is no global state library; server state lives in RSC and TanStack Query, UI state stays local to components. Visual language follows D6 design tokens (warm paper, evergreen, bronze; Geist Sans for UI, Geist Mono for every financial figure, Playfair Display for editorial accents only).

## Route map

| Route | Kind | Rendering | Auth | Notes |
|---|---|---|---|---|
| `/` | Page | Static (prerendered) | Public | Marketing homepage; CTAs deep-link to `/agent` |
| `/agent` | Page | Dynamic RSC (SSR) | Required | Fintra Workspace shell; composer-first empty state; thread sidebar |
| `/agent/c/[conversationId]` | Page | Dynamic RSC (SSR) | Required + ownership | Thread view; server renders history, client island owns streaming |
| `/sign-in` | Page | Static shell + client form | Public | Google OAuth + credentials; redirects to `next` param |
| `POST /api/v1/auth/[...nextauth]` | Handler | Dynamic (Node) | Public | Auth.js v5 sign-in/callback/sign-out |
| `POST /api/v1/chat/stream` | Handler | Dynamic, SSE | Required | Streaming chat endpoint; `maxDuration` configured |
| `GET/POST /api/v1/conversations` | Handler | Dynamic | Required | Thread list (cursor pagination) / create |
| `GET/PATCH/DELETE /api/v1/conversations/[id]` | Handler | Dynamic | Required + ownership | Read, rename, soft delete |
| `GET /api/v1/conversations/[id]/messages` | Handler | Dynamic | Required + ownership | Paginated history for hydration/recovery |
| `GET /api/v1/models` | Handler | Dynamic, cached | Required | Registry snapshot for Model Selector; never hard-coded in UI (D4) |
| `GET /api/v1/usage` | Handler | Dynamic | Required | Per-user usage totals, daily cap, 80% warning flag |
| `GET /api/v1/health` | Handler | Dynamic | Public | Liveness + dependency checks |

## RSC vs client component split

Policy: **server by default; client only for interactivity.** A component becomes a client component only if it needs state that changes per keystroke, event listeners on streaming data, or browser APIs.

| Area | Components | Type | Rationale |
|---|---|---|---|
| Marketing | All homepage sections | Server | Zero interactivity beyond CSS; smallest JS |
| Workspace shell | `AgentShell`, `ThreadSidebar` (static render), layout chrome | Server | Data fetched via services at request time |
| Thread list (live) | `ThreadListClient` (wraps server-fetched initial data) | Client | Optimistic rename/delete/new-thread updates via TanStack Query |
| Composer | `Composer`, `ComposerQuickActions` | Client | Textarea state, submit, abort, suggested prompts |
| Thread canvas | `ThreadCanvas`, `RunSteps`, `MessageBubble`, `StreamFooter` | Client | Incremental SSE part rendering |
| Model Selector | `ModelSelector`, `ModelOption` | Client | Popover grouped by provider; capability/latency metadata from registry |
| Evidence panel | `EvidencePanel` | Client | Expand/collapse per claim; future integration refs |
| Primitives | `src/components/ui/**` (shadcn-based) | Mixed | Interactive primitives carry `"use client"` at the leaf |

## Data fetching

**Server components read services directly** (documented exception in [system-architecture.md](system-architecture.md) layering rules): `/agent` pages call `conversationService` and the registry snapshot at request time — no HTTP hop for the initial render.

**Mutations and streaming use route handlers.** Rationale: the chat endpoint must stream SSE from a `POST`, which server actions do not support; and route handlers keep a single, testable API surface (`/api/v1`) that both the web client and future clients consume. Server actions are reserved for low-stakes mutations (rename thread) if they reduce friction later — the default remains route handlers.

**TanStack Query owns client server-state**: thread list cache (`['conversations', cursor]`), streaming status, models snapshot, usage. Invalidation rules: thread list refetches on thread create/rename/delete and on first message of a new thread (title appears); usage refetches on stream `done`. There is no Redux/Zustand/global store; component-local state covers the rest.

## Streaming UI wiring

`useChatStream` is the single consumption hook for `/api/v1/chat/stream` (spec for the backend half: [ai-architecture.md](ai-architecture.md)).

| Concern | Spec |
|---|---|
| Transport | `fetch(POST)` with `ReadableStream` reader + SSE parser — not `EventSource`, which cannot POST or send headers |
| State machine | `idle → streaming → complete \| error \| aborted` (explicit states everywhere; error offers retry with same request) |
| Part rendering | Unified chunks (`step`, `text-delta`, `usage`, `error`, `done`) append incrementally: steps render in `RunSteps` as they arrive, text deltas buffer into the active markdown block, `usage` populates the stream footer (model, latency, tokens), `done` finalizes |
| Optimistic user message | User message renders immediately; reconciled with the persisted row via `done` payload |
| Abort | `AbortController` per request; Stop button aborts; `request.signal` propagates so the server persists an `ABORTED` request and partial answer |
| Recovery | On reload mid-thread, history comes from the RSC render; an `error` with `retryable: true` offers resend, guarded against duplicate user messages |
| Mode switch | Model Selector can change mid-thread; next request uses the new model (sticky per conversation, D4) |

## Error boundaries and error UX routing

| Layer | Mechanism | Behavior |
|---|---|---|
| Route segment | `error.tsx` per `/agent` segment | Catch-all render failure: calm paper card, retry, link home; no stack traces in UI |
| Thread canvas | React error boundary around `ThreadCanvas` | A render error in one thread cannot blank the workspace |
| API errors | Uniform envelope `{error:{code,message,details,requestId}}` mapped by a shared client helper | `AUTH_REQUIRED` → redirect to sign-in; `RATE_LIMITED` → inline notice with retry-after; `MODEL_UNAVAILABLE` → offer fallback model from `details.alternatives`; `USAGE_CAP_REACHED` → cap banner; `VALIDATION_FAILED` → field-level composer hints; `INTERNAL` → toast with `requestId` for support |
| Global | `global-error.tsx` + root `not-found.tsx` | Last-resort screens consistent with D6 tokens |

## Middleware

Edge middleware runs on every matched request:

1. **Auth gate**: verify JWT session cookie (Auth.js v5 compatible edge check) for `/agent/*`; redirect unauthenticated users to `/sign-in?next=<path>`. API routes do their own session check (handlers must not rely on middleware alone).
2. **Security headers**: CSP with per-request nonce, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options: nosniff` (full header spec: [security-architecture.md](security-architecture.md)).
3. **requestId**: generate/propagate an ID consumed by logs and the error envelope.

Matcher excludes static assets and `_next/static`. Middleware stays lightweight; no database access.

## Environment exposure rules

- `NEXT_PUBLIC_*` is allowed only for non-secrets: `NEXT_PUBLIC_APP_URL`, feature flags (`NEXT_PUBLIC_FEATURE_*`). Anything public is assumed world-readable.
- All AI provider keys, database URLs, and auth secrets are **server-only** and read exclusively through `src/server/env.ts` (Zod-validated, per D8). Client code has no import path to them.
- Enforcement: ESLint `no-restricted-imports` blocks `src/server/**` imports from client components; CI greps client-reachable code for provider key names (gates detailed in [security-architecture.md](security-architecture.md)).
- No tokens or secrets in `localStorage`/`sessionStorage`; session lives in the httpOnly cookie only.

## Performance engineering

| Lever | Policy |
|---|---|
| RSC payload | `/agent` shell target ≤ 100 KB compressed; thread history paginated (25 messages/page) so payload stays bounded |
| Client JS | Route-level code splitting is automatic; heavy deps (markdown/math renderer, syntax highlighting) dynamically imported inside the streaming island only |
| Fonts | `next/font` with Geist Sans (UI), Geist Mono (all numerics, tabular), Playfair Display (editorial accents, subset); self-hosted, `font-display: swap`, no layout shift |
| Images | `next/image` with explicit dimensions; marketing art pre-optimized; no unbounded remote images |
| Streaming perception | Composer-first empty state; steps visible during work; first-token budget < 2s p50 |
| Optimistic UI | Thread create/rename/delete reflect instantly; TanStack Query rollback on failure |

Budgets (D10) enforced in CI where measurable:

| Metric | Budget |
|---|---|
| Homepage LCP | < 2.5 s |
| Homepage INP | < 200 ms |
| Workspace server first byte | < 1 s |
| First streamed token (p50) | < 2 s |
| Thread list optimistic interaction | < 100 ms |
| `/agent` client JS (target set by this document) | ≤ 200 KB compressed |

## Folder structure (per D2)

```
src/app/                      route tree: page.tsx (home), agent/, sign-in/, api/v1/*
src/app/agent/c/[conversationId]/   thread route segment
src/components/ui/            shadcn-based primitives (button, dialog, popover…)
src/components/agent/         Thread, Composer, ModelSelector, RunSteps, EvidencePanel, ThreadList
src/components/marketing/     homepage sections
src/lib/                      api client helpers, shared types, formatting (money/percent in Geist Mono)
```

Feature-first inside `src/components/agent`: each component folder owns its tests and co-located helpers; cross-feature reuse must graduate to `src/components/ui` or `src/lib` rather than cross-importing features.

## Related docs

- [system-architecture.md](system-architecture.md) — containers, layering matrix, request lifecycles
- [backend-architecture.md](backend-architecture.md) — API conventions, error catalog, rate limits
- [ai-architecture.md](ai-architecture.md) — stream chunk contract, prompt layers
- [model-routing.md](model-routing.md) — sticky model selection, Auto mode
- [security-architecture.md](security-architecture.md) — headers, CSP nonce, env rules
- [../04-data-model/entities.md](../04-data-model/entities.md) — persisted shapes behind thread views
- [../01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md) — stack rationale
