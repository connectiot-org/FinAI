# Phase 9 — Production: deploy, observe, verify, runbooks

| Field | Value |
|---|---|
| Roadmap phase | P9 — Production (deployment, observability, security, performance) |
| Depends on | P8 (green CI gates) |
| Estimated effort | M |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../03-system-architecture/deployment-architecture.md` |

## OBJECTIVE

Ship production: Vercel + Neon configured per `../03-system-architecture/deployment-architecture.md`, the final CI/CD pipeline with branch protection, observability with armed alerts, a documented production rate-limiting choice, verified security headers, a backup/DR drill, operational runbooks, and a signed pre-launch checklist.

## CONTEXT

Phase 8 made main green and gated; this phase makes production real and operable. The deployment architecture, environment matrix and connection-pooling rules are canonical in `../03-system-architecture/deployment-architecture.md`. Rate limiting follows the D1 decision rule: the in-memory implementation is acceptable for a single instance; move to Upstash Redis if the deployment is multi-instance — the `RateLimiter` interface does not change. Billing (Phase 12) and data integrations (Phase 10) stay out.

## INPUTS

- `../03-system-architecture/deployment-architecture.md` — environment matrix, pooling, maxDuration, migration policy, deployment checklist.
- `../01-context/project-context.md` — D1 (Upstash decision rule), D8 (headers, secrets), D10 (budgets to verify in production).
- Phase 8 output: CI gates, performance reports, `docs/runbooks/observability.md` stub.

## TASKS

1. Provision: Vercel project with preview and production environments; Neon production database. Runtime connects via the pooled URL (pgBouncer); migrations use the unpooled `DIRECT_URL`, exactly as the env matrix specifies.
2. Environment matrix: set production variables in Vercel encrypted environment settings — `DATABASE_URL` (pooled), `DIRECT_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, `OPENROUTER_API_KEY`, `AI_LIVE_TESTS=false`, optional `ADMIN_EMAIL`. Verify `src/server/env.ts` fails closed when any required variable is missing.
3. SSE on serverless: set `export const maxDuration` on `src/app/api/v1/chat/stream/route.ts` per `../03-system-architecture/deployment-architecture.md`; verify streaming end-to-end on the deployed URL with first-token p50 within D10 on production-like data.
4. Migrations in CD: the deploy step runs `pnpm prisma migrate deploy` against `DIRECT_URL`; adopt the expand-contract rule — destructive schema changes ship only after the expanded version has been deployed and safely consumed; document the rule in the runbook.
5. CI/CD final: `.github/workflows/deploy.yml` (or Vercel's Git integration) gated by the Phase 8 checks; branch protection on `main` — required status checks, linear history, no force pushes; PR previews enabled.
6. Observability: ship structured logs to a Vercel log drain (document the destination); arm the alert table:
   | Alert | Condition (initial) | Severity |
   |---|---|---|
   | Error rate | 5xx > 2% of requests over 5 min | page |
   | Streaming latency | p95 first byte on `/api/v1/chat/stream` > 3s | page |
   | Fallback spike | AI fallback rate > 20% of calls over 15 min | warn |
   | Cost anomaly | daily AI spend > 3x the 7-day median | warn |
   | Database | connection saturation or storage > 80% | warn |
7. Rate-limiting production choice: single instance → keep the in-memory implementation behind `RateLimiter`; if multi-instance is chosen or anticipated, implement `src/server/infra/rate-limiter/upstash.ts` (Upstash Redis) behind the same interface. Document the choice and the trigger conditions that would switch it in the runbook.
8. Security headers verification: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy verified on the production domain with a repeatable script recorded in `docs/runbooks/security-headers.md`; session cookies use the `__Secure-` prefix with the Secure flag confirmed.
9. Backup/DR: enable Neon PITR; execute and document a restore drill (restore to a branch, run the smoke suite against it); record RPO/RTO in the runbook.
10. Runbooks in `docs/runbooks/`: `incident.md` (severity ladder, first response, escalation), `rollback.md` (Vercel instant rollback plus the DB migration rollback policy), `key-rotation.md` (rotating OpenRouter/Google/Auth secrets without downtime), `observability.md` (alerts, dashboards, log queries).
11. Pre-launch checklist: execute the production checklist from `../03-system-architecture/deployment-architecture.md` — env matrix, headers, budgets, alerts, backups, rate limits, post-deploy smoke — and record sign-off in the phase status table.

## CONSTRAINTS

- No billing, no data integrations, no new product surface.
- Production keys exist only in Vercel encrypted environment settings — never in the repo, CI logs, or runbooks.
- Do not relax the Phase 8 CI gates.
- No destructive migration without the expand-contract note.

## EXPECTED OUTPUT

A production URL serving the homepage and the authenticated Workspace on real models; alerts armed with documented thresholds; backups verified by a drill; runbooks committed; the pre-launch checklist signed off in the status table.

## FILES TO CREATE OR MODIFY

- Vercel/Neon console configuration (documented in `docs/runbooks/deployment.md`)
- `.github/workflows/deploy.yml`, branch protection settings
- `src/app/api/v1/chat/stream/route.ts` (maxDuration export)
- `src/server/infra/rate-limiter/upstash.ts` (only if the multi-instance choice is made)
- `docs/runbooks/*` — incident, rollback, key-rotation, observability, security-headers, deployment, pre-launch-checklist (executed copy with sign-off)

## TEST REQUIREMENTS

- Post-deploy smoke: run the e2e suite (fixture mode) against the production URL — read-only paths plus one authenticated demo thread on a test account.
- Header assertions against the production domain; `__Secure-` cookie assertion.
- Alert drills: trigger a synthetic 5xx spike and a cost-anomaly condition; confirm the alerts fire.
- Restore drill: PITR restore plus the smoke suite against the restored branch.

## ACCEPTANCE CRITERIA

- [ ] The production deployment is green; homepage LCP < 2.5s and Workspace first-token < 2s p50 verified on production.
- [ ] Migrations run in CD via `prisma migrate deploy` against the unpooled URL; runtime uses the pooled URL.
- [ ] All five alerts are armed with documented thresholds, and two drills are recorded.
- [ ] The rate-limiting production choice is implemented or explicitly justified behind the `RateLimiter` interface.
- [ ] Security headers verified on the production domain; secrets exist only in encrypted env settings.
- [ ] The PITR restore drill is completed and documented with stated RPO/RTO.
- [ ] Runbooks are committed; the pre-launch checklist is signed.
- [ ] Phase 8 gates remain required and green on main.

## DO NOT DO

- Do not add billing or pricing logic (Phase 12).
- Do not add data integrations or the files pipeline (Phase 10).
- Do not hard-code environment-specific values in code.
- Do not disable or bypass CI checks for the production branch.
- Do not store production keys in runbooks or logs.

## NEXT STEP

Post-MVP: proceed per `../08-roadmap/implementation-roadmap.md` phases 10–12 and `../08-roadmap/future-capabilities.md` (no phase prompts exist for these in this package).
