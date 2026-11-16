// Workspace access credentials for the public demo log-in.
//
// The demo has no backend: the sign-in you create lives only in this browser.
// That is still no excuse for sloppy credential handling, so the password is
// never persisted or compared in clear text. It is salted and stretched with
// PBKDF2-HMAC-SHA256 (Web Crypto) and only the derived key is stored, next to
// a per-browser attempt ledger that locks the entry temporarily after
// repeated wrong passwords. There is exactly one account per browser: the
// first visitor sets the sign-in, everyone after that must know it.

export type StoredAccess = {
  v: 1;
  email: string;
  /** base64 of the 16-byte random salt */
  salt: string;
  /** base64 of the 256-bit PBKDF2 derived key */
  hash: string;
  iterations: number;
};

type AttemptLedger = {
  fails: number;
  lockStep: number;
  lockedUntil: number | null;
};

export type AccessSnapshot = {
  account: { email: string } | null;
  fails: number;
  lockedUntil: number | null;
};

export type CreateAccessResult =
  | { ok: true }
  | { ok: false; reason: "weak-password"; problems: string[] }
  | { ok: false; reason: "storage" | "secure-context" };

export type VerifyAccessResult =
  | { ok: true }
  | { ok: false; reason: "incorrect"; lockedUntil: number | null }
  | { ok: false; reason: "locked"; lockedUntil: number }
  | { ok: false; reason: "storage" | "secure-context" };

const ACCESS_KEY = "finai-access-v1";
const ATTEMPTS_KEY = "finai-access-attempts-v1";

// OWASP guidance for PBKDF2-HMAC-SHA256 keeps moving up; 310k iterations
// stays comfortably above the legacy 100k floor while keeping an interactive
// log-in under a second on a modest laptop. The value is stored with the
// credential so it can be raised later without invalidating existing ones.
export const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;
const LOCK_AFTER_FAILS = 5;
const BASE_LOCK_SECONDS = 30;
const MAX_LOCK_SECONDS = 900;

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "passw0rd",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "letmein1",
  "welcome1",
  "admin123",
  "iloveyou1",
  "sunshine1",
  "princess1",
  "football1",
  "dragon123",
  "northstar",
  "northstar1",
  "finai123",
  "workspace1",
  "accounting1",
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Human-readable, ordered reasons why a password cannot be used. */
export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 8) problems.push("use at least 8 characters");
  if (!/[a-z]/i.test(password)) problems.push("include a letter");
  if (!/\d/.test(password)) problems.push("include a number");
  if (COMMON_PASSWORDS.has(password.toLowerCase()))
    problems.push("choose a less common password");
  return problems;
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

function isStoredAccess(value: unknown): value is StoredAccess {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
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
  const record = readJSON(ACCESS_KEY);
  const ledger = readLedger();
  return {
    account: isStoredAccess(record)
      ? { email: normalizeEmail(record.email) }
      : null,
    fails: ledger.fails,
    lockedUntil:
      ledger.lockedUntil && ledger.lockedUntil > Date.now()
        ? ledger.lockedUntil
        : null,
  };
}

/**
 * First-use sign-in creation. The password is validated, salted and stretched
 * before anything is written; the clear password never touches storage.
 */
export async function createWorkspaceAccess(
  email: string,
  password: string,
): Promise<CreateAccessResult> {
  const problems = passwordProblems(password);
  if (problems.length > 0)
    return { ok: false, reason: "weak-password", problems };
  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS);
    const record: StoredAccess = {
      v: 1,
      email: normalizeEmail(email),
      salt: toBase64(salt),
      hash,
      iterations: PBKDF2_ITERATIONS,
    };
    if (!writeJSON(ACCESS_KEY, record)) return { ok: false, reason: "storage" };
    clearLedger();
    return { ok: true };
  } catch {
    return { ok: false, reason: "secure-context" };
  }
}

/**
 * Sign-in verification for an existing account. Replies with the same
 * "incorrect" outcome for a wrong email and a wrong password so the page
 * cannot be used to probe which email is registered, and one PBKDF2 pass is
 * always run even when no record exists to keep the reply time flat.
 */
export async function verifyWorkspaceAccess(
  email: string,
  password: string,
): Promise<VerifyAccessResult> {
  const ledger = readLedger();
  if (ledger.lockedUntil && ledger.lockedUntil > Date.now())
    return { ok: false, reason: "locked", lockedUntil: ledger.lockedUntil };
  const record = readJSON(ACCESS_KEY);
  if (!isStoredAccess(record)) {
    // No account on this browser: burn one identical hash pass so a caller
    // cannot learn "nothing is stored" from the response time.
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
    if (
      fixedTimeEqual(normalizeEmail(email), record.email) &&
      fixedTimeEqual(hash, record.hash)
    ) {
      clearLedger();
      return { ok: true };
    }
    return { ok: false, reason: "incorrect", lockedUntil: registerFailure() };
  } catch {
    return { ok: false, reason: "secure-context" };
  }
}

/**
 * The "forgot password" path for a browser-local account: there is no server
 * to email, so recovery means deliberately clearing the saved sign-in on this
 * browser so a new one can be created. It also disarms any active lockout.
 */
export function resetWorkspaceAccess(): boolean {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
    return true;
  } catch {
    return false;
  }
}
