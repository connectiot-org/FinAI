# Phase 3 — Backend foundation: data layer, services, API conventions

| Field | Value |
|---|---|
| Roadmap phase | P3 — Backend foundation (Prisma, services, health, env) |
| Depends on | P2 (parallelizable with it — UI and backend share no code yet) |
| Estimated effort | M |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../04-data-model/entities.md` |

## OBJECTIVE

Establish the backend foundation: the Prisma data layer with MVP entities only, the application-service skeleton, API conventions (error envelope, request IDs, Zod validation), a health endpoint, structured logging with requestId, and the rate limiter interface with an in-memory implementation — with zero AI functionality and zero authentication.

## CONTEXT

Phase 2 defined the client contract; this phase builds the server it will eventually call. The data model is canonical in `../04-data-model/entities.md`; the directory layout in D2. This phase deliberately excludes auth (session helpers are stubbed with a seeded dev user) and AI (Phase 5). Getting the conventions right here — Zod at boundaries, a single error envelope, requestId logging, ownership checks on every read and write — is what keeps Phases 4–6 small.

One structural clarification (consistent with D2): Next.js App Router requires `route.ts` files under `src/app/api/v1/**`; those files stay thin controllers that only parse, validate and delegate. Controller logic lives in `src/server/api/*.controller.ts`, application logic in `src/server/services/`, exactly as D2's layering prescribes.

## INPUTS

- `../04-data-model/entities.md` — MVP entities, fields, enums, indexes, soft-delete convention.
- `../01-context/project-context.md` — D2 layout, D3 entity list and conventions, D8 security baseline.
- Phase 2 output: `src/lib/sse-types.ts` (unused this phase), `src/config/models.config.ts` (needed for seeding).

## TASKS

1. Tooling: add scripts to `package.json` — `typecheck`, `lint`, `test`, `db:migrate` (`prisma migrate dev`), `db:seed` (`prisma db seed`). Local Postgres 16 via `DATABASE_URL` in `.env.local` (gitignored; `.env.example` committed with every variable documented).
2. Prisma schema `prisma/schema.prisma` with MVP entities only: `User`, `Account`, `Session`, `VerificationToken` (Auth.js standard four), `Conversation`, `Message` (jsonb `parts` array for text/step/tool/evidence parts), `ModelCatalog` (seeded, mirrors config), `AIRequest` (observability: provider, model, latency, tokens, cost, status), `UsageRecord` (per-user aggregation), `AuditLog`. Conventions per D3: `cuid` ids, `createdAt`/`updatedAt`, soft delete (`deletedAt`) only on `Conversation`, enum-backed statuses, index on every foreign key plus `@@index([userId, updatedAt])` on `Conversation`.
3. Migrations: `pnpm prisma migrate dev --name init_mvp`; commit the generated SQL.
4. DB client: `src/server/db/client.ts` — singleton `PrismaClient` with a dev hot-reload guard.
5. Env: `src/server/env.ts` — the Zod-validated single access point: `DATABASE_URL`, `DIRECT_URL` (unpooled Neon URL for migrations), `APP_URL`, `NODE_ENV`. Import-time failure with a readable message on missing or invalid values. No other file may read `process.env` directly.
6. Error envelope and codes: `src/server/api/errors.ts` — codes `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `RATE_LIMITED` (429), `INTERNAL` (500); `src/server/api/envelope.ts` — `{ error: { code, message, requestId } }` and a matching success envelope; `src/server/api/request-context.ts` — requestId generation and propagation into logs.
7. Controller pattern: `src/app/api/v1/conversations/route.ts` (GET list, POST create) and `src/app/api/v1/conversations/[id]/route.ts` (GET, PATCH rename, DELETE soft-delete) delegating to `src/server/api/conversations.controller.ts` → `src/server/services/conversation-service.ts`.
8. conversationService skeleton `src/server/services/conversation-service.ts`: list (non-deleted, `userId` scoped), create, get, rename, soft-delete, append message, list messages. Every method takes `userId` and enforces ownership; domain types in `src/server/domain/conversation.ts`. AI-related behaviour is out of scope.
9. Session stub: `src/server/auth/session.ts` — `getCurrentUser()` returns the seeded dev user; a code comment marks it as replaced by Phase 4.
10. Health endpoint: `src/app/api/v1/health/route.ts` — unauthenticated, uncached, returns `{ status: "ok", db: "ok" | "error", requestId }` after a `SELECT 1`.
11. Logging: `src/server/infra/logger.ts` — structured JSON (level, message, requestId, userId?, route, durationMs); no PII per D8.
12. Rate limiter: `src/server/infra/rate-limiter.ts` — the `RateLimiter` interface (`consume(key, { limit, windowMs })` → `{ allowed, remaining, resetAt }`) plus an in-memory token-bucket implementation. Nothing rate-limited yet beyond the interface being importable and tested.
13. Seed `prisma/seed.ts`: `ModelCatalog` rows generated from `src/config/models.config.ts` plus one dev admin user; `pnpm prisma db seed`; the seed is idempotent (upsert semantics).

## CONSTRAINTS

- MVP entities only. Do NOT create `Organization`, `Membership`, `Attachment`, `Prompt`, `AgentRun`, `ToolCall`, `ReportArtifact`, `BillingRecord` — documented deferrals per D3.
- No AI calls, no provider SDKs, no `OPENROUTER_API_KEY` handling yet (Phase 5).
- No auth middleware; the dev-user stub is the only session mechanism this phase (Phase 4).
- Money and token columns use `Decimal`, never float; all timestamps UTC.

## EXPECTED OUTPUT

Migrations applied to a clean local Postgres; services passing integration tests; `/api/v1/health` green; a deliberately failed request demonstrating the canonical error envelope with requestId; seed populating `ModelCatalog` and the dev user; `pnpm prisma migrate dev` rerunnable from zero.

## FILES TO CREATE OR MODIFY

- `prisma/schema.prisma`, `prisma/migrations/*`, `prisma/seed.ts`
- `src/server/db/client.ts`, `src/server/env.ts`
- `src/server/api/errors.ts`, `src/server/api/envelope.ts`, `src/server/api/request-context.ts`, `src/server/api/conversations.controller.ts`
- `src/server/services/conversation-service.ts`, `src/server/domain/conversation.ts`
- `src/server/auth/session.ts` (stub)
- `src/server/infra/logger.ts`, `src/server/infra/rate-limiter.ts`
- `src/app/api/v1/health/route.ts`, `src/app/api/v1/conversations/route.ts`, `src/app/api/v1/conversations/[id]/route.ts`
- `package.json` scripts, `.env.example`

## TEST REQUIREMENTS

- Integration tests (Vitest against a test database; setup runs `prisma migrate deploy`): conversation CRUD lifecycle; ownership — user B receives 404 reading user A's thread and 403 writing to it; soft delete hides from list while the row persists; `ModelCatalog` seed matches `models.config.ts` ids and count.
- Env validation: missing `DATABASE_URL` throws at import; an invalid URL fails with a readable message.
- Envelope: a validation failure returns 400 with `VALIDATION_ERROR` and a requestId; unknown `/api/v1` routes return the JSON envelope, not an HTML error page.

## ACCEPTANCE CRITERIA

- [ ] `pnpm prisma migrate dev` applies cleanly on an empty database; the schema matches `../04-data-model/entities.md` with all D3 conventions.
- [ ] All ten MVP entities exist; none of the eight deferred entities exist.
- [ ] conversationService enforces ownership on every read and write, proven by the 403/404 test matrix.
- [ ] `/api/v1/health` returns ok with a DB ping and stays public; failures return the canonical envelope with requestId.
- [ ] All `process.env` access lives in `src/server/env.ts` (grep-verifiable).
- [ ] The seed is idempotent; after `pnpm prisma db seed` the dev user and full `ModelCatalog` exist.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` clean; no AI or auth code present.

## DO NOT DO

- Do not implement AI calls or the gateway (Phase 5).
- Do not implement real authentication or middleware (Phase 4).
- Do not add org entities, RBAC, or team features (post-MVP).
- Do not wire the Phase 2 UI to these endpoints (Phase 6) — service and route tests only.
- Do not add background jobs or caching (documented future infra only).

## NEXT STEP

Load `phase-04-authentication.md`.
