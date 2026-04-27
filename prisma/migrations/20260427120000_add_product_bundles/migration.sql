-- Add product bundle support
-- 1. Extend products with bundle metadata
ALTER TABLE "products"
    ADD COLUMN IF NOT EXISTS "isBundle" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "bundleDiscount" DECIMAL(10,2);

CREATE INDEX IF NOT EXISTS "products_isBundle_idx" ON "products"("isBundle");

-- 2. New bundle_components table (junction: bundle Product → component ProductVariant)
CREATE TABLE IF NOT EXISTS "bundle_components" (
    "id"              TEXT PRIMARY KEY,
    "bundleProductId" TEXT NOT NULL,
    "variantId"       TEXT NOT NULL,
    "qty"             INTEGER NOT NULL DEFAULT 1
);

DO $$
BEGIN
    ALTER TABLE "bundle_components"
        ADD CONSTRAINT "bundle_components_bundleProductId_fkey"
        FOREIGN KEY ("bundleProductId") REFERENCES "products"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "bundle_components"
        ADD CONSTRAINT "bundle_components_variantId_fkey"
        FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "bundle_components"
        ADD CONSTRAINT "bundle_components_bundleProductId_variantId_key"
        UNIQUE ("bundleProductId", "variantId");
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "bundle_components_bundleProductId_idx" ON "bundle_components"("bundleProductId");
CREATE INDEX IF NOT EXISTS "bundle_components_variantId_idx"       ON "bundle_components"("variantId");

-- 3. Extend order_items with parent/child + bundle linkage
ALTER TABLE "order_items"
    ADD COLUMN IF NOT EXISTS "bundleProductId" TEXT,
    ADD COLUMN IF NOT EXISTS "parentItemId"    TEXT,
    ADD COLUMN IF NOT EXISTS "isBundleParent"  BOOLEAN NOT NULL DEFAULT false;

-- Make variantId nullable (bundle parent rows have NULL variantId)
ALTER TABLE "order_items" ALTER COLUMN "variantId" DROP NOT NULL;

-- Add defaults for snapshot fields so bundle parents can persist with empty strings
ALTER TABLE "order_items" ALTER COLUMN "sizeSnapshot"  SET DEFAULT '';
ALTER TABLE "order_items" ALTER COLUMN "colorSnapshot" SET DEFAULT '';
ALTER TABLE "order_items" ALTER COLUMN "skuSnapshot"   SET DEFAULT '';

DO $$
BEGIN
    ALTER TABLE "order_items"
        ADD CONSTRAINT "order_items_bundleProductId_fkey"
        FOREIGN KEY ("bundleProductId") REFERENCES "products"("id") ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "order_items"
        ADD CONSTRAINT "order_items_parentItemId_fkey"
        FOREIGN KEY ("parentItemId") REFERENCES "order_items"("id") ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "order_items_bundleProductId_idx" ON "order_items"("bundleProductId");
CREATE INDEX IF NOT EXISTS "order_items_parentItemId_idx"    ON "order_items"("parentItemId");
