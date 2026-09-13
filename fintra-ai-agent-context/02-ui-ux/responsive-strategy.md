# Fintra Responsive Strategy — Breakpoints, Device Classes, and Checklists

> Purpose: define how the homepage and the Fintra Workspace adapt across breakpoints, what is consciously dropped on small screens, and how each breakpoint is tested.

## 1. Breakpoints

Tailwind 4 defaults (D1), applied uniformly:

| Token | Min width | Device class | Workspace layout |
|---|---|---|---|
| `sm` | 640px | Large phone (landscape) | Mobile essentials |
| `md` | 768px | Tablet portrait | Mobile essentials + wider canvas |
| `lg` | 1024px | Tablet landscape / small laptop | Drawer sidebar OR icon rail (see §2.3) |
| `xl` | 1280px | Desktop | Full 3-zone workspace |
| `2xl` | 1536px | Large desktop | Full 3-zone, wider canvas column (820px) |

## 2. Workspace (`/agent`) per device class

### 2.1 Desktop ≥1280px
Full three zones per agent-ui-spec.md §2: sidebar 280px fixed + canvas (content column max 760px, 820px at `2xl`) + optional Context panel 320px (hidden by default, toggle in top bar). Composer 760px aligned to canvas column; MessageActions on hover/focus; sidebar hover actions visible on row hover.

### 2.2 Laptop 1024–1279px
Sidebar collapses to a 64px icon rail (New thread, search placeholder-free, threads as icons with tooltips — last 8 threads, "All threads" opens the drawer); Context panel removed from the DOM and available only as a disabled toggle with tooltip "Financial Context arrives with data connections". Canvas column max 720px. Everything else identical to desktop.

### 2.3 Tablet 768–1023px
Sidebar becomes an **overlay drawer** (Sheet, 300px, scrim, Esc/scrim closes, focus returned to opener) opened by a hamburger in the top bar. Single-column canvas full-width with 24px gutters; composer sticky at viewport bottom; MessageActions always visible (no hover); context panel absent. RunStepsBlock renders expanded while streaming and auto-collapses on completion (as desktop) but the summary row is tappable to expand.

### 2.4 Mobile <768px — essentials only
Kept: conversation canvas (full-width, 16px gutters), Composer (sticky bottom), Model Selector (compact chip in the composer → **full-screen sheet** on open, grouped list, large touch rows), top bar (logo + hamburger for history drawer + account), thread history via drawer, follow-up chips (horizontal scroll), run steps collapsed to a **single status line** while streaming ("Running · step 2 of 5 — Cross-checking transactions") expandable to the full block after completion.

Consciously dropped on mobile: Context panel; multi-column message layouts; hover affordances (replaced by tap actions — MessageActions always visible, ThreadItem actions via swipe-left or long-press menu); inline rename in list (via edit sheet); tooltips (information moves into visible text or sheets); keyboard shortcuts (touch device); the second CTA in hero (single primary only).

Touch rules: minimum target 44×44px for all interactive elements (design-system.md §8 button lg = 44px); 8px minimum spacing between adjacent targets; drawers and sheets use native-feeling transitions 200ms.

**Virtual keyboard handling**: listen to `visualViewport` resize/scroll; the composer sticks above the keyboard (`visualViewport.height` drives a CSS variable, no fixed-bottom overlap); canvas bottom padding tracks composer height; on focus, scroll the composer into view without scrolling the streaming region out of `aria-live` announcement context. Safe-area insets (`env(safe-area-inset-bottom)`) pad the composer on notched devices.

**Streaming readability**: while streaming on mobile, RunStepsBlock is one status line; text streams normally; auto-scroll respects user scroll-up with a "Jump to latest" pill; font size stays at body-sm minimum 15px — no shrinking below 15px on mobile.

## 3. Homepage per section (S1–S17)

| Section | <768px | 768–1023px | ≥1024px |
|---|---|---|---|
| S1 announcement | One line, ellipsis; link wraps | Same | Full line with link inline |
| S2 nav | Logo + Agent + CTA + hamburger sheet | Same as mobile until 1024 | Full anchor set inline |
| S3 hero | Single column, H1 clamp lower bound, single primary CTA + chips stacked | Two-col optional from 1024 | Eyebrow/H1/subhead left, CTAs + chips below; full clamp |
| S4 workspace visual | Sidebar hidden; steps full-width; static frame | Scaled composition | Full composition with sidebar |
| S4b teaser | Stacked: copy then composition (internal scroll) | Stacked | Two-column: copy left, composition right |
| S5 marquee | Static single row (reduced motion or narrow) | Marquee, slower | Full marquee, pause on hover |
| S6 stats | 2×2 grid | 2×2 | 4-across |
| S7 surfaces | Tabs = horizontal scroll row; card full-width | Tabs scroll row | 5 tabs inline |
| S8 value props | Stacked | Stacked | 3-across |
| S9 stats | Stacked | 3-across | 3-across with dividers |
| S10 live demo | Composer full-width; pillars 2×2 | Pillars 4-across | Composer max 720px; pillars 4-across |
| S11 roster | 1 column | 2 columns | 4 columns |
| S12 trust | Stacked | 2×2 | 4-across |
| S13 integrations | 2-col grid | 4-col | 7-col rows |
| S14 testimonial | Full-width quote | Constrained 640px | Constrained 720px with bronze rule |
| S15 pricing | Stacked cards | 3-across from 1024 only; 2+1 awkward — stay stacked until 1024 | 3-across, Growth elevated |
| S16 final CTA | Stacked CTAs | Inline CTAs | Headline + CTAs centered |
| S17 footer | Accordion columns | 3 columns | 3 columns + brand row |

## 4. Accessibility across breakpoints

- Landmarks and reading order are identical at every breakpoint; the mobile drawer and desktop sidebar are the same landmark (`nav` labelled "Threads") rendered differently.
- Focus is never lost on breakpoint transitions (resize/rotation): drawers closed at one width must not leave focus inside a hidden element — the Sheet unmounts its content below the breakpoint.
- Touch targets ≥44px on coarse pointers (`pointer: coarse`); hover-only information always has a non-hover path.
- `aria-live` regions persist on mobile; the single-status-line streaming mode announces step completions identically to desktop.
- Zoom to 200% at 1280px must keep the workspace usable (canvas reflows to one column; no horizontal scroll of the thread).
- Reduced motion applies at all widths; the mobile sheet uses fades instead of slides when reduced.

## 5. Testing checklist per breakpoint

| Check | 640 | 768 | 1024 | 1280 | 1536 |
|---|---|---|---|---|---|
| No horizontal scroll (homepage + workspace) | yes | yes | yes | yes | yes |
| 3-zone workspace renders | no | no | rail/drawer | full | full |
| Composer sticks above keyboard (device or devtools touch) | yes | yes | n/a | n/a | n/a |
| Drawer focus trap + return focus | yes | yes | yes (drawer) | n/a | n/a |
| Model selector sheet vs popover | sheet | sheet | popover | popover | popover |
| Touch targets ≥44px (coarse pointer) | yes | yes | yes | n/a | n/a |
| LCP < 2.5s homepage (throttled) | yes | yes | yes | yes | yes |
| INP < 200ms on tabs/nav (throttled) | yes | yes | yes | yes | yes |
| 200% zoom at 1280 usable | n/a | n/a | n/a | yes | n/a |
| Landscape rotation keeps composer focus + draft | yes | yes | n/a | n/a | n/a |

Run with keyboard-only pass and a screen-reader smoke test (streaming announcement, drawer, tabs) at 1280 and 390 widths.

## Related docs

- [agent-ui-spec.md](./agent-ui-spec.md) — layout regions and mobile essentials source
- [homepage-spec.md](./homepage-spec.md) — section definitions S1–S17
- [design-system.md](./design-system.md) — spacing/touch/motion tokens
- [component-map.md](./component-map.md) — Sidebar/Sheet component wiring
- [../09-diagrams/system-architecture.svg](../09-diagrams/system-architecture.svg)
