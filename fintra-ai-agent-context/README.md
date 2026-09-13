# FINTRA — Financial AI Agent · Engineering & Product Package

**Version 1.0 · Phase 0 — Product & Architecture · Single source of truth for the Fintra development process.**

Fintra is an AI-native financial intelligence platform for finance professionals — CFOs, Finance Directors, Controllers, Management Accountants, FP&A and Analysts. The MVP core is the **Fintra Workspace** (`/agent`): a premium financial AI thread experience with multi-model selection, evidence-first answers and finance-specific guardrails — Perplexity-calibre interaction quality, finance-grade trust requirements, Fintra's warm-paper editorial identity.

This package does **not** contain the application. It contains everything required to build it correctly, repeatedly and safely: product definition, architecture, specifications, data model, AI subsystem design, sequential development prompts, test strategy and diagrams.

---

## Read in this order

| # | File | Purpose |
|---|------|---------|
| 1 | [`01-context/project-context.md`](01-context/project-context.md) | **Master context file — load this first in every session** |
| 2 | [`00-product-vision/product-vision.md`](00-product-vision/product-vision.md) | What Fintra is, who it serves, what "good" means |
| 3 | [`00-product-vision/product-principles.md`](00-product-vision/product-principles.md) | The 12 non-negotiable product principles |
| 4 | [`03-system-architecture/system-architecture.md`](03-system-architecture/system-architecture.md) | How the system is composed |
| 5 | [`02-ui-ux/agent-ui-spec.md`](02-ui-ux/agent-ui-spec.md) | The core Workspace specification |
| 6 | [`06-prompts/README.md`](06-prompts/README.md) | How to execute the development phases |

---

## Package structure

```text
fintra-ai-agent/
├── README.md                        ← you are here
├── 00-product-vision/               vision, principles, personas, journeys
├── 01-context/                      master context, homepage audit, competitor
│                                    reference, ADRs (assumptions & decisions)
├── 02-ui-ux/                        homepage spec, agent UI spec, design system,
│                                    component map, responsive strategy, UX flows
├── 03-system-architecture/          system / frontend / backend / AI architecture,
│                                    model routing, security, data, deployment
├── 04-data-model/                   database design, entities, relationships
├── 05-ai/                           AI system design, provider abstraction,
│                                    model selection, context management,
│                                    agent architecture, financial-AI
│                                    principles, evaluation strategy
├── 06-prompts/                      master development prompt + 9 sequential
│                                    phase prompts (execution contract per phase)
├── 07-testing/                      strategy + UI / API / AI-eval / security plans
├── 08-roadmap/                      roadmap, milestones, dependencies,
│                                    future capabilities
└── 09-diagrams/                     5 SVG diagrams (see below)
```

## Diagrams (`09-diagrams/`)

| File | Shows |
|------|-------|
| `system-architecture.svg` | Layered composition: browser → Next.js layers → Neon Postgres + AI providers |
| `ai-request-flow.svg` | One assistant turn: 12-stage pipeline across 4 phases |
| `model-routing-flow.svg` | Registry-driven selection, policy gates, fallback chain, circuit breaker |
| `user-journey.svg` | Discover → Try → Sign in → First value → Trust → Habit, with KPIs & friction |
| `deployment-architecture.svg` | GitHub Actions → Vercel → Neon / OpenRouter, observability & ops |

## How to develop with this package

1. **Every session**: load `01-context/project-context.md`, then `06-prompts/master-development-prompt.md`.
2. **Execute one phase at a time** using the prompts in `06-prompts/` (order and dependencies in `06-prompts/README.md` and `08-roadmap/implementation-roadmap.md`).
3. **Do not start coding from a vague request** — every phase prompt defines objective, tasks, constraints, tests, acceptance criteria and explicit "do not do" boundaries.
4. **Update the status table** in `06-prompts/README.md` and `01-context/project-context.md` when a phase completes.

## Ground rules (enforced across all documents)

- API keys are server-side secrets only — never in client code, git, docs or logs.
- The model catalog is configuration + seeded data; the UI never hard-codes model names.
- OpenRouter is the primary provider gateway behind our own `ProviderAdapter` port; direct adapters are an escape hatch, not a coupling.
- AI output is labeled interpretation with explicit assumptions — never silent fact (see `05-ai/financial-ai-principles.md`).
- Phase order is authoritative in `08-roadmap/implementation-roadmap.md` (backend foundation precedes the model layer; files/tools/billing are post-MVP).

## Document conventions

- English, GitHub-flavored Markdown; relative links between documents; architecture visuals live only in `09-diagrams/`.
- Terminology follows the glossary in `01-context/project-context.md` (Thread, Composer, Model Selector, Run, Evidence, Financial Context, tiers Fast/Balanced/Reasoning/Open).
- Model IDs quoted anywhere are **illustrative** — `src/config/models.config.ts` is the sole source of truth at build time.
