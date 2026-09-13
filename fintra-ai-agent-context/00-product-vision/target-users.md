# Fintra Target Users

> Purpose: defines who Fintra is built for — seven finance personas with their jobs, pains, adoption triggers, and objections — and who we deliberately exclude.

## Persona map

| Persona | Typical context | Primary job-to-be-done | Dominant pain | Fintra's core value |
|---|---|---|---|---|
| CFO | Series-B SaaS, board pressure | Explain and defend the numbers | Days lost assembling answers; AI that cannot be trusted with board material | Board-ready analysis with Evidence and explicit assumptions |
| Finance Director (FD) | Mid-market, multi-entity | Keep close and reporting on track across entities | Consolidation and variance questions spanning entities and periods | Threaded analysis shaped by Financial Context (entity, period, currency) |
| Financial Controller (FC) | Close and integrity focus | Certify the accuracy of close outputs | Anomalies surface late; AI outputs feel unauditable | Visible Runs, Evidence, audit trail, human approval |
| Management Accountant | Variance and reporting | Produce variance commentary quickly | Manual drill from variance to driver to account | Driver-to-account-to-transaction chains shown step by step |
| FP&A Lead | Forecast and scenario | Model scenarios and defend assumptions | Scenario churn; opaque assumptions in AI tools | Deep analysis mode with explicit, checkable assumptions |
| Financial Analyst | Team of one or two | Turn questions into defensible analysis fast | Underpowered tools; reformatting and rework | Quick answer for orientation, Deep analysis for work product |
| Business Owner (Owner-CFO, SMB) | SMB, wearing the CFO hat | Understand cash, margin, and runway without a finance team | No analyst on demand; jargon-heavy tools | Plain-language, evidence-backed answers without spreadsheet gymnastics |

## Deep profiles

### 1. CFO — Series-B SaaS, board pressure

- **Context:** reporting monthly to a board that asks "why" about every number; small finance team; investor narratives matter as much as accuracy.
- **Jobs-to-be-done:** explain EBITDA and margin movement; pressure-test the forecast before the board sees it; produce defensible commentary in hours, not days.
- **Current workflow pain:** the answer to "why did EBITDA decrease?" requires pulling the FP&A team into spreadsheet archaeology; AI tools she has tried produce impressive prose with no provable numbers.
- **What Fintra does:** asks her questions in the Workspace, watches the Run's steps, and receives driver-level answers with Evidence attached — presentation-grade reasoning she can trace if challenged.
- **Adoption trigger:** the first board cycle where a Thread answer survives CFO-level scrutiny without manual rework.
- **Objection / response:** "Will my board material leak?" — keys and data stay server-side (Browser → backend → Gateway → Provider); ownership-checked Threads; no PII in logs; provider retention policies reviewed at the model-catalog level (D8).

### 2. Finance Director (FD) — mid-market, multi-entity

- **Context:** consolidates several entities with different ledgers and currencies; owns the close calendar; answers to the CFO and the auditors.
- **Jobs-to-be-done:** cross-entity variance questions; consistent reporting packs; keep the close on schedule while answering ad-hoc questions from above and below.
- **Current workflow pain:** every multi-entity question becomes a manual consolidation exercise; context (entity, period, currency) must be restated in every tool, every time.
- **What Fintra does:** Threads carry Financial Context (entity, reporting period, currency — future), so follow-ups stay in scope; answers distinguish consolidated facts from AI interpretation.
- **Adoption trigger:** the first close where the FD answers three consolidation questions from Threads instead of from three spreadsheets.
- **Objection / response:** "Does it understand our entity structure?" — MVP is honest: no integrations yet; the FD supplies context per Thread, and the Financial Context profile (future) formalizes it (D7).

### 3. Financial Controller (FC) — close and integrity focus

- **Context:** owns the close, reconciliations, and controls; personally accountable for anything wrong in the numbers; skeptical by professional training.
- **Jobs-to-be-done:** detect anomalies before others do; ensure every output is traceable; certify the close with confidence.
- **Current workflow pain:** late-surprising anomalies; AI tools that are structurally unauditable are worse than no tools at all.
- **What Fintra does:** shows its work — visible Run steps, Evidence chains from report to driver to account to transaction, and a complete audit trail; the FC approves, the agent proposes (homepage trust pillars).
- **Adoption trigger:** the first evidence chain that helps the FC find a real misclassification faster than manual sampling.
- **Objection / response:** "Will it hallucinate numbers?" — no fabricated figures: missing data is stated as missing; user-provided data, computed facts, and AI interpretation are visibly distinct (D9); every output is traceable to request, model, and prompt version.

### 4. Management Accountant — variance and reporting

- **Context:** produces the monthly management accounts and the commentary that accompanies them; time-pressured, detail-driven.
- **Jobs-to-be-done:** explain variances against budget; draft accurate commentary; keep reporting formats consistent month over month.
- **Current workflow pain:** drilling from a variance to its driver to the underlying account is slow, manual, and repeated every period.
- **What Fintra does:** turns "explain the 5pp margin drop" into a step-shown analysis with the driver chain and Evidence; the accountant edits and signs, not assembles from scratch.
- **Adoption trigger:** the first variance commentary drafted from a Thread that needed only review, not reconstruction.
- **Objection / response:** "Is my data safe?" — data typed into Threads is never exposed to the browser-to-provider path; auth, rate limits, ownership checks, and audit logs are architectural defaults (D8).

### 5. FP&A Lead — forecast and scenario

- **Context:** owns the rolling forecast and scenario models; constantly defends assumptions to the CFO and department heads.
- **Jobs-to-be-done:** build and compare scenarios; articulate which assumptions move the outcome; refresh forecasts without rebuilding everything.
- **Current workflow pain:** scenario churn in spreadsheets; AI tools that produce forecasts without stating assumptions are unusable for board defense.
- **What Fintra does:** Deep analysis mode produces step-by-step reasoning with explicit, checkable assumptions; the FP&A Lead interrogates drivers through follow-ups in the same Thread.
- **Adoption trigger:** the first scenario discussion where assumptions from a Thread are quoted directly in the forecast review.
- **Objection / response:** "Will it hallucinate numbers?" — computed facts are separated from AI interpretation; assumptions must be explicit; uncertainty language is policy, not suggestion (D9).

### 6. Financial Analyst

- **Context:** early-career or lean-team analyst doing whatever analysis the team needs; power user of spreadsheets.
- **Jobs-to-be-done:** answer ad-hoc questions quickly; produce structured first drafts; learn the business's numbers faster.
- **Current workflow pain:** swallowed by reformatting and data gathering; generic AI tools produce text the analyst must fact-check line by line.
- **What Fintra does:** Quick answer for orientation, Deep analysis for work product; Evidence attached so checking is faster than rebuilding; Threads become a personal knowledge trail.
- **Adoption trigger:** the first week where more time is spent reviewing outputs than assembling inputs.
- **Objection / response:** "Why not just use ChatGPT?" — because answers without Evidence and audit trails do not survive contact with a Controller; Fintra's defaults are finance-shaped end to end.

### 7. Business Owner (Owner-CFO, SMB)

- **Context:** runs an SMB with no dedicated finance team; personally watches cash, margin, and runway; wears the CFO hat part-time.
- **Jobs-to-be-done:** understand what changed this month; spot problems early; communicate credibly with the bank, accountant, or investors.
- **Current workflow pain:** drowned in tools designed for accountants, or tools designed for consumers that know nothing about business finance.
- **What Fintra does:** plain-language answers backed by Evidence and explicit assumptions; Quick answer mode respects that the owner's time is fractional.
- **Adoption trigger:** the first month-end where the owner asks one question in the Workspace instead of opening four spreadsheets.
- **Objection / response:** "Is this going to cost more than it saves?" — usage is visible in-product, tiered pricing is transparent, and the MVP's honest scope (no integrations yet) is stated up front.

## Anti-persona: retail traders and casual personal-finance users

Fintra excludes retail traders, crypto speculators, and casual personal-finance users. The exclusion is strategic, not accidental:

- **Different jobs.** They seek an information edge for speculation; our users seek stewardship and control of business finances. Features that serve one actively harm the other.
- **Different trust model.** They tolerate tips and vibes; our users require audit trails and Evidence. Consumer patterns (hype, gamification, prediction) would destroy CFO credibility — our core asset.
- **Different data.** They bring market feeds and portfolios; our users bring ledgers, closes, and forecasts. The Financial Context model would fork to serve both, diluting both.
- **Different economics and risk.** Low-ARPU consumer usage raises support and abuse costs while increasing regulatory exposure around "advice", with no offsetting strategic value.

A second-order exclusion: enterprises seeking to replace finance staff with autonomous agents. That vision contradicts the human-in-the-loop principle and the MVP's honest scope; we will not sell autopilot.

## Related docs

- [Product vision](./product-vision.md) — what these users get, in one page.
- [Product principles](./product-principles.md) — why the anti-persona exclusion follows from principle 12.
- [User journeys](./user-journeys.md) — how these personas actually move through the product.
- [Financial AI safety](../05-ai/financial-ai-principles.md) — the canonical answers to accuracy and trust objections.
- [Security baseline](../03-system-architecture/system-architecture.md) — the D8 mechanics behind "Is my data safe?".
