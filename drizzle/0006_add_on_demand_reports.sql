-- Migration: Add onDemandReports table
-- Date: 2025-11-04
-- Purpose: Track one-time report purchases via Stripe

CREATE TABLE IF NOT EXISTS "onDemandReports" (
  "id" VARCHAR(64) PRIMARY KEY,
  "userId" VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "tenantId" VARCHAR(64) NOT NULL,
  "reportType" VARCHAR(64) NOT NULL,
  "projectId" VARCHAR(64),
  "projectName" TEXT,
  "status" VARCHAR(32) DEFAULT 'pending_payment' NOT NULL,
  "priceUSD" REAL NOT NULL,
  "stripeSessionId" VARCHAR(128),
  "stripePaymentIntentId" VARCHAR(128),
  "paidAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "reportUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_on_demand_reports_user_id ON "onDemandReports"("userId");
CREATE INDEX IF NOT EXISTS idx_on_demand_reports_status ON "onDemandReports"("status");
CREATE INDEX IF NOT EXISTS idx_on_demand_reports_created_at ON "onDemandReports"("createdAt");

-- Comments
COMMENT ON TABLE "onDemandReports" IS 'Tracks one-time report purchases';
COMMENT ON COLUMN "onDemandReports"."reportType" IS 'simplified, complete, multinorm, auditable, esg';
COMMENT ON COLUMN "onDemandReports"."status" IS 'pending_payment, paid, generating, completed, failed';
