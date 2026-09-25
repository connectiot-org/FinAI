# Backend Architecture

> Purpose: Specify the backend deep-dive — module map, API conventions and error catalog, service catalog, transactional boundaries, rate limiting, background-job posture, observability, and the validated environment configuration.

## Layering overview

The backend is layered per D1/D2: route handlers (`src/server/api`) are thin controllers; application services (`src/server/services`) orchestrate; domain logic (`src/server/domain`) is pure TypeScript; infrastructure adapters (`src/server/db`, `src/server/ai`, cache) implement ports. Zod validation runs at every boundary (HTTP body, env, provider config). The dependency direction and the full "what may import what" matrix are defined in [system-architecture.md](system-architecture.md).

## Module map

| Module | Path | Responsibility | Public interface | Depends on |
|---|---|---|---|---|
| API route handlers | `src/server/api/**` | Auth, Zod validation, delegate, error mapping | HTTP `/api/v1/*` | services, `src/lib` helpers, `env.ts` |
| Auth (Auth.js v5) | `src/server/auth.ts` | OAuth + credentials flows, JWT session, callbacks | `auth` export used by handlers + middleware | `env.ts`, db (adapter) |
| conversationService | `src/server/services/conversation*` | Thread CRUD, ownership, soft delete, title handling | `listForUser`, `getForUser`, `create`, `rename`, `softDelete` | db, domain |
| chatService | `src/server/services/chat*` | Orchestrates gateway + persistence + usage for a stream | `streamChat(input, ctx)` | ai gateway, conversationService, usageService, auditService, db |
| usageService | `src/server/services/usage*` | Metering, daily aggregates, caps, preflight | `preflight`, `recordUsage`, `getForUser` | db, config |
| auditService | `src/server/services/audit*` | Append-only audit trail | `record(event)` | db |
| userService | `src/server/services/user*` | Profile, role, preferences | `getById`, `ensureFromOAuth` | db |
| Domain | `src/server/domain/**` | Pure logic: context windowing math, cost computation, routing heuristic | pure functions/types | nothing |
| AI Gateway | `src/server/ai/gateway` | Policy, budgets, routing, prompt assembly, adapters, normalization | `complete()` / `stream()` behind `ChatCompletionPort` | providers, registry, config, env — detailed in [ai-architecture.md](ai-architecture.md) |
| DB | `src/server/db/**` | Prisma schema + singleton client | `db` | `env.ts` |
| Env | `src/server/env.ts` | Zod-validated environment access (single read point of `process.env`) | typed `env` object | nothing |
| Config | `src/config/**` | `models.config.ts`, `site.config.ts`, `features.config.ts` — data, not code (D4) | typed constants | nothing |

Naming note: the D2 layout refers to the gateway-facing orchestrator as `aiGatewayService`; the canonical implementation name is `chatService`, and the gateway itself lives in `src/server/ai/gateway` (not a service). Both names appear in review comments; this document is the authority.

## API conventions

| Convention | Rule |
|---|---|
| Versioning | All routes under `/api/v1/*`; breaking changes require `/api/v2` |
| Resource naming | Plural nouns, kebab-case segments: `conversations`, `conversations/[id]/messages`, `chat/stream` (verb allowed for the streaming action), `models`, `usage`, `health` |
| Methods | GET read, POST create/action, PATCH partial update, DELETE soft delete; no PUT in MVP |
| Auth | Session (JWT cookie) required for everything except `health` and `auth/[...nextauth]`; ownership checked in the service layer on every read/write |
| Validation | Zod schema per route at the boundary; unknown keys stripped; parse failures → `VALIDATION_FAILED` with field details |
| Errors | Uniform envelope (below); never leak stack traces or provider errors raw |
| Pagination | Cursor-based: `?limit` (default 25, max 100) + `?cursor`; response `{ data, nextCursor }`; ordering stable (`createdAt`/`updatedAt` desc + id tiebreak) |
| Idempotency | GET/PATCH/DELETE are naturally idempotent. `POST /chat/stream` accepts an optional client-generated `requestKey` (dedupe window in MVP) to make accidental double-submits safe; a formal `Idempotency-Key` store is deferred to Phase 8 and documented as reserved |

Error envelope:

```json
{
  "error": {
    "code": "MODEL_UNAVAILABLE",
    "message": "The selected model is temporarily unavailable.",
    "details": { "alternatives": ["claude-sonnet-class", "gpt-4.1-class"] },
    "requestId": "01J8ZK3P9Q2W"
  }
}
```

Error code catalog:

| Code | HTTP | Meaning | Client action |
|---|---|---|---|
| `AUTH_REQUIRED` | 401 | No/invalid session | Redirect to sign-in |
| `FORBIDDEN` | 403 | Authenticated but not owner / insufficient role | Hide or disable affordance |
| `NOT_FOUND` | 404 | Resource missing or not owned | Show not-found state |
| `VALIDATION_FAILED` | 422 | Zod boundary rejection | Field-level fix hints |
| `RATE_LIMITED` | 429 | User+IP bucket exhausted | Retry-after countdown |
| `MODEL_UNAVAILABLE` | 503 | Provider/model down after fallback attempts | Offer alternatives from `details` |
| `CONTEXT_OVERFLOW` | 413 | Thread exceeds context window policy | Suggest new thread / summarization (Phase 7) |
| `USAGE_CAP_REACHED` | 402 | Daily cost cap hit | Cap banner; reset time in `details` |
| `UPSTREAM_TIMEOUT` | 504 | Provider did not stream in time | Retry offer |
| `INTERNAL` | 500 | Unhandled error | Report `requestId` |

## Service catalog

| Service | Key operations | Policy embedded |
|---|---|---|
| `conversationService` | Create thread (title deferred to first completion), list by recency, read with messages (paginated), rename, soft delete (`deletedAt`), ownership enforcement on every access | Soft delete hides immediately; rows retained until purge (see [data-architecture.md](data-architecture.md)) |
| `chatService` | Single entry point for a chat turn: rate-limit + cap preflight → persist user message → resolve model → assemble prompt → call gateway → normalize stream → persist AIRequest + assistant message → record usage + audit | All transactional boundaries and failure ordering (below) |
| `usageService` | On completion: upsert per-user-per-day `UsageRecord` (requests, tokens, cost). `preflight(userId)` compares projected cost against `USAGE_DAILY_CAP_USD`; warning flag at 80% | Aggregation is idempotent per `(userId, day)` upsert |
| `auditService` | Append `AuditLog` rows: auth events, conversation delete, admin actions, AI request outcomes (link by requestId) | Append-only; no update/delete paths in code |
| `userService` | Ensure user exists from OAuth profile, fetch role/preferences | Roles-lite: USER/ADMIN |

## Transactional boundaries

Policy: **the assistant Message and its AIRequest are persisted together in one transaction**, at stream end.

1. User message: persisted before streaming starts (refresh-safe input).
2. Stream runs; nothing is written per chunk (DB writes are not on the hot path).
3. On `done` | `error` | abort: single transaction writes `AIRequest` (status `SUCCEEDED`/`FAILED`/`ABORTED`, latency, tokens, cost, fallback metadata) + assistant `Message` (parts array, `aiRequestId` link).
4. After commit: `usageService.recordUsage` (idempotent upsert) and `auditService.record` — non-critical, failures logged, never fail the request retroactively.
5. Crash between commit and usage upsert reconciles via the AIRequest scan in the Phase 8 nightly job (reserved; documented, not built).

## Rate limiting design

| Scope | Key | Limits (config, MVP defaults) | Notes |
|---|---|---|---|
| AI endpoints (`chat/stream`) | `user:{id}` + `ip:{addr}` | 20 req/min burst, 4 concurrent streams/user | Stricter bucket; consumes rate budget before any provider call |
| CRUD `/api/v1` | `user:{id}` | 120 req/min | Generous; protects DB |
| Auth endpoints | `ip:{addr}` | 10 req/min | Brute-force/abuse guard |

Interface (in-memory token bucket MVP; Upstash Redis implementation swaps in at Phase 9 with no call-site changes):

```ts
interface RateLimiter {
  consume(key: string, cost?: number): Promise<RateLimitResult>;
}
type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };
```

In-memory caveats are documented and accepted: per-instance state, reset on deploy, drift behind multiple instances — acceptable at MVP scale, triggers for Upstash are in [system-architecture.md](system-architecture.md).

## Background jobs

**None in MVP** (D1). Every MVP flow is request-scoped. Trigger.dev is reserved for Phase 8+; the hook points (task definitions called from service code behind a `JobsPort`) are designed but not implemented. What moves there when adopted: nightly usage reconciliation from `AIRequest`, soft-delete purge enforcement, scheduled agent runs/cadences, long Deep-analysis runs exceeding function duration.

## Observability

| Element | Spec |
|---|---|
| Logs | Structured JSON to stdout: `ts`, `level`, `requestId`, `userId?`, `route`, `event`, `durationMs`, `outcome`. No PII, no message content (D8) |
| Correlation | `requestId` generated in middleware (ULID), propagated through services, gateway, and into the `AIRequest` row and error envelope |
| AI telemetry | `AIRequest` row per model call (provider, model, latency, first-token latency, tokens, cost, status, fallbackFrom, promptVersion); `UsageRecord` daily aggregates. Dashboards are DB-backed queries (see [deployment-architecture.md](deployment-architecture.md)) |
| Health | `GET /api/v1/health` → `{ status, checks: { db, gatewayConfigured }, version }`; 200 only if DB `SELECT 1` succeeds and required env is present; public, unauthenticated, cheap |
| Tracing | Langfuse adapter interface reserved, not built (D1) |

## Config and env

Single access point: `src/server/env.ts` imports `process.env`, validates with Zod once at boot, and exports a typed object. Nothing else may read `process.env` (enforced by lint rule).

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  OPENROUTER_API_KEY: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  USAGE_DAILY_CAP_USD: z.coerce.number().positive().default(10),
  RATE_LIMIT_AI_PER_MIN: z.coerce.number().default(20),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});
```

| Variable | Consumer | Secret | Notes |
|---|---|---|---|
| `DATABASE_URL` | db (pooled/pgBouncer endpoint) | Yes | Neon pooled connection string |
| `DIRECT_URL` | migrations | Yes | Unpooled Neon endpoint for `prisma migrate` |
| `AUTH_SECRET` | Auth.js | Yes | JWT encryption; 32+ chars |
| `GOOGLE_CLIENT_ID/SECRET` | auth | Yes | OAuth credentials |
| `OPENROUTER_API_KEY` | AI adapters | Yes | Primary AI route |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` | future adapters | Yes | Optional until direct adapters ship (D4) |
| `USAGE_DAILY_CAP_USD` | usageService | No | Default cap; user-facing warning at 80% |
| `RATE_LIMIT_*` | rate limiter | No | Bucket tuning |
| `APP_URL`, `LOG_LEVEL`, `NODE_ENV` | misc | No | Base URL for callbacks; log filtering |

Client-exposed values (`NEXT_PUBLIC_APP_URL`, feature flags) are separately namespaced and never included in `env.ts` server schema. Secret handling, rotation, and forbidden patterns: [security-architecture.md](security-architecture.md).

## Related docs

- [system-architecture.md](system-architecture.md) — layering matrix and lifecycles
- [ai-architecture.md](ai-architecture.md) / [model-routing.md](model-routing.md) — gateway internals and routing
- [security-architecture.md](security-architecture.md) — authN/Z detail, secrets, headers
- [data-architecture.md](data-architecture.md) — data flows, retention, growth plan
- [../04-data-model/database-design.md](../04-data-model/database-design.md) — persistence conventions and indexes
- [../04-data-model/entities.md](../04-data-model/entities.md) — entity field specifications
- [../01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md) — decision rationale
