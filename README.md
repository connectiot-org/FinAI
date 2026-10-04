# FInAI — AI Finance Platform Homepage

**Multiple AI models. One finance workspace.**

A production-quality marketing homepage + AI agent workspace for a multi-model finance product — inspired by the polish of modern editorial SaaS sites (Profound-style whitespace, typography and motion), with a fully original brand identity ("FInAI", Σ mark).

The workspace lets finance teams chat with frontier and free-tier models through an OpenRouter gateway with automatic failover, upload and interrogate CSV datasets with deterministic grounding, run interactive analysis views, and compile executive reports.

---

## Highlights — the 15 homepage sections

| # | Section | What it does |
|---|---------|--------------|
| 1 | Navigation | Sticky nav with dropdowns, mobile menu, CTA |
| 2 | Hero | "Multiple AI models. One finance workspace." + interactive product mockup |
| 3 | Product demo | Interactive mockup views: Chat, Analysis, Report, Templates, Run history |
| 4 | Multi-model AI | GPT / Claude / Gemini / DeepSeek model lineup with switcher |
| 5 | Financial analysis | Variance, ratios, scenarios, document & spreadsheet understanding |
| 6 | Report Builder | Chat-to-report flow with outline and export framing |
| 7 | Error & consistency checking | Flagged mismatches, formula issues, missing periods |
| 8 | Presentation builder | Report-to-deck flow with slide mockup |
| 9 | Finance AI agents | Agent cards (variance, reconciliation, filings, validation…) |
| 10 | Templates & workflows | Reusable finance template gallery + workflow steps |
| 11 | Intelligent model routing | Animated routing diagram with usage-limit failover (honest, caveat-aware copy) |
| 12 | Security & trust | Encryption, no-training-on-your-data, SSO/RBAC, audit trail |
| 13 | Competitor comparison | Verified-facts matrix vs. 5 real competitors + deep-dive accordions |
| 14 | Final CTA | Conversion block |
| 15 | Footer | Full sitemap footer |

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS 4** + shadcn/ui primitives
- **Framer Motion** (with `MotionConfig reducedMotion="user"` for accessibility)
- **Prisma + PostgreSQL** (conversations, usage tracking, audit log)
- **NextAuth v4** (credentials + optional Google OAuth, scrypt password hashing)
- **OpenRouter gateway** (streaming SSE, failover chains, circuit breaker)

## Quick start

Requires **Node.js 20+** (or Bun) and a PostgreSQL database for server-backed features (the homepage itself needs no database).

```bash
# 1) install dependencies
bun install            # or: npm install

# 2) create your env file
cp .env.example .env
#    → set DATABASE_URL (postgres://…), AUTH_SECRET, OPENROUTER_API_KEY

# 3) sync the database schema
bun run db:push        # or: npm run db:push

# 4) run the dev server
bun run dev            # or: npm run dev

# 5) open http://localhost:3000
```

### Production build

```bash
bun run build          # next build
bun run start          # serves the build
```

### Configuration (see `.env.example` for the full list)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | For DB features | PostgreSQL URL. When unset, DB-backed endpoints fail gracefully (health reports `db: "unconfigured"`). |
| `AUTH_SECRET` | In production | NextAuth signing secret (`openssl rand -base64 32`). Never commit. |
| `OPENROUTER_API_KEY` | For live chat | https://openrouter.ai/keys — no default key exists in the codebase. |
| `OPENROUTER_BASE_URL` | Optional | Point at an OpenRouter-compatible gateway/proxy. |
| `STRICT_AUTH` | Optional | `true` gates `/agent` + protected APIs behind a session. |
| `GOOGLE_CLIENT_ID/SECRET` | Optional | Enables Google sign-in. |

## Project structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx            # fonts, metadata
│   │   ├── page.tsx              # composes the 15 homepage sections
│   │   ├── agent/page.tsx        # workspace (chat, analysis, reports, templates, history)
│   │   ├── sign-in/page.tsx      # credentials (+ optional Google) auth
│   │   └── api/
│   │       ├── auth/[...nextauth]# NextAuth handlers
│   │       └── v1/
│   │           ├── chat/stream   # SSE streaming chat (gateway + failover)
│   │           ├── conversations # CRUD (session-required, ownership-scoped)
│   │           ├── datasets      # bounded in-memory registry (auth + rate limited)
│   │           ├── models        # live model registry
│   │           └── health        # dependency-aware health (503 on DB failure)
│   ├── components/landing/       # all homepage sections (one file per section)
│   ├── components/agent/         # workspace components
│   ├── server/                   # API controllers, services, AI gateway, auth
│   ├── lib/                      # dataset engine, SSE client, storage, utils
│   ├── config/                   # model registry + site copy
│   └── proxy.ts                  # edge middleware (optional strict-auth gate)
├── prompts/                      # versioned system prompts (markdown)
├── prisma/schema.prisma          # Postgres schema (users, conversations, usage, audit)
├── evals/                        # evaluation harness
└── package.json
```

## Editing content

Almost **all marketing copy lives in one file**: `src/lib/site-data.ts`.

- Hero headline, feature copy, agent cards, security items → edit the exported objects.
- **Competitor data** (Hebbia, AlphaSense, Datarails, Julius AI, Numeric) lives here too, with explicit
  `verified / partial / unverified` states per fact and a source note. Anything not confirmable from
  public sources is labeled **"Not publicly verified"** — keep that discipline when you edit.

**Model catalog**: `src/config/models.config.ts` is the source of truth (verified live OpenRouter ids).
Fallback chains are defined in the same file's `fallbackChainMap`.

## Design system

- **Brand:** FInAI (Σ wordmark) — original identity, no third-party assets.
- **Palette:** off-white paper background (`#FAFAF9`), stone ink text, deep moss-green accent.
- **Type:** Geist Sans / Geist Mono + Instrument Serif for italic display accents.
- **Motion:** subtle scroll reveals and micro-interactions; respects `prefers-reduced-motion`.
- Tokens and utilities are defined in `src/app/globals.css`.

## Competitor research methodology

The `research/` folder contains the raw research captured while building the comparison section
(JSON notes per competitor + reference screenshots). Rules applied throughout:

1. Only **public, verifiable** information is used (official product/pricing pages).
2. Anything not confirmable is explicitly marked **"Not publicly verified."**
3. Pricing changes frequently — re-verify before publishing claims.

## Security notes

- No secrets are committed; the gateway key and auth secret come from the environment.
- Chat streaming is rate limited (guests: IP-scoped, users: identity-scoped).
- Conversation endpoints require a session and enforce per-user ownership.
- Uploaded dataset payloads are size-capped and ownership-scoped.
- Untrusted dataset content is fenced before it reaches the model (prompt-injection defense).

## Notes

- "FInAI" is the brand identity for this multi-model finance workspace.
- GPT, Claude, Gemini, DeepSeek and all competitor names are trademarks of their respective owners;
  references are for identification and comparison only.
