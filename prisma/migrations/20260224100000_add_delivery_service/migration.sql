DO $$
BEGIN
    CREATE TYPE "DeliveryService" AS ENUM ('JALAT', 'VET', 'JT');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "deliveryService" "DeliveryService";
