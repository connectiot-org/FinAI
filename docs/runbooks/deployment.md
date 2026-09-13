# Runbook: Production Deployment

## Platform Stack
- **Web App**: Next.js 16 App Router on Vercel
- **Database**: Neon Managed PostgreSQL (pgBouncer pooled connection)
- **AI Gateway**: Fintra Gateway routed through OpenRouter

## Deployment Pipeline
1. GitHub Actions CI verifies:
   - TypeScript compilation (`npm run build`)
   - Schema validation (`prisma validate`)
   - Golden evaluations (`evals/run-evals.ts`)
2. Vercel deployment hook triggers:
   - Database migration deployment: `npx prisma migrate deploy`
   - Next.js production bundle build
   - Health check probe on `/api/v1/health`
