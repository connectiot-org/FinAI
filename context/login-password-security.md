# Password security on the public log-in — 16 November 2026 (Asia/Dhaka)

Founder feedback after merge 231b006: the `/login` entry let anyone in with any email — no password at all — which read as broken authentication rather than a demo. The entry now secures the workspace behind a password while keeping the established split-screen card, the single sign-in option and the browser-local data story.

## Threat model and honest limits

The demo workspace is synthetic, browser-local data with no backend, so nothing customer-identifying is at risk. What the refinement guarantees is that the **page itself no longer hands out workspace entry**: a visitor must create a sign-in on first use and know its password afterwards. Anyone with full control of the browser can still wipe `localStorage` (that is inherent to a client-only demo); the lockout and hashing below stop the *page* from being probed or brute-forced, not the browser from being reset. The `/sample` tour stays account-free by design ("Explore the product first", clearly labelled, tested); `/workspace/*` provisioned session mode with its real backend auth is untouched.

## Implementation

- **New module `frontend/src/lib/workspace-access.ts`.** Passwords are salted (16 random bytes) and stretched with PBKDF2-HMAC-SHA256, 310,000 iterations, 256-bit key, via Web Crypto. Only `{v, email, salt, hash, iterations}` is persisted under `finai-access-v1`; the clear password never touches storage and is compared with a length-independent fixed-time check. One PBKDF2 pass runs even when no record exists, so reply timing cannot reveal whether an email is registered, and a wrong email and a wrong password produce the identical "Incorrect email or password."
- **Password policy.** At least 8 characters, at least one letter, at least one number, plus a small common-password denylist. The create card shows the first three as a live checklist; violations on submit render as an inline alert (the denylist case has no live indicator by design).
- **Lockout ledger `finai-access-attempts-v1`.** Every fifth consecutive wrong password arms an escalating cooldown — 30 s, 60 s, 120 s … capped at 15 minutes — that disables the form with a live countdown and survives reloads, because it is persisted. A successful sign-in or a reset clears it.
- **`LogIn.tsx` rewritten as a two-mode card.** Fresh browser: "Set up your sign-in." (email + password + live checklist + "Create sign-in"). Returning: "Welcome back." with the stored email prefilled, "Log in", a show/hide password toggle, and a "Forgot your password?" panel explaining that recovery on a browser-local account means clearing the saved sign-in ("Reset access on this browser" — also the owner's way out of a lockout). Success still dispatches `command {kind:"enter"}` and navigates to `/overview`; the persona derivation, split screen and entrance animation are unchanged. `autoComplete` is `new-password` / `current-password` so password managers work; the local-workspace note now states the PBKDF2 handling.
- **`log-in.css`** adds the password row with reveal toggle, requirement checklist, error and lockout banners, and the reset panel, using the existing tokens (`--error`, `--warning`, `--positive`, `--accent-light`, `--radius`) and the motion-safe entrance pattern.

## Tests

`tests/marketing.spec.ts`: the entry case is now "log-in entry secures the workspace behind a password" (create flow, reveal toggle, weak-password refusal, workspace opens, no clear-text password anywhere in storage, wrong password refused, correct password re-enters, legacy `/welcome` redirect), plus new cases for the escalating lockout (disabled form, persisted deadline, live countdown, reload does not sidestep) and the browser-local reset (flip back to create mode, new password works, neither password stored in clear text). The funnel-separation and mobile-navigation cases were updated: a fresh browser shows "Set up your sign-in." and the card now asserts a present password field and "Create sign-in" button while still forbidding SSO/second-section controls.

Verification outcomes are recorded in `progress.md` under the same date.
