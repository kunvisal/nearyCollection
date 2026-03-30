# QA Testing Guide — Neary Collection

## Overview

This guide explains the automated E2E testing setup for Neary Collection and how to run, extend, and debug tests correctly. Follow this workflow every time you add a new test case.

---

## Architecture

### Why Playwright CLI (not MCP Server)?

The **MCP server** dumps the full page accessibility tree into the AI's context on every action. This floods the token window quickly and degrades accuracy over long sessions.

The **CLI approach** saves the accessibility tree to disk as a YAML/JSON snapshot and only surfaces a lightweight summary. You read the full snapshot only when you need to find a specific element.

```
┌─────────────────────────────────────────────────────────┐
│  MCP Server                  CLI Approach               │
│  ─────────                   ────────────               │
│  Every action dumps full     Snapshot saved to disk     │
│  DOM tree into context   →   Summary shown inline       │
│  (token-heavy, slow)         Full tree read on demand   │
│                              (token-light, sharp)       │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
tests/
├── e2e/
│   ├── admin/
│   │   ├── auth.spec.ts          # Admin login, session, route protection
│   │   └── orders.spec.ts        # Orders list, search, filter, detail
│   ├── shop/
│   │   ├── checkout-cod.spec.ts  # COD checkout happy path
│   │   ├── checkout-aba.spec.ts  # ABA checkout + payment slip upload
│   │   └── order-tracking.spec.ts # Track order by code + phone
│   └── fixtures/
│       ├── test-data.ts          # Shared constants, credentials, sample data
│       ├── auth.setup.ts         # Admin login once → saves session to disk
│       └── shop-helpers.ts       # Reusable shop actions (add to cart, submit form)
├── scripts/
│   └── snapshot-page.ts          # CLI tool: capture page snapshot + screenshot
├── snapshots/                    # Saved accessibility trees (gitignored)
├── screenshots/                  # Step screenshots (gitignored)
└── reports/                      # HTML reports (gitignored)
```

---

## Setup

### 1. Prerequisites

```bash
# Install Playwright (already in devDependencies)
npm install

# Install Chromium browser
npx playwright install chromium
```

### 2. Environment Variables

Create `.env.local` in the project root (never commit this file):

```bash
TEST_ADMIN_USERNAME=admin
TEST_ADMIN_PASSWORD=password1212
TEST_BASE_URL=http://localhost:3000
```

### 3. Start the Dev Server

The tests run against the live dev server. Always start it before running tests:

```bash
npm run dev
```

---

## Running Tests

### Run all tests (headless, recommended)

```bash
npm run test:e2e
```

### Run a single spec file

```bash
npx playwright test tests/e2e/shop/checkout-cod.spec.ts
```

### Run a single test by name

```bash
npx playwright test --grep "customer can browse"
```

### Run with 1 worker (sequential — safer with real DB)

```bash
npx playwright test --workers=1
```

### Run headed (shows browser window — useful for debugging)

```bash
npm run test:e2e:headed
```

### Open HTML report

```bash
npm run test:e2e:report
```

---

## The Snapshot Workflow (Token-Efficient Testing)

Use this when you need to understand a page before writing locators.

### Step 1 — Capture page snapshot

```bash
# Syntax: npx ts-node tests/scripts/snapshot-page.ts <url> [output-name]
npx ts-node tests/scripts/snapshot-page.ts http://localhost:3000/checkout checkout
```

**Output files:**
- `tests/snapshots/checkout.json` — Full accessibility tree (read only when needed)
- `tests/snapshots/checkout.summary.txt` — Lightweight role/name list (read this first)
- `tests/screenshots/checkout.png` — Full-page screenshot

### Step 2 — Read the summary first

```bash
# The summary is printed inline after running the script.
# Or read it from disk:
cat tests/snapshots/checkout.summary.txt
```

The summary looks like:
```
main
  heading "Checkout"
  heading "Contact Details"
    text "Full Name"
    textbox "e.g. Sokha"
    text "Phone Number"
    textbox "012 345 678"
  heading "Delivery"
    combobox "Zone / Province"
    textbox "Street, Sangkat..."
  heading "Payment Method"
    radio "ABA Pay"
    radio "Cash on Delivery"
  button "Confirm Order • $9.49"
```

### Step 3 — Build locators from the summary

```ts
// Use role + name from the summary:
page.getByRole('textbox', { name: /sokha/i })      // Full Name input
page.getByRole('combobox')                          // Zone select
page.getByRole('button', { name: /confirm order/i }) // Submit

// Or use name attributes for controlled inputs:
page.locator('[name="customerName"]')
page.locator('[name="deliveryZone"]')
```

### Step 4 — Read full JSON only when you need a specific element reference

```bash
# Only open this if the summary doesn't give you enough info
cat tests/snapshots/checkout.json | head -100
```

---

## The Loop Workflow: Adding a New Test Case

Follow these steps every time you add a new test. Do **not** skip steps.

### Step 1 — Define what you're testing

Write down:
- The user flow (steps)
- The expected outcome (what proves it passed)
- Whether it touches the DB (creates orders, updates status, etc.)

**Example:** "Admin can change an order status from NEW to PROCESSING"

### Step 2 — Check existing fixtures and helpers

Before writing any test code, check if:
1. Auth is already handled → use `storageState: ADMIN_AUTH_FILE`
2. Cart setup is needed → use `addFirstInStockProductToCart(page)`
3. Checkout submission → use `submitCheckoutForm(page)`
4. Cart clearing → use `clearCart(page)`

```ts
// Always import from fixtures — never duplicate logic in specs
import { ADMIN_AUTH_FILE, ROUTES } from "../fixtures/test-data";
import { addFirstInStockProductToCart, clearCart, submitCheckoutForm } from "../fixtures/shop-helpers";
```

### Step 3 — Snapshot the page you're testing

```bash
npx ts-node tests/scripts/snapshot-page.ts http://localhost:3000/admin/orders admin-orders
```

Read `tests/snapshots/admin-orders.summary.txt` to find the exact role/name of the elements you'll interact with.

### Step 4 — Write the test

**Template for an admin test:**

```ts
import { test, expect } from "@playwright/test";
import { ROUTES, ADMIN_AUTH_FILE } from "../fixtures/test-data";

// All admin tests use the saved session — no re-login needed
test.use({ storageState: ADMIN_AUTH_FILE });

test.describe("Admin Orders — Status Update", () => {
  test("admin can change order status to PROCESSING", async ({ page }) => {
    // 1. Navigate
    await page.goto(ROUTES.adminOrders);
    await page.waitForLoadState("networkidle");

    // 2. Clear date filter so orders are visible
    const dateInputs = page.locator("input.flatpickr-input");
    const count = await dateInputs.count();
    for (let i = 0; i < count; i++) {
      await dateInputs.nth(i).fill("");
      await dateInputs.nth(i).press("Enter");
    }
    await page.waitForTimeout(400);

    // 3. Interact
    await page.locator('a[href*="/admin/orders/"]').first().click();
    await page.waitForURL("**/admin/orders/**");

    // 4. Assert
    await expect(page.getByText("Order Confirmed")).toBeVisible();

    // 5. Screenshot at the key moment
    await page.screenshot({ path: "tests/screenshots/admin-order-status-updated.png" });
  });
});
```

**Template for a shop test:**

```ts
import { test, expect } from "@playwright/test";
import { ROUTES, SAMPLE_CUSTOMER } from "../fixtures/test-data";
import { addFirstInStockProductToCart, clearCart, submitCheckoutForm } from "../fixtures/shop-helpers";

test.describe("Shop — [Feature Name]", () => {
  test.beforeEach(async ({ page }) => {
    // Always clear cart before shop tests to prevent state bleed
    await page.goto(ROUTES.home);
    await clearCart(page);
  });

  test("customer can [do something]", async ({ page }) => {
    // 1. Get a product into cart (handles out-of-stock products automatically)
    await addFirstInStockProductToCart(page);

    // 2. Navigate
    await page.getByRole("link", { name: /checkout now/i }).click();
    await page.waitForURL("**/checkout");

    // 3. Fill form
    await page.locator('[name="customerName"]').fill(SAMPLE_CUSTOMER.fullName);
    await page.locator('[name="customerPhone"]').fill(SAMPLE_CUSTOMER.phone);
    await page.locator('[name="deliveryZone"]').selectOption("PP");
    await page.locator('[name="deliveryAddress"]').fill(SAMPLE_CUSTOMER.address);

    // 4. Submit (ALWAYS use the helper — never click the button directly)
    await submitCheckoutForm(page);

    // 5. Assert
    await page.waitForURL("**/checkout/success**", { timeout: 20000 });
    await expect(page.getByText("Order Confirmed!")).toBeVisible();

    // 6. Screenshot
    await page.screenshot({ path: "tests/screenshots/your-test-name.png" });
  });
});
```

### Step 5 — Run only your new test first

```bash
npx playwright test --grep "admin can change order status"
```

Fix any failures before running the full suite.

### Step 6 — Run the full suite to check for regressions

```bash
npm run test:e2e
```

All previously passing tests must still pass.

### Step 7 — Review screenshots

Check `tests/screenshots/` for screenshots from your test. They're taken at key moments and help visually verify the test did what you intended.

---

## Key Rules — Do NOT Break These

### 1. Always use `storageState` for admin tests
```ts
// ✅ Correct
test.use({ storageState: ADMIN_AUTH_FILE });

// ❌ Wrong — don't re-login in every test
await page.goto("/signin");
await page.fill("username", "admin");
```

Admin auth runs once in `auth.setup.ts` and saves the session. Reusing it saves time and keeps tests stable.

### 2. Always `clearCart` in `beforeEach` for shop tests
```ts
test.beforeEach(async ({ page }) => {
  await page.goto(ROUTES.home);
  await clearCart(page);  // ← required
});
```

Zustand persists cart to localStorage. Without clearing, items from previous tests bleed into new ones.

### 3. Always use `addFirstInStockProductToCart` — never hardcode a product ID
```ts
// ✅ Correct — finds an in-stock product automatically
await addFirstInStockProductToCart(page);

// ❌ Wrong — hardcoded IDs break when DB changes
await page.goto("/product/abc-123");
```

### 4. Always use `submitCheckoutForm(page)` — never click the button directly
```ts
// ✅ Correct
await submitCheckoutForm(page);

// ❌ Wrong — the BottomNav covers the button and blocks normal clicks
await page.locator('button[type="submit"]').click();
```

The shop layout's BottomNav (`fixed bottom-0`) overlaps the checkout submit button. Normal clicks are intercepted. The helper uses DOM `.click()` to bypass this.

### 5. Always `waitForURL` after navigation, not `waitForTimeout`
```ts
// ✅ Correct
await page.waitForURL("**/checkout/success**", { timeout: 20000 });

// ❌ Wrong — fragile timing
await page.waitForTimeout(3000);
```

### 6. Use `waitForLoadState("networkidle")` on admin pages
Admin pages use TanStack Query and ApexCharts which make async requests. Without waiting for network idle, assertions can fail before data loads.

```ts
await page.goto(ROUTES.adminOrders);
await page.waitForLoadState("networkidle");  // ← always add this for admin
```

### 7. Take screenshots at critical moments
```ts
// After every important state change:
await page.screenshot({ path: "tests/screenshots/descriptive-name.png" });
```

Screenshots are saved to `tests/screenshots/` (gitignored). They're your QA report artifacts.

### 8. Never test with parallel workers against a real DB with `connection_limit=1`
The Supabase pooler URL uses `connection_limit=1`. Run shop tests that write to the DB sequentially:

```bash
# Safe for all tests
npx playwright test --workers=1

# Or run specific suites separately
npx playwright test tests/e2e/admin/   # run admin tests
npx playwright test tests/e2e/shop/    # run shop tests separately
```

---

## Locator Cheat Sheet

| What you want to find | Locator |
|----------------------|---------|
| Input by name attribute | `page.locator('[name="customerPhone"]')` |
| Input by placeholder | `page.getByPlaceholder(/enter your username/i)` |
| Button by text | `page.getByRole('button', { name: /sign in/i })` |
| Link by text | `page.getByRole('link', { name: /track order/i })` |
| Heading | `page.getByRole('heading', { name: 'Checkout' })` |
| Select/dropdown | `page.locator('[name="deliveryZone"]').selectOption("PP")` |
| Hidden radio (by label text) | `page.locator('label', { hasText: 'Cash on Delivery' }).click()` |
| First product on home page | `page.locator('a[href^="/product/"]').first()` |
| Text anywhere on page | `page.getByText('Order Confirmed!')` |
| Text (strict, exact match) | `page.getByText('In Stock', { exact: true })` |

---

## Debugging a Failing Test

### 1. Read the failure screenshot first

Playwright saves a screenshot on failure to `tests/output/[test-name]/test-failed-1.png`. Read it before changing any code.

### 2. Run headed to watch the browser

```bash
npm run test:e2e:headed
```

### 3. Capture a snapshot of the failing page

```bash
npx ts-node tests/scripts/snapshot-page.ts http://localhost:3000/[failing-url] debug
# Then read:
cat tests/snapshots/debug.summary.txt
```

Compare the summary to what your locators expect.

### 4. Check the error context file

Playwright writes `error-context.md` to `tests/output/[test-name]/`. It contains the accessibility tree at the time of failure — use it to update locators.

### 5. Common fixes

| Error | Fix |
|-------|-----|
| `strict mode violation: X resolved to N elements` | Use `getByRole('heading', ...)` or `.first()` to be specific |
| Element not found (timeout) | Read the failure screenshot; the element may not exist yet or have a different name |
| `intercepted by another element` | Use `submitCheckoutForm(page)` for checkout, or inject CSS: `page.addStyleTag({ content: '.BottomNav { display: none }' })` |
| "Order Not Found" on success page | Checkout form submission issue — run with `--workers=1` |
| Admin shows "No orders found" | Date filter defaults to "Today" — clear the flatpickr date inputs first |

---

## Test Data Notes

- **Test customer**: `SAMPLE_CUSTOMER` in `test-data.ts` — name "QA Test Customer", phone "0123456789"
- **Test orders**: Every checkout test creates a real order in the database (COD orders are status NEW, payment UNPAID)
- **No cleanup**: Tests do not delete orders after running. Over time, your DB will accumulate test orders. This is fine for a startup-scale app. If needed, add a cleanup step that deletes orders where `customerName = 'QA Test Customer'`.
- **Admin session**: Saved to `tests/.auth/admin.json`. If your admin password changes, delete this file and re-run `npx playwright test --project=setup` to regenerate it.

---

## File Reference

| File | Purpose |
|------|---------|
| [playwright.config.ts](../playwright.config.ts) | Test runner config — baseURL, projects, reporters |
| [tests/e2e/fixtures/test-data.ts](../tests/e2e/fixtures/test-data.ts) | Shared constants, routes, credentials |
| [tests/e2e/fixtures/auth.setup.ts](../tests/e2e/fixtures/auth.setup.ts) | Admin login setup (runs once) |
| [tests/e2e/fixtures/shop-helpers.ts](../tests/e2e/fixtures/shop-helpers.ts) | `addFirstInStockProductToCart`, `clearCart`, `submitCheckoutForm` |
| [tests/scripts/snapshot-page.ts](../tests/scripts/snapshot-page.ts) | CLI tool for capturing page snapshots |
| [tests/e2e/shop/checkout-cod.spec.ts](../tests/e2e/shop/checkout-cod.spec.ts) | COD checkout tests |
| [tests/e2e/shop/checkout-aba.spec.ts](../tests/e2e/shop/checkout-aba.spec.ts) | ABA checkout + payment slip |
| [tests/e2e/shop/order-tracking.spec.ts](../tests/e2e/shop/order-tracking.spec.ts) | Order tracking page |
| [tests/e2e/admin/auth.spec.ts](../tests/e2e/admin/auth.spec.ts) | Admin auth tests |
| [tests/e2e/admin/orders.spec.ts](../tests/e2e/admin/orders.spec.ts) | Admin orders management |
