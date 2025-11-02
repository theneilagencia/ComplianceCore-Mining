import { getDb } from './db';
import { sql } from 'drizzle-orm';

export async function installS3UrlTrigger() {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('⚠️  Database not available, skipping trigger installation');
      return;
    }

    console.log('🔧 Installing s3Url auto-fix trigger...');

    // Create function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION fix_s3url_before_save()
      RETURNS TRIGGER AS $$
      BEGIN
        -- If s3Url doesn't start with / or http, it's a path that needs fixing
        IF NEW."s3Url" IS NOT NULL AND 
           NEW."s3Url" !~ '^/' AND 
           NEW."s3Url" !~ '^http' THEN
          
          -- Convert path to URL: tenants/xxx/file.pdf -> /api/storage/download/tenants%2Fxxx%2Ffile.pdf
          NEW."s3Url" := '/api/storage/download/' || regexp_replace(NEW."s3Url", '/', '%2F', 'g');
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop existing trigger if exists
    await db.execute(sql`DROP TRIGGER IF EXISTS fix_s3url_trigger ON uploads`);

    // Create trigger
    await db.execute(sql`
      CREATE TRIGGER fix_s3url_trigger
        BEFORE INSERT OR UPDATE ON uploads
        FOR EACH ROW
        EXECUTE FUNCTION fix_s3url_before_save();
    `);

    console.log('✅ s3Url trigger installed successfully');
    console.log('📝 All uploads will now auto-correct s3Url at database level');

    // Fix existing broken records
    const result = await db.execute(sql`
      UPDATE uploads 
      SET "s3Url" = '/api/storage/download/' || regexp_replace("s3Url", '/', '%2F', 'g')
      WHERE "s3Url" !~ '^/' 
        AND "s3Url" !~ '^http'
        AND "s3Url" IS NOT NULL
    `);
    
    const rowCount = (result as any).rowCount || 0;
    if (rowCount > 0) {
      console.log(`✅ Fixed ${rowCount} existing records`);
    }

  } catch (error: any) {
    console.error('❌ Failed to install s3Url trigger:', error.message);
    // Don't throw - server should continue even if trigger fails
  }
}
