# 01 — Business Overview

[← Back to Index](./README.md)

---

## 1.1 System Name

**Neary Collection POS (Point of Sale)**
Internal module of the Neary Collection business application.

---

## 1.2 Business Problem

Prior to this system, in-store sales at Neary Collection were managed manually using paper-based records or informal messaging. This approach introduced the following operational problems:

| Problem | Business Impact |
|---------|----------------|
| Stock levels were not updated in real time | Overselling, customer disappointment, manual reconciliation effort |
| Customer records were maintained informally | No purchase history, no repeat-customer identification |
| Order confirmation was verbal or via chat | No structured receipt, no audit trail |
| Staff relied on Messenger to collect customer details | Error-prone, slow, required copy-paste between apps |
| No automatic notification to the owner upon sale | Owner unaware of sales activity unless manually informed |

---

## 1.3 Business Goals

This POS module addresses the above problems by providing:

1. **Faster in-store checkout** — staff can search products, select variants, build a cart, and confirm an order in under two minutes.
2. **Real-time inventory deduction** — stock levels are decremented atomically at the point of order creation, eliminating overselling.
3. **Automatic customer record management** — customers are looked up by phone number and created if they do not exist, building a persistent purchase history.
4. **Structured digital receipt** — every order receives a unique code (`NC-YYYYMMDD-XXXX`) and a printable receipt.
5. **Messenger-assisted order intake** — staff can import customer name, phone, and delivery address directly from Messenger conversations, eliminating manual re-entry.
6. **Automatic owner notification** — every confirmed POS order triggers a Telegram notification to the business owner.

---

## 1.4 Stakeholders

| Role | Name / Team | Interest |
|------|-------------|----------|
| Business Owner | [PLACEHOLDER] | Wants real-time visibility of orders and stock |
| Store Staff | Operations Team | Daily users of the POS interface |
| Software Developer | Engineering Team | Builds and maintains the system |
| QA Engineer | [PLACEHOLDER] | Validates system correctness before release |
| Infrastructure / DevOps | [PLACEHOLDER] | Manages hosting, deployments, and uptime |
| Architecture Team | [PLACEHOLDER] | Reviews technical decisions and system design |
| Support Team | [PLACEHOLDER] | Handles operational issues and user queries |

---

## 1.5 System Scope

The following capabilities are **in scope** for this document:

| # | Capability |
|---|-----------|
| 1 | Product browsing, search, and category filtering |
| 2 | Variant selection (size, color) with stock validation |
| 3 | Cart management (add, remove, adjust quantity) |
| 4 | Customer lookup by phone number and auto-creation |
| 5 | Checkout form (delivery zone, payment method, delivery service, address, note, discount) |
| 6 | Order creation with atomic stock deduction and inventory audit logging |
| 7 | Order code generation in Cambodia local time (UTC+7) |
| 8 | Digital receipt display and print layout |
| 9 | Messenger conversation import (auto-fill customer name, phone, address) |
| 10 | Sending order summary and payment QR codes to customer via Messenger |
| 11 | Telegram notification to owner on order creation |
| 12 | Role-based access control (ADMIN and STAFF roles) |

---

## 1.6 Out of Scope

The following items are explicitly **outside the scope** of this document and this system version:

| Item | Reason |
|------|--------|
| Online shop checkout flow | Separate customer-facing flow with different payment and order logic |
| Returns and refunds | Not yet implemented; tracked as a known gap |
| Payment gateway integration | Payments are COD, ABA, or WING — no online payment gateway |
| Multi-branch / multi-location POS | Single-store system at this stage |
| Barcode scanner hardware integration | Not implemented; tracked as a future enhancement |
| Automated testing suite | No test framework configured; manual QA only |
| Loyalty / rewards programs | Not planned at current scale |

---

## 1.7 System Context Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Neary Collection App                   │
│                  (Next.js — Vercel)                      │
│                                                         │
│  ┌─────────────────────┐   ┌──────────────────────┐     │
│  │   Admin POS Module  │   │  Online Shop Module  │     │
│  │  (This document)    │   │  (Out of scope here) │     │
│  └──────────┬──────────┘   └──────────────────────┘     │
│             │                                           │
│             ▼                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Service / Repository Layer              │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
   ┌────────────┐  ┌─────────────┐  ┌──────────────┐
   │ PostgreSQL │  │  Supabase   │  │  Telegram    │
   │ (Supabase) │  │  Storage    │  │  Bot API     │
   └────────────┘  └─────────────┘  └──────────────┘
                                           ▲
                                    ┌──────────────┐
                                    │  Messenger   │
                                    │  API         │
                                    └──────────────┘
```

---

## 1.8 Key Business Rules Summary

| Rule | Description |
|------|-------------|
| PP Zone | Payment method is COD only; delivery service is JALAT only |
| Province Zone | Payment method must be ABA or WING; delivery service must be VET or JT |
| Province payment auto-confirmed | Orders from Province zone with ABA/WING are automatically marked as PAID |
| POS orders auto-confirmed | All POS orders start with status `PROCESSING` (not `NEW` like online orders) |
| Stock enforced at creation | If stock is insufficient, the order transaction is rejected |
| Customer deduplication | Customers are matched by phone number; a new record is created only if no match exists |
