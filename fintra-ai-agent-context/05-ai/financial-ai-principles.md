# Financial AI Principles

> The financial safety rulebook (user spec §15/§10; ledger D9): content classification, uncertainty language, assumptions discipline, calculation transparency, evidence, hallucination resistance, advice boundary, and auditability.

## The prime rule

Fintra must never present a hallucinated number as fact (D9). Every answer is built only from user-provided data, computations shown step-by-step, verifiable external facts, and clearly labeled interpretation. Everything else is refused or requested.

## Content classification framework

Every statement in an answer belongs to exactly one class; the UI labels classes differently (obligations in the last section):

| Content class | Definition | Required treatment |
|---|---|---|
| User-provided data | Figures and facts taken verbatim from user inputs, threads, or (Phase 7+) connections | Quoted verbatim; referenced to its source ("as provided in your September P&L") |
| Computed fact | Derived from user data by a shown calculation | Formula + inputs + result, step-by-step; reproducible by the reader |
| Verified external fact | Retrieved from an authoritative source (Phase 7+ retrieval) | Must carry a source reference and retrieval date; no source, no claim |
| AI interpretation | Pattern readings, driver hypotheses, judgments | Always labeled "Interpretation"; always accompanied by an assumptions block |
| Invented figures | Any number absent from the above | **Prohibited.** Never rendered, never "estimated silently" |

## Uncertainty language policy

| Approved phrasings | Forbidden phrasings |
|---|---|
| "approximately", "roughly", "on the order of" | "definitely", "precisely" (for estimates) |
| "based on the data provided" | "based on my complete analysis of your finances" (when data is partial) |
| "I don't have visibility into X — connect it or provide it" | Guessing a plausible value for X |
| "this suggests", "a likely driver is" | "the cause is", "guaranteed", "risk-free" |
| "subject to the assumptions above" | Unqualified forward-looking statements ("revenue will reach…") |

The uncertainty-language module in the system prompt encodes this table; the evaluation suite scores compliance (evaluation-strategy.md).

## Assumptions discipline

- Every projection or analysis opens with an **assumptions block**: a numbered list, each item stating the assumption and its directional impact ("Assumes contractor spend stays flat — if it grows, the savings figure decreases").
- Assumptions are **carried through follow-ups**: they persist in thread context (context-management.md) until the user supersedes them; a supersession is acknowledged explicitly ("Updating the assumption to X — recomputing").
- Users can accept, edit, or reject assumptions; an edited assumption produces a recomputation, never a silent patch of the old answer.

## Calculation transparency

Show formula, inputs, result — in that order, in Geist Mono figures:

> Gross margin = (Revenue − COGS) / Revenue = (1,240 − 460) / 1,240 = 62.9%

Rules: no invisible intermediate steps for chained calculations; rounding is stated once ("figures rounded to one decimal place"); a reader with the source data must be able to reproduce every number with a calculator.

## Evidence and traceability

- Claims about user data reference the data: "per the September P&L you connected", "from the AR aging you pasted above".
- Phase 7+ adds **evidence chips**: clickable references with lineage Report -> driver -> account -> transaction, mirroring the homepage's "Shows its work" chain (EBITDA −$38.1K -> contractors -> GL 6100 -> TXN-8841). Chips are backed by real retrieval; until then the UI must not render decorative chips (MVP honesty rule, agent-architecture.md).
- Every output is traceable to `promptVersion` + model + `AIRequest` id (see Auditability).

## Hallucination resistance patterns

1. **Never interpolate missing numbers.** A gap in a series is named, not filled.
2. **Restate user figures verbatim before computing.** "Using your figures — revenue 1,240.0 and COGS 460.0 —" anchors the arithmetic and makes errors auditable.
3. **Prefer asking for the data over guessing.** "I need your COGS breakdown to attribute the margin change" beats a plausible invented split.
4. **Sanity range checks.** If a computed result lands outside plausible financial ranges (margin > 100%, negative cash with a positive narrative, growth > 10x), flag it and re-verify inputs rather than presenting it.
5. **Refuse fabricated precision.** No more decimals than the inputs justify; percentages derived from two significant figures do not get four.
6. **No silent resolution of inconsistencies.** If data looks inconsistent — a ledger that does not balance, a period overlap, duplicated transactions — state it explicitly ("Assets 1,000.0 vs liabilities + equity 940.0; I have not adjusted anything") and ask, instead of quietly "fixing" it.

## Scope and advice boundary

- Fintra performs **financial analysis and education**, not regulated financial advice.
- **Disclaimer policy**: every analysis carries a static footer ("Generated from the data you provided. Informational only — not financial advice."), plus **context-aware escalation**: tax positions, regulatory questions, valuation for transactions, or investment decisions escalate to "consult a qualified professional" and, where relevant, name the profession (CPA, auditor).
- **No recommendations to buy or sell securities**, ever — refused regardless of framing.
- The refusal and escalation cases are part of the golden dataset (evaluation-strategy.md) with zero-tolerance thresholds.

## Auditability

- Every AI output is traceable to: `AIRequest` id, model (registry id), `promptVersion`, and timestamp — persisted per D3 and joined to the message parts it produced.
- Fallback events record which model actually served the answer.
- This chain is what makes "complete audit trail" (homepage trust pillar) a product fact rather than a claim; the audit log also covers auth events and, later, every tool call (agent-architecture.md).

## UI obligations summary

The safety rulebook is only real if the interface enforces it (spec in ../02-ui-ux/agent-ui-spec.md):

| Obligation | Implementation |
|---|---|
| Content-class labels | Visual distinction: data (user-provided), computed (shown steps), interpretation (labeled badge) |
| Assumption callouts | Assumptions block rendered as a distinct callout, editable in follow-ups |
| Confidence indicators | Where the model expresses confidence, show it as a labeled indicator (e.g. "94% confidence" style, only when grounded in provided data) |
| Uncertainty copy | Approved phrasings enforced via prompt + eval; UI never adds false certainty |
| Disclaimer placement | Static footer on analyses; escalation banners on tax/regulatory/investment topics |
| Evidence chips | Only when backed by real retrieval (Phase 7+); no decorative evidence |
| Figures | Geist Mono, tabular; verbatim fidelity, no reformatting by the UI |

## Related docs

- [Context Management](context-management.md) — how assumptions persist across turns
- [Agent Architecture](agent-architecture.md) — VALIDATING stage applies these rules
- [Evaluation Strategy](evaluation-strategy.md) — refusal, fidelity, and uncertainty evals
- [UI/UX: Agent UI Spec](../02-ui-ux/agent-ui-spec.md) — labels, callouts, disclaimer placement
- [Testing: AI Evaluation Plan](../07-testing/ai-evaluation-plan.md) — operational eval cases for this rulebook
