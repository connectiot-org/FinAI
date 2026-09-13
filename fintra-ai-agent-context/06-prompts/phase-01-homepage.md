# Phase 1 — Homepage polish: a marketing surface that sells the real Workspace

| Field | Value |
|---|---|
| Roadmap phase | P1 — Homepage polish |
| Depends on | P0 documentation package |
| Estimated effort | S (see `../08-roadmap/implementation-roadmap.md`) |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md` |

## OBJECTIVE

Turn the existing Fintra homepage into a production-quality marketing surface whose every primary CTA routes to `/agent` and which previews the real Fintra Workspace — no fictional claims, no fake product depth, Lighthouse-verified performance and accessibility on mobile and desktop.

## CONTEXT

The current homepage is verified in `../01-context/project-context.md` as a 17-section inventory (S1 announcement bar through S17 footer). It is visually strong — warm-paper editorial identity, auditable-agents positioning, concrete product storytelling — but ships three problems that Phase 1 must fix:

1. "Open live demo" and the nav "Agent" link lead nowhere real; there is no `/agent` product page.
2. Demo-staged claims must never stand in as product claims: the fictional "$12M Series A" announcement bar, fabricated logos/stats ("2,400+ companies", "12→3 days to close", "median answer time 3.2s") and the fictional testimonial persona.
3. Heavy marketing animation with no `prefers-reduced-motion` handling and no performance budget behind it (D10 exists but is unenforced).

Phase 1 fixes these without redesigning the identity (D6 tokens are frozen) or rebuilding sections wholesale. The Workspace being advertised does not exist yet — Phase 2 builds it — so CTAs route to `/agent`, which this phase seeds with a single honest placeholder route.

## INPUTS

- `../01-context/project-context.md` — homepage S1–S17 section inventory, gaps list, decision ledger (D6 tokens, D10 budgets, D7 glossary).
- `../02-ui-ux/responsive-strategy.md` — breakpoint and motion behaviour for marketing surfaces.
- `../08-roadmap/future-capabilities.md` — the 8-agent roster content used by the new teaser section.
- Current code: `src/app/page.tsx`, `src/components/marketing/*`, `src/app/layout.tsx`.

## TASKS

1. Audit the rendered homepage against the S1–S17 inventory; record the required-changes checklist in the phase status table Notes column so the diff is reviewable section by section.
2. Replace demo-staged claims: announcement bar becomes an evergreen product announcement (for example: "Fintra Workspace is in private beta — join the pilot"); remove the fictional Series A; remove or relabel every fabricated statistic — any number that stays must be explicitly labeled a design target (for example "target median answer time: under 3 seconds", consistent with D10); relabel the testimonial as an illustrative persona or remove it.
3. Add the dedicated teaser section "Meet the Financial AI Agent" before the 8-agent grid: a static preview of the real Workspace model — a Run with visible steps (per D7: Run, RunSteps, Evidence), an evidence chain, and a CTA to `/agent`. It must describe the actual Phase 2+ product, not aspirational features.
4. CTA plumbing: every primary CTA ("Open live demo" in hero, nav "Agent", mid-page "Say the word" CTA, final CTA) routes to `/agent`; secondary CTAs may anchor to page sections. Create `src/app/agent/page.tsx` as an honest placeholder (design-system card: "The Fintra Workspace is being built — check back soon"), linked from the homepage.
5. A11y and motion pass: all animated sections respect `prefers-reduced-motion` (marquee, animated stats counters, live sim); visible focus states on all interactive elements; complete alt text; correct heading hierarchy h1 → h2 → h3 without skips; `aria-hidden` on decorative SVGs; colour contrast per D6 palette verified.
6. Performance pass against D10 (homepage LCP < 2.5s, INP < 200ms): lazy-load below-the-fold animation, prefer static/CSS-only hero visual, prune unused animation JavaScript, preload the hero font subset.
7. Extract shared marketing config — nav links, CTA targets, announcement copy, agent roster names — into `src/config/site.config.ts` and consume it from all sections (no duplicated copy in components).

## CONSTRAINTS

- D6 tokens only; no new palette, no new fonts; Playfair Display for editorial accents only.
- No agent backend, no client-side "AI", no simulated streaming that fakes model calls.
- D10 budgets hold: homepage LCP < 2.5s, INP < 200ms.
- Do not restructure the S1–S17 section order beyond the required changes above.

## EXPECTED OUTPUT

The homepage renders with: evergreen announcement bar; honest, non-fabricated copy throughout; the new "Meet the Financial AI Agent" teaser section; every primary CTA resolving to `/agent`; the placeholder `/agent` route live; reduced-motion support verified; marketing copy centralized in `src/config/site.config.ts`. Lighthouse scores recorded in the status table.

## FILES TO CREATE OR MODIFY

- `src/app/page.tsx`
- `src/app/agent/page.tsx` (new, placeholder only)
- `src/components/marketing/*` — announcement bar, nav, hero, teaser section, agent grid, trust, pricing, final CTA, footer as present
- `src/config/site.config.ts`
- `src/app/layout.tsx` (fonts, metadata, reduced-motion global CSS if needed)

## TEST REQUIREMENTS

- Unit tests (Vitest): `site.config.ts` exports resolve; a CTA test asserts every primary CTA component renders `href="/agent"`.
- A11y: axe scan of the homepage in the test suite; zero critical or serious violations.
- Lighthouse: `pnpm build && pnpm start`, then `pnpm dlx lighthouse http://localhost:3000 --only-categories=performance,accessibility --form-factor=mobile` and repeat with `--form-factor=desktop`; record all four scores in the status table Notes.

## ACCEPTANCE CRITERIA

- [ ] No fictional funding, customer, or testimonial claims remain; every statistic is removed or explicitly labeled a design target.
- [ ] Every primary CTA resolves to `/agent`, and the route exists rendering the honest placeholder.
- [ ] The "Meet the Financial AI Agent" teaser section is present, previews the real Run/RunSteps/Evidence model, and links to `/agent`.
- [ ] `prefers-reduced-motion: reduce` disables or simplifies all decorative motion (verified manually and by test).
- [ ] Lighthouse performance ≥ 95 and accessibility ≥ 95 on mobile AND desktop; scores recorded.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` clean; no console noise.

## DO NOT DO

- Do not build any agent backend, chat UI, or Workspace functionality (Phase 2).
- Do not fake AI calls or add client-side model inference.
- Do not redesign the palette, typography, or section order (D6 frozen; S1–S17 kept).
- Do not touch `/agent` beyond the placeholder route.
- Do not carry demo-staged claims into `site.config.ts`.

## NEXT STEP

Load `phase-02-agent-ui.md` — build the real Workspace behind these CTAs.
