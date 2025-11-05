/**
 * Migrations Router - Endpoint para executar migrações
 * APENAS PARA DESENVOLVIMENTO/DEPLOY
 */
import { Router } from 'express';
import { getDb } from '../../db.js';
import { sql } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/dev/run-migrations
 * Executa todas as migrações pendentes
 */
router.post('/run-migrations', async (req, res) => {
  try {
    const db = getDb();
    
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    const results = [];

    // Migração 0004: regulatoryChanges
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "regulatoryChanges" (
          "id" SERIAL PRIMARY KEY,
          "title" VARCHAR(500) NOT NULL,
          "description" TEXT,
          "source" VARCHAR(200) NOT NULL,
          "url" TEXT,
          "publishedAt" TIMESTAMP NOT NULL,
          "country" VARCHAR(10) NOT NULL,
          "severity" VARCHAR(20) NOT NULL,
          "category" VARCHAR(100),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_regulatory_changes_published" ON "regulatoryChanges" ("publishedAt" DESC)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_regulatory_changes_country" ON "regulatoryChanges" ("country")`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_regulatory_changes_severity" ON "regulatoryChanges" ("severity")`);
      
      results.push({ migration: '0004_add_regulatory_changes', status: 'success' });
    } catch (error: any) {
      results.push({ migration: '0004_add_regulatory_changes', status: 'error', message: error.message });
    }

    // Migração 0005: stripeCustomerId
    try {
      await db.execute(sql`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" VARCHAR(255)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_users_stripe_customer" ON "users" ("stripeCustomerId")`);
      
      results.push({ migration: '0005_add_stripe_customer_id', status: 'success' });
    } catch (error: any) {
      results.push({ migration: '0005_add_stripe_customer_id', status: 'error', message: error.message });
    }

    // Migração 0006: onDemandReports
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "onDemandReports" (
          "id" SERIAL PRIMARY KEY,
          "userId" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "reportType" VARCHAR(50) NOT NULL,
          "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
          "stripeSessionId" VARCHAR(255),
          "stripePaymentIntentId" VARCHAR(255),
          "amount" INTEGER NOT NULL,
          "currency" VARCHAR(3) NOT NULL DEFAULT 'usd',
          "reportData" JSONB,
          "reportUrl" TEXT,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP
        )
      `);
      
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_on_demand_reports_user" ON "onDemandReports" ("userId")`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_on_demand_reports_status" ON "onDemandReports" ("status")`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_on_demand_reports_stripe_session" ON "onDemandReports" ("stripeSessionId")`);
      
      results.push({ migration: '0006_add_on_demand_reports', status: 'success' });
    } catch (error: any) {
      results.push({ migration: '0006_add_on_demand_reports', status: 'error', message: error.message });
    }

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
