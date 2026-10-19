-- Country-based payment gateways + storefront layouts.
-- Data-preserving: old SSLCOMMERZ/BKASH orders become ONLINE + gateway, old store toggles become enabledGateways.

-- Order.gateway (filled before the enum changes)
ALTER TABLE "Order" ADD COLUMN "gateway" TEXT;
UPDATE "Order" SET "gateway" = lower("paymentMethod"::text) WHERE "paymentMethod"::text IN ('SSLCOMMERZ', 'BKASH');

-- OrderPaymentMethod: COD | MANUAL | ONLINE
BEGIN;
CREATE TYPE "OrderPaymentMethod_new" AS ENUM ('COD', 'MANUAL', 'ONLINE');
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE "OrderPaymentMethod_new"
  USING (CASE WHEN "paymentMethod"::text IN ('SSLCOMMERZ', 'BKASH') THEN 'ONLINE' ELSE "paymentMethod"::text END)::"OrderPaymentMethod_new";
ALTER TYPE "OrderPaymentMethod" RENAME TO "OrderPaymentMethod_old";
ALTER TYPE "OrderPaymentMethod_new" RENAME TO "OrderPaymentMethod";
DROP TYPE "public"."OrderPaymentMethod_old";
COMMIT;

-- Category image (category carousel)
ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT;

-- Store: country, gateways, layout
ALTER TABLE "Store"
  ADD COLUMN "announcement" TEXT,
  ADD COLUMN "brandColor" TEXT NOT NULL DEFAULT '#2f62d6',
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'BD',
  ADD COLUMN "enabledGateways" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "heroSlides" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "layout" TEXT NOT NULL DEFAULT 'minimal',
  ADD COLUMN "promoBanners" JSONB NOT NULL DEFAULT '[]';

UPDATE "Store" SET "enabledGateways" = array_remove(ARRAY[
  CASE WHEN "sslcommerzEnabled" THEN 'sslcommerz' END,
  CASE WHEN "bkashEnabled" THEN 'bkash' END
], NULL);

ALTER TABLE "Store" DROP COLUMN "bkashEnabled", DROP COLUMN "sslcommerzEnabled";
