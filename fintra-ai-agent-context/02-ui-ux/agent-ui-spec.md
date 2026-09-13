# Fintra Workspace (`/agent`) — UI/UX Specification

> Purpose: specify the Fintra Workspace — the AI financial thread experience at `/agent` — precisely enough that engineers can build it without further design input.

## 1. Product definition and feel

The Fintra Workspace is the MVP product: a financial AI thread workspace at `/agent` where a CFO, Finance Director (FD), Financial Controller (FC), Management Accountant, FP&A Lead, Financial Analyst, or Business Owner asks and receives audited answers. It must read as a **premium financial workspace**: calm, dense-but-readable, evidence-forward. Perplexity sets the interaction-quality bar (composer-first, threads, inline model selection, streaming, follow-ups — pattern-level adoption only); it is **not** a ChatGPT clone. The differences are structural: every answer separates **AI interpretation** from **Evidence** (D9); every execution is a visible **Run** with steps; every figure is set in Geist Mono with stated precision; uncertainty and assumptions are explicit; a disclaimer closes every AI answer. The tone is "senior analyst's desk", not "chat toy": no emoji, no playful illustrations, no dark mode, warm-paper surfaces with evergreen actions and bronze audit accents.

## 2. Layout regions

Desktop is a three-zone layout. The thread canvas is always present; the sidebar and context panel flex.

| Region | 1440px | 1280px | Behaviour |
|---|---|---|---|
| Top bar | full width, 56px tall | same | Workspace switcher (future, non-interactive), inline thread title rename, Model Selector trigger, Usage indicator, account menu |
| Left sidebar (threads + nav) | 280px fixed | 280px fixed | Icon rail at 1024–1279; drawer below 1024 (responsive-strategy.md) |
| Center thread canvas | flexible, content column max 760px centered | same | Independent scroll; 32px min gutters; messages stack vertically |
| Right Context panel | 320px, hidden by default | hidden | Phase 7 placeholder only (§10); toggle lives in top bar |
| Composer | 760px max, aligned to canvas column | same | Sticky at canvas bottom; elevated card |

Z-order: canvas content 0; sticky composer 10; sidebar drawer (mobile) 40; popovers/menus 50; dialogs 60; toasts 70. Focus ring is 2px `#006548` with 2px offset on paper, white on ink panels.

## 3. Empty state

The empty state is **composer-first and centered** — the Composer sits in the vertical middle of the canvas, not the bottom.

- Greeting: "What would you like to analyse?" (Geist Sans, h2 scale, ink `#1d2622`).
- Inline beneath the greeting: the Composer with the Model Selector chip and Answer-mode toggle rendered inside the composer card (identical to §5, so layout never re-flows after the first message).
- Six starter prompts as cards (2×3 grid, paper-raised `#fafaf7`, 1px `#e3e2dd` border, 12px radius): "Explain the variance in this month's gross margin", "What does our 13-week cash flow look like?", "Which customers are overdue and by how much?", "Build this month's budget-vs-actual summary", "What drove the change in EBITDA?", "How many weeks of runway do we have at current burn?". Clicking a card fills the Composer and focuses it (does not auto-send).
- Below: "Recent threads" — last 5 ThreadItems (§8); hidden when history is empty.
- Pre-Phase 7 note: muted caption "Demo company data is simulated" under the suggestions while data is mocked; removed when real context lands.

## 4. Thread view and message anatomy

A Thread is a scrolled list of messages with two anatomies:

**User message (minimal).** Right-anchored compact card, paper-raised, 8px radius, max-width 85%; text only; mono timestamp on hover; copy as the only action. No avatar in MVP (single-user).

**Assistant response (composed of ordered parts, top to bottom):**

1. **RunStepsBlock** — collapsible, live-updating block above the answer, inheriting the homepage orchestration style: "1 of 5" progress, one row per step with status dot (idle = 1px ring, active = emerald pulse, done = emerald check dot, failed = red dot), step label in body-sm, duration in Geist Mono when complete. Canonical step shape: "Retrieving September P&L · 1,284 lines · quality 98.2" → "Running variance decomposition vs budget" → "Cross-checking 5 flagged transactions" → "Quantifying driver impact — 92% explained" → "Assembling recommendations and evidence". Header row "Run · 5 steps · 3.2s" with chevron; auto-collapses to the summary row when the Run completes.
2. **Answer body** — markdown rendered by MarkdownAnswer: headings, paragraphs, lists, inline code, and **financial tables** (FinancialTable: right-aligned Geist Mono tabular numerals, positive `#006548` / negative `#9f0712` deltas, header row uppercase caption). Text streams in progressively.
3. **EvidenceRow** — horizontal row of EvidenceChips, e.g. "Sep P&L · 1,284 lines · quality 98.2", "GL 6100 · 84 lines", "TXN-8841 · $12.4K". Chip: bronze border and icon (`#c48225`), ink text, paper background, full radius. Mocked before Phase 7; clicking a chip shows the tooltip "Evidence drill-down arrives with data connections".
4. **AssumptionCallout** — only when the answer carries assumptions: paper-alt `#ecefed` block, bronze left rule, label "Assumptions", bullet list of explicit assumptions (D9: assumptions must be explicit).
5. **ConfidenceIndicator** — chip "94% conf., 12 refs" with a 3-segment bronze fill; tooltip explains the derivation (mocked pre-Phase 7).
6. **DisclaimerFootnote** — muted caption, fixed wording: "AI interpretation — not financial advice. Figures derived from connected demo data; verify before external use." Every assistant message ends with it (D9).
7. **FollowUpChips** — exactly 3 suggested next questions as ghost chips; clicking submits as a new user message.
8. **MessageActions** — icon row (visible on hover/focus on desktop, always visible on mobile): Copy (markdown to clipboard), Regenerate, Feedback thumbs up/down (local-only MVP), "Switch model and re-run" (opens Model Selector; on pick, regenerates per §7).

## 5. Composer

- Auto-growing textarea, 1–8 rows (min-height 48px, max-height 208px, then internal scroll); placeholder "Ask a financial question…".
- Keys: **Enter** sends, **Shift+Enter** newline, **⌘/Ctrl+Enter** alternative send, **⌘/Ctrl+K** new thread (global). Multi-line paste preserved.
- Attach button (paperclip) renders disabled with tooltip "Coming in Phase 7" (files/data are Phase 10 per D5); reduced-opacity, not hidden.
- **Answer-mode toggle**: segmented control "Quick answer | Deep analysis" (D7). Quick answer routes to Fast/Balanced defaults; Deep analysis biases Reasoning tier and longer Runs (labelled in UI copy as affecting depth and latency).
- Model Selector chip inline at composer-left (§6).
- Send button: emerald `#006548`, white icon, 36px; becomes **Stop** (square icon, ink outline) while a Run is streaming. Disabled (40% opacity, `aria-disabled`) when input is empty.
- Char/token counter appears only near the limit ("1,940 / 2,000 characters", caption mono); at limit send disables with "Message too long — split it or start a new thread".
- **Draft persistence**: unsent input saves per thread (empty state under key `__new`) to `localStorage`, debounced 300ms, cleared on send, restored on return; ⌘K abandon preserves the draft (F7).
- Focus: clicking anywhere in the thread canvas does not steal composer focus; after send, focus moves to the streaming answer region for screen-reader continuity (§12).

## 6. Model Selector

- **Trigger**: chip with current `displayName` + tier badge (e.g., "Claude Sonnet · Balanced"); top bar on desktop, inline in the Composer, full-screen sheet on mobile.
- **Popover** (Dropdown Menu base), grouped by provider (OpenAI, Anthropic, Google, Open & value). Pinned top entry, visually separated: **"Auto (recommended)"** — default for every new thread; heuristic complexity → tier routing with logged fallback (D4).
- **ModelOption anatomy**: name; capability badges (reasoning / vision / tools — small Badge variants, only when true); latency class (Fast / Balanced / Reasoning); pricing tier as 1–4 bronze dots; availability state (available = normal, degraded = amber dot + "Degraded", retired = never listed). Example IDs shown in docs are illustrative; the UI renders exclusively from the registry (`src/config/models.config.ts` + seeded `ModelCatalog` — D4). Never hard-code model names in components.
- **Mid-thread switch** affects the next message only; a subtle muted system note renders: "Next answer will use {model}." with mono timestamp. Prior messages keep their model chip.
- Keyboard: arrows move, Enter selects, Esc closes, typeahead jumps; selected shows an emerald check; footer links to model docs (new tab).

## 7. Streaming and run states

State machine per assistant turn: `IDLE → SUBMITTED → STREAMING_STEPS → STREAMING_TEXT → COMPLETE`, with terminal alternates `ERROR` and `STOPPED`.

| State | UI | Exit |
|---|---|---|
| IDLE | Composer enabled; canvas static | User submits |
| SUBMITTED | Optimistic user message appended (F2); RunStepsBlock skeleton (3 shimmer rows); send → Stop | First step or first token arrives |
| STREAMING_STEPS | Steps fill with live status dots; answer area may show a single-line "Working…" shimmer | Steps complete → STREAMING_TEXT (or directly COMPLETE if no text stream) |
| STREAMING_TEXT | Text deltas render into MarkdownAnswer with StreamingCaret (2px emerald bar, 1s blink); canvas auto-scrolls unless the user scrolled up (then a "Jump to latest" pill appears) | Stream ends |
| COMPLETE | Caret removed; EvidenceRow/confidence/disclaimer/follow-ups/actions mount; RunStepsBlock auto-collapses | User acts |
| STOPPED | Partial text kept, suffixed with a muted "Stopped" marker; actions show Regenerate | — |
| ERROR | ErrorState card with copy + recovery per §9 | Retry actions |

**Stop semantics**: Stop aborts the SSE stream client-side and notifies the backend; partial content persists with status `stopped`; the Run summary shows "Stopped at step 3 of 5". **Regenerate semantics**: re-sends the last user message; if the model was switched via MessageActions, the regeneration uses the new model and the system note appears; the previous answer is replaced in place (single-version MVP; §16). **Error retry**: two options on the ErrorState — "Retry" (same model, same context) and "Retry without history" (sends with cleared thread context, labelled clearly because it loses thread grounding).

## 8. History and threads sidebar

- Header: "Threads" + New thread button (plus icon; also ⌘K).
- Search input ships with Phase 6; until then it is **not rendered** (no dead UI).
- Grouping: Today / Yesterday / Previous 7 days / Older — sticky captions.
- **ThreadItem**: one-line title (auto-generated from the first user message), model chip ("Auto"), relative time ("2h", "Thu") in mono. Active thread: paper-raised background + emerald 2px left rule.
- Hover/focus actions: Rename (inline edit, Enter commits, Esc cancels) and Delete → confirmation dialog ("Delete this thread? This cannot be undone." — soft delete in DB per D3, destructive in UI copy). Actions are 28px icon buttons with tooltips.
- Layout: full list at ≥1024; icon rail at 1024–1279 (tooltips carry titles); drawer below 1024 from the top-bar hamburger; canvas keeps its own scroll. List interactions are optimistic (< 100ms, D10).

## 9. System states catalogue

| State | User-facing copy | Recovery action |
|---|---|---|
| Loading (thread fetch) | Skeleton canvas (3 message-shaped blocks) | Auto-resolves |
| Empty | §3 | Start typing |
| Streaming | §7 | Stop available |
| Complete | §4 | Follow-ups, actions |
| Error: provider unavailable | "The AI provider didn't respond. Your message was kept." | Retry / Retry without history |
| Error: rate limit | "Too many requests. Wait a moment, then retry." | Retry (disabled 10s countdown, mono) |
| Error: context overflow | "This thread is too long for {model}'s context. Start a new thread or retry without history." | New thread / Retry without history |
| Error: auth expired | "Your session expired. Sign in again — your threads are saved." | Sign in (returns to thread) |
| Usage cap | "You've used all of this month's workspace allowance." | "Learn about limits" (disabled copy until billing, Phase 12; shows upgrade hint "Higher limits arrive with paid plans") |
| Offline | "You're offline. Reconnect to continue." banner (top, amber `#dd7400` on tint) | Auto-dismiss on reconnect |
| Usage warning (80%) | Toast once per session: "You've used 80% of this month's allowance." | Dismiss |

Error copy rule: say what happened, then what to do; never show stack traces, provider raw errors, or model IDs to end users (internal IDs live in an expandable "Details", excluded from MVP).

## 10. Context panel (Phase 7 placeholder)

320px right panel, collapsed by default, toggled from the top bar. In MVP it renders one **Financial Context** card (static demo content in Phase 2): entity ("Demo Co Ltd"), period ("FY2025 · September"), currency ("USD"), sources ("Xero · Barclays · Stripe (demo)"), plus caption "Financial Context arrives with data connections (Phase 7+)". Excluded from the DOM below `xl` (responsive-strategy.md). No other cards; the panel must not imply working integrations.

## 11. Auth states

- **Unauthenticated** visit to `/agent`: a branded marketing gate screen — Playfair line "Your finance team, run by agents you can audit.", three bullets (evidence, approvals, audit trail), primary CTA "Sign in" → `/sign-in`, secondary "Back to homepage". Middleware guards the route (Auth.js v5 per D1).
- **Session expiry mid-stream**: the stream aborts client-side; partial content is preserved and the thread persisted; an inline banner replaces the composer: "Your session expired. Sign in again to continue — this thread is saved." After re-auth the user returns to the same thread (post-login redirect).

## 12. Keyboard shortcuts, focus management, accessibility

| Shortcut | Action |
|---|---|
| ⌘/Ctrl + K | New thread |
| ⌘/Ctrl + Enter | Send (alternative to Enter) |
| Enter / Shift+Enter | Send / newline in Composer |
| Esc | Close popover/sheet; cancel rename; stop does NOT bind to Esc (intentional: avoid accidental aborts) |
| ↑/↓ within Model Selector | Move option |
| ⌘/Ctrl + B | Toggle sidebar (desktop) |

Focus management: after send, focus moves to the streaming region and stays after completion (no composer jump — follow-up chips are the next tab stop); dialogs trap focus and return it on close; the drawer returns focus to its opener.

Accessibility: streaming text container is `role="log"` with `aria-live="polite"`; run-step status changes are announced via a separate polite live region ("Step 2 of 5 completed"); the Stop button gets `aria-label="Stop generating"`; all icon-only buttons have accessible names; contrast pairings per design-system.md §2; `prefers-reduced-motion` disables caret blink (static bar), step shimmer, and auto-scroll animation (instant jump).

## 13. Motion spec

Subtle, professional, 150–250ms ease-out family (D6). Tokens: `--duration-fast: 150ms` (hovers, chips), `--duration-base: 200ms` (popovers, drawers), `--duration-slow: 250ms` (message mount, panel slide); `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`. Specifics: StreamingCaret blink 1s step-end; run-step active dot pulse 1.2s at 15% opacity amplitude; step-row entrance 150ms fade+4px rise; message mount 200ms fade+8px rise; skeleton shimmer 1.2s loop on a `#f1f0ec` band; popover scale from 98% + fade 200ms. Nothing bounces; nothing loops except the active-step pulse and caret. All motion collapses under reduced motion.

## 14. Responsive behaviour

Summary only — authoritative detail in [responsive-strategy.md](./responsive-strategy.md). Desktop ≥1280: full three zones. Laptop 1024–1279: sidebar collapses to icon rail, context panel hidden behind toggle. Tablet 768–1023: sidebar becomes overlay drawer, single-column canvas, sticky-bottom composer. Mobile <768: essentials only — conversation canvas, composer, compact Model Selector (full-screen sheet), logo + account top bar, history via drawer; run steps collapse to a single status line while streaming.

## 15. Visual spec (token bindings)

- Thread canvas: paper base `#fbfaf8`, uniform — no section alternates.
- Composer: elevated card `#fafaf7`, 1px `#e3e2dd` border, 12px radius; floating-layer shadow only while focused (D6).
- Primary actions (Send, Sign-in CTA): emerald `#006548`; hover per design-system.md pairing rules.
- All figures — amounts, percentages, counts, timestamps, run durations — Geist Mono with `font-variant-numeric: tabular-nums`. This is mandatory, not stylistic (D6).
- Evidence chips: bronze `#c48225` borders/icons; text stays ink `#1d2622` on paper for AA contrast (bronze as text only on ink panels, per design-system.md §2).
- Red (`#9f0712` text / `#ed5350` graphics) is reserved for **negative financial values and errors**; destructive buttons follow design-system.md §8.
- Ink panels (`#131915`/`#090f0c`): used only for the auth-gate hero band and optional run-summary footer strip; no dark mode in MVP (D6).

## 16. Out of scope for MVP (with future hooks)

| Excluded | Future hook |
|---|---|
| File upload/attachments (UI disabled in §5) | Phase 7/10 — Attachment entity (D3 deferred), attach button enabled |
| Tool calls / citations drill-down UI | Phase 11 — EvidenceChip becomes clickable → evidence drawer |
| Multi-entity switcher | Top-bar workspace switcher slot reserved; Organization/Membership entities (D3 deferred) |
| Billing pages / plan management | Phase 12 — UsageIndicator links to billing; UsageRecord table already aggregates |
| Saved reports library / Spaces | Post-MVP roadmap (`../08-roadmap/future-capabilities.md`) |
| Approval-gated actions | Flow F12 documented, not built |
| Multi-version answer comparison, dark mode, mobile-optimized data tables | Backlog; tokens and components leave room (badge/table variants) |

## Related docs

- [homepage-spec.md](./homepage-spec.md) — marketing entry points into this Workspace
- [design-system.md](./design-system.md) — token definitions referenced above
- [component-map.md](./component-map.md) — component inventory and build order
- [responsive-strategy.md](./responsive-strategy.md) — breakpoint behaviour
- [ux-flows.md](./ux-flows.md) — interaction flows F1–F12
- [../06-prompts/phase-02-agent-ui.md](../06-prompts/phase-02-agent-ui.md)
- [../09-diagrams/system-architecture.svg](../09-diagrams/system-architecture.svg)
