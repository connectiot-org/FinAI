# Data Architecture

> Purpose: Describe how data moves through Fintra — flows with PII classes, the conversation lifecycle, the target-state canonical financial model, retention policy, access patterns, growth plan, backup/DR, and migration discipline.

## Data flows

| Flow | Producer | Consumer | Store | PII class |
|---|---|---|---|---|
| Sign-up / sign-in | Auth.js v5 | userService, AuditLog | `User`, `Account`, `Session`, `AuditLog` | Identity: email, name, OAuth IDs |
| Thread create / rename / delete | conversationService | UI thread list | `Conversation` | User content (titles derived from prompts) |
| Message append (user turn) | chatService | Thread canvas, context windowing | `Message` (role USER) | User content — highest sensitivity |
| AI request execution | AI Gateway | Observability, billing analytics | `AIRequest` | Metadata only (no prompt text); pseudonymous userId |
| Stream completion | chatService | Thread canvas | `Message` (role ASSISTANT, `parts` jsonb), `AIRequest` | AI interpretation of user content |
| Usage aggregation | usageService | Caps, UI usage panel | `UsageRecord` | Aggregate only (tokens, cost, counts) |
| Audit events | auditService | Admin/ops queries | `AuditLog` | Actor ID + action metadata, no content |
| Health probe | health handler | Uptime monitor | None (read-only checks) | None |
| Financial data ingestion (Phase 7+, future) | Integrations (Xero/QuickBooks/Stripe/banks) | Financial Context, Evidence | Deferred entities | Financial records: account refs, amounts — never raw credentials |

Rule: prompt and answer **content** is stored only in `Message.parts`; `AIRequest` stores observability metadata (tokens, cost, latency, status) and never the payload — this keeps PII exposure minimal and deletion coherent.

## Conversation data lifecycle

| Stage | Trigger | System behavior |
|---|---|---|
| Create | First message with no `conversationId` | `Conversation` row (status ACTIVE); title deferred until first completion |
| Append | Each chat turn | User `Message` persisted pre-stream; assistant `Message` + `AIRequest` persisted together at stream end ([backend-architecture.md](backend-architecture.md)) |
| Active use | Ongoing | `(userId, updatedAt)` index keeps the thread list fast; messages append-only (no edits in MVP) |
| Soft delete | User deletes thread | `deletedAt` set; hidden from all user queries instantly; messages retained |
| Purge | 30 days after soft delete | Purge job (Phase 8+ scheduled-job path; script-run before that) removes the `Conversation` and cascades `Message`/`AIRequest` removal per retention policy |
| Export | Future (Phase 10 files/data) | User-requested JSON/markdown export of a thread; deferred, documented |

## Canonical financial model (target-state only)

Not built in MVP; documented as the Phase 7+ target so early modeling decisions (jsonb `parts`, evidence references, numeric conventions) stay compatible.

- **Concept**: a unified chart-of-accounts mapping layer over heterogeneous integrations — Xero, QuickBooks, Sage/NetSuite-class ERP, Stripe, banks (per the Fintra homepage integrations set). Each connected source maps its accounts/transactions onto a canonical Fintra schema (entity, account, period, transaction, balance).
- **Why a mapping layer**: agents and Evidence must reference stable canonical IDs ("GL 6100 · 84 lines") regardless of source, and cross-source analysis (e.g. Stripe vs ledger cash) requires a common dimension model.
- **Data-class discipline** (D9): ingested records are user-provided/source data; derived aggregates are computed facts; agent narratives are AI interpretation. The three classes stay distinguishable end to end.
- **Store**: canonical tables + per-source raw staging, with `numeric(18,4)` money and ISO-4217 currency codes ([database-design.md](../04-data-model/database-design.md)). Deferred entities (`Attachment`, `ReportArtifact`, integration tables) will be specified when the phase is approved.

## Retention and PII policy

| Data | Retention | Purge mechanism | PII class |
|---|---|---|---|
| Conversation + Messages | Until soft delete + 30 days | Purge job cascade | User content (email address, financial questions) |
| AIRequest | Same lifecycle as its conversation; standalone (no conversation) rows retained 90 days | Partition drop / batch delete at scale | None (metadata) |
| UsageRecord | 24 months (aggregates) | Cronless: superseded by aggregation, no purge in MVP | None (aggregate) |
| AuditLog | 90 days hot; archive later | Batch delete post-archive | Actor ID, action, IP truncated |
| Auth.js Session/VerificationToken | Session: 30 days idle; token: on use + 7 days | Native cleanup routine | Token material |
| User | Until account deletion (future flow) | Deactivation → purge path (Phase 10+) | Identity |
| Logs (Vercel drains) | Provider default (short) | Automatic | None (deny-list enforced) |

## Access patterns (query catalog)

| Query | Pattern | Index | Notes |
|---|---|---|---|
| Thread list for user | `Conversation` where `userId = ? AND deletedAt IS NULL` order `updatedAt desc` | `(userId, updatedAt)` + partial on active | Cursor pagination (`updatedAt` + `id` keyset) |
| Thread history | `Message` where `conversationId = ?` order `createdAt asc` | `(conversationId, createdAt)` | Paginated 25/page |
| Ownership check | Point lookup `Conversation.id` → compare `userId` | PK + FK index | Service-layer, before any read |
| Usage for user/day | `UsageRecord` unique `(userId, day)`; range scans for charts | Unique composite | Upsert by usageService |
| Cap preflight | Same row as above (today's aggregate) | Unique composite | In-memory read, no scan |
| AI observability | `AIRequest` by `userId`/`conversationId`/`status`/`createdAt` range | FKs + `(createdAt)` | Dashboard queries; replica at scale |
| Audit queries | `AuditLog` by `actorId`, `action`, `createdAt` range | `(actorId, createdAt)`, `action` | Admin-only access |
| Model catalog snapshot | `ModelCatalog` where availability filter | `availability` | Cached in memory per request scope |

## Growth plan

| Step | Trigger ("adopt when") | Action |
|---|---|---|
| Partition `AIRequest` by month | Row count > 10M or table > 20 GB | Declarative monthly partitions; PK adjusted; Prisma accessed via raw migration (documented runbook) |
| Read replica for analytics | Observability queries push OLTP read p95 > 150 ms | Neon read replica; dashboards + exports move to it |
| Archive cold AI telemetry | Partitions older than 12 months | Export to object storage, drop partition; aggregates remain |
| Org multi-tenancy | First team customer | `orgId` columns + optional RLS (post-MVP organization phase; see [database-design.md](../04-data-model/database-design.md)) |

## Backup and disaster recovery

| Item | Target / mechanism |
|---|---|
| Backups | Neon managed backups + PITR (point-in-time restore window per plan, typically days) |
| RPO | ≤ 5 minutes (PITR granularity) |
| RTO | ≤ 1 hour for full restore; ≤ 10 minutes for logical corruption via PITR to pre-corruption timestamp |
| Restore runbook outline | 1) Declare incident + freeze writes; 2) create restore branch at target timestamp in Neon; 3) validate row counts + spot threads on the branch; 4) repoint `DATABASE_URL` (Vercel env) to the restored endpoint; 5) redeploy + smoke test; 6) reconcile lost window from `AuditLog`/`AIRequest` gaps; 7) postmortem |
| DR drills | Quarterly restore rehearsal on a scratch branch (documented checklist, Phase 9 hardening) |

## Data migration discipline

- **Prisma migrate workflow**: schema-first (`schema.prisma` is the source of truth). Dev: `prisma migrate dev --create-only`, review the generated SQL, then apply. Prod: `prisma migrate deploy` runs in CD **before** rollout ([deployment-architecture.md](deployment-architecture.md)). Shadow database enables diffing without touching data.
- **No destructive auto-migrations**: drops and type narrowing are never generated-and-applied blindly; every destructive step requires an explicit, reviewed migration with a rollback note.
- **Expand-contract pattern**: 1) expand (add nullable columns/tables), 2) deploy code writing both shapes, 3) backfill, 4) switch reads, 5) contract (drop legacy) in a later release. Keeps N-1 compatibility for rollback.
- **Seed scripts**: `ModelCatalog` from `src/config/models.config.ts` and the initial admin user; seeds are idempotent and run per environment bootstrap.

## Related docs

- [backend-architecture.md](backend-architecture.md) — services that produce/consume these flows
- [system-architecture.md](system-architecture.md) — containers and lifecycle walkthroughs
- [deployment-architecture.md](deployment-architecture.md) — environments, CI/CD, migration gating
- [security-architecture.md](security-architecture.md) — PII deny-list, audit, incident response
- [../04-data-model/database-design.md](../04-data-model/database-design.md) — conventions, indexes, types
- [../04-data-model/entities.md](../04-data-model/entities.md) — entity-level field specs
