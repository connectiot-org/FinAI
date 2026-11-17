# Owner-provisioned sign-ins on the public log-in — 17 November 2026 (Asia/Dhaka)

Founder direction after merge 8b0ccb8: even with the password step, the entry still let **anyone** create their own sign-in on first use — a visitor just picked an email, invented a password and was in. The founder wants the Rillet-style model instead: **only the Gmail addresses the company owner selected can log in, with the credentials the owner gives them**. Nobody can register from the page; an unprovisioned visitor is refused and invited to book a demo. The card also gains the requested footer: "Need an account? Book a demo" linking the founder's Google Form (`https://forms.gle/qFhgN6g52xw4P17D7`).

## Model

- **The accepted credentials live in `frontend/src/lib/provisioned-credentials.ts`** as `{email, salt, hash, iterations}` records — salted PBKDF2-HMAC-SHA256 verifiers (16-byte salt, 310k iterations, 256-bit key), never a clear password. The first record is the founder's own sign-in (`tariksahon@gmail.com`, provisioned 17 November 2026); the default password was generated for the founder and communicated outside the repository.
- **No self-registration anywhere.** The create-on-first-use flow, the live password-requirements checklist, the stored-email prefill ("Welcome back.") and the browser-local forgot/reset panel are removed from `LogIn.tsx` and `log-in.css`. The card is a single sign-in: email, password, reveal toggle, "Log in" and the book-a-demo footer.
- **Verification is unchanged where it counted:** the entered password is stretched with the same PBKDF2 parameters and compared fixed-time against the provisioned verifier; an unprovisioned email and a wrong password produce the identical "Incorrect email or password." and one hash pass runs even for unknown emails, so timing cannot probe which emails are provisioned. The escalating lockout ledger (`finai-access-attempts-v1`, every fifth consecutive wrong password: 30 s doubling to a 15-minute cap, persisted, survives reloads) still guards provisioned emails.
- **Nothing credential-shaped is written to the browser.** Verification consults the static list only; the superseded `finai-access-v1` record from earlier builds is cleaned up on the entry's mount. The clear password still never touches storage.
- **Honest limits, unchanged from the previous security note:** this is a frontend-only demo; anyone with full control of the browser can read the bundled verifiers (offline brute-force is bounded only by PBKDF2 and password strength) — the page gates casual visitors, it is not a server-side account system. The account-free `/sample` tour and the provisioned `/workspace/*` session mode with real backend auth are untouched.

## Owner workflow (provisioning more people)

```
cd frontend
node scripts/provision-account.mjs teammate@gmail.com 'Their-Password-123'
```

The tool runs the exact browser derivation (same constants as `workspace-access.ts`), enforces the password policy, and prints the record to paste into `PROVISIONED_ACCOUNTS`. Hand the password to the person directly — it is not stored anywhere. Commit + deploy and the account works; remove the record and deploy again to revoke. The founder's own password can be rotated the same way.

## Tests

`tests/e2e-account.ts` defines a development-only credential; `playwright.config.ts` exports it to the dev server as `VITE_E2E_ACCOUNT="email:password"`, and the dev build registers it through the same salted-hash path as production verifiers (`provisioned-credentials.ts` gates it on `import.meta.env.DEV`, and production builds never set the variable — the credential does not exist outside a local dev server). `tests/marketing.spec.ts` now covers: an unprovisioned email is refused; a provisioned email with a wrong password is refused identically; the provisioned credential opens the workspace (full navigation, no clear-text password or credential record in storage); the escalating lockout with countdown and reload persistence; no create/recover controls on the card with the book-a-demo footer linking the Google Form; the funnel-separation and mobile-navigation cases updated to the single "Sign in to your workspace." card.

Note for local runs: the marketing suite needs the web server started by `playwright.config.ts` (it sets `VITE_E2E_ACCOUNT`); a plain `npm run dev` started separately does not register the test credential.

Verification outcomes are recorded in `progress.md` under the same date.
