# Relationships

> Purpose: Map every relationship between MVP entities — cardinality, foreign key, and delete behavior — then connect them to access patterns, integrity rules, and the future relationship set.

Entity field details: [entities.md](entities.md). Conventions and index rationale: [database-design.md](database-design.md).

## Relationship table

| Entity A | Cardinality | Entity B | FK (column on) | On delete |
|---|---|---|---|---|
| User | 1–N | Conversation | `Conversation.userId` | Cascade on hard delete (never in MVP; soft delete is the real path) |
| Conversation | 1–N | Message | `Message.conversationId` | Cascade — but messages **persist while the conversation is only soft-deleted**; physical cascade fires at purge |
| Message | 1–0..1 | AIRequest | `Message.aiRequestId` (unique, nullable) | Cascade with message purge; user messages have no AIRequest |
| User | 1–N | AIRequest | `AIRequest.userId` | Cascade (user deletion is a future flow) |
| User | 1–N | UsageRecord | `UsageRecord.userId` | Cascade; unique `(userId, day)` |
| User | 1–N | Session / Account | `Session.userId`, `Account.userId` | Cascade (Auth.js standard) |
| ModelCatalog | 1–N | AIRequest | **Logical only**: `AIRequest.modelId` string — no DB FK | N/A — catalog rows are retired, never deleted, so history always resolves |
| AuditLog | N–1 (polymorphic) | any entity | No FK: `targetType` + `targetId` strings | Dangling references allowed by design — audit rows must survive target deletion |

## Decided: UsageRecord aggregation rule

**UsageRecord is a per-user-per-day aggregate written by `usageService`** — there is no AIRequest→UsageRecord FK. Rationale and mechanics:

- Per-request detail (tokens, cost, latency, status) lives on `AIRequest`; the daily aggregate exists for cap preflight and the usage panel, where a single unique row `(userId, day)` beats scanning request rows.
- Written as an idempotent upsert after the end-of-stream transaction; a crash between the two writes reconciles via an `AIRequest` scan in the Phase 8 job path ([backend-architecture.md](../03-system-architecture/backend-architecture.md)).
- Logical linkage for reconciliation: `AIRequest.createdAt::date = UsageRecord.day AND AIRequest.userId = UsageRecord.userId`. This is a query-time join, never a stored key, so backfills and late writes cannot violate integrity.

## Message ↔ AIRequest direction

The creation link is stored on Message (`aiRequestId`, unique, nullable) — the assistant message points at the request that produced it. An `AIRequest` can exist **without** a Message (failed/aborted requests before any assistant content was persisted); the 1–0..1 direction captures exactly that. Reverse navigation (request → message) uses the unique index — still one hop, and it keeps `AIRequest` insert order independent of message persistence.

## Access-pattern to relationship mapping

| Query (from [data-architecture.md](../03-system-architecture/data-architecture.md)) | Join path | Index serving it |
|---|---|---|
| Thread list with message counts | User → Conversation (1–N), aggregate Message count | `(userId, updatedAt)` partial + `(conversationId, createdAt)` |
| Open thread + history | Conversation → Message (1–N) | `(conversationId, createdAt)` |
| Attach usage/cost to an answer in UI | Message → AIRequest (0..1) | Unique `(aiRequestId)` |
| Daily cap preflight | User → UsageRecord (1–N filtered to today) | Unique `(userId, day)` |
| Observability dashboard: spend by model | AIRequest → ModelCatalog (logical, `modelId`) | `(modelId)`, `(createdAt)` |
| Audit trail for a thread deletion | AuditLog where `targetType='Conversation' AND targetId=?` | `(action)`; target lookups acceptable by scan (low frequency) |
| Sessions cleanup | User → Session (1–N) | `(userId)` FK index |

## Integrity rules

| Rule | Enforcement |
|---|---|
| No orphan messages | FK `Message.conversationId` + cascade; a message always belongs to a live-or-purging thread |
| Soft-delete nuance | Soft-deleted Conversations keep their Messages and AIRequests intact (recoverable, auditable) until the 30-day purge; purge cascades physically ([data-architecture.md](../03-system-architecture/data-architecture.md)) |
| Message 1–1 AIRequest | Unique constraint on `Message.aiRequestId` — one request produces at most one assistant message |
| UsageRecord idempotency | Unique `(userId, day)` upsert; concurrent completions serialize on the unique key |
| Catalog history safety | `AIRequest.modelId` is a string reference; ModelCatalog uses retirement (`availability = RETIRED`), never deletion |
| Audit survival | AuditLog has no FK to targets; deletions never cascade into audit history |
| Append-only audit | No update/delete code paths for AuditLog (application-enforced; documented convention) |
| Timestamps invariants | `updatedAt >= createdAt` on all entities; AuditLog's `updatedAt` equals `createdAt` |

## Future relationships (documented, not built)

| Relationship | Cardinality | Trigger |
|---|---|---|
| Organization → Membership → User | Org 1–N Membership; User 1–N Membership (N–M Org↔User) | Post-MVP organization phase |
| Attachment → Message | Attachment N–1 Message | Phase 10 files & data |
| AgentRun → ToolCall | AgentRun 1–N ToolCall | Phase 11 tool-calling |
| Prompt → AIRequest | Prompt 1–N AIRequest (if prompts move to DB rows) | Phase 7 financial AI |
| Organization → Conversation / UsageRecord | Adds `orgId` alongside `userId` (expand migration) | Post-MVP organization phase |
| BillingRecord → UsageRecord | Billing consumes aggregates | Phase 12 |

## Textual ER description

In lieu of a diagram, the MVP schema reads as three clusters joined by one hub. **The identity cluster** — `User` at the center with `Account` (external OAuth identities) and `Session` hanging off it, plus `VerificationToken` standing alone for future email flows. **The workspace cluster** — `Conversation` belongs to a User; `Message` rows belong to a Conversation and carry the content payload (`parts` jsonb); an assistant Message optionally points at exactly one `AIRequest`. **The observability cluster** — `AIRequest` references User (always) and Conversation (usually), references `ModelCatalog` logically by `modelId`, and is the per-request fact table; `UsageRecord` sits beside it as the per-user-per-day rollup; `AuditLog` stands apart, polymorphically pointing at anything without FKs. The canonical visual will live in the diagrams package; for field-level truth, the tables in [entities.md](entities.md) are authoritative.

## Related docs

- [entities.md](entities.md) — field-level specifications
- [database-design.md](database-design.md) — conventions, soft-delete policy, indexes
- [../03-system-architecture/data-architecture.md](../03-system-architecture/data-architecture.md) — lifecycle, retention, growth
- [../03-system-architecture/backend-architecture.md](../03-system-architecture/backend-architecture.md) — services enforcing these rules
- [../01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md) — D3 rationale
