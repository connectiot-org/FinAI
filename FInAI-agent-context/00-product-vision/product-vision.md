# Fintra Product Vision

> Purpose: the north star of the Fintra documentation package — what the product is, the problem it solves, what it refuses to be, and how success is measured.

## Vision statement

Finance professionals should be able to ask their numbers a question and get an answer they can defend — to a board, an auditor, or themselves at 2 a.m. Fintra is an AI-native financial intelligence platform that makes that possible. Its MVP core is the **Fintra Workspace** at `/agent`: a premium financial AI thread experience where a question becomes a visible **Run** with explicit steps, every substantive claim carries **Evidence**, and the professional — not the model — commands the analysis.

We win not by being the smartest AI in the room, but by being the one a Financial Controller trusts enough to put in front of an audit committee.

## The problem

Three compounding failures define finance teams' current relationship with data and AI:

1. **Data wrangling consumes the week.** Skilled finance professionals spend their hours exporting ledgers, reconciling spreadsheets, and reformatting reports instead of interpreting them. The question a CFO actually needs answered — "why did EBITDA decrease this month?" — takes days of mechanical work before a single insight appears.
2. **AI arrives black-box.** Finance has spent two decades building controls: segregation of duties, audit trails, review gates. Most AI tools discard all of it. A prompt goes in, a confident paragraph comes out, and nothing shows which numbers were used, which assumptions were made, or what was ignored. A Controller cannot sign off on what they cannot see.
3. **Generic chatbots are unusable for finance.** Consumer chat tools have no concept of a reporting period, an entity, a chart of accounts, or a materiality threshold. They hallucinate figures fluently, refuse to show their working, and treat "show your sources" as an afterthought. Finance professionals have tried them, been burned, and returned to spreadsheets.

The result is inverted incentives: the people most accountable for numbers have the least AI leverage, and the AI tools with the most leverage are the least accountable.

## What Fintra is

Fintra is a workspace where finance professionals converse with models that behave like disciplined analysts:

- Questions become **Threads**; answers arrive as streaming **Runs** with visible steps (retrieve, analyse, cross-check, quantify, recommend) — the orchestration visual language the live homepage already prototypes.
- Claims carry **Evidence** — data references attached to answers — and the distinction between user-provided data, computed facts, and AI interpretation is visible in the product, not buried in a disclaimer (D9).
- The **Model Selector** exposes multiple models grouped into tiers (Fast / Balanced / Reasoning / Open) via the Fintra AI Gateway, with OpenRouter as primary provider; the user chooses the horsepower each question deserves.
- **Answer modes** — Quick answer for orientation, Deep analysis for methodical, step-shown work — match effort to stakes.

## What Fintra is explicitly not

| Fintra is not | Why the boundary matters |
|---|---|
| A generic chatbot | Every default — prompts, Answer modes, Evidence, disclaimers — is finance-specific. We do not compete with "ask anything" tools and will not blur into them. |
| An autopilot | Agents propose, humans dispose. The MVP initiates nothing on the user's behalf, writes nothing to ledgers, executes no payments; any future action-taking ships behind explicit approval gates. |
| Financial advice | Fintra produces analysis with explicit assumptions and honest uncertainty language; decisions and sign-off remain the professional's. A consistent "not financial advice" policy applies (see 05-ai). |
| A black box | Every AI output is traceable to the request, the model, and the prompt version. If we cannot show our work, we do not ship the feature. |
| A data platform (yet) | The MVP has no integrations and no canonical financial model; connectivity is a post-MVP phase. We are honest about this rather than simulating it in product UI. |

## The core experience loop

1. **Homepage** — a finance professional lands on the site and recognizes their world: auditable agents, evidence chains, close timelines. The primary CTA "Open the live demo" routes to `/agent` (wired in Phase 1 per D5).
2. **Financial AI Agent (Fintra Workspace)** — after the sign-in gate, a Composer-first empty state invites the first question; suggested financial prompts remove the cold-start blank page.
3. **Model selection** — the Model Selector and the Answer mode set the effort/quality trade-off before asking. Defaults are opinionated; overrides are one click.
4. **Financial analysis / conversation** — the Run streams its steps and the answer; Evidence is attached; follow-up questions drill into drivers, periods, or assumptions inside the same Thread.
5. **Future tools** — the same loop will later wrap files and connected data, structured financial workflows (close, forecast, board packs), and approval-gated agent actions. The Thread is the durable container across all of it.

## MVP scope vs future platform

| Horizon | Contents | Phases (per D5) |
|---|---|---|
| MVP | Homepage polish with real CTAs to `/agent`; Agent UI shell; backend foundation; authentication; model layer (registry, gateway, OpenRouter adapter, streaming); conversations and chat; financial AI prompt library and guardrails; testing hardening; production hardening | P1–P9 |
| Post-MVP platform | Files and data (uploads, connectors); advanced agents and tools (scheduled runs, approval gates); billing and scale (subscriptions, usage metering, org RBAC) | P10–P12 |

The MVP deliberately ships conversation before connectivity: trust mechanics — Evidence, auditability, streaming, model routing — are the hard, differentiating part, and they do not depend on integrations to prove value.

## What "good" looks like

Success is measured in trust first, then adoption, then speed. Baseline targets for the first post-MVP quarter:

| Category | Metric | Target |
|---|---|---|
| Trust | Evidence-attachment rate (substantive answers carrying Evidence) | ≥ 90% |
| Trust | Answers citing unverified figures as fact (fabrication incidents) | Zero tolerated; every report triaged and root-caused |
| Trust | Returning users who export or audit Threads | Tracked; growth indicates auditability is real, not decorative |
| Performance | Workspace first streamed token (p50) | < 2s; server first byte < 1s (D10) |
| Performance | Thread list interaction | < 100ms optimistic (D10) |
| Performance | Homepage LCP / INP | < 2.5s / < 200ms (D10) |
| Adoption | Weekly active finance professionals | Week-over-week growth from the first cohort |
| Adoption | Threads per active user per week | ≥ 3 sustained |
| Adoption | Follow-up rate within a Thread | ≥ 50% — evidence the first answer earns a second question |
| Quality | Run error and retry rates | Declining; every failure surfaces an explicit state, never a silent hang |

The homepage claims a 3.2s median answer time. The D10 budgets (first token < 2s p50) exist so the real product beats the marketing claim, not merely matches it.

## Related docs

- [Product principles](./product-principles.md) — the twelve rules the vision must obey.
- [Target users](./target-users.md) — who this is for, and who it is deliberately not for.
- [User journeys](./user-journeys.md) — first-touch, first value, and the habit loop.
- [Project context](../01-context/project-context.md) — the master context file any coding agent loads first.
- [Agent UI spec](../02-ui-ux/agent-ui-spec.md) — how the experience loop becomes interface.
- [Model strategy](../05-ai/model-selection.md) — tiers, routing, and the Model Selector contract.
- [Financial AI safety](../05-ai/financial-ai-principles.md) — Evidence, uncertainty, and disclaimer policy.
- [User journey diagram](../09-diagrams/user-journey.svg) — visual companion to the journeys.
