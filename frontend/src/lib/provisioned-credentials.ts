// Company-owner-provisioned accounts for the public log-in entry.
//
// Founder direction (17 November 2026): the workspace opens ONLY for the
// Gmail addresses the company owner selected and handed credentials to —
// the Rillet-style model. Nobody can create an account on the page; a
// visitor who was not given a sign-in is refused and pointed to "Book a
// demo" instead.
//
// Each record stores a PBKDF2-HMAC-SHA256 verifier (16-byte random salt,
// 310k iterations, 256-bit derived key) — the clear password is never in
// the repository, the bundle or browser storage. Derive new records with:
//
//   node scripts/provision-account.mjs teammate@gmail.com 'Their-Password-123'
//
// which uses the exact derivation the browser performs. Removing a record
// revokes that sign-in on the next deploy.

export type ProvisionedAccount = {
  /** normalized (trimmed, lower-cased) sign-in email */
  email: string;
  /** base64 of the 16-byte random salt */
  salt: string;
  /** base64 of the 256-bit PBKDF2 derived key */
  hash: string;
  iterations: number;
};

// The accounts the company owner has provisioned. The first entry is the
// founder's own sign-in (default provisioned 17 November 2026); append
// records from scripts/provision-account.mjs as the team grows.
export const PROVISIONED_ACCOUNTS: readonly ProvisionedAccount[] = [
  {
    email: "tariksahon@gmail.com",
    salt: "nRPoQax8BarOyCCDSyNlrw==",
    hash: "GuJjsfT7GbYxtKFj5zkdJmt0KGHP7ai8FLxzGDy7+QU=",
    iterations: 310_000,
  },
];

// Development-only credential for the Playwright suites. The test web
// server (playwright.config.ts) exports VITE_E2E_ACCOUNT="email:password";
// the dev build registers it with the exact same salted-hash path the
// production accounts use, so the tests exercise the real verification.
// Production builds (import.meta.env.DEV === false) never read it, and a
// production deployment never sets the variable — the credential simply
// does not exist outside a local dev server.
export const devE2eAccountSpec: { email: string; password: string } | null =
  import.meta.env.DEV && typeof import.meta.env.VITE_E2E_ACCOUNT === "string"
    ? parseE2eSpec(import.meta.env.VITE_E2E_ACCOUNT)
    : null;

function parseE2eSpec(
  spec: string,
): { email: string; password: string } | null {
  const separator = spec.lastIndexOf(":");
  if (separator <= 0) return null;
  const email = spec.slice(0, separator).trim().toLowerCase();
  const password = spec.slice(separator + 1);
  return email.length > 0 && password.length > 0 ? { email, password } : null;
}
