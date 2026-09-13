# Fintra Product Principles

> Purpose: the twelve non-negotiable rules that govern every design, architecture, and AI decision in Fintra — each stated with its practical consequence.

## 1. Evidence-first

An answer without Evidence is an opinion, and finance runs on defensible statements. Every substantive AI output must attach the data references behind its claims, and the product must make the difference between user-provided data, computed facts, and AI interpretation visible (D9). Confidence without citations is a defect, not a style.

**In practice:** the Evidence panel is a first-class surface beside every answer; an evidence-attachment rate below target is treated as a product bug with an owner, not a content quirk.

## 2. Human-in-the-loop

Agents propose, humans dispose — the trust pillar the homepage already states publicly, so the product must honor it structurally. In the MVP the user initiates every Run, can stop it mid-stream, and can retry it; nothing executes on their behalf without their command.

**In practice:** no autonomous actions, no silent model switching, no background execution in MVP; every future action-taking capability (scheduled runs, ledger writes, approvals) ships behind explicit approval gates (P11).

## 3. Auditability by default

Auditability is not an enterprise upsell bolted on later; it is a property of the data model from day one. Every AI output must be traceable to the request that caused it, the model that produced it, and the prompt version that shaped it (D9).

**In practice:** `AIRequest`, `UsageRecord`, and `AuditLog` tables exist from the first backend phase; prompts live in a versioned `/prompts` library (ADR-015) so any historical answer can be reconstructed exactly.

## 4. Model-agnostic core

Models are commodities in flux; the durable value is the workflow, the Evidence, and the trust around them. The UI never hard-codes model names, and the gateway isolates provider protocol quirks behind our own port.

**In practice:** the Model Selector renders exclusively from the config + seeded `ModelCatalog` registry (ADR-007); Vercel AI SDK internals sit behind the `ProviderAdapter` interface so a provider swap never touches the UI (ADR-004, ADR-005).

## 5. Calm professionalism

The user is a Controller mid-close, not a consumer mid-scroll: dense-readable typography, restrained motion, no confetti, no hype copy. The interface should feel like a well-run finance function — quiet, precise, dependable.

**In practice:** 150–250ms ease-out motion with reduced-motion respected; Geist Mono for every financial figure; generous whitespace on the warm-paper system (D6); streaming states are informative, never theatrical.

## 6. Financial-grade accuracy and honest uncertainty

No hallucinated figures — if data is missing, the product states what is missing and what it needs (D9). Uncertainty is expressed in language ("estimated", "unverified"), assumptions are explicit, and calculations are shown step-by-step so a professional can check them.

**In practice:** the prompt library enforces the uncertainty policy and explicit assumptions (P7); a standard "not financial advice" disclaimer applies to analysis outputs; an answer that would have to guess says so instead.

## 7. Data gravity

Today Fintra's context lives inside conversations; tomorrow it must live in a canonical financial model that Threads, agents, and reports all share. Decisions made now must not make that migration harder.

**In practice:** message `parts` jsonb is schema-flexible for future evidence and tool parts (ADR-009); deferred entities (`ReportArtifact`, `AgentRun`, `ToolCall`, `Organization`) are documented in D3 so their future shapes constrain today's service boundaries.

## 8. Progressive disclosure

Show the simple path first; expose depth on demand. A first question needs a Composer and a good default; variance decomposition, assumption lists, and model internals appear only when the professional asks or expands.

**In practice:** Answer modes (Quick answer / Deep analysis) gate effort; Run steps collapse when complete; Evidence starts summarized and expands to full references on click.

## 9. Speed as a feature

Perceived speed is trust: a tool that hangs feels broken, and finance professionals have zero patience for spinners during a close. The D10 budgets are contractual, not aspirational.

**In practice:** server first byte < 1s and first streamed token < 2s p50; thread list interactions < 100ms optimistic; streaming states appear instantly so work is visible from the first milliseconds.

## 10. Security is architecture, not a feature

Key handling, trust boundaries, and ownership checks are structural facts of the system, not settings. API keys exist only server-side in Zod-validated `env.ts`, and traffic always flows Browser → Fintra backend → Gateway → Provider — never browser → provider (D8).

**In practice:** auth required on all `/api/v1` except health; ownership checks on every Thread and Message read/write; rate limiting per user+IP behind the `RateLimiter` interface (ADR-013); CSP and security headers; no PII in logs.

## 11. Boring technology where it matters; innovation only at the AI layer

Proven components — Postgres, Prisma, Auth.js, SSE, Next.js — are deliberately chosen with documented trade-offs (ADR-001 through ADR-016). The novelty budget is spent exclusively where users feel it: the financial AI experience.

**In practice:** no monorepo tooling, no global state library, no background jobs in MVP (ADR-010); the only genuinely custom infrastructure is the Fintra AI Gateway, because the gateway is the product.

## 12. Credibility over cleverness

Every surface must survive a CFO's skepticism: if a claim, number, or visual cannot be defended, it does not ship. The homepage's warm-paper editorial identity (D6) works because it reads like a serious publication, not a growth-hacked landing page — the Workspace inherits that register.

**In practice:** 1px borders over shadows; Playfair Display only for editorial accents; demo-staged marketing claims (fictional Series A, simulated statistics) never leak into product UI; empty and error states are honest about what the system can and cannot do yet.

## Related docs

- [Product vision](./product-vision.md) — the destination these principles protect.
- [Project context](../01-context/project-context.md) — D1–D11 summarized for coding agents.
- [Agent UI spec](../02-ui-ux/agent-ui-spec.md) — principles 5, 8, 9, and 12 operationalized.
- [Design tokens](../02-ui-ux/design-system.md) — principles 5 and 12 codified as CSS variables.
- [AI gateway](../03-system-architecture/ai-architecture.md) — principles 4 and 10 in architecture.
- [Financial AI safety](../05-ai/financial-ai-principles.md) — principles 1, 2, and 6 in detail.
- [Assumptions and decisions](../01-context/assumptions-and-decisions.md) — the ADRs behind these rules.
