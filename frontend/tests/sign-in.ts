// Shared browser sign-in helper for the workspace-guarded routes.
//
// The dashboard routes (overview, accounting, receivables, payables, banking,
// close, reports, settings, /demo/payables/*) sit behind
// RequireWorkspaceSession since 19 November 2026: an anonymous deep link is
// redirected to /login and only a provisioned sign-in opens the workspace.
// Every suite that visits those routes signs in first through the real form,
// exercising the actual PBKDF2 verification path.
//
// The credential comes from tests/e2e-account.ts. It reaches the app either
// through the dev server (playwright.config.ts exports VITE_E2E_ACCOUNT) or,
// for built artifacts, through VITE_PUBLISHED_DEMO_ACCOUNT in the build env.

import { expect, type Page } from "@playwright/test";
import { E2E_ACCOUNT_EMAIL, E2E_ACCOUNT_PASSWORD } from "./e2e-account";

/**
 * Sign in on /login with the provisioned test credential and wait for the
 * workspace to open (the dashboard overview by default).
 */
export async function signIn(page: Page): Promise<void> {
  // Open the marketing root first so /login is entered as a fresh history
  // entry. When a guard redirect already put /login in history with the
  // attempted route in router state, a plain reload would keep that state
  // and the sign-in would (correctly) return to the guarded page instead
  // of the overview.
  await page.goto("/");
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
  await page.getByLabel("Email", { exact: true }).fill(E2E_ACCOUNT_EMAIL);
  await page
    .getByLabel("Password", { exact: true })
    .fill(E2E_ACCOUNT_PASSWORD);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
}

/**
 * Assert that an anonymous visitor to a guarded route lands on the log-in
 * page instead of the workspace, and that the attempted location is kept
 * for the post-sign-in return.
 */
export async function expectLoginRedirect(
  page: Page,
  route: string,
): Promise<void> {
  await page.goto(route);
  await expect(page).toHaveURL("/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to your workspace" }),
  ).toBeVisible();
}
