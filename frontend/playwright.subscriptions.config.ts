import { defineConfig } from "@playwright/test";
import { E2E_ACCOUNT_SPEC } from "./tests/e2e-account";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: /subscriptions\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  webServer: {
    // VITE_E2E_ACCOUNT provisions a sign-in (tests/e2e-account.ts) because
    // the subscriptions route now sits behind the workspace guard.
    command: `VITE_E2E_ACCOUNT="${E2E_ACCOUNT_SPEC}" VITE_API_BASE_URL=http://127.0.0.1:3002/api/v1 npm run dev -- --port 5173 --strictPort`,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
  },
});
