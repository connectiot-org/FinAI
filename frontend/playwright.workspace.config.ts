import { defineConfig } from "@playwright/test";
import { E2E_ACCOUNT_SPEC } from "./tests/e2e-account";
import base from "./playwright.config";
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: /workspace(?:-detail|-changes)?\.spec\.ts/,
  workers: 1,
  fullyParallel: false,
  webServer: {
    // VITE_E2E_ACCOUNT provisions a sign-in (tests/e2e-account.ts): the
    // dashboard routes are behind the workspace guard even in session mode,
    // and the assistant suite signs in through the real verification path.
    command: `VITE_E2E_ACCOUNT="${E2E_ACCOUNT_SPEC}" VITE_AUTH_MODE=session VITE_API_BASE_URL=/api/v1 VITE_CHECKLIST_MODE=api VITE_RECEIVABLES_MODE=api npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`,
    url: "http://127.0.0.1:5173",
    reuseExistingServer: false,
  },
});
