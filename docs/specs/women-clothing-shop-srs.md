# Women Clothing Sales & Inventory Web App
## Software Requirements Specification (SRS)

**Document Version:** 1.0  
**Last Updated:** February 14, 2026

---

## Table of Contents

1. [Requirement Document (SRS)](#1-requirement-document-srs)
2. [User Stories (Backlog)](#2-user-stories-backlog)
3. [API List](#3-api-list-aspnet-core-web-api)
4. [Database Schema Draft](#4-db-schema-draft-tables--key-fields)
5. [Stock Reservation Logic](#stock-reservation-logic-implementation-notes)
6. [Suggested MVP Pages](#suggested-mvp-pages-ui)

---

# 1) Requirement Document (SRS)

## 1.1 Project Overview

**System Name:** Women Clothing Sales & Inventory Web App

**Purpose:** Web app សម្រាប់លក់ខោអាវនារី online + Backoffice admin/staff សម្រាប់គ្រប់គ្រងផលិតផល, variant stock (size+color), orders, payment proof, inventory movement, reports, print receipt/label និង Telegram notification។

**Scope:** Customer-facing storefront + Admin/Staff dashboard (single tenant, 1 admin + staff role)។

---

## 1.2 Users & Roles

### Customer (Guest)

* Browse products, search/filter
* View product detail + select size/color
* Add to cart, checkout as guest
* Choose delivery zone (PP/Province)
* Choose payment method (COD/ABA/Wing)
* Upload slip for ABA/Wing (during checkout or after order)
* Track order by order code + phone

### Admin

* Full access to all modules
* Manage staff accounts/roles
* Configure delivery fees, payment instructions, Telegram settings, invoice/label template
* View profit/reports

### Staff

* Manage orders (pack/ship/deliver/cancel)
* Verify payment slips
* Print receipt + label
* Stock operations limited (as configured)

---

## 1.3 Business Rules

### Products & Stock

* Product must have variants tracked by **Size + Color**
* Each variant includes **SKU, Barcode, CostPrice, SalePrice, Discount, StockOnHand**
* If available stock = (StockOnHand - ReservedQty) <= 0 → disable "Add to cart"
* **No pre-order** allowed

### Delivery (Delivery only)

* Delivery zone is required: Phnom Penh / Province
* Delivery fee:
  * PP = **5000៛** (≈ $1.25)
  * Province = **6000៛** (≈ $1.50)
* No free delivery threshold

### Payment Methods

* COD / ABA Transfer / Wing
* COD: no slip required
* ABA/Wing: **slip upload required**
* Payment status:
  * COD → Unpaid
  * ABA/Wing → PendingVerification → Paid (after staff verify)

### Order Confirmation

* Orders are **auto-created** after checkout (no admin confirmation required)
* Default status: **New**

### Stock Reservation & Deduction (Option A)

* On order creation: reserve stock (ReservedQty increases)
* On "Shipped": deduct stock (StockOnHand decreases) and clear reserved
* On cancel: release reserved

### Printing

* Print **Receipt-size invoice**
* Print **Shipping label** with fields:
  * Order code, Name, Phone, Full address, Delivery zone, Payment method, COD amount (only if COD), Total qty, Note (optional)

### Notification

* Telegram notify on **new order**
* Optional: notify on status changes (Shipped/Delivered)

### Language

* UI supports Khmer/English (i18n)
* Product content can store Khmer + English fields (recommended)

---

## 1.4 Functional Requirements

### FR-01 Storefront Catalog

* Display home sections: new arrivals, best sellers, promotions
* Category listing
* Able to use can scroll to load more products experience like instagram or facebook tiktok

### FR-02 Product Detail

* Multi images
* Variant selection required (size+color)
* Show price/discount/stock availability
* Size guide section

### FR-03 Cart

* Add/remove/update quantity
* Validate stock availability at update/checkout

### FR-04 Checkout (Guest)

* Required fields: full name, phone, address, province/city, delivery zone
* Payment selection (COD/ABA/Wing)
* Delivery fee auto-calculated
* For ABA/Wing require slip upload (or allow "upload later" with pending status—configurable)

### FR-05 Order Creation & Tracking

* Create order with unique order code
* Customer can track by order code + phone
* Show status timeline

### FR-06 Admin/Staff Authentication & Authorization

* Login
* Role-based access (Admin/Staff)

### FR-07 Product & Variant Management (Admin)

* CRUD products, categories
* CRUD variants (size, color, sku, barcode, prices, cost, stock)
* Upload product images
* Set low stock threshold

### FR-08 Inventory Management

* Stock In / Stock Out / Adjustment
* Audit trail for each movement
* Low stock alert list

### FR-09 Order Management (Admin/Staff)

* List & filter orders by date/status/payment/delivery zone
* Update status: New → Processing → Packed → Shipped → Delivered
* Cancel order (release reserve)
* Verify ABA/Wing slip: Approve/Reject with comment
* Print receipt & label

### FR-10 Reports (Admin)

* Sales report (daily/weekly/monthly)
* Best selling products
* Stock report + low stock
* Profit report (based on cost price)

### FR-11 Telegram Notification

* Configure bot token/chat id
* Send new order notification with order summary

---

## 1.5 Non-Functional Requirements

* **Responsive:** Mobile-first design
* **Security:** HTTPS, JWT/Identity, role-based authorization, input validation
* **Performance:** Image optimization, pagination for product list/orders
* **Reliability:** Database backups, logs/audit
* **Maintainability:** Layered architecture, clean code, testable services

---

## 1.6 Assumptions

* Currency display can be USD or KHR or both (config in settings)
* Delivery fee is fixed (PP/Province) in MVP; advanced fee rules in phase 2

---

# 2) User Stories (Backlog)

## Epic A — Storefront & Shopping

1. As a customer, I can browse products by category so I can find items quickly.
2. As a customer, I can search products by name so I can locate specific items.
3. As a customer, I can filter by size/color and in-stock so I don't waste time.
4. As a customer, I can view product details and select size/color so I buy the correct variant.
5. As a customer, I can add items to cart and edit quantities so I can manage my order.
6. As a customer, I can checkout as guest with delivery info so I can order without login.
7. As a customer, I can choose COD/ABA/Wing so I can pay my preferred way.
8. As a customer, I can upload ABA/Wing slip so payment can be verified.
9. As a customer, I can track my order by code+phone so I know delivery progress.

## Epic B — Admin/Staff Orders

10. As staff, I can view new orders so I can start processing quickly.
11. As staff, I can update order status (Processing/Packed/Shipped/Delivered) so customers are informed.
12. As staff, I can cancel an order so reserved stock is released.
13. As staff, I can verify ABA/Wing slip (approve/reject) so payment status is correct.
14. As staff, I can print receipt and shipping label so packing/delivery is faster.

## Epic C — Products & Inventory

15. As admin, I can create products with images so storefront looks professional.
16. As admin, I can define variants (size/color) with SKU/Barcode so stock is accurate.
17. As admin, I can set cost price so profit can be calculated.
18. As admin, I can stock-in items and track movements so inventory is correct.
19. As admin, I can see low-stock alerts so I can restock early.

## Epic D — Reports & Settings

20. As admin, I can view sales reports by date so I can measure performance.
21. As admin, I can view profit reports so I know margin.
22. As admin, I can configure delivery fees so checkout calculates correctly.
23. As admin, I can configure Telegram notifications so I receive new orders instantly.
24. As admin, I can manage staff accounts so responsibilities are controlled.
25. As admin, I can switch Khmer/English UI so customers understand easily.

---

# 3) API List (ASP.NET Core Web API)

## 3.1 Auth

* `POST /api/auth/login` (Admin/Staff)
* `POST /api/auth/refresh` (optional)
* `GET  /api/auth/me`

## 3.2 Catalog (Public)

* `GET /api/public/categories`
* `GET /api/public/products?search=&categoryId=&size=&color=&minPrice=&maxPrice=&inStock=&page=&pageSize=`
* `GET /api/public/products/{productId}`
* `GET /api/public/products/{productId}/variants`
* `GET /api/public/products/{productId}/images`

## 3.3 Cart/Checkout (Public)

*(cart can be client-side; server validates at checkout)*

* `POST /api/public/orders` (create order + reserve stock)
* `GET  /api/public/orders/track?orderCode=&phone=`
* `POST /api/public/orders/{orderId}/payment-slip` (upload slip ABA/Wing)

## 3.4 Orders (Admin/Staff)

* `GET  /api/admin/orders?status=&paymentStatus=&zone=&from=&to=&page=&pageSize=`
* `GET  /api/admin/orders/{orderId}`
* `PATCH /api/admin/orders/{orderId}/status` (Processing/Packed/Shipped/Delivered/Cancelled)
* `PATCH /api/admin/orders/{orderId}/payment/verify` (approve/reject + comment)
* `GET  /api/admin/orders/{orderId}/print/receipt` (PDF/print data)
* `GET  /api/admin/orders/{orderId}/print/label` (PDF/print data)

## 3.5 Products & Variants (Admin)

* `POST /api/admin/products`
* `PUT  /api/admin/products/{id}`
* `GET  /api/admin/products?page=&pageSize=`
* `GET  /api/admin/products/{id}`
* `DELETE /api/admin/products/{id}` (soft delete recommended)
* `POST /api/admin/products/{id}/images`
* `DELETE /api/admin/products/{id}/images/{imageId}`
* `POST /api/admin/products/{id}/variants`
* `PUT  /api/admin/variants/{variantId}`
* `DELETE /api/admin/variants/{variantId}`

## 3.6 Inventory (Admin/Staff)

* `POST /api/admin/inventory/stock-in`
* `POST /api/admin/inventory/adjust`
* `GET  /api/admin/inventory/transactions?from=&to=&type=&page=&pageSize=`
* `GET  /api/admin/inventory/low-stock`

## 3.7 Reports (Admin)

* `GET /api/admin/reports/sales?from=&to=&groupBy=day|week|month`
* `GET /api/admin/reports/profit?from=&to=`
* `GET /api/admin/reports/top-products?from=&to=&limit=`

## 3.8 Settings & Integrations (Admin)

* `GET  /api/admin/settings`
* `PUT  /api/admin/settings/delivery-fees`
* `PUT  /api/admin/settings/payment-instructions`
* `PUT  /api/admin/settings/telegram`
* `POST /api/admin/telegram/test`

## 3.9 Users (Admin)

* `POST /api/admin/users`
* `GET  /api/admin/users`
* `PUT  /api/admin/users/{id}`
* `PATCH /api/admin/users/{id}/status` (activate/disable)

---

# 4) DB Schema Draft (Tables + Key Fields)

> **Notation:** PK = Primary Key, FK = Foreign Key

## 4.1 Users & Roles

### `Users`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `Username` | string | Unique username |
| `PasswordHash` | string | Hashed password |
| `FullName` | string | Full name |
| `Role` | enum | Admin/Staff |
| `IsActive` | bool | Active status |
| `CreatedAt` | datetime | Creation timestamp |

### `AuditLogs`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | int (PK) | Primary key |
| `UserId` | GUID (FK) | Reference to Users |
| `Action` | string | Action type (e.g., UPDATE_ORDER_STATUS) |
| `EntityType` | string | Order/Product/Variant |
| `EntityId` | string | Related entity ID |
| `OldValue` | json | Previous value |
| `NewValue` | json | New value |
| `CreatedAt` | datetime | Timestamp |

---

## 4.2 Catalog

### `Categories`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | int (PK) | Primary key |
| `NameKm` | string | Khmer name |
| `NameEn` | string (nullable) | English name |
| `SortOrder` | int | Display order |
| `IsActive` | bool | Active status |

### `Products`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `NameKm` | string | Khmer name |
| `NameEn` | string (nullable) | English name |
| `DescriptionKm` | text (nullable) | Khmer description |
| `DescriptionEn` | text (nullable) | English description |
| `CategoryId` | int (FK) | Reference to Categories |
| `IsActive` | bool | Active status |
| `CreatedAt` | datetime | Creation timestamp |

### `ProductImages`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | int (PK) | Primary key |
| `ProductId` | GUID (FK) | Reference to Products |
| `Url` | string | Image URL |
| `SortOrder` | int | Display order |

### `ProductVariants`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `ProductId` | GUID (FK) | Reference to Products |
| `Size` | string | Size (S/M/L/XL) |
| `Color` | string | Color name |
| `Sku` | string (unique) | Stock Keeping Unit |
| `Barcode` | string (unique/nullable) | Barcode |
| `CostPrice` | decimal | Cost price |
| `SalePrice` | decimal | Sale price |
| `DiscountAmount` | decimal | Discount amount (default 0) |
| `StockOnHand` | int | Available stock |
| `ReservedQty` | int | Reserved quantity |
| `LowStockThreshold` | int | Alert threshold (default 0) |
| `IsActive` | bool | Active status |

---

## 4.3 Customers & Orders

### `Customers`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `FullName` | string | Customer full name |
| `Phone` | string (indexed) | Phone number |
| `CreatedAt` | datetime | Creation timestamp |

### `Orders`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `OrderCode` | string (unique) | Unique order code |
| `CustomerId` | GUID (FK) | Reference to Customers |
| `DeliveryZone` | enum | PP/Province |
| `DeliveryFee` | decimal | Delivery fee amount |
| `Subtotal` | decimal | Subtotal amount |
| `Total` | decimal | Total amount |
| `PaymentMethod` | enum | COD/ABA/Wing |
| `PaymentStatus` | enum | Unpaid/PendingVerification/Paid/Rejected |
| `OrderStatus` | enum | New/Processing/Packed/Shipped/Delivered/Cancelled |
| `ShippingAddress` | text/json | Full shipping address |
| `Note` | text (nullable) | Order notes |
| `CreatedAt` | datetime | Creation timestamp |

### `OrderItems`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `OrderId` | GUID (FK) | Reference to Orders |
| `VariantId` | GUID (FK) | Reference to ProductVariants |
| `ProductNameSnapshot` | string | Product name at order time |
| `SizeSnapshot` | string | Size at order time |
| `ColorSnapshot` | string | Color at order time |
| `SkuSnapshot` | string | SKU at order time |
| `CostPriceSnapshot` | decimal | Cost price at order time |
| `SalePriceSnapshot` | decimal | Sale price at order time |
| `DiscountSnapshot` | decimal | Discount at order time |
| `Qty` | int | Quantity ordered |
| `LineTotal` | decimal | Line total amount |

### `PaymentSlips`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `OrderId` | GUID (FK) | Reference to Orders |
| `Method` | enum | ABA/Wing |
| `SlipUrl` | string | Uploaded slip URL |
| `UploadedAt` | datetime | Upload timestamp |
| `VerifiedByUserId` | GUID (FK, nullable) | Reference to Users |
| `VerifiedAt` | datetime (nullable) | Verification timestamp |
| `VerifyStatus` | enum | Pending/Approved/Rejected |
| `VerifyComment` | text (nullable) | Verification comment |

---

## 4.4 Inventory

### `InventoryTransactions`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | GUID (PK) | Primary key |
| `VariantId` | GUID (FK) | Reference to ProductVariants |
| `Type` | enum | IN/OUT/ADJUST/RESERVE/RELEASE/DEDUCT |
| `Qty` | int | Quantity change |
| `RefType` | string | Order/Manual |
| `RefId` | string (nullable) | Reference ID |
| `Note` | text (nullable) | Transaction note |
| `CreatedByUserId` | GUID (FK, nullable) | Reference to Users |
| `CreatedAt` | datetime | Creation timestamp |

---

## 4.5 Settings

### `Settings`

| Field | Type | Description |
|-------|------|-------------|
| `Id` | int (PK) | Primary key |
| `DeliveryFeePP` | decimal | Phnom Penh delivery fee (5000៛) |
| `DeliveryFeeProvince` | decimal | Province delivery fee (6000៛) |
| `PaymentInstructionABA` | text | ABA payment instructions |
| `PaymentInstructionWing` | text | Wing payment instructions |
| `TelegramBotToken` | string | Telegram bot token (encrypted) |
| `TelegramChatId` | string | Telegram chat ID |
| `DefaultLanguage` | enum | km/en |
| `UpdatedAt` | datetime | Last update timestamp |

---

# Stock Reservation Logic (Implementation Notes)

## On Order Creation (`POST /api/public/orders`)

1. Validate each `VariantId` availability: `StockOnHand - ReservedQty >= qty`
2. Create order + items (snapshot prices/cost)
3. Increase `ReservedQty` for each variant
4. Insert `InventoryTransactions` with type=`RESERVE`

## On Status Change to Shipped

1. Decrease `StockOnHand` by qty
2. Decrease `ReservedQty` by qty
3. Insert `InventoryTransactions` with type=`DEDUCT`

## On Order Cancellation

1. Decrease `ReservedQty`
2. Insert `InventoryTransactions` with type=`RELEASE`

---

# Suggested MVP Pages (UI)

## Customer-Facing Pages

* Home
* Category
* Product detail
* Cart
* Checkout
* Track order

## Admin/Staff Dashboard Pages

* Login
* Dashboard
* Products
* Variants/Stock
* Orders list/detail
* Verify slip
* Print receipt/label
* Reports
* Settings

---

## Next Steps

បើអ្នកចង់ បន្ទាប់ពីនេះខ្ញុំអាចរៀបចំជា:

* **Backlog ជាទម្រង់ Jira/Trello (Epic → Story → Tasks)**
* **DB ERD diagram description**
* **ASP.NET Core project structure (Clean Architecture) + DTOs + endpoints skeleton**

---

**End of Document**
