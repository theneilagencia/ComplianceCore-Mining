-- Migration: Add indexes for efficient cursor-based pagination on reports
-- Date: 2025-11-03
-- Description: Optimizes list queries with cursor pagination, ordering, and search

-- Index 1: Composite index for tenant + createdAt ordering (most common query)
-- Supports: WHERE tenant_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_reports_tenant_created 
ON reports(tenant_id, created_at DESC);

-- Index 2: Composite index for tenant + status + createdAt
-- Supports: WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_reports_tenant_status_created 
ON reports(tenant_id, status, created_at DESC);

-- Index 3: Text search index for title using pg_trgm extension
-- Supports: WHERE tenant_id = ? AND title ILIKE '%search%'
-- First, ensure pg_trgm extension is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index for trigram similarity search
CREATE INDEX IF NOT EXISTS idx_reports_title_trgm 
ON reports USING gin(title gin_trgm_ops);

-- Index 4: Composite index for tenant + title ordering
-- Supports: WHERE tenant_id = ? ORDER BY title ASC/DESC
CREATE INDEX IF NOT EXISTS idx_reports_tenant_title 
ON reports(tenant_id, title);

-- Index 5: Composite index for tenant + status ordering
-- Supports: WHERE tenant_id = ? ORDER BY status
CREATE INDEX IF NOT EXISTS idx_reports_tenant_status 
ON reports(tenant_id, status);

-- Add comments for documentation
COMMENT ON INDEX idx_reports_tenant_created IS 'Optimizes default list query with date ordering';
COMMENT ON INDEX idx_reports_tenant_status_created IS 'Optimizes filtered list by status with date ordering';
COMMENT ON INDEX idx_reports_title_trgm IS 'Enables fast text search on report titles';
COMMENT ON INDEX idx_reports_tenant_title IS 'Optimizes sorting by title';
COMMENT ON INDEX idx_reports_tenant_status IS 'Optimizes sorting by status';

-- Analyze table to update statistics after index creation
ANALYZE reports;
