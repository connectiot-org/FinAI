# FInAI — Production Audit, Remediation & Hardening Report

**Scope:** Full codebase audit and remediation of the FinAI platform (Next.js 16 + React 19 + Prisma/PostgreSQL + NextAuth v4 + OpenRouter AI gateway), verified against the live deployment at finai8.com.

**Method:** Line-by-line audit of all application source (frontend + backend), live-site probing, mock-gateway integration testing, browser E2E testing, and a final regression pass.

---

## 1. Findings

### P0 — Security (critical)

| # | Finding | Impact |
|---|---------|--------|
| S1 | **Live OpenRouter API key hardcoded** in `src/server/env.ts` and `src/app/api/chat/route.ts` as an env fallback. Verified against the live API: the key is dead (401 "User not found") — the live site's chat is non-functional because of it. | Leaked credential; broken production chat. |
| S2 | **`getCurrentUser()` never read the session** — it auto-created and returned an `ADMIN` user (`admin@finai.ai`) for every request, including anonymous ones. | Complete auth bypass; every visitor shared one admin identity. |
| S3 | **Credentials login accepted any password** — `authorize()` only checked that an email was present; password field ignored. DB-offline fallback fabricated users. | Account takeover by email alone. |
| S4 | **Sign-in page treated auth failure as success** — on `res?.error` it showed "Authenticated!" and redirected anyway. Fake "Google" flow signed in a hardcoded demo email; fake "Apple" button signed in as `cfo@northline.example`. Open redirect via unvalidated `?next=`. | Auth is cosmetic; phishing redirect vector. |
| S5 | **Committed default `AUTH_SECRET`** — forgeable JWTs if the default ships to production. | Session forgery. |
| S6 | **`DATABASE_URL` default was a SQLite path while the Prisma provider is `postgresql`** — verified live: `/api/v1/conversations` returned 500 leaking the raw Prisma error (schema, datasource block, env var name). | Broken API + information disclosure. |
| S7 | **`/api/v1/datasets` IDOR + memory DoS** — verified live: anonymous write, read and delete of any thread's dataset; unbounded in-memory `Map`. | Cross-user data access; memory exhaustion. |
| S8 | **Middleware ineffective** — off by default (`STRICT_AUTH`), `pathname.includes(".")` bypass, cookie-presence-only check. | Gate bypass. |
| S9 | **No rate limiting anywhere** — the rate-limiter module existed but was dead code. Chat endpoints cost money per call. | Abuse / cost exposure. |
| S10 | Error envelope leaked raw `err.message` (Prisma internals) on 500s; UI error copy instructed users to "update OPENROUTER_API_KEY in .env". | Information disclosure. |

### P1 — Backend correctness (critical)

| # | Finding | Impact |
|---|---------|--------|
| B1 | **Gateway mid-stream failover corrupted answers** — after partial content from candidate A was streamed, an error triggered a retry on candidate B, concatenating two answers into one persisted message. | Corrupted financial answers. |
| B2 | **Client disconnects skipped all bookkeeping** — `controller.enqueue` throwing terminated the generator early; usage recording and assistant-message persistence never ran; `ABORTED` status unreachable. | Lost usage data, lost messages on abort. |
| B3 | **`usageService` fabricated AIRequest ids on DB failure** (`ai_req_<ts>`) → FK violation on `Message.aiRequestId` → assistant message silently dropped exactly when the DB is flaky. | Silent data loss. |
| B4 | **Adapter fabricated token usage** — `promptTokens: 600` / `completionTokens: 240` defaults and a fake `costUsd` when the provider omitted usage. | Corrupted billing/telemetry data. |
| B5 | **10 of 32 configured models no longer exist on OpenRouter** (claude-3.5/3.7 family, gemini-1.5-pro, gemini-2.0-flash-001, several free models) — selecting them always fails. | Broken user-facing model choices. |
| B6 | **System prompt silently empty in serverless** — `fs.readFileSync` of untraced `prompts/` files fails on Vercel, degrading to empty string with no fallback. | No persona in production. |
| B7 | **Circuit breaker consulted only for a log line**; guardrail results (label-check, disclaimer-check) computed and discarded; injection-fencing and audit-service dead code. | Advertised protections not real. |
| B8 | **Context window produced non-contiguous history** (eviction loop kept scanning past the first non-fitting message). | Incoherent model context. |
| B9 | Health endpoint returned HTTP 200 `status:"ok"` even when the DB probe failed. | Load balancers never drain on DB outage. |

### P2 — Frontend correctness & data integrity (critical)

| # | Finding | Impact |
|---|---------|--------|
| F1 | **localStorage mount race destroyed user history** — the save effect ran before restore completed, overwriting saved threads with demo data; failures swallowed silently. | Permanent user data loss. |
| F2 | **Deleted threads resurrected on reload** — save effect skipped empty arrays, never clearing the key. | Broken delete. |
| F3 | **`th-new` → `th-<timestamp>` dataset re-key mismatch** — datasets saved under the transient id were orphaned after the first message. | Datasets lost on reload. |
| F4 | **CSV parser crashed or corrupted on real-world input** — UTF-8 BOM broke headers (Excel exports); quoted multi-line fields shifted every row; company names with regex metacharacters (`ACME (Holdings)`) threw `SyntaxError` inside the send path; `Math.max(...spread)` stack-overflowed on large files; year-less files fabricated a "2009–2023" range; accounting negatives `(1,234)` and European decimals unparseable. | Crashes and wrong numbers in a finance product. |
| F5 | **Quota bomb** — full CSV payloads serialized into `fintra_threads_v4`; one multi-MB file exceeded the 5MB localStorage budget and silently disabled ALL thread persistence. | Random total persistence failure. |
| F6 | **Fabricated analytics presented as computed** — hardcoded "+11.8% YoY", hardcoded AAPL/2019-2022 trend chart, static "$38K/month Coupa" root-cause copy, hardcoded AAPL market-cap ground-truth constants (`?? 2066.94`, "(or ~5.24x)"). | Integrity of the product's core promise. |
| F7 | Negative bars overflowed the SVG viewBox; reports "variance schedule" rendered on every tab; non-CSV files invisible in hero state; dropdowns couldn't be dismissed; auto-scroll hijacked reading; clipboard calls unguarded (silent no-op on failure while toasting success). | Broken UX details. |

### Dead code removed
`/api/chat` route (leaked key), `/api` hello-world, `src/lib/db.ts` (duplicate Prisma client), `EvidencePanel`, `FinancialContextCard`, `getFileIcon` duplicates, module-level CSV parse on bundle load, 12 unused icon imports, `--accept-data-loss` from `db:push`.

### Round 2 — fresh-eyes verification audit (second pass)

After the first remediation pass, an independent fresh-eyes audit (backend and frontend reviewed separately, "as if a different senior engineer") found **38 additional real issues — 0 P0, 2 P1, 8 P2, 28 P3**. All were fixed in this pass:

| # | Severity | Finding | Fix |
|---|----------|---------|-----|
| R1 | **P1** | **Gateway exception path still retried after content was streamed** — the B1 fix only covered the error-*event* path; an adapter *exception* mid-stream (connection reset, hard timeout) after partial content still retried candidate B and concatenated answers. | Catch block now checks `contentSentToClient` before retrying; surfaces `UPSTREAM_ERROR` with "partial answer may be incomplete". Regression-tested with a socket-teardown mock (`die-mid-stream`). |
| R2 | P2 | `reader.releaseLock()` before `reader.cancel()` made cancel a rejected no-op — upstream connection never actually cancelled on early exit. | `cancel()` alone (releases the lock implicitly). |
| R3 | P2 | **Client aborts poisoned the global circuit breaker** — up to 3 `recordFailure()` per abort; two aborted streams in 30s opened the breaker for ALL users. | Aborts return immediately without recording; breaker only tracks provider failures. |
| R4 | P2 | **DB outage silently downgraded signed-in users to guests** — wrong 401s on protected endpoints, silent loss of persistence/usage recording. | Session identity falls back to the signed JWT claims (id/email/name/role); DB-backed routes still 503 on their own queries. |
| R5 | P2 | Conversation validation failures returned 500 INTERNAL instead of 400 (ApiError.validation existed but was never used); rename lacked a malformed-JSON guard; whitespace-only titles passed. | `ApiError.validation` at both sites; JSON guard on rename + create; `z.string().trim()` schemas; malformed JSON on POST → 400 instead of silently creating a default conversation. |
| R6 | P3 | `estimated` / `fallbackFrom` / `fallbackReason` / `errorCode` accepted by usage-service but never populated. | All passed through from the stream (failover detection, estimated flag, last error code). |
| R7 | P3 | Dead code: `userService.getById/setPasswordHash/findOrCreateUser`, `modelRegistry.getModel`, `figure-restate.ts`, `domain/financial-context.ts`, `features.config.ts`, `datasetStore.listDatasets`, `z-ai-web-dev-sdk` dependency. | All removed (verified zero references first). |
| R8 | P3 | Middleware verified JWTs with raw `process.env.AUTH_SECRET` while NextAuth signs with the dev fallback — dev sessions rejected in strict mode. | Middleware uses the same `getAuthSecret()` resolution as NextAuth. |
| R9 | P3 | Rate-limit IP took the FIRST `x-forwarded-for` hop — spoofable by clients to rotate identities. | Prefers `x-real-ip`, else the rightmost XFF entry (least client-controllable hop); residual risk documented. |
| R10 | P3 | All anonymous visitors shared one `"guest"` dataset identity — cross-visitor read/overwrite/delete by guessing `ds-<th-timestamp>` ids. | Guests scoped per client IP in the dataset registry. |
| R11 | P3 | Chat stream accepted ~40MB parsed payloads (200 messages × 200k chars). | 300k-char total content cap (400 on breach). |
| R12 | P3 | 401 envelopes from `requireUser`/middleware omitted `requestId` (contract inconsistency). | `requireUser(req)` includes requestId; middleware shape aligned. |
| R13 | P3 | Upstream error body echoed verbatim to clients in SSE errors (potential internal-detail leak behind proxies). | Full body logged server-side; client gets a code + status only. |
| R14 | **P1** | **Stream failures were masked as success** — mid-stream errors with partial text persisted with no error indication; errors with a dataset attached were replaced by a canned "dataset summary" rendered as a normal successful answer. | Errors always win over the dataset fallback; partial answers are kept but visibly marked "may be incomplete"; bare errors render as gateway notices. |
| R15 | P2 | **Market Cap chart labels wrong by ~10⁶ for ≥$1T companies** (AAPL rendered "$2.1M"). | Native-unit billions formatting via `formatMarketCap` ($B/$T); no ×1000 pre-scaling; fixed double-`$$` in the Total Market Cap card; company pill count is now dynamic. |
| R16 | P2 | **"Execution History" was a fully fabricated audit trail** (hardcoded fake runs with frozen timestamps). | Derived from real threads (title, message count, models actually used, reroute status) with an honest empty state. |
| R17 | P2 | **Reports memo fabricated root causes, $38K savings, Coupa actions, and "SOC 2 / Zero Hallucination" attestations.** | Sections 3/4 quote the thread's actual assistant analysis (keyword-matched) or show honest guidance; section 5 is now a real provenance block (model, dataset, message count, "NOT independently audited"); copy-memo exports the same provenance. |
| R18 | P2 | **Streaming state was global** — switching threads mid-stream rendered the in-flight answer inside an unrelated transcript. | `streamingThreadId` tracked in the hook; streaming UI scoped per-thread. |
| R19 | P3 | Stream not aborted on unmount; `useMock` stale closure; `FileReader.onabort` hung the upload promise; mock-stream threw unhandled after cancel. | All fixed (abort-on-unmount effect, ref pattern, onabort settle, safe enqueue). |
| R20 | P3 | `handleAttachFiles` mutated the ACTIVE thread while storing under `opts.threadId` (state/storage divergence). | Reads and writes the target thread consistently. |
| R21 | P3 | Toast side effects inside a `setThreads` updater (StrictMode double-toast). | Pinned state computed outside the updater. |
| R22 | P3 | Unguarded `localStorage.setItem` in template save/delete. | try/catch with quota toast. |
| R23 | P3 | **Object-URL leak**: `createObjectURL` ran for image attachments that never rendered a preview; removal paths never revoked. | Object-URL creation removed entirely (metadata-only attachments). |
| R24 | P3 | **Orphaned `th-new` dataset resurrection** — a dataset staged on an unsent draft re-keyed onto an unrelated thread after reload. | Leftover `th-new` staged data purged on mount. |
| R25 | P3 | Server conversation API unreachable from the UI (conversationId never passed) — persistence, auto-title, usage, audit trail dead in practice. | UI lazily creates a conversation on first send (authenticated users) and threads the id through subsequent turns + `done` event; failures degrade to ephemeral. |
| R26 | P3 | Analysis view labeled hardcoded demo data as "Grounded". | Labels distinguish grounded (dataset attached) vs demo data. |
| R27 | P3 | Export button showed "Copied" even when clipboard failed; `CopyResponseButton` bypassed the clipboard fallback helper; dead sign-in fields (Organization, Remember device). | Boolean-gated copied state; shared clipboard helper used; dead fields removed. |

---

## 2. Fixes

### Security
1. **Removed the leaked key entirely**; `OPENROUTER_API_KEY` has no default and a clear `UPSTREAM_AUTH` error when missing. Deleted the dead `/api/chat` route.
2. **Real session resolution** — `getCurrentUser()` now resolves via `getServerSession` + DB lookup; anonymous callers get a non-privileged `GUEST` identity (role USER) that never touches DB writes. Protected endpoints use a new `requireUser()` guard returning 401.
3. **Real password auth** — added `passwordHash` (scrypt, async) to the User schema; first sign-in creates the account, subsequent sign-ins verify the hash; OAuth-only accounts cannot be accessed via credentials; DB failures fail closed (no fabricated users).
4. **Honest sign-in page** — real errors shown, fake Google/Apple flows removed, `?next=` validated as a same-origin relative path.
5. **`AUTH_SECRET`** required in production (dev-only insecure fallback with warning); `getAuthSecret()` helper.
6. **Graceful DB-unconfigured operation** — `DATABASE_URL` optional; health reports `unconfigured` vs `error`; generic 500s (raw Prisma messages logged server-side only).
7. **Datasets endpoint hardened** — zod validation, 100KB payload cap, 500-entry bounded registry with TTL, server-side identity (client `userId` ignored), ownership checks on GET/DELETE, rate limited.
8. **Middleware fixed** — precise static-path matching (no `includes(".")` bypass), edge-safe JWT check via `getToken`, still defense-in-depth (route handlers enforce auth independently).
9. **Rate limiting wired in** — rewritten sliding-window limiter with self-cleaning buckets and a key cap; chat stream: 60/min authenticated, 10/min guests (IP-scoped); datasets: 30/min.
10. Error envelope returns generic messages; UI error copy no longer references env vars.

### Backend
11. **Failover corruption fixed** — the gateway tracks whether any `text-delta` was emitted downstream; mid-stream failures after content surface the error instead of retrying (preventing concatenated answers). Circuit breaker now actually skips failed candidates (except the last).
12. **Client-disconnect persistence** — the SSE route drains the generator after the client is gone (safe enqueue), so usage recording and assistant-message persistence complete even on abort; aborts recorded as `ABORTED`.
13. **No fabricated records** — `usageService` returns null on failure; chat-service tolerates it. Adapter requests real usage (`stream_options.include_usage`) and marks estimates `estimated: true` instead of inventing counts.
14. **Model registry corrected against the live OpenRouter catalog** — replaced the 10 dead ids (Claude 3.5/3.7 → Sonnet 4/4.5, Gemini 1.5 Pro/2.0 Flash → 2.5 Pro/Flash, etc.) with verified ids and real pricing; removed 3 non-existent free models; fallback chains rebuilt from live free models.
15. **Prompt assembly made serverless-safe** — `outputFileTracingIncludes` bundles `prompts/`; inline fallback persona guarantees a system prompt even if file reads fail; prompt version recorded with each AIRequest.
16. **Guardrails wired in** — label/disclaimer results now emitted as an SSE `notice` event and persisted in message parts; untrusted dataset content fenced (`<financial_data>` delimiters) before reaching the model; audit service logs conversation mutations.
17. **Context window** — contiguous eviction (stops at first non-fitting message), oversized-last-turn logging.
18. **Health endpoint** — 503 on hard DB failure; distinguishes `unconfigured` vs `error`; reports AI configuration state.
19. Malformed JSON bodies → 400 (was 500); request-id header sanitized against log forging.

### Frontend
20. **localStorage lifecycle fixed** — save effect gated on restore completion; key cleared when empty (no resurrection); dataset `rawCsv`/`rows` stripped from thread serialization (quota bomb removed); quota errors surfaced via toast (once) instead of silent loss.
21. **Thread lifecycle fixed** — delete cleans dataset store + file records; `th-new` datasets/files re-keyed to the real thread id on first send; "New Thread" no longer drops file-only threads; setState-in-updater anti-patterns removed.
22. **CSV engine rewritten** — RFC-4180 record parser (quoted newlines/commas/escapes), BOM stripping, accounting negatives, US/European number formats, delimiter detection from full header line, 5MB/50k-row hard caps with clear errors (never silent truncation), honest year reporting (0 instead of fabricated ranges), case-insensitive company matching, regex-escaped query matching, capped grounding scans.
23. **Honest analytics** — YoY computed from data (hidden when unavailable); trend chart uses the actual last-4 years and selected company; adaptive money formatting (raw-dollar vs millions conventions); dataset chips guard missing years; AAPL ground-truth constants removed (computed from actual rows).
24. **UX fixes** — variance schedule renders only on its tab; negative bars clamped to the viewBox; non-CSV files visible in hero state; model selector + user menu dismiss on outside click/Escape; auto-scroll only when near bottom; all clipboard paths use one robust helper with real success/failure toasts; share modal copy honest (local-only threads).
25. Dead code removed (routes, duplicate Prisma client, unused imports/components, module-level parse).

### Configuration
26. `.env.example` documents every variable with correct postgres URL examples; `package.json` gains `typecheck`, `db:seed` (tsx), `eval` scripts and drops `--accept-data-loss`; seed no longer creates a mismatched admin user; `README` rewritten to match reality.

---

## 3. Verification

All changes verified through layered testing (no fix accepted on code change alone):

| Suite | Result | Coverage |
|-------|--------|----------|
| `tsc --noEmit` | ✅ clean | Full type safety |
| `eslint .` | ✅ clean | Lint |
| `next build` (production) | ✅ clean | Build verification, dead routes absent from route table |
| **API integration tests** (production server + mock OpenRouter gateway) | ✅ **28/28** | health semantics; 401 enforcement + no Prisma leak on conversations; SSE streaming (steps, text-deltas, usage, done); failover (429 → fallback content); mid-stream failure (partial + error, no duplication); **mid-stream socket-reset exception (partial + UPSTREAM_ERROR, no concatenated retry — regression guard for R1)**; chain exhaustion; 400 on invalid/malformed payloads; guest rate limiting (429); dataset ownership/validation/size caps; dead endpoints return 404; model registry contains no dead ids; auth fails closed without DB; security headers |
| **CSV engine unit tests** | ✅ **30/30** | BOM; quoted newlines/commas; regex-metacharacter company names; US/European/accounting/percent number formats; semicolon/TSV delimiters; honest years; case-insensitive matching; row/size caps (loud failure + at-limit parse); grounding validation messages; no fabricated constants |
| **Browser E2E tests** (real UI, agent-browser) | ✅ **19/19** | homepage + agent + sign-in render with zero page errors; chat streams end-to-end through the UI to the gateway and renders the response; thread survives reload (mount race fixed) without wiping other keys; analysis KPIs computed from data; reports/templates views; CSV upload through the UI (dataset chip, correct parse persisted, grounded question flows to gateway) |
| Live-site comparison | ✅ | Reproduced all live failures (500 Prisma leak, IDOR, dead key, MODEL_UNAVAILABLE) before fixing; verified fixed behavior locally under the same conditions |

**Gateway behavior proofs:** mid-stream failure now yields exactly the partial content + error (verified 2 text-deltas then error, no retry concatenation) — proven for BOTH the error-frame path and the connection-reset exception path; empty completions and hard 401s correctly fail over to live free-tier models.

**Round-2 UI proofs:** Market Cap card renders the correct trillion-scale total for the demo dataset ($6.33T, was million-scale misformat); company pill shows the dynamic count; error paths surface visibly instead of fabricated summaries.

---

## 4. Remaining Limitations

Honest constraints on what could and could not be verified:

1. **No valid OpenRouter key was available** (the leaked key is revoked). Live-model streaming was verified against an OpenRouter-compatible mock gateway (same wire protocol, same adapter code path). The first request against real OpenRouter will need a valid `OPENROUTER_API_KEY` set in the deployment environment.
2. **No PostgreSQL instance was available in the test environment.** All DB-backed paths were verified in their DB-unavailable degradation mode (which is also the current live-site reality: `DATABASE_URL` is unset in production). Authenticated flows (session → user lookup, conversation CRUD, usage/audit writes) require a Postgres instance and `bun run db:push` to verify end-to-end; the code paths are type-checked and their failure modes are tested.
3. **Schema change** (`User.passwordHash`) requires `prisma db push` (or a migration) on deployment — existing tables gain a nullable column, which is non-destructive.
4. **NextAuth v4 on Next.js 16** works as shipped (verified in testing) but remains the legacy major; migrating to Auth.js v5 is recommended future work, out of scope for this pass.
5. **The `/api/v1/datasets` server registry remains in-memory by design** (bounded, TTL'd, ownership-scoped, guest-scoped per IP). It is a best-effort store for DB-less deployments, not durable storage; durable dataset persistence requires the Postgres path. Guests behind the same NAT/IP share a bucket.
6. **Vercel-specific behavior** (output file tracing of `prompts/`) is configured correctly (`outputFileTracingIncludes`) but could only be verified by deploying to Vercel, which was not possible from this environment. The inline prompt fallback guarantees a sane system prompt even if tracing regresses.
7. **Google OAuth** is fully wired but untested (no client credentials available); the UI now fails honestly when it is not configured.
8. **Client↔thread localStorage is per-tab (last-write-wins across tabs)** — two simultaneous tabs do not merge histories. A `storage`-event sync/merge is possible future work; single-tab usage (the norm) is unaffected.
9. **IP-based identity (rate limits, guest dataset scoping)** relies on proxy headers when self-hosted without a trusted reverse proxy; on Vercel the platform overwrites these headers and they are reliable. Direct-exposure deployments should put a trusted proxy in front.
10. **In-memory rate limiter and circuit breaker are per-instance** — on serverless/multi-instance deployments the limits apply per warm instance, not globally. A Redis-backed limiter is future infrastructure work.

---

## 5. Deployment Checklist

```bash
# 1. Configure environment (Vercel project settings or .env)
DATABASE_URL="postgresql://…"      # required for auth + conversations
AUTH_SECRET="$(openssl rand -base64 32)"
OPENROUTER_API_KEY="sk-or-v1-…"    # required for live chat

# 2. Sync the schema (adds nullable users.password_hash)
bun run db:push

# 3. Optional: seed the model catalog
bun run db:seed

# 4. Deploy; verify
curl -s https://<host>/api/v1/health   # expect {"status":"ok","db":"ok","ai":"configured"}
```

**Rotate the leaked OpenRouter key if the account is ever revived — it is public in the git history.**
