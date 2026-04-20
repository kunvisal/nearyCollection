# 02 — Functional Requirements

[← Back to Index](./README.md)

---

## Overview

This section documents all functional requirements for the POS module. Each requirement includes a unique identifier, description, acceptance criteria, and priority.

**Priority Levels:**
- **High** — Core functionality; system cannot operate without it
- **Medium** — Important workflow feature; workarounds exist but are unacceptable for daily use
- **Low** — Enhancement; nice to have but not blocking

---

## FR-POS-001 — Product Browsing

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-001 |
| **Title** | Product Browsing |
| **Priority** | High |

**Description:**
Staff must be able to browse the full product catalogue within the POS interface, with visual indicators for stock availability.

**Acceptance Criteria:**
- [ ] Products are displayed in a responsive grid (2–6 columns depending on screen width)
- [ ] Each product card shows: product image, Khmer name, starting price range, and available stock count
- [ ] Products with zero stock display a visual "out of stock" indicator
- [ ] Products with stock ≤ 5 display a low-stock warning (orange indicator)
- [ ] The product list reflects the current stock levels without requiring a page refresh after an order

---

## FR-POS-002 — Product Search

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-002 |
| **Title** | Product Search by Name |
| **Priority** | High |

**Description:**
Staff must be able to search for products by name in both Khmer and English.

**Acceptance Criteria:**
- [ ] A search input field is visible at the top of the product grid
- [ ] Typing in the search field filters the product list in real time
- [ ] Search matches against both `nameKm` (Khmer) and `nameEn` (English) fields
- [ ] Clearing the search field restores the full product list

---

## FR-POS-003 — Category Filter

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-003 |
| **Title** | Filter Products by Category |
| **Priority** | Medium |

**Description:**
Staff must be able to filter the product list by product category using a horizontal tab/chip interface.

**Acceptance Criteria:**
- [ ] All available categories are displayed as selectable tabs
- [ ] An "All" option is available to clear the category filter
- [ ] Selecting a category shows only products belonging to that category
- [ ] Category filter and search filter can be applied simultaneously

---

## FR-POS-004 — Stock Status Filter

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-004 |
| **Title** | Filter Products by Stock Status |
| **Priority** | Low |

**Description:**
Staff must be able to filter the product list to show all products, in-stock only, or out-of-stock only.

**Acceptance Criteria:**
- [ ] Three filter options are available: All (ទាំងអស់), In Stock (មានស្តុក), Out of Stock (អស់ស្តុក)
- [ ] Selecting "In Stock" hides all products where total available stock across all variants is zero
- [ ] Selecting "Out of Stock" shows only products where all variants have zero stock

---

## FR-POS-005 — Variant Selection

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-005 |
| **Title** | Select Product Variant |
| **Priority** | High |

**Description:**
When a staff member selects a product, a modal must display all available variants so the correct size/color can be chosen before adding to cart.

**Acceptance Criteria:**
- [ ] Clicking a product card opens a variant selection modal
- [ ] The modal displays all variants with: color, size, SKU, and available stock count
- [ ] Variants with zero available stock are visually disabled and cannot be selected
- [ ] Available stock is calculated as `stockOnHand - reservedQty`
- [ ] A link is available to open the product edit page in a new tab (for quick stock updates)

---

## FR-POS-006 — Add to Cart

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-006 |
| **Title** | Add Variant to Cart |
| **Priority** | High |

**Description:**
Staff must be able to add a selected variant to the in-session cart.

**Acceptance Criteria:**
- [ ] Selecting a variant and confirming adds it to the cart
- [ ] If the same variant is added again, its quantity is incremented (not a duplicate line item)
- [ ] The product card displays the current cart quantity as a badge
- [ ] Cart state is maintained in client-side React state (not persisted across sessions)

---

## FR-POS-007 — Cart Management

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-007 |
| **Title** | View and Manage Cart |
| **Priority** | High |

**Description:**
Staff must be able to review the cart contents and adjust quantities before checkout.

**Acceptance Criteria:**
- [ ] A cart summary is accessible from the POS interface (slide-up drawer)
- [ ] Each cart item shows: product name (Khmer), size, color, unit price, quantity, and line total
- [ ] Quantity can be incremented or decremented using ± controls
- [ ] Reducing quantity to zero removes the item from the cart
- [ ] Cart totals (subtotal, discount, delivery fee, total) are recalculated in real time

---

## FR-POS-008 — Customer Identification

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-008 |
| **Title** | Customer Lookup and Creation |
| **Priority** | High |

**Description:**
The system must identify existing customers by phone number and create a new customer record if none is found.

**Acceptance Criteria:**
- [ ] The checkout form requires customer full name and phone number
- [ ] On order submission, the system searches for an existing customer matching the provided phone number
- [ ] If a match is found, the existing customer record is linked to the new order
- [ ] If no match is found, a new customer record is created automatically
- [ ] No duplicate customer records are created for the same phone number

---

## FR-POS-009 — Checkout Form

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-009 |
| **Title** | Checkout Form |
| **Priority** | High |

**Description:**
Staff must complete a checkout form specifying delivery and payment details before confirming an order.

**Acceptance Criteria:**
- [ ] The form captures: customer name, phone, delivery zone, delivery address, payment method, delivery service, optional note, optional discount, optional free delivery flag
- [ ] Delivery zone selection (PP / PROVINCE) dynamically constrains:
  - Payment method: PP → COD only; PROVINCE → ABA or WING only
  - Delivery service: PP → JALAT only; PROVINCE → VET or JT only
- [ ] Delivery fee is automatically populated based on zone (fetched from Settings)
- [ ] Free delivery checkbox sets delivery fee to zero
- [ ] All required fields are validated before submission

---

## FR-POS-010 — Messenger Auto-Fill

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-010 |
| **Title** | Auto-Fill Checkout Form from Messenger |
| **Priority** | Medium |

**Description:**
Staff must be able to search Messenger conversations and auto-populate the checkout form fields using data extracted from conversation messages.

**Acceptance Criteria:**
- [ ] A Messenger import section is available within the checkout drawer
- [ ] Staff can search conversations by customer name
- [ ] Selecting a conversation loads the recent messages for that conversation
- [ ] The system automatically detects phone numbers and addresses from message text
- [ ] Individual "Fill" buttons allow filling specific fields (phone, address) from specific messages
- [ ] A "Fill All Fields" button populates all detectable fields at once
- [ ] Auto-filled values can be manually overridden by the staff member

---

## FR-POS-011 — Order Creation

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-011 |
| **Title** | Atomic Order Creation |
| **Priority** | High |

**Description:**
Submitting the checkout form must create a confirmed order with all associated records in a single atomic database transaction.

**Acceptance Criteria:**
- [ ] Order is created with status `PROCESSING` (POS orders are auto-confirmed)
- [ ] Each cart item creates an `OrderItem` record with a snapshot of: product name, size, color, SKU, cost price, sale price, discount, quantity, and line total
- [ ] Province zone orders with ABA/WING payment are automatically set to payment status `PAID`
- [ ] PP zone orders are set to payment status `UNPAID`
- [ ] Stock is deducted from `ProductVariant.stockOnHand` atomically within the same transaction
- [ ] An `InventoryTransaction` record of type `DEDUCT` is logged for each variant deducted
- [ ] If stock is insufficient for any item, the entire transaction is rolled back and an error is returned
- [ ] A unique order code is generated in the format `NC-YYYYMMDD-XXXX` using Cambodia local time (UTC+7)

---

## FR-POS-012 — Order Code Generation

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-012 |
| **Title** | Unique Order Code |
| **Priority** | High |

**Description:**
Every order must receive a unique, human-readable order code for tracking and communication purposes.

**Acceptance Criteria:**
- [ ] Order code format: `NC-YYYYMMDD-XXXX` where the date is in Cambodia local time (UTC+7) and XXXX is a random 4-digit suffix
- [ ] Order code is unique across all orders (enforced at the database level)
- [ ] Order code is displayed prominently on the receipt modal
- [ ] Order code is included in the Telegram notification

---

## FR-POS-013 — Receipt Display

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-013 |
| **Title** | Receipt Modal |
| **Priority** | High |

**Description:**
After a successful order, a receipt modal must be displayed summarising the order details.

**Acceptance Criteria:**
- [ ] Receipt modal displays: order code, date, customer name and phone, delivery address, delivery service, itemised list (name, qty, price), subtotal, discount, delivery fee, and total
- [ ] Totals are displayed in both USD and Khmer Riel (KHR) using the configured exchange rate
- [ ] A "Print" button is available that triggers the browser print dialog
- [ ] The receipt is print-formatted (non-receipt UI elements are hidden in print view)
- [ ] A "New Order" button clears the cart and resets the POS for the next transaction

---

## FR-POS-014 — Send Order to Customer via Messenger

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-014 |
| **Title** | Messenger Order Dispatch |
| **Priority** | Medium |

**Description:**
If a Messenger conversation was selected during checkout, staff must be able to send the order summary and payment QR code to the customer via Messenger from within the receipt modal.

**Acceptance Criteria:**
- [ ] Two editable message blocks are presented after order creation (order summary, payment/delivery instructions)
- [ ] Each message block has an individual "Send" button
- [ ] A QR code sender is available with options: both currencies, KHR only, or USD only
- [ ] QR images are sent to the selected Messenger conversation
- [ ] Sent status is indicated to the staff member

---

## FR-POS-015 — Telegram Notification

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-015 |
| **Title** | Owner Notification via Telegram |
| **Priority** | High |

**Description:**
Every confirmed POS order must trigger an automatic notification to the business owner via the configured Telegram bot.

**Acceptance Criteria:**
- [ ] A Telegram message is sent immediately after a successful order creation
- [ ] The message contains: order code, customer name and phone, total amount, payment method, delivery zone, and a link to the order detail page
- [ ] If the Telegram notification fails, the order creation is not affected (fire-and-forget)
- [ ] Telegram credentials (bot token, chat ID) are configurable via the Settings module

---

## FR-POS-016 — Stock Display Refresh

| Field | Detail |
|-------|--------|
| **ID** | FR-POS-016 |
| **Title** | Real-Time Stock Refresh After Order |
| **Priority** | Medium |

**Description:**
After an order is successfully created, the product grid must reflect the updated stock levels without requiring a manual page refresh.

**Acceptance Criteria:**
- [ ] Product list is automatically refreshed after each successful order creation
- [ ] Stock counts on product cards reflect the post-deduction values
- [ ] Products that become out-of-stock after an order are immediately marked as such in the grid
