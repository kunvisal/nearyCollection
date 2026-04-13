# TODO — Neary Collection

> Update this file at the start and end of every session.
> Format: enough detail to resume without re-explaining context.

---

## In Progress

_Nothing currently in progress._

---

## Up Next

_All Claude Code setup tasks are complete. See Done (recent) below._

---

## Blocked

_Nothing currently blocked._

---

## Done (recent)

- Created `src/types/admin.ts` — shared TypeScript domain types (AdminVariant, AdminProduct, CartItem, etc.) extracted from 3 component files
- Added intent comments to `orderRepository.ts` — all three transactions now have business intent comments
- Migrated shop skeletons to `.skeleton-box` — removed `Skeleton.module.css`, updated `ProductRowSkeleton.tsx` and `(shop)/loading.tsx`
- Enabled Supabase MCP — removed from `disabledMcpjsonServers` in `.claude/settings.local.json`
- Created `docs/ECOSYSTEM.md` — canonical reference for all API shapes, Prisma fields, Zod schemas, enums
- Created `.claude/workflows/` — `build-feature.md`, `deploy-prod.md`, `debug-issue.md`
- Rewrote `CONTRIBUTING.md` — replaced TailAdmin boilerplate with actual dev workflow
- Created `docs/claude-code-guide.md` — guide explaining how all Claude Code files work together
- Created `TODO.md` — task tracking file
- Added skeleton loading animations to all admin pages
- Standardised Cambodia timezone (UTC+7) across entire codebase
- Added Messenger send & QR confirmation to POS and Edit Order pages
- Added Import from Messenger feature to POS checkout drawer (`MessengerImport.tsx`)
- Migrated Supabase storage from TestSupabase to Neary_Prod project

---

_Last updated: 2026-04-13_
