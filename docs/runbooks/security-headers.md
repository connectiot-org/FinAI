# Runbook: Security Headers Verification

## Required Headers per D8 Security Architecture

| Header | Production Setting | Purpose |
| :--- | :--- | :--- |
| **Strict-Transport-Security** | `max-age=63072000; includeSubDomains; preload` | Forces HTTPS enforcement |
| **X-Content-Type-Options** | `nosniff` | Prevents MIME sniffing |
| **X-Frame-Options** | `DENY` | Clickjacking protection |
| **Referrer-Policy** | `strict-origin-when-cross-origin` | Protects privacy on external link navigation |
| **Content-Security-Policy** | `default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self' https://openrouter.ai; img-src 'self' data: https:;` | Restricts asset and script injection |

## Verification Command
```bash
curl -sI https://fintra.ai | grep -iE "(strict-transport|x-content-type|x-frame|content-security)"
```
