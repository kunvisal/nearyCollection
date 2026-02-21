# AI Project Context – Neary Collection

## 🎯 Project Purpose

This project is an e-commerce web application for selling women’s clothing.

Goals:
- Clean modern UI
- Admin + Customer in same Next.js app
- Fast performance
- Scalable architecture
- Easy future migration to microservices
- AI-assisted development (vibe coding)

Target traffic:
~100 users per day (starter stage)

---

# 🏗 Current Tech Stack

Frontend + API:
- Next.js (App Router)
- Route Handlers (internal API)
- Server Components + Client Components
- TanStack Query (client-side fetching)
- Zod (validation)
- NextAuth (authentication)

Database:
- PostgreSQL (Supabase + MCP for ai easy to access) 
- Prisma ORM

Hosting:
- Vercel (Next.js + Route Handlers)
- Supabase (PostgreSQL & Storage)

Planned later:
- Redis (Upstash)
- Background jobs (BullMQ)
- Possible microservice split

---

# 🧠 Architecture Philosophy

We are starting with a monolithic structure inside Next.js
but designing it so it can evolve into microservices later.

Important principles:

1. Keep business logic OUT of route handlers.
2. Use service layer pattern.
3. Keep database access inside repository layer.
4. Keep API responses consistent and structured.
5. Design APIs as if they may become external services later.

---

# 📁 Project Structure Convention

/app
  /(public)           → Customer UI
  /(admin)            → Admin UI
  /api                → Route Handlers (thin controllers)

/lib
  /services           → Business logic
  /repositories       → Database access
  /validators         → Zod schemas
  /auth               → Auth helpers
  /utils              → Shared utilities

/prisma
  schema.prisma

---

# 🔐 Authentication Rules

- Use NextAuth
- Role-based access (ADMIN / CUSTOMER)
- Admin routes must be protected
- Prefer secure cookies
- Do not expose sensitive data

---

# 📦 API Design Rules

All APIs must:

- Validate input using Zod
- Use service layer
- Handle errors properly
- Return consistent JSON structure:

Example response:

{
  "success": true,
  "data": {},
  "error": null
}

Error response:

{
  "success": false,
  "data": null,
  "error": "Error message"
}

---

# 🗄 Database Rules

- Use Prisma
- Use migrations properly
- Never generate raw SQL unless necessary
- Always add indexes for:
  - product name
  - category id
  - order user id
  - createdAt

- Keep schema scalable for microservices split later

---

# 🚀 Future Evolution Plan

When scaling:

1. Extract Product Service
2. Extract Order Service
3. Keep API contract unchanged
4. Replace internal service call with HTTP call
5. Introduce API Gateway later

AI should write code in a way that supports future extraction.

---

# ⚡ Performance Rules

- Use pagination for product lists
- Avoid N+1 queries
- Use Prisma include/select carefully
- Use caching when needed
- Keep queries optimized

---

# 🛑 Important Constraints

- Do NOT over-engineer
- Do NOT introduce Kubernetes
- Do NOT add unnecessary complexity
- Keep it production-ready but simple
- This is a startup-scale architecture

---

# 🤖 AI Agent Instructions

When generating code:

1. Follow clean architecture principles.
2. Keep code readable and maintainable.
3. Avoid unnecessary dependencies.
4. Always suggest best practices.
5. Assume future microservice migration.
6. Keep security in mind.
7. Prefer TypeScript strict mode.

If unsure, ask for clarification before generating large structural changes.

---

# 🏆 End Goal

A clean, scalable, modern e-commerce platform
built with Next.js + PostgreSQL
that can evolve into microservices when traffic grows.
