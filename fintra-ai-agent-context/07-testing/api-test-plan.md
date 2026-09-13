# API Test Plan

> Endpoint-by-endpoint test matrix for `/api/v1/*`: happy paths, edge cases, security cases, the integration setup recipe, and OpenRouter adapter contract tests.

## Conventions

- **Error envelope** (single shape across the API, codes from the backend error catalog, ../03-system-architecture/backend-architecture.md): `{ error: { code, message, retryable? } }`. Codes align with the gateway taxonomy in ../05-ai/ai-system-design.md plus API-level codes (`VALIDATION_FAILED` 422, `AUTH_REQUIRED` 401, `NOT_FOUND` 404, `RATE_LIMITED` 429).
- **Ownership semantics**: resources belonging to another user return **404** (existence-leak prevention); 403 is reserved for authenticated-but-forbidden role cases. This choice is asserted explicitly in tests so it cannot drift silently.
- **Validation**: Zod at every boundary (D1); failures return 422 with field-level details.

## Endpoint matrix

| Endpoint | Priority | Layers covered |
|---|---|---|
| `/api/v1/auth/*` (sign-in, sign-out, OAuth callbacks) | P0 | Integration + e2e |
| `/api/v1/conversations` (CRUD) | P0 | Integration |
| `/api/v1/chat/stream` | P0 | Integration + contract |
| `/api/v1/models` | P1 | Integration |
| `/api/v1/usage` | P1 | Integration |
| `/api/v1/health` | P1 | Unit |

## /api/v1/auth

| Case | Type | Expected |
|---|---|---|
| Credentials sign-in success | Integration | 200; session cookie set with `HttpOnly`, `Secure` (prod), `SameSite=Lax`; `AuditLog` row written |
| Sign-in failure (bad password) | Integration | Generic failure copy; no user enumeration (same response for unknown email); attempt rate-limited |
| OAuth happy path (mocked provider) | Integration | Callback creates/links `User`; session established; state/nonce validated (CSRF posture per Auth.js v5) |
| Session expiry | Integration | Expired session -> 401 on protected endpoints; refresh/redirect behavior per Auth.js config |
| Logout invalidation | Integration | Session row removed; subsequent requests with the old cookie fail |

## /api/v1/conversations

| Case | Type | Expected |
|---|---|---|
| List (happy path) | Integration | Cursor pagination, stable `(userId, updatedAt)` ordering (D3 index); only own threads |
| Unauthenticated list | Integration | 401 with `AUTH_REQUIRED` envelope |
| Other user's thread by id | Integration | **404**, not 403 (ownership semantics above) |
| Create with invalid body | Integration | 422 `VALIDATION_FAILED` with field details |
| Rename / update | Integration | 200; `updatedAt` bumps; ownership enforced |
| Soft delete | Integration | `deletedAt` set (D3); excluded from list; direct GET afterwards -> 404; messages retained for audit |
| Pagination edge (exact boundary) | Integration | Cursor advances correctly when page size divides the result set exactly |

## /api/v1/chat/stream

The highest-risk endpoint; the SSE event contract is defined in ../05-ai/ai-system-design.md.

| Case | Type | Expected |
|---|---|---|
| SSE headers | Integration | `text/event-stream`, `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no` |
| Event sequence contract | Integration | Success: `step`* -> `text-delta`* -> `usage` -> `message-complete` -> `done`. Failure: any prefix -> `error` -> `done`. Terminal `done` always present |
| Abort handling | Integration | Client disconnect propagates; provider stream cancelled; partial output persisted with `incomplete` status |
| Persistence-after-stream integrity | Integration | Message `parts` saved from streamed deltas exactly; `message-complete` id matches persisted row |
| Usage rows written | Integration | One `AIRequest` row (provider, model, latency, tokens, cost, status); `UsageRecord` day bucket incremented |
| Fallback surfacing | Integration | Simulated provider 5xx -> fallback chain serves; response notes actual model; `AIRequest` records both |
| Rate limit 429 shape | Integration | `RATE_LIMITED` envelope with `retryable: true` and `Retry-After` header; no provider call made |
| Auth expiry mid-stream | Integration | Documented behavior: an in-flight stream completes (already-started Run is not killed mid-answer), the next request gets 401; asserted so the behavior cannot change silently |
| Invalid model id | Integration | 422 before any provider call; `MODEL_NOT_FOUND` never leaks provider strings |

## /api/v1/models

| Case | Type | Expected |
|---|---|---|
| Registry shape | Integration | Response schema matches `ModelDefinition` fields; values match seeded config exactly (registry is source of truth) |
| Availability filtering | Integration | `retired` hidden from default listing; `deprecated` present but flagged; UI-consumed fields complete |
| Unauthenticated access | Integration | 401 (auth required for all `/api/v1` except health, D8) |

## /api/v1/usage

| Case | Type | Expected |
|---|---|---|
| Aggregation correctness | Integration | N requests across days -> `UsageRecord` per user/day equals sums of `AIRequest` rows (tokens, cost, count); UTC day boundaries |
| Isolation | Integration | Returns only the caller's usage; other users' rows invisible |
| Empty range | Integration | Zero-filled or empty response (not an error) |

## /api/v1/health

| Case | Type | Expected |
|---|---|---|
| Liveness | Unit | 200 without auth; no secrets, no stack traces in body |
| DB ping degraded | Integration | DB down -> 503 with minimal status JSON (no connection strings) |

## Integration test setup recipe

1. **Start DB**: testcontainers spins a disposable Postgres 16 per test worker (fallback: Neon branch DB — testing-strategy.md documents the choice).
2. **Migrate**: apply committed Prisma migrations to the fresh DB (never `db push`); migration integrity is itself under test.
3. **Seed**: run the standard seed (test user + model catalog from `models.config.ts`).
4. **Factories**: create users/threads/messages per test via Prisma factories; no shared mutable state.
5. **SSE test client**: a small helper in `/tests/helpers` performs `fetch` POST, reads the `ReadableStream`, parses `data:` lines into typed events, and asserts sequence with a `expectSequence([...])` matcher. MSW intercepts provider HTTP with recorded fixtures.
6. **Isolation**: truncate between tests; unique emails/ids per factory invocation.

## OpenRouter adapter contract tests

Recorded fixtures (no live keys in CI, D8) replay real provider traffic:

| Fixture | Asserts |
|---|---|
| Success with usage | `text-delta` chunks in order; one `usage` chunk; `done` terminal |
| Missing usage block | Gateway estimate path; `usageEstimated` flag recorded |
| 429 response | `PROVIDER_RATE_LIMIT`, retryable true |
| 5xx pre-stream | `PROVIDER_UNAVAILABLE`, fallback chain triggered |
| Timeout (stalled stream) | `PROVIDER_TIMEOUT` within latencyClass budget |
| Mid-stream disconnect (no sentinel) | `PROVIDER_UNAVAILABLE` then `done` |
| Malformed SSE | `UNKNOWN` error, no crash, no partial garbage persisted |
| 401 response | `INVALID_API_KEY`, retryable false, no key material in any message |

Fixtures are versioned artifacts; re-recording requires a PR describing the provider change (testing-strategy.md fixture policy).

## Related docs

- [Testing Strategy](testing-strategy.md) — pyramid, DB choice, factories
- [AI Subsystem Design](../05-ai/ai-system-design.md) — SSE contract and failure taxonomy under test
- [Provider Abstraction](../05-ai/provider-abstraction.md) — adapter error mapping verified here
- [Backend Architecture](../03-system-architecture/backend-architecture.md) — error envelope catalog
- [Security Test Plan](security-test-plan.md) — authorization matrix and abuse cases
