# Production Environment Setup

This document outlines the environment variables needed for deploying the application to production using the new Supabase project.

## 1. Production `.env` Values

For your production environment (e.g., when deploying to Vercel), use the following values for your environment variables based on the new Supabase credentials provided.

```env
# Database connection string with connection pooling enabled (port 6543)
DATABASE_URL="postgresql://postgres.xiwjaghtegazytkeoozo:i7n0H1zSZJMlLzbE.@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct database connection for Prisma migrations (port 5432)
DIRECT_URL="postgresql://postgres.xiwjaghtegazytkeoozo:i7n0H1zSZJMlLzbE.@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Supabase Project URL (derived from your database user ID)
NEXT_PUBLIC_SUPABASE_URL="https://xiwjaghtegazytkeoozo.supabase.co"

# Supabase Anonymous Key (Needs to be copied from the new project's dashboard Settings -> API)
NEXT_PUBLIC_SUPABASE_ANON_KEY="<replace_with_your_new_project_anon_key>"

# Your application's production domain URL
NEXTAUTH_URL="https://your-production-domain.com"

# A secure random string for signing NextAuth tokens (Generate a new one using `openssl rand -base64 32`)
NEXTAUTH_SECRET="<replace_with_a_newly_generated_secret>"
```

## 2. Next Steps for Production

1. **Retrieve the `NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Log into your Supabase dashboard, select the new production project, navigate to **Project Settings -> API**, and copy the `anon` / `public` key.
2. **Apply Migrations to Production**: Run Prisma migrations against your new production database to create the necessary tables. You can temporarily replace your local `.env` with the production ones and run:
   ```bash
   npx prisma migrate deploy
   ```
   Or, apply it through a CI/CD pipeline if configured.
3. **Configure Hosting Provider**: Copy all the environment variables from the code block above into your hosting provider's dashboard (e.g., Vercel's Environment Variables settings) before deploying.
4. **Update `NEXTAUTH_URL`**: Ensure to replace `https://your-production-domain.com` with the actual URL where your application will be hosted.
