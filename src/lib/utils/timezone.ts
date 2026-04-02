/**
 * timezone.ts — Cambodia Timezone Utilities
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The Neary Collection server runs on Vercel (UTC timezone).
 * The PostgreSQL database on Supabase also stores timestamps in UTC
 * (using `timestamp without time zone` — the values are UTC, just unlabelled).
 * Cambodia is UTC+7 (Asia/Phnom_Penh), so there is a 7-hour gap between
 * what the server "thinks" is midnight and what a Cambodia user experiences
 * as midnight.
 *
 * RULE OF THUMB
 * -------------
 *  Server / DB  →  always UTC
 *  User display →  always Cambodia (UTC+7)
 *
 * All helpers in this file bridge that gap. Import from here instead of
 * writing raw `new Date()` / `setHours()` / `format()` combinations.
 *
 * WHAT IS A "CAMBODIA DAY"?
 * -------------------------
 * When a Cambodia user says "April 1", they mean:
 *   Start: 2026-04-01 00:00:00 +07:00  =  2026-03-31 17:00:00 UTC
 *   End:   2026-04-01 23:59:59 +07:00  =  2026-04-01 16:59:59 UTC
 *
 * DB queries must use these UTC boundaries — NOT midnight UTC — to capture
 * all orders that the user considers "April 1".
 */

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

// ─── Constant ────────────────────────────────────────────────────────────────

/** IANA timezone identifier for Cambodia (UTC+7, no DST). */
export const CAMBODIA_TZ = "Asia/Phnom_Penh";

// ─── Display Helpers (UTC Date → human-readable string) ──────────────────────

/**
 * Format a UTC Date for display in Cambodia timezone.
 *
 * Use this everywhere instead of bare `format()` from date-fns,
 * because `format()` uses the SERVER's local timezone (UTC on Vercel)
 * and will show times 7 hours behind.
 *
 * @param date  - A JS Date (UTC) or ISO string
 * @param fmt   - date-fns format string, e.g. "dd MMM yyyy, HH:mm"
 *
 * @example
 *   // DB stores: 2026-04-01 03:26:46 UTC  (= 10:26 AM Cambodia)
 *   formatCambodiaDate(order.createdAt, "dd MMM yyyy, HH:mm")
 *   // → "01 Apr 2026, 10:26"   ✓
 *
 *   // WITHOUT this helper on Vercel:
 *   format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")
 *   // → "01 Apr 2026, 03:26"   ✗ (shows UTC, 7h behind Cambodia)
 */
export function formatCambodiaDate(
  date: Date | string,
  fmt: string
): string {
  return formatInTimeZone(
    typeof date === "string" ? new Date(date) : date,
    CAMBODIA_TZ,
    fmt
  );
}

// ─── Date-String Helpers (YYYY-MM-DD ↔ UTC Date) ─────────────────────────────

/**
 * Convert a Cambodia calendar date string to the UTC Date at the START
 * of that day (midnight Cambodia time).
 *
 * Use this when building Prisma `gte` (≥) query boundaries from a date
 * selected by the user.
 *
 * @example
 *   cambodiaDayStartToUtc("2026-04-01")
 *   // → new Date("2026-03-31T17:00:00.000Z")
 *   //   (midnight Cambodia = 17:00 previous day UTC)
 */
export function cambodiaDayStartToUtc(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00.000`, CAMBODIA_TZ);
}

/**
 * Convert a Cambodia calendar date string to the UTC Date at the END
 * of that day (23:59:59.999 Cambodia time).
 *
 * Use this when building Prisma `lte` (≤) query boundaries from a date
 * selected by the user.
 *
 * @example
 *   cambodiaDayEndToUtc("2026-04-01")
 *   // → new Date("2026-04-01T16:59:59.999Z")
 *   //   (23:59 Cambodia = 16:59 UTC same day)
 */
export function cambodiaDayEndToUtc(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T23:59:59.999`, CAMBODIA_TZ);
}

/**
 * Convert a UTC Date to a "YYYY-MM-DD" string representing the Cambodia
 * calendar date at that moment.
 *
 * Use this for grouping data by day (charts, order codes, etc.).
 *
 * @example
 *   // DB order at 03:26 UTC = 10:26 AM Cambodia
 *   toCambodiaDateStr(new Date("2026-04-01T03:26:46Z"))
 *   // → "2026-04-01"   ✓  (still April 1 in Cambodia)
 *
 *   // PROBLEM without this: at 2026-04-01T00:30:00 UTC (= 07:30 Cambodia),
 *   // date.getDate() on a UTC server returns 1, which happens to be correct —
 *   // but at 2026-03-31T23:30:00 UTC (= 06:30 next day Cambodia) it returns
 *   // 31 (March 31) instead of 1 (April 1). Off by one day.
 */
export function toCambodiaDateStr(date: Date): string {
  return formatInTimeZone(date, CAMBODIA_TZ, "yyyy-MM-dd");
}

// ─── Arithmetic Helper ────────────────────────────────────────────────────────

/**
 * Subtract N calendar days from a "YYYY-MM-DD" string and return the
 * resulting "YYYY-MM-DD" string.
 *
 * Safe to use with Cambodia date strings — no timezone conversion needed
 * because we operate on calendar dates only.
 *
 * @example
 *   subtractDays("2026-04-01", 6)  // → "2026-03-26"
 *   subtractDays("2026-03-01", 1)  // → "2026-02-28"
 */
export function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Use UTC constructor to avoid DST edge cases
  const result = new Date(Date.UTC(y, m - 1, d - days));
  return (
    result.getUTCFullYear() +
    "-" +
    String(result.getUTCMonth() + 1).padStart(2, "0") +
    "-" +
    String(result.getUTCDate()).padStart(2, "0")
  );
}

// ─── Year Helpers ─────────────────────────────────────────────────────────────

/**
 * Get the Cambodia calendar year from a UTC Date.
 *
 * @example
 *   // At 2025-12-31T18:00:00Z = 2026-01-01 01:00 Cambodia
 *   getCambodiaYear(new Date("2025-12-31T18:00:00Z"))  // → 2026
 */
export function getCambodiaYear(date: Date): number {
  return Number(formatInTimeZone(date, CAMBODIA_TZ, "yyyy"));
}

/**
 * Get the Cambodia calendar month (1–12) from a UTC Date.
 *
 * @example
 *   getCambodiaMonth(new Date("2026-01-31T17:30:00Z"))
 *   // → 2  (Feb 1 in Cambodia at 00:30 AM)
 */
export function getCambodiaMonth(date: Date): number {
  return Number(formatInTimeZone(date, CAMBODIA_TZ, "M"));
}

/**
 * UTC Date at the very start of a Cambodia calendar year.
 *
 * @example
 *   cambodiaYearStartToUtc(2026)
 *   // → new Date("2025-12-31T17:00:00.000Z")  (Jan 1 00:00 Cambodia)
 */
export function cambodiaYearStartToUtc(year: number): Date {
  return fromZonedTime(`${year}-01-01T00:00:00.000`, CAMBODIA_TZ);
}

/**
 * UTC Date at the very end of a Cambodia calendar year.
 *
 * @example
 *   cambodiaYearEndToUtc(2026)
 *   // → new Date("2026-12-31T16:59:59.999Z")  (Dec 31 23:59 Cambodia)
 */
export function cambodiaYearEndToUtc(year: number): Date {
  return fromZonedTime(`${year}-12-31T23:59:59.999`, CAMBODIA_TZ);
}
