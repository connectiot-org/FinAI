# Phase 6 — Conversations and chat: persistence meets streaming

| Field | Value |
|---|---|
| Roadmap phase | P6 — Conversations & chat (persistence, streaming wire-up, history, retry/stop) |
| Depends on | P4 (auth) + P5 (gateway, streaming API) |
| Estimated effort | M |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../05-ai/context-management.md` |

## OBJECTIVE

Connect the real gateway to the real UI: persisted conversations with streamed assistant answers, thread lifecycle endpoints wired into the Workspace, regenerate/stop semantics, context windowing, optimistic UI with error recovery, and auto-generated thread titles.

## CONTEXT

Phases 2–5 produced a mocked Workspace and a stateless streaming endpoint. This phase is where Fintra becomes a usable product: every Thread persists (D3 `Conversation`/`Message` with jsonb `parts`), streaming replaces `src/lib/mock-stream.ts` in production paths, and the Phase 3 conversationService grows into full orchestration. Context windowing is canonical in `../05-ai/context-management.md`. Financial prompt specialization stays out — that is Phase 7.

## INPUTS

- `../05-ai/context-management.md` — windowing algorithm (token budget, system-prompt reservation, eviction order).
- `../02-ui-ux/agent-ui-spec.md` — thread lifecycle (list/create/rename/delete), optimistic-update and error-recovery patterns.
- `../01-context/project-context.md` — D3 message parts shape, D4 sticky model per conversation, D7 glossary.
- Phase 5 output: gateway, `src/lib/sse-types.ts`; Phase 3: conversationService, envelope.

## TASKS

1. Orchestration `src/server/services/chat-service.ts` — `runChatTurn(conversationId, userMessage, options)`: (a) persist the user message; (b) assemble windowed context via `src/server/ai/gateway/context-window.ts` per `../05-ai/context-management.md` (token estimate utility, system-prompt reservation, oldest-first eviction, never trim the latest user turn); (c) call the gateway with the conversation's sticky model; (d) accumulate assistant parts — text deltas buffered and flushed so that `done`, `error` and abort all leave the message consistent; run steps persisted as step parts; (e) record usage via `usage-service.ts`.
2. Thread endpoints wired to the UI: `src/app/api/v1/conversations/route.ts` (GET list, POST create) and `src/app/api/v1/conversations/[id]/route.ts` (GET with messages, PATCH rename, DELETE soft-delete), extending the Phase 3 controllers; Zod schemas on every body; ownership per the Phase 3/4 matrix; canonical envelope on all errors.
3. Streaming persistence bridge: `POST /api/v1/chat/stream` gains `conversationId`; the run persists through chat-service and the `done` frame carries `messageId`. The event taxonomy does not change.
4. Client swap: add `src/lib/stream-client.ts` (fetch POST + ReadableStream SSE parser) and point `src/lib/use-thread-stream.ts` at it; keep `src/lib/mock-stream.ts` behind a feature flag for tests and Storybook only — it must be unused in production paths.
5. Stop semantics: the Composer stop button aborts the client fetch; the server detects disconnect, persists the partial assistant content with status `STOPPED` and a visible "stopped" marker part. Documented policy: partial output is kept, labeled as stopped, and never rendered as a complete answer.
6. Regenerate semantics: re-run the turn with the same windowed context minus the discarded assistant message; the previous assistant version stays in the parts history marked `regenerated`; the visible bubble shows only the current version.
7. Error recovery: network or SSE failure mid-stream → the optimistic bubble enters the error state with Retry (calls regenerate); the thread list reconciles with server state on next load; a per-turn idempotency key prevents duplicate user messages on retry.
8. Titles: after the first completed exchange, a background call on a Fast-tier model (cheap parameters) generates a title of at most six words; PATCH `Conversation.title`; the sidebar updates; on failure, fall back to a truncation of the first user message.
9. UI wiring: thread list/create/rename/delete (soft), sticky model per conversation (D4), mode switch, optimistic updates via TanStack Query mutations, `aria-live` region for streaming output.

## CONSTRAINTS

- Message persistence uses the D3 shape (jsonb `parts`); no new tables.
- Windowing runs before every gateway call and is unit-tested; trimming decisions are logged at debug level.
- The system prompt this phase is a minimal neutral placeholder — financial specialization is Phase 7.
- The SSE taxonomy is unchanged; the UI swap is producer-side only.
- Soft delete only; conversations are never hard-deleted.

## EXPECTED OUTPUT

The full authenticated lifecycle: create Thread → send → streamed persisted answer → follow-ups → rename → stop → regenerate → delete; a page reload restores history exactly; titles auto-generate; every failure path is recoverable in the UI.

## FILES TO CREATE OR MODIFY

- `src/server/services/chat-service.ts`, `src/server/services/conversation-service.ts` (extended), `src/server/services/usage-service.ts`
- `src/server/ai/gateway/context-window.ts`
- `src/app/api/v1/conversations/route.ts`, `src/app/api/v1/conversations/[id]/route.ts`
- `src/app/api/v1/chat/stream/route.ts` (persistence bridge)
- `src/lib/stream-client.ts` (new), `src/lib/use-thread-stream.ts`, `src/lib/mock-stream.ts` (flagged)
- `src/components/agent/*` (thread list wiring, stop button, error/retry states, stopped marker)
- `src/server/domain/conversation.ts` (part types including stopped/regenerated markers)

## TEST REQUIREMENTS

- Persistence-after-stream integrity: with a mocked adapter fixture, the assistant `Message.parts` equal the accumulated deltas; the usage frame matches the `AIRequest` row; message ordering is correct.
- Abort partial-save: abort after N deltas → the message persists with status `STOPPED` and exactly N deltas; the next turn's window handles it per policy.
- Windowing unit tests: over-limit histories trim per `../05-ai/context-management.md` (system prompt reserved, oldest-first eviction, latest user turn never trimmed).
- API integration: thread CRUD plus the ownership matrix (extends the Phase 3/4 suites); unauthenticated requests return the 401 envelope.
- UI tests: optimistic create/rename/delete roll back on failure; the error bubble's Retry triggers a regenerate call; the idempotency key prevents duplicate user messages.

## ACCEPTANCE CRITERIA

- [ ] The full authenticated thread lifecycle runs on real models (or documented fixture mode): send → stream → persisted → reload-safe.
- [ ] Stop produces a partial, clearly labeled message — never silently dropped, never rendered as complete.
- [ ] Regenerate replaces the visible answer while keeping history markers.
- [ ] Context windowing is enforced and unit-tested before every gateway call.
- [ ] Titles auto-generate on the first exchange via a Fast-tier call; the sidebar reflects them.
- [ ] The mock stream is used in tests/Storybook only; production paths stream from the real API.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` clean; ownership enforced on every endpoint.

## DO NOT DO

- Do not add financial system prompts, guardrails, or mode-specific prompt assembly (Phase 7).
- Do not add file uploads or attachments (Phase 10).
- Do not add tools or function calling (Phase 11).
- Do not change the SSE taxonomy or event names.
- Do not add hard deletes or bulk cleanup jobs.

## NEXT STEP

Load `phase-07-financial-ai.md`.
