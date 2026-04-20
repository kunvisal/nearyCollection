# 05 — Integrations

[← Back to Index](./README.md)

---

## Overview

The POS module integrates with four external or internal systems. This section describes the purpose, trigger, configuration, and error handling for each integration.

---

## 5.1 Telegram Bot API

### Purpose
Notify the business owner automatically every time a POS order is successfully created.

### Trigger
Fired immediately after `OrderRepository.createOrderTransaction()` completes successfully inside `OrderService`.

### Implementation

**File:** `src/lib/services/telegramService.ts`

The notification is **fire-and-forget** — any failure in Telegram delivery does not affect order creation or the response returned to the staff member.

### Message Content

The Telegram message includes:
- Order code (e.g. `NC-20260420-1234`)
- Customer name and phone number
- Order total (USD)
- Payment method
- Delivery zone
- Direct link to the order detail page in the admin dashboard

### Configuration

Telegram credentials are stored in the **Settings** database table (not environment variables), allowing the business owner to update them without a redeployment.

| Setting Key | Description |
|-------------|-------------|
| `telegramBotToken` | Bot token from @BotFather |
| `telegramChatId` | Target chat ID (owner's personal chat or a group) |

### Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Telegram API unreachable | Error is caught silently; order creation proceeds |
| Invalid bot token | Error is caught silently; order creation proceeds |
| Missing credentials | Notification is skipped; order creation proceeds |

---

## 5.2 Messenger API

### Purpose
Allow staff to:
1. Import customer details (name, phone, address) from Messenger conversations into the POS checkout form
2. Send the order summary and payment QR codes to the customer via Messenger after order creation

### Integration Points

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/messenger/conversations` | `GET` | Fetch recent Messenger conversations |
| `/api/admin/messenger/conversations/[id]/messages` | `GET` | Load messages from a specific conversation |
| `/api/admin/messenger/send` | `POST` | Send a text message to a conversation |
| `/api/admin/messenger/send-image` | `POST` | Send a payment QR image to a conversation |

### Data Extraction Logic

When a conversation is selected and messages are loaded, the client-side component applies the following extraction logic:

- **Phone number detection:** Regular expression match against message text
- **Address extraction:** Remaining text after removing the detected phone number

These values are presented to staff for individual or bulk field-filling.

### QR Code Images

Two QR code images are stored in **Supabase Storage**:
- `riel.jpg` — Cambodian Riel (KHR) payment QR
- `usd.jpg` — US Dollar (USD) payment QR

Staff can choose to send both, KHR only, or USD only.

### Configuration

| Setting / Env Variable | Description |
|------------------------|-------------|
| [PLACEHOLDER — Messenger Page Token] | Facebook/Messenger page access token |
| [PLACEHOLDER — Messenger Page ID] | Facebook page ID |

> **Note:** The full Messenger API implementation details were not definitively confirmed during codebase review. Verify that all API calls are server-side only and credentials are stored securely. See [04-security.md — VULN-003](./04-security.md).

### Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Messenger API unavailable | Error displayed to staff; order is unaffected |
| Conversation not found | Empty conversation list shown |
| Message send failure | Error shown inline; staff can retry manually |

---

## 5.3 Supabase Storage

### Purpose
Host product images and payment QR code images. Images are referenced by URL in the database and served directly to the browser.

### Usage in POS

- Product images are displayed on product cards and in the variant selection modal
- Payment QR images (`riel.jpg`, `usd.jpg`) are sent to customers via the Messenger integration

### Implementation

**File:** `src/lib/supabaseClient.ts`

The Supabase client is initialised once and used throughout the application for storage operations.

### Configuration

| Environment Variable | Description |
|---------------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public read) key |

### Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Image URL unreachable | Browser displays broken image placeholder |
| Storage bucket permission error | Upload operations fail with an error; read operations may still work depending on bucket policy |

---

## 5.4 Settings API (Internal)

### Purpose
Provide runtime-configurable system settings to the POS module without requiring a redeployment.

### Settings Used by POS

| Setting | Used For |
|---------|----------|
| `deliveryFeePP` | Default delivery fee for Phnom Penh zone (USD) |
| `deliveryFeeProvince` | Default delivery fee for Province zone (USD) |
| `exchangeRateUsdToKhr` | USD to KHR conversion rate shown on receipts |
| `telegramBotToken` | Telegram integration (see Section 5.1) |
| `telegramChatId` | Telegram integration (see Section 5.1) |

### Endpoint

```
GET /api/admin/settings
Authorization: NextAuth session required (ADMIN role)
```

### When It Is Called

- On POS page load — to fetch delivery fees for the checkout form
- On receipt render — to fetch the exchange rate for KHR display

### Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Settings not configured | Delivery fees default to zero; exchange rate defaults to a fallback constant |
| Settings API failure | POS checkout form shows zero delivery fee; staff must enter manually |
