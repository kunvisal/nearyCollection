/**
 * E2E: Order Tracking Page
 *
 * Tests the /orders/track page with both valid and invalid inputs.
 * The "valid order" test creates a real COD order first to guarantee a known order code.
 */

import { test, expect } from "@playwright/test";
import { ROUTES, SAMPLE_CUSTOMER } from "../fixtures/test-data";
import { addFirstInStockProductToCart, clearCart, submitCheckoutForm } from "../fixtures/shop-helpers";

test.describe("Order Tracking", () => {
  test("tracking page loads with form elements", async ({ page }) => {
    await page.goto(ROUTES.orderTracking);
    await expect(page.getByText("Track Your Order")).toBeVisible();
    await expect(page.getByText("Order Code")).toBeVisible();
    await expect(page.getByText("Phone Number")).toBeVisible();
    await expect(page.getByRole("button", { name: /track order/i })).toBeVisible();
  });

  test("invalid order code shows error", async ({ page }) => {
    await page.goto(ROUTES.orderTracking);

    await page.getByPlaceholder(/NC-\d+/i).fill("NC-99999999-0000");
    await page.getByPlaceholder(/phone used at checkout/i).fill("0000000000");
    await page.getByRole("button", { name: /track order/i }).click();

    // Error block appears
    await expect(
      page.locator(".bg-red-50, [class*='red-50'], [class*='red-6']").first()
    ).toBeVisible({ timeout: 8000 });

    await page.screenshot({
      path: "tests/screenshots/order-tracking-not-found.png",
      fullPage: true,
    });
  });

  test("valid order code and phone shows order status", async ({ page }) => {
    // ── Step 1: Create a real COD order ──────────────────────────────────
    await page.goto(ROUTES.home);
    await clearCart(page);
    await addFirstInStockProductToCart(page);

    await page.getByRole("link", { name: /checkout now/i }).click();
    await page.waitForURL("**/checkout");
    await page.locator('[name="customerName"]').fill(SAMPLE_CUSTOMER.fullName);
    await page.locator('[name="customerPhone"]').fill(SAMPLE_CUSTOMER.phone);
    await page.locator('[name="deliveryZone"]').selectOption("PP");
    await page.locator('[name="deliveryAddress"]').fill(SAMPLE_CUSTOMER.address);
    await page.locator("label", { hasText: "Cash on Delivery" }).click();
    await submitCheckoutForm(page);
    await page.waitForURL("**/checkout/success**", { timeout: 20000 });

    // Grab the order code from the success page
    const orderCode = (await page.locator(".font-mono").textContent())?.trim();
    expect(orderCode).toMatch(/NC-\d{8}-\d+/);

    // ── Step 2: Track the order ───────────────────────────────────────────
    await page.goto(ROUTES.orderTracking);
    await page.getByPlaceholder(/NC-\d+/i).fill(orderCode!);
    await page.getByPlaceholder(/phone used at checkout/i).fill(SAMPLE_CUSTOMER.phone);
    await page.getByRole("button", { name: /track order/i }).click();

    // Order result should appear with status NEW
    await expect(page.getByText(/Status:/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("NEW")).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/order-tracking-result.png",
      fullPage: true,
    });
  });
});
