# Agent Architecture

> The future-state agent runtime — documented now, built progressively from the MVP's single assistant with honest run steps to the homepage's 8-agent roster with tools, approvals, and cadences.

## Where we are: MVP honesty

The MVP (Phases 1–9) is a **single assistant with visible run steps**. The homepage shows an orchestration choreography ("Retrieving September P&L -> Running variance decomposition -> Cross-checking flagged transactions -> Assembling recommendations"); the product must never fake that. The rule: **run steps reflect real gateway stages** — context assembly, model call, validation, persistence. When retrieval arrives in Phase 7, a "Retrieving" step means retrieval actually ran. This keeps the orchestration theater honest and the trust pillars ("Evidence on every number", "Approval before action", "Complete audit trail") true from day one.

The homepage's 8-agent roster (CFO, Finance Analyst, FP&A, Accounting, Reporting, Cash Flow, Audit, Data) is the target state. The lifecycle of the future runtime is illustrated in `../09-diagrams/ai-request-flow.svg`.

## Evolution path

| Stage | Capability | Enabling infrastructure | Timeline |
|---|---|---|---|
| A | Single agent + tools: calculator, ratio library, data queries against the canonical financial model | `ToolDefinition` registry, tool execution service, `ToolCall` audit rows, allow-list policy | Phase 7–8 (financial AI + hardening) |
| B | Specialized agents as configurable personas + tool grants — the 8-agent roster becomes real | Agent registry table (below), per-agent prompt refs, per-agent model policy | Phase 11 (advanced agents/tools, D5) |
| C | Workflows / cadences: month-end close checklist runs on a Trigger.dev schedule, approval gates queue to a human | Trigger.dev scheduled runs (D1 background jobs), approval queue, `AgentRun` persistence | Phase 11+ |
| D | Inter-agent handoffs with a shared ledger of truth | Canonical financial model as shared state, handoff protocol, run-level budgets | Post-MVP |

### Stage B: agent registry design

Agents are configuration, not code paths — the same registry philosophy as models (D4):

| Column | Purpose |
|---|---|
| `agentId` | Stable id: `cfo`, `finance-analyst`, `fpa`, `accounting`, `reporting`, `cash-flow`, `audit`, `data` |
| `systemPromptRef` | Versioned prompt path under `prompts/agent/` |
| `allowedTools` | Allow-list of tool ids; empty = read-and-reason only |
| `approvalPolicy` | `none` \| `mutating-only` \| `all-actions` |
| `modelPolicy` | Tier preference / cap; per-agent override of Auto defaults |

Illustrative mapping of the homepage roster (runs/mo figures on the homepage are marketing, not SLOs):

| Agent | Focus | Key tools (illustrative) | Approval policy |
|---|---|---|---|
| CFO | Executive synthesis, board narrative | `report.read`, `metrics.snapshot` | none (read-only) |
| Finance Analyst | Variance decomposition, driver analysis | `ratio.compute`, `data.query` | none |
| FP&A | Forecasts, scenarios | `model.forecast`, `assumptions.write` | mutating-only |
| Accounting | Reconciliation, journal preparation | `ledger.match`, `journal.propose` | mutating-only (posting gated) |
| Reporting | Board packs, statements | `report.generate` | all-actions (publish gated) |
| Cash Flow | Runway, liquidity, alerts | `cashflow.project`, `alert.create` | mutating-only |
| Audit | Anomaly scans, control checks | `ledger.scan`, `flag.create` | none |
| Data | Integration health, mapping | `connector.check`, `schema.read` | none |

## Tool-calling architecture

```ts
// src/server/ai/tools/types.ts (Phase 8+)
export interface ToolDefinition {
  id: string;            // "ratio.gross_margin", "data.query", "journal.propose"
  description: string;   // consumed by the model and the permission UI
  inputSchema: Record<string, unknown>; // Zod-derived JSON Schema
  danger: "read" | "compute" | "mutating"; // mutating => approval gate
  timeoutMs: number;     // hard cap, default 5_000
  maxRetries: number;    // 0 for mutating tools
}
```

Execution pipeline: model emits a tool call -> execution service validates input against `inputSchema` (Zod) -> permission check against the agent's `allowedTools` and the permission matrix -> if `mutating` and not pre-approved, pause at `AWAITING_APPROVAL` -> execute with timeout -> on failure retry per `maxRetries` -> write a `ToolCall` audit row (agentId, tool id, inputs digest, output digest, status, latency, approval ref) -> feed a filtered result back into context.

Permission matrix (defaults; per-workspace overrides later):

| Action class | Examples | Policy |
|---|---|---|
| Read | query ledger, read reports | Auto |
| Compute | ratios, projections (no side effects) | Auto |
| Mutating, low impact | create alert, save draft view | Auto, audited |
| Mutating, high impact | post journals, send emails, publish reports | **Human approval gate** |

High-impact gates implement the homepage trust pillar "Approval before action": posting journals, sending emails, and publishing reports never execute silently — they queue an approval card listing exact payload, agent, and evidence, and execute only after an explicit human decision.

## Planner / executor loop

Each agentic Run is bounded and budgeted:

- **Bounded steps**: max-iterations default 6 tool rounds per Run (configurable per agent, hard cap 10).
- **Budget cap per Run**: token and cost cap computed from registry pricing (model-selection.md); exceeding it transitions to `FAILED` with reason `BUDGET_EXCEEDED` — never a silent stop.
- **State machine**: `PLANNING -> EXECUTING -> VALIDATING -> AWAITING_APPROVAL -> COMPLETE | FAILED`
  - `PLANNING`: model produces a step plan (or single-step answer path).
  - `EXECUTING`: tool rounds; every call audited.
  - `VALIDATING`: post-processor guardrails — figure fidelity, disclaimer, assumptions block (financial-ai-principles.md).
  - `AWAITING_APPROVAL`: parked at an approval gate; resumes or dies by human decision.
  - `FAILED`: terminal, with a failure reason surfaced in the UI.

## Safety invariants

1. **Agents propose, humans dispose.** Analysis is autonomous; action is gated.
2. **Nothing high-impact executes silently** — every mutating call either passes an approval gate or does not run.
3. **Every run is logged** as `AgentRun` + `ToolCall` rows (D3 deferred entities — schema reserved now, implemented with Stage A/B).
4. **Allow-list only**: a tool not in the agent's `allowedTools` is invisible to it.
5. **Tool output is untrusted input**: fenced as data, never executed as instructions (security-test-plan.md injection suite).
6. **Budgets are hard**: iterations, tokens, cost, and timeouts all have caps that fail loudly.

## What exists in MVP vs later (honesty list)

| Capability | MVP (Phases 1–9) | Later |
|---|---|---|
| Visible run steps | Yes — real gateway stages | Extended with real retrieval/tool steps |
| Single assistant with model selection | Yes | Plus 8 agent personas (Stage B) |
| Tool execution | No (Phase 8 introduces calculator/ratio/query) | Full tool registry + permissions |
| Human approval gates | No (nothing mutating exists) | Approval queue, Stage A mutating tools |
| Scheduled runs / cadences | No | Trigger.dev cadences (Stage C) |
| Inter-agent handoffs | No | Stage D |
| `AgentRun` / `ToolCall` persistence | No (D3 deferred entities, documented) | Implemented with Stage A |
| Multi-agent orchestration theater | Never faked | Real when real |

## Related docs

- [AI Subsystem Design](ai-system-design.md) — gateway stages that MVP run steps mirror
- [Model Selection](model-selection.md) — per-agent model policy inputs
- [Context Management](context-management.md) — what agents may and may not see
- [Financial AI Principles](financial-ai-principles.md) — VALIDATING-stage guardrails
- [Roadmap](../08-roadmap/future-capabilities.md) — phase mapping for Stages A–D
- Diagram: `../09-diagrams/ai-request-flow.svg`
