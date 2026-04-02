# Timezone Guide — Neary Collection

This document explains how timezones work in this project and what rules to follow when writing any date-related code.

---

## The Problem in Plain English

Imagine you are in Cambodia at **10:26 AM on April 1**. You place an order.

The server (Vercel) and database (Supabase) run on **UTC time**, which is **7 hours behind** Cambodia. So they record the order timestamp as:

```
Database stores: 2026-04-01 03:26:46   ← UTC time (no timezone label)
Cambodia clock:  2026-04-01 10:26:46   ← what you actually see
```

If code runs on the server and does `new Date().getHours()`, it gets `3` (UTC), not `10` (Cambodia). If it uses `format(date, "HH:mm")` without telling it the timezone, it prints `03:26` — which is wrong for the user.

---

## Cambodia Timezone Facts

| Property | Value |
|----------|-------|
| IANA Name | `Asia/Phnom_Penh` |
| UTC Offset | UTC+7 (always — Cambodia has **no Daylight Saving Time**) |
| Library constant | `CAMBODIA_TZ` from `src/lib/utils/timezone.ts` |

---

## The Two Environments and How They Differ

### Server (Vercel — runs in UTC)

All Next.js code in `src/app/`, `src/lib/`, `src/app/api/`, `src/app/actions/` runs on Vercel in UTC timezone.

- `new Date()` → current time in UTC
- `.getDate()`, `.getHours()` → UTC values
- `format(date, "HH:mm")` from `date-fns` → UTC time

### Client (User's Browser — runs in Cambodia timezone)

Code with `"use client"` runs in the browser. Cambodia users have UTC+7 browsers.

- `new Date()` → current time in Cambodia (UTC+7)
- `.getDate()`, `.getHours()` → Cambodia values
- `format(date, "HH:mm")` from `date-fns` → Cambodia time ✓
- **BUT** `new Date().toISOString()` → always UTC regardless of browser

---

## The Golden Rules

### Rule 1 — Always use `formatCambodiaDate()` for display

Never use bare `format()` from `date-fns` in **server** code. It will show UTC time.

```typescript
// ✗ WRONG on server — shows UTC time (7h behind)
import { format } from "date-fns";
format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")
// → "01 Apr 2026, 03:26"

// ✓ CORRECT everywhere — always shows Cambodia time
import { formatCambodiaDate } from "@/lib/utils/timezone";
formatCambodiaDate(order.createdAt, "dd MMM yyyy, HH:mm")
// → "01 Apr 2026, 10:26"
```

### Rule 2 — Always use `cambodiaDayStartToUtc` / `cambodiaDayEndToUtc` for DB query boundaries

When the user picks "April 1" on a date filter, you must query the DB for all UTC times that fall within Cambodia's April 1 — not UTC's April 1.

```typescript
// ✗ WRONG — misses orders from 00:00–06:59 Cambodia time (UTC March 31)
const dateFrom = new Date(`${dateStr}T00:00:00.000Z`);   // UTC midnight
const dateTo   = new Date(`${dateStr}T23:59:59.999Z`);   // UTC end

// ✓ CORRECT — captures the full Cambodia calendar day
import { cambodiaDayStartToUtc, cambodiaDayEndToUtc } from "@/lib/utils/timezone";
const dateFrom = cambodiaDayStartToUtc(dateStr);  // Cambodia midnight → UTC
const dateTo   = cambodiaDayEndToUtc(dateStr);    // Cambodia 23:59 → UTC
```

Visualised:

```
UTC:      Mar 31 17:00 ──────────────────────── Apr 1 16:59
Cambodia: Apr 1  00:00 ──── "April 1" ───────── Apr 1 23:59
                  ↑                                    ↑
            cambodiaDayStartToUtc("2026-04-01")  cambodiaDayEndToUtc("2026-04-01")
```

### Rule 3 — On the CLIENT, never use `.toISOString()` to get a date string

`.toISOString()` always returns UTC. In Cambodia at midnight, it returns the previous day.

```typescript
// ✗ WRONG — in Cambodia browser at 2026-04-01 00:30 AM:
new Date().toISOString().slice(0, 10)
// → "2026-03-31"  (UTC is still March 31!)

// ✓ CORRECT — uses browser local timezone (Cambodia):
import { format } from "date-fns";   // NOT date-fns-tz, just date-fns
format(new Date(), "yyyy-MM-dd")
// → "2026-04-01"
```

### Rule 4 — Group server-side data by Cambodia date, not UTC date

When building charts or counters that group by day, use `toCambodiaDateStr()`.

```typescript
// ✗ WRONG on server — groups by UTC date
const dateKey = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;

// ✓ CORRECT — groups by Cambodia date
import { toCambodiaDateStr } from "@/lib/utils/timezone";
const dateKey = toCambodiaDateStr(d);
```

---

## All Available Helpers

Import everything from `@/lib/utils/timezone`.

### Display

| Function | Purpose |
|----------|---------|
| `formatCambodiaDate(date, fmt)` | Format any Date/string for display in Cambodia timezone |

### DB Query Boundaries (Server)

| Function | Purpose |
|----------|---------|
| `cambodiaDayStartToUtc(dateStr)` | `"2026-04-01"` → UTC Date at Cambodia midnight |
| `cambodiaDayEndToUtc(dateStr)` | `"2026-04-01"` → UTC Date at Cambodia 23:59:59.999 |

### Date String Conversion

| Function | Purpose |
|----------|---------|
| `toCambodiaDateStr(date)` | UTC Date → `"YYYY-MM-DD"` in Cambodia time |
| `subtractDays(dateStr, n)` | `"2026-04-01"` minus N days → `"YYYY-MM-DD"` |

### Year / Month Extraction (Server)

| Function | Purpose |
|----------|---------|
| `getCambodiaYear(date)` | UTC Date → Cambodia calendar year number |
| `getCambodiaMonth(date)` | UTC Date → Cambodia calendar month (1–12) |
| `cambodiaYearStartToUtc(year)` | Start of Cambodia year → UTC Date |
| `cambodiaYearEndToUtc(year)` | End of Cambodia year → UTC Date |

---

## Common Patterns

### Dashboard date range (server component)

```typescript
import {
  toCambodiaDateStr, subtractDays,
  cambodiaDayStartToUtc, cambodiaDayEndToUtc
} from "@/lib/utils/timezone";

const todayStr = toCambodiaDateStr(new Date()); // "2026-04-02"

// Last 7 Cambodia days
const currentStart = cambodiaDayStartToUtc(subtractDays(todayStr, 6));
const currentEnd   = cambodiaDayEndToUtc(todayStr);
```

### Filter orders by user-selected date (API route)

```typescript
import { cambodiaDayStartToUtc, cambodiaDayEndToUtc } from "@/lib/utils/timezone";

const dateFrom = dateFromStr ? cambodiaDayStartToUtc(dateFromStr) : undefined;
const dateTo   = dateToStr   ? cambodiaDayEndToUtc(dateToStr)     : undefined;
```

### Display order timestamp (any component)

```typescript
import { formatCambodiaDate } from "@/lib/utils/timezone";

<span>{formatCambodiaDate(order.createdAt, "dd MMM yyyy, HH:mm")}</span>
```

### Date picker sends date string to URL (client component)

```typescript
import { format } from "date-fns"; // NOT date-fns-tz

onChange: (selectedDates) => {
  const from = format(selectedDates[0], "yyyy-MM-dd"); // browser local = Cambodia
  const to   = format(selectedDates[1], "yyyy-MM-dd");
  // push to URL...
}
```

### Group by day for charts (server)

```typescript
import { toCambodiaDateStr, getCambodiaMonth } from "@/lib/utils/timezone";

// Daily chart grouping
const dateKey = toCambodiaDateStr(order.createdAt);

// Monthly chart grouping
const month = getCambodiaMonth(order.createdAt); // 1–12
```

### Order code generation (server)

```typescript
import { toCambodiaDateStr } from "@/lib/utils/timezone";

const dateStr = toCambodiaDateStr(new Date()).replace(/-/g, ""); // "20260401"
const orderCode = `NC-${dateStr}-${randomPart}`;
```

---

## Why `date-fns-tz` and not plain `date-fns`?

`date-fns` v4 (already in the project) is great for formatting and arithmetic but always uses **the machine's local timezone**. On Vercel that is UTC. `date-fns-tz` adds IANA timezone support on top of `date-fns` — it is the official companion library and shares the same API style.

```
date-fns      → fast, small, but timezone = server local (UTC on Vercel)
date-fns-tz   → adds IANA timezone support; use for Cambodia-aware code
```

Both are installed. Import `format` from `date-fns` for client-side code (browser = Cambodia). Import `formatCambodiaDate` (which uses `date-fns-tz` internally) for server-side code or whenever you want explicit timezone safety.
