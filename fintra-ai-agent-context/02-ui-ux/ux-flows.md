# Fintra UX Flows — Interaction Specifications F1–F12

> Purpose: specify every core interaction of the Fintra Workspace step-by-step — triggers, preconditions, steps, system responses, states touched, edge cases, exits, and success criteria.

Conventions: each flow lists Trigger / Preconditions / Steps / System responses inline per step / States touched (state machine per agent-ui-spec.md §7) / Edge cases / Exit. Visual and motion details defer to agent-ui-spec.md and design-system.md; journey-level view: [../09-diagrams/user-journey.svg](../09-diagrams/user-journey.svg).

## F1 — First launch (unauthenticated → gate → sign-in → empty state)

- **Trigger**: visitor navigates to `/agent` without a session.
- **Preconditions**: middleware detects no valid JWT (D1 auth stack).
- **Steps**: 1. Middleware redirects to the AuthGateScreen (rendered at `/agent` context, preserving intended URL). 2. Gate shows Playfair headline, three value bullets, "Sign in" primary → `/sign-in`, "Back to homepage" secondary. 3. User completes sign-in (credentials or Google). 4. Redirect back to `/agent`.
- **System responses**: post-auth redirect to the original target; server loads or creates the user's thread list; empty state renders (§3).
- **States touched**: auth → IDLE (empty).
- **Edge cases**: user has existing threads → threads sidebar populates and most recent thread opens instead of the empty state; sign-in failure → inline error per design-system.md §10 rules, inputs preserved; disabled JS → gate is server-rendered and functional.
- **Exit**: authenticated user sees empty state or most recent thread.
- **Success looks like**: from homepage "Open live demo" to a focused, usable Composer in under 10 seconds for a returning user; no dead ends.

## F2 — Ask the first question

- **Trigger**: user submits from the empty-state Composer (Enter, ⌘Enter, Send, or a starter-prompt card filled in).
- **Preconditions**: authenticated; empty thread; answer mode and model selected (default Auto + Quick answer).
- **Steps**: 1. User types or picks a suggested prompt. 2. Submit. 3. Optimistic user message renders instantly; Composer clears; draft storage for `__new` cleared; thread created and sidebar updates with auto-title. 4. RunStepsBlock skeleton appears (SUBMITTED). 5. Steps stream in with live status dots (STREAMING_STEPS). 6. Answer text streams into MarkdownAnswer with caret (STREAMING_TEXT). 7. On completion: evidence chips, assumptions, confidence chip, disclaimer, 3 follow-up chips, actions mount; RunStepsBlock auto-collapses to "Run · 5 steps · 3.2s" (COMPLETE).
- **System responses**: SSE via `/api/v1/chat/stream`; thread title derives from the first message; usage recorded.
- **States touched**: IDLE → SUBMITTED → STREAMING_STEPS → STREAMING_TEXT → COMPLETE.
- **Edge cases**: immediate error → F6; user scrolls up mid-stream → auto-scroll pauses, "Jump to latest" pill; user submits again mid-stream → Composer disabled (single active Run per thread in MVP); empty input → send disabled.
- **Exit**: COMPLETE with follow-ups; focus stays in canvas.
- **Success looks like**: first streamed token < 2s p50 (D10); the answer visibly separates Run, interpretation, and Evidence; composer re-enabled within 100ms of completion.

## F3 — Continue a thread

- **Trigger**: user sends a follow-up (typed or via FollowUpChips) in an existing thread, or opens a past thread.
- **Preconditions**: thread exists and is not currently streaming.
- **Steps**: 1. (If from sidebar) open ThreadItem → canvas loads persisted messages with collapsed Run blocks. 2. User sends a new message. 3. Same pipeline as F2 steps 3–7; prior messages remain collapsed and immutable.
- **System responses**: new assistant turn appends; context includes thread history per model window; title unchanged.
- **States touched**: IDLE → … → COMPLETE (per turn).
- **Edge cases**: context overflow → F6 context-overflow path; model of previous turns differs → each answer keeps its own model chip; concurrent tab open on same thread → last-write-wins with refresh note (MVP acceptable).
- **Exit**: COMPLETE.
- **Success looks like**: returning to any thread restores full history with evidence and run summaries intact (< 100ms optimistic open, D10).

## F4 — Switch model mid-thread

- **Trigger**: user opens the Model Selector (top bar or composer chip) mid-thread and picks a different model; or picks via MessageActions "Switch model and re-run".
- **Preconditions**: thread exists; selected model available (registry availability state).
- **Steps**: 1. Trigger opens popover (or full-screen sheet on mobile) grouped by provider. 2. User selects a model (keyboard: arrows/Enter; Esc cancels). 3. Popover closes; trigger chip updates. 4. Subtle system note renders: "Next answer will use {model}."
- **System responses**: selection is sticky for the thread (D4); no request is made until the next send; degraded models show an amber dot with confirmation-free warning in the option row.
- **States touched**: none (pre-send); next turn's Run records the chosen model.
- **Edge cases**: user picks Auto → note reads "Next answer will use Auto."; model retired between selection and send → gateway falls back per D4 and the fallback is surfaced in the run summary; popover opened during streaming → allowed; affects next message only.
- **Exit**: selector closed, chip updated.
- **Success looks like**: a user can explain in one glance which model answered which turn, and switching never mutates past answers.

## F5 — Regenerate and stop

- **Trigger**: Regenerate in MessageActions; or Stop while streaming.
- **Preconditions**: a completed turn (regenerate) or an active stream (stop).
- **Steps (stop)**: 1. User clicks Stop (composer button swaps to Stop during streaming). 2. Client aborts SSE and notifies backend. 3. Partial text is kept and marked "Stopped"; Run summary shows "Stopped at step N of 5". 4. Actions appear; Regenerate offered.
- **Steps (regenerate)**: 1. User clicks Regenerate. 2. The last user message re-runs; if the model was switched via "Switch model and re-run", the new model is used and the system note shows. 3. The previous answer is replaced in place; run summary updates. 4. Streaming pipeline as F2.
- **System responses**: stop persists partial content (status `stopped`); regenerate overwrites the single stored answer version (MVP).
- **States touched**: STREAMING_* → STOPPED; COMPLETE → SUBMITTED → … → COMPLETE.
- **Edge cases**: stop during STREAMING_STEPS (no text yet) → run block collapses with "Stopped"; regenerate after model fallback → uses fallback chain; double-click Stop → idempotent.
- **Exit**: STOPPED or COMPLETE.
- **Success looks like**: stopping is instant (< 150ms UI response) and never loses already-shown text; regenerating never duplicates messages.

## F6 — Error and recovery

- **Trigger**: any of the §9 error classes fires during a turn.
- **Preconditions**: active turn in ERROR.
- **Steps**: 1. ErrorState card renders with class-specific copy and recovery actions (table in agent-ui-spec.md §9): provider unavailable → "Retry" / "Retry without history"; rate limit → retry with 10s mono countdown; context overflow → "Start a new thread" / "Retry without history"; auth expired → banner + F10 path; usage cap → F9 path. 2. User acts. 3. Retry re-sends the last user message with the same model; "Retry without history" sends with cleared thread context (explicitly labelled). 4. Pipeline resumes at SUBMITTED.
- **System responses**: the failed partial turn is retained above the error card until a successful retry replaces it; error details never expose provider names or model IDs.
- **States touched**: ERROR → SUBMITTED → … (or ERROR persists on repeat failure).
- **Edge cases**: repeated failure (3×) → copy adds "The provider may be down. Try again later or switch model in the composer."; offline mid-stream → offline banner + stream abort, partial kept.
- **Exit**: COMPLETE on success; user may also abandon (navigate away — draft preserved).
- **Success looks like**: the user always knows what happened, what their options are, and never loses their typed message.

## F7 — New thread and abandon (draft preservation)

- **Trigger**: ⌘K or "New thread" while the current thread has an unsent composer draft.
- **Preconditions**: draft non-empty in current thread (or `__new`).
- **Steps**: 1. User triggers New thread. 2. Current draft is persisted under the current thread key (debounced 300ms writes already cover this). 3. Canvas switches to empty state; if `__new` had a draft, it is restored into the composer. 4. Returning to the abandoned thread later restores its draft.
- **System responses**: no thread is created until first send (threads are created lazily on first message).
- **States touched**: IDLE (view switch only).
- **Edge cases**: draft exists in both `__new` and a thread → each restores to its own context; ⌘K during streaming → allowed; the stream continues in background and the thread shows its state when revisited.
- **Exit**: empty state with restored draft.
- **Success looks like**: no user-typed text is ever lost by navigation, refresh, or ⌘K.

## F8 — Rename / delete thread

- **Trigger**: ThreadItem hover/focus actions (desktop) or long-press/swipe menu (mobile).
- **Preconditions**: thread owned by user (ownership check per D8).
- **Steps (rename)**: 1. Click Rename → title becomes inline input, text selected. 2. Enter commits; Esc cancels; blur commits. 3. Sidebar updates optimistically.
- **Steps (delete)**: 1. Click Delete → confirm Dialog: "Delete this thread? This cannot be undone." (destructive variant). 2. Confirm → item removed optimistically; soft delete in DB (D3). 3. If deleted thread was active → canvas moves to empty state.
- **System responses**: list interaction optimistic (< 100ms, D10); audit log records the mutation.
- **States touched**: none (thread-level operations).
- **Edge cases**: rename to empty → revert to auto-title; delete during active stream in another tab → stream aborts with thread-gone error handled as F6 variant; mobile menu ensures 44px targets.
- **Exit**: updated list.
- **Success looks like**: destructive action always requires explicit confirmation; optimistic updates never leave ghost items.

## F9 — Usage limit reached

- **Trigger**: UsageService reports 80% (soft) or 100% (hard cap) of the monthly allowance.
- **Preconditions**: authenticated user with usage records (UsageRecord table, D3).
- **Steps (soft warn at 80%)**: 1. Once per session, a warning Toast: "You've used 80% of this month's allowance." with Dismiss. 2. UsageIndicator switches to warn state (amber dot).
- **Steps (hard cap)**: 1. Next submit is blocked pre-flight (no provider call). 2. Composer area shows the usage-cap state copy: "You've used all of this month's workspace allowance." with "Learn about limits" (until billing exists, it shows the hint "Higher limits arrive with paid plans" and stays non-routing). 3. History, reading, and copying remain fully available; only new Runs are blocked.
- **System responses**: server enforces the cap independently of UI (rate-limit layer per D8); every blocked attempt logs to audit.
- **States touched**: IDLE → (blocked) usage-limit state.
- **Edge cases**: cap reached mid-stream → the stream completes (no mid-run cut) and the cap applies to the next submit; admin/test users bypass via config.
- **Exit**: warning dismissed or upgrade path taken when billing ships (Phase 12).
- **Success looks like**: users are never surprised — an 80% warning always precedes a hard cap, and past work stays accessible.

## F10 — Sign out / session expiry mid-stream

- **Trigger**: user clicks Sign out in the account menu; or the JWT expires while a Run streams.
- **Preconditions**: active session (and active stream for the expiry case).
- **Steps (sign out)**: 1. Click → session cookie cleared server-side; redirect to AuthGateScreen. 2. Any local drafts remain in `localStorage` (per-device drafts survive).
- **Steps (expiry mid-stream)**: 1. API returns 401 during streaming. 2. Client aborts the stream; partial content is preserved and persisted if the backend accepted it before expiry; an inline banner replaces the composer: "Your session expired. Sign in again to continue — this thread is saved." 3. "Sign in" → `/sign-in` with post-login redirect back to the same thread.
- **System responses**: middleware guards all `/agent` routes; refresh-token rotation per Auth.js v5 defaults.
- **States touched**: any streaming state → ERROR (auth-expired variant) → auth gate.
- **Edge cases**: expiry during SUBMITTED (nothing streamed) → turn is not persisted; user marked retriable on return; multiple tabs → one tab's re-login re-validates the others on next request.
- **Exit**: re-authenticated user resumes the exact thread.
- **Success looks like**: no partial answer is lost or duplicated, and the return path lands where the user left off.

## F11 — File upload and analysis (FUTURE — not in MVP)

- **Status**: documented hook only. Attach button renders disabled with tooltip "Coming in Phase 7" (agent-ui-spec.md §5).
- **Planned shape**: paperclip trigger; select file → type/scan validation (D8 prompt-injection defenses) → attachment chip in composer → evidence chips reference the file ("Q3 budget.xlsx · 12 sheets"); states add UPLOADING/UPLOADED; edge cases: oversized, unsupported type, rejected-on-scan with reason copy. Entity hook: deferred `Attachment` (D3). Do not build before Phase 7.

## F12 — Approval-gated actions (FUTURE — not in MVP)

- **Status**: documented hook only (homepage promises "Approval before action"; agents that *act* arrive post-MVP, Phase 11).
- **Planned shape**: a Run proposes an action (e.g., "Post 5 accrual journals"); a review card shows the exact change with Approve/Reject (Approve primary-emerald, Reject danger); states add AWAITING_APPROVAL → APPROVED/REJECTED with audit entries; edge cases: approval expiry, multi-approval (future RBAC), reject-with-reason. Entity hooks: deferred `AgentRun`, `ToolCall` (D3); the human always passes last (D9); bronze "audit" styling on approval artifacts.

## Related docs

- [agent-ui-spec.md](./agent-ui-spec.md) — states, composer, model selector, error taxonomy
- [responsive-strategy.md](./responsive-strategy.md) — mobile variants of these flows
- [ux-flows diagrams](../09-diagrams/user-journey.svg) — journey-level visualization
- [../01-context/project-context.md](../01-context/project-context.md)
- [../08-roadmap/future-capabilities.md](../08-roadmap/future-capabilities.md) — F11/F12 build timing
