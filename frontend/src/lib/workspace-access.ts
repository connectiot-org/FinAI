// Workspace access verification for the public demo log-in.
//
// The demo has no backend: the only accepted credentials are the ones the
// company owner provisioned in provisioned-credentials.ts (each stored as
// a salted PBKDF2 verifier). Nobody creates an account on the page — a
// visitor without a provisioned sign-in is refused, exactly like a Rillet
// customer without an invitation. The entered password is still never
// persisted or compared in clear text: it is stretched with
// PBKDF2-HMAC-SHA256 (Web Crypto) and checked against the provisioned
// verifier with a fixed-time compare, next to a per-browser attempt ledger
// that locks the entry temporarily after repeated wrong passwords.

import {
  PROVISIONED_ACCOUNTS,
  devE2eAccountSpec,
  publishedDemoAccountSpec,
  type ProvisionedAccount,
} from "./provisioned-credentials";

type AttemptLedger = {
  fails: number;
  lockStep: number;
  lockedUntil: number | null;
};

export type AccessSnapshot = {
  fails: number;
  lockedUntil: number | null;
};

export type VerifyAccessResult =
  | { ok: true }
  | { ok: false; reason: "incorrect"; lockedUntil: number | null }
  | { ok: false; reason: "locked"; lockedUntil: number }
  | { ok: false; reason: "storage" | "secure-context" };

const ATTEMPTS_KEY = "finai-access-attempts-v1";
// Superseded by provisioned credentials (17 November 2026): the sign-in a
// visitor used to create on first use. Cleaned up so no dead verifier
// lingers in an existing browser.
const LEGACY_ACCOUNT_KEY = "finai-access-v1";

// OWASP guidance for PBKDF2-HMAC-SHA256 keeps moving up; 310k iterations
// stays comfortably above the legacy 100k floor while keeping an interactive
// log-in under a second on a modest laptop. Every provisioned record carries
// its own value so it can be raised without invalidating existing ones.
export const PBKDF2_ITERATIONS = 310_000;
const KEY_BITS = 256;
const LOCK_AFTER_FAILS = 5;
const BASE_LOCK_SECONDS = 30;
const MAX_LOCK_SECONDS = 900;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveBits(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    KEY_BITS,
  );
  return toBase64(new Uint8Array(bits));
}

/** Length-independent comparison so the reply time does not leak the hash. */
function fixedTimeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const longest = Math.max(a.length, b.length);
  for (let i = 0; i < longest; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function isProvisionedAccount(value: unknown): value is ProvisionedAccount {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.email === "string" &&
    v.email.length > 0 &&
    typeof v.salt === "string" &&
    v.salt.length > 0 &&
    typeof v.hash === "string" &&
    v.hash.length > 0 &&
    typeof v.iterations === "number" &&
    Number.isInteger(v.iterations) &&
    v.iterations >= 100_000 &&
    v.iterations <= 2_000_000
  );
}

// Development-only credential registration (see provisioned-credentials.ts):
// the Playwright web server hands the dev build an email:password pair,
// which is salted and stretched once with the same PBKDF2 path as the
// production verifiers. Production builds keep this null forever.
let devE2eRecord: Promise<ProvisionedAccount | null> | null = null;
function registerE2eAccount(
  spec: { email: string; password: string } | null,
): Promise<ProvisionedAccount | null> {
  if (!spec) return Promise.resolve(null);
  return (async () => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await deriveBits(spec.password, salt, PBKDF2_ITERATIONS);
    return {
      email: spec.email,
      salt: toBase64(salt),
      hash,
      iterations: PBKDF2_ITERATIONS,
    };
  })().catch(() => null);
}
let publishedDemoRecord: Promise<ProvisionedAccount | null> | null = null;

/**
 * The full list of sign-ins this deployment accepts: the owner-provisioned
 * accounts, plus (in a dev build only) the Playwright test credential, plus
 * (only in artifact builds that explicitly publish one) the printed demo
 * sign-in from VITE_PUBLISHED_DEMO_ACCOUNT.
 */
export async function resolveProvisionedAccounts(): Promise<
  readonly ProvisionedAccount[]
> {
  devE2eRecord ??= registerE2eAccount(devE2eAccountSpec);
  publishedDemoRecord ??= registerE2eAccount(publishedDemoAccountSpec);
  const [dev, published] = await Promise.all([devE2eRecord, publishedDemoRecord]);
  const accounts = PROVISIONED_ACCOUNTS.filter(isProvisionedAccount);
  for (const extra of [dev, published])
    if (extra && !accounts.some((account) => account.email === extra.email))
      accounts.push(extra);
  return accounts;
}

function readLedger(): AttemptLedger {
  const raw = readJSON<AttemptLedger>(ATTEMPTS_KEY);
  if (!raw || typeof raw !== "object")
    return { fails: 0, lockStep: 0, lockedUntil: null };
  return {
    fails: Number.isInteger(raw.fails) && raw.fails > 0 ? raw.fails : 0,
    lockStep:
      Number.isInteger(raw.lockStep) && raw.lockStep > 0 ? raw.lockStep : 0,
    lockedUntil:
      typeof raw.lockedUntil === "number" && Number.isFinite(raw.lockedUntil)
        ? raw.lockedUntil
        : null,
  };
}

function clearLedger() {
  writeJSON(ATTEMPTS_KEY, { fails: 0, lockStep: 0, lockedUntil: null });
}

/**
 * Record one wrong password. Every LOCK_AFTER_FAILS-th consecutive failure
 * arms an escalating cooldown (30s, 60s, 120s … capped at 15 minutes) that
 * survives reloads because it is persisted with the ledger.
 * Returns the armed lock deadline, or null when this failure did not lock.
 */
function registerFailure(): number | null {
  const ledger = readLedger();
  const fails = ledger.fails + 1;
  if (fails >= LOCK_AFTER_FAILS) {
    const seconds = Math.min(
      BASE_LOCK_SECONDS * 2 ** ledger.lockStep,
      MAX_LOCK_SECONDS,
    );
    const lockedUntil = Date.now() + seconds * 1000;
    writeJSON(ATTEMPTS_KEY, {
      fails: 0,
      lockStep: ledger.lockStep + 1,
      lockedUntil,
    });
    return lockedUntil;
  }
  writeJSON(ATTEMPTS_KEY, {
    fails,
    lockStep: ledger.lockStep,
    lockedUntil: null,
  });
  return null;
}

export function readAccessSnapshot(): AccessSnapshot {
  const ledger = readLedger();
  return {
    fails: ledger.fails,
    lockedUntil:
      ledger.lockedUntil && ledger.lockedUntil > Date.now()
        ? ledger.lockedUntil
        : null,
  };
}

/**
 * Sign-in verification against the provisioned accounts. Replies with the
 * same "incorrect" outcome for an unprovisioned email and a wrong password
 * so the page cannot be used to probe which email is registered, and one
 * PBKDF2 pass is always run even when the email is unknown to keep the
 * reply time flat.
 */
export async function verifyWorkspaceAccess(
  email: string,
  password: string,
): Promise<VerifyAccessResult> {
  const ledger = readLedger();
  if (ledger.lockedUntil && ledger.lockedUntil > Date.now())
    return { ok: false, reason: "locked", lockedUntil: ledger.lockedUntil };
  const accounts = await resolveProvisionedAccounts();
  const record = accounts.find(
    (account) => account.email === normalizeEmail(email),
  );
  if (!record) {
    // Unknown email: burn one identical hash pass so a caller cannot learn
    // "this email is not provisioned" from the response time.
    await deriveBits(
      password,
      base64ToBytes("AAAAAAAAAAAAAAAAAAAAAA=="),
      PBKDF2_ITERATIONS,
    ).catch(() => {});
    return { ok: false, reason: "incorrect", lockedUntil: null };
  }
  try {
    const hash = await deriveBits(
      password,
      base64ToBytes(record.salt),
      record.iterations,
    );
    if (fixedTimeEqual(hash, record.hash)) {
      clearLedger();
      return { ok: true };
    }
    return { ok: false, reason: "incorrect", lockedUntil: registerFailure() };
  } catch {
    return { ok: false, reason: "secure-context" };
  }
}

/** Remove the superseded browser-local account record, if any. */
export function clearLegacyAccountRecord(): void {
  try {
    localStorage.removeItem(LEGACY_ACCOUNT_KEY);
  } catch {
    // Storage unavailable: nothing to clean up.
  }
}
