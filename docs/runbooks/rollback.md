# Runbook: Rollback Policy & Procedure

## Vercel Instant Deployment Rollback
1. Open Vercel Project Dashboard → Deployments.
2. Select the previous stable deployment hash.
3. Click `Promote to Production` (instant DNS pointer shift, zero downtime).

## Database Migration Rollback Policy (Expand-Contract Rule)
- All schema changes must follow the **Expand-Contract** pattern:
  - **Expand**: Add new nullable columns or tables first.
  - **Deploy**: Deploy code reading both old and new schema.
  - **Contract**: Safely remove deprecated columns only after verification.
- **Never perform destructive column drops** during active deployment windows.
