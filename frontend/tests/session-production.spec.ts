import { test, expect } from "@playwright/test";
import { spawn, type ChildProcess } from "node:child_process";
let fixture: ChildProcess;
let info: { origin: string; organisationId: string; entityId: string };
test.beforeAll(async () => {
  fixture = spawn(
    process.execPath,
    [
      "--env-file=../backend/.env",
      "--import",
      "../backend/node_modules/tsx/dist/loader.mjs",
      "scripts/session-fixture.ts",
    ],
    { stdio: ["ignore", "ignore", "pipe", "ipc"] },
  );
  let stderr = "";
  fixture.stderr?.on("data", (chunk) => (stderr += chunk));
  info = await new Promise((resolve, reject) => {
    fixture.once("message", (message) => resolve(message as typeof info));
    fixture.once("exit", () =>
      reject(new Error("Session fixture failed: " + stderr)),
    );
  });
});
test.afterAll(async () => {
  if (fixture?.exitCode === null) {
    const exited = new Promise<void>((resolve) =>
      fixture.once("exit", () => resolve()),
    );
    fixture.kill("SIGTERM");
    await exited;
  }
});
test("HTTPS production sign-in, copy, refresh, CSRF denial, cookie flags and logout", async ({
  page,
  context,
}) => {
  await page.goto(`${info.origin}/close/checklist?month=2060-09`);
  await expect(
    page.getByRole("heading", { name: "Sign in to your checklist" }),
  ).toBeVisible();
  const googleChallenge = await page.request.post(
    `${info.origin}/auth/google/challenge`,
    { data: {}, headers: { Origin: info.origin } },
  );
  expect(googleChallenge.status()).toBe(200);
  expect(await googleChallenge.json()).toEqual({ enabled: false });
  const unavailableGoogle = await page.request.post(
    `${info.origin}/auth/google`,
    {
      data: { credential: "synthetic", organisationId: info.organisationId },
      headers: { Origin: info.origin },
    },
  );
  expect(unavailableGoogle.status()).toBe(503);
  await page.getByLabel("Email or account name").fill("browser-test");
  await page.getByLabel("Organisation ID").fill(info.organisationId);
  await page
    .getByLabel("Password", { exact: true })
    .fill("synthetic-browser-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Connected backend", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Task title").fill("Secure session task");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Secure session task" }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: "Secure session task" }).click();
  await expect(
    page.getByRole("checkbox", { name: "Secure session task" }),
  ).toBeChecked();
  await page.getByLabel("Checklist month").fill("2060-10");
  await page
    .getByRole("button", { name: "Copy last month’s tasks", exact: true })
    .click();
  await page.getByRole("button", { name: "Copy tasks", exact: true }).click();
  await expect(page.getByText("0/1 completed", { exact: true })).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("checkbox", { name: "Secure session task" }),
  ).not.toBeChecked();
  const unknown = await page.evaluate(async () => {
    const r = await fetch("/api/v1/does-not-exist");
    return {
      status: r.status,
      type: r.headers.get("content-type"),
      body: await r.json(),
    };
  });
  expect(unknown.status).toBe(404);
  expect(unknown.type).toContain("application/json");
  expect(unknown.body.code).toBe("NOT_FOUND");
  const cookies = await context.cookies();
  const session = cookies.find((c) => c.name === "__Host-finai_session")!;
  expect(session.httpOnly).toBe(true);
  expect(session.secure).toBe(true);
  expect(session.sameSite).toBe("Strict");
  const status = await page.evaluate(async () => {
    const r = await fetch("/api/v1/checklist-tasks/copy-previous-month", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: "22222222-2222-4222-8222-222222222222",
        month: "2060-11",
      }),
    });
    return r.status;
  });
  expect(status).toBe(403);
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => /password|token|session/i.test(k)),
    ),
  ).toBe(false);
  await page.goto(`${info.origin}/tools/subscriptions?entity=${info.entityId}`);
  await expect(
    page.getByRole("heading", { name: "Subscription renewals", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Add subscription", exact: true })
    .click();
  await page
    .getByLabel("Supplier name", { exact: true })
    .fill("Session supplier");
  await page
    .getByLabel("Subscription name", { exact: true })
    .fill("Authenticated renewal");
  await page.getByLabel("Renewal date", { exact: true }).fill("2060-12-01");
  await page
    .getByRole("button", { name: "Save subscription", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Edit Authenticated renewal",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Edit Authenticated renewal",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in to FinAI" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sign in to FinAI" }),
  ).toBeVisible();
});

async function paidCommand(command: string) {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      fixture.off("message", receive);
      reject(new Error("Paid fixture command timed out"));
    }, 10000);
    function receive(message: { command?: string; ok?: boolean }) {
      if (message.command !== command) return;
      clearTimeout(timeout);
      fixture.off("message", receive);
      if (message.ok) resolve();
      else reject(new Error("Paid fixture command failed"));
    }
    fixture.on("message", receive);
    fixture.send(command);
  });
}

test("HTTPS paid-only sign-in rejects unpaid accounts and expired existing sessions", async ({
  page,
}) => {
  await paidCommand("paidOff");
  await page.goto(`${info.origin}/close/checklist?month=2060-10`);
  await page.getByLabel("Email or account name").fill("browser-test");
  await page.getByLabel("Organisation ID").fill(info.organisationId);
  await page
    .getByLabel("Password", { exact: true })
    .fill("synthetic-browser-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "An active paid subscription is required",
  );
  await expect(
    page.getByText("Connected backend", { exact: true }),
  ).toHaveCount(0);
  await paidCommand("paidOn");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("Connected backend", { exact: true }),
  ).toBeVisible();
  await paidCommand("paidOff");
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "An active paid subscription is required",
  );
  await expect(
    page.getByText("Connected backend", { exact: true }),
  ).toHaveCount(0);
  await paidCommand("paidOn");
});
