# Fintra User Journeys

> Purpose: maps the three journeys that define the Fintra product — first touch, first value, and the weekly habit loop — with friction and metrics per stage.

Stage tables use: Stage / Actions / Thoughts / Emotions / Fintra touchpoints / Opportunities. The visual companion is `../09-diagrams/user-journey.svg`.

## J1 — First touch: homepage to the door of the Workspace

| Stage | Actions | Thoughts | Emotions | Fintra touchpoints | Opportunities |
|---|---|---|---|---|---|
| 1. Land | Arrives from search, referral, or community; hero renders within budget (LCP < 2.5s) | "Is this another chatbot?" | Skeptical curiosity | Hero: "Your finance team, run by agents you can audit." | Lead with auditable positioning, never generic AI hype |
| 2. Orient | Scans the simulated workspace visual and value props | "Do they actually understand finance workflows?" | Measured interest | Run-step visual ("Why did EBITDA decrease this month?"), evidence-chain story | Keep storytelling concrete: drivers, evidence, confidence |
| 3. Verify | Reviews trust section, agent cards, honesty note | "Is this demo honest about being a demo?" | Growing trust | Trust and control section; "Honest by design" note | Honesty is a conversion asset; preserve it |
| 4. Commit | Clicks "Open the live demo" | "Let's see the real thing" | Anticipation | Primary CTA → routes to `/agent` (wired in Phase 1, D5) | One consistent CTA everywhere; no dead ends |
| 5. Handoff | Arrives at the `/agent` sign-in gate | "Was that the right click?" | Impatience if anything is slow | Sign-in page consistent with brand system | Sub-1s navigation; one sentence on why an account exists |

## J2 — First value: sign-in to first Evidence-backed answer

| Stage | Actions | Thoughts | Emotions | Fintra touchpoints | Opportunities |
|---|---|---|---|---|---|
| 1. Gate | Signs in with Google or email + password | "Hope this is quick" | Mild friction | Auth.js v5 sign-in; middleware-protected `/agent` | One-click OAuth; precise error messages |
| 2. Empty state | Sees the Composer-first Workspace | "What can it actually do?" | Cautious openness | Centered Composer with Answer mode and Model Selector inline; suggested financial prompts | Suggested prompts are the cold-start cure; defaults work with zero configuration |
| 3. Ask | Types a first question (e.g. "why did margin drop?") | "Let's see if it knows finance" | Testing | Composer; Answer mode defaults to Quick answer | Sensible defaults; no setup dialogs |
| 4. Watch | Observes the Run stream its steps | "It is showing its work" | Surprise turning to relief | Run steps: retrieve → analyse → cross-check → quantify → assemble | First token < 2s p50; steps visible from the first moment |
| 5. Absorb | Reads the answer; opens the Evidence panel; checks assumptions | "Can I defend this to my FD?" | Trust building | Answer with Evidence attached; data vs interpretation distinction visible (D9) | Evidence summaries that expand to full references |
| 6. Follow up | Asks a drill-down in the same Thread | "It remembers the context" | Engagement | Threaded follow-ups; sticky model per Thread | Finance-shaped follow-up suggestions (driver, period, assumption) |

## J3 — Habit loop: weekly return, deeper work, usage awareness

| Stage | Actions | Thoughts | Emotions | Fintra touchpoints | Opportunities |
|---|---|---|---|---|---|
| 1. Return | Comes back during the weekly close or forecast rhythm | "This saved me an hour last week" | Reliance | `/agent` home with recent Threads | Align with the finance calendar; future scheduled runs (P11) |
| 2. Resume | Reopens a prior Thread or starts a new one | "Where was that analysis?" | Control | Thread history sidebar; automatic titles | Thread search and naming conventions (future) |
| 3. Deepen | Switches the Model Selector to the Reasoning tier and Deep analysis for board-pack work | "I want the strongest model on this one" | Deliberate | Model Selector with tier, latency, and capability metadata | Honest cost/latency metadata per model (D4) |
| 4. Monitor | Checks usage indicators before and after heavy analysis | "Am I burning through my plan?" | Prudence | Usage surfaced from `UsageRecord` | Usage transparency before billing exists (P12) |
| 5. Expand | Organizes Threads around the close cycle; exports for audit trail | "This is my working paper file" | Ownership | Thread management; export path to future Reports library | Saved analyses and reports library (post-MVP, per Perplexity Spaces analog) |

## Friction inventory

| # | Friction | Journey / stage | Severity | Mitigation | Phase |
|---|---|---|---|---|---|
| 1 | Today the CTA promises a demo but no `/agent` workspace exists | J1.4 | Critical | Build the Workspace; wire homepage CTAs to `/agent` | P1–P2 |
| 2 | Sign-in gate causes cold-start abandonment | J2.1 | High | One-click Google OAuth; explain account value in one line | P4 |
| 3 | Blank-Composer paralysis | J2.2 | High | Suggested financial prompts; opinionated defaults | P2, P7 |
| 4 | Streaming latency feels broken or silent | J2.4 | High | D10 budgets; visible steps; explicit error/retry/stopped states | P5–P6 |
| 5 | Users cannot verify claims in the answer | J2.5 | High | Evidence panel; user data vs computed facts vs AI interpretation made visible | P7 |
| 6 | Model choice confusion (too many names, no guidance) | J3.3 | Medium | Tier metadata; opinionated Auto default with logged fallbacks | P5 |
| 7 | Usage anxiety without billing clarity | J3.4 | Medium | Surface usage early; document tier pricing in-product | P9, P12 |
| 8 | Weekly habit fails to form after a weak first answer | J3.1 | High | Quality bar on first answers; follow-up suggestions; later cadence features | P6 onward, P11 |

## Metrics per stage

| Journey | Stage | Metric | Target signal |
|---|---|---|---|
| J1 | Land | Homepage LCP / INP | < 2.5s / < 200ms (D10) |
| J1 | Commit | Homepage primary-CTR | Rising; single CTA, no competing buttons |
| J1 | Handoff | Click-to-Workspace navigation | < 1s; near-zero bounce on `/agent` arrival |
| J2 | Gate | Sign-in completion rate | High OAuth share; failures under 1% |
| J2 | Empty state | First-question latency (time to first prompt sent) | Median under 60s from arrival |
| J2 | Watch | First streamed token (p50) | < 2s; server first byte < 1s (D10) |
| J2 | Absorb | Evidence-attachment rate | ≥ 90% of substantive answers |
| J2 | Follow up | Follow-up rate within first Thread | ≥ 50% |
| J3 | Return | Weekly active finance professionals | Week-over-week growth |
| J3 | Resume | Threads per active user per week | ≥ 3 sustained |
| J3 | Deepen | Model switches to Reasoning tier per user per week | Tracked; indicates multi-tier value |
| J3 | Monitor | Usage-page awareness | Tracked; prerequisite for billing (P12) |

## Related docs

- [Product vision](./product-vision.md) — the success metrics these journeys feed.
- [Target users](./target-users.md) — whose emotions and thoughts these tables describe.
- [Project context](../01-context/project-context.md) — phase order referenced above.
- [Agent UI spec](../02-ui-ux/agent-ui-spec.md) — the touchpoints made concrete.
- [Model strategy](../05-ai/model-selection.md) — Model Selector and Auto behavior behind J3.3.
- [User journey diagram](../09-diagrams/user-journey.svg) — visual companion.
