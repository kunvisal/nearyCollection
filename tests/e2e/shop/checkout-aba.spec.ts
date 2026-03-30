/**
 * E2E: ABA Checkout + Payment Slip Upload Happy Path
 *
 * Flow:
 *   Home → (first in-stock product) → Add to Cart
 *   → Checkout (ABA) → Success Page → Upload Payment Slip → Verifying state
 *
 * Requires: active product with in-stock variants in DB.
 */

import { test, expect } from "@playwright/test";
import { ROUTES, SAMPLE_CUSTOMER } from "../fixtures/test-data";
import { addFirstInStockProductToCart, clearCart, submitCheckoutForm } from "../fixtures/shop-helpers";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

/** Minimal 1×1 red PNG written to a temp file for slip upload tests */
function createDummyPng(): string {
  const PNG_1x1_RED = Buffer.from(
    "89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de" +
      "0000000c4944415408d76360f8cfc0000000020001e221bc330000000049454e44ae426082",
    "hex"
  );
  const tmp = path.join(os.tmpdir(), "payment-slip-test.png");
  fs.writeFileSync(tmp, PNG_1x1_RED);
  return tmp;
}

test.describe("ABA Checkout + Payment Slip Upload", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.home);
    await clearCart(page);
  });

  test("customer can place ABA order and upload payment slip", async ({ page }) => {
    // ── 1. Add an in-stock product to cart ───────────────────────────────
    await addFirstInStockProductToCart(page);

    // ── 2. Go to checkout ─────────────────────────────────────────────────
    await page.getByRole("link", { name: /checkout now/i }).click();
    await page.waitForURL("**/checkout");

    // ── 3. Fill checkout form ─────────────────────────────────────────────
    await page.locator('[name="customerName"]').fill(SAMPLE_CUSTOMER.fullName);
    await page.locator('[name="customerPhone"]').fill(SAMPLE_CUSTOMER.phone);
    await page.locator('[name="deliveryZone"]').selectOption("PP");
    await page.locator('[name="deliveryAddress"]').fill(SAMPLE_CUSTOMER.address);

    // ── 4. Select ABA Pay ─────────────────────────────────────────────────
    await page.locator("label", { hasText: "ABA Pay" }).click();
    await expect(
      page.getByText(/you will be asked to upload a payment slip/i)
    ).toBeVisible();

    // ── 5. Submit order ───────────────────────────────────────────────────
    await submitCheckoutForm(page);
    await page.waitForURL("**/checkout/success**", { timeout: 20000 });

    // ── 6. Success page shows "Pending Payment" + upload CTA ─────────────
    await expect(page.getByText("Order Confirmed!")).toBeVisible();
    await expect(page.getByText("Pending Payment")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /upload payment slip/i })
    ).toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/checkout-aba-success.png",
      fullPage: true,
    });

    // ── 7. Navigate to payment upload page ────────────────────────────────
    await page.getByRole("link", { name: /upload payment slip/i }).click();
    await page.waitForURL("**/checkout/payment**");

    // ── 8. Upload dummy image ─────────────────────────────────────────────
    const slipPath = createDummyPng();
    await page.locator('input[type="file"]').setInputFiles(slipPath);
    await expect(page.locator("img[alt]").first()).toBeVisible({ timeout: 5000 });

    await page.screenshot({
      path: "tests/screenshots/checkout-aba-slip-preview.png",
      fullPage: true,
    });

    // ── 9. Submit the slip ────────────────────────────────────────────────
    await page.getByRole("button", { name: /submit|upload|confirm/i }).click({ force: true });
    await page.waitForURL("**/checkout/success**", { timeout: 20000 });

    // "Verifying Payment" section now shown; upload CTA gone
    await expect(page.getByText(/verifying payment/i)).toBeVisible();
    await expect(page.getByText("Pending Payment")).not.toBeVisible();

    await page.screenshot({
      path: "tests/screenshots/checkout-aba-slip-uploaded.png",
      fullPage: true,
    });

    fs.unlinkSync(slipPath);
  });
});
