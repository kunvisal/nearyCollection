/**
 * Shared shop helper actions.
 * Import these into any spec that needs to add an item to the cart.
 */

import { Page, expect } from "@playwright/test";

/**
 * Iterates product cards on the home page until finding an in-stock product,
 * then adds it to the cart. Opens the cart drawer.
 *
 * The function handles the case where the first N products on the home page
 * are out of stock by trying each in turn (up to `maxTries`).
 *
 * @returns The product URL that was used
 */
export async function addFirstInStockProductToCart(
  page: Page,
  maxTries = 8
): Promise<string> {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const productLinks = page.locator('a[href^="/product/"]');
  const count = await productLinks.count();
  const limit = Math.min(count, maxTries);

  if (limit === 0) {
    throw new Error("No product links found on the home page. Make sure the dev server has at least one active product.");
  }

  // Collect hrefs first so re-navigation doesn't invalidate locators
  const hrefs: string[] = [];
  for (let i = 0; i < limit; i++) {
    const href = await productLinks.nth(i).getAttribute("href");
    if (href) hrefs.push(href);
  }

  for (const href of hrefs) {
    await page.goto(href);
    await page.waitForLoadState("networkidle");

    // Check if "In Stock" text is present
    const inStockEl = page.getByText("In Stock", { exact: true });
    const inStock = await inStockEl.isVisible().catch(() => false);

    if (!inStock) continue; // product is out of stock, try next

    // Click "Add to Bag" (the secondary CTA on the product detail page)
    const addBtn = page.getByRole("button", { name: /add to bag/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Confirm the cart drawer opened with the item
    await expect(page.getByText(/checkout now/i)).toBeVisible({ timeout: 6000 });
    return href;
  }

  throw new Error(
    `Could not find an in-stock product after checking ${limit} products. ` +
    "Add stock to at least one product variant before running shop tests."
  );
}

/**
 * Submits the checkout form programmatically.
 *
 * Why not a normal .click()? The checkout page's "Confirm Order" button is
 * `position: fixed; bottom: 0; z-index: 50`, but the shop's BottomNav component
 * sits at the same fixed position with a higher effective z-index, fully covering
 * the button in headless Chromium. A normal click (or even force: true) fails
 * because Playwright cannot dispatch the pointer event to the correct target.
 *
 * `btn.click()` (DOM method) fires a real click event directly on the button
 * element, bypassing Playwright's pointer-coordinate interception checks.
 * This is safer than `requestSubmit()` because it triggers the full
 * click → button activation → form submit chain that React expects,
 * ensuring `e.preventDefault()` in the onSubmit handler fires correctly.
 */
export async function submitCheckoutForm(page: Page): Promise<void> {
  await page.locator('button[type="submit"]').evaluate(
    (btn: HTMLButtonElement) => btn.click()
  );
}

/**
 * Clears the Zustand cart from localStorage.
 * Call this in beforeEach to prevent cart bleed between tests.
 */
export async function clearCart(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.keys(localStorage).forEach((key) => {
      if (key.includes("cart")) localStorage.removeItem(key);
    });
  });
}
