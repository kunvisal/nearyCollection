/**
 * One-time migration script: move all product images from TestSupabase → Neary_Prod
 *
 * Run: node scripts/migrate-images.mjs
 * Delete this file after confirming migration succeeded.
 */

import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const TEST_SUPABASE_URL = "https://duiyfzcotusolqgmhwav.supabase.co";
const TEST_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1aXlmemNvdHVzb2xxZ21od2F2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODY3NzgsImV4cCI6MjA4NjM2Mjc3OH0.fw5kuA4xHJNFg6E0qrXPTbkRXATsCjYg4KjYeF7Xrx8";

const PROD_SUPABASE_URL = "https://xiwjaghtegazytkeoozo.supabase.co";
const PROD_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpd2phZ2h0ZWdhenl0a2Vvb3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTQ5NDcsImV4cCI6MjA4ODAzMDk0N30.UP7s6JLLDN3P7seY4d25fc-sA10tNUSEYjl0Ez2YkQ0";

// Neary_Prod DB connection (same as DATABASE_URL but direct for migration)
const DB_URL =
  "postgresql://postgres.xiwjaghtegazytkeoozo:i7n0H1zSZJMlLzbE@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

const testSupabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY);
const prodSupabase = createClient(PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY);

async function listAllFiles(bucket) {
  const allFiles = [];
  // List root-level "folders" (product ID prefixes)
  const { data: folders, error } = await testSupabase.storage
    .from(bucket)
    .list("", { limit: 1000 });

  if (error) throw new Error(`Failed to list folders: ${error.message}`);

  for (const folder of folders) {
    if (!folder.id) {
      // It's a folder prefix, list its contents
      const { data: files, error: fileErr } = await testSupabase.storage
        .from(bucket)
        .list(folder.name, { limit: 1000 });

      if (fileErr)
        throw new Error(
          `Failed to list files in ${folder.name}: ${fileErr.message}`
        );

      for (const file of files) {
        allFiles.push(`${folder.name}/${file.name}`);
      }
    } else {
      // It's a file at root level
      allFiles.push(folder.name);
    }
  }

  return allFiles;
}

async function migrateFile(filePath) {
  const publicUrl = `${TEST_SUPABASE_URL}/storage/v1/object/public/products/${filePath}`;

  // Download from TestSupabase
  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to download ${filePath}: ${response.status} ${response.statusText}`
    );
  }

  const buffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";

  // Upload to Neary_Prod
  const { error } = await prodSupabase.storage
    .from("products")
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`Failed to upload ${filePath}: ${error.message}`);
}

async function updateDatabaseUrls(client) {
  const result = await client.query(
    `UPDATE product_images
     SET url = REPLACE(url, $1, $2)
     WHERE url LIKE $3`,
    [
      "duiyfzcotusolqgmhwav.supabase.co",
      "xiwjaghtegazytkeoozo.supabase.co",
      "%duiyfzcotusolqgmhwav.supabase.co%",
    ]
  );
  return result.rowCount;
}

async function main() {
  console.log("=== Image Migration: TestSupabase → Neary_Prod ===\n");

  // Step 1: List all files
  console.log("Listing files in TestSupabase products bucket...");
  const files = await listAllFiles("products");
  console.log(`Found ${files.length} files to migrate.\n`);

  // Step 2: Migrate each file
  let migrated = 0;
  let failed = 0;
  for (const filePath of files) {
    try {
      await migrateFile(filePath);
      migrated++;
      process.stdout.write(`\r  Migrated ${migrated}/${files.length} files...`);
    } catch (err) {
      failed++;
      console.error(`\n  FAILED: ${filePath} — ${err.message}`);
    }
  }
  console.log(`\n\nMigration complete: ${migrated} succeeded, ${failed} failed.\n`);

  // Step 3: Update DB URLs
  console.log("Updating product_images URLs in Neary_Prod database...");
  const dbClient = new pg.Client({ connectionString: DB_URL });
  await dbClient.connect();
  try {
    const updatedRows = await updateDatabaseUrls(dbClient);
    console.log(`Updated ${updatedRows} rows in product_images.\n`);
  } finally {
    await dbClient.end();
  }

  console.log("Done! Next steps:");
  console.log("  1. Update .env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.log("  2. Update next.config.ts image hostname");
  console.log("  3. Update Vercel environment variables");
  console.log("  4. Verify images load, then delete TestSupabase project");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
