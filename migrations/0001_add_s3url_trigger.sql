-- Migration: Add trigger to auto-fix s3Url
-- This trigger ensures s3Url is always a valid URL, not a file path

-- Create function to fix s3Url
CREATE OR REPLACE FUNCTION fix_s3url_before_save()
RETURNS TRIGGER AS $$
BEGIN
  -- If s3Url doesn't start with '/' or 'http', convert it to URL
  IF NEW."s3Url" IS NOT NULL AND 
     NEW."s3Url" !~ '^/' AND 
     NEW."s3Url" !~ '^http' THEN
    
    -- Build valid URL: /api/storage/download/[encoded path]
    NEW."s3Url" := '/api/storage/download/' || regexp_replace(NEW."s3Url", '/', '%2F', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS fix_s3url_trigger ON uploads;

-- Create trigger that runs BEFORE INSERT or UPDATE
CREATE TRIGGER fix_s3url_trigger
  BEFORE INSERT OR UPDATE ON uploads
  FOR EACH ROW
  EXECUTE FUNCTION fix_s3url_before_save();
