# 08 — Known Gaps & Technical Debt

[← Back to Index](./README.md)

---

## Overview

This section documents known limitations, missing features, and technical debt identified during codebase review. Items are classified by type and severity.

Items in this list should be tracked in the project backlog. When an item is resolved, remove it from this list and add an entry to the [Change Log in README.md](./README.md).

---

## Security Gaps

> See [04-security.md](./04-security.md) for full vulnerability details.

| ID | Issue | Severity | Status |
|----|-------|----------|--------|
| GAP-SEC-001 | Passwords compared as plaintext — no bcrypt hashing | Critical | Open |
| GAP-SEC-002 | No rate limiting on any API endpoint | Medium | Open |
| GAP-SEC-003 | Messenger API credential handling unclear — possible client-side exposure | Medium | Open |

---

## Functional Gaps

| ID | Issue | Impact | Notes |
|----|-------|--------|-------|
| GAP-FUNC-001 | No item-level discount | Medium | Only order-level discount exists. Item-level `discountSnapshot` field exists in `OrderItem` but is populated from the variant's preset discount, not a per-item POS override. |
| GAP-FUNC-002 | No return / refund flow | Medium | When an order is cancelled, stock is restored, but there is no formal refund record, credit note, or return workflow. |
| GAP-FUNC-003 | No payment slip upload in POS | Low | The `PaymentSlip` model exists in the schema but is not used in the POS flow. Province/ABA orders are auto-marked as PAID with no attached evidence. |
| GAP-FUNC-004 | No barcode scanner support | Low | The `barcode` field exists on `ProductVariant` but no barcode scanning input is implemented in the POS UI. |
| GAP-FUNC-005 | No POS-specific order type flag | Low | POS orders are distinguished only by their initial status (`PROCESSING`). A dedicated `source` or `type` field (e.g. `POS` vs `ONLINE`) would make filtering and reporting more explicit. |

---

## Technical Debt

| ID | Issue | Severity | Notes |
|----|-------|----------|-------|
| GAP-TECH-001 | `reservedQty` field never populated | Low | `ProductVariant.reservedQty` exists to support cart reservation (preventing overselling during checkout). It is always 0 in the POS flow. Implementing it would add a stronger oversell protection guarantee. |
| GAP-TECH-002 | No structured logging or APM | Medium | All logging is `console.log` / `console.error`. There is no error aggregation, alerting, or performance monitoring. Consider Sentry for error tracking and Vercel Analytics for performance. |
| GAP-TECH-003 | No automated test suite | Medium | No unit, integration, or end-to-end tests exist. All quality assurance is manual. Any future refactoring carries risk without a regression safety net. |
| GAP-TECH-004 | No API rate limiting | Medium | Covered under security gaps but also a stability concern — uncontrolled traffic could exhaust Supabase connection limits. |
| GAP-TECH-005 | Messenger API integration partially unclear | Low | The implementation of the actual Messenger API calls was not fully visible during codebase review. Confirm whether the Messenger integration uses a real API or relies on a mock / incomplete implementation. |
| GAP-TECH-006 | No staging environment | Low | There is no staging/pre-production environment. All testing is done locally before pushing directly to production. |
| GAP-TECH-007 | Vercel function log retention is short | Low | Vercel's free plan retains function logs for 48 hours only. Production incidents that are not caught quickly may leave no trace. |

---

## Recommended Prioritisation

| Priority | Items |
|----------|-------|
| **Immediate** (before next release) | GAP-SEC-001 (bcrypt), GAP-SEC-002 (rate limiting) |
| **Short-term** (next sprint) | GAP-SEC-003, GAP-TECH-002 (structured logging), GAP-TECH-003 (test suite planning) |
| **Medium-term** | GAP-FUNC-001 (item-level discount), GAP-FUNC-002 (refund flow), GAP-TECH-001 (reservedQty) |
| **Low priority / backlog** | GAP-FUNC-003, GAP-FUNC-004, GAP-FUNC-005, GAP-TECH-005, GAP-TECH-006, GAP-TECH-007 |
