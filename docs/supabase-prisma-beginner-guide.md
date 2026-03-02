# Beginner's Guide: Supabase & Prisma

Welcome! If you are new to backend development with **Supabase** and **Prisma**, this guide will explain exactly what they are, how they work together, and how you can manage them in your current project.

---

## 1. What are Supabase and Prisma?

### What is Supabase?
Supabase is a Backend-as-a-Service (BaaS) platform. Think of it as a server in the cloud that hosts your **PostgreSQL Database**. It runs 24/7 so that your Next.js application can save and read data over the internet.
- **Your Database**: Where all users, orders, and products are stored permanently.

### What is Prisma?
Prisma is an **ORM** (Object-Relational Mapper). It acts as a translator between your Next.js JavaScript code and your Supabase PostgreSQL database.
- Instead of writing raw SQL code like `SELECT * FROM users;`, you write JavaScript/TypeScript like `prisma.user.findMany()`, and Prisma automatically converts and runs that in the database.
- It also manages your **Schema** (the structure of your database tables).

---

## 2. Important Concepts to Understand

### Connection Pooling vs Direct Connection
When you connect Prisma to Supabase, you have to use **two different connection links** inside your `.env` file. This is crucial for your app to run without crashing:

1. **Transaction Pooler URL (Port 6543) -> `DATABASE_URL`**
   - **What it is:** A middleman (called PgBouncer) that manages thousands of connections efficiently. Because Serverless Apps (like Next.js on Vercel) open and close connections very quickly, a pooler prevents your database from being overwhelmed.
   - **When to use:** In your app code (fetching users, creating orders).
   - *Example:* `...pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1`

2. **Direct Connection URL (Port 5432) -> `DIRECT_URL`**
   - **What it is:** A direct, unfiltered pipe right into your PostgreSQL database.
   - **When to use:** Only when you are making structural changes to your database (running **Migrations** like adding a new column or table).

### The `@prisma/adapter-pg` package
Normally, Prisma doesn't always play perfectly with PgBouncer. To fix this, your project uses a special connector (`@prisma/adapter-pg`) inside `src/lib/prisma.ts` to guarantee a stable connection.

---

## 3. How to Make Changes to the Database (Migrations)

Whenever you want to add a new feature that needs a database change (like adding a `phoneNumber` to the `Customer` table), you need to follow these exact steps:

### Step 1: Update the Schema File
Open `prisma/schema.prisma` and add your new column or table.
```prisma
model Customer {
  id        String   @id @default(uuid())
  fullName  String
  phone     String
  // Wait, I want to add an email!
  email     String?  // <-- the '?' means it is optional
}
```

### Step 2: Create and Run a Migration
A **Migration** is simply a history log of changing your database from version 1 to version 2. To tell Supabase about your new `email` column, you run this in your terminal:

**(CRITICAL MESSAGE: You MUST use the `DIRECT_URL` port 5432 to run migrations)**

If your terminal does not support setting ENV vars inline easily (like PowerShell Windows), you do it like this:

**Windows PowerShell:**
```powershell
$env:DATABASE_URL="postgresql://postgres.xiwjaghtegazytkeoozo:[YOUR_PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

npx prisma migrate dev --name added_customer_email
```

**Mac/Linux Terminal:**
```bash
DATABASE_URL="postgresql://postgres.xiwjaghtegazytkeoozo:[YOUR_PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:5432/postgres" npx prisma migrate dev --name added_customer_email
```

**(Note: This command generates a tiny `.sql` file in `prisma/migrations` and executes it on Supabase immediately.)**

### Step 3: Regenerate the Client
After changing the database structure, Prisma needs to update its internal TypeScript definitions so your code knows `email` now exists. Run:
```bash
npx prisma generate
```
Now, if you type `prisma.customer.create({ data: { email: ... } })`, your code editor will automatically suggest `email`!

---

## 4. Other Useful Database Commands

- **`npx prisma db push`**
  Forces your database to look exactly like your `schema.prisma` without saving a migration history file. Only use this if you are prototyping alone and don't care about throwing away existing rows/data! Otherwise, always prefer `migrate dev`.

- **`npx prisma studio`**
  Opens a nice graphical user interface (GUI) on your local computer (`http://localhost:5555`) where you can easily view, add, or delete data manually in your database (like a spreadsheet!).

- **Seed the Database**
  If you ever need to create some default data (like an initial Admin user), you write a script (like `seed-admin.js`) and run it via Node.js:
  ```bash
  node --env-file=.env seed-admin.js
  ```

## 5. Summary Cheat Sheet

| Action | Command | Which URL Port used? |
| :--- | :--- | :--- |
| My app is running `npm run dev` | None (Automatic via codebase) | 6543 (Pooler) |
| Changing Database Structure (Adding Table) | `npx prisma migrate dev --name my_change` | 5432 (Direct) |
| Running Migrations on Prod server (Vercel) | `npx prisma migrate deploy` | 5432 (Direct) |
| Refreshing Auto-complete in VSCode | `npx prisma generate` | Neither (Offline file read) |
| Looking inside the Database Manually | `npx prisma studio` | 6543 (Pooler) |
