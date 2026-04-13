# Workflow: Debug an Issue

Use this checklist when diagnosing a bug or unexpected behaviour in Neary Collection.

---

## 1. Reproduce and scope

- [ ] What is the exact user-visible symptom?
- [ ] Which page / feature is affected? (shop, admin, POS, orders, etc.)
- [ ] Is it always reproducible or intermittent?
- [ ] Does it happen in production only, or also locally?

## 2. Find the data flow

For any admin feature, trace the 3-layer stack:

```
Browser / Component
    ↓
Route Handler  (src/app/api/admin/...)
    ↓
Service Layer  (src/lib/services/...)
    ↓
Repository     (src/lib/repositories/...)
    ↓
PostgreSQL (Supabase)
```

- [ ] Read the route handler for the affected API endpoint
- [ ] Read the service method it calls
- [ ] Read the repository query it calls
- [ ] Check `docs/ECOSYSTEM.md` for the expected request/response shape

## 3. Check the database

Use the Supabase MCP (enabled in `.mcp.json`) to query directly:
```sql
-- Example: check recent orders
SELECT id, order_code, order_status, payment_status, created_at
FROM orders ORDER BY created_at DESC LIMIT 10;

-- Example: check stock for a variant
SELECT id, sku, stock_on_hand, reserved_qty FROM product_variants WHERE id = '...';
```

Or open Supabase Studio: https://supabase.com/dashboard/project/xiwjaghtegazytkeoozo

## 4. Check dates and timezone

Many bugs in this project relate to UTC vs Cambodia time (UTC+7):
- [ ] Is a date query returning wrong results? Check if `cambodiaDayStartToUtc` / `cambodiaDayEndToUtc` are being used for boundary queries
- [ ] Is a date displayed incorrectly? Check if `formatCambodiaDate` is being used (not raw `date-fns` `format`)
- [ ] Is an order code on the wrong date? Check that `toCambodiaDateStr` is used for code generation (see `orderRepository.ts`)
- [ ] Full guide: `docs/timezone-guide.md`

## 5. Check the API response shape

All admin routes should return:
```json
{ "success": true, "data": {}, "error": null }
```
Exception: orders list returns `{ "data": [], "meta": { total, page, limit, totalPages } }`.

- [ ] Is the component reading `response.data` or `response.data.data`? (common mistake)
- [ ] Is the error being swallowed silently? Check the route handler catch block

## 6. Common root causes

| Symptom | Likely cause |
|---------|-------------|
| Order total is wrong | `discount` or `deliveryFee` not converted to `Prisma.Decimal` |
| Stock not restored after cancel | `updateOrderStatus` transaction — check `order.orderStatus !== 'CANCELLED'` guard |
| Skeleton never disappears | `isLoading` state not set to `false` in fetch error path |
| Wrong date in order list | Using raw `new Date().toISOString()` instead of Cambodia helpers |
| Image not loading | Supabase Storage URL — check bucket permissions or URL construction |
| Telegram alert not firing | Bot token / chat ID in settings — test via `POST /api/admin/settings/test-telegram` |
| POS order rejected | Business rule violation — check PP/Province payment + courier constraints in `orderRepository.ts` |

## 7. Fix and verify

- [ ] Fix the root cause — not just the symptom
- [ ] Run `npm run build` after the fix
- [ ] Manually test the exact flow that was broken
- [ ] Check for regressions in adjacent features
- [ ] Update `TODO.md` if the bug was tracked there
