# Runbook: Observability & Alerting

## Overview
Fintra tracks AI usage, latencies, and errors through structured JSON logs and database persistence (`AIRequest` and `UsageRecord`).

## Armed Production Alerts

| Alert Name | Trigger Threshold | Severity | Immediate Action |
| :--- | :--- | :--- | :--- |
| **Error Rate Spike** | 5xx errors > 2% of total requests over 5 min | Pager / High | Check provider gateway status, inspect logs for `UPSTREAM_ERROR`. |
| **Streaming Latency Spike** | p95 First Token Latency > 3.0s over 10 min | High | Switch default routing to Fast tier; probe OpenRouter status. |
| **Failover Anomaly** | Fallback rate > 20% over 15 min | Warning | Inspect upstream rate limits or credit quotas. |
| **Cost Anomaly** | Daily token spend > 3x trailing 7-day median | Warning | Review user usage records for abusive query loops. |
| **Database Connection Saturation** | Pool active connections > 80% ceiling | Warning | Check pgBouncer pool ceiling on Neon. |

## Querying Logs
Filter structured logs in Vercel Log Drain:
```text
json.level = "error" AND json.route = "/api/v1/chat/stream"
```
