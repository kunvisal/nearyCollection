# Ecosystem Reference — Neary Collection

Canonical reference for all API shapes, Prisma models, Zod schemas, enums, and Server Actions.
Keep this file in sync when adding or changing routes, models, or validators.

---

## Table of Contents

1. [Standard API Response Shape](#standard-api-response-shape)
2. [Enums](#enums)
3. [Prisma Models](#prisma-models)
4. [Zod Validators](#zod-validators)
5. [Admin API Routes](#admin-api-routes)
6. [Server Actions](#server-actions)
7. [Messenger API](#messenger-api)

---

## Standard API Response Shape

All route handlers use helpers from `src/lib/utils/apiResponse.ts`.

```ts
// Success
{ success: true,  data: T,    error: null }

// Error
{ success: false, data: null, error: "Error message" }
```

**List endpoints** (orders) return a different shape — no `success` wrapper:
```ts
{
  data: Order[],
  meta: { total: number, page: number, limit: number, totalPages: number }
}
```

**Auth:** All admin routes require a valid NextAuth session with role `ADMIN` or `STAFF`.
Unauthenticated requests return `401`.

---

## Enums

Defined in `prisma/schema.prisma` and exported from `@prisma/client`.

| Enum | Values |
|------|--------|
| `Role` | `ADMIN` \| `STAFF` |
| `OrderStatus` | `NEW` \| `PROCESSING` \| `PACKED` \| `SHIPPED` \| `DELIVERED` \| `CANCELLED` |
| `PaymentStatus` | `UNPAID` \| `PENDING_VERIFICATION` \| `PAID` \| `REJECTED` |
| `PaymentMethod` | `COD` \| `ABA` \| `WING` |
| `DeliveryZone` | `PP` \| `PROVINCE` |
| `DeliveryService` | `JALAT` \| `VET` \| `JT` |
| `TransactionType` | `IN` \| `OUT` \| `ADJUST` \| `RESERVE` \| `RELEASE` \| `DEDUCT` |
| `VerifyStatus` | `PENDING` \| `APPROVED` \| `REJECTED` |
| `DefaultLanguage` | `KM` \| `EN` |

---

## Prisma Models

All models defined in `prisma/schema.prisma`.

### User
```
Table: users
id           String   uuid PK
username     String   unique
passwordHash String
fullName     String
role         Role     default STAFF
isActive     Boolean  default true
createdAt    DateTime default now()
```

### Category
```
Table: categories
id        Int      autoincrement PK
nameKm    String
nameEn    String?
sortOrder Int      default 0
isActive  Boolean  default true
```

### Product
```
Table: products
id            String   uuid PK
nameKm        String   indexed
nameEn        String?
descriptionKm String?
descriptionEn String?
categoryId    Int      FK → categories.id  indexed
isActive      Boolean  default true
createdAt     DateTime default now()

relations: images (ProductImage[]), variants (ProductVariant[]), category
```

### ProductImage
```
Table: product_images
id        Int    autoincrement PK
productId String FK → products.id  onDelete: Cascade
url       String
sortOrder Int    default 0
```

### ProductVariant
```
Table: product_variants
id                String   uuid PK
productId         String   FK → products.id  onDelete: Cascade
size              String
color             String
sku               String   unique
barcode           String?  unique
costPrice         Decimal  (10,2)
salePrice         Decimal  (10,2)
discountAmount    Decimal  (10,2) default 0
stockOnHand       Int      default 0
reservedQty       Int      default 0
lowStockThreshold Int      default 0
isActive          Boolean  default true

relations: product, orderItems (OrderItem[]), inventoryTransactions (InventoryTransaction[])
```

### Customer
```
Table: customers
id        String   uuid PK
fullName  String
phone     String   indexed
createdAt DateTime default now()

relations: orders (Order[])
```

### Order
```
Table: orders
id              String          uuid PK
orderCode       String          unique
customerId      String          FK → customers.id  indexed
deliveryZone    DeliveryZone
deliveryFee     Decimal         (10,2)
isFreeDelivery  Boolean         default false
subtotal        Decimal         (10,2)
discount        Decimal         (10,2) default 0
total           Decimal         (10,2)
paymentMethod   PaymentMethod
deliveryService DeliveryService?
paymentStatus   PaymentStatus   default UNPAID
orderStatus     OrderStatus     default NEW
shippingAddress Json            { address: string }
note            String?
createdAt       DateTime        default now()  indexed

relations: customer, items (OrderItem[]), paymentSlips (PaymentSlip[])
```

### OrderItem
```
Table: order_items
id                  String  uuid PK
orderId             String  FK → orders.id  onDelete: Cascade
variantId           String  FK → product_variants.id
productNameSnapshot String
sizeSnapshot        String
colorSnapshot       String
skuSnapshot         String
costPriceSnapshot   Decimal (10,2)
salePriceSnapshot   Decimal (10,2)
discountSnapshot    Decimal (10,2)
qty                 Int
lineTotal           Decimal (10,2)
```

### PaymentSlip
```
Table: payment_slips
id               String       uuid PK
orderId          String       FK → orders.id  onDelete: Cascade
method           PaymentMethod
slipUrl          String
uploadedAt       DateTime     default now()
verifiedByUserId String?      FK → users.id
verifiedAt       DateTime?
verifyStatus     VerifyStatus default PENDING
verifyComment    String?
```

### InventoryTransaction
```
Table: inventory_transactions
id              String          uuid PK
variantId       String          FK → product_variants.id
type            TransactionType
qty             Int
refType         String          (e.g. "ORDER", "MANUAL")
refId           String?
note            String?
createdByUserId String?         FK → users.id
createdAt       DateTime        default now()
```

### Settings
```
Table: settings
id                     Int             PK = 1 (singleton row)
deliveryFeePP          Decimal         (10,2)
deliveryFeeProvince    Decimal         (10,2)
paymentInstructionABA  String          (Text)
paymentInstructionWing String          (Text)
telegramBotToken       String
telegramChatId         String
contactTelegram        String?
contactMessenger       String?
contactFacebook        String?
defaultLanguage        DefaultLanguage default KM
usdToKhrRate           Int             default 4000
updatedAt              DateTime        @updatedAt
```

### AuditLog
```
Table: audit_logs
id         Int      autoincrement PK
userId     String   FK → users.id
action     String
entityType String
entityId   String
oldValue   Json?
newValue   Json?
createdAt  DateTime default now()
```

---

## Zod Validators

All validators live in `src/lib/validators/`.

### Category — `categoryValidators.ts`
```ts
createCategorySchema  → CreateCategoryInput
  nameKm    string (required)
  nameEn    string?
  sortOrder number int  default 0
  isActive  boolean     default true

updateCategorySchema  → UpdateCategoryInput
  (all fields optional)
```

### Product — `productValidators.ts`
```ts
createProductSchema  → CreateProductInput
  nameKm        string (required)
  nameEn        string? | null
  descriptionKm string? | null
  descriptionEn string? | null
  categoryId    number int positive (required)
  isActive      boolean  default true

updateProductSchema  → UpdateProductInput
  (all fields optional)
```

### ProductVariant — `variantValidators.ts`
```ts
createVariantSchema  → CreateVariantInput
  sku          string (required)
  color        string  catch("")
  size         string  catch("")
  costPrice    number ≥ 0  catch(0)
  salePrice    number ≥ 0 (required)
  stockOnHand  number int ≥ 0  default 0
  isActive     boolean  default true

updateVariantSchema  → UpdateVariantInput
  (all fields optional)
```

### Image — `imageValidators.ts`
```ts
createImageSchema  → CreateImageInput
  url       string (valid URL, required)
  sortOrder number int  default 0
  isPrimary boolean     default false

updateImageSchema  → UpdateImageInput
  sortOrder number int?
  isPrimary boolean?
```

### Inventory — `inventoryValidators.ts`
```ts
logInventorySchema  → LogInventoryInput
  variantId       string (required)
  type            TransactionType enum (required)
  qty             number int (required)
  refType         string (required)
  refId           string? | null
  note            string? | null
  createdByUserId string? | null
```

### Settings — `settingsValidators.ts`
```ts
updateSettingsSchema  (no named type exported)
  deliveryFeePP          number ≥ 0?
  deliveryFeeProvince    number ≥ 0?
  paymentInstructionABA  string?
  paymentInstructionWing string?
  telegramBotToken       string?
  telegramChatId         string?
  contactTelegram        string?
  contactMessenger       string?
  contactFacebook        string?
  defaultLanguage        "KM" | "EN"?
  usdToKhrRate           number int ≥ 1?
```

---

## Admin API Routes

Base path: `/api/admin/`. All routes require `ADMIN` or `STAFF` session.

### Categories

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/admin/categories` | — | `Category[]` |
| POST | `/api/admin/categories` | `CreateCategoryInput` | `Category` (201) |
| GET | `/api/admin/categories/:id` | — | `Category` |
| PUT | `/api/admin/categories/:id` | `UpdateCategoryInput` | `Category` |
| DELETE | `/api/admin/categories/:id` | — | `{ deleted: true }` |

### Products

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/admin/products` | — | `Product[]` (with images + variants) |
| POST | `/api/admin/products` | `CreateProductInput` | `Product` (201) |
| GET | `/api/admin/products/:id` | — | `Product` (with images + variants) |
| PUT | `/api/admin/products/:id` | `UpdateProductInput` | `Product` |
| DELETE | `/api/admin/products/:id` | — | `{ deleted: true }` |

### Product Images

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/admin/products/:id/images` | `CreateImageInput` | `ProductImage` (201) |
| DELETE | `/api/admin/images/:id` | — | `{ deleted: true }` |

### Product Variants

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/admin/products/:id/variants` | `CreateVariantInput` | `ProductVariant` (201) |
| PUT | `/api/admin/variants/:id` | `UpdateVariantInput` | `ProductVariant` |
| DELETE | `/api/admin/variants/:id` | — | `{ deleted: true }` |

### Inventory

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/admin/variants/:id/inventory` | — | `InventoryTransaction[]` |

### Orders

| Method | Path | Query / Body | Returns |
|--------|------|------|---------|
| GET | `/api/admin/orders` | `page`, `limit`, `status`, `paymentStatus`, `search`, `dateFrom`, `dateTo` | `{ data: Order[], meta }` |
| GET | `/api/admin/orders/:id` | — | `Order` (with items + customer + payment slips) |
| PUT | `/api/admin/orders/:id` | `{ status?: OrderStatus, paymentStatus?: PaymentStatus }` | `Order` |
| PUT | `/api/admin/orders/:id/payment` | `{ status: PaymentStatus }` | `Order` |

**Orders list query params:**
- `page` — integer, default `1`
- `limit` — integer, default `10`
- `status` — `OrderStatus` enum value
- `paymentStatus` — `PaymentStatus` enum value
- `search` — free text (searches orderCode, customer name, phone)
- `dateFrom` — `YYYY-MM-DD` Cambodia date string (converted to UTC via `cambodiaDayStartToUtc`)
- `dateTo` — `YYYY-MM-DD` Cambodia date string (converted to UTC via `cambodiaDayEndToUtc`)

### Settings

| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/api/admin/settings` | — | `Settings` |
| PUT | `/api/admin/settings` | `updateSettingsSchema` fields | `Settings` |
| POST | `/api/admin/settings/test-telegram` | — | send test Telegram message |

---

## Server Actions

Defined in `src/app/actions/`. Called directly from client components — no HTTP layer.

### `orderActions.ts`

#### `createOrderAction(customerData, orderData)`
```ts
customerData: { fullName: string; phone: string }

orderData: {
  deliveryZone:    DeliveryZone
  deliveryAddress: string
  deliveryFee:     number
  isFreeDelivery?: boolean
  paymentMethod:   PaymentMethod
  deliveryService?: DeliveryService
  items: Array<{
    variantId: string
    qty:       number
    salePrice: number
    discount?: number
  }>
  note?:     string
  discount?: number
  isPOS?:    boolean   // true when called from POS page
}

// Returns
{ success: true,  order: { id: string, orderCode: string } }
{ success: false, error: string }
```

#### `updateOrderAction(orderId, customerData, orderData)`
Same shape as `createOrderAction` but with `orderId: string` as first arg and no `isPOS` field.

```ts
// Returns
{ success: true,  order: { id: string, orderCode: string } }
{ success: false, error: string }
```

### `shopActions.ts`

#### `getProductsByCategoryAction(categoryId, page?, limit?)`
```ts
categoryId: number
page:       number  default 1
limit:      number  default 10

// Returns
{
  products: Array<{ id: string, name: string, price: number, image: string }>
  hasMore:  boolean
}
```

#### `getDeliveryFeesAction()`
```ts
// Returns
{ deliveryFeePP: number, deliveryFeeProvince: number }
```

### `paymentActions.ts` / `trackingActions.ts`
See source files — these handle payment slip upload and order tracking for the shop (customer-facing) flow.

---

## Messenger API

### Conversations

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/admin/messenger/conversations` | `Conversation[]` |
| GET | `/api/admin/messenger/conversations/:id/messages` | `{ messages: Message[], phone: string }` |

### Send

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/api/admin/messenger/send` | `{ recipientId: string, message: string }` | `null` |
| POST | `/api/admin/messenger/send-image` | `{ recipientId: string, imageFile: string }` | `null` |

**`send-image` notes:**
- `imageFile` is a filename in the Supabase `qr-codes` bucket (not a full URL)
- The route constructs the full URL as: `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/qr-codes/${imageFile}`

---

## Key Utilities

| Utility | File | Purpose |
|---------|------|---------|
| `successResponse(data, status?)` | `src/lib/utils/apiResponse.ts` | Wrap data in standard shape |
| `errorResponse(message, status?)` | `src/lib/utils/apiResponse.ts` | Wrap error in standard shape |
| `formatCambodiaDate(date, fmt)` | `src/lib/utils/timezone.ts` | Display any date to user |
| `cambodiaDayStartToUtc(dateStr)` | `src/lib/utils/timezone.ts` | Query start boundary from Cambodia date string |
| `cambodiaDayEndToUtc(dateStr)` | `src/lib/utils/timezone.ts` | Query end boundary from Cambodia date string |
| `toCambodiaDateStr(date)` | `src/lib/utils/timezone.ts` | Group server-side data by Cambodia day |
