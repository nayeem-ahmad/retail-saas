-- Add ROI attribution columns to CrmCampaign
ALTER TABLE "CrmCampaign"
  ADD COLUMN IF NOT EXISTS "attributed_revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "attributed_orders"  INTEGER       NOT NULL DEFAULT 0;
