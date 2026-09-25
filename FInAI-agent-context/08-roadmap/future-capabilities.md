# Future Capabilities — Post-MVP Phases 10–12 and the Homepage 8-Agent Roster

The MVP (Phases 1–9) ships the Fintra Workspace: authenticated threads, streaming answers from a registry of models, and a financially disciplined, guarded answer layer. This document maps the full capability vision from the product brief — the seventeen financial capabilities — onto post-MVP Phases 10–12, and maps the homepage's implied 8-agent roster onto the infrastructure each agent needs.

Headline claim, stated explicitly: **the MVP architecture supports every capability below without redesign.** The extension points are listed at the end.

## Phase 10 — Files & Data

Brings the user's real financial data into the Workspace and replaces the mocked Financial Context.

| Capability | Description | User value | Prerequisite infrastructure | Approval / control requirements | Data needed |
|---|---|---|---|---|---|
| Document analysis | Read PDFs (board packs, invoices, statements) and answer questions over them | CFO gets answers from the documents they already have, not re-typed numbers | Files pipeline (upload, scan, extraction), `Attachment` entity (deferred in D3), document storage | File-type allow-list, malware scan, per-file access control, extraction review | PDFs, statements, board packs |
| Spreadsheet analysis | Ingest XLSX/CSV, map columns, analyse tabular data with formulas shown | Management accountants work in their existing workbooks | Files pipeline, tabular parser, Geist Mono table rendering (already shipped in P7) | Column-mapping confirmation before analysis, export controls | Trial balances, budgets, actuals exports |
| Canonical financial model | Normalized chart of accounts, entity/period/currency profile, trial-balance ingestion | Every answer is anchored to one ledger of truth | New entities (documented deferrals in D3): canonical model tables, real `Financial Context` injection replacing the P7 mock | Mapping-review workflow (AI-suggested account mappings confirmed by the FC) | Chart of accounts, trial balances, entity metadata |
| Integrations import | Connections to accounting systems (Xero, QuickBooks, Sage, NetSuite), banks, payments (Stripe) — as surfaced on the homepage integrations grid | Fresh data without manual exports | OAuth integrations, sync jobs (Trigger.dev arrives in P11; initial pull can be manual), integration credentials vault | Connection-level consent, scoped read permissions, revocation UI | API credentials per source; ledger, bank, and payment data |

User value of the phase as a whole: the guardrails and labeling built in P7 finally operate on real numbers; Evidence starts pointing at real accounts and documents.

## Phase 11 — Advanced Agents & Tools

Activates the agent roster and gives the model hands — the analysis and automation capabilities.

| Capability | Description | User value | Prerequisite infrastructure | Approval / control requirements | Data needed |
|---|---|---|---|---|---|
| Variance analysis (automated) | Scheduled and on-demand budget-vs-actual decomposition with drivers | The monthly "why did EBITDA move?" answer in minutes, evidence attached | P7 prompt library, canonical model (P10), agent runtime | Draft-then-approve for circulated analyses | Actuals, budgets, prior periods |
| Forecasting | Driver-based forecasts from historicals with assumptions stated | Forward view without spreadsheet rebuilds | Agent runtime, canonical model, forecasting prompts (`prompts/forecasting/`) | Assumption sign-off before forecasts are circulated | 12–36 months of history, budget targets |
| Budgeting | Build and track budgets in conversation; export to sheets | Budgets maintained where the analysis happens | Canonical model, tools (write-back later), reporting prompts | Approval gate before a budget is committed or shared | Historical actuals, department inputs |
| Scenario modelling | What-if branches (price, volume, cost, hiring) with comparisons | Board-ready scenarios in hours, not weeks | Agent runtime, scenario entities, forecasting stack | Scenario naming/versioning, explicit assumption diffs | Historicals, driver assumptions |
| Financial modelling | Multi-statement models (P&L, balance sheet, cash flow linkage) | Investment-grade modelling on demand | All of the above plus model-validation tooling | Calculation-transparency review (D9 step-by-step rule already enforced) | Full historical financials |
| Cash-flow analysis | Inflow/outflow decomposition, runway, minimum-cash scenarios | Liquidity confidence for the FD/FC | Bank/payment data (P10), canonical model | Read-only analysis by default | Bank transactions, receivables/payables |
| KPI analysis | Define, compute and track KPIs (GM%, DSO, CAC, burn) | One agreed set of numbers with evidence | KPI definitions entity, canonical model, scheduled runs | KPI definition sign-off (one definition per metric) | Ledger detail, CRM data for CAC-class metrics |
| Anomaly detection | Flag unusual transactions and patterns with reasons | Catches what periodic review misses | Agent runtime, scheduled cadences (Trigger.dev), `AgentRun`/`ToolCall` entities | Findings enter the approvals/review queue, never auto-post | Transaction-level history |
| Accounting analysis | Accruals checks, reconciliation status, close-checklist support | Faster, safer close | Canonical model, tools, error-detection prompts (`prompts/error-detection/`) | Proposal-only mode; postings require human approval | Full ledger, reconciliation data |
| Board reporting / financial reporting | Generated board packs and report artifacts from live data | Hours of pack assembly replaced | `ReportArtifact` entity (deferred in D3), reporting prompts, agent runtime | Human approval before any pack leaves the building | Actuals, KPIs, narrative inputs |
| Financial narratives | Written commentary (management commentary, MD&A-style) grounded in computed facts | First-draft narrative that never invents numbers | P7 principles + guardrails, report artifacts | Editorial approval workflow | KPIs, variance results, period data |
| Business performance analysis | Cross-cutting review combining the above into a performance story | The CFO-level weekly view | Agent runtime orchestrating the specialized agents | Summary approval; drill-down evidence preserved | All of the above |
| Scheduled agent runs / cadences | Overnight runs (the homepage's "works while you sleep" timeline made real) | Wake up to matched, flagged, summarized results | Trigger.dev (D1 planned dependency), `AgentRun` entities, cadence configuration | Run windows, cost caps per cadence, failure alerts | Whatever each cadence consumes |
| Approvals queue | Human approval before consequential actions | "Every action passes through you" — operationalized | Approvals queue entity, agent runtime, notification surface | Every queued action requires explicit approve/reject with audit trail | Action context per agent |

Prerequisite infrastructure shared by most of Phase 11: the agent runtime per `../05-ai/agent-architecture.md` (AgentRun, ToolCall, tools interface, orchestration), the canonical model from P10, and the approvals queue. None of these exist as code in the MVP; all exist as documented deferrals in D3 and as reserved interfaces.

## Phase 12 — Billing & Scale

Turns the platform into a business.

| Capability | Description | User value | Prerequisite infrastructure | Approval / control requirements | Data needed |
|---|---|---|---|---|---|
| Organizations & full RBAC | `Organization`/`Membership` entities, team roles (CFO, FD, FC, analyst scopes) | Real finance teams, not just solo users | Org entities (deferred in D3), org-scoped ownership checks on all reads/writes | Role definition matrix, invite/approval flow | Team structure per customer |
| Usage-based billing | `BillingRecord` entity, plan tiers (the homepage's Starter/Growth/Enterprise made real), usage metering from `UsageRecord` | Predictable monetization aligned to AI cost | Metering already collected (`AIRequest`/`UsageRecord`), billing provider integration | Plan-gated feature flags, spend caps per plan | Usage aggregates, plan catalog |
| Enterprise controls | Audit-log exports, retention policy, SSO-ready auth extension | Procurement and audit readiness | `AuditLog` (already shipped), export tooling, auth provider abstraction | Customer-configurable retention and export approval | Customer policy settings |
| Scale operations | Multi-region posture, cost dashboards, per-tenant quotas | Reliable service as volume grows | Everything from P9 plus per-tenant metering | Quota policies, abuse detection | Per-tenant usage |

## The homepage-implied capabilities — the 8-agent roster

The homepage presents eight specialists over one ledger of truth. Mapping each to the MVP infrastructure it needs:

| Agent (homepage) | MVP infrastructure it already has | What it additionally needs |
|---|---|---|
| CFO agent | Reasoning-tier models, financial system prompt (P7), Run steps + Evidence UI | Agent runtime, approvals queue, tools (P11); scheduled performance reviews (Trigger.dev) |
| Finance Analyst | Quick/Deep modes, analysis prompts, guardrails, tables | Real data via P10; variance/KPI tooling (P11) |
| FP&A agent | Forecasting/analysis prompt folders exist from P7 | Forecasting stack, scenario entities, canonical model (P10–P11) |
| Accounting agent | Error-detection prompt folder from P7 | Ledger access (P10), reconciliation tools, proposal-only posting (P11) |
| Reporting agent | Reporting prompt folder, structured output rendering | `ReportArtifact` entity, pack assembly tools, approval workflow (P11) |
| Cash Flow agent | Streaming + evidence infrastructure | Bank/payment integrations (P10), cash-flow tooling (P11) |
| Audit agent | `AuditLog` (P3/P4), anomaly prompt surface | Transaction history (P10), anomaly detection cadences, review queue (P11) |
| Data agent | Registry, mock Financial Context card | Files pipeline, integrations, canonical model (P10) — this agent is P10 embodied |

Reading: the MVP deliberately builds the shared spine (Workspace, registry, gateway, prompts, guardrails, evidence, audit) that every agent reuses; the roster differentiates later through the extension points below.

## Architecture extension points (why no redesign is needed)

- **Model registry**: new models/tiers are data changes in `src/config/models.config.ts` + `ModelCatalog` rows — no UI or gateway changes (D4).
- **Prompts library**: `prompts/` is versioned data; new capabilities (forecasting, board packs) add folders/files consumed by the assembler (D2, P7).
- **Tools interface**: the agent runtime (`../05-ai/agent-architecture.md`) defines a tools port the gateway already isolates; MVP ships none, blocks nothing.
- **Deferred entities**: `Organization`, `Membership`, `Attachment`, `Prompt` rows, `AgentRun`, `ToolCall`, `ReportArtifact`, `BillingRecord` are documented in D3 with the conventions they will follow.
- **Financial Context**: the assembler reserves the context slot and the card exists (P7); real injection is a data swap.
- **Evidence panel**: message parts already include evidence slots; richer evidence is a renderer change, not a schema change.
- **`ProviderAdapter` port**: direct OpenAI/Anthropic/Google adapters, or a future gateway swap, do not touch the UI or services (D1, `../05-ai/provider-abstraction.md`).
- **`RateLimiter` interface**: in-memory → Upstash swap is invisible to callers (D1).
- **Approvals queue**: the D9 "approval before action" principle is already enforced at the product level; the queue formalizes it when tools arrive.
- **Layering**: all new capabilities enter through services → domain → infra per D2; no capability requires bypassing the Zod/ownership/security conventions.
