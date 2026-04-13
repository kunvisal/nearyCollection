# Workflow: Deploy to Production

Use this checklist before and after every production deployment.
This project deploys via Vercel (app) + Supabase (DB + Storage).

---

## Pre-deploy checklist

### Code
- [ ] Run `npm run build` locally — must pass with zero errors
- [ ] Run `npm run lint` — must pass with zero warnings
- [ ] No `console.log` left in production code
- [ ] No hardcoded secrets or tokens in code (use env vars)

### Database
- [ ] If schema changed: verify migration was created with `npx prisma migrate dev --name "..."`
- [ ] Migration files are committed to git (check `prisma/migrations/`)
- [ ] Never modify existing migration files — create a new one instead
- [ ] Run `npx prisma migrate deploy` against production DB if not using auto-deploy

### Environment variables
Verify these are set in Vercel dashboard:
- [ ] `DATABASE_URL` — Supabase connection pooling URL
- [ ] `DIRECT_URL` — Supabase direct connection URL (for migrations)
- [ ] `NEXTAUTH_SECRET` — random secret for JWT signing
- [ ] `NEXTAUTH_URL` — production domain (e.g. `https://nearycollection.com`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `TELEGRAM_BOT_TOKEN` — Telegram bot token
- [ ] `TELEGRAM_CHAT_ID` — Telegram chat ID for order alerts
- [ ] `MESSENGER_PAGE_ACCESS_TOKEN` — Facebook Page Access Token

---

## Deploy steps

1. Push to `main` branch — Vercel auto-deploys on push
2. Monitor the Vercel build log for errors
3. If DB migration needed and not auto-applied: run `npx prisma migrate deploy` with production `DATABASE_URL`

---

## Post-deploy verification

- [ ] Visit the production URL — shop loads correctly
- [ ] Sign in to admin dashboard — auth works
- [ ] Place a test order through POS — order created, Telegram alert fires
- [ ] Check Supabase dashboard — no new DB errors in logs
- [ ] Verify Supabase Storage is accessible (product images load)

---

## Rollback

Vercel keeps previous deployments. To rollback:
1. Go to Vercel dashboard → Deployments
2. Find the last good deployment
3. Click "Promote to Production"

For DB rollback: there is no automatic migration rollback — coordinate manually if a migration needs to be reversed.

---

## Key URLs

- Vercel dashboard: https://vercel.com/dashboard
- Supabase dashboard: https://supabase.com/dashboard/project/xiwjaghtegazytkeoozo
- Supabase project ref: `xiwjaghtegazytkeoozo`
