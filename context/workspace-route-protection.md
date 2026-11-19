# Workspace route protection — closing the open-dashboard bypass

Date: 19 November 2026 · Branch: `fix/workspace-route-protection`

## Problem reported by the owner

Even after the log-in entry was restricted to owner-provisioned sign-ins
(see [provisioned-login.md](provisioned-login.md)), any visitor could open
the workspace dashboard by typing a deep link directly, for example:

- https://www.finai8.com/overview
- https://www.finai8.com/demo/payables/invoices
- https://www.finai8.com/accounting/ledger, /close, /reports, /settings/* …

Nothing forced the log-in page first, and the legacy `/sample` entry still
offered a free "Enter workspace" button with no credentials at all. The
provisioned-credential work was therefore bypassable by URL.

## The fix

1. **`src/lib/workspace-session.ts` (new)** — a browser-local workspace
   session record (`sessionStorage`, 12-hour cap). It is opened ONLY by a
   successful provisioned-password verification and closed by the shell
   "Sign out". `sessionStorage` (not `localStorage`) means closing the tab
   ends the session and a fresh visit always lands on the log-in first.
   Like the rest of the browser-only demo it is a marker, not a secret:
   private customer data stays behind the backend-authenticated
   `/workspace` routes and their own `SessionGate`.
2. **`src/components/RequireWorkspaceSession.tsx` (new)** — route guard
   around every dashboard route. Accepts the browser-local workspace
   session or, when the deployment is session mode (`VITE_AUTH_MODE=session`,
   e.g. the Vercel build), a live backend `/auth` session; otherwise it
   redirects to `/login` carrying the attempted location, so a sign-in
   returns the visitor to the page they asked for.
3. **`src/app/router.tsx`** — the guard wraps the Shell data routes
   (overview, accounting, receivables, revenue, payables, banking, close,
   tools, reports, entities, automations, integrations, audit-log,
   settings) and each `/demo/payables/*` route. `/sample` now redirects to
   `/login` like `/welcome` (the free entry is closed), and the unused
   `Welcome` component was deleted. The public stateless chat
   (`/demo/assistant`) and the not-found page stay in an open Shell block —
   the chat is a deliberate anonymous marketing surface with its own
   integration suite.
4. **`src/features/marketing/LogIn.tsx`** — a verified sign-in opens the
   workspace session before navigating and honors the return location.
5. **`src/app/Shell.tsx`** — the avatar menu gains "Sign out" whenever a
   workspace session exists; it closes the session and returns to `/login`.
6. **Marketing/`Workspace` links** — links that pointed at the free
   `/sample` entry now point at `/login` ("Workspace log in", "See the
   idea in action", "Demo workspace log in").
7. **`src/lib/provisioned-credentials.ts` / `workspace-access.ts`** — a
   second build-time credential gate, `VITE_PUBLISHED_DEMO_ACCOUNT`, for
   artifacts that are intentionally freely explorable: the standalone
   invoice demo build and the CI-only integration builds. Real
   deployments (the Vercel build) never set it, so on the public site the
   only accepted sign-ins remain the owner-provisioned records.

## Deployment behavior

- **Public site (Vercel, session mode)**: anonymous deep links redirect to
  `/login`; the owner-provisioned Gmail/password signs in; paying customers
  with an active backend session pass the guard directly.
- **Local dev (`npm run dev`)**: same behavior; the Playwright web server
  provisions `VITE_E2E_ACCOUNT` so suites sign in through the real form
  (`tests/sign-in.ts`).
- **Standalone invoice demo artifact**: publishes the printed demo
  credential (`e2e.checks@northstar.example` / `correct-battery-42`) in its
  README; visitors type it once at `/login`.

## Test updates

`tests/sign-in.ts` (new) signs in through the real verification path.
Suites updated: workflows (new anonymous-redirect/return/sign-out test),
marketing (CTA → /login, closed free entry, sign-in before dashboard
visits), payables-development (sign-in for dev + artifact runs),
outstanding-customers, copy-demo, receivables-api,
receivables-configuration (spawned server provisions the credential),
workspace, assistant, checklist and subscriptions (their configs now
provision the credential), receivables-production and session-production
(their CI builds publish the demo credential).

## Verification

Commands (from `frontend/`):

- `npm run typecheck && npm run lint`
- `npm run check:repository` (new files registered in
  docs/repository-guide.md)
- `PLAYWRIGHT_CHROMIUM_PATH=<local chromium> npx playwright test` (default
  suite; the local PDF-canvas case needs the bundled CI Chromium)

Local results are recorded in [progress.md](progress.md) under
19 November 2026.
