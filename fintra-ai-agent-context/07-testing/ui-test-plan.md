# UI Test Plan

> Per user spec §27: test scope for the homepage and the Fintra Workspace — cases, types, priorities, key assertions, visual regression policy, and accessibility checks.

## Scope principles

UI testing stays light-and-fast (testing-strategy.md): component tests (Vitest + Testing Library) for stateful behavior, a small Playwright e2e set for journeys that break trust when broken. Two surfaces, one marketing, one product:

- **Homepage** (`/`): verified section inventory S1–S17 (Task 1 homepage analysis).
- **Fintra Workspace** (`/agent`): composer, streaming, model selection, history, error states (D7 naming).

## Homepage test scope

### Section inventory (S1–S17)

E2E smoke asserts presence and order of the verified sections:

| Id | Section | Id | Section |
|---|---|---|---|
| S1 | Announcement bar | S10 | "Say the word" live sim + composer |
| S2 | Sticky nav | S11 | Eight agents grid |
| S3 | Hero + CTAs | S12 | Trust & control (+ honesty note) |
| S4 | Simulated workspace visual | S13 | Integrations grid |
| S5 | Logo marquee | S14 | Testimonial |
| S6 | Animated stats | S15 | Pricing |
| S7 | Intelligence tabs (Ask/Close/Forecast/Report/Guard) | S16 | Final CTA |
| S8 | Value props ("Meet your new finance team") | S17 | Footer |
| S9 | "Built for teams" stats | | |

### Homepage cases

| Case | Type | Priority | Key assertions |
|---|---|---|---|
| Nav renders and is sticky | Playwright e2e | P1 | Logo + 5 links + Sign in + "Open live demo" visible; sticky on scroll |
| CTAs route to /agent | Playwright e2e | P0 | Hero, nav, and final CTA navigate to `/agent` (Phase 1 goal: real CTAs) |
| Sections S1–S17 presence | Playwright e2e | P1 | All 17 sections render in order; zero console errors |
| Responsive smoke 375/768/1280 | Playwright e2e | P1 | No horizontal overflow; nav collapses; grids stack; composer usable at 375px |
| Reduced motion respected | Playwright e2e | P2 | With `prefers-reduced-motion`, marquee/stats animations are static or minimal |
| Honesty note visible | Playwright e2e | P1 | "Honest by design: this demo simulates agent execution…" present (demo-staged claims never masquerade as product fact) |
| Hero content correctness | Vitest component | P2 | H1, subhead, and the three CTA chips render from content config, not hard-coded drift |

## Workspace test scope

| Case | Type | Priority | Key assertions |
|---|---|---|---|
| Empty state renders | Vitest component | P0 | Composer-first empty state with inline model/mode selectors and suggested prompts (Perplexity pattern 1); no thread chrome |
| Composer send flow (mocked SSE) | Playwright e2e | P0 | Sending shows state streaming -> complete; mocked events render text and steps; Enter sends, Shift+Enter newline |
| Model selector opens/switches | Vitest component | P0 | Popover opens from registry data (names, tiers, badges); switching shows "next answer uses X"; retired models disabled |
| Run steps render from mocked events | Vitest component | P0 | `step` events create/update step items with active/done states; no fabricated steps when no events arrive |
| Error states show correct copy | Vitest component | P0 | Each gateway error code maps to its catalog copy; retryable errors show Retry, non-retryable do not; `CONTENT_FILTERED`, `PROVIDER_RATE_LIMIT`, `INVALID_API_KEY` copy verified |
| Stop/abort | Vitest component | P1 | Stop aborts the stream; partial message marked incomplete; explicit Retry offered (no auto-retry) |
| History sidebar CRUD | Playwright e2e | P1 | Create (new thread), auto-title, rename, delete (with confirm dialog), list ordering by recency |
| Auth gate redirects | Playwright e2e | P0 | Unauthenticated `/agent` visit redirects to sign-in; after sign-in returns to intended thread |
| Keyboard shortcuts | Playwright e2e | P2 | New thread (Cmd/Ctrl+K style per D7 pattern 7), shortcut help discoverable; focus returns to composer after send |
| Streaming ARIA behavior | Vitest component | P1 | Answer region is `aria-live=polite`; steps use `role=status`; focus is not stolen during streaming |

Mocking contract: e2e streaming tests inject scripted SSE event sequences (`step` -> `text-delta`* -> `usage` -> `message-complete` -> `done`, plus error variants) through Playwright route interception, so UI behavior is deterministic and provider-independent.

## Visual regression

- **Optional and advisory in MVP**: Playwright screenshots for four Workspace states — empty, streaming, complete, error — captured at 1280 and 375.
- **Tolerance policy**: pixel-diff threshold ~2% per screenshot; diff artifacts attached to CI; advisory in MVP (review-triggered), becoming blocking only in Phase 8 hardening if the team finds the signal reliable. Baselines update exclusively via reviewed PRs; no silent re-baselining.

## Accessibility test checklist

| Check | Method | Scope |
|---|---|---|
| Automated a11y scan | axe (Playwright) | Homepage, `/agent`, sign-in — zero critical violations |
| Focus trap in dialogs | Playwright | Model selector popover, delete-confirmation dialog: focus trapped, Escape closes, focus restores |
| ARIA live for streaming | Component + e2e | New text announced without focus theft; steps announced via `role=status` |
| Keyboard-only traversal | Manual + e2e spot checks | Full composer -> send -> stop -> retry loop reachable by keyboard |
| Contrast | Token audit | Body and muted text meet 4.5:1 against paper backgrounds (D6 palette) |
| Reduced motion | Playwright emulation | Streaming indicators degrade gracefully without motion |

## Related docs

- [Testing Strategy](testing-strategy.md) — pyramid, gates, flaky policy
- [API Test Plan](api-test-plan.md) — the SSE contract these UI mocks must match
- [Security Test Plan](security-test-plan.md) — auth-gate and session cases
- [UI/UX: Agent UI Spec](../02-ui-ux/agent-ui-spec.md) — component specs and states under test
