# Contributing to Neary Collection

Development guide for the Neary Collection codebase.
This file covers branching, local setup, making changes, and deploying.

---

## Local Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd nearyCollection

# 2. Install dependencies
npm install
# (postinstall runs `prisma generate` automatically)

# 3. Set up environment variables
cp .env.example .env.local
# Fill in DATABASE_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_SUPABASE_URL, etc.
# See docs/production-environment.md for the full variable list

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed an admin user
node seed-admin.js

# 6. Start the dev server
npm run dev
# → http://localhost:3000
```

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/short-description` | `feat/messenger-import` |
| Bug fix | `fix/short-description` | `fix/order-total-rounding` |
| Migration | `db/short-description` | `db/add-barcode-field` |
| Docs | `docs/short-description` | `docs/ecosystem-reference` |

Always branch from `main`. Keep branches short-lived.

---

## Making Changes

Follow the 3-layer architecture — never skip layers:

```
Route Handler  (src/app/api/admin/)    ← parse request, return response. No logic.
    ↓
Service Layer  (src/lib/services/)     ← business logic, Zod validation
    ↓
Repository     (src/lib/repositories/) ← Prisma queries only
```

**Before writing code:**
- Read the existing code in the affected area
- Check `docs/ECOSYSTEM.md` for field names and API shapes
- Check `src/types/admin.ts` for existing shared types
- Check `src/lib/validators/` for existing Zod schemas

**Skeleton loading:** Every admin page that fetches data must show a skeleton.
See `CLAUDE.md` → Skeleton Loading Animations section for the exact pattern.

**Timezone:** All server-side dates must use helpers from `src/lib/utils/timezone.ts`.
See `docs/timezone-guide.md` for the full rules.

---

## Database Changes

```bash
# After editing prisma/schema.prisma:
npx prisma migrate dev --name "describe_what_changed"
npx prisma generate

# Never modify existing migration files.
# Always create a new migration.
```

Commit migration files alongside the code that requires them.

---

## Before Opening a PR

```bash
npm run build    # Must pass — zero TypeScript errors
npm run lint     # Must pass — zero ESLint errors
```

Checklist:
- [ ] No `any` types introduced
- [ ] No `console.log` left in production code
- [ ] Skeleton added for any new page that fetches data
- [ ] Dates use Cambodia timezone helpers (not raw `toISOString()`)
- [ ] `docs/ECOSYSTEM.md` updated if new API routes or models were added
- [ ] `docs/FEATURES_STATUS.md` updated if a feature was completed
- [ ] Migration committed if schema changed

---

## PR Guidelines

- Keep PRs focused — one feature or fix per PR
- PR title format: `feat: short description` / `fix: short description` / `db: short description`
- Include a brief description of what changed and why

---

## Deployment

Deployment is via Vercel (auto-deploy on push to `main`).
See `.claude/workflows/deploy-prod.md` for the full pre/post deploy checklist.

Database migrations in production:
```bash
npx prisma migrate deploy
# (uses DIRECT_URL env var for migration — not the pooled DATABASE_URL)
```

---

## Project Docs

| File | What it covers |
|------|----------------|
| `CLAUDE.md` | Full project context, architecture rules, coding conventions |
| `TODO.md` | Current in-progress tasks and backlog |
| `docs/ECOSYSTEM.md` | All API shapes, Prisma fields, Zod schemas, enums |
| `docs/FEATURES_STATUS.md` | Which features are done vs. in progress |
| `docs/timezone-guide.md` | Cambodia UTC+7 rules and date helpers |
| `docs/prisma-guide.md` | Prisma usage and migration guide |
| `docs/production-environment.md` | All environment variables |
| `.claude/workflows/build-feature.md` | Step-by-step checklist for building a feature |
| `.claude/workflows/deploy-prod.md` | Pre/post deploy checklist |
| `.claude/workflows/debug-issue.md` | Debugging guide with common root causes |
