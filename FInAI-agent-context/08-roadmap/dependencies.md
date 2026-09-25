# Dependencies — Services, Environment, Build Order, Risks

Everything the Fintra MVP needs from the outside world, plus the internal build-order graph and the external risks with mitigations. Phase references follow `implementation-roadmap.md`; environment variables are validated in `src/server/env.ts` per D8.

## External services and accounts

| Service / account | Needed for | Introduced in phase | Notes |
|---|---|---|---|
| OpenRouter account + API key | Primary AI provider (one contract → many models) | P5 | Per-user credit balance on OpenRouter is recommended; key lives in env only |
| OpenAI / Anthropic / Google API keys (optional) | Direct provider adapters | Post-MVP (interface reserved) | The `ProviderAdapter` port allows them without redesign; OpenRouter covers the MVP |
| Neon Postgres (production) + local Postgres 16 (dev/test) | Database, PITR backup | P3 (local), P9 (production) | Pooled URL for runtime, unpooled `DIRECT_URL` for migrations |
| Vercel | Hosting, previews, log drains | P9 (previews useful from P2) | Single Next.js app; SSE needs `maxDuration` configuration |
| Google OAuth credentials (client ID + secret) | Sign-in with Google | P4 | Redirect URI = `<APP_URL>/api/auth/callback/google` |
| Trigger.dev account | Scheduled agent runs / cadences | P11 | Documented in D1 as planned-not-built for the MVP |
| Upstash Redis | Distributed rate limiting (multi-instance) | P9, optional | Only if the multi-instance choice is made; the `RateLimiter` interface hides it |
| Langfuse (optional) | AI tracing/observability adapter | Post-MVP, optional | Interface reserved in D1; `AIRequest`/`UsageRecord` cover MVP observability |
| gitleaks / Playwright / Lighthouse CI | CI gates | P8 | Open-source; no accounts beyond GitHub Actions |

## Environment variables (with phase-introduced column)

| Variable | Phase introduced | Purpose |
|---|---|---|
| `DATABASE_URL` | P3 | Prisma runtime connection (pooled URL in production) |
| `DIRECT_URL` | P3 | Unpooled connection for migrations |
| `APP_URL` | P3 | Absolute base URL for callbacks and links |
| `NODE_ENV` | P3 | Build/runtime mode |
| `AUTH_SECRET` | P4 | Auth.js v5 JWT signing |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | P4 | Google OAuth |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | P4 | Seeded admin (development only) |
| `OPENROUTER_API_KEY` | P5 | Primary AI provider key |
| `AI_LIVE_TESTS` | P5 | Gate for live-model tests (default `false`) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | P9, optional | Distributed `RateLimiter` implementation |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / Google AI key | Post-MVP | Direct adapters (port already defined) |
| `LANGFUSE_*` | Post-MVP, optional | Tracing adapter |

Rules: every variable is Zod-validated in `src/server/env.ts` (fail closed at import); `.env.example` documents all of them; no key material reaches client bundles, git, docs, or logs (D8).

## Internal build-order dependencies (matches D5)

| Phase | Blocked by | Why |
|---|---|---|
| P2 | P1 | Design tokens, fonts, and `site.config.ts` must exist; CTAs already point at `/agent` |
| P3 | — (parallel with P2) | Shares no code with the UI shell |
| P4 | P3 | Schema (`AuditLog`, `User`), env validation, `RateLimiter`, services to protect |
| P5 | P3 (routes need P4 helpers) | Needs schema tables, env, envelope, logger; protected routes need session |
| P6 | P4 + P5 | Persisted threads require auth; streaming wire-up requires the gateway |
| P7 | P6 | Guardrails and assembly hook into the working chat loop |
| P8 | P1–P7 | Hardening gates everything that exists |
| P9 | P8 | Production branch protection requires the green gate set |
| P10 | P9 + P7 | Files pipeline lands on production infra; document analysis extends P7 prompts |
| P11 | P10 | Tools and agents act on the canonical financial model |
| P12 | P11 | Billing meters agent/usage value |

## External risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Provider pricing changes / model deprecation | Cost spikes; catalog rot | Registry is data (`models.config.ts` + `ModelCatalog`) — refresh IDs without code changes; usage + cost recorded per call (`AIRequest`); cost-anomaly alert in P9 |
| SSE limits on serverless (Vercel maxDuration, connection caps) | Truncated streams on long runs | `maxDuration` configured on the streaming route; first-token p50 verified in P9; abort handling keeps partial results; containerized Node deployment documented as the escape hatch |
| OpenRouter availability degradation | Answer outages | Fallback chain (same tier → adjacent, cross-provider preferred), per-provider circuit breaker, fallback-spike alert, direct-adapter port reserved |
| Neon cold starts / connection limits | Latency spikes; pool exhaustion | Pooled (pgBouncer) runtime URL, unpooled migration URL, DB alert on saturation, health endpoint for probing |
| Google OAuth review / credential friction | P4 delay | Credentials are an external dependency — request them before P4 starts (see `dependencies.md` tracking); credentials sign-in is the fallback path |
| Prompt-injection via user content | Unsafe instructions reaching the model | Phase 7 fencing (delimited, role-labeled data frames); guardrails; tool allow-lists arrive with P11 |
| Flaky third-party behavior in e2e | CI distrust | Fixture mode for all provider-dependent tests in required CI; live runs manual; two-week flaky quarantine rule |
| Budget overrun (AI spend) | Cost surprise | `UsageRecord` per user, pricing tiers visible in registry, cost-anomaly alert, rate limits on AI endpoints |

## What can be parallelized

- P2 (workspace shell) and P3 (backend foundation) — zero shared code; the only sanctioned two-track overlap in the MVP.
- P1 and P2 can overlap for a frontend-heavy pairing (P2 consumes P1's tokens/config early).
- Early P8 passes (a11y scans, Lighthouse, e2e skeletons) can run on finished surfaces while P7 is in progress.
- Doc-work is always parallelizable: runbooks, eval case writing, and `.env.example` upkeep never block code phases.
- Everything else is sequential per the build-order table; do not run two phases against the same files concurrently.
