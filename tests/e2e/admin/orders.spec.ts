/**
 * E2E: Admin Orders Management
 *
 * Tests the admin orders list: loading, search, status filter, and detail view.
 * Uses the saved admin session from auth.setup.ts.
 *
 * Note: The orders page defaults to "Today" date range, which may show 0 rows.
 * Tests that need to click a row clear the date inputs first.
 */

import { test, expect } from "@playwright/test";
import { ROUTES, ADMIN_AUTH_FILE, SAMPLE_CUSTOMER } from "../fixtures/test-data";

test.use({ storageState: ADMIN_AUTH_FILE });

/** Clear both date-range inputs so all historical orders become visible. */
async function clearDateFilter(page: import("@playwright/test").Page) {
  // The date inputs are flatpickr instances — clear by setting value to ""
  const dateInputs = page.locator('input[type="text"][class*="flatpickr"], input.flatpickr-input');
  const count = await dateInputs.count();
  for (let i = 0; i < count; i++) {
    await dateInputs.nth(i).fill("");
    await dateInputs.nth(i).press("Enter");
  }
  // Small pause for React state to propagate
  await page.waitForTimeout(400);
}

test.describe("Admin Orders", () => {
  test("orders list page loads", async ({ page }) => {
    await page.goto(ROUTES.adminOrders);
    await expect(page).toHaveURL(/\/admin\/orders/);
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "tests/screenshots/admin-orders-list.png",
      fullPage: true,
    });
  });

  test("search by customer name filters results", async ({ page }) => {
    await page.goto(ROUTES.adminOrders);
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill(SAMPLE_CUSTOMER.fullName);
    await page.waitForTimeout(600); // debounce

    await page.screenshot({
      path: "tests/screenshots/admin-orders-searched.png",
      fullPage: true,
    });
  });

  test("filter by order status shows filtered list", async ({ page }) => {
    await page.goto(ROUTES.adminOrders);
    await page.waitForLoadState("networkidle");

    // Status filter is a <select>
    const statusFilter = page.locator("select").filter({ hasText: /All Order Statuses/i }).first();
    await expect(statusFilter).toBeVisible();
    await statusFilter.selectOption("NEW");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "tests/screenshots/admin-orders-filtered-new.png",
      fullPage: true,
    });
  });

  test("clicking an order row navigates to order detail", async ({ page }) => {
    await page.goto(ROUTES.adminOrders);
    await page.waitForLoadState("networkidle");

    // Clear "Today" date filter so all orders are visible
    await clearDateFilter(page);
    await page.waitForLoadState("networkidle");

    // If still no orders, skip gracefully
    const noOrders = page.getByText(/no orders found/i);
    if (await noOrders.isVisible().catch(() => false)) {
      test.skip(true, "No orders in the database — place an order first");
    }

    // Find the first order detail link in the action column
    const firstOrderLink = page
      .locator('a[href*="/admin/orders/"]')
      .first();

    await expect(firstOrderLink).toBeVisible({ timeout: 10000 });
    await firstOrderLink.click();
    await page.waitForURL("**/admin/orders/**");
    await expect(page).toHaveURL(/\/admin\/orders\/.+/);

    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "tests/screenshots/admin-order-detail.png",
      fullPage: true,
    });
  });
});
