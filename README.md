# FInAI — AI Finance Platform Homepage

**Multiple AI models. One finance workspace.**

A premium, production-quality marketing homepage for an AI-finance SaaS product — inspired by the polish of modern editorial SaaS sites (Profound-style whitespace, typography and motion), with a fully original brand identity ("FInAI", Σ mark).

The page presents a multi-model AI workspace for finance teams: chat with GPT, Claude, Gemini and DeepSeek in one place, run financial analysis, interrogate documents, build reports and presentations, check numbers for errors and inconsistencies, and reuse templates, workflows and finance-specific AI agents.

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
- **Prisma** scaffold included (the homepage itself needs no database)

## Quick start

Requires **Node.js 20+** (or Bun). No database setup is needed to view the homepage.

```bash
# 1) install dependencies
bun install            # or: npm install

# 2) create your env file (optional — only needed for Prisma work)
cp .env.example .env

# 3) run the dev server
bun run dev            # or: npm run dev

# 4) open http://localhost:3000
```

### Production build

```bash
bun run build          # next build (standalone output)
bun run start          # serves the standalone build
```

> On non-Bun environments use `npm run build` and start the standalone server with
> `NODE_ENV=production node .next/standalone/server.js`.

## Project structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx            # fonts, metadata
│   │   ├── page.tsx              # composes the 15 homepage sections
│   │   └── globals.css           # design tokens, utilities, animations
│   ├── components/landing/       # all homepage sections (one file per section)
│   │   ├── navbar.tsx
│   │   ├── hero.tsx
│   │   ├── product-mockup.tsx    # interactive product UI mockup (5 views)
│   │   ├── mockup-views.tsx
│   │   ├── audience-strip.tsx
│   │   ├── multi-model.tsx
│   │   ├── analysis-report.tsx
│   │   ├── checking-presentations.tsx
│   │   ├── agents-templates.tsx
│   │   ├── routing-security.tsx
│   │   ├── comparison.tsx        # competitor matrix + research accordions
│   │   ├── cta-footer.tsx
│   │   └── ...shared primitives (logo, reveal, section-heading)
│   ├── hooks/                    # reusable React hooks
│   ├── components/ui/            # shadcn/ui primitives
│   └── lib/
│       ├── site-data.ts          # ★ all page copy + verified competitor data
│       └── utils.ts
├── research/                     # competitor research notes (JSON) + reference screenshots
├── prisma/schema.prisma          # DB scaffold (not required by the homepage)
├── public/                       # static assets (logo, robots.txt)
└── package.json
```

## Editing content

Almost **all copy lives in one file**: `src/lib/site-data.ts`.

- Hero headline, feature copy, agent cards, security items → edit the exported objects.
- **Competitor data** (Hebbia, AlphaSense, Datarails, Julius AI, Numeric) lives here too, with explicit
  `verified / partial / unverified` states per fact and a source note. Anything not confirmable from
  public sources is labeled **"Not publicly verified"** — keep that discipline when you edit.

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

## Notes

- "FInAI" is the brand identity for this multi-model finance workspace.
- GPT, Claude, Gemini, DeepSeek and all competitor names are trademarks of their respective owners;
  references are for identification and comparison only.
