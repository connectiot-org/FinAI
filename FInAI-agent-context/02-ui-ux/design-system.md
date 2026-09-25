# Fintra Design System — Tokens, Rules, and Visual Language

> Purpose: codify the homepage-derived design tokens (D6) into the authoritative color, type, spacing, radius, motion, and voice rules for both the marketing site and the Fintra Workspace.

## 1. Sources and scope

All values originate from the live homepage palette extracted in Task 1 and pinned in D6 — this document codifies, it does not reinvent. Scope: light theme only (no dark-mode MVP; dark *ink panels* are surfaces, not a theme). Two contexts consume the same tokens: marketing (homepage S1–S17) and the Workspace (`/agent`); the Workspace may use the cooler paper variant but must stay in the warm-paper + evergreen + bronze system (D6).

## 2. Color system

### 2.1 Paper surfaces and ink

| Role | Token | Hex | Usage |
|---|---|---|---|
| Paper base | `--color-paper` | `#fbfaf8` | Page/canvas background |
| Paper raised | `--color-paper-raised` | `#fafaf7` | Cards, composer, user bubbles |
| Paper alt 1 | `--color-paper-alt` | `#f1f0ec` | Section alternates, skeleton band |
| Paper alt 2 | `--color-paper-alt-2` | `#ecefed` | Callout blocks (assumptions), hover fills |
| Border | `--color-line` | `#e3e2dd` | 1px borders, dividers |
| Ink | `--color-ink` | `#1d2622` | Primary text, icons |
| Ink muted | `--color-ink-muted` | `#414a45` | Secondary text, captions |
| Ink panel | `--color-ink-panel` | `#131915` | Footer, dark bands, run-summary strip |
| Ink panel deep | `--color-ink-panel-deep` | `#090f0c` | Footer bottom, code/metrics blocks |

### 2.2 Emerald brand scale and WCAG pairing rules

Ratios are computed with the WCAG 2.1 relative-luminance formula against the stated pair; verify programmatically in CI (Phase 8).

| Token | Hex | Pairing | Ratio | Verdict |
|---|---|---|---|---|
| `--color-brand` (primary) | `#006548` | text on `#fbfaf8` | ≈6.8:1 | AA and AAA-large pass — use for body-size emerald text |
| `--color-brand` | `#006548` | white text on it (buttons) | ≈7.1:1 | AA/AAA pass — default button pairing |
| `--color-brand-600` | `#038660` | text on `#fbfaf8` | ≈4.4:1 | AA-normal FAIL — restrict to ≥18.66px bold, ≥24px, icons, borders, chart fills |
| `--color-brand-500` | `#358264` | decorative only | — | Fills, illustrations |
| `--color-brand-400` | `#3a9371` | decorative only | — | Fills |
| `--color-brand-300` | `#3eaf86` | decorative only | — | Chart series |
| `--color-brand-200` | `#58ba93` | decorative only | — | Chart series on ink panels |
| `--color-positive-tint` | `#dbf2e4` | badge bg with `#006548` text | ≈6.0:1 | AA pass — positive badge pairing |
| `--color-brand` | `#006548` | on `#131915` ink panel | ≈4.9:1 | AA pass — emerald accents on dark bands |

Rule: **`#006548` is the only emerald allowed as body-size text on paper.** `#038660` is the "positive" accent for graphics and large numerals; for positive text (deltas, badges) use `#006548`.

### 2.3 Bronze accent rules

| Token | Hex | Allowed | Not allowed |
|---|---|---|---|
| `--color-bronze` | `#c48225` | Borders/icons of evidence chips, audit motifs, confidence fills, 1px accent rules; text **only on ink panels** (≈5.6:1 on `#131915`); large numerals ≥24px on paper (≈3.1:1) | Body-size text on paper; destructive or error semantics; positive/negative financial deltas |
| `--color-bronze-deep` | `#b75000` | Body-size bronze-ish text on paper (≈4.8:1, AA pass), "Degraded" availability dot pairs with tint | — |

Bronze signals *audit, evidence, attention* — it never signals danger (D7/D9 alignment: evidence-forward identity).

### 2.4 Semantic financial colors

| Semantic | Text token (on paper) | Graphic token | Tint bg | Notes |
|---|---|---|---|---|
| Positive | `--color-brand` `#006548` (≈6.8:1) | `#038660` | `#dbf2e4` | Gains, positive deltas, matched transactions |
| Negative | `--color-negative` `#9f0712` (≈8.0:1 on paper; ≈7.6:1 on `#fef2f2`) | `#ed5350` (≈3.4:1 — icons/fills/large only) | `#fef2f2` | Losses, negative deltas, errors. `#e40014` (≈4.7:1) allowed for bold emphasis text |
| Neutral / zero | `--color-ink-muted` `#414a45` | — | — | Zero deltas, N/A, unchange |

Red is reserved for negative financial values and errors — never for branding, never for "delete" iconography outside destructive buttons (agent-ui-spec.md §15).

### 2.5 Dark ink panels

`#131915`/`#090f0c` are used for: footer, final-CTA band, hero accent panels on marketing; auth-gate hero band and optional run-summary strip in the Workspace; code/metrics blocks. On ink: text is white or `#fafaf7` (≈17:1), muted text is `#58ba93`-tinted paper at ≥4.5:1, emerald accent `#006548` (≈4.9:1), bronze `#c48225` (≈5.6:1). Borders on ink: 1px `rgba(250,250,247,0.12)`.

## 3. Typography

Families via `next/font`: **Geist Sans** (UI), **Geist Mono** (all numerics/code), **Playfair Display** (editorial accents ONLY — hero H1, final-CTA headline, pull quotes; never buttons, never tables, never product UI).

| Role | Family | Size / line-height | Tracking | Weight | Notes |
|---|---|---|---|---|---|
| Display | Playfair Display | clamp(2.5rem, 2rem+2.5vw, 4rem) / 1.08 | −0.01em | 600 | Hero H1, final CTA |
| H1 | Geist Sans | 2.25rem / 1.15 | −0.02em | 600 | Section headlines |
| H2 | Geist Sans | 1.5rem / 1.25 | −0.01em | 600 | Card group titles |
| H3 | Geist Sans | 1.125rem / 1.35 | 0 | 600 | Component titles |
| Body | Geist Sans | 1rem / 1.6 | 0 | 400 | Default (15–16px per D6) |
| Body sm | Geist Sans | 0.9375rem / 1.55 | 0 | 400 | Workspace dense areas, step labels |
| Caption | Geist Sans | 0.8125rem / 1.4 | 0 | 400 | Muted, disclaimers |
| Overline | Geist Sans | 0.75rem / 1.3 | +0.08em, uppercase | 600 | Eyebrows, table headers |
| Mono figure | Geist Mono | 0.8125–0.9375rem / 1.4 | 0 | 400–500 | `font-variant-numeric: tabular-nums` MANDATORY for every financial figure, metric, timestamp, ID |

Numbers rule: figures are never rounded silently — precision is stated ("−$38.1K (−4.2% vs budget)"), and mono text always uses tabular numerals so tables align (D9 auditability).

## 4. Spacing (4px grid)

| Token | px | Typical use |
|---|---|---|
| `--space-1` | 4 | Icon gaps, chip padding-y |
| `--space-2` | 8 | Inline control gaps |
| `--space-3` | 12 | Chip padding, compact card padding |
| `--space-4` | 16 | Card padding, list row gaps |
| `--space-6` | 24 | Message spacing, block gaps |
| `--space-8` | 32 | Canvas gutters, group separation |
| `--space-12` | 48 | Marketing block padding (mobile) |
| `--space-16` | 64 | Marketing block padding (desktop) |
| `--space-24` | 96 | Hero vertical rhythm |

## 5. Radius

| Token | px | Applied to |
|---|---|---|
| `--radius-card` | 12 | Cards, composer, workspace visual frame |
| `--radius-control` | 8 | Buttons, dropdowns, segmented toggles |
| `--radius-input` | 6 | Text inputs, textarea |
| `--radius-full` | 9999 | Chips, badges, dots |

## 6. Borders and elevation

Borders first (D6): 1px `--color-line` is the primary separator on paper; hairline `rgba(250,250,247,0.12)` on ink panels. Shadows exist only for floating layers: `--shadow-popover: 0 4px 16px rgba(9,15,12,0.08), 0 1px 3px rgba(9,15,12,0.06)` (menus, popovers, dialogs, toasts); `--shadow-composer: 0 8px 24px rgba(9,15,12,0.07)` (composer card while focused). Focus ring: 2px `#006548`, 2px offset (white ring on ink panels). No elevated card stacks in page flow.

## 7. Iconography

Lucide outline set: 24px grid, 1.5px stroke, round caps, `currentColor` only. Sizes: 16px (inline/chips), 20px (buttons/rows), 24px (feature). Financial glyphs (trend-up/down, scale, receipt, banknote) come from the same set — no mixed icon families. Decorative icons are `aria-hidden`; meaningful ones carry labels.

## 8. Component visual language

- **Buttons**: `primary` (emerald bg, white text), `secondary` (paper-raised bg, 1px line border, ink text), `ghost` (transparent, ink text, hover paper-alt), `danger` (`#9f0712` text + `#fef2f2` tint bg; solid red reserved for irreversible confirmations), `on-ink` variant (white bg 8% + white text). Heights 32/36/44px (sm/md/lg); md is default; 44px minimum on touch (responsive-strategy.md).
- **Inputs**: 1px line border, 6px radius, paper-raised bg; focus = emerald border + focus ring; error = `#9f0712` border + caption message below (what to fix, not just "invalid").
- **Cards**: paper-raised, 1px line border, 12px radius, 16–24px padding; no shadows in flow.
- **Chips/badges**: full radius; variants — `capability` (reasoning/vision/tools, ink outline), `tier` (Fast/Balanced/Reasoning/Open; emerald tints by tier), `confidence` (bronze border, mono value), `evidence` (bronze border + icon), `status` (Run states), `financial-positive/negative` (semantic §2.4).
- **Tables**: header row overline uppercase muted; body rows 1px line dividers; numerals right-aligned Geist Mono tabular; delta column colored per §2.4; row hover paper-alt; sticky header inside scroll areas.

## 9. Motion tokens

| Token | Value | Use |
|---|---|---|
| `--duration-fast` | 150ms | Hovers, chip transitions, step entrance |
| `--duration-base` | 200ms | Popovers, drawers, message mount |
| `--duration-slow` | 250ms | Panels, hero reveals |
| `--ease-out` | cubic-bezier(0.16, 1, 0.3, 1) | Default curve |
| `--ease-linear-stream` | linear | Caret blink, shimmer loops |

Loops (shimmer 1.2s, pulse 1.2s, caret 1s step-end) are the only animations allowed to run continuously, and all are disabled under `prefers-reduced-motion: reduce` (fade-only or instant).

## 10. Voice and tone

Precise, senior, no hype. Product copy states facts and next actions: "Run complete — 5 steps, 3.2s", not "Magic happens!". Financial claims always carry their qualifier (demo data, simulated). **Error copy rules**: (1) say what happened in plain language; (2) say what to do next; (3) optionally link details; never blame the user, never expose provider names, stack traces, or model IDs. Disclaimer wording is fixed (agent-ui-spec.md §4). Numbers in copy follow the precision rule (§3).

## 11. Do / Don't

| Do | Don't |
|---|---|
| Warm paper + evergreen + bronze everywhere | Gradients beyond the subtle paper-alt washes already on the homepage |
| Geist Mono for every figure with tabular-nums | Rounded numbers without stated precision |
| 1px borders to separate | Shadows on in-flow cards |
| Bronze for evidence/audit accents | Bronze or red as decorative brand colors |
| Explicit assumptions and disclaimers | Confident single-voice answers without evidence |
| Reduced-motion-safe animation | Marquees, parallax, or scroll-jacking in product UI |
| Emoji-free product copy | Emoji in any product UI |
| Light theme only (ink panels as accents) | A dark-mode toggle in MVP |

## 12. Token naming convention and Tailwind 4 mapping

CSS variables, colon-free kebab: `--color-{role}[-{scale}]` (`--color-paper-raised`, `--color-brand-600`), `--space-{n}`, `--radius-{role}`, `--font-{family}`, `--text-{role}` (typography roles), `--duration-*`, `--ease-*`, `--shadow-*`. Defined once in `globals.css`; components never hard-code hex values.

Tailwind CSS 4 consumes tokens CSS-first: an `@theme inline` block maps them to utilities — `--color-paper` → `bg-paper`, `text-ink`, `border-line`; `--color-brand` → `bg-brand`, `text-brand`; `--radius-card` → `rounded-card`; `--font-mono` binds Geist Mono, `--font-display` binds Playfair. No `tailwind.config.js` is needed (D1); shadcn/ui components are themed by overriding their CSS variables to these tokens. The Workspace adds no new hues — it binds the same palette (D6).

## Related docs

- [homepage-spec.md](./homepage-spec.md) — where marketing consumes these tokens
- [agent-ui-spec.md](./agent-ui-spec.md) — where the Workspace consumes these tokens
- [component-map.md](./component-map.md) — component-level application
- [../01-context/project-context.md](../01-context/project-context.md)
- [../09-diagrams/system-architecture.svg](../09-diagrams/system-architecture.svg)
