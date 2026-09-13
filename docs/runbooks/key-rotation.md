# Runbook: Secrets & API Key Rotation

## Zero-Downtime Rotation Steps

### 1. OpenRouter API Key
1. Generate a new API key in the OpenRouter dashboard (`sk-or-v1-...`).
2. Update the environment variable `OPENROUTER_API_KEY` in Vercel settings for Production & Preview.
3. Trigger a redeploy or wait for next build; verify `/api/v1/chat/stream` succeeds.
4. Revoke the prior key in OpenRouter dashboard.

### 2. NextAuth Secret (`AUTH_SECRET`)
1. Generate a new 32+ character high-entropy string:
   ```bash
   openssl rand -base64 32
   ```
2. Update `AUTH_SECRET` in Vercel settings.
3. Existing active sessions will expire gracefully and prompt re-authentication.
