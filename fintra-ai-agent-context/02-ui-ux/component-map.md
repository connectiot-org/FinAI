# Fintra Component Map — Inventory and Build Order

> Purpose: inventory every UI component for the homepage and the Fintra Workspace, mapped to shadcn/ui primitives, with locations (D2), variants, states, props sketches, dependencies, and the Phase 1–2 build order.

## 1. Conventions

Locations follow D2 exactly: `src/components/ui/` (shadcn-based primitives, theme-agnostic), `src/components/agent/` (Workspace), `src/components/marketing/` (homepage sections). Primitives never import from `agent/` or `marketing/`; workspace and marketing components compose primitives only. "Built-on" names the shadcn/ui or library base; "Phase" is the roadmap phase (D5) that ships it. All styling binds tokens from [design-system.md](./design-system.md).

## 2. Primitives (`src/components/ui/`)

| Name | Variants | States | Props sketch | Built-on | Phase |
|---|---|---|---|---|---|
| Button | primary, secondary, ghost, danger, on-ink; sm/md/lg | default, hover, active, focus-visible, loading, disabled | `variant, size, loading?, asChild?` | shadcn Button + Slot | 1 |
| Input | default, error | focus, error, disabled | `error?: string` | shadcn Input | 1 |
| Textarea | composer, default | focus, disabled, at-limit | `maxRows, value, onChange` | shadcn Textarea + autosize hook | 2 |
| DropdownMenu | default (Model Selector base, sidebar actions) | open, item-hover, item-selected, item-disabled | `items, groups?` | shadcn DropdownMenu (Radix) | 2 |
| Popover | default (model detail, tooltips-rich) | open/closed, align | `trigger, align, side` | shadcn Popover (Radix) | 2 |
| Dialog | default, confirm-destructive | open, focus-trapped | `open, onOpenChange, title, description` | shadcn Dialog (Radix) | 2 |
| Tooltip | dark (paper surfaces), light (ink panels) | shown/hidden, delay 300ms | `label, side` | shadcn Tooltip (Radix) | 1 |
| Avatar | user, agent | — | `fallback` | shadcn Avatar | 4 (account menu) |
| Badge | capability, tier, confidence, evidence, status, financial-positive/negative, planned | — | `variant, children` | custom (full radius) | 1 |
| Card | flat, elevated, interactive | hover (interactive) | `interactive?` | custom on div | 1 |
| Sidebar | full, icon-rail, drawer | collapsed, mobile-open | `items, collapsed, onToggle` | custom + shadcn Sheet (mobile) | 2 |
| Tabs | underline (marketing), segmented (answer modes) | active, disabled, keyboard roving | `value, onValueChange` | shadcn Tabs (Radix) | 1 |
| Toast | default, warning (usage/amber), error | auto-dismiss 5s, swipe-dismiss | `title, description, variant` | shadcn Toast | 2 |
| Skeleton | text, table, step-row, message | pulsing (reduced-motion: static) | `variant, lines?` | custom | 2 |
| ScrollArea | canvas, sidebar | — | `viewportRef?` | shadcn ScrollArea (Radix) | 2 |
| Command | palette (future), new-thread | open, filtered | `cmdk` | cmdk + shadcn | 2 (⌘K only) |
| Table | financial, plain | sticky-header, zebra-off | `columns, data` | custom `<table>` + tokens | 2 |

## 3. Workspace components (`src/components/agent/`)

| Name | Consumes | Variants/states | Props sketch | Built-on | Phase |
|---|---|---|---|---|---|
| WorkspaceShell | Sidebar, TopBar, ThreadCanvas | 3-zone layout | `children` | custom | 2 |
| TopBar | Badge, Popover, Avatar, UsageIndicator | desktop/mobile | `thread?, onToggleSidebar` | custom | 2 |
| ThreadTitle | Input (inline rename) | view/editing | `title, onRename` | custom | 2 |
| ThreadList | ThreadItem, Button | grouped, empty, drawer mode | `threads, activeId` | custom | 2 |
| ThreadItem | Badge, Tooltip, DropdownMenu | active, hover, renaming | `thread, isActive, onRename, onDelete` | custom | 2 |
| ThreadCanvas | Message[], ScrollArea | empty, streaming, complete, error | `messages, status` | custom | 2 |
| Message | UserMessage or AssistantMessage | mounting | `message` | custom | 2 |
| UserMessage | Card | compact | `text, timestamp` | custom | 2 |
| AssistantMessage | RunStepsBlock, MarkdownAnswer, EvidenceRow, AssumptionCallout, ConfidenceIndicator, DisclaimerFootnote, FollowUpChips, MessageActions | streaming, complete, stopped, error | `parts, run, status` | custom | 2 |
| RunStepsBlock | StepItem, Skeleton | collapsed, expanded, streaming | `steps, elapsed, defaultCollapsed` | custom | 2 |
| StepItem | Badge (mono duration) | idle, active (pulse), done, failed | `label, status, detail?` | custom | 2 |
| MarkdownAnswer | Table, code styles | streaming caret on/off | `content: parts[]` | `react-markdown` + remark-gfm | 2 |
| FinancialTable | Table primitives | default | `columns, rows, deltaColumn?` | custom | 2 |
| EvidenceChip | Badge (bronze), Tooltip | default, drill-soon | `source, metric, quality?` | custom | 2 |
| EvidenceRow | EvidenceChip[] | wrap/scroll | `evidence[]` | custom | 2 |
| AssumptionCallout | Card (paper-alt, bronze rule) | default | `assumptions[]` | custom | 2 |
| ConfidenceIndicator | Badge, Tooltip | levels high/med/low | `confidence, refs` | custom | 2 |
| DisclaimerFootnote | caption | — | fixed copy | custom | 2 |
| FollowUpChips | Button ghost | 3 chips | `suggestions[], onSelect` | custom | 2 |
| MessageActions | Button icon, Popover, Tooltip | hover reveal (desktop), always (mobile) | `onCopy, onRegenerate, onFeedback, onModelRerun` | custom | 2 |
| Composer | Textarea, Button, ModelSelector (inline), AnswerModeToggle, Tooltip | empty, focused, streaming (stop), at-limit, offline | `draftKey, onSubmit, onStop, status` | custom | 2 |
| ModelSelector | DropdownMenu, Badge, Popover | trigger chip, popover grouped, mobile sheet | `value, onChange, context: 'bar'\|'composer'` | custom on Radix | 2 |
| ModelOption | Badge (capability/tier), dots | selected, degraded, focused | `model` | custom | 2 |
| AnswerModeToggle | Tabs segmented | quick/deep | `value, onChange` | Tabs | 2 |
| UsageIndicator | Badge, Tooltip | ok, warn 80%, cap | `usage` | custom | 2 (mocked), 12 (real) |
| ContextPanelPlaceholder | Card | collapsed/expanded | static demo content | custom | 2 |
| EmptyState | Composer, Card, ThreadItem | with/without history | `suggestions[], recentThreads` | custom | 2 |
| ErrorState | Card, Button | per error class (§9 taxonomy) | `kind, onRetry, onRetryFresh` | custom | 2 |
| StreamingCaret | span | blinking (reduced-motion: static) | — | custom | 2 |
| AuthGateScreen | Button, Card | unauthenticated | — | custom | 4 |

Dependency note: AssistantMessage is the composition root of the answer stack; it owns the part order defined in agent-ui-spec.md §4 and receives the typed `Message.parts` jsonb array (D3), so engineers must define that discriminated union (`text | step | evidence | assumption | confidence | disclaimer | followup`) before building the message stack.

## 4. Marketing components (`src/components/marketing/`)

| Name | Section | Consumes | Phase |
|---|---|---|---|
| AnnouncementBar | S1 | Button (ghost, dismiss), config | 1 |
| SiteNav | S2 | Button, Sheet (mobile menu) | 1 |
| Hero | S3 | Button, Badge (trust chips) | 1 |
| WorkspaceVisual | S4 | static composition styled from RunStepsBlock CSS | 1 |
| AgentTeaser | S4b | Badge (model/tier/evidence/confidence), mini RunSteps styling | 1 |
| LogoMarquee | S5 | CSS animation, reduced-motion static | 1 |
| StatsBand | S6 | CountUp hook (IO-gated) | 1 |
| SurfacesTabs | S7 | Tabs, Card | 1 |
| ValueProps | S8 | Card, evidence-chain styling | 1 |
| BackOfficeStats | S9 | Stat pattern | 1 |
| AgentDemo | S10 | Composer lookalike (disabled), Button | 1 |
| RosterGrid | S11 | Card, Badge, mono figures | 1 |
| TrustSection | S12 | Card/pillars | 1 |
| IntegrationsGrid | S13 | Card, Badge (planned) | 1 |
| Testimonial | S14 | Card, Playfair pull quote | 1 |
| PricingTable | S15 | Card, Button, Badge (most popular) | 1 |
| FinalCTA | S16 | Button, ink panel | 1 |
| SiteFooter | S17 | ink panel, link columns | 1 |

## 5. Build order recommendation

**Phase 1 (marketing, in order):** design tokens in `globals.css` + Tailwind 4 `@theme` → Button, Badge, Card, Tooltip, Tabs, Sheet → SiteNav + AnnouncementBar (routing to `/agent` and `/sign-in`) → Hero → WorkspaceVisual → AgentTeaser → remaining sections top-to-bottom → a11y/perf pass against budgets (D10).

**Phase 2 (Workspace shell, in order):** 1) Message parts type union + `models.config.ts` typing (shared with D4 registry); 2) primitives: Textarea (autosize), DropdownMenu, Popover, Dialog, Toast, Skeleton, ScrollArea, Command, Table; 3) shell: WorkspaceShell, TopBar, Sidebar/ThreadList/ThreadItem, ThreadCanvas; 4) EmptyState + Composer (draft persistence, modes, ⌘K); 5) answer stack: RunStepsBlock/StepItem → MarkdownAnswer/FinancialTable → EvidenceRow/AssumptionCallout/ConfidenceIndicator/DisclaimerFootnote → FollowUpChips/MessageActions; 6) ModelSelector/ModelOption/AnswerModeToggle; 7) states: StreamingCaret, ErrorState, UsageIndicator, offline banner; 8) mock-data layer behind the future `conversationService` interface so Phase 6 swaps mocks for SSE without component changes.

Rationale: the message-parts union and the model registry are the two contracts everything else depends on; typing them first prevents rework, and mocking at the service boundary keeps Phase 2 UI work backend-independent.

## Related docs

- [agent-ui-spec.md](./agent-ui-spec.md) — behavioural spec for every workspace component
- [design-system.md](./design-system.md) — token bindings
- [responsive-strategy.md](./responsive-strategy.md) — per-breakpoint component behaviour
- [../01-context/project-context.md](../01-context/project-context.md)
- [../06-prompts/phase-02-agent-ui.md](../06-prompts/phase-02-agent-ui.md)
