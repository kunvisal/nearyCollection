/**
 * Auth setup — runs once before any admin tests.
 * Logs in via the sign-in page and saves the browser storage state (session cookies)
 * to ADMIN_AUTH_FILE so admin specs can reuse the session without re-logging in.
 */
import { test as setup, expect } from "@playwright/test";
import { ADMIN_CREDENTIALS, ADMIN_AUTH_FILE, ROUTES } from "./test-data";

setup("authenticate as admin", async ({ page }) => {
  await page.goto(ROUTES.signin);

  await page.getByPlaceholder(/enter your username/i).fill(ADMIN_CREDENTIALS.username);
  await page.getByPlaceholder(/enter your password/i).fill(ADMIN_CREDENTIALS.password);
  await page.getByRole("button", { name: /sign in/i }).click();

  // Wait for redirect to admin dashboard
  await page.waitForURL("**/admin**");
  await expect(page).toHaveURL(/\/admin/);

  // Persist session to disk so other test files can reuse it
  await page.context().storageState({ path: ADMIN_AUTH_FILE });
});
