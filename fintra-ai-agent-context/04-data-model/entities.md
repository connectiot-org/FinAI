# Entities

> Purpose: Specify every MVP database entity field by field — purpose, columns, constraints, indexes, lifecycle, and sample rows — plus the deferred entities, so Prisma schema and code share one authoritative reference.

Conventions (naming, cuid IDs, timestamptz, jsonb discipline, enums) are defined in [database-design.md](database-design.md); cardinalities in [relationships.md](relationships.md). The MVP/deferred split follows decision ledger D3.

## Statuses and enums catalog

| Enum | Values | Used by |
|---|---|---|
| `Role` | `USER`, `ADMIN` | User.role |
| `ConversationStatus` | `ACTIVE`, `ARCHIVED` | Conversation.status |
| `MessageRole` | `USER`, `ASSISTANT`, `SYSTEM` | Message.role |
| `PartType` | `TEXT`, `STEP`, `TOOL`, `EVIDENCE` | Message.parts[].type |
| `RunStepType` | `RETRIEVE`, `ANALYZE`, `COMPUTE`, `VERIFY`, `COMPOSE` | step parts (semantic label) |
| `AnswerMode` | `QUICK_ANSWER`, `DEEP_ANALYSIS` | AIRequest.answerMode |
| `AIRequestStatus` | `PENDING`, `STREAMING`, `SUCCEEDED`, `FAILED`, `ABORTED` | AIRequest.status |
| `AvailabilityStatus` | `AVAILABLE`, `DEGRADED`, `RETIRED` | ModelCatalog.availability |
| `LatencyClass` | `FAST`, `BALANCED`, `REASONING` | ModelCatalog.latencyClass |
| `AuditAction` | `SIGN_UP`, `SIGN_IN`, `SIGN_OUT`, `SIGN_IN_FAILED`, `CONVERSATION_CREATED`, `CONVERSATION_RENAMED`, `CONVERSATION_DELETED`, `AI_REQUEST_COMPLETED`, `AI_REQUEST_FAILED`, `ADMIN_ACTION` | AuditLog.action |

## User (Auth.js standard + role)

Purpose: an authenticated finance professional; ownership root for all data.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| email | String unique | Yes | Lowercased; sign-in identity |
| name | String? | No | From OAuth profile |
| emailVerified | DateTime? | No | Auth.js standard |
| image | String? | No | Avatar URL |
| role | Role | Yes | Default `USER`; roles-lite per D1 |
| createdAt / updatedAt | Timestamptz | Yes | |

Constraints/indexes: unique `(email)`. Lifecycle: created on first OAuth/credentials sign-up; deactivation is a future flow (no deletion in MVP). Example: `{"id":"ckq9f2...","email":"maya@northline.example","name":"Maya Kessler","role":"USER"}`.

## Account (Auth.js standard)

Purpose: one external identity (Google OAuth) linked to a User.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| userId | FK → User | Yes | Cascade delete |
| type | String | Yes | Auth.js ("oauth" / "oidc") |
| provider / providerAccountId | String | Yes | Unique as a pair |
| refreshToken / accessToken / idToken | String? | No | Encrypted at rest by Neon; never logged |
| expiresAt / tokenType / scope / sessionState | varies | No | Auth.js standard |

Constraints: unique `(provider, providerAccountId)`, index on `userId`. Lifecycle: upserted at each OAuth sign-in; deleted with the user.

## Session (Auth.js standard)

Purpose: server-side session record. JWT is the live session mechanism; this row is the compatibility/audit trail.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| sessionToken | String unique | Yes | |
| userId | FK → User | Yes | |
| expires | Timestamptz | Yes | |

Lifecycle: created at sign-in, expired rows cleaned by the native Auth.js routine.

## VerificationToken (Auth.js standard)

Purpose: reserved email-flow token (future magic links). Standard Auth.js shape — **no cuid id** (documented deviation from the ID convention; Auth.js keys it by `(identifier, token)`).

| Field | Type | Notes |
|---|---|---|
| identifier | String | Email |
| token | String | Unique |
| expires | Timestamptz | |

## Conversation (a Thread)

Purpose: one financial AI thread in the Fintra Workspace; soft-delete root.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| userId | FK → User | Yes | Ownership |
| title | String? | No | Set after first completion; ≤ 200 chars |
| status | ConversationStatus | Yes | Default `ACTIVE` |
| lastMessageAt | Timestamptz? | No | Denormalized for list sorting |
| deletedAt | Timestamptz? | No | Soft delete; purge +30 days |
| createdAt / updatedAt | Timestamptz | Yes | |

Constraints/indexes: index `(userId, updatedAt)`; partial index on active rows (`WHERE deleted_at IS NULL`); FK index on `userId`. Lifecycle: create → append → soft delete → purge. Example: `{"id":"ckthr8...","userId":"ckq9f2...","title":"EBITDA decline vs budget","status":"ACTIVE","lastMessageAt":"2025-09-14T09:12:31Z"}`.

## Message

Purpose: one turn inside a thread; content lives in the jsonb `parts` array (D3) — the only jsonb payload in MVP.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| conversationId | FK → Conversation | Yes | Cascade on purge |
| role | MessageRole | Yes | |
| parts | Jsonb (Part[]) | Yes | Text/step/tool/evidence parts; append-only |
| aiRequestId | FK → AIRequest, unique, nullable | No | Set on assistant messages (creation link) |
| createdAt / updatedAt | Timestamptz | Yes | |

Constraints/indexes: index `(conversationId, createdAt)`; unique on `aiRequestId` enforces Message 1–0..1 AIRequest. Lifecycle: user message persisted pre-stream; assistant message in the end-of-stream transaction; removed only by conversation purge.

Example `parts` jsonb (text + step + future evidence shape):

```json
[
  {
    "type": "step",
    "stepType": "RETRIEVE",
    "label": "Retrieving September P&L context",
    "status": "done",
    "detail": { "messagesLoaded": 12, "windowTokens": 4180 }
  },
  {
    "type": "text",
    "format": "markdown",
    "content": "Gross margin declined **5.0 pp** vs budget (61.0% vs 66.0%). The largest driver is contractor spend in GL 6100 — calculation: GM% = (Revenue − COGS) ÷ Revenue."
  },
  {
    "type": "evidence",
    "reserved": true,
    "ref": "future:canonical/GL:6100",
    "label": "GL 6100 · 84 lines",
    "kind": "ledger-lines",
    "confidence": 0.94
  }
]
```

## ModelCatalog

Purpose: seeded, queryable mirror of `src/config/models.config.ts` (D4); the UI renders models from registry data only.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| modelId | String unique | Yes | Registry id, e.g. `openrouter/anthropic/claude-sonnet` (illustrative) |
| provider | String | Yes | `openrouter` in MVP |
| family / displayName | String | Yes | e.g. `claude` / "Claude Sonnet" |
| contextWindow / maxOutput | Integer | Yes | Tokens |
| capabilities | Jsonb | Yes | `{reasoning, vision, tools}` booleans — declared jsonb |
| latencyClass | LatencyClass | Yes | |
| pricingTier | Integer (1–4) | Yes | Per D4 |
| pricingInputPer1M / pricingOutputPer1M | Numeric(12,6) | Yes | USD per 1M tokens |
| availability | AvailabilityStatus | Yes | Default `AVAILABLE` |
| releaseDate | DateTime? | No | |
| notes | String? | No | |
| createdAt / updatedAt | Timestamptz | Yes | |

Constraints/indexes: unique `(modelId)`, index on `availability`. Lifecycle: seeded at bootstrap; updated by config refresh; **never deleted** — retired via `availability` so historical AIRequests keep resolving.

## AIRequest

Purpose: observability record for every model call — the auditability backbone (request → model → prompt → cost → status).

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| userId | FK → User | Yes | |
| conversationId | FK → Conversation, nullable | No | Null only if the request failed before thread binding (e.g. context overflow) |
| modelId | String | Yes | Logical reference to ModelCatalog (no DB FK — registry rows must stay deletable-free/history-safe) |
| provider | String | Yes | |
| status | AIRequestStatus | Yes | |
| latencyMs / firstTokenMs | Integer? | No | Milliseconds |
| promptTokens / completionTokens | Integer? | No | From usage extraction |
| costUsd | Numeric(12,6)? | No | Registry-priced |
| estimated | Boolean | Yes | Default false; true when usage was provider-omitted |
| fallbackFrom / fallbackReason | String? | No | Routing audit ([model-routing.md](../03-system-architecture/model-routing.md)) |
| promptVersion | String? | No | Stamped prompt set ([ai-architecture.md](../03-system-architecture/ai-architecture.md)) |
| answerMode | AnswerMode? | No | |
| requestId | String | Yes | Log correlation |
| errorCode | String? | No | Error catalog code on failure |
| createdAt / updatedAt | Timestamptz | Yes | |

Constraints/indexes: indexes on `userId`, `conversationId`, `modelId`, `requestId`, `createdAt`. Lifecycle: written once in the end-of-stream transaction (with the assistant Message); no updates afterwards except none — status is final at write time (the `PENDING`/`STREAMING` values exist for future queued runs).

## UsageRecord (per-user-per-day aggregate)

Purpose: cost control aggregate written by `usageService` — **decided: per-user-per-day aggregation, not a per-request ledger** (per-request detail lives in `AIRequest`).

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| userId | FK → User | Yes | |
| day | DateTime (@db.Date) | Yes | UTC day |
| requests | Integer | Yes | Completed AI requests counted |
| promptTokens / completionTokens | Integer | Yes | |
| costUsd | Numeric(12,6) | Yes | |
| createdAt / updatedAt | Timestamptz | Yes | |

Constraints/indexes: **unique `(userId, day)`** makes the upsert idempotent. Lifecycle: upserted after each completed request; read by cap preflight and the usage panel; no purge in MVP (aggregates retained).

## AuditLog (append-only)

Purpose: security/audit trail for auth events, thread lifecycle, and admin actions.

| Field | Type | Required | Notes |
|---|---|---|---|
| id | String cuid PK | Yes | |
| actorId | FK → User, nullable | No | Null = system action |
| action | AuditAction | Yes | |
| targetType / targetId | String? | No | Polymorphic reference — **no DB FK by design** (see [relationships.md](relationships.md)) |
| metadata | Jsonb? | No | Declared jsonb; no content payloads |
| requestId | String? | No | Correlation |
| ipHash | String? | No | Hashed/truncated IP for forensics — never the raw address |
| createdAt / updatedAt | Timestamptz | Yes | `updatedAt` equals `createdAt` (append-only by convention) |

Constraints/indexes: indexes `(actorId, createdAt)`, `(action)`. Lifecycle: insert-only; 90-day hot retention.

## Deferred entities (documented, not built — per D3)

| Entity | Purpose | Trigger phase |
|---|---|---|
| Organization | Tenant root for teams | Post-MVP org phase (assignment deferred — see roadmap) |
| Membership | User↔Organization with role; RBAC basis (spec §24) | Post-MVP org phase (with Organization) |
| Attachment | Uploaded files (board packs, CSV) linked to Messages; drives long-context routing | Phase 10 (files & data) |
| Prompt | Versioned prompt rows if prompts move from files to DB; `promptVersion` already stamps AIRequest | Phase 7 (financial AI) |
| AgentRun | Scheduled/cadence agent executions beyond interactive threads | Phase 8+ (jobs) / Phase 11 (advanced agents) |
| ToolCall | Individual tool executions inside a Run, with approval state | Phase 11 (tool-calling) |
| ReportArtifact | Generated reports/board packs with evidence references | Phase 11 (advanced agents) |
| BillingRecord | Per-user/org billing events tied to UsageRecord aggregates | Phase 12 (billing/scale) |

## Related docs

- [database-design.md](database-design.md) — conventions, indexes, migration policy
- [relationships.md](relationships.md) — cardinalities and integrity rules
- [../03-system-architecture/ai-architecture.md](../03-system-architecture/ai-architecture.md) — pipeline that writes AIRequest/Message
- [../03-system-architecture/backend-architecture.md](../03-system-architecture/backend-architecture.md) — services owning each entity
- [../03-system-architecture/data-architecture.md](../03-system-architecture/data-architecture.md) — lifecycle and retention
- [../01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md) — D3/D4 rationale
