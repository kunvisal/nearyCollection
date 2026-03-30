/**
 * E2E: COD Checkout Happy Path
 *
 * Flow:
 *   Home → (first in-stock product) → Add to Cart → Checkout (COD) → Success Page
 *
 * Requires: at least one active product with in-stock variants in the DB.
 */

import { test, expect } from "@playwright/test";
import { ROUTES, SAMPLE_CUSTOMER } from "../fixtures/test-data";
import { addFirstInStockProductToCart, clearCart, submitCheckoutForm } from "../fixtures/shop-helpers";

test.describe("COD Checkout — Happy Path", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.home);
    await clearCart(page);
  });

  test("customer can browse, add to cart, and place a COD order", async ({ page }) => {
    // ── 1. Add an in-stock product to cart ───────────────────────────────
    await addFirstInStockProductToCart(page);

    // ── 2. Navigate to checkout ───────────────────────────────────────────
    await page.getByRole("link", { name: /checkout now/i }).click();
    await page.waitForURL("**/checkout");
    await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible();

    // ── 3. Fill contact details ───────────────────────────────────────────
    await page.locator('[name="customerName"]').fill(SAMPLE_CUSTOMER.fullName);
    await page.locator('[name="customerPhone"]').fill(SAMPLE_CUSTOMER.phone);

    // ── 4. Fill delivery details ──────────────────────────────────────────
    await page.locator('[name="deliveryZone"]').selectOption("PP");
    await page.locator('[name="deliveryAddress"]').fill(SAMPLE_CUSTOMER.address);

    // ── 5. Select COD payment ─────────────────────────────────────────────
    await page.locator("label", { hasText: "Cash on Delivery" }).click();

    // Screenshot — form filled
    await page.screenshot({
      path: "tests/screenshots/checkout-cod-form-filled.png",
      fullPage: true,
    });

    // ── 6. Submit order ───────────────────────────────────────────────────
    await submitCheckoutForm(page);
    await page.waitForURL("**/checkout/success**", { timeout: 20000 });

    // ── 7. Verify success page ────────────────────────────────────────────
    await expect(page.getByText("Order Confirmed!")).toBeVisible();

    // Order code (format NC-YYYYMMDD-XXXX) must be present
    const orderCodeEl = page.locator(".font-mono");
    await expect(orderCodeEl).toBeVisible();
    const orderCode = await orderCodeEl.textContent();
    expect(orderCode?.trim()).toMatch(/NC-\d{8}-\d+/);

    // COD orders must NOT show the "Upload Payment Slip" button
    await expect(page.getByRole("link", { name: /upload payment slip/i })).not.toBeVisible();

    // Navigation links present
    await expect(page.getByRole("link", { name: /track order/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /continue shopping/i })).toBeVisible();

    // Screenshot — success
    await page.screenshot({
      path: "tests/screenshots/checkout-cod-success.png",
      fullPage: true,
    });
  });

  test("empty cart shows prompt and Continue Shopping link", async ({ page }) => {
    await page.goto(ROUTES.checkout);
    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /continue shopping/i })).toBeVisible();
  });
});
