import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, exportJWK, SignJWT, createLocalJWKSet } from "jose";
import { Auth, googleEmail } from "../src/auth";
import type { Database } from "../src/database";
import type { Request, Response } from "express";

const client = "synthetic.apps.googleusercontent.com";
const nonce = "a".repeat(64);
async function fixture() {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const keys = createLocalJWKSet({
    keys: [{ ...jwk, kid: "test", alg: "RS256" }],
  });
  const sign = (overrides = {}) =>
    new SignJWT({
      sub: "google-synthetic",
      email: "synthetic@gmail.com",
      email_verified: true,
      nonce,
      ...overrides,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .setIssuer("https://accounts.google.com")
      .setAudience(client)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
  return { keys, sign, privateKey };
}
test("Google proof accepts authoritative verified Gmail and Workspace emails", async () => {
  const { keys, sign } = await fixture();
  assert.equal(
    await googleEmail(await sign(), client, nonce, keys),
    "synthetic@gmail.com",
  );
  assert.equal(
    await googleEmail(
      await sign({ email: "SYNTHETIC@company.example", hd: "company.example" }),
      client,
      nonce,
      keys,
    ),
    "synthetic@company.example",
  );
});
test("Google proof rejects wrong nonce/audience, unverified and non-authoritative email, issuer, expiry and signature", async () => {
  const { keys, sign, privateKey } = await fixture();
  await assert.rejects(googleEmail(await sign(), client, "b".repeat(64), keys));
  await assert.rejects(
    googleEmail(await sign(), "another-client", nonce, keys),
  );
  for (const claims of [
    { email_verified: false },
    { email: "synthetic@external.example" },
    { azp: "other" },
    { hd: "", email: "x@company.example" },
  ])
    await assert.rejects(googleEmail(await sign(claims), client, nonce, keys));
  const token = (issuer: string, expiration: number) =>
    new SignJWT({ sub: "s", email: "s@gmail.com", email_verified: true, nonce })
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .setIssuer(issuer)
      .setAudience(client)
      .setIssuedAt()
      .setExpirationTime(expiration)
      .sign(privateKey);
  await assert.rejects(
    googleEmail(
      await token("https://evil.example", Math.floor(Date.now() / 1000) + 60),
      client,
      nonce,
      keys,
    ),
  );
  await assert.rejects(
    googleEmail(
      await token(
        "https://accounts.google.com",
        Math.floor(Date.now() / 1000) - 60,
      ),
      client,
      nonce,
      keys,
    ),
  );
  const other = await fixture();
  await assert.rejects(googleEmail(await other.sign(), client, nonce, keys));
});
function response() {
  const headers = new Map<string, unknown>();
  let data: unknown;
  return {
    headers,
    get data() {
      return data;
    },
    res: {
      setHeader: (key: string, value: unknown) => headers.set(key, value),
      json: (value: unknown) => {
        data = value;
      },
    } as unknown as Response,
  };
}
test("Google challenge is opt-in and binds login to an HttpOnly signed browser nonce", async () => {
  const db = { $queryRaw: async () => [{ count: 1 }] } as unknown as Database;
  const off = new Auth(db, {}),
    disabled = response();
  off.googleChallenge(disabled.res);
  assert.deepEqual(disabled.data, { enabled: false });
  const auth = new Auth(db, {
      GOOGLE_CLIENT_ID: client,
      GOOGLE_NONCE_SECRET: "synthetic-shared-nonce-secret-32-bytes",
      API_PROXY_TOKEN: "synthetic-server-proof",
    }),
    out = response();
  auth.googleChallenge(out.res);
  assert.equal((out.data as { clientId: string }).clientId, client);
  assert.match(
    out.headers.get("Set-Cookie") as string,
    /HttpOnly; Secure; SameSite=Strict/,
  );
  for (const cookie of [
    "",
    "__Host-finai_google=invalid",
    (out.headers.get("Set-Cookie") as string).replace(/=[a-f0-9]/, "=z"),
  ]) {
    await assert.rejects(
      auth.googleLogin(
        {
          headers: { cookie },
          body: {
            credential: "invalid",
            organisationId: "11111111-1111-4111-8111-111111111111",
          },
        } as Request,
        response().res,
      ),
      /Sign-in failed/,
    );
  }
});
