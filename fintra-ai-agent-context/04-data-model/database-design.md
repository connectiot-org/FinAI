# Database Design

> Purpose: Establish persistence conventions for the PostgreSQL 16 + Prisma layer — naming, IDs, timestamps, jsonb discipline, enums, soft-delete policy, indexing strategy, migration workflow, multi-tenancy evolution, financial data types, and performance notes.

Schema-first: `schema.prisma` in `src/server/db` is the single source of truth; migrations are committed SQL reviewed like code. The entity-level field specifications live in [entities.md](entities.md); cross-entity integrity in [relationships.md](relationships.md).

## Conventions

| Convention | Rule | Rationale |
|---|---|---|
| Naming | Database objects `snake_case` (via `@map`/`@@map`); Prisma models and fields `camelCase` | Postgres convention without folding quoted identifiers into Prisma code |
| IDs | `cuid()` string primary keys on every entity | Sortable, collision-safe, URL-safe; no UUID join penalty on read-heavy paths |
| Timestamps | `createdAt` / `updatedAt` on every entity, `@db.Timestamptz()` always | Timezone-safe; every ordering rule relies on them |
| jsonb discipline | jsonb only where the schema declares it: `Message.parts` and explicit `metadata` fields; no ad-hoc jsonb buckets | Queryable schema stays relational; flexible content stays contained |
| Enums | Prisma enums (Postgres enums) over free strings for every finite set (statuses, roles, tiers) | DB-level integrity + typed code |
| Booleans | No `isActive`-style flags where a status enum or timestamp (`deletedAt`) expresses the state | One source of truth per concept |

## Soft-delete policy

| Entity | Soft delete | Mechanism | Notes |
|---|---|---|---|
| Conversation | Yes | `deletedAt timestamptz null` | Hidden from all user queries; purge after 30 days ([data-architecture.md](../03-system-architecture/data-architecture.md)) |
| Message | Indirect | Deleted only via conversation purge cascade | No user-level message deletion in MVP |
| AIRequest | Indirect | Follows conversation lifecycle; standalone failures retained 90 days | Observability integrity |
| User | Deactivation path only (future) | — | MVP has no account deletion flow |
| AuditLog | Never | Append-only | Tamper resistance |
| ModelCatalog | Never — rows are retired | `availability = RETIRED` | History of AIRequests must keep resolving |
| Session / VerificationToken | No | Native expiry cleanup | Auth.js standard |

## Indexing strategy

| Index | Table | Purpose |
|---|---|---|
| Every FK | All tables | Prisma relations are indexed explicitly (`@index`) — no unindexed joins |
| `(userId, updatedAt)` | conversations | Thread list ordering (D3 requirement) |
| `(conversationId, createdAt)` | messages | Thread history reads |
| Partial: `(userId, updatedAt) WHERE deleted_at IS NULL` | conversations | Active-thread scans skip soft-deleted rows |
| Unique `(userId, day)` | usage_records | Idempotent daily aggregate upsert |
| `(actorId, createdAt)`, `(action)` | audit_logs | Audit queries |
| Unique `(email)` | users | Credentials + OAuth linkage |
| Unique `(provider, providerAccountId)` | accounts | Auth.js account uniqueness |
| `(modelId)`, `(conversationId)`, `(userId)`, `(createdAt)` | ai_requests | Observability dashboards |
| GIN on `parts` | messages (future) | Evidence search across jsonb parts when Phase 7 search arrives; documented, not built |

## Migration policy

- **Workflow**: `prisma migrate dev --create-only` → human review of generated SQL → apply in dev; CI runs `migrate deploy` against the preview branch DB; production runs `migrate deploy` in CD before rollout ([deployment-architecture.md](../03-system-architecture/deployment-architecture.md)). Shadow database enabled for diff correctness.
- **Expand-contract**: additive first, backfill, switch reads, contract later ([data-architecture.md](../03-system-architecture/data-architecture.md)). Keeps releases rollback-safe.
- **No destructive auto-migrations**: column drops, type narrowing, and renames are hand-written, standalone, and reviewed against the N-1 compatibility rule.
- **Seeds**: idempotent seed scripts populate `ModelCatalog` from `src/config/models.config.ts` and the initial admin user; seeds run per environment bootstrap and are safe to re-run.

## Multi-tenancy evolution path

| Stage | Scope | Design |
|---|---|---|
| Now (MVP) | User-scoped | `userId` FK on Conversations/Messages/AIRequests; ownership checks in the service layer ([security-architecture.md](../03-system-architecture/security-architecture.md)) |
| Post-MVP organization phase | Organization | Add `Organization` + `Membership` (roadmap assignment deferred — D5 lists Phases 10–12 as Files & data, Advanced agents, Billing/scale); introduce `orgId` columns alongside `userId` (expand migration); queries and authorization move to org scope with per-member access rules |
| RLS option | Defense in depth | Postgres row-level security keyed on `orgId` as a second layer under application checks; connection must then use a non-superuser role with policies enabled |

**Decision deferred deliberately**: app-level scoping vs RLS vs schema-per-org is not chosen in Phase 0. Trigger for the decision: first team/organization customer. The deferred-entity definitions are stubbed in [entities.md](entities.md) so the `orgId` expansion is purely additive.

## Data types for financial values

| Rule | Spec |
|---|---|
| Money | `numeric(18,4)` for any future monetary column (amounts, balances) — **never float/double** (binary rounding is disqualifying for financial data) |
| Currency | Companion ISO-4217 code column (`currency char(3)`, e.g. `USD`, `EUR`); never infer currency from locale |
| Token cost | `costUsd numeric(12,6)` — micro-dollar precision is sufficient and honest for metering |
| Counts/tokens | Integer types; no floats for token counts |
| jsonb numbers | Permitted only inside `Message.parts` for display payload; authoritative values are relational columns |
| Ratios/percentages | Stored as numerics with documented scale; formatting to Geist Mono happens in the UI layer (D6) |

These rules bind now even though no money columns exist in MVP — Phase 7 (financial data) inherits them without migration churn.

## Performance notes

| Topic | Note |
|---|---|
| Connection pooling | All runtime access via the Neon pooled endpoint (pgBouncer, transaction mode); `DIRECT_URL` only for migrations. Per-instance `connection_limit` sized so instances × pool stays under the Neon ceiling |
| pgBouncer + Prisma | Prepared-statement cache disabled under transaction pooling (documented Prisma setting) |
| N+1 guardrails | Prisma `include`/`select` for every relation read (thread list includes counts, not message rows); dev-mode query logging with a per-request query budget; service tests assert fetch strategy on hot paths |
| Cursor pagination | Keyset on `(createdAt, id)` or `(updatedAt, id)` — `skip`/`take` offsets are forbidden on large tables |
| Payload shaping | Thread list queries never fetch `Message.parts`; history pages fetch parts only for the requested page |
| Write pattern | Per stream: one user-message insert + one end-of-stream transaction (AIRequest + assistant message) — no per-chunk writes ([backend-architecture.md](../03-system-architecture/backend-architecture.md)) |

## Related docs

- [entities.md](entities.md) — field-level specifications per entity
- [relationships.md](relationships.md) — cardinalities, FKs, integrity rules
- [../03-system-architecture/data-architecture.md](../03-system-architecture/data-architecture.md) — lifecycle, retention, growth plan
- [../03-system-architecture/backend-architecture.md](../03-system-architecture/backend-architecture.md) — services and transactional boundaries
- [../03-system-architecture/deployment-architecture.md](../03-system-architecture/deployment-architecture.md) — migration gating in CD
- [../01-context/assumptions-and-decisions.md](../01-context/assumptions-and-decisions.md) — D1/D3 rationale
