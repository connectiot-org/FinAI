# Phase 8 — Hardening: tests, security gates, performance, accessibility

| Field | Value |
|---|---|
| Roadmap phase | P8 — Testing hardening + CI gates (testing is continuous from P1) |
| Depends on | P1–P7 |
| Estimated effort | M |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../07-testing/api-test-plan.md` |

## OBJECTIVE

Harden the platform: implement the testing plans in `../07-testing/` fully — e2e, security, authz matrix, rate limits, AI evals in CI — enforce the performance budgets (D10) and accessibility standards, and add dependency hygiene. No new features.

## CONTEXT

Phases 1–7 shipped features with per-phase tests; this phase turns them into enforced CI gates so that "merge to main" equals "all gates green". The testing plans are canonical in `../07-testing/` (starting with `api-test-plan.md` plus its companion plans). Budgets come from D10: homepage LCP < 2.5s and INP < 200ms; Workspace first-token < 2s p50 with server first byte < 1s; thread-list interaction < 100ms optimistic. The CI/CD pipeline shape finalized here is the one Phase 9 wires to production.

## INPUTS

- `../07-testing/api-test-plan.md` and the remaining plans in `../07-testing/` (e2e, security, performance, a11y as present).
- `../03-system-architecture/deployment-architecture.md` — the pipeline this phase finalizes; production hardening lands in Phase 9.
- `../01-context/project-context.md` — D8 security baseline, D10 budgets.
- Phase 7 output: `evals/run-evals.ts` and the golden cases.

## TASKS

1. E2E suite (Playwright, `e2e/`): homepage smoke (CTAs route to `/agent`, key sections render); auth flows (sign-in, gate screen, sign-out); Workspace happy path (thread → streamed answer in fixture mode → complete → reload-safe); error and stop scenarios; responsive smoke at 390 / 768 / 1280 px.
2. Security tests: a secret-scan CI gate (`gitleaks` over full history and PR diffs); a bundle check — grep client bundles for key-shaped strings and generate an `@next/bundle-analyzer` report with size budgets; the authz matrix suite (cross-user 403/404, unauthenticated 401, health public) executed against a test deployment; security-header assertions (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy per D8).
3. Rate-limit tests: the AI and auth endpoints trip limits with the `RATE_LIMITED` envelope; response headers expose remaining/reset; limits reset after the window.
4. AI eval workflow in CI: a manual-trigger workflow `.github/workflows/evals.yml` running `evals/run-evals.ts` in fixture mode over the 20 golden cases, uploading the report as an artifact.
5. Flaky quarantine process: Playwright retries plus an `e2e/QUARANTINE.md` list; quarantined tests are excluded from required checks, reviewed weekly, and may stay quarantined for at most two weeks.
6. Performance passes against D10: Lighthouse CI on mobile and desktop for the homepage; a scripted fixture-mode run measuring first-token latency (server first byte < 1s, first streamed token < 2s p50); thread-list optimistic interaction < 100ms measured from an e2e trace. Fix offenders (code-split marketing animations, font preloading, query tuning, payload trimming) — budgets are never relaxed to get green.
7. Accessibility audit: axe scans in e2e for homepage and Workspace; fix all critical and serious issues; a documented keyboard-only pass over the Composer, Model Selector, thread sidebar and menus.
8. Dependency updates: triage `pnpm outdated`; apply patch/minor bumps gated by the suite; document deliberate holds (major bumps) with reasons in the status table.
9. Error-budget note: document where error-rate and p95 dashboards will live after deployment (a `docs/runbooks/observability.md` stub is acceptable now; alerts are armed in Phase 9).

## CONSTRAINTS

- No new product features; refactors only in service of budgets, flakiness, or a11y.
- CI runs on every pull request: typecheck, lint, unit, integration, e2e (fixture mode), secret scan, bundle check, Lighthouse budgets.
- Live-model tests stay out of required CI; they run on demand via the eval workflow.
- Quarantine is for genuine flakes only — security or authz failures are never quarantined.

## EXPECTED OUTPUT

A green, required CI pipeline covering all gates; budget reports showing D10 met; a documented quarantine list (possibly empty); zero axe critical/serious issues; a reproducible eval report over the golden cases.

## FILES TO CREATE OR MODIFY

- `e2e/*` (Playwright specs + fixtures), `e2e/QUARANTINE.md`
- `.github/workflows/ci.yml`, `.github/workflows/evals.yml`
- `playwright.config.ts`, `vitest.config.ts` as needed
- Test additions under `src/**/__tests__/` for rate limits and gateway behaviour
- `docs/runbooks/observability.md` (stub)
- Performance fixes across `src/app/page.tsx`, `src/components/marketing/*`, `src/components/agent/*` as needed

## TEST REQUIREMENTS

This phase is the test requirements: the deliverable is the suites themselves. Concretely — the e2e suites of task 1 pass in CI; the authz matrix and rate-limit suites pass; the secret-scan and bundle gates pass; the Lighthouse budget checks pass; the eval workflow runs and produces a report.

## ACCEPTANCE CRITERIA

- [ ] CI is required for merge: typecheck, lint, unit/integration, e2e, secret scan, bundle check, Lighthouse budgets — all green.
- [ ] D10 budgets are met and enforced in CI: homepage LCP/INP; first-token p50; thread-list interaction.
- [ ] The authz matrix and rate-limit suites prove the D8 behaviour (401/403/404, limits trip and reset).
- [ ] The secret-scan gate is active and no key-shaped strings appear in client bundles.
- [ ] The eval workflow (manual trigger) produces a report over the 20 golden cases.
- [ ] Zero axe critical/serious issues on homepage and Workspace; the keyboard-only pass is documented.
- [ ] The quarantine process is documented; any quarantined test carries a review date.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:e2e` clean.

## DO NOT DO

- Do not add features, endpoints, or UI capabilities.
- Do not weaken budgets, thresholds, or gates to get green.
- Do not run live-model tests in required CI.
- Do not quarantine failing tests without a documented, time-boxed reason.
- Do not skip the a11y fixes because "the suite is green".

## NEXT STEP

Load `phase-09-deployment.md`.
