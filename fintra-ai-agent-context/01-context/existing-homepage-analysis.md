# Fintra Existing Homepage Analysis

> Purpose: a full audit of the live homepage at https://fintra.space-z.ai/ — what exists, what works, what is broken — so the Workspace inherits its strengths and fixes its gaps. Findings cite the verified inspection in `worklog.md` (Task 1); the site was not re-fetched.

## Current structure — all 17 sections in order

| # | Section | One-line purpose |
|---|---|---|
| 1 | Announcement bar | "Northline Capital leads Fintra's $12M Series A · Agent 2.0 is live" — fabricated urgency and momentum framing |
| 2 | Sticky nav | Logo, anchors (Product, Agent, Team, Trust, Pricing), Sign in, and the persistent "Open live demo" CTA |
| 3 | Hero | Eyebrow ("8 agents working right now — watch them run"), H1 ("Your finance team, run by agents you can audit."), subhead, strip ("Think deeper. Close faster. Sleep better."), dual CTAs, trust chips (No credit card / Demo company included / Simulated AI, production-ready architecture) |
| 4 | Simulated workspace visual | Fakes the product: sidebar (Dashboard, AI Workspace, Agents, Approvals, Reports) plus an orchestration run for "Why did EBITDA decrease this month?" (retrieving P&L 1,284 lines · quality 98.2 → variance decomposition → cross-checking 5 flagged transactions → 92% of driver impact explained → assembling recommendations and evidence) |
| 5 | Fictional logo marquee | Ten invented firms (Northbeam Capital, Alderline Group, ...) simulating social proof |
| 6 | Animated stats | Companies closing with agents, % of close work auto-completed, % outputs traceable, median answer time 3.2s |
| 7 | "An arsenal of intelligence" tabs | Interactive surfaces per workflow: Ask (AI Workspace), Close (Reconciliation), Forecast (FP&A), Report (Board packs), Guard (Approvals and audit), with an example Q&A card (AR aging $333K overdue, 9 accounts) |
| 8 | "Meet your new finance team" | Three value props: Answers not spreadsheets (−5.0pp vs budget, 61% GM, 3 drivers, 12 refs, 94% conf.), Works while you sleep (overnight timeline), Shows its work (EBITDA −$38.1K → contractors → GL 6100 · 84 lines → TXN-8841 · $12.4K) |
| 9 | Board-audience stats band | "Built for teams who answer to boards, auditors, and themselves": 12→3 days to close, 2,400+ companies, 100% traceable |
| 10 | "Say the word. Watch it run." live sim | Composer mock ("Ask anything — watch the run, then approve the action…"), grounded in Xero · Barclays · Stripe, four pillars (Knows your numbers / Respects your controls / Never forgets a detail / Learns your cadence) |
| 11 | Eight agent cards | "Eight specialists. One ledger of truth." — CFO, Finance Analyst, FP&A, Accounting, Reporting, Cash Flow, Audit, Data, each with runs/month and accuracy % |
| 12 | Trust and control | Evidence on every number; Approval before action; Complete audit trail; honesty note: "this demo simulates agent execution…" |
| 13 | Integrations grid | Xero, QuickBooks, Sage, NetSuite, SAP, Stripe, Barclays, Mercury, Gusto, HubSpot, Salesforce, Excel/CSV, Google Sheets, PDF import |
| 14 | Testimonial | Maya Kessler, CFO demo persona |
| 15 | Pricing | Starter $290, Growth $890 (most popular), Enterprise custom, with competitor anchoring (Nume $390–$1,290, Rillet) |
| 16 | Final CTA | "The close is over. Tonight." — Open live demo / Get the pilot kit |
| 17 | Footer | Product/Company/Legal columns; "Built for product and investor demos"; © 2025 Fintra (demo brand) |

## Visual and typography system (as found)

| Element | Finding |
|---|---|
| Fonts | Geist Sans (UI), Geist Mono (figures/numbers/code), Playfair Display (editorial serif accents); self-hosted woff2 |
| Backgrounds | Warm paper: `#fbfaf8`, `#fafaf7` raised, `#f1f0ec` / `#ecefed` section alt, `#e3e2dd` borders |
| Ink | Green-black surfaces `#131915` / `#090f0c`; ink `#1d2622`; muted text `#414a45` |
| Brand | Emerald scale: primary `#006548`, then `#038660 #358264 #3a9371 #3eaf86 #58ba93`; positive tint `#dbf2e4` |
| Accent | Gold/bronze `#c48225` (plus `#ffd236 #f99c00 #dd7400 #b75000`) used for highlights and audit motifs |
| Negative | `#ed5350 / #e40014 / #9f0712` with tint backgrounds `#fef2f2` / `#ffe2e2` |
| Live stack | Next.js App Router with Turbopack chunks — the marketing site is already on the target framework |

This system is codified, not reinvented, in D6 and the design tokens doc.

## Strengths

- **Differentiated positioning.** "Agents you can audit" is a CFO-credible claim in a market of intelligence-washing; it converts the industry's biggest AI fear into the product's core promise.
- **Concrete product storytelling.** Run steps, evidence chains ("Report → driver → account → transaction"), confidence scores, and named GL accounts demonstrate the product rather than describe it.
- **Distinctive aesthetic.** The warm-paper "ledger" editorial look with Geist Mono numerics and bronze audit motifs is immediately recognizable and unlike generic dark-mode AI landing pages.
- **Consistent conversion path.** A single CTA ("Open the live demo") repeats everywhere without competing offers.
- **Honest demo framing.** The chips ("Simulated AI, production-ready architecture"), the trust-section note, and the footer disclosure show the team knows the difference between simulation and product — a value the Workspace must keep.

## Weaknesses and gaps

- **The CTA leads nowhere real.** "Open live demo" and the "Agent" nav item do not reach an actual `/agent` workspace; the page promises an experience that does not exist.
- **No model selection anywhere.** The multi-model strategy (D4) has zero representation — a missed chance to signal the Fintra AI Gateway.
- **No auth flow.** "Sign in" is a visual affordance without a destination.
- **Demo-staged claims.** The fictional Series A, invented customer logos, simulated stats (2,400+ companies), and demo persona testimonial are marketing fiction; they must never leak into product UI and need a Phase 1 resolution plan.
- **Marketing-only states.** No empty, error, loading, or usage states exist anywhere; the page shows only the happy path at full polish.
- **Heavy animation budget.** Marketing motion dominates the performance budget that the real product will need for perceived-latency engineering (D10).

## Reusable components inventory

| Component | Where found | Reuse for Workspace |
|---|---|---|
| Announcement bar | Section 1 | Product-level notices (degraded model availability, maintenance) |
| Sticky nav | Section 2 | Workspace top chrome; Sign in becomes real auth |
| Simulated workspace visual | Section 4 | The blueprint for the real shell: sidebar, Thread pane, run area |
| Run-step list | Sections 4, 7, 10 | `RunSteps` component — the orchestration visual language already exists |
| Evidence chain | Section 8 ("Report → driver → account → transaction") | `EvidencePanel` narrative pattern |
| Stat band | Sections 6, 9 | Usage/summary strips (rebuild honest data) |
| Tabbed surfaces | Section 7 | Mode/section switching patterns (Ask/Close/Forecast/Report/Guard map to future workflows) |
| Agent cards | Section 11 | Future agent directory (post-MVP); also proof of finance-native vocabulary |
| Pricing table | Section 15 | Billing surfaces (P12) |
| Footer | Section 17 | App footer; dark ink panel usage example |

## KEEP vs REDESIGN per section

| # | Section | Verdict | Rationale |
|---|---|---|---|
| 1 | Announcement bar | REDESIGN | Fictional funding claim violates honesty; replace with real product notices or remove |
| 2 | Sticky nav | KEEP (wire) | Structure is right; make Sign in and CTA functional, point CTA to `/agent` |
| 3 | Hero | KEEP (copy audit) | Positioning is differentiated; verify every claim is defensible |
| 4 | Simulated workspace visual | KEEP as reference | This is the prototype of the real Workspace; the agent UI must feel like its real version |
| 5 | Logo marquee | REDESIGN | Fabricated logos cannot stand; remove or replace with honest pilot-program framing |
| 6 | Animated stats | REDESIGN | Simulated numbers presented as fact; drop until data is real or label as illustrative targets |
| 7 | Workflow tabs | KEEP | Maps cleanly to future Answer modes and workflow surfaces; tune copy to roadmap reality |
| 8 | Value props | KEEP | Strongest storytelling on the page; the evidence-chain example is the product thesis |
| 9 | Stats band | REDESIGN | Same simulated-claims problem as section 6 |
| 10 | Live sim | KEEP (upgrade) | Becomes a genuine interactive teaser or links into the real Workspace |
| 11 | Agent cards | KEEP (reframe) | Eight-specialist narrative is good; runs/accuracy figures are simulated — reframe |
| 12 | Trust and control | KEEP | Already states the product's three trust pillars plus honesty note |
| 13 | Integrations grid | REDESIGN | Nothing is integrated in MVP; label as roadmap or cut to avoid selling vapor |
| 14 | Testimonial | REDESIGN | Demo persona presented as customer; remove until real quotes exist |
| 15 | Pricing | KEEP (review) | Structure works; ensure tiers match eventual metering design (P12) |
| 16 | Final CTA | KEEP (wire) | Same CTA-consistency strength; destination must exist |
| 17 | Footer | KEEP (edit) | "Built for product and investor demos" disclosure stays until the product is real |

## Conclusion

The homepage is the visual reference for the entire product and already prototypes the Workspace's orchestration visual language: sidebar navigation, a Composer asking a real finance question, numbered run steps with live status, and an evidence chain from report to transaction. Its weaknesses are almost entirely honesty-adjacent (fabricated proof, missing destination, missing states), not aesthetic or conceptual. The strategic instruction for Phase 1–2 is therefore: keep the identity, keep the storytelling, wire the promise — the agent UI must feel like the real version of the simulation this homepage already performs.

## Related docs

- [Project context](./project-context.md) — where this audit sits in the master context.
- [Competitor reference](./competitor-reference.md) — the patterns the homepage already gestures at.
- [Agent UI spec](../02-ui-ux/agent-ui-spec.md) — the real version of the simulated workspace.
- [Design tokens](../02-ui-ux/design-system.md) — the system extracted above, codified.
- [Roadmap](../08-roadmap/implementation-roadmap.md) — Phase 1 (homepage polish) and Phase 2 (agent UI shell).
