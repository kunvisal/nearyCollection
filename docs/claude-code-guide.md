# Claude Code Guide — Neary Collection

How the Claude Code setup in this project works, what each file does, and how to use everything correctly.

---

## Overview

The project has three layers of Claude Code support:

| Layer | Files | Purpose |
|-------|-------|---------|
| **Context** | `CLAUDE.md`, `TODO.md` | Loaded automatically at session start |
| **Reference** | `docs/ECOSYSTEM.md`, `docs/timezone-guide.md`, etc. | Read on demand during a session |
| **Workflows** | `.claude/workflows/*.md` | Step-by-step checklists for common tasks |

---

## How each file is used

### `CLAUDE.md` (root)

**Loaded automatically** at the start of every Claude Code session.

Contains everything Claude needs to understand this project without re-scanning the codebase:
- Tech stack and versions
- Architecture rules (3-layer: Route → Service → Repository)
- Naming conventions
- Skeleton loading system
- Timezone rules
- Constraints (what NOT to do)

**When to update:** When you add a new library, change an architectural rule, or add a new pattern that Claude should follow every session.

---

### `TODO.md` (root)

**Loaded automatically** at session start (it's in the project root).

Tracks current work so every session can resume without re-explaining context.

**Structure:**
```
## In Progress   — what's being worked on right now
## Up Next       — prioritized backlog
## Blocked       — waiting on something
## Done (recent) — last 5–10 completed items
```

**Rule:** Update this at the start AND end of every session. Move tasks through the stages. Remove done items after ~5 sessions.

**Real example — starting a session:**
> You open Claude Code to add a new "Packaging" status to orders.
> Claude reads `TODO.md`, sees the task is in "Up Next", moves it to "In Progress", and starts working with full context.

**Real example — resuming mid-task:**
> You paused work on the Messenger parser yesterday. Today you open Claude Code.
> The `TODO.md` says: "In Progress: Add phone number extraction to Messenger parser — stopped after `parseCustomerInfo`, need to handle Khmer number format next."
> Claude picks up exactly where you left off.

---

### `docs/ECOSYSTEM.md`

**Read on demand** when Claude needs to know field names, API shapes, or enum values.

This is the single source of truth for:
- Every Prisma model field and type
- Every Zod validator schema name and its fields
- Every API route: method, path, request body, response shape
- All enum values
- Server Action signatures

**When to update:** After adding a new API route, Prisma model, Zod schema, or enum value. Update the relevant section — don't let it drift from the code.

**Real example:**
> Claude is building a new "Delivery Tracking" feature and needs to know what fields the Order model has.
> Instead of reading `schema.prisma` every time, it reads `docs/ECOSYSTEM.md` and gets the answer in seconds.

**Real example — catching a field name mistake:**
> A developer writes `order.shipping_address` (snake_case).
> Claude checks `ECOSYSTEM.md`, sees the field is `shippingAddress` (camelCase in Prisma), and corrects the mistake before it becomes a bug.

---

### `src/types/admin.ts`

**Imported directly** in component files that need shared TypeScript types.

Contains domain types shared across multiple admin pages:
- `AdminVariant` — product variant (POS and Order Edit views)
- `AdminVariantDetail` — product variant (manage/detail view, nullable fields)
- `AdminProductImage` — minimal image shape (url only)
- `AdminProductImageDetail` — full image shape (id, url, sortOrder, isPrimary)
- `AdminProduct` — product with variants and images (POS and Order Edit)
- `CartItem` — local cart state (POS and Order Edit)
- `AdminCategory` — category with all fields
- `AdminOrderListItem` — order in list view

**Rule:** Before defining a type inline in a component, check here first. If the same type appears in two or more files, it belongs here.

**Real example:**
```typescript
// WRONG — defining locally when a shared type already exists
type Variant = { id: string; sku: string; salePrice: number; ... };

// CORRECT — import from the shared types file
import type { AdminVariant } from "@/types/admin";
```

---

### `.claude/workflows/build-feature.md`

**Read by Claude** when you ask it to build a new feature.

A step-by-step checklist covering:
1. Read existing code and ECOSYSTEM.md before writing anything
2. Database changes (Prisma migration)
3. Implement in layer order: Repository → Validator → Service → Route Handler
4. Build the UI (with skeleton loading)
5. Apply Cambodia timezone rules
6. Verify with `npm run build` and manual testing
7. Update docs

**Real use case:**
> "Claude, add a customer notes field to the order detail page."
> Claude opens `build-feature.md`, follows each step in order, and doesn't skip the migration, the service layer validation, or the skeleton loading.

---

### `.claude/workflows/deploy-prod.md`

**Read by Claude** before any production deployment.

Covers:
- Pre-deploy: build check, lint, env vars, migration status
- Deploy steps via Vercel
- Post-deploy verification (shop, admin, POS, Supabase)
- Rollback procedure

**Real use case:**
> "Claude, we're ready to deploy the new Messenger import feature."
> Claude reads `deploy-prod.md`, walks through the checklist, flags that a migration file needs to be deployed, and confirms the post-deploy steps.

---

### `.claude/workflows/debug-issue.md`

**Read by Claude** when diagnosing a bug.

Covers:
- How to scope the problem
- How to trace the 3-layer data flow
- How to query the DB directly via Supabase MCP
- Cambodia timezone bug patterns
- Common root causes table (order total, stock restore, skeleton, dates, images, Telegram, POS rules)

**Real use case:**
> "Orders placed after midnight show yesterday's date in the order code."
> Claude opens `debug-issue.md`, goes to the timezone section, checks that `toCambodiaDateStr` is used in `orderRepository.ts` for the order code, and finds the bug.

---

### `.mcp.json` + `.claude/settings.local.json`

**`.mcp.json`** — configures the Supabase MCP server.
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=xiwjaghtegazytkeoozo"
    }
  }
}
```

**`.claude/settings.local.json`** — local permissions (not committed to git if sensitive).

With Supabase MCP enabled, Claude can:
- Run SQL queries against the live database directly
- Inspect schema, tables, and data during a debug session
- Verify migration results without opening the Supabase dashboard

**Real use case:**
> "Claude, why does the dashboard show 0 orders for today?"
> Claude uses the Supabase MCP to run:
> ```sql
> SELECT COUNT(*) FROM orders
> WHERE created_at >= '2026-04-13 00:00:00+07'
>   AND created_at <  '2026-04-14 00:00:00+07';
> ```
> And immediately sees whether orders exist in the DB or the query is filtering them out.

---

## Session start checklist

When you start a new Claude Code session, say:

> "Read CLAUDE.md and TODO.md. Tell me what's in progress and what's up next."

Claude will:
1. Read `CLAUDE.md` (already auto-loaded) to know the project
2. Read `TODO.md` to know the current work state
3. Report what's in progress and suggest where to start

---

## When to use each workflow

| Situation | Tell Claude |
|-----------|-------------|
| Building a new feature | "Follow `.claude/workflows/build-feature.md`" |
| Deploying to production | "Follow `.claude/workflows/deploy-prod.md`" |
| Debugging a bug | "Follow `.claude/workflows/debug-issue.md`" |
| Any session start | "Read CLAUDE.md and TODO.md" |

---

## What NOT to do

- **Don't re-explain the stack** at the start of every session — that's what `CLAUDE.md` is for
- **Don't define types inline** in multiple files — add them to `src/types/admin.ts`
- **Don't update ECOSYSTEM.md manually from memory** — read the source file first, then update the doc
- **Don't skip the workflow steps** — they exist because past sessions caused bugs by skipping layers
- **Don't let `TODO.md` go stale** — an outdated TODO is worse than no TODO

---

## File map

```
CLAUDE.md                          ← project context, auto-loaded every session
TODO.md                            ← task tracking, update every session
CONTRIBUTING.md                    ← dev setup, branching, PR checklist
docs/
  ECOSYSTEM.md                     ← canonical API + DB reference
  claude-code-guide.md             ← this file
  timezone-guide.md                ← Cambodia UTC+7 rules
  prisma-guide.md                  ← Prisma migration guide
  FEATURES_STATUS.md               ← what's done vs. in-progress
  workflows/
    development.md                 ← general dev workflow
  standards/
    coding-style.md                ← formatting and naming rules
    project-structure.md           ← folder structure standards
.claude/
  settings.local.json              ← local MCP permissions
  workflows/
    build-feature.md               ← checklist for new features
    deploy-prod.md                 ← pre/post deploy checklist
    debug-issue.md                 ← debugging guide
.mcp.json                          ← MCP server connections (Supabase)
src/
  types/
    admin.ts                       ← shared TypeScript domain types
  lib/
    utils/timezone.ts              ← Cambodia date helpers (always use these)
    validators/                    ← Zod schemas
    services/                      ← business logic
    repositories/                  ← Prisma queries
  styles/
    skeleton.css                   ← shimmer animation (imported in admin + shop layouts)
  components/skeletons/            ← skeleton components for admin pages
```
