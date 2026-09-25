# Phase 7 — Financial AI: specialization, safety, and evals

| Field | Value |
|---|---|
| Roadmap phase | P7 — Financial AI (prompt library, guardrails, context, structured outputs) |
| Depends on | P6 (working chat loop with persistence) |
| Estimated effort | M–L |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../05-ai/financial-ai-principles.md` |

## OBJECTIVE

Make Fintra's answers financial-grade: a versioned prompt library, a base financial system prompt implementing the D9 principles, Quick/Deep answer modes, structured financial output rendering, a Financial Context placeholder card, guardrail post-processing, basic prompt-injection fencing, and a 20-case golden eval suite with a documented workflow.

## CONTEXT

The product loop works end-to-end after Phase 6, but answers are generic. This phase encodes the trust layer — the core differentiator ("Every number carries evidence. Every action passes through you."). The financial AI principles are canonical in `../05-ai/financial-ai-principles.md`: interpretation labeling, explicit assumptions, step-by-step calculation transparency, uncertainty language, refusal to invent figures, disclaimer policy, evidence-first answers, and auditability (every output traceable to request, model, prompt version). The prompt library location is fixed by D2 at repo-root `prompts/`.

## INPUTS

- `../05-ai/financial-ai-principles.md` — mandatory content of the base financial system prompt.
- `../05-ai/context-management.md` — prompt assembly order (system → financial context → conversation).
- `../01-context/project-context.md` — D7 glossary, D8 injection-defence baseline, D9 principles summary.
- Phase 6 output: chat-service assembly point, message part renderers, mode switch.

## TASKS

1. Scaffold the prompt library at repo root `prompts/` per D2: `system/`, `financial/`, `analysis/`, `reporting/`, `forecasting/`, `error-detection/`, `agent/`, `model-specific/`, plus `prompts/README.md` documenting the rules: markdown files with frontmatter (id, version, tier affinity, description), kebab-case naming, versioning policy (never edit a shipped version — add a new version), and the rule that prompt files are data loaded by the assembler, never imported as code.
2. Base financial system prompt `prompts/system/base-financial-system.md` implementing every principle in `../05-ai/financial-ai-principles.md`: labeled interpretation blocks ("Interpretation:"), a mandatory Assumptions block whenever inputs are incomplete, step-by-step calculation transparency, an uncertainty-language policy, the refusal rule (never invent figures — state exactly which data is missing), and the disclaimer policy.
3. Answer modes: `prompts/financial/quick-answer.md` and `prompts/financial/deep-analysis.md`; `src/server/ai/prompts/prompt-assembler.ts` loads and composes versioned prompts by mode and model tier — Quick defaults to the Fast tier with lower max output; Deep uses Balanced/Reasoning tiers with the richer instruction stack. Mode and prompt versions are recorded on the `AIRequest` row for auditability.
4. Structured financial outputs: extend the system prompt to emit markdown tables for tabular financial results; add `src/components/agent/financial-table.tsx` rendering markdown tables with Geist Mono tabular figures per D6, reusing the Phase 2 part renderers.
5. Financial Context placeholder: `src/server/domain/financial-context.ts` defines the future injected profile shape (entity, reporting period, currency, integrations, data as-of date); `src/components/agent/financial-context-card.tsx` renders a clearly-mocked instance in the Workspace; the assembler reserves a Financial Context slot per `../05-ai/context-management.md` (empty for now).
6. Guardrails `src/server/ai/guardrails/`: post-processing hooks that run on every completed stream — `label-check.ts` (flags unlabeled numeric claims), `disclaimer-check.ts` (verifies disclaimer presence per policy), `figure-restate.ts` (user-provided figures are restated as user-provided, never as AI-computed). Violations attach a warning part to the message; guardrails never silently rewrite content.
7. Injection fencing `src/server/ai/guardrails/injection-fencing.ts`: user-pasted content blocks (files and emails arrive in later phases) are wrapped in delimited, role-labeled frames instructing the model to treat the content as data; validated against a small adversarial corpus kept in `src/server/ai/guardrails/__fixtures__/`.
8. Evals: `evals/golden-cases/` — 20 golden cases as JSON (id, prompt, mode, expected behaviours: labeling, assumptions, table format, refusal) covering variance analysis, margin questions, forecasting, cash-flow, anomaly detection and refusal-to-invent cases; `evals/run-evals.ts` runs them through the gateway (fixture or live mode via env) and `evals/eval-workflow.md` documents the manual run procedure and scoring rubric.
9. Wire the modes into the Composer and the model defaults per tier (the Phase 2 mode switch now drives prompt assembly and gateway parameters).

## CONSTRAINTS

- Prompt files are data; the assembler is the only loader. No prompt text inline in TypeScript beyond glue.
- Every AI call records the prompt id and version on the `AIRequest` row (D9 auditability).
- No real data integrations (Phase 10); Financial Context stays mocked.
- No tools or function calling (Phase 11, per `../05-ai/agent-architecture.md`).
- Guardrails annotate and flag; they never fabricate corrections.

## EXPECTED OUTPUT

Asking "Why did EBITDA decrease this month?" in Deep mode produces: labeled interpretation blocks, an explicit assumptions block, a step-by-step calculation with a markdown table, uncertainty language, the disclaimer, and evidence slots — rendered with Geist Mono figures. A prompt trying to make the model invent a revenue number is refused with a statement of the missing data. `evals/run-evals.ts` passes all 20 golden cases on the chosen default model.

## FILES TO CREATE OR MODIFY

- `prompts/**` (library scaffold, base prompt, mode prompts, `prompts/README.md`)
- `src/server/ai/prompts/prompt-assembler.ts`
- `src/server/services/chat-service.ts` (assembly, guardrail hooks, prompt-version recording)
- `src/server/ai/guardrails/*`
- `src/server/domain/financial-context.ts`
- `src/components/agent/financial-context-card.tsx`, `src/components/agent/financial-table.tsx`
- `evals/golden-cases/*.json`, `evals/run-evals.ts`, `evals/eval-workflow.md`

## TEST REQUIREMENTS

- Guardrail unit tests: disclaimer present/absent; label-check catches unlabeled figures; figure-restate marks user-provided numbers; the adversarial corpus produces fenced prompts with content treated as data.
- Assembler tests: each mode resolves the correct prompt set and records versions; unknown modes are rejected; all prompt files parse with valid frontmatter.
- Eval suite: `evals/run-evals.ts` passes all 20 golden cases on the default model (fixture mode in CI; a documented live run locally).
- Regression: the Phase 6 persistence/streaming suites stay green.

## ACCEPTANCE CRITERIA

- [ ] The variance-analysis demo output is labeled (data vs interpretation), assumption-explicit, table-formatted, and carries the disclaimer — matching `../05-ai/financial-ai-principles.md` point by point.
- [ ] The refusal case declines to invent numbers and states the missing data needed.
- [ ] The prompt library exists per D2 with versioned files and README rules; no prompt text is hard-coded in TypeScript.
- [ ] Quick vs Deep visibly differ (prompt stack + gateway parameters) and both are recorded on `AIRequest`.
- [ ] Guardrails run on every completed stream and attach warnings for violations.
- [ ] All 20 golden cases pass; the manual eval workflow is documented in `evals/eval-workflow.md`.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` clean.

## DO NOT DO

- Do not connect real accounting, bank, or payment data (Phase 10).
- Do not implement tools, function calling, or the agent runtime (Phase 11, `../05-ai/agent-architecture.md`).
- Do not add pricing or billing logic (Phase 12).
- Do not silently rewrite model output in guardrails.
- Do not weaken refusal behaviour to make demos look smarter.

## NEXT STEP

Load `phase-08-testing.md`.
