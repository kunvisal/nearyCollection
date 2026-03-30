/**
 * E2E: Admin Authentication
 *
 * Tests login, session persistence, and route protection.
 * Uses saved storageState from auth.setup.ts for the "already logged in" tests.
 */

import { test, expect } from "@playwright/test";
import { ROUTES, ADMIN_CREDENTIALS, ADMIN_AUTH_FILE } from "../fixtures/test-data";

// --- Tests that require a fresh (unauthenticated) browser ---
test.describe("Admin Auth — Unauthenticated", () => {
  // Override storageState so these tests start without any session
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access to /admin redirects to /signin", async ({ page }) => {
    await page.goto(ROUTES.admin);
    await page.waitForURL("**/signin**");
    await expect(page).toHaveURL(/signin/);
  });

  test("sign-in page renders correctly", async ({ page }) => {
    await page.goto(ROUTES.signin);
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByPlaceholder(/enter your username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto(ROUTES.signin);
    await page.getByPlaceholder(/enter your username/i).fill("wrong-user");
    await page.getByPlaceholder(/enter your password/i).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Error div should appear
    await expect(page.locator(".bg-red-50, [class*='red']").first()).toBeVisible({
      timeout: 8000,
    });

    // Should stay on signin page
    await expect(page).toHaveURL(/signin/);

    await page.screenshot({
      path: "tests/screenshots/admin-signin-error.png",
      fullPage: true,
    });
  });

  test("valid credentials redirect to admin dashboard", async ({ page }) => {
    // Skip if no credentials configured
    if (!ADMIN_CREDENTIALS.password) {
      test.skip(true, "TEST_ADMIN_PASSWORD not set in .env.local");
    }

    await page.goto(ROUTES.signin);
    await page.getByPlaceholder(/enter your username/i).fill(ADMIN_CREDENTIALS.username);
    await page.getByPlaceholder(/enter your password/i).fill(ADMIN_CREDENTIALS.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/admin**", { timeout: 10000 });
    await expect(page).toHaveURL(/\/admin/);

    await page.screenshot({
      path: "tests/screenshots/admin-dashboard.png",
      fullPage: true,
    });
  });
});

// --- Tests that use the saved admin session ---
test.describe("Admin Auth — Authenticated", () => {
  test.use({ storageState: ADMIN_AUTH_FILE });

  test("authenticated user can access admin dashboard", async ({ page }) => {
    await page.goto(ROUTES.admin);
    // Should NOT be redirected to signin
    await expect(page).toHaveURL(/\/admin/);
    // Dashboard should show some content
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("sign out via user dropdown redirects to signin", async ({ page }) => {
    await page.goto(ROUTES.admin);
    await expect(page).toHaveURL(/\/admin/);

    // Open the user dropdown in the header (button containing "System Admin" or any user name)
    await page.getByRole("button", { name: /system admin|admin/i }).last().click();

    // Click the Sign out link inside the dropdown
    await page.getByRole("link", { name: /sign out/i }).click();

    // Should land on signin page
    await page.waitForURL("**/signin**", { timeout: 8000 });
    await expect(page).toHaveURL(/signin/);
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  });
});
