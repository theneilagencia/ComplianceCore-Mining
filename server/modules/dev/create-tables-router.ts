import { Router } from 'express';
import { getDb } from '../../db';
import { sql } from 'drizzle-orm';

const router = Router();

router.post('/create-tables', async (req, res) => {
  try {
    console.log('[Dev] Creating missing tables...');
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Create reports table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(64) PRIMARY KEY,
        "tenantId" VARCHAR(64) NOT NULL,
        "userId" VARCHAR(64) NOT NULL,
        title TEXT NOT NULL,
        standard standard NOT NULL,
        status status DEFAULT 'draft' NOT NULL,
        "sourceType" source_type DEFAULT 'internal',
        "detectedStandard" standard,
        "s3NormalizedUrl" TEXT,
        "s3OriginalUrl" TEXT,
        "parsingSummary" JSONB,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Dev] ✅ Reports table created');

    // Create audits table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audits (
        id VARCHAR(64) PRIMARY KEY,
        "reportId" VARCHAR(64) NOT NULL,
        "tenantId" VARCHAR(64) NOT NULL,
        "userId" VARCHAR(64) NOT NULL,
        "auditType" audit_type NOT NULL,
        score REAL NOT NULL,
        "totalRules" INTEGER NOT NULL,
        "passedRules" INTEGER NOT NULL,
        "failedRules" INTEGER NOT NULL,
        "krcisJson" JSONB NOT NULL,
        "recommendationsJson" JSONB NOT NULL,
        "pdfUrl" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('[Dev] ✅ Audits table created');

    // Create indexes
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reports_userId ON reports("userId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reports_tenantId ON reports("tenantId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audits_reportId ON audits("reportId")`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_audits_userId ON audits("userId")`);
    console.log('[Dev] ✅ Indexes created');

    res.json({ 
      success: true, 
      message: 'Tables created successfully',
      tables: ['reports', 'audits']
    });
  } catch (error: any) {
    console.error('[Dev] Create tables error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

