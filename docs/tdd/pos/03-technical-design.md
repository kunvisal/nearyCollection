# 03 — Technical Design

[← Back to Index](./README.md)

---

## 3.1 Technology Stack

| Layer | Technology | Version / Notes |
|-------|-----------|----------------|
| Framework | Next.js (App Router) | v16 — React Server Components + Server Actions |
| Language | TypeScript | v5 — strict mode, no `any` |
| Styling | Tailwind CSS | v4 — dark mode supported |
| Client State | React `useState` | Cart held in local component state (not persisted) |
| Data Fetching | TanStack React Query | Client-side product list fetch |
| Authentication | NextAuth | v4 — Credentials provider, JWT sessions |
| Validation | Zod | Input validation in service layer |
| ORM | Prisma | v7 — with `@prisma/adapter-pg` for connection pooling |
| Database | PostgreSQL | Hosted on Supabase |
| File Storage | Supabase Storage | Product images, payment QR codes |
| Notifications | Telegram Bot API | New order alerts |
| Customer Messaging | Messenger API | Conversation import + order dispatch |
| Hosting | Vercel | App deployment |
| Date / Timezone | `date-fns` v4 + `date-fns-tz` | Cambodia UTC+7 display |

---

## 3.2 System Architecture

The POS module follows the project's strict 3-layer architecture:

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser (Staff)                          │
│           src/app/admin/pos/page.tsx  ("use client")         │
│                                                              │
│  Product Grid → Variant Modal → Cart Drawer → Checkout Form  │
│                        │                                     │
│               createOrderAction()  ◄── Server Action         │
└──────────────────────────┬───────────────────────────────────┘
                           │  Next.js Server (Vercel)
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Server Actions / Route Handlers              │
│          src/app/actions/orderActions.ts                      │
│          src/app/api/admin/orders/route.ts                    │
│          src/app/api/admin/messenger/send/route.ts            │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│          src/lib/services/orderService.ts                     │
│          src/lib/services/telegramService.ts                  │
│          src/lib/services/productService.ts                   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    Repository Layer                          │
│          src/lib/repositories/orderRepository.ts             │
│          src/lib/repositories/productRepository.ts           │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                      PostgreSQL                              │
│                (Supabase — hosted)                           │
└──────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼──────────────────┐
         ▼                 ▼                  ▼
  ┌────────────┐   ┌──────────────┐   ┌──────────────┐
  │  Supabase  │   │  Telegram    │   │  Messenger   │
  │  Storage   │   │  Bot API     │   │  API         │
  └────────────┘   └──────────────┘   └──────────────┘
```

**Layer responsibilities:**

| Layer | Responsibility |
|-------|---------------|
| Page / Client Component | UI rendering, client state, calling Server Actions |
| Server Action / Route Handler | Parse request, check auth, delegate to service, return response |
| Service | Business logic, Zod validation, orchestrate repositories, handle transactions |
| Repository | Prisma queries only — no logic, no validation |

---

## 3.3 Data Models

### 3.3.1 Order

Primary record for a confirmed sale.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `orderCode` | `String` (unique) | Human-readable code: `NC-YYYYMMDD-XXXX` |
| `customerId` | `String` | FK → Customer |
| `deliveryZone` | `DeliveryZone` | `PP` or `PROVINCE` |
| `deliveryFee` | `Decimal` | Fee in USD |
| `isFreeDelivery` | `Boolean` | Overrides delivery fee to zero |
| `subtotal` | `Decimal` | Sum of all line totals |
| `discount` | `Decimal` | Order-level discount in USD |
| `total` | `Decimal` | `subtotal - discount + deliveryFee` |
| `paymentMethod` | `PaymentMethod` | `COD`, `ABA`, or `WING` |
| `deliveryService` | `DeliveryService?` | `JALAT`, `VET`, or `JT` |
| `paymentStatus` | `PaymentStatus` | `UNPAID`, `PENDING_VERIFICATION`, `PAID`, `REJECTED` |
| `orderStatus` | `OrderStatus` | `NEW`, `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `shippingAddress` | `Json` | `{ detailedAddress: string }` |
| `note` | `String?` | Optional staff note |
| `createdAt` | `DateTime` | UTC timestamp |

### 3.3.2 OrderItem

Line item record linking an Order to a specific ProductVariant.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `orderId` | `String` | FK → Order |
| `variantId` | `String` | FK → ProductVariant |
| `productNameSnapshot` | `String` | Product name at time of order |
| `sizeSnapshot` | `String` | Variant size at time of order |
| `colorSnapshot` | `String` | Variant colour at time of order |
| `skuSnapshot` | `String` | Variant SKU at time of order |
| `costPriceSnapshot` | `Decimal` | Cost price at time of order |
| `salePriceSnapshot` | `Decimal` | Sale price at time of order |
| `discountSnapshot` | `Decimal` | Item-level discount at time of order |
| `qty` | `Int` | Quantity ordered |
| `lineTotal` | `Decimal` | `(salePrice - discount) × qty` |

### 3.3.3 Customer

Persistent customer record, deduplicated by phone number.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `fullName` | `String` | Customer full name |
| `phone` | `String` (unique) | Phone number — deduplication key |
| `createdAt` | `DateTime` | UTC timestamp |

### 3.3.4 Product

Master product record.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `nameKm` | `String` | Khmer name (required) |
| `nameEn` | `String?` | English name (optional) |
| `categoryId` | `Int` | FK → Category |
| `isActive` | `Boolean` | Soft delete flag |
| `createdAt` | `DateTime` | UTC timestamp |

### 3.3.5 ProductVariant

A specific size/colour combination of a product. Stock is tracked at this level.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `productId` | `String` | FK → Product |
| `size` | `String` | Size label (e.g. S, M, L) |
| `color` | `String` | Colour label |
| `sku` | `String` (unique) | Stock keeping unit |
| `barcode` | `String?` (unique) | Optional barcode |
| `costPrice` | `Decimal` | Purchase cost |
| `salePrice` | `Decimal` | Selling price |
| `discountAmount` | `Decimal` | Per-item discount |
| `stockOnHand` | `Int` | Current physical stock |
| `reservedQty` | `Int` | Qty reserved (currently always 0 in POS) |
| `lowStockThreshold` | `Int` | Threshold for low-stock warning |
| `isActive` | `Boolean` | Soft delete flag |

### 3.3.6 InventoryTransaction

Audit log for every stock movement.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `variantId` | `String` | FK → ProductVariant |
| `type` | `TransactionType` | `IN`, `OUT`, `ADJUST`, `RESERVE`, `RELEASE`, `DEDUCT` |
| `qty` | `Int` | Quantity changed (positive = in, negative = out) |
| `refType` | `String` | Reference type (e.g. `ORDER`) |
| `refId` | `String?` | Reference ID (e.g. Order ID) |
| `note` | `String?` | Optional description |
| `createdAt` | `DateTime` | UTC timestamp |

---

## 3.4 Enum Reference

| Enum | Values |
|------|--------|
| `OrderStatus` | `NEW`, `PROCESSING`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED` |
| `PaymentStatus` | `UNPAID`, `PENDING_VERIFICATION`, `PAID`, `REJECTED` |
| `PaymentMethod` | `COD`, `ABA`, `WING` |
| `DeliveryZone` | `PP`, `PROVINCE` |
| `DeliveryService` | `JALAT`, `VET`, `JT` |
| `TransactionType` | `IN`, `OUT`, `ADJUST`, `RESERVE`, `RELEASE`, `DEDUCT` |
| `Role` | `ADMIN`, `STAFF` |

---

## 3.5 Server Actions

Server Actions are invoked directly from the client component without an HTTP layer.

### createOrderAction

**File:** `src/app/actions/orderActions.ts`

**Input:**
```typescript
customerData: {
  fullName: string;
  phone: string;
}

orderData: {
  deliveryZone: DeliveryZone;
  deliveryAddress: string;
  deliveryFee: number;
  isFreeDelivery?: boolean;
  paymentMethod: PaymentMethod;
  deliveryService?: DeliveryService;
  items: Array<{
    variantId: string;
    qty: number;
    salePrice: number;
    discount?: number;
  }>;
  note?: string;
  discount?: number;
  isPOS?: boolean;
}
```

**Output:**
```typescript
{ success: true;  order: { id: string; orderCode: string } }
{ success: false; error: string }
```

**Side effects:**
- Deducts stock from `ProductVariant.stockOnHand`
- Logs `InventoryTransaction` records (type: `DEDUCT`)
- Finds or creates `Customer` record
- Triggers Telegram notification (fire-and-forget)

---

### updateOrderAction

**File:** `src/app/actions/orderActions.ts`

Used by the admin order detail page. Not directly invoked from POS, but shares the same action file.

---

### getDeliveryFeesAction

**File:** `src/app/actions/shopActions.ts`

**Output:**
```typescript
{ deliveryFeePP: number; deliveryFeeProvince: number }
```

Called on POS page load to populate the checkout form's delivery fee field.

---

## 3.6 API Route Contracts

All admin routes require a valid NextAuth session with role `ADMIN` or `STAFF`.

### GET /api/admin/orders

List orders with pagination and filters.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20) |
| `status` | `OrderStatus` | Filter by order status |
| `paymentStatus` | `PaymentStatus` | Filter by payment status |
| `search` | `string` | Search by order code or customer name |
| `dateFrom` | `string` | Start date filter (YYYY-MM-DD, Cambodia time) |
| `dateTo` | `string` | End date filter (YYYY-MM-DD, Cambodia time) |

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [ /* Order[] */ ],
    "meta": { "total": 120, "page": 1, "limit": 20, "totalPages": 6 }
  },
  "error": null
}
```

---

### PUT /api/admin/orders/[id]

Update order status or payment status.

**Request Body:**
```json
{
  "status": "PACKED",
  "paymentStatus": "PAID"
}
```

**Response:**
```json
{ "success": true, "data": { /* Order */ }, "error": null }
```

---

### PUT /api/admin/orders/[id]/payment

Update payment status only.

**Request Body:**
```json
{ "status": "PAID" }
```

**Response:**
```json
{ "success": true, "data": { /* Order */ }, "error": null }
```

---

### POST /api/admin/messenger/send

Send a text message to a Messenger conversation.

**Request Body:**
```json
{ "recipientId": "string", "message": "string" }
```

**Response:**
```json
{ "success": true, "data": null, "error": null }
```

---

### GET /api/admin/messenger/conversations

Fetch recent Messenger conversations for the import feature.

**Response:**
```json
{
  "success": true,
  "data": [ { "id": "string", "name": "string", "snippet": "string" } ],
  "error": null
}
```

---

### GET /api/admin/settings

Fetch system settings including delivery fees and exchange rate.

**Response:**
```json
{
  "success": true,
  "data": {
    "deliveryFeePP": 1.5,
    "deliveryFeeProvince": 2.5,
    "exchangeRateUsdToKhr": 4100,
    "telegramBotToken": "...",
    "telegramChatId": "..."
  },
  "error": null
}
```

---

## 3.7 Business Rules

### Delivery Zone Constraints

| Zone | Allowed Payment Methods | Allowed Delivery Services | Initial Payment Status |
|------|------------------------|--------------------------|----------------------|
| `PP` (Phnom Penh) | `COD` only | `JALAT` only | `UNPAID` |
| `PROVINCE` | `ABA`, `WING` | `VET`, `JT` | `PAID` (auto-confirmed) |

### Order Status on Creation

All POS orders are created with `orderStatus = PROCESSING`. This distinguishes them from online shop orders, which start at `NEW` and require manual confirmation.

### Stock Validation

Stock validation occurs inside a Prisma transaction. The available stock check is:
```
availableStock = stockOnHand - reservedQty
if (qty > availableStock) → throw error → rollback transaction
```

### Order Code Generation

```
Format: NC-{YYYYMMDD}-{XXXX}
Date:   Cambodia local date (UTC+7) via toCambodiaDateStr()
XXXX:   Random 4-digit suffix (zero-padded)
Unique: Enforced by @unique constraint on Order.orderCode
```

### Customer Deduplication

```
1. Query Customer WHERE phone = input.phone
2. If found → use existing Customer.id
3. If not found → INSERT new Customer { fullName, phone }
4. Link customer to new Order
```

---

## 3.8 TypeScript Type Definitions

**File:** `src/types/admin.ts`

### CartItem (client-side only)
```typescript
type CartItem = {
  variantId: string;
  productId: string;
  nameKm: string;
  size: string;
  color: string;
  salePrice: number;
  qty: number;
};
```

### AdminProduct
```typescript
type AdminProduct = {
  id: string;
  nameKm: string;
  nameEn: string | null;
  variants: AdminVariant[];
  images: AdminProductImage[];
  category?: { id: number; nameKm: string };
};
```

### AdminVariant
```typescript
type AdminVariant = {
  id: string;
  sku: string;
  size: string;
  color: string;
  salePrice: number;
  stockOnHand: number;
  reservedQty: number;
};
```

---

## 3.9 Key File Reference

| File | Purpose |
|------|---------|
| `src/app/admin/pos/page.tsx` | Main POS page — entire client-side UI |
| `src/components/admin/pos/MessengerImport.tsx` | Messenger conversation import component |
| `src/app/actions/orderActions.ts` | Server actions: createOrderAction, updateOrderAction |
| `src/app/actions/shopActions.ts` | Server action: getDeliveryFeesAction |
| `src/lib/services/orderService.ts` | Order business logic |
| `src/lib/services/telegramService.ts` | Telegram notification dispatch |
| `src/lib/services/productService.ts` | Product retrieval for POS grid |
| `src/lib/repositories/orderRepository.ts` | Atomic order creation transaction |
| `src/lib/repositories/productRepository.ts` | Product + variant queries |
| `src/app/api/admin/orders/route.ts` | GET orders list |
| `src/app/api/admin/orders/[id]/route.ts` | PUT order status update |
| `src/app/api/admin/orders/[id]/payment/route.ts` | PUT payment status update |
| `src/app/api/admin/messenger/send/route.ts` | POST send Messenger message |
| `prisma/schema.prisma` | Database schema |
| `src/types/admin.ts` | Shared TypeScript types |
| `src/lib/utils/timezone.ts` | Cambodia UTC+7 date helpers |
