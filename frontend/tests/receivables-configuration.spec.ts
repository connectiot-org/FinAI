import { test, expect } from "@playwright/test";
import { spawn } from "node:child_process";
import { E2E_ACCOUNT_EMAIL, E2E_ACCOUNT_PASSWORD, E2E_ACCOUNT_SPEC } from "./e2e-account";
for (const [mode, port, expected] of [
  ["api", 15376, "not configured for authenticated access"],
  ["invalid", 15377, "not configured correctly"],
] as const) {
  test(`receivables ${mode} configuration fails visibly without demo/API fallback`, async ({
    page,
  }) => {
    const server = spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      {
        env: {
          ...process.env,
          VITE_RECEIVABLES_MODE: mode,
          VITE_AUTH_MODE: "",
          VITE_API_BASE_URL: "",
          // The dashboard routes sit behind the provisioned sign-in
          // (19 November 2026); provision the shared test credential so the
          // sign-in itself performs no network request either.
          VITE_E2E_ACCOUNT: E2E_ACCOUNT_SPEC,
        },
        stdio: "ignore",
      },
    );
    const origin = `http://127.0.0.1:${port}`;
    try {
      await expect(async () => {
        expect((await fetch(origin)).status).toBe(200);
      }).toPass({ timeout: 10000 });
      const requests: string[] = [];
      page.on("request", (r) => {
        if (["fetch", "xhr"].includes(r.resourceType())) requests.push(r.url());
      });
      await page.goto(origin + "/workspace");
      await expect(page.getByRole("heading",{name:"Workspace configuration required"})).toBeVisible();
      expect(requests).toEqual([]);
      // The workspace overview is behind the provisioned log-in now; sign in
      // through the real verification path, which stays entirely in-browser.
      await page.goto(origin + "/login");
      await page.getByLabel("Email", { exact: true }).fill(E2E_ACCOUNT_EMAIL);
      await page
        .getByLabel("Password", { exact: true })
        .fill(E2E_ACCOUNT_PASSWORD);
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Recent activity", exact: true }),
      ).toBeVisible();
      const card = page.locator(".outstanding-customers");
      await expect(card.getByRole("alert")).toContainText(expected);
      await expect(card.locator("dd,table,a")).toHaveCount(0);
      expect(requests).toEqual([]);
    } finally {
      if (server.exitCode === null) {
        const done = new Promise<void>((r) => server.once("exit", () => r()));
        server.kill("SIGTERM");
        await done;
      }
    }
  });
}
