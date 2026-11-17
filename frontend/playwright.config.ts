import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";
import { E2E_ACCOUNT_SPEC } from "./tests/e2e-account";
export default defineConfig({
  testDir: "./tests",
  testIgnore:
    /(?:payables-(?:ui|integration)|checklist.*|session-production|subscriptions|receivables-api|receivables-production|workspace|workspace-detail|workspace-changes|workspace-changes-production|workspace-production|assistant|assistant-production|vercel-backend|public-chat)\.spec\.ts/,
  fullyParallel: true,
  workers: 2,
  timeout: 45000,
  expect: { timeout: 7000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ||
        (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    // VITE_E2E_ACCOUNT provisions a development-only sign-in (tests/e2e-account.ts)
    // so the suites can exercise the real provisioned-credential verification.
    command: `VITE_E2E_ACCOUNT="${E2E_ACCOUNT_SPEC}" npm run dev -- --port 5173`,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
