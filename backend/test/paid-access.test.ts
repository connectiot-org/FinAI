import { request as httpRequest } from "node:http";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { createApplication } from "../src/app";
import { passwordOptions } from "../src/auth";
import { updateCustomerAccess } from "../src/customer-access";

test("paid customer access denies unpaid and expired logins, rechecks sessions, and audits operator changes", async () => {
  const initial = process.env.DATABASE_URL!;
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(initial).hostname));
  const schema = "test_paid_" + randomUUID().replaceAll("-", "");
  const url = new URL(initial);
  url.searchParams.set("schema", schema);
  const admin = new PrismaClient({ datasourceUrl: initial });
  const db = new PrismaClient({ datasourceUrl: url.toString() });
  let app: Awaited<ReturnType<typeof createApplication>> | undefined;
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    const env = {
      ...process.env,
      DATABASE_URL: url.toString(),
      NODE_ENV: "test",
      CHECKLIST_IDENTITY: "session",
      API_HOST: "127.0.0.1",
      API_PORT: "0",
      PUBLIC_ORIGIN: "https://finai.example",
      API_TRUSTED_HOST: "finai.example",
      API_PROXY_TOKEN: randomUUID() + randomUUID(),
    };
    const migrated = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { env, encoding: "utf8" },
    );
    assert.equal(migrated.status, 0, migrated.stderr);
    const organisationId = randomUUID(),
      otherOrganisation = randomUUID(),
      userId = randomUUID();
    await db.organisation.createMany({
      data: [
        { id: organisationId, code: "finai897987897987", name: "Synthetic paid customer" },
        { id: otherOrganisation, name: "Synthetic unpaid customer" },
      ],
    });
    await db.user.create({ data: { id: userId } });
    await db.account.create({
      data: {
        userId,
        username: "billing-test",
        passwordHash: await argon2.hash(
          "synthetic-paid-password",
          passwordOptions,
        ),
      },
    });
    await db.membership.createMany({
      data: [
        { organisationId, userId, isAdministrator: true },
        { organisationId: otherOrganisation, userId, isAdministrator: true },
      ],
    });
    process.env.DATABASE_URL = url.toString();
    app = await createApplication({ env, quiet: true });
    const base = await app.getUrl();
    let cookie = "",
      csrf = "";
    const call = async (path: string, method = "GET", body?: unknown) => {
      return new Promise<{
        r: { status: number; headers: Headers };
        data: { code?: string; csrfToken?: string; items?: unknown[] };
      }>((resolve, reject) => {
        const request = httpRequest(
          base + path,
          {
            method,
            headers: {
              Host: "finai.example",
              "X-Finai-Public-Host": "finai.example",
              "X-Forwarded-Proto": "https",
              "X-Finai-Proxy-Token": env.API_PROXY_TOKEN,
              Origin: env.PUBLIC_ORIGIN,
              "Content-Type": "application/json",
              Cookie: cookie,
              "X-CSRF-Token": csrf,
            },
          },
          (response) => {
            let text = "";
            response.on("data", (chunk) => (text += chunk));
            response.on("error", reject);
            response.on("end", () => {
              try {
                const headers = new Headers();
                for (const [key, value] of Object.entries(response.headers))
                  for (const item of Array.isArray(value) ? value : [value])
                    if (item !== undefined) headers.append(key, item);
                resolve({
                  r: { status: response.statusCode!, headers },
                  data: JSON.parse(text),
                });
              } catch (error) {
                reject(error);
              }
            });
          },
        );
        request.on("error", reject);
        request.end(body === undefined ? undefined : JSON.stringify(body));
      });
    };
    const login = (
      org: string = organisationId,
      password = "synthetic-paid-password",
    ) =>
      call("/auth/login", "POST", {
        username: "billing-test",
        password,
        organisationId: org,
      });
    assert.equal((await login(organisationId, "wrong-password")).r.status, 401);
    const unpaid = await login();
    assert.equal(unpaid.r.status, 403);
    assert.equal(unpaid.data.code, "PAID_ACCESS_REQUIRED");
    assert.equal(await db.session.count(), 0);
    assert.equal(
      (
        await db.organisation.findUniqueOrThrow({
          where: { id: organisationId },
        })
      ).paidAccessUntil,
      null,
    );
    const until = new Date(Date.now() + 86400000);
    await updateCustomerAccess(
      db,
      organisationId,
      "billing-test",
      until,
      false,
    );
    assert.equal((await login()).r.status, 403);
    assert.equal(await db.serverAudit.count(), 0);
    const cliDryRun = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "scripts/customer-access.mts",
        organisationId,
        "billing-test",
        until.toISOString(),
      ],
      { env, encoding: "utf8" },
    );
    assert.equal(cliDryRun.status, 0, cliDryRun.stderr);
    assert.equal(JSON.parse(cliDryRun.stdout.split("\n")[0]).applied, false);
    assert.equal((await login()).r.status, 403);
    const cliApply = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "scripts/customer-access.mts",
        organisationId,
        "billing-test",
        until.toISOString(),
        "--apply",
      ],
      { env, encoding: "utf8" },
    );
    assert.equal(cliApply.status, 0, cliApply.stderr);
    assert.equal(JSON.parse(cliApply.stdout.split("\n")[0]).applied, true);
    const paid = await login();
    assert.equal(paid.r.status, 200);
    const friendlyCodeLogin = await login("FINAI897987897987");
    assert.equal(friendlyCodeLogin.r.status, 200);
    const friendlySession = await db.session.findFirstOrThrow();
    assert.equal(friendlySession.organisationId, organisationId);
    assert.equal((await login("finai-unknown-organisation")).r.status, 401);
    cookie = friendlyCodeLogin.r.headers.get("set-cookie")!.split(";")[0];
    csrf = friendlyCodeLogin.data.csrfToken!;
    assert.equal((await call("/auth/session")).r.status, 200);
    assert.equal((await call("/api/v1/entities")).r.status, 200);
    assert.equal((await login(otherOrganisation)).r.status, 403);
    assert.equal(
      (
        await call("/auth/login", "POST", {
          username: "billing-test",
          password: "synthetic-paid-password",
          organisationId,
          paidAccessUntil: until.toISOString(),
        })
      ).r.status,
      422,
    );
    assert.equal(
      (
        await call("/api/v1/customer-access", "POST", {
          paidAccessUntil: until.toISOString(),
        })
      ).r.status,
      404,
    );
    await db.organisation.update({
      where: { id: organisationId },
      data: { paidAccessUntil: new Date(Date.now() - 1000) },
    });
    const expired = await call("/auth/session");
    assert.equal(expired.r.status, 401);
    assert.equal(expired.data.code, "PAID_ACCESS_REQUIRED");
    assert.equal((await call("/api/v1/entities")).r.status, 401);
    assert.equal((await login()).r.status, 403);
    await updateCustomerAccess(db, organisationId, "billing-test", until, true);
    assert.equal((await call("/auth/session")).r.status, 401); // Rotation is required after an operator update.
    const renewed = await login();
    assert.equal(renewed.r.status, 200);
    cookie = renewed.r.headers.get("set-cookie")!.split(";")[0];
    await db.$executeRawUnsafe(
      `ALTER TABLE "ServerAudit" ADD CONSTRAINT reject_billing_test CHECK (action <> 'billing.paid_access_updated') NOT VALID`,
    );
    await assert.rejects(
      updateCustomerAccess(db, organisationId, "billing-test", null, true),
    );
    assert.equal((await call("/auth/session")).r.status, 200);
    assert.equal(
      (
        await db.organisation.findUniqueOrThrow({
          where: { id: organisationId },
        })
      ).paidAccessUntil?.toISOString(),
      until.toISOString(),
    );
    await db.$executeRawUnsafe(
      `ALTER TABLE "ServerAudit" DROP CONSTRAINT reject_billing_test`,
    );
    await updateCustomerAccess(db, organisationId, "billing-test", null, true);
    assert.equal((await call("/api/v1/entities")).r.status, 401);
    // Simulate a new rate-limit window after the earlier login scenarios.
    await db.rateLimit.updateMany({ data: { window: new Date(0) } });
    assert.equal((await login()).r.status, 403);
    assert.equal(await db.session.count({ where: { organisationId } }), 0);
    const audits = await db.serverAudit.findMany({
      where: { action: "billing.paid_access_updated" },
    });
    assert.equal(audits.length, 3);
    assert.ok(
      audits.some(
        (a) =>
          (a.metadata as { reasonCode: string }).reasonCode ===
          "paid_access_revoked",
      ),
    );
    await assert.rejects(
      updateCustomerAccess(
        db,
        organisationId,
        "billing-test",
        new Date(0),
        true,
      ),
    );
    await db.membership.update({
      where: { organisationId_userId: { organisationId, userId } },
      data: { isAdministrator: false },
    });
    await assert.rejects(
      updateCustomerAccess(db, organisationId, "billing-test", until, true),
      /administrator/,
    );
    assert.equal(await db.serverAudit.count(), 3);
  } finally {
    await app?.close();
    await db.$disconnect();
    process.env.DATABASE_URL = initial;
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.$disconnect();
  }
});
