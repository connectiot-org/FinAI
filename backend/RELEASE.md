# Production release runbook

Architecture: Vercel project root `frontend`, build `npm run build:vercel`, output `dist`, Node 24. The same-project API function now packages the real NestJS backend and uses a separately provisioned PostgreSQL service. See [the Vercel runbook](../frontend/docs/vercel.md) for this mode, database binding and server-only settings. The build enables the authenticated API frontend; it never migrates or seeds a production database. No credentials belong in VITE_ variables.

The existing remote proxy/Docker option remains supported. The settings and container commands below describe that option; select `FINAI_API_MODE=remote` explicitly when using a separate backend.

Backend deploy environment (secure values supplied through hosting secret settings, never committed):

```
NODE_ENV=production
CHECKLIST_IDENTITY=session
API_HOST=0.0.0.0
API_PORT=3000
PUBLIC_ORIGIN=https://your-frontend.example
API_TRUSTED_HOST=your-backend.example
DATABASE_URL=<private PostgreSQL connection with TLS and verification>
API_PROXY_TOKEN=<at least 32 random characters from secret manager>
```

Vercel server-side variables: `FINAI_BACKEND_ORIGIN=https://your-backend.example`, `FINAI_PUBLIC_ORIGIN=https://your-frontend.example`, `FINAI_PROXY_TOKEN` equal to backend API_PROXY_TOKEN. Proxy replaces all forwarded/identity headers; backend trusts only this token, exact backend Host, authenticated X-Finai-Public-Host and HTTPS forwarded protocol. TLS ingress must not log headers/bodies or expose unencrypted backend traffic. Restrict backend ingress to the proxy where hosting supports it. Do not enable Express trust proxy. Keep the ordinary ingress request limit 16 KiB, with exact POST-only 1 MiB raw-body exceptions for `/api/v1/payables/invoices/<UUID>/documents` (application/pdf) and `/api/v1/receivables/imports/preview` (application/octet-stream); reject compression and preserve the backend's session/CSRF/authorization checks. Use TLS and bounded upstream timeouts. One configured public origin per environment; preview requires its own backend configuration/database and exact origin, never wildcard trust.

Real supplier PDFs also require `AP_CLAMD_HOST` and optionally `AP_CLAMD_PORT` (default3310) in the private runtime environment. The production Compose file forwards both to the API container. The trusted scanner must be reachable over the deployment's private network with maintained signatures; no scanner is provisioned by Compose. An unset scanner host leaves real PDFs quarantined.

On a prepared host: `docker build -t finai-backend:<release-sha> backend`. Run against persistent PostgreSQL 17.6 with private network and durable volume; do not put database on ephemeral serverless filesystem. Migrate once per release with the same image and secure environment: `node node_modules/prisma/build/index.js migrate deploy`. Then start `node dist/src/main.js` behind TLS ingress. Local commands use `node --env-file=.env ...`; production environment is injected. Never run local seed in production. The additive sessions migration creates Account/Session/RateLimit only; it does not change checklist data. Existing organisations/entities/memberships remain authoritative. Bootstrap real organisation/entity via an approved administrative data process, never copy synthetic local identity into production.

Administrative account operations (trusted terminal with DATABASE_URL injected):

```
node --import tsx scripts/accounts.mts create <username> <existing-organisation-uuid>
node --import tsx scripts/accounts.mts reset <username>
node --import tsx scripts/accounts.mts revoke <username>
```

Create grants membership but no entity access. Grant/revoke existing EntityAccess rows explicitly through an approved database administration process. Password prompts are hidden and require a terminal, 12–1024 characters. Argon2id: 64 MiB, 3 iterations, parallelism 1; tune only after measured host load. Reset revokes every session in the same transaction. Sessions expire after 8 hours; logout/revocation remove rows. Login errors are generic. Database rate limits span replicas (30 logins/IP/15m, 10/account/15m; 120 mutations/user/minute). Trusted proxy supplies client IP. Keep replica/connection budgets bounded, and capacity-test Argon2 under expected concurrent attempts before release. Schedule deletion of expired Session rows and RateLimit windows older than one day. No signup, email recovery or paid identity provider.

Backups: use a restricted backup service account and secure PGPASSFILE/secret manager; never put a password in argv. `pg_dump --format=custom --file=/secure-backups/finai.dump "$PGSERVICE"` where PGSERVICE is a service name without secrets; encrypt, restrict permissions and store off-host with documented retention. Include roles/grants separately. Restore into a new isolated database using `pg_restore --exit-on-error --no-owner --dbname="$RESTORE_SERVICE" /secure-backups/finai.dump`; verify migrations, tenant row counts, constraints, session policy and CRUD/copy with synthetic records before promotion. Revoke restored sessions before accepting traffic. Never restore over the active database. Run `bash scripts/restore-rehearsal.sh` locally for a disposable synthetic dump/restore check; this does not establish production RPO/RTO or full application disaster recovery.

Rollback: stop rollout and route back to the prior compatible image/frontend. Leave additive tables/data intact; do not reverse migrations or delete tasks. A pre-session application must remain local-only, so rolling back authentication closes public API access. Restore data only via the separate verified recovery process. Keep release SHA, image digest, migration status and backup identifiers in operator records.

Release smoke checks: exact deployment preview direct `/close/checklist` and refresh; static assets 200; unknown `/api/*` and `/auth/*` JSON, never SPA HTML; anonymous API 401; sign in via HTTPS and verify Secure/HttpOnly cookie; permitted entity list/copy and cross-tenant denial; missing CSRF 403; logout/revoke/expiry/membership removal deny access; liveness/readiness; request IDs without titles/passwords/tokens; scan generated frontend assets for secret values without printing matches. Verify rate limiting under deployed replicas, graceful SIGTERM drain, persistent data across backend restart, and backup restore on target infrastructure. Hosting credentials, TLS/database provisioning, target capacity and deployed verification must be checked on the actual target. Local tests do not establish those outcomes.

For this cloud machine only, the verified platform CA can be supplied at build time with `BUILDX_CONFIG=/workspace/.finai-buildx docker build --secret id=cloud_ca,src="$NODE_EXTRA_CA_CERTS" -t finai-backend:<release-sha> backend` from the repository root. The optional BuildKit mount is not retained in the image; no TLS or checksum bypass is used. Normal hosts with standard public trust use the plain build command.

For an existing authorized single-host Docker deployment, `compose.production.yaml` provides private PostgreSQL and a loopback-published API. Use a mode-0600 `/secure/finai.env` outside the checkout containing FINAI_IMAGE (tested image digest), POSTGRES_PASSWORD, DATABASE_URL (URL-encoded password, internal host db:5432, database finai), PUBLIC_ORIGIN, API_TRUSTED_HOST and API_PROXY_TOKEN. Do not print `docker compose config`, which expands secrets. Apply the host's existing TLS ingress to loopback port 3000; never expose that port directly. For a remote database use verified TLS and the provider's supported CA configuration. Exact release sequence, only after authorization:

```
docker compose --env-file /secure/finai.env -f backend/compose.production.yaml up -d --wait db
docker compose --env-file /secure/finai.env -f backend/compose.production.yaml run --rm api node node_modules/prisma/build/index.js migrate deploy
docker compose --env-file /secure/finai.env -f backend/compose.production.yaml up -d api
```

Use the same `run --rm api` prefix for administrative `node --import tsx scripts/accounts.mts ...` commands (interactive terminal required). Configure the Vercel server-only variables and public build flags before an authorized preview, run every deployed smoke check above, and publish only after those gates pass. Never run `down -v`. Validate the host storage/backups, ingress limits, private database topology and connection/Argon2 capacity before release; this file alone does not verify them.


## Imported receivables release

See `RECEIVABLES.md` for the ordered snapshot migration, owner-reviewed source import, readiness/smoke checks and rollback. Frontend flags: `VITE_RECEIVABLES_MODE=api`, `VITE_AUTH_MODE=session`, `VITE_API_BASE_URL=/api/v1`. Preserve checklist mode separately. FINAI_PUBLIC_ORIGIN is one exact frontend HTTPS origin; API_TRUSTED_HOST is a separate backend host setting, not a second line of that origin value. No target secrets, production import or deployment is performed by implementation tests.


FinAI Assistant adds two migrations (seven total). Read [ASSISTANT.md](ASSISTANT.md) for explicit provider/price/budget/privacy controls, approved ledger mapping, retention, evaluation and rollback gates. Keep disabled until approved configuration and staging verification.


Same-project Vercel mode is now implemented; see [frontend/docs/vercel.md](../frontend/docs/vercel.md). Listener-free startup and waitUntil retention preserve existing API/auth/lease semantics. Database/schema/accounts still need real provisioning; the build never migrates or seeds production. Existing remote proxy/Docker mode stays supported.

## Google and email/password sign-in

`/login` is the sign-in entry (`/welcome` redirects there); the public accounting sample remains at `/sample`. Both password and Google login require an administrator-provided Organisation ID. Email/password uses the existing account endpoint: provision the account name as the user's lowercase email for email login. Its password is a **FinAI password**, never the user's Google password. Existing non-email account names remain compatible. No public registration or password recovery is added.

To enable Google:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), select/create your project, configure Google Auth Platform branding, audience and support contact, and create an OAuth client ID with application type **Web application**. Use the appropriate external audience if users outside your company need access; while in testing, add permitted test users.
2. Add the exact authorized JavaScript origin `https://www.finai8.com`. Add `https://finai8.com` only if you intentionally serve sign-in there too; the existing server still trusts one exact configured public origin. This popup ID-token flow uses Google Identity Services, so no application redirect URI or client secret is required.
3. Set server-only `GOOGLE_NONCE_SECRET` to a securely generated random value of at least 32 characters (for example, generate one locally with `openssl rand -hex 32` and enter it through the host’s secret settings). Use the same value on all replicas; do not commit it or paste it into chat. Then set server-only `GOOGLE_CLIENT_ID` to the resulting `...apps.googleusercontent.com` ID in the selected Vercel embedded runtime or remote Nest backend, then redeploy that runtime. It is a public identifier; no secret value belongs in Git or browser build variables. The existing database, public-origin, proxy/session settings and production browser build flags remain required.
4. Provision each authorized account using the existing administrative tool with its lowercase Google email, active organisation membership and explicit entity/module grants. Google login is available for verified `@gmail.com` identities and Google Workspace identities with the hosted-domain claim. Other Google accounts using third-party email require password sign-in. Signing in does not create users or grant access automatically.
5. Permit the browser to load `https://accounts.google.com/gsi/client` and Google's sign-in frames; the server needs HTTPS access to `https://www.googleapis.com/oauth2/v3/certs` for cached, rotating signature keys. Keep TLS verification enabled. Test the actual published origin: permitted Google login, wrong organisation/unprovisioned account denial, password login, logout and disabled membership. Local synthetic-provider tests do not verify the live OAuth project's settings or real Google accounts.

Both variables are required. The shared nonce signing key is separate from the embedded runtime’s per-instance ingress proof, so login survives routing between serverless instances. When unconfigured, the page shows Google as unavailable and password sign-in stays available. No Google OAuth client ID was available during implementation.
