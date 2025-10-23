import { Router } from 'express';
import postgres from 'postgres';

const router = Router();

router.post('/create-tables', async (req, res) => {
  try {
    console.log('[Dev] Creating missing tables...');
    
    const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
    if (!dbUrl) {
      return res.status(500).json({ error: 'Database URL not configured' });
    }

    const client = postgres(dbUrl, { ssl: 'require', max: 1 });

    // Create ENUMs (ignore if they already exist)
    const enums = [
      { name: 'standard', values: ['JORC_2012', 'NI_43_101', 'PERC', 'SAMREC', 'CRIRSCO', 'CBRR'] },
      { name: 'status', values: ['draft', 'parsing', 'needs_review', 'ready_for_audit', 'audited', 'certified', 'exported'] },
      { name: 'source_type', values: ['internal', 'external'] },
      { name: 'audit_type', values: ['full', 'partial'] }
    ];

    for (const enumDef of enums) {
      try {
        const values = enumDef.values.map(v => `'${v}'`).join(', ');
        await client.unsafe(`CREATE TYPE ${enumDef.name} AS ENUM (${values})`);
        console.log(`[Dev] ✅ ENUM ${enumDef.name} created`);
      } catch (e: any) {
        if (e.message && e.message.includes('already exists')) {
          console.log(`[Dev] ℹ️  ENUM ${enumDef.name} already exists`);
        } else {
          console.error(`[Dev] ❌ Error creating ENUM ${enumDef.name}:`, e.message);
          throw e;
        }
      }
    }

    // Create reports table
    await client.unsafe(`
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
    await client.unsafe(`
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
    await client.unsafe('CREATE INDEX IF NOT EXISTS idx_reports_userId ON reports("userId")');
    await client.unsafe('CREATE INDEX IF NOT EXISTS idx_reports_tenantId ON reports("tenantId")');
    await client.unsafe('CREATE INDEX IF NOT EXISTS idx_audits_reportId ON audits("reportId")');
    await client.unsafe('CREATE INDEX IF NOT EXISTS idx_audits_userId ON audits("userId")');
    console.log('[Dev] ✅ Indexes created');

    await client.end();

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

