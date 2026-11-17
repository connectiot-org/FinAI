// Development-only log-in credential for the Playwright suites.
//
// The public log-in accepts only company-owner-provisioned sign-ins, so the
// browser tests need one provisioned credential to exercise the real
// verification path. playwright.config.ts exports this email:password pair
// to the dev server as VITE_E2E_ACCOUNT, and the dev build registers it
// with the exact same salted-PBKDF2 path as the production accounts
// (see src/lib/provisioned-credentials.ts).
//
// Production builds never read the variable — this credential does not
// exist outside a local dev server, so committing it here is safe.

export const E2E_ACCOUNT_EMAIL = "e2e.checks@northstar.example";
export const E2E_ACCOUNT_PASSWORD = "correct-battery-42";
export const E2E_ACCOUNT_SPEC = `${E2E_ACCOUNT_EMAIL}:${E2E_ACCOUNT_PASSWORD}`;
