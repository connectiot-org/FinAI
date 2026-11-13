# FinAI public dataset library

The public library is available at \`/datasets\`. It lists only explicitly
published metadata from the standalone \`PublicDataset\` table in the existing
PostgreSQL database. The data files themselves are versioned static assets
under \`frontend/public/datasets/\`; downloads do not require a user session.

## Initial catalogue

- **Starter chart of accounts** — an original, illustrative 20-account template.
- **Synthetic ledger transactions** — 20 lines covering 10 balanced double-entry
  examples with fictional company and transaction names.
- **Synthetic customer invoices** — 10 fictional invoice examples for analytics
  and workflow testing.

The original FinAI-created files are published under CC BY 4.0. Dataset cards
show the source, version, format, record count, licence and update date. The
chart is illustrative rather than a jurisdiction-specific statutory chart.
Synthetic records are not actual FinAI customer records and must not be
presented as such.

## Security boundary

The only anonymous backend route is \`GET /api/v1/public/datasets\`. It selects a
fixed allowlist of metadata fields and filters on \`published = true\`. The
existing ingress checks still require the trusted Vercel proxy, exact host and
HTTPS forwarding. Other routes and all non-GET methods still require the
existing authenticated session and CSRF controls.

Downloads are static, public files and must never contain real company,
customer, supplier, employee, bank, invoice or ledger information. New entries
default to unpublished. Review source rights, privacy, provenance, accounting
correctness and licensing before making them public.

## Release procedure

The Prisma migration
\`backend/prisma/migrations/202611130002_public_datasets/migration.sql\` is
additive. It creates only the catalogue table, indexes and the three initial
metadata rows. It does not modify or seed organisation/company financial
tables.

1. Review the feature branch and confirm the Vercel preview build.
2. Inspect the intended production database and current migration state from
   an authorized operator environment.
3. Apply the migration with the existing Prisma CLI from \`backend\`:

   \`\`\`bash
   node node_modules/prisma/build/index.js migrate deploy
   \`\`\`

4. Deploy the reviewed commit after the database migration is complete.
5. Verify anonymous \`GET /api/v1/public/datasets\`, direct \`/datasets\` refresh,
   the three CSV downloads, and existing login/private workspace routes.

Never run the local synthetic seed or reset against production. The Vercel
build does not run database migrations. Do not share \`DATABASE_URL\` or any
secret in screenshots, logs or chat.
