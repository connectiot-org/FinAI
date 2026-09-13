# Deployment Architecture

> Purpose: Specify how Fintra is built, deployed, and operated — environments with database strategy, the Vercel + Neon primary path with SSE constraints, CI/CD pipeline and migration gating, production observability and alerts, rollback, the containerized alternative, the cost model, and the pre-launch checklist.

Deployment topology is diagrammed in [09-diagrams/deployment-architecture.svg](../09-diagrams/deployment-architecture.svg).

## Environments

| Environment | Trigger | Env vars / secrets | Database strategy | Data policy |
|---|---|---|---|---|
| Local dev | Developer machine | `.env.local` (gitignored; `.env.example` documents names) | Local Postgres via docker, or a personal Neon branch | Seed script data only; fake provider keys → no real AI spend by default |
| Preview | Every PR (Vercel preview deploy) | Vercel preview env (shared provider keys capped; DB URL injected per PR) | **Neon branch database per PR** — schema-migrated on deploy, deleted on merge/close | Seeds + anonymized fixtures; never a copy of production |
| Production | Merge to `main` | Vercel production env, per-environment values | Neon main project (pooled endpoint + `DIRECT_URL` for migrations) | Real data; PITR enabled; migration gate before rollout |

Branch databases give every PR an isolated, disposable Postgres — migrations are proven on a real engine before production.

## Primary path: Vercel + Neon

**Build**: Next.js 16 build on Vercel; static assets on the edge network; middleware (auth gate, CSP nonce, headers) runs at the edge.

**Runtime split**: pages and light handlers run in the default Node serverless runtime; the SSE endpoint (`/api/v1/chat/stream`) must be explicit about its constraints:

```ts
export const runtime = "nodejs";
export const maxDuration = 60; // seconds; Pro allows up to 300 — ceiling depends on plan
```

Serverless function duration and streaming constraints, documented as operating rules:

- SSE streaming is supported on the Node runtime, but the function **must** set `maxDuration`; the default (seconds) will truncate long answers.
- Abort propagation: client disconnect surfaces via `request.signal`; the handler must persist `ABORTED` state rather than run to the wall clock.
- Keep total stream time bounded by the tier output caps ([model-routing.md](model-routing.md)); runs that cannot fit (long Deep analysis) are the trigger for the queued path (Phase 8+ Trigger.dev), not for raising `maxDuration` unboundedly.
- Cold starts add first-byte latency; budget headroom exists in the < 2 s first-token target (D10) and is monitored.

**Neon connection budget**: functions connect through the Neon **pooled endpoint** (pgBouncer, transaction mode); Prisma migrations use `DIRECT_URL` (unpooled). The function pool size is small (e.g. `connection_limit=5` per instance) because serverless instances multiply: expected concurrent instances × per-instance pool must stay under the Neon connection ceiling (e.g. 100 direct connections on typical plans). Monitor via Neon dashboard; alert at 80% utilization.

## CI/CD (GitHub Actions)

Pipeline stages, all required before merge:

| Stage | Content | Gate |
|---|---|---|
| Install | Pinned lockfile install | Fails on lockfile drift |
| Typecheck | `tsc --noEmit` (strict) | Zero errors |
| Lint | ESLint + secret-scan grep gate | Zero findings |
| Unit | Service/domain/adapter tests | Green |
| Build | `next build` on Node 22 | Zero errors; bundle budgets checked |
| E2E | Playwright against the **preview deploy** (auth, thread create, stream smoke with a mocked provider) | Green |
| Migration gate | `prisma migrate deploy` dry-run against the preview branch DB; destructive-change detection | No unreviewed destructive steps |

Branch protections: PR + one review, required status checks, linear history, no force-push to `main`. **Release = merge to `main` → automatic Vercel production deploy**; git tags are optional bookkeeping, not a release step.

## Migrations in CD

Order of operations for a production release: 1) CI green on `main`; 2) `prisma migrate deploy` runs against production **before** the new code serves traffic; 3) Vercel promotes the deployment. The cardinal rule is **backward compatibility**: every migration must leave the previous release functional (expand-contract, [data-architecture.md](data-architecture.md)), because during the rollout window old and new function instances run concurrently. Destructive steps are always deferred to a later, standalone release.

## Observability in production

| Element | Mechanism |
|---|---|
| Structured logs | JSON to stdout → Vercel drains (external sink configurable later); `requestId` correlation everywhere |
| AI telemetry | `AIRequest`/`UsageRecord` tables are the source of truth; DB-backed SQL views power dashboards (requests, cost/day, latency percentiles, fallback rate, error codes) |
| Uptime | External checker on `GET /api/v1/health` every 60 s (DB + gateway-config checks) |
| Runtime metrics | Vercel function duration/error dashboards; Neon connection + storage dashboards |

Alert rules (paged or Slack, tuned in Phase 9):

| Alert | Condition | First response |
|---|---|---|
| Error rate | 5xx > 2% over 5 min | Check logs by `requestId`, recent deploys, provider status |
| Stream first-byte latency | p95 > 2 s over 15 min | Cold starts vs provider latency; check circuit breakers |
| Fallback spike | Fallback rate > 10% of AI requests / 15 min | Provider degradation; consider registry availability flip |
| Usage anomaly | Daily AI spend > 3× trailing 7-day mean | Inspect top users, verify caps, possible abuse |
| DB connections | Pool utilization > 80% | Scale Neon endpoint / reduce function concurrency |
| Uptime | `/api/v1/health` failing 2 consecutive checks | Rollback if deploy-correlated; DR runbook if DB |

## Secrets and rotation

Secrets live only in Vercel env config, scoped per environment (local `.env.local` for development), injected at runtime — never in the repo or bundle. Rotation follows the runbook in [security-architecture.md](security-architecture.md); provider key rotation is zero-downtime (update env → redeploy → revoke old), `AUTH_SECRET` rotation invalidates sessions.

## Rollback strategy

| Layer | Mechanism | Policy |
|---|---|---|
| Application | Instant Vercel rollback to the previous deployment | First response for any deploy-correlated regression; minutes, not hours |
| Database | No automatic down-migrations | Migrations are forward-only; rollback relies on backward-compatible (expand-contract) schemas so the old app runs on the new schema; a truly destructive migration requires a documented, rehearsed forward-fix or PITR |
| Data restore | Neon PITR per the DR runbook ([data-architecture.md](data-architecture.md)) | For logical corruption; RPO ≤ 5 min, RTO ≤ 1 h |

## Alternative deployment: containerized Node

A documented fallback path (not built): Docker image of the Next.js standalone output on Node 22, deployed to Railway/Fly behind a reverse proxy, with Postgres either on Neon or self-hosted.

| Choose this when | Rationale |
|---|---|
| Data residency / regional constraints | Fixed region deployment, dedicated hosts |
| Long-running SSE without function time limits | Own process runtime, no `maxDuration` ceiling |
| Cost at sustained very high scale | Flat containers beat per-invocation pricing at high constant load |

Trade-offs accepted: you own TLS, scaling, health checks, and deploy orchestration that Vercel provides; the app stays portable because secrets flow through `env.ts` and infrastructure is behind ports (rate limiter, jobs, db).

## Cost model (illustrative)

Assumptions per D4 tiers: active user ≈ 20 AI requests/day × 22 days = 440 req/month; per request ≈ 2k prompt + 800 completion tokens; tier mix 70% Fast (~$0.0015), 25% Balanced (~$0.0104), 5% Reasoning (~$0.05) → blended ≈ **$0.0062/request ≈ $2.7 AI cost per active user-month**. Vercel/Neon list prices are indicative.

| Users (active/mo) | AI tokens | Vercel | Neon | Total ≈ |
|---|---|---|---|---|
| 100 | 44k requests → ~$270 | Pro $20 | ~$25–69 | ~$315–360 |
| 1,000 | 440k requests → ~$2,700 | Pro/Enterprise ~$20–100 (+usage) | ~$100–300 | ~$2,800–3,100 |
| 10,000 | 4.4M requests → ~$27,000 | Enterprise ~$500–1,500 | ~$1,000–3,000 (incl. replica) | ~$28,500–31,500 |

AI spend dominates by design — which is why caps, tiered routing, and usage dashboards are first-class architecture, not afterthoughts.

## Pre-launch checklist

| Item | Verification |
|---|---|
| Env vars complete per environment | `env.ts` boots fail-fast; health endpoint green |
| Migrations applied + seed run | `ModelCatalog` populated; admin user seeded |
| Branch DB wiring | Preview PR shows isolated DB; cleanup on close |
| Rate limits + daily cap configured | `RATE_LIMIT_*`, `USAGE_DAILY_CAP_USD` reviewed |
| Security headers + CSP verified | Header test pass ([security-architecture.md](security-architecture.md)) |
| Secrets scanned | CI secret gate clean; no keys in client bundle |
| Backups + PITR enabled | Restore rehearsal checklist executed once |
| Alerts wired | Error rate, latency, fallback spike, usage anomaly, connections, uptime |
| Domain + TLS | Custom domain, HSTS preload submission |
| Legal pages | Privacy/terms reachable from marketing shell |

## Related docs

- [system-architecture.md](system-architecture.md) — containers and scalability triggers
- [backend-architecture.md](backend-architecture.md) — health endpoint, env schema, rate limits
- [data-architecture.md](data-architecture.md) — migration discipline, backup/DR runbook
- [security-architecture.md](security-architecture.md) — secrets, headers, incident response
- [model-routing.md](model-routing.md) — cost controls feeding the cost model
- [../09-diagrams/deployment-architecture.svg](../09-diagrams/deployment-architecture.svg) — topology diagram
