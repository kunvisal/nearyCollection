# Prisma Guide — NearyCollection Admin Dashboard

> **Stack**: Prisma v7 · PostgreSQL (Supabase) · Next.js 15 (App Router) · TypeScript

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Configuration Files](#2-configuration-files)
3. [Schema Basics](#3-schema-basics)
4. [Adding / Changing the Schema](#4-adding--changing-the-schema)
5. [Running Migrations](#5-running-migrations)
6. [Generating the Client](#6-generating-the-client)
7. [Using Prisma in Code](#7-using-prisma-in-code)
8. [Common Query Patterns](#8-common-query-patterns)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Project Setup

### Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Models, enums, relations |
| `prisma/migrations/` | Migration history (SQL files) |
| `prisma.config.ts` | Prisma v7 runtime config (DB URL) |
| `src/lib/prisma.ts` | Singleton Prisma Client for the app |
| `.env` | Environment variables (DB URLs, secrets) |

### Environment Variables (`.env`)

```env
# Used by the app at runtime (PgBouncer pooler — port 6543)
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Used for migrations (direct connection — port 5432, NO pgbouncer)
DIRECT_URL="postgresql://...@pooler.supabase.com:5432/postgres"
```

> ⚠️ **Important**: Always use `DIRECT_URL` (port 5432) when running migrations.
> Using the pooler URL (port 6543) will cause:
> `ERROR: prepared statement "s1" already exists`

---

## 2. Configuration Files

### `prisma.config.ts` (Prisma v7)

```ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
```

> In Prisma v7, `url` and `directUrl` are no longer inside `schema.prisma`.
> They are managed in `prisma.config.ts`.

### `src/lib/prisma.ts`

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

This singleton pattern prevents creating multiple Prisma Client instances
in Next.js hot-reload (development mode).

---

## 3. Schema Basics

File: `prisma/schema.prisma`

### Model Example

```prisma
model Order {
  id              String           @id @default(uuid())
  orderCode       String           @unique
  customerId      String
  deliveryZone    DeliveryZone
  deliveryFee     Decimal          @db.Decimal(10, 2)
  isFreeDelivery  Boolean          @default(false)
  deliveryService DeliveryService?   // nullable enum
  total           Decimal          @db.Decimal(10, 2)
  createdAt       DateTime         @default(now())

  customer Customer @relation(fields: [customerId], references: [id])
  items    OrderItem[]

  @@index([createdAt])
  @@map("orders")   // maps to the "orders" table in postgres
}
```

### Enum Example

```prisma
enum DeliveryService {
  JALAT
  VET
  JT
}
```

### Field Modifiers

| Modifier | Meaning |
|----------|---------|
| `@id` | Primary key |
| `@default(uuid())` | Auto-generate UUID |
| `@default(now())` | Auto-set to current timestamp |
| `@unique` | Unique constraint |
| `?` (after type) | Nullable / optional |
| `@db.Decimal(10, 2)` | Native DB type hint |
| `@@map("table_name")` | Custom DB table name |
| `@@index([field])` | Add DB index |

---

## 4. Adding / Changing the Schema

### Step-by-step

1. **Edit `prisma/schema.prisma`** — add the new field, model, or enum.
2. **Create a migration file** — see [Section 5](#5-running-migrations).
3. **Apply it** and **regenerate** the Prisma Client.

### Example: Adding a new nullable column

```prisma
// In schema.prisma, inside model Order:
trackingNumber String?
```

Then create a migration SQL file for it (see next section).

---

## 5. Running Migrations

### ⚠️ This Project's Migration Rule

Because the app uses **Supabase with PgBouncer**, you MUST override
`DATABASE_URL` with the direct connection URL when running any Prisma
migration command:

```powershell
# PowerShell — override DATABASE_URL for this one command
$env:DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
```

> Copy the value of `DIRECT_URL` from your `.env` file and paste it above.

---

### Option A — Run an Existing Migration SQL File

Use this when you have a `.sql` file in `prisma/migrations/`:

```powershell
$env:DATABASE_URL="<DIRECT_URL value from .env>"
npx prisma db execute --file prisma/migrations/<folder>/migration.sql
npx prisma generate
```

**Example (the deliveryService migration):**

```powershell
$env:DATABASE_URL="postgresql://postgres.duiyfzcotusolqgmhwav:...@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
npx prisma db execute --file prisma/migrations/20260224100000_add_delivery_service/migration.sql
npx prisma generate
```

---

### Option B — Create a New Migration (Schema Change)

1. Edit `prisma/schema.prisma` with your change.
2. Run with the direct URL:

```powershell
$env:DATABASE_URL="<DIRECT_URL value from .env>"
npx prisma migrate dev --name describe_your_change
npx prisma generate
```

This will:
- Diff your schema vs. the DB
- Create a new `.sql` file in `prisma/migrations/`
- Apply it to the DB
- Regenerate the Prisma Client

---

### Option C — Deploy All Pending Migrations (Production/CI)

```powershell
$env:DATABASE_URL="<DIRECT_URL value from .env>"
npx prisma migrate deploy
npx prisma generate
```

---

### Migration File Naming

```
prisma/migrations/
  YYYYMMDDHHMMSS_describe_change/
    migration.sql
```

Example:
```
prisma/migrations/
  20260224100000_add_delivery_service/
    migration.sql
```

---

## 6. Generating the Client

After **any** schema change or migration, always regenerate:

```powershell
npx prisma generate
```

Then **restart the dev server**:

```powershell
npm run dev
```

---

## 7. Using Prisma in Code

### Import the Client

```ts
import prisma from "@/lib/prisma";
```

### In Next.js Server Components / Route Handlers / Server Actions

```ts
// ✅ Server Component (App Router)
export default async function Page() {
  const orders = await prisma.order.findMany({ take: 5 });
  return <div>{orders.length} orders</div>;
}
```

```ts
// ✅ API Route Handler
export async function GET() {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  return Response.json(products);
}
```

> ⚠️ **Never** import `prisma` in Client Components (`"use client"`).
> Prisma only runs server-side.

---

## 8. Common Query Patterns

### Find Many with Filters

```ts
const orders = await prisma.order.findMany({
  where: {
    orderStatus: "NEW",
    createdAt: { gte: new Date("2026-01-01") },
  },
  orderBy: { createdAt: "desc" },
  take: 10,
  skip: 0, // for pagination
});
```

### Find One

```ts
const order = await prisma.order.findUnique({
  where: { id: orderId },
  include: {
    customer: true,
    items: { include: { variant: { include: { product: true } } } },
  },
});
```

### Create

```ts
const newOrder = await prisma.order.create({
  data: {
    orderCode: "ORD-001",
    customerId: "...",
    deliveryZone: "PP",
    deliveryFee: 2.5,
    isFreeDelivery: false,
    subtotal: 50,
    discount: 0,
    total: 52.5,
    paymentMethod: "ABA",
    paymentStatus: "UNPAID",
    orderStatus: "NEW",
    shippingAddress: { street: "...", city: "Phnom Penh" },
    items: {
      create: [
        {
          variantId: "...",
          productNameSnapshot: "Dress A",
          sizeSnapshot: "M",
          colorSnapshot: "Red",
          skuSnapshot: "DRS-M-RED",
          costPriceSnapshot: 10,
          salePriceSnapshot: 25,
          discountSnapshot: 0,
          qty: 2,
          lineTotal: 50,
        },
      ],
    },
  },
});
```

### Update

```ts
await prisma.order.update({
  where: { id: orderId },
  data: {
    orderStatus: "SHIPPED",
    deliveryService: "JALAT",
  },
});
```

### Delete

```ts
await prisma.order.delete({ where: { id: orderId } });
```

### Aggregate (Sum, Count)

```ts
const result = await prisma.order.aggregate({
  _sum: { total: true },
  _count: { id: true },
  where: { orderStatus: { not: "CANCELLED" } },
});

const totalRevenue = Number(result._sum.total ?? 0);
const orderCount = result._count.id;
```

### Group By

```ts
const byStatus = await prisma.order.groupBy({
  by: ["orderStatus"],
  _count: { id: true },
});
```

### Transaction (Atomic Operations)

```ts
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: { ... } });

  await tx.inventoryTransaction.create({
    data: {
      variantId: "...",
      type: "DEDUCT",
      qty: 2,
      refType: "ORDER",
      refId: order.id,
    },
  });
});
```

---

## 9. Troubleshooting

### ❌ `The column does not exist in the current database`

**Cause**: Schema has a new field but the DB doesn't have the column yet.

**Fix**:
```powershell
# 1. Apply the migration SQL (use DIRECT_URL)
$env:DATABASE_URL="<DIRECT_URL>"
npx prisma db execute --file prisma/migrations/<folder>/migration.sql

# 2. Regenerate the client
npx prisma generate

# 3. Restart dev server
npm run dev
```

---

### ❌ `prepared statement "s1" already exists`

**Cause**: Running Prisma migration commands through PgBouncer (port 6543).

**Fix**: Use the direct connection URL (port 5432) for all migration commands:
```powershell
$env:DATABASE_URL="postgresql://...:5432/postgres"
npx prisma migrate deploy
```

---

### ❌ `The datasource property url is no longer supported in schema.prisma`

**Cause**: Prisma v7 moved connection config out of `schema.prisma`.

**Fix**: Put the URL in `prisma.config.ts`, not in `schema.prisma`.
✅ Correct `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
}
```
✅ Correct `prisma.config.ts`:
```ts
datasource: {
  url: process.env["DATABASE_URL"]!,
},
```

---

### ❌ Prisma Client is out of sync after schema change

**Fix**: Always run after any schema modification:
```powershell
npx prisma generate
npm run dev
```

---

### ❌ Multiple Prisma Client instances in dev mode

**Cause**: Hot-reload creates new instances each time.

**Fix**: Use the singleton in `src/lib/prisma.ts` — never do `new PrismaClient()` directly in route files.

---

## Quick Reference Cheatsheet

```powershell
# Apply a specific migration SQL (use DIRECT_URL for Supabase)
$env:DATABASE_URL="<DIRECT_URL>"; npx prisma db execute --file prisma/migrations/<folder>/migration.sql

# Create + apply a new migration from schema changes
$env:DATABASE_URL="<DIRECT_URL>"; npx prisma migrate dev --name <description>

# Deploy all pending migrations (prod/CI)
$env:DATABASE_URL="<DIRECT_URL>"; npx prisma migrate deploy

# Regenerate Prisma Client after any schema change
npx prisma generate

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Check migration status
npx prisma migrate status

# Reset DB (⚠️ destroys all data!)
$env:DATABASE_URL="<DIRECT_URL>"; npx prisma migrate reset
```
