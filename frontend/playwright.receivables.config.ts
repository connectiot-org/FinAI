import { defineConfig } from "@playwright/test";
import { E2E_ACCOUNT_SPEC } from "./tests/e2e-account";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: /receivables-api\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  webServer: {
    // VITE_E2E_ACCOUNT provisions a sign-in (tests/e2e-account.ts) because
    // the dashboard routes now sit behind the workspace guard.
    command: `VITE_E2E_ACCOUNT="${E2E_ACCOUNT_SPEC}" VITE_RECEIVABLES_MODE=api VITE_AUTH_MODE=session VITE_API_BASE_URL=/api/v1 npm run dev -- --port 5173 --strictPort`,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
  },
});
