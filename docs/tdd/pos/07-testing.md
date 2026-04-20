# 07 — Testing

[← Back to Index](./README.md)

---

## 7.1 Testing Strategy

> **Current state:** No automated test framework is configured for this project. All testing is manual. Do not add a test framework without explicit team approval — see `CLAUDE.md`.

| Test Type | Status | Notes |
|-----------|--------|-------|
| Unit tests | Not configured | No test runner installed |
| Integration tests | Not configured | No test runner installed |
| End-to-end tests | Not configured | No Playwright or Cypress setup |
| Manual QA | Active | All testing is performed manually by QA or developer |

When a test framework is introduced, this section will be updated with the test runner, test file locations, and CI integration details.

---

## 7.2 Manual Test Cases

### Happy Path — PP Zone COD Order

| ID | TC-POS-001 |
|----|-----------|
| **Scenario** | Staff creates a complete in-store order for Phnom Penh zone using Cash on Delivery |
| **Precondition** | At least one product with stock ≥ 1 exists. Staff is logged in as ADMIN or STAFF. |

**Steps:**
1. Navigate to `/admin/pos`
2. Search for or browse to a product with available stock
3. Click the product card → variant modal opens
4. Select an available variant → click "Add to Cart"
5. Open the cart drawer
6. In the checkout form:
   - Enter customer name and phone
   - Select Delivery Zone: PP
   - Enter a delivery address
   - Verify Payment Method is locked to COD
   - Verify Delivery Service is locked to JALAT
   - Verify delivery fee is populated from Settings
7. Click "Place Order & Auto-Confirm"

**Expected Results:**
- [ ] Order is created successfully
- [ ] Receipt modal appears with a unique order code (`NC-YYYYMMDD-XXXX`)
- [ ] Order status = `PROCESSING`
- [ ] Payment status = `UNPAID`
- [ ] Product stock count is reduced by the ordered quantity
- [ ] Telegram notification is sent to owner
- [ ] Cart is cleared after receipt is dismissed

---

### Happy Path — Province Zone ABA Order

| ID | TC-POS-002 |
|----|-----------|
| **Scenario** | Staff creates an order for Province zone using ABA pre-payment |
| **Precondition** | At least one product with stock ≥ 1 exists. Staff is logged in. |

**Steps:**
1. Add a product variant to cart
2. In checkout form:
   - Select Delivery Zone: PROVINCE
   - Verify Payment Method options are ABA and WING (not COD)
   - Select ABA
   - Verify Delivery Service options are VET and JT (not JALAT)
   - Select VET
   - Complete remaining fields and submit

**Expected Results:**
- [ ] Order is created successfully
- [ ] Order status = `PROCESSING`
- [ ] Payment status = `PAID` (auto-confirmed for Province + ABA)
- [ ] Stock deducted correctly

---

### Edge Case — Out of Stock Variant Blocked

| ID | TC-POS-003 |
|----|-----------|
| **Scenario** | Staff attempts to add a variant with zero stock to the cart |
| **Precondition** | A product exists with at least one variant that has `stockOnHand = 0` |

**Steps:**
1. Click a product card
2. In the variant modal, find a variant with zero stock

**Expected Results:**
- [ ] The zero-stock variant is visually disabled
- [ ] Clicking the disabled variant has no effect (cannot be added to cart)

---

### Edge Case — Insufficient Stock on Submit

| ID | TC-POS-004 |
|----|-----------|
| **Scenario** | Between adding to cart and submitting, another order depletes the stock |
| **Precondition** | A variant with `stockOnHand = 1` exists. Two browser tabs simulate concurrent users. |

**Steps:**
1. In Tab A: Add the variant (qty 1) to cart
2. In Tab B: Complete a separate order for the same variant (qty 1)
3. In Tab A: Submit the checkout form

**Expected Results:**
- [ ] Tab A order creation fails with a stock-insufficient error
- [ ] An appropriate error message is shown to the staff member
- [ ] No order record is created (transaction rolled back)
- [ ] Stock is not double-deducted

---

### Messenger Auto-Fill

| ID | TC-POS-005 |
|----|-----------|
| **Scenario** | Staff uses Messenger import to auto-fill checkout fields |
| **Precondition** | Messenger API is configured. At least one conversation contains a phone number and address. |

**Steps:**
1. Add a product to cart and open the cart drawer
2. In the Messenger Import section, search for a conversation by customer name
3. Select the conversation
4. Click "Fill All Fields"

**Expected Results:**
- [ ] Customer name is populated in the checkout form
- [ ] Phone number is detected and filled
- [ ] Address is detected and filled
- [ ] Staff can manually override any auto-filled field

---

### Edge Case — Telegram Failure Does Not Block Order

| ID | TC-POS-006 |
|----|-----------|
| **Scenario** | Telegram API is unreachable (simulated by using an invalid bot token in Settings) |
| **Precondition** | An invalid `telegramBotToken` is saved in Settings. |

**Steps:**
1. Create a normal PP zone order

**Expected Results:**
- [ ] Order is created successfully
- [ ] Receipt modal is shown normally
- [ ] Stock is deducted
- [ ] No error is shown to staff related to Telegram
- [ ] Telegram notification is silently not sent

---

### Edge Case — Free Delivery Toggle

| ID | TC-POS-007 |
|----|-----------|
| **Scenario** | Staff applies the free delivery flag |

**Steps:**
1. Add products to cart and open checkout
2. Note the delivery fee amount
3. Check the "Free Delivery" checkbox

**Expected Results:**
- [ ] Delivery fee in the cart total changes to $0.00
- [ ] Order total recalculates correctly
- [ ] Saved order has `isFreeDelivery = true` and `deliveryFee = 0`

---

### Edge Case — Discount Applied

| ID | TC-POS-008 |
|----|-----------|
| **Scenario** | Staff applies an order-level discount |

**Steps:**
1. Add products to cart (e.g. subtotal = $20)
2. Enter a discount amount (e.g. $2)
3. Verify total = subtotal - discount + delivery fee

**Expected Results:**
- [ ] Total = `subtotal - discount + deliveryFee`
- [ ] Order record contains the correct `discount` and `total` values

---

## 7.3 Regression Checklist — Stock Deduction

Run this checklist after any change that touches `orderRepository.ts`, `orderService.ts`, or `orderActions.ts`:

- [ ] Stock is reduced by exactly the ordered quantity
- [ ] Stock is never reduced below zero
- [ ] An `InventoryTransaction` record (type: `DEDUCT`) is created for each variant
- [ ] Cancelled orders have their stock restored
- [ ] Two simultaneous orders for the same last-unit item result in only one succeeding

---

## 7.4 QA Sign-Off

| Test Cycle | Date | Tester | Result | Notes |
|-----------|------|--------|--------|-------|
| v1.0 Initial | [PLACEHOLDER] | [PLACEHOLDER] | [PLACEHOLDER] | |
