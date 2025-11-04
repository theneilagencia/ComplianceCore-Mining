-- Create regulatoryChanges table for Radar module
CREATE TABLE IF NOT EXISTS "regulatoryChanges" (
  "id" VARCHAR(64) PRIMARY KEY,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "fullText" TEXT,
  "source" TEXT NOT NULL,
  "sourceUrl" TEXT,
  "country" VARCHAR(2) NOT NULL,
  "category" VARCHAR(64),
  "severity" VARCHAR(16),
  "publishedAt" TIMESTAMP NOT NULL,
  "scrapedAt" TIMESTAMP DEFAULT NOW(),
  "metadata" JSONB
);

-- Create index on publishedAt for faster queries
CREATE INDEX IF NOT EXISTS "idx_regulatory_changes_published_at" ON "regulatoryChanges" ("publishedAt" DESC);

-- Create index on country for filtering
CREATE INDEX IF NOT EXISTS "idx_regulatory_changes_country" ON "regulatoryChanges" ("country");

-- Create index on severity for filtering
CREATE INDEX IF NOT EXISTS "idx_regulatory_changes_severity" ON "regulatoryChanges" ("severity");
