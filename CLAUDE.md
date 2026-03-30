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

## Docs Reference

Detailed documentation lives in `/docs/`:

| File | Contents |
|------|---------|
| `docs/project-context.md` | Architecture philosophy and AI agent instructions |
| `docs/standards/coding-style.md` | Formatting, linting, naming conventions |
| `docs/standards/project-structure.md` | Folder structure standards |
| `docs/FEATURES_STATUS.md` | Which features are done vs. in-progress |
| `docs/prisma-guide.md` | Prisma usage and migration guide |
| `docs/workflows/development.md` | Development workflow |
| `docs/telegram-bot-setup.md` | Telegram notification integration |
| `docs/production-environment.md` | Production environment setup |

---

## Suggested Improvements (Pending)

These are known gaps that would improve AI assistance and code quality:

1. **Create `src/types/`** — the coding style guide specifies shared interfaces go here, but the folder does not exist yet. Moving shared TypeScript interfaces there avoids duplication.
2. **Add intent comments on complex transaction flows** — `orderRepository.ts` contains long transactional code. A short comment per transaction block explaining the business intent helps AI avoid misreading the logic.
