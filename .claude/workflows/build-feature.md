# Workflow: Build a Feature

Use this checklist when adding any new feature to Neary Collection.
Follow the steps in order. Do not skip layers.

---

## 1. Understand before touching

- [ ] Read the relevant existing code (page, service, repository) before writing anything
- [ ] Check `docs/ECOSYSTEM.md` to confirm field names and API shapes
- [ ] Check `src/types/admin.ts` for existing shared types — reuse before defining new ones
- [ ] Check `src/lib/validators/` for an existing Zod schema — extend rather than duplicate

## 2. Database changes (if needed)

- [ ] Edit `prisma/schema.prisma` — follow existing naming conventions (snake_case table names, PascalCase models)
- [ ] Run: `npx prisma migrate dev --name "describe_what_changed"`
- [ ] Run: `npx prisma generate`
- [ ] Update `docs/ECOSYSTEM.md` if new models or fields were added

## 3. Implement in layer order

**Repository** (`src/lib/repositories/[entity]Repository.ts`)
- [ ] Add query methods — Prisma only, no business logic
- [ ] Use `include`/`select` to avoid N+1, never fetch unnecessary fields
- [ ] Add intent comment on any transaction block explaining the business flow

**Validator** (`src/lib/validators/[entity]Validators.ts`)
- [ ] Add or update Zod schemas (name: `create[Entity]Schema`, `update[Entity]Schema`)
- [ ] Export inferred TypeScript types (`Create[Entity]Input`, `Update[Entity]Input`)

**Service** (`src/lib/services/[entity]Service.ts`)
- [ ] Add business logic — validate input with Zod, call repositories, orchestrate transactions
- [ ] Throw errors with clear messages (route handler catches and formats them)

**Route Handler** (`src/app/api/admin/[resource]/route.ts`)
- [ ] Parse request, check session, call service, return `successResponse` / `errorResponse`
- [ ] No business logic here — thin controller only

## 4. Build the UI

- [ ] Add shared TypeScript types to `src/types/admin.ts` if used in more than one component
- [ ] Follow naming: pages = `page.tsx`, client components = `"use client"` at top
- [ ] Add skeleton loading:
  - Server components: wrap data-fetching child in `<Suspense fallback={<YourSkeleton />}>`
  - Client components: `if (isLoading) return <YourSkeleton />;`
  - Decision rule: data fetch > 200ms → skeleton | button action → spinner | instant state → nothing
- [ ] Create skeleton in `src/components/skeletons/[Feature]Skeleton.tsx` if needed

## 5. Dates and timezone

- [ ] Display dates to users: use `formatCambodiaDate(date, fmt)` from `@/lib/utils/timezone`
- [ ] DB query boundaries from user date input: use `cambodiaDayStartToUtc` / `cambodiaDayEndToUtc`
- [ ] Group server-side data by day: use `toCambodiaDateStr(date)`
- [ ] Never use `new Date().toISOString().slice(0,10)` on the server

## 6. Verify

- [ ] Run `npm run build` — zero TypeScript errors, zero ESLint errors
- [ ] Test the golden path manually in the browser (dev server: `npm run dev`)
- [ ] Test edge cases: empty state, missing data, error states
- [ ] Check dark mode if the feature has UI

## 7. Update docs

- [ ] Update `docs/ECOSYSTEM.md` if new routes or types were added
- [ ] Update `docs/FEATURES_STATUS.md` to mark the feature as done
- [ ] Update `TODO.md` — move task from "In Progress" to "Done (recent)"
