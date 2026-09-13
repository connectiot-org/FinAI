# Pre-Launch Production Checklist

This checklist must be executed and signed off prior to routing public production traffic to Fintra.

- [x] **Model Catalog Seeded**: `models.config.ts` matches `ModelCatalog` database rows.
- [x] **Secrets Validated**: `OPENROUTER_API_KEY` and `AUTH_SECRET` present in encrypted environment variables; zero secrets committed to repository.
- [x] **Route Protection**: `/agent` and `/api/v1` routes protected with authentication gates; `/api/v1/health` remains public.
- [x] **Fallback Engine Active**: D4 fallback strategy configured and tested with automatic recovery.
- [x] **SSE Streaming Verified**: Client stream parser properly renders text deltas, steps, evidence, and usage parts.
- [x] **Audit Logging Active**: Sign-in, conversation creation, and AI completion events logged to `AuditLog`.
- [x] **Financial Guardrails**: Disclaimer and interpretation labeling checks enforced on AI completions.
- [x] **Evals Suite Green**: Golden evaluation cases passing at 100% compliance.
- [x] **Operational Runbooks Committed**: Observability, incident, rollback, key rotation, and deployment procedures documented.
