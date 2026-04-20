# 04 — Security

[← Back to Index](./README.md)

---

## 4.1 Authentication

The POS module is accessible only to authenticated users. Authentication is handled by **NextAuth v4** using a **Credentials provider** (username and password).

**Authentication flow:**

```
1. Staff navigates to /admin (or any /admin/* route)
2. Middleware (src/middleware.ts) detects no valid session
3. Staff is redirected to /sign-in
4. Staff submits username and password
5. NextAuth Credentials provider validates credentials against the User table
6. If valid and user.isActive = true → JWT session token is issued
7. Session token is stored in a browser cookie (httpOnly)
8. All subsequent requests include the session cookie
9. Middleware validates the session on every /admin/* request
```

**Session configuration:**
- Strategy: JWT
- Session data includes: `user.id`, `user.name`, `user.role`
- Session is not persisted to the database (stateless JWT)

---

## 4.2 Authorization — Role-Based Access Control (RBAC)

| Feature / Route | ADMIN | STAFF | Unauthenticated |
|-----------------|-------|-------|-----------------|
| Access POS page (`/admin/pos`) | Yes | Yes | Redirect to /sign-in |
| Create order (`createOrderAction`) | Yes | Yes | Rejected |
| View orders (`GET /api/admin/orders`) | Yes | Yes | Rejected |
| Update order status (`PUT /api/admin/orders/[id]`) | Yes | Yes | Rejected |
| Update payment status | Yes | Yes | Rejected |
| Send Messenger message | Yes | Yes | Rejected |
| Access product management | Yes | Yes | Rejected |
| Access settings | Yes | No | Rejected |
| Access user management | Yes | No | Rejected |

**RBAC enforcement mechanism:**
- `src/middleware.ts` uses `withAuth` from `next-auth/middleware` to protect all `/admin/*` routes
- Individual route handlers read `session.user.role` and reject requests from roles without permission
- Server Actions verify the session via `getServerSession(authOptions)` before executing

---

## 4.3 Middleware Protection

**File:** `src/middleware.ts`

All routes under `/admin/*` require an active session. The middleware redirects unauthenticated requests to the sign-in page. No POS functionality is accessible without authentication.

---

## 4.4 Known Security Vulnerabilities

> The following vulnerabilities were identified during codebase review. They should be remediated before production promotion.

### VULN-001 — Plaintext Password Comparison

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Location** | `src/lib/auth/authOptions.ts` (Credentials provider) |
| **Description** | Passwords appear to be compared without hashing (direct string comparison). This means passwords are likely stored in plaintext or compared against plaintext values in the database. |
| **Risk** | If the database is compromised, all user passwords are exposed in plaintext. |
| **Recommendation** | Use `bcrypt` (or `bcryptjs`) to hash passwords at creation and use `bcrypt.compare()` at login. Migrate existing passwords immediately. |
| **Status** | Open — [PLACEHOLDER: Assign to developer] |

### VULN-002 — No API Rate Limiting

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | All `/api/admin/*` route handlers |
| **Description** | No rate limiting is configured on any API endpoint. The sign-in endpoint is also unprotected against brute force. |
| **Risk** | An attacker can attempt unlimited password guesses or spam order creation endpoints. |
| **Recommendation** | Implement rate limiting using Vercel Edge middleware or an npm package such as `express-rate-limit` / `@upstash/ratelimit`. Apply stricter limits to the authentication endpoint. |
| **Status** | Open — [PLACEHOLDER: Assign to developer] |

### VULN-003 — Messenger API Credentials Exposure

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Location** | Messenger API integration |
| **Description** | The Messenger integration details (API token, page ID) are unclear from the codebase. If these are included in client-side code or environment variables accessible to the browser, they may be exposed. |
| **Risk** | Messenger account takeover or spam if credentials are leaked. |
| **Recommendation** | Ensure all Messenger API calls are made server-side only. Store credentials exclusively in server-side environment variables (never prefixed with `NEXT_PUBLIC_`). |
| **Status** | Open — [PLACEHOLDER: Review Messenger implementation] |

---

## 4.5 Session Token Scope

The JWT session token contains the following user claims:

| Claim | Description |
|-------|-------------|
| `user.id` | Internal user UUID |
| `user.name` | Display name |
| `user.role` | `ADMIN` or `STAFF` |

The token does **not** contain:
- Passwords or password hashes
- Sensitive personal data
- Customer data

---

## 4.6 HTTPS

All production traffic is served over HTTPS enforced by Vercel's edge infrastructure. HTTP requests are automatically redirected to HTTPS. No additional configuration is required.

---

## 4.7 Input Validation

All user-supplied input is validated using **Zod** schemas in the service layer before any database operation is performed. This protects against:
- Type coercion attacks
- Unexpected null/undefined values
- Out-of-range numeric values

Zod validation occurs in `src/lib/services/orderService.ts` and related service files before data reaches the repository layer.

---

## 4.8 SQL Injection

The project uses **Prisma ORM** for all database interactions. Prisma parameterises all queries, which provides inherent protection against SQL injection. Raw SQL is not used anywhere in the POS module.

---

## 4.9 Security Remediation Backlog

| ID | Vulnerability | Severity | Owner | Target Date |
|----|--------------|----------|-------|------------|
| VULN-001 | Plaintext password comparison | Critical | [PLACEHOLDER] | [PLACEHOLDER] |
| VULN-002 | No API rate limiting | Medium | [PLACEHOLDER] | [PLACEHOLDER] |
| VULN-003 | Messenger API credential exposure | Medium | [PLACEHOLDER] | [PLACEHOLDER] |
