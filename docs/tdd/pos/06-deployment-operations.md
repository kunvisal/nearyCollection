# 06 — Deployment & Operations

[← Back to Index](./README.md)

---

## 6.1 Environments

| Environment | URL | Purpose | Notes |
|-------------|-----|---------|-------|
| **Local** | `http://localhost:3000` | Developer machines | Connects to a local or shared Supabase dev project |
| **Staging** | [PLACEHOLDER] | Pre-production testing | [PLACEHOLDER — configure if needed] |
| **Production** | [PLACEHOLDER — Vercel domain] | Live business use | Vercel + Supabase production project |

---

## 6.2 Hosting Architecture

| Component | Provider | Notes |
|-----------|----------|-------|
| Next.js Application | Vercel | Serverless functions + Edge network |
| PostgreSQL Database | Supabase | Managed PostgreSQL with connection pooling |
| File Storage | Supabase Storage | Product images, payment QR codes |
| Domain / HTTPS | Vercel | Automatic TLS certificate via Vercel |

---

## 6.3 Environment Variables

All environment variables must be set in Vercel's project settings for production, and in a `.env.local` file for local development.

> **Security rule:** Never commit `.env.local` or any file containing secrets to version control.

### Required Variables

| Variable | Required In | Description |
|----------|------------|-------------|
| `DATABASE_URL` | Server | PostgreSQL connection string (Supabase pooled connection) |
| `DIRECT_URL` | Server | Direct PostgreSQL URL (used by Prisma Migrate) |
| `NEXTAUTH_URL` | Server | Full URL of the application (e.g. `https://yourdomain.vercel.app`) |
| `NEXTAUTH_SECRET` | Server | Random secret for JWT signing — generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Supabase service role key (for server-side storage operations) |

### Optional / Integration Variables

| Variable | Required In | Description |
|----------|------------|-------------|
| `TELEGRAM_BOT_TOKEN` | Server | Telegram bot token (if not stored in Settings DB) |
| `TELEGRAM_CHAT_ID` | Server | Telegram target chat ID (if not stored in Settings DB) |
| [PLACEHOLDER — Messenger token var] | Server | Messenger API page access token |
| [PLACEHOLDER — Messenger page ID var] | Server | Messenger Facebook page ID |

---

## 6.4 Deployment Process

### Standard Deployment (Vercel)

```bash
# 1. Merge feature branch to main
git checkout main && git merge feature/your-branch

# 2. Push to remote — Vercel auto-deploys on push to main
git push origin main

# 3. Monitor build in Vercel dashboard
# 4. Run smoke tests against production after deploy
```

### Database Migrations

Migrations must be applied **before** the new application code is deployed to avoid schema mismatches.

```bash
# Apply pending migrations to production
npx prisma migrate deploy

# Always regenerate the Prisma client after schema changes
npx prisma generate
```

**Migration rules:**
- Never modify existing migration files
- Always create a named migration: `npx prisma migrate dev --name "describe_the_change"`
- Test migrations on a development database before applying to production

---

## 6.5 Timezone Configuration

The application runs on UTC servers (Vercel, Supabase). Cambodia is **UTC+7**.

All timezone handling is centralised in `src/lib/utils/timezone.ts`.

| Situation | Function to Use |
|-----------|----------------|
| Display any date/time to user | `formatCambodiaDate(date, fmt)` |
| DB query start boundary from user date | `cambodiaDayStartToUtc(dateStr)` |
| DB query end boundary from user date | `cambodiaDayEndToUtc(dateStr)` |
| Group data by day (charts, order codes) | `toCambodiaDateStr(date)` |

> See `docs/timezone-guide.md` for the full timezone rules.

---

## 6.6 Database Backup

| Aspect | Detail |
|--------|--------|
| Provider | Supabase managed backups |
| Frequency | Daily (Supabase Free/Pro plan schedule) |
| Retention | [PLACEHOLDER — check Supabase plan] |
| Manual backup | Available via Supabase dashboard → Project Settings → Backups |
| Point-in-time recovery | [PLACEHOLDER — available on Pro plan only] |

---

## 6.7 Monitoring & Alerting

> **Current state:** No dedicated monitoring or APM (Application Performance Monitoring) tool is configured. This is a known gap — see [08-known-gaps.md](./08-known-gaps.md).

| Aspect | Current Solution | Recommended Improvement |
|--------|-----------------|------------------------|
| Application errors | None (silent failures) | Integrate Sentry or Vercel's error tracking |
| Performance monitoring | None | Integrate Vercel Analytics or Datadog |
| Uptime monitoring | None | Configure Vercel uptime checks or UptimeRobot |
| Database performance | Supabase dashboard (manual) | Enable Supabase performance advisors |
| Log aggregation | Vercel function logs (limited retention) | Forward logs to a persistent store |

---

## 6.8 Logging

| Aspect | Detail |
|--------|--------|
| Current approach | `console.log` / `console.error` (removed from production per coding standards) |
| Log access | Vercel dashboard → Functions → Logs (48-hour retention on free plan) |
| Structured logging | Not configured — [PLACEHOLDER: add if needed] |
| Audit logging | Inventory transactions are logged to the `InventoryTransaction` table |

---

## 6.9 Seed Data

```bash
# Create the initial admin user
node seed-admin.js
```

This script creates the first `ADMIN` user. Run it once after the initial production deployment and after major database resets.

---

## 6.10 Operational Runbook

### How to restart the application
Vercel serverless functions are stateless. A "restart" is equivalent to deploying a new version. Trigger a redeploy from the Vercel dashboard if needed.

### How to check current stock levels
Use Prisma Studio for a quick DB view:
```bash
npx prisma studio
```
Or query directly in the Supabase dashboard SQL editor.

### How to manually apply a migration
```bash
npx prisma migrate deploy
```

### How to roll back a broken deployment
Use the Vercel dashboard → Deployments → select the last good deployment → "Promote to Production".

> **Note:** Rolling back the app does not roll back database migrations. If a migration introduced a breaking schema change, a compensating migration must be written and applied.
