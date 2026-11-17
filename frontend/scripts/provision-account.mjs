#!/usr/bin/env node
// Owner tool for provisioning workspace sign-ins on the public log-in entry.
//
// The entry accepts ONLY accounts listed in
// frontend/src/lib/provisioned-credentials.ts, and that file stores salted
// PBKDF2 hashes — never a clear password. This script derives a record you
// paste into that list, using the exact derivation the browser performs
// (PBKDF2-HMAC-SHA256, 310k iterations, 16-byte random salt, 256-bit key).
// Keep the constants in sync with frontend/src/lib/workspace-access.ts.
//
// Usage:
//   node scripts/provision-account.mjs teammate@gmail.com
//   node scripts/provision-account.mjs teammate@gmail.com 'Their-Password-123'
//
// With no password argument the tool prompts with hidden input. The password
// itself is printed only if you pass --show, so a shared terminal log never
// records it; the record alone is enough for the list.

import { Buffer } from "node:buffer";
import { webcrypto } from "node:crypto";
import { createInterface } from "node:readline/promises";
import process from "node:process";
import { TextEncoder } from "node:util";

const { stdout } = process;

const ITERATIONS = 310_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

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

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function passwordProblems(password) {
  const problems = [];
  if (password.length < 8) problems.push("use at least 8 characters");
  if (!/[a-z]/i.test(password)) problems.push("include a letter");
  if (!/\d/.test(password)) problems.push("include a number");
  if (COMMON_PASSWORDS.has(password.toLowerCase()))
    problems.push("choose a less common password");
  return problems;
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function deriveHash(password, salt) {
  const key = await webcrypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await webcrypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    KEY_BITS,
  );
  return toBase64(new Uint8Array(bits));
}

async function askHidden(question) {
  // Hidden prompt without a dependency: mute the output while readline echoes.
  stdout.write(question);
  const wasRaw = stdout.isTTY;
  if (wasRaw) stdout.write("\x1b[8m"); // conceal
  const rl = createInterface({ input: process.stdin, output: stdout });
  const answer = await rl.question(question);
  rl.close();
  if (wasRaw) stdout.write("\x1b[0m\n"); // reveal
  return answer;
}

const [rawEmail, ...rest] = process.argv.slice(2);
const show = rest.includes("--show");
const positional = rest.filter((arg) => arg !== "--show");
if (!rawEmail || positional.length > 1) {
  process.stderr.write(
    "Usage: node scripts/provision-account.mjs <email> ['password'] [--show]\n",
  );
  process.exit(1);
}
const email = normalizeEmail(rawEmail);
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  process.stderr.write(`"${email}" is not a valid email address.\n`);
  process.exit(1);
}
let password = positional[0];
if (!password) password = await askHidden("Password for the new sign-in: ");
const problems = passwordProblems(password);
if (problems.length > 0) {
  process.stderr.write(`Refused: please ${problems.join(", ")}.\n`);
  process.exit(1);
}

const salt = webcrypto.getRandomValues(new Uint8Array(SALT_BYTES));
const hash = await deriveHash(password, salt);

process.stdout.write(`
Provisioned sign-in for ${email}${show ? ` (password: ${password})` : ""}
— the password is not stored anywhere; hand it to the person directly.

Paste this record into PROVISIONED_ACCOUNTS in
frontend/src/lib/provisioned-credentials.ts:

  {
    email: "${email}",
    salt: "${toBase64(salt)}",
    hash: "${hash}",
    iterations: ${ITERATIONS},
  },

Commit the change and deploy; the account can sign in immediately. To revoke
access, remove the record and deploy again.
`);
