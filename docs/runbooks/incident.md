# Runbook: Incident Management & Escalation

## Incident Severity Levels
- **SEV-1 (Critical)**: Workspace `/agent` completely unresponsive, data loss, or API keys compromised. Target response: < 15 minutes.
- **SEV-2 (High)**: Major AI model family failing without successful failover, degraded throughput. Target response: < 30 minutes.
- **SEV-3 (Moderate)**: Minor UI glitches, single template generation failure, non-blocking errors. Target response: < 4 hours.

## First Response Protocol
1. **Acknowledge**: Open incident tracking channel `#incident-live`.
2. **Mitigate**: If a provider family is down, mark `availability: DEGRADED` in `ModelCatalog` or set Auto router to prioritize alternate frontier models.
3. **Escalate**: Notify controller/finance stakeholders if live close reports are impacted.
