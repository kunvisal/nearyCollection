# Neary Collection — CLAUDE.md

AI context file. Read this at the start of every session to understand the project without re-scanning the codebase.

---

## Project Overview

**Neary Collection** is a bilingual (Khmer / English) e-commerce web app for selling women's clothing in Cambodia.

- Customer-facing shop + Admin dashboard in a single Next.js app
- Target scale: ~100 users/day (startup stage)
- AI-assisted development (vibe coding) — keep code clean and readable
- Designed as a monolith now, but structured for future microservices extraction

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript 5 — strict mode, no `any` |
| Styling | Tailwind CSS v4 + dark mode support |
| State | Zustand (cart, persisted to localStorage) |
| Data fetching | TanStack React Query (client-side) |
| Auth | NextAuth v4 — JWT, Credentials provider |
| Validation | Zod |
| ORM | Prisma 7 with `@prisma/adapter-pg` (connection pooling) |
| Database | PostgreSQL via Supabase |
| Storage | Supabase Storage (product images, payment slips) |
| Notifications | Telegram Bot API (new order alerts) |
| Hosting | Vercel (app) + Supabase (DB + Storage) |
| Charts | ApexCharts + react-apexcharts |
| Icons | lucide-react |
| Date formatting | `date-fns` v4 + `date-fns-tz` (Cambodia UTC+7 timezone) |

---

## Dev Commands

```bash
npm run dev        # Start dev server on port 3000
npm run build      # Production build
npm start          # Run production build
npm run lint       # ESLint check

# Prisma
npx prisma generate                        # Regenerate client after schema changes
npx prisma migrate dev --name "description" # Create + apply new migration
npx prisma migrate deploy                  # Apply migrations in production
npx prisma studio                          # Open DB GUI

# Seed
node seed-admin.js  # Create initial admin user
```

---

## Project Structure

```
src/
├── app/
│   ├── (shop)/          # Customer-facing pages (home, category, product, checkout, tracking)
│   ├── admin/           # Admin dashboard (products, orders, inventory, POS, delivery, settings)
│   ├── (full-width-pages)/(auth)/  # Sign in / Sign up
│   ├── api/admin/       # Route Handlers (thin controllers only)
│   ├── actions/         # Server Actions (orderActions, paymentActions, shopActions, trackingActions)
│   └── print/           # Print layout
│
├── components/
│   ├── Shop/            # Customer UI (Header, Hero, CategoryGrid, ProductRow, CartDrawer, BottomNav)
│   ├── ecommerce/       # Admin dashboard components (metrics, charts, alerts, recent orders)
│   ├── common/          # Shared UI (breadcrumbs, theme toggle)
│   ├── form/            # Form elements
│   └── ui/              # UI primitives
│
├── lib/
│   ├── repositories/    # Database access layer (Prisma queries only)
│   ├── services/        # Business logic layer
│   ├── validators/      # Zod schemas
│   ├── store/           # Zustand stores (cartStore)
│   ├── auth/            # NextAuth config (authOptions)
│   ├── utils/           # Shared utilities (apiResponse helpers)
│   ├── prisma.ts        # Prisma client singleton
│   └── supabaseClient.ts
│
├── context/             # React contexts (Sidebar, Theme, Toast)
├── hooks/               # Custom hooks (useModal, useGoBack)
├── layout/              # Admin layout components (AppSidebar, AppHeader)
├── icons/               # SVG icon components
└── middleware.ts         # NextAuth route protection

prisma/
├── schema.prisma
└── migrations/
```

---

## Architecture Rules

The project uses a strict 3-layer architecture. Never skip layers.

```
HTTP Request
    ↓
Route Handler  (src/app/api/)     — parse request, call service, return response. NO business logic.
    ↓
Service Layer  (src/lib/services/) — business logic, validation, orchestration, transactions
    ↓
Repository     (src/lib/repositories/) — Prisma queries ONLY. No logic, no validation.
    ↓
PostgreSQL
```

**Route Handler rules:**
- Parse and forward input to the service
- Catch errors and return standard JSON response
- Check session/auth before calling service
- No database calls directly

**Service rules:**
- Validate input with Zod schemas from `lib/validators/`
- Orchestrate one or more repositories
- Handle transactions when multiple DB writes are needed
- Throw errors — route handler catches them

**Repository rules:**
- Only Prisma queries (`findMany`, `create`, `update`, `delete`, etc.)
- Use `include` and `select` to avoid N+1
- No business logic, no validation

---

## API Conventions

All route handlers return this shape:

```json
// Success
{ "success": true, "data": {}, "error": null }

// Error
{ "success": false, "data": null, "error": "Error message here" }
```

Use the helper in `src/lib/utils/apiResponse.ts`.

- All admin routes require a valid NextAuth session
- Input validation via Zod in the service layer
- HTTP verbs: GET (read), POST (create), PUT (update), DELETE (delete)
- Base path: `/api/admin/[resource]`

---

## Database Rules

- Use **Prisma only** — never write raw SQL unless absolutely necessary
- Always run `prisma generate` after schema changes
- Always create a named migration: `prisma migrate dev --name "what_changed"`
- Never modify existing migration files
- Add indexes for: product name, categoryId, customerId, createdAt
- Design schema to support future microservices split (avoid tight cross-domain coupling)

**Key enums:**

| Enum | Values |
|------|--------|
| Role | ADMIN, STAFF |
| OrderStatus | NEW, PROCESSING, PACKED, SHIPPED, DELIVERED, CANCELLED |
| PaymentStatus | UNPAID, PENDING_VERIFICATION, PAID, REJECTED |
| PaymentMethod | COD, ABA, WING |
| DeliveryZone | PP (Phnom Penh), PROVINCE |
| DeliveryService | JALAT, VET, JT |
| TransactionType | IN, OUT, ADJUST, RESERVE, RELEASE, DEDUCT |
| DefaultLanguage | KM, EN |

**Bilingual fields:** Always provide both `nameKm` + `nameEn`, `descriptionKm` + `descriptionEn` for content fields.

---

## Naming & Code Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ProductDetail.tsx` |
| Functions | camelCase | `getProductById()` |
| Variables | camelCase | `const isActive` |
| Constants | UPPER_SNAKE_CASE | `MAX_ITEMS_PER_PAGE` |
| Folders | kebab-case (except components) | `user-profile/` |
| DB tables | snake_case plural | `product_variants` |
| Prisma models | PascalCase | `ProductVariant` |
| FK fields | `[model]Id` | `productId`, `customerId` |
| Timestamps | `createdAt`, `updatedAt` | — |
| Zod schemas | `create[Entity]Schema` | `createProductSchema` |
| Zod types | `Create[Entity]Input` | `CreateProductInput` |

**File conventions:**
- Page: `page.tsx`
- Layout: `layout.tsx`
- Client components: top of file `"use client"`
- Server components: no directive (default)
- Services: `[entity]Service.ts` with static methods
- Repositories: `[entity]Repository.ts` with static methods
- Validators: `[entity]Validators.ts`

---

## Coding Rules

- No `any` — define types in components or (preferred) in `src/types/` when shared
- No `console.log` in production code
- No business logic in Route Handlers
- No database calls outside of repositories
- No over-engineering — this is startup scale, keep it simple
- Validate all external input (forms, API requests) with Zod
- Use `include`/`select` in Prisma queries — never fetch unnecessary fields
- Use pagination for all list endpoints (products, orders)
- Prefer Server Components; use `"use client"` only when interactivity is needed

---

## Constraints — Do NOT

- Do NOT add Kubernetes, Docker Compose, or microservices infrastructure yet
- Do NOT introduce new global state management libraries (Zustand is already chosen)
- Do NOT write raw SQL unless Prisma cannot do it
- Do NOT add unnecessary npm packages — check existing ones first
- Do NOT add error handling for impossible scenarios
- Do NOT add speculative abstractions — solve the actual problem
- Do NOT skip the service layer to call repositories directly from Route Handlers

---

## Testing

No test framework is configured yet. Do NOT scaffold tests or suggest a testing setup unless the user explicitly asks. When a framework is chosen, it will be added here.

---

## Timezone Rules (Cambodia — UTC+7)

The server (Vercel) and database (Supabase) run in **UTC**. Cambodia is **UTC+7**.
All date helpers live in `src/lib/utils/timezone.ts`. See `docs/timezone-guide.md` for full explanation.

**The four rules to always follow:**

| Situation | Use |
|-----------|-----|
| Display any date/time to user | `formatCambodiaDate(date, fmt)` from `@/lib/utils/timezone` |
| DB query start boundary from a user-selected date | `cambodiaDayStartToUtc(dateStr)` |
| DB query end boundary from a user-selected date | `cambodiaDayEndToUtc(dateStr)` |
| Group server-side data by day (charts, order codes) | `toCambodiaDateStr(date)` |

**Never do on the server:**

- `new Date().toISOString().slice(0,10)` → gives UTC date, not Cambodia date
- `format(date, "HH:mm")` from bare `date-fns` → shows UTC time (-7h)
- `new Date("YYYY-MM-DDT00:00:00.000Z")` as a query boundary → wrong (UTC midnight ≠ Cambodia midnight)

**On the client (browser = Cambodia):**

- `format(new Date(), "yyyy-MM-dd")` from `date-fns` is OK for getting today's date string
- Still use `formatCambodiaDate()` for displaying timestamps fetched from the API

---

## Docs Reference

Detailed documentation lives in `/docs/`:

| File | Contents |
|------|---------|
| `docs/ECOSYSTEM.md` | Canonical reference: all API shapes, Prisma fields, Zod schemas, enums, Server Actions |
| `docs/claude-code-guide.md` | How the Claude Code setup works — workflows, file roles, real-use-case examples |
| `docs/standards/coding-style.md` | Formatting, linting, naming conventions |
| `docs/standards/project-structure.md` | Folder structure standards |
| `docs/FEATURES_STATUS.md` | Which features are done vs. in-progress |
| `docs/prisma-guide.md` | Prisma usage and migration guide |
| `docs/workflows/development.md` | Development workflow |
| `docs/telegram-bot-setup.md` | Telegram notification integration |
| `docs/production-environment.md` | Production environment setup |
| `docs/timezone-guide.md` | Cambodia timezone (UTC+7) rules and helpers |

---

## Skeleton Loading Animations

Every admin page that fetches data **must** show a skeleton while loading. The system is already wired up — you only need to follow the pattern.

### Infrastructure (already exists — do not recreate)

| File | Purpose |
|------|---------|
| `src/styles/skeleton.css` | Single `.skeleton-box` class + `@keyframes shimmer` — imported once in admin layout |
| `src/app/globals.css` | `--color-background-secondary` / `--color-background-tertiary` semantic tokens (light + dark) |
| `src/app/admin/layout.tsx` | `import "@/styles/skeleton.css"` — covers the entire admin app |
| `src/components/skeletons/primitives.tsx` | `SkeletonBox`, `SkeletonText`, `SkeletonAvatar` — use these, never raw divs |

### Existing skeleton components

`src/components/skeletons/` already contains:
`DashboardSkeleton`, `OrdersSkeleton`, `OrderDetailSkeleton`, `ProductsSkeleton`, `ProductDetailSkeleton`, `CategoriesSkeleton`, `InventorySkeleton`, `DeliverySkeleton`, `SettingsSkeleton`

### When to add a skeleton for a NEW page or section

**Decision rule — Data fetch > 200ms or unknown duration → Skeleton. Button action / form submit → Spinner. Instant local state change → nothing.**

#### New server component page

```tsx
// src/app/admin/new-feature/page.tsx
import { Suspense } from "react";
import { NewFeatureSkeleton } from "@/components/skeletons/NewFeatureSkeleton";

export default function NewFeaturePage() {
  return (
    <Suspense fallback={<NewFeatureSkeleton />}>
      <NewFeatureContent />
    </Suspense>
  );
}

async function NewFeatureContent() {
  const data = await SomeService.getData(); // data fetch here, inside the child
  return ( /* real JSX */ );
}
```

#### New client component page

```tsx
// At the top of the component render, before the main return:
if (isLoading) return <NewFeatureSkeleton />;
```

### How to build a new skeleton component

1. **Read the real page first** — understand every grid, card, and spacing class before writing a single skeleton line.
2. **File location:** `src/components/skeletons/NewFeatureSkeleton.tsx`
3. **Name:** `<PageNameSkeleton>` matching the page name exactly.
4. **No `"use client"`** — skeletons are static, they need no interactivity.
5. **Mirror the layout exactly:** same grid columns, same card sizes, same spacing. Replace text → `SkeletonBox h-4`, images → `SkeletonBox aspect-square`, charts → bar groups of `SkeletonBox`.
6. **Wrap each card** with the same border/bg classes as the real card:

   ```text
   rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]
   ```

7. **No hardcoded colors** — use only `skeleton-box` className; never set `background`, `backgroundColor`, or hex colors directly.
8. **No props** — skeletons are static, zero props required.

### Color / dark mode rules

- Use `.skeleton-box` class (from `skeleton.css`) on every placeholder element.
- The shimmer automatically adapts to dark mode via `--color-background-secondary` / `--color-background-tertiary`.
- Never use `opacity` hacks, hardcoded grays, or the old `Skeleton.module.css` shimmer for admin components.

### What NOT to do

- Do NOT redefine `@keyframes shimmer` in a new file — it already exists in `skeleton.css`.
- Do NOT use `<div className="animate-pulse bg-gray-200">` — use `skeleton-box` instead.
- Do NOT create a skeleton for button actions or instant state changes.
- Do NOT use `Skeleton.module.css` for admin pages — that file is legacy, used only by shop components.

---

## Suggested Improvements (Pending)

All previously noted gaps have been resolved. See `TODO.md` for current backlog.

**Completed:**
- `src/types/admin.ts` created — shared TypeScript interfaces live here
- Intent comments added to all transaction blocks in `orderRepository.ts`
- `Skeleton.module.css` deleted — shop skeletons now use `.skeleton-box`
