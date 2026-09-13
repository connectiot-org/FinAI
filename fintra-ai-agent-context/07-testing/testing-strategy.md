# Testing Strategy

> What we test, how, and to what standard: a money-and-trust-first philosophy, the test pyramid, coverage targets, CI gates per phase, and policies for fixtures and flakiness.

## Philosophy

Fintra handles money and trust, so tests concentrate where breakage costs money or credibility: **auth, persistence, the AI gateway, and financial guardrails**. UI is tested light-and-fast — typecheck plus component tests plus a small set of e2e journeys — because a broken margin on a card is embarrassing, but a silently wrong gross margin is fatal (D9). We optimize for a fast, trustworthy signal on every PR, not vanity coverage.

Two corollaries:

1. **Integration tests run against real Postgres.** Mocked-ORM tests hide the exact class of bugs (migrations, constraints, jsonb behavior) that a persistence-heavy product hits in production. The choice between ephemeral containers and branch databases is documented below.
2. **Provider APIs are never called live in CI** (D8). All gateway tests run against recorded fixtures and MSW-mocked HTTP.

## Test pyramid

| Layer | Share | Tooling | Scope | Runtime budget |
|---|---|---|---|---|
| Unit | ~70% | Vitest (+ Testing Library for components) | Domain logic (pure TS in `src/server/domain`), services with mocked infra, prompt assembly, context budget math, Auto heuristic, error mapping | Whole unit suite < 3 min |
| Integration | ~20% | Vitest + real Postgres 16 | Services + Prisma + route handlers: conversations CRUD, streaming persistence, usage aggregation, ownership scoping | < 5 min |
| E2E | ~10% | Playwright | Critical journeys: sign in -> create thread -> stream (mocked SSE) -> stop/retry -> sign out; homepage CTAs; auth gates | < 10 min, parallelized |

**Tooling roles**: MSW mocks provider HTTP with recorded OpenRouter fixtures (api-test-plan.md); testcontainers supplies the ephemeral Postgres; Playwright runs the browser matrix (Chromium primary, WebKit smoke).

**testcontainers-or-branch-DB choice (documented)**: primary = **testcontainers** (ephemeral Postgres 16 per worker, migrations applied fresh). Rationale: hermetic, no shared state, no cloud dependency, works locally and in CI identically. Documented fallback = **Neon branch databases** for environments without Docker (contributors, constrained CI runners); the fallback uses the same factories and seeds so tests are environment-agnostic. Either way: real migrations, real constraints, no `prisma db push` shortcuts.

## What we explicitly do NOT test

- **Pixel styling and visual minutiae** — covered by design tokens (D6) and human review; a color drift is not a build breaker.
- **Third-party library internals** — Auth.js, Prisma, the AI SDK, and React itself are tested by their maintainers; we test our configuration and integration seams only.
- **Provider availability and latency** — external systems; we test our handling of their failures (fixtures), not the failures themselves.
- **Marketing animation frames** — the homepage's motion budget (D6) is verified by reduced-motion and smoke checks, not frame assertions.

## Coverage targets

| Area | Target | Rationale |
|---|---|---|
| `src/server/services` + `src/server/domain` | 85% lines + branches | Where business and money logic lives |
| `src/server/ai/gateway` + `providers` | 90% | Streaming, error mapping, and fallback are the highest-risk code paths |
| Route handlers (`src/server/api`) | 80% | Thin controllers; integration tests carry most of the weight |
| UI components | No coverage % | Critical paths via e2e; component tests for state logic (error copy, selector behavior) |
| DB migrations | 100% applied | Every migration is applied to a fresh DB in the integration job |

Coverage is a floor, not a goal: a 90% number with weak assertions is worse than 85% with sharp ones. PR review checks assertion quality on changed files.

## CI gates per phase

Gates tighten as the product grows (phase mapping per D5):

| Phase | Gates on every PR | Additional |
|---|---|---|
| Phase 3+ (backend foundation) | Typecheck (tsc strict), lint, unit suite | — |
| Phase 6+ (conversations & chat) | + integration suite (Postgres) | E2E smoke on `main` |
| Phase 8 (testing hardening) | Full matrix: typecheck, lint, unit, integration, e2e on PR; nightly full e2e | Evals via manual workflow (ai-evaluation-plan.md); coverage report on PR |
| Phase 9 (production) | + security gates: secret scan, `npm audit` high-and-fail, build manifest check (security-test-plan.md) | Release checklist |

A red gate blocks merge; there are no "known failing" exceptions — anything flaky goes to quarantine (below), anything broken gets fixed or reverted.

## Fixtures and factories policy

- **Prisma seed-based factories**: one factory module per entity (`user`, `conversation`, `message`, `modelCatalog` rows) building valid rows with overridable fields; factories call the same Zod schemas the API uses, so invalid fixtures fail loudly.
- **No shared mutable state**: tests never mutate a shared fixture object or rely on execution order; each test creates its own data via factories. Integration workers truncate tables between tests.
- **Seeds in tests = seeds in dev**: the model catalog seed used by tests is the same seed script used locally, so registry drift shows up in tests, not production.
- **SSE fixtures**: recorded provider streams are versioned artifacts; re-recording requires a PR with an explanation (provider protocol change or fixture bug).

## Flaky test policy

Flakiness destroys trust in the suite faster than any missing test destroys the product.

1. A test that fails intermittently gets the `flaky` label and is **quarantined** (excluded from blocking) with an issue attached.
2. **48h fix SLA**: the owner fixes or deletes-and-replaces the test within two business days; quarantine beyond 48h escalates to the tech lead.
3. Un-quarantine requires **two consecutive green runs** in CI.
4. Common root causes are fixed structurally, not patched: real timers instead of sleeps, deterministic ids, `test.uniform` data, Playwright auto-waiting over manual delays.

## Related docs

- [UI Test Plan](ui-test-plan.md) — homepage and Workspace scope per user spec §27
- [API Test Plan](api-test-plan.md) — endpoint matrix, integration recipe, adapter contract tests
- [AI Evaluation Plan](ai-evaluation-plan.md) — operational eval harness and CI workflow
- [Security Test Plan](security-test-plan.md) — security gates referenced above
- [Evaluation Strategy](../05-ai/evaluation-strategy.md) — the quality layer that complements functional tests
