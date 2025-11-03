-- Migration: Add 'parsing_failed' status to reports status enum
-- Date: 2025-11-03
-- Description: Adds new status for reports that failed parsing after all retry attempts

-- Step 1: Add new value to status enum
ALTER TYPE status ADD VALUE IF NOT EXISTS 'parsing_failed';

-- Step 2: Add comment for documentation
COMMENT ON TYPE status IS 'Report status lifecycle: draft -> parsing -> [parsing_failed | needs_review | ready_for_audit] -> audited -> certified -> exported';

-- Step 3: Update any reports stuck in "parsing" for >1 hour to "parsing_failed"
-- This handles edge cases from before retry logic was implemented
UPDATE reports 
SET 
  status = 'parsing_failed',
  "parsingSummary" = jsonb_set(
    COALESCE("parsingSummary", '{}'::jsonb),
    '{migrationNote}',
    '"Automatically marked as parsing_failed - was stuck in parsing status"'::jsonb
  )
WHERE 
  status = 'parsing' 
  AND "createdAt" < NOW() - INTERVAL '1 hour'
  AND "parsingSummary" IS NULL OR "parsingSummary"->>'parsedAt' IS NULL;
