import { Router } from 'express';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../db';

const router = Router();

router.post('/run-migrations', async (req, res) => {
  try {
    console.log('[Migrations] Starting database migrations...');
    
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('[Migrations] ✅ Migrations completed successfully');
    
    res.json({
      success: true,
      message: 'Migrations completed successfully'
    });
  } catch (error: any) {
    console.error('[Migrations] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
