# Fintra Assumptions and Decisions

> Purpose: the decision record for Fintra's Phase 0 — sixteen accepted ADRs, the open assumptions behind them, and the questions that still need stakeholders. Conforms to the DECISION LEDGER v1.0 (D1–D11); where this document and the ledger disagree, the ledger wins.

Format per ADR: ID, Status, Context, Decision, Rationale, Consequences, Reversibility (cheap / moderate / expensive).

## Decision record

### ADR-001 — Next.js 16 full-stack single app
- **Status:** Accepted
- **Context:** The product needs a marketing homepage and a streaming AI workspace; the team is small and the deployment target is Vercel.
- **Decision:** One Next.js 16 App Router application (React 19, TypeScript strict) serves marketing, auth, and the Fintra Workspace; no monorepo tooling.
- **Rationale:** RSC reduces client data plumbing; a single app keeps phases additive; the live homepage already runs Next.js App Router.
- **Consequences:** Route handlers under `/api/v1/*` carry backend logic; marketing and product share design tokens; server components stay the default.
- **Reversibility:** Expensive once the workspace ships; the layered `src/server` structure keeps the domain portable if a split is ever forced.

### ADR-002 — PostgreSQL 16 + Prisma ORM
- **Status:** Accepted
- **Context:** Threads, messages with heterogeneous parts, model catalogs, and audit records need relational integrity plus schema flexibility.
- **Decision:** PostgreSQL 16 with Prisma, schema-first, migrations committed to the repo; Neon as managed Postgres.
- **Rationale:** Relational integrity for ownership and audit; jsonb (ADR-009) where flexibility is needed; Prisma gives typed access with low ceremony.
- **Consequences:** Schema-first discipline required; `cuid` ids, FK indexes, and `(userId, updatedAt)` conventions per D3; Prisma client confined to `src/server/db`.
- **Reversibility:** Moderate — Prisma abstracts much, but jsonb-heavy message parts would need care in any engine swap.

### ADR-003 — Auth.js v5 over Clerk/Supabase Auth
- **Status:** Accepted
- **Context:** MVP needs Google OAuth plus email/password, session cookies, and middleware protection for `/agent`, without per-seat pricing or vendor-owned user data.
- **Decision:** Auth.js v5 (NextAuth): Google OAuth + credentials (argon2), JWT session cookie, middleware-protected `/agent`.
- **Rationale:** Cost (no per-seat auth fees), control (users and sessions in our own Postgres per D3), and no second identity vendor to reconcile.
- **Consequences:** We own password reset, session revocation, and email flows ourselves; roles are USER/ADMIN only for MVP (ADR-008).
- **Reversibility:** Moderate — standards-based sessions ease migration, but provider-specific flows (password reset emails) are ours to rebuild.

### ADR-004 — Custom AI Gateway with Vercel AI SDK v5 internals behind a ProviderAdapter port
- **Status:** Accepted
- **Context:** The gateway (registry, routing, policy, observability) is the product; raw SDKs scatter that logic; raw protocol work wastes the novelty budget.
- **Decision:** Build the Fintra AI Gateway in `src/server/ai/` and use Vercel AI SDK v5 `streamText` + provider instances purely for protocol/stream normalization inside it, behind our own `ChatCompletion` port and `ProviderAdapter` interface.
- **Rationale:** The SDK removes SSE and tool-call boilerplate; the port keeps ownership of routing, policy, and observability; if the SDK blocks a need, its internals are swapped without UI changes.
- **Consequences:** UI components depend only on our part-stream contract (steps, text deltas, usage, errors); SDK upgrades are invisible to the surface.
- **Reversibility:** Cheap by design — that is the point of the port.

### ADR-005 — OpenRouter as primary provider gateway, with direct-adapter escape hatch
- **Status:** Accepted
- **Context:** Multi-model (Fast/Balanced/Reasoning/Open tiers) needs many providers without many contracts.
- **Decision:** OpenRouter is the primary route for all models; direct OpenAI/Anthropic/Google adapters remain interface-defined and are built only on demonstrated need.
- **Rationale:** One contract covers the catalog and simplifies cost, keys, and fallback routing; direct adapters mitigate any OpenRouter outage, latency, or feature gap.
- **Consequences:** Provider data-retention policies flow through OpenRouter settings (open question below); fallback chains prefer cross-provider moves within a tier (D4).
- **Reversibility:** Cheap — the `ProviderAdapter` interface (ADR-004) is the escape hatch.

### ADR-006 — SSE streaming, not WebSocket
- **Status:** Accepted
- **Context:** Chat needs server→client incremental parts; bidirectional audio/live collaboration is not an MVP need.
- **Decision:** SSE over a POST route handler (`/api/v1/chat/stream`); the UI consumes incremental steps, text deltas, usage, and errors.
- **Rationale:** SSE fits serverless/edge-friendly deployments, needs no sticky connections, and suffices for one-directional streaming; POST avoids URL-length limits of GET-based SSE.
- **Consequences:** Stop/retry are new requests, not socket messages; a future bidirectional feature would introduce WebSockets beside — not instead of — SSE.
- **Reversibility:** Cheap/moderate — the transport sits behind the gateway's stream contract.

### ADR-007 — Model registry as config + seeded table, never hard-coded UI
- **Status:** Accepted
- **Context:** Models churn monthly; hard-coded names in components would force code deploys for catalog changes.
- **Decision:** `src/config/models.config.ts` is the authoring source; a seeded `ModelCatalog` table mirrors it; the Model Selector renders only from the registry.
- **Rationale:** Catalog changes (ids, pricing, availability, latency class) become data operations; the UI stays stable; observability joins on registry ids.
- **Consequences:** Docs show illustrative ids only and must say so; degraded/retired states are registry fields, not UI conditionals (D4).
- **Reversibility:** Cheap — the registry shape is forward-compatible.

### ADR-008 — Roles-lite auth in MVP, org RBAC deferred
- **Status:** Accepted
- **Context:** MVP serves individual professionals; multi-tenant org structures add schema, UI, and policy complexity before product-market signal.
- **Decision:** Ship USER/ADMIN roles only; `Organization`/`Membership` entities are documented (D3) but deferred; ownership checks are per-user.
- **Rationale:** Threads and usage are user-scoped in MVP; per-user ownership checks deliver the security baseline without RBAC machinery.
- **Consequences:** Sharing, team spaces, and approval workflows wait; the deferred entities constrain service design today (principle 7, data gravity).
- **Reversibility:** Moderate — retrofitting orgs means touching ownership checks across services.

### ADR-009 — Conversation messages as jsonb `parts` arrays
- **Status:** Accepted
- **Context:** Messages must hold text, run steps, tool calls, evidence references, and usage — today and in future phases — without migrations per part type.
- **Decision:** `Message.parts` is a jsonb array of typed parts; the streaming wire contract mirrors the same part shapes.
- **Rationale:** Part vocabulary will grow with the platform (D9 evidence parts, P11 tool parts); jsonb absorbs growth while typed part schemas keep validation strict.
- **Consequences:** No SQL joins into part internals — queries target the message row; part-schema versions must be documented as they evolve.
- **Reversibility:** Moderate — extracting hot part types into tables later is a contained migration.

### ADR-010 — No background jobs in MVP; Trigger.dev deferred to Phase 8+
- **Status:** Accepted
- **Context:** Scheduled agent runs and cadences (homepage's "works while you sleep") are roadmap, not MVP; jobs infrastructure before chat is speculative.
- **Decision:** MVP is fully synchronous within request/stream lifecycles; Trigger.dev is planned for Phase 8+ for scheduled runs and cadences, documented but not implemented.
- **Rationale:** Human-in-the-loop means users initiate runs; adding a job runtime now adds failure modes, monitoring, and cost with no MVP payoff.
- **Consequences:** Long work must fit streaming lifecycles; overnight/scheduled behaviors are explicitly roadmap items, never simulated in UI.
- **Reversibility:** Cheap — nothing to unwind; interface seams (services) already isolate where jobs would call.

### ADR-011 — Vercel + Neon as primary deployment; containerized alternative documented
- **Status:** Accepted
- **Context:** Small team, serverless-friendly Next.js app, managed Postgres requirement.
- **Decision:** Deploy to Vercel with Neon Postgres; a containerized Node deployment (any cloud) is documented as the alternative, not implemented.
- **Rationale:** Fastest path to production with preview deployments per phase; Neon's scale-to-zero suits pre-launch cost discipline.
- **Consequences:** SSE must respect platform streaming limits (tested at P5); the container path keeps exit plausible if economics or requirements change.
- **Reversibility:** Moderate — Next.js is portable, but edge-specific choices are kept minimal deliberately.

### ADR-012 — Warm-paper design system inherited from the live homepage; no dark mode in MVP
- **Status:** Accepted
- **Context:** The homepage already owns a distinctive, differentiated identity (D6); a second product aesthetic would fork the brand.
- **Decision:** Codify the homepage tokens (warm paper `#fbfaf8`, emerald `#006548`, bronze `#c48225`, Geist Sans/Mono, Playfair accents, 12/8px radii, 1px borders) as CSS variables; the Workspace may use a slightly cooler paper variant inside the same system; dark mode is excluded from MVP (dark ink panels only).
- **Rationale:** One system lowers design and QA cost; the identity is the credibility asset; dark mode doubles state coverage for zero MVP value.
- **Consequences:** Every component starts light-only; token definitions live in one place; any future dark theme is a token-layer exercise, not a rewrite.
- **Reversibility:** Cheap for the token layer; expensive if components hard-code colors (they must not).

### ADR-013 — Rate limiting: in-memory token bucket now, Upstash Redis later, behind `RateLimiter`
- **Status:** Accepted
- **Context:** D8 requires per-user+IP rate limits on AI endpoints from day one; multi-instance limits need shared state.
- **Decision:** MVP ships an in-memory token bucket implementation; Phase 9 swaps in Upstash Redis; both implement the same `RateLimiter` interface.
- **Rationale:** Single-instance MVP makes in-memory correct and free; the interface makes the swap a Phase 9 configuration event, not a refactor.
- **Consequences:** Horizontal scaling before Phase 9 would silently weaken limits — noted as a deployment constraint until Redis lands.
- **Reversibility:** Cheap — interface-first by construction.

### ADR-014 — Langfuse optional later, behind an observability interface
- **Status:** Accepted
- **Context:** D1 requires structured logs plus `AIRequest`/`UsageRecord` tables; LLM-specific tracing (prompt versions, traces) may become valuable at volume.
- **Decision:** Build DB + structured JSON log observability first; reserve an observability interface in the gateway; adopt Langfuse later if volume justifies it.
- **Rationale:** MVP observability needs must be answerable from our own tables (cost per user, latency per model); a vendor adds value only at trace-heavy scale.
- **Consequences:** Prompt-version fields are captured from day one (ADR-015) so any future tracing tool can join on them.
- **Reversibility:** Cheap — the interface is the seam.

### ADR-015 — Prompts as a versioned `/prompts` library, not scattered strings
- **Status:** Accepted
- **Context:** Financial AI quality depends on prompt discipline (uncertainty language, assumptions, disclaimers per D9); scattered template strings make audit impossible.
- **Decision:** All prompts live in a versioned `/prompts` directory tree (system/, financial/, analysis/, reporting/, forecasting/, error-detection/, agent/, model-specific/); the gateway assembles and logs the prompt version with every `AIRequest`.
- **Rationale:** Auditability requires reconstructing exactly which prompt produced an answer; versioned files give diffable history without a database dependency in MVP (a `Prompt` table is a documented future step, D3).
- **Consequences:** Prompt changes are reviewable commits; two different answers are only comparable when prompt versions are known — the gateway guarantees they are recorded.
- **Reversibility:** Cheap — files can seed a `Prompt` table later without reshaping call sites.

### ADR-016 — Phase order per D5; backend foundation precedes the model layer
- **Status:** Accepted
- **Context:** The original brief numbered Model Layer as P3 and Files as P7; the canonical reconciliation (D5) orders phases so persistence and auth exist before the gateway streams into them.
- **Decision:** Execution order is D5: P1 homepage polish → P2 agent UI shell → P3 backend foundation → P4 authentication → P5 model layer → P6 conversations and chat → P7 financial AI → P8 testing hardening → P9 production; P10–P12 are post-MVP (files and data; advanced agents/tools; billing and scale). The mapping table versus the original numbering is maintained in the roadmap doc.
- **Rationale:** Mocked UI (P2) can be built and validated without backend; auth (P4) must guard `/agent` before any real AI traffic; testing is continuous from P1 and hardened at P8.
- **Consequences:** Phase prompt files in `06-prompts/` follow this order; no phase starts with an unresolved dependency on a later phase.
- **Reversibility:** Expensive to reorder mid-build; the sequencing decision itself is therefore fixed for v1.

## Open assumptions

Each assumption states what breaks if it is wrong:

1. **OpenRouter availability and pricing remain stable.** If wrong: per-tier cost and latency targets slip; mitigation is the direct-adapter escape hatch (ADR-005), built sooner.
2. **Users will type or paste financial data into Threads before integrations exist.** If wrong: perceived value stalls at P6–P7; P10 (files and data) gets pulled forward.
3. **SSE satisfies all MVP interaction needs.** If wrong (voice, live collaboration): a WebSocket layer is added beside the stream contract.
4. **In-memory rate limiting suffices until Phase 9.** If wrong: abuse exposure on AI endpoints; Redis adoption accelerates.
5. **Single-region Vercel + Neon latency meets D10 budgets for the target market.** If wrong: region strategy and provider edge routing need work; first-token budget is at risk.
6. **The warm-paper system stays readable for dense workspace use.** If wrong: the cooler paper variant (D6) carries more weight; token contrast gets audited.
7. **jsonb message parts scale to evidence/tool part volume.** If wrong: hot part types are promoted to tables (contained migration, ADR-009).
8. **Auth.js v5 covers MVP flows without gaps (password reset, revocation).** If wrong: flow work is absorbed in P4 scope, not a vendor swap.
9. **Vercel AI SDK v5 `streamText` covers OpenRouter usage/tool semantics fully.** If wrong: custom normalization lands inside `ProviderAdapter` internals only (ADR-004).
10. **Roles-lite (USER/ADMIN) is acceptable to the first cohort.** If wrong: org RBAC moves from P12 to earlier, touching services broadly (ADR-008 consequence).
11. **English-only, single-currency display is fine for MVP.** If wrong: i18n and currency formatting enter the Workspace surface early.

## Open questions for stakeholders

1. Exact model IDs and pricing at build time — who owns the catalog refresh cadence, and how often?
2. Org RBAC timing — is P12 right, or do pilot customers force it earlier?
3. Langfuse adoption trigger — what request volume makes DB observability insufficient?
4. Dark mode — permanently out, or revisited after P9?
5. Homepage demo-staged claims (fictional Series A, simulated stats, demo logos/persona) — removal and reframe plan during Phase 1?
6. Pricing-to-usage mapping — do the homepage tiers (Starter/Growth/Enterprise) map to metered usage design at P12?
7. Provider data retention — is zero-retention routing required for any tier via OpenRouter settings?
8. Compliance roadmap — when do SOC 2 expectations from finance buyers enter the phase plan?
9. CTA wording — does "Open the live demo" survive once the real Workspace exists, given the honesty rule?
10. Multi-region or data-residency commitments — any target market commitments that affect ADR-011?

## Related docs

- [Project context](./project-context.md) — the master file these decisions summarize.
- [System architecture](../03-system-architecture/system-architecture.md) — ADR-001/004/006/011 in detail.
- [Data model](../04-data-model/database-design.md) — ADR-002/007/008/009 schema consequences.
- [Model strategy](../05-ai/model-selection.md) — ADR-004/005/007 runtime behavior.
- [Design tokens](../02-ui-ux/design-system.md) — ADR-012 codified.
- [Roadmap](../08-roadmap/implementation-roadmap.md) — ADR-016 phase order and mapping table.
- [Prompt library](../06-prompts/README.md) — ADR-015 structure.
