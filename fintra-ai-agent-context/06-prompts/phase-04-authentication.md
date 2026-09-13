# Phase 4 — Authentication: real accounts with Auth.js v5

| Field | Value |
|---|---|
| Roadmap phase | P4 — Authentication (Auth.js v5, protected `/agent`) |
| Depends on | P3 (schema, services, env, rate limiter) |
| Estimated effort | S–M |
| Load before this prompt | `master-development-prompt.md`, `../01-context/project-context.md`, `../07-testing/api-test-plan.md` |

## OBJECTIVE

Add real authentication with Auth.js v5: Google OAuth plus credentials (email + password with argon2), a JWT session cookie, middleware protecting `/agent` and `/api/v1` (except health), a design-consistent sign-in page, audit-log entries for auth events, and rate-limited sign-in — fully replacing the Phase 3 dev-user stub.

## CONTEXT

Phases 2–3 left `/agent` dev-gated and services running under a stubbed session. This phase makes accounts real: unauthenticated users hitting `/agent` get a gate screen, and protected API routes return the 401 envelope. The auth matrix and cookie assertions are canonical in `../07-testing/api-test-plan.md`. Roles stay minimal — USER and ADMIN only, per D1; organizations and RBAC are post-MVP.

## INPUTS

- `../07-testing/api-test-plan.md` — auth matrix, cookie-flag assertions, rate-limit expectations.
- `../01-context/project-context.md` — D1 (Auth.js v5 configuration), D8 (secrets, rate limiting, audit logging), D2 layout.
- Phase 3 output: `src/server/auth/session.ts` stub, `AuditLog` model, `RateLimiter` interface, `src/server/env.ts`, error envelope.

## TASKS

1. Env: extend `src/server/env.ts` with `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, plus `ADMIN_EMAIL` and `ADMIN_PASSWORD` (dev seeding only). Update `.env.example`.
2. Auth.js v5 configuration in `src/server/auth/index.ts`: Google OAuth provider; credentials provider verifying email + password with argon2 (`src/server/auth/password.ts` — hash and verify); JWT session strategy per D1; cookie configuration `HttpOnly`, `SameSite=Lax`, `Secure` in production (the `__Secure-` prefixed name applies automatically on HTTPS); session callbacks inject `userId` and `role` into the JWT and session object. Mount the handler at `src/app/api/auth/[...nextauth]/route.ts`.
3. Session helpers: replace the Phase 3 stub in `src/server/auth/session.ts` — `getCurrentUser()` for server components and route handlers, returning a typed `SessionUser` (id, email, role).
4. Credentials support: `src/server/services/user-service.ts` — find-or-create user by email, password hashing on the sign-up path, role assignment (default USER; ADMIN only via seed).
5. Middleware `src/middleware.ts`: protect `/agent/**` (unauthenticated → redirect to `/sign-in?next=<original>`) and `/api/v1/**` except `/api/v1/health` (return the `UNAUTHORIZED` envelope). Keep the middleware thin — it must not touch the database (edge runtime); real authorization checks stay in services.
6. Sign-in page `src/app/sign-in/page.tsx` plus `src/components/auth/*`: Google button and email/password form in the D6 design system, inline error states, the `next` redirect honoured only for same-origin paths, and a link back to the homepage. No separate marketing chrome.
7. Wire services: conversationService and all `src/app/api/v1/**` controllers use `getCurrentUser()`; remove the dev-user stub; unauthenticated API access returns the 401 envelope.
8. Audit logging: `src/server/services/audit-service.ts` writes `AuditLog` rows for sign-in success, sign-in failure (reason: invalid credentials / rate limited), and sign-out, including userId, request IP and requestId. No PII beyond email and IP (D8).
9. Rate-limit sign-in: consume the `RateLimiter` on the credentials verify path and the OAuth callback (key: email + IP; for example 5 attempts per 15 minutes), surfacing `RATE_LIMITED` to the page as a friendly error.
10. Seeding: extend `prisma/seed.ts` to upsert the `ADMIN_EMAIL` user as ADMIN with an argon2-hashed `ADMIN_PASSWORD`.

## CONSTRAINTS

- Roles limited to USER/ADMIN; no org, membership, invitation, or team features.
- Secrets only via `src/server/env.ts`; no real credentials or tokens committed, including fixtures.
- JWT session strategy per D1; the `Session` table remains for Auth.js compatibility but is not used by the JWT flow — document that in a schema comment.
- Middleware performs no database access.

## EXPECTED OUTPUT

Unauthenticated `/agent` shows the gate (redirect to sign-in); sign-in works via Google and via credentials; protected API routes return the 401 envelope without a session; audit rows record auth events; sign-in is rate limited; Phase 3 integration tests now authenticate and pass.

## FILES TO CREATE OR MODIFY

- `src/server/env.ts`
- `src/server/auth/index.ts`, `src/server/auth/password.ts`, `src/server/auth/session.ts`
- `src/server/services/user-service.ts`, `src/server/services/audit-service.ts`
- `src/middleware.ts`
- `src/app/sign-in/page.tsx`, `src/components/auth/*`
- `src/app/api/auth/[...nextauth]/route.ts`
- `prisma/seed.ts`
- Controllers and services touched to swap the stub for the real session

## TEST REQUIREMENTS

- Auth matrix per `../07-testing/api-test-plan.md`: unauthenticated GET/POST on `/api/v1/conversations` → 401 envelope; authenticated cross-user access → 403/404 per the Phase 3 matrix; `/api/v1/health` stays public.
- Cookie-flag assertions: session cookie is `HttpOnly`, `SameSite=Lax`, `Secure` on a production build; no token value appears in any response body.
- Credentials flow: wrong password → generic failure plus an audit row; correct password → session issued; the limiter trips with `RATE_LIMITED` after the configured attempts and resets after the window.
- Middleware: unauthenticated `/agent` redirects to `/sign-in?next=%2Fagent`; an authenticated request passes through.

## ACCEPTANCE CRITERIA

- [ ] Unauthenticated `/agent` shows the gate screen (redirect to sign-in); authenticated users land in the Workspace.
- [ ] The full loop works: sign in (Google OR credentials) → use `/agent` (still mocked data) → sign out → session invalid.
- [ ] All `/api/v1` routes except `/api/v1/health` return the `UNAUTHORIZED` envelope without a session.
- [ ] Audit rows exist for sign-in success, sign-in failure, and sign-out; no PII beyond email and IP.
- [ ] Sign-in is rate limited and a test proves the limit trips and resets.
- [ ] Cookie flags are asserted in tests; secrets exist only in `src/server/env.ts`-validated environment variables.
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` clean; Phase 3 integration tests run authenticated and green.

## DO NOT DO

- Do not add roles beyond USER/ADMIN, orgs, invitations, or team features (post-MVP).
- Do not add OAuth providers beyond Google.
- Do not build session-management UI (device list, revoke) — post-MVP.
- Do not touch AI, model, or streaming code (Phase 5).
- Do not implement billing or usage gating (Phase 12).

## NEXT STEP

Load `phase-05-model-layer.md`.
