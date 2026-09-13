# Fintra Homepage — Current State and Phase-1 Target Specification

> Purpose: define the polished Phase-1 marketing homepage section-by-section — what is kept from the live site, what changes, and how every call to action routes into the Fintra Workspace at `/agent`.

## 1. Current-state summary

The live homepage at https://fintra.space-z.ai/ (verified in Task 1 inspection, recorded in the shared worklog) is a Next.js App Router page with a distinctive warm-paper "ledger" aesthetic: Geist Sans for UI, Geist Mono for every figure, Playfair Display for editorial accents; paper surfaces (`#fbfaf8`, `#fafaf7`, `#f1f0ec`, `#ecefed`) against green-black ink panels (`#131915`, `#090f0c`); an emerald brand scale led by `#006548`; and a bronze audit accent (`#c48225`). Section flow runs from the announcement bar, through nav, hero, the simulated workspace visual, marquee, stats, surfaces tabs, value props, live demo, agent roster, trust, integrations, testimonial, pricing, and final CTA, to the footer. Its strongest assets are concrete product storytelling — the orchestration run-steps ("Retrieving September P&L → Running variance decomposition → Cross-checking transactions → Quantifying driver impact — 92% explained → Assembling recommendations"), the evidence chain "Report → driver → account → transaction", and confidence chips ("94% conf., 12 refs") — plus an honest demo framing and a consistently repeated "Open the live demo" CTA.

The gaps: "Open live demo" and nav "Agent" lead nowhere (no `/agent` exists); no model selection; no auth; an animation budget heavy against D10 limits; demo-staged claims (fictional "$12M Series A" banner, fictional logos, demo-persona testimonial) that must never leak into product UI; and no empty, error, or usage states anywhere. Phase 1 therefore polishes rather than reinvents: keep the section architecture and identity, re-point every CTA at the real Fintra Workspace, insert a continuous marketing-to-product transition, replace staged announcements with an evergreen system, and pass accessibility and performance gates.

## 2. Target-state overview

| # | Section | Verdict | Phase-1 goal |
|---|---|---|---|
| S1 | Announcement bar | Redesign | Evergreen announcement system; remove fictional Series A |
| S2 | Sticky nav | Keep with edits | "Agent" routes to `/agent`; Sign in to `/sign-in`; CTA re-labelled |
| S3 | Hero | Keep with edits | CTA routing; accessibility; reduced-motion |
| S4 | Simulated workspace visual | Keep | Align 1:1 with Workspace visual language |
| S4b | Meet the Financial AI Agent (NEW) | New | Tease the real Workspace: model chip, run steps, evidence |
| S5 | Logo marquee | Keep with edits | Honest "demo cohort" captioning |
| S6 | Animated stats band | Keep with edits | Reduced-motion fallback; demo-data footnote |
| S7 | Surfaces tabs | Keep | Keyboard-accessible tabs |
| S8 | Three value props | Keep | Evidence-chain styling matches Workspace |
| S9 | Back-office stats | Keep | Figures consistent with S6 |
| S10 | Live agent demo | Keep with edits | Composer mirrors real Composer; CTA to `/agent` |
| S11 | 8-agent roster grid | Keep | Mono figures; "Run" terminology per D7 |
| S12 | Trust and control | Keep | Keep honesty note |
| S13 | Integrations grid | Keep | "Planned" badges; no live-data claims |
| S14 | Testimonial | Keep with edits | "Demo persona" caption |
| S15 | Pricing | Keep with edits | Remove competitor references; CTAs route to `/agent` |
| S16 | Final CTA | Keep with edits | Primary action to `/agent` |
| S17 | Footer | Keep with edits | Add Agent link; honest demo note until Phase 9 |

## 3. Section-by-section specification

**S1 — Announcement bar.** Purpose: one line of timely, evergreen product news. Content: a single message plus optional link, sourced from an `announcements` array in `src/config/site.config.ts`; the fictional "Northline Capital leads Fintra's $12M Series A" is removed and must never return in product-adjacent UI. Interaction: dismiss button (accessible name "Dismiss announcement"), state persisted in `localStorage`; content changes are config-only. Responsive: ellipsizes to one line; link wraps on mobile. Verdict: redesign as a system, not a hardcoded banner.

**S2 — Sticky nav.** Purpose: persistent orientation and the first primary CTA. Content: logo; anchors Product (`#product`), Team (`#team`), Trust (`#trust`), Pricing (`#pricing`); **Agent routes to `/agent` (key change)**; Sign in routes to `/sign-in` (a branded stub until Phase 4 authentication ships, explaining that accounts arrive then); primary CTA "Open live demo" routes to `/agent`. Interaction: sticky with 1px bottom border on scroll; active-anchor highlight; skip-to-content link is the first focusable element. Responsive: collapses to logo + Agent + primary CTA + menu button below `md`; menu is a full-width sheet. Verdict: keep structure, fix routing.

**S3 — Hero.** Purpose: state the category and the promise in one screen. Content: eyebrow "8 agents working right now — watch them run"; H1 exactly "Your finance team, run by agents you can audit." set in Playfair Display (editorial role per D6); subhead: "Fintra connects your ledger, banks, and payments. Eight specialized agents analyse, forecast, reconcile, and report — with evidence. Every number carries evidence. Every action passes through you."; tagline strip "Think deeper. Close faster. Sleep better."; dual CTA — primary "Open live demo" to `/agent`, secondary "Watch the agents work" scrolling to S4; trust chips "No credit card", "Demo company included", "Simulated AI, production-ready architecture" (keep — honest framing). Interaction: CTAs are real links; anchor scroll respects reduced motion. Responsive: single column below `lg`; H1 clamps 2.5–4rem. Verdict: keep with routing and contrast fixes.

**S4 — Simulated workspace visual.** Purpose: show the product working before a single scroll. Content: the existing sidebar-plus-run composition; steps match RunStepsBlock styling exactly (status dots, Geist Mono figures, "1 of 5" progress) using the canonical live-site sequence. Interaction: passive; no scroll-jacking; optional step cycling gated by `prefers-reduced-motion` (static final frame). Responsive: scales down; sidebar hidden below `md`, steps full-width. Verdict: keep — signature asset — and restyle to match `agent-ui-spec.md` §15 so the visual is a truthful preview.

**S4b — Meet the Financial AI Agent (new section).** Purpose: preview the real Fintra Workspace so the homepage-to-`/agent` transition is continuous, not a context switch. Content: left — H2 "Meet the Financial AI Agent", one paragraph ("The same workspace you just watched. Pick a model, ask a financial question, and watch the Run with evidence attached."), CTA link "Open the Workspace" to `/agent`; right — a static Workspace composition: model selector chip ("Auto · Balanced" + tier badge), the user question "Why did EBITDA decrease this month?", three run steps with status dots, a Geist Mono table excerpt, an evidence chip row ("Sep P&L · 1,284 lines · quality 98.2"), and a confidence chip ("94% conf., 12 refs"). Interaction: one looping micro-animation (step dot progression), disabled under reduced motion; the composition links to `/agent`. Responsive: stacks below `lg`; composition scrolls internally at fixed aspect ratio. Verdict: new, required.

**S5 — Logo marquee.** Purpose: social-proof rhythm. Content: fictional company names may remain for demo purposes, but the marquee carries a visible caption "Illustrative customer set — demo data" (never present fictional customers as real). Interaction: CSS marquee paused on hover and disabled under reduced motion (static row). Responsive: static single row below `md`. Verdict: keep with edits.

**S6 — Animated stats band.** Purpose: quantify the promise. Content: the four live stats (companies closing with agents, % of close work auto-completed, % outputs traceable, median answer time 3.2s) plus a "Demo data" footnote; 3.2s echoes the D10 budget. Interaction: count-up on intersection; static values under reduced motion. Responsive: 2×2 grid below `md`. Verdict: keep with edits.

**S7 — Surfaces tabs.** Purpose: show breadth ("Every surface of finance, served"). Content: five tabs — Ask (AI Workspace), Close (Reconciliation), Forecast (FP&A), Report (Board packs), Guard (Approvals and audit) — each with an example Q&A card; numerals in Geist Mono (e.g., AR aging $333K overdue · 9 accounts). Interaction: ARIA tabs (roving tabindex, arrow keys, `aria-selected`); deep links update the hash. Responsive: tabs become a horizontal scroll row below `md`. Verdict: keep with a11y fixes.

**S8 — Three value props.** Purpose: explain the model (Answers not spreadsheets, Works while you sleep, Shows its work). Content: keep all three, including the overnight timeline and the evidence chain "Report → driver → account → transaction" (EBITDA −$38.1K → contractors → GL 6100 · 84 lines → TXN-8841 · $12.4K); styling must match the Workspace's EvidenceRow and confidence chips. Interaction: none beyond entrance fades (reduced-motion safe). Verdict: keep, restyle to match product.

**S9 — Back-office stats.** Purpose: board-level credibility ("Built for teams who answer to boards, auditors, and themselves"). Content: 12→3 days to close, 2,400+ companies, 100% traceable; figures must not contradict S6; footnote "Demo data". Interaction: none. Responsive: stacked below `md`, row layout above. Verdict: keep.

**S10 — Live agent demo.** Purpose: let visitors feel the Composer before signing in. Content: headline "Say the word. Watch it run."; a decorative disabled Composer mirroring the real one (agent-ui-spec.md §5); "grounded in Xero · Barclays · Stripe" line; four pillars (Knows your numbers / Respects your controls / Never forgets a detail / Learns your cadence). Interaction: submitting is impossible — focus routes to the "Open live demo" CTA; typed text routes to `/agent?q=...` once Phase 2 ships. Responsive: pillars 2×2 below `md`. Verdict: keep with edits.

**S11 — 8-agent roster grid.** Purpose: make "your finance team" concrete. Content: the eight agent cards (CFO through Data) with runs/month and quality figures in Geist Mono; labels use "Runs" per the D7 glossary. Interaction: hover elevation only; no fake per-agent chats. Responsive: 2 columns below `md`, 1 below `sm`. Verdict: keep.

**S12 — Trust and control.** Purpose: address the audit buyer. Content: four pillars (Evidence on every number; Approval before action; Complete audit trail) plus the honesty note ("Honest by design: this demo simulates agent execution…"). Interaction: none. Responsive: pillars 2×2 below `md`. Verdict: keep unchanged in substance.

**S13 — Integrations grid.** Purpose: show the data surface area. Content: the existing 14 integration wordmarks; new integrations carry a "Planned" badge; no live-sync claims (data connections are future phases). Interaction: none; wordmarks are static images with alt text. Verdict: keep.

**S14 — Testimonial.** Purpose: human voice. Content: Maya Kessler quote retained, explicitly captioned "Demo persona — illustrative quote". Interaction: none. Responsive: quote constrained to 640px from `md`. Verdict: keep with caption.

**S15 — Pricing.** Purpose: qualify buyers. Content: Starter $290, Growth $890 (most popular), Enterprise custom; competitor references (Nume, Rillet) are removed from visible UI; a line notes billing arrives post-MVP (Phase 12). Interaction: Starter and Growth CTAs "Start with the Workspace" route to `/agent`; Enterprise "Talk to us" is a `mailto:` link. Responsive: stacked cards below `lg`. Verdict: keep with copy edits.

**S16 — Final CTA.** Purpose: last conversion moment. Content: editorial headline "The close is over. Tonight." in Playfair Display on an ink panel (`#131915`) with bronze accent rule; primary "Open live demo" to `/agent`; secondary "Get the pilot kit" as `mailto:`. Responsive: CTAs stack below `sm`. Verdict: keep with routing.

**S17 — Footer.** Purpose: navigation closure and legal baseline. Content: ink panel (`#090f0c`); columns Product (now including Agent → `/agent`), Company, Legal; "Built for product and investor demos" note stays until Phase 9; copyright "© 2025 Fintra (demo brand)". Interaction: standard links; focus-visible rings on ink require the light-on-dark focus token. Verdict: keep with link additions.

## 4. Key changes required (Phase 1)

1. **Routing**: primary CTA ("Open live demo") and nav "Agent" route to `/agent` everywhere; no dead CTAs remain.
2. **Marketing-to-product continuity**: new S4b teaser previews the real Workspace (model selector chip, run steps, evidence chips, confidence chip) directly after the S4 simulation.
3. **Evergreen announcement system**: S1 becomes config-driven and dismissible; all fictional financial claims (Series A banner) are removed.
4. **Accessibility pass**: WCAG 2.1 AA contrast on paper backgrounds (see `design-system.md` §2 pairing rules), semantic landmarks (`header`/`nav`/`main`/`section[aria-labelledby]`/`footer`), skip link, keyboard-operable tabs and menu, `prefers-reduced-motion` honored for marquee, count-ups, and step cycling.
5. **Performance budgets (D10)**: LCP < 2.5s (hero text is the LCP element — no image LCP; fonts via `next/font` with `display: swap`), INP < 200ms (IntersectionObserver-gated effects, no long-task animation libraries), zero layout shift from fonts or marquee; small client islands keep JS minimal.

## 5. CTA strategy

One primary action everywhere: **Open live demo → `/agent`**. No competing primary verbs.

| Surface | Label | Destination | Notes |
|---|---|---|---|
| S2 nav (primary) | Open live demo | `/agent` | Sign in is secondary, `/sign-in` |
| S3 hero (primary) | Open live demo | `/agent` | Repeats nav; same label |
| S3 hero (secondary) | Watch the agents work | `#workspace-visual` | Anchor scroll, not a route |
| S4b teaser | Open the Workspace | `/agent` | Product-native wording allowed here only |
| S10 live demo | Open live demo | `/agent` | Prefill via `/agent?q=` |
| S15 pricing | Start with the Workspace / Talk to us | `/agent` / `mailto:` | Enterprise may mailto |
| S16 final CTA | Open live demo | `/agent` | Secondary mailto only |
| S1 announcement | (contextual) | docs/changelog | Never a competing product CTA |

## 6. Analytics and events

| Event | Trigger | Properties |
|---|---|---|
| `home_page_view` | Page load | `referrer`, `variant` (none in MVP) |
| `home_cta_click` | Any CTA | `surface` (nav, hero, teaser, demo, pricing, final), `label`, `destination` |
| `home_announcement_dismiss` | Dismiss click | `announcement_id` |
| `home_surfaces_tab_change` | Tab switch | `tab_id` (ask/close/forecast/report/guard) |
| `home_section_view` | Section enters viewport (25%) | `section_id` (s1–s17) |
| `home_sign_in_click` | Sign in link | `surface` |
| `home_scroll_depth` | 50/75/100% | `depth` |

Events are fired from a thin client wrapper; no PII is attached (D8).

## Related docs

- [agent-ui-spec.md](./agent-ui-spec.md) — the `/agent` Workspace these CTAs route into
- [design-system.md](./design-system.md) — tokens referenced throughout
- [responsive-strategy.md](./responsive-strategy.md) — per-breakpoint behaviour details
- [../01-context/project-context.md](../01-context/project-context.md)
- [../06-prompts/phase-01-homepage.md](../06-prompts/phase-01-homepage.md)
- [../09-diagrams/user-journey.svg](../09-diagrams/user-journey.svg)
