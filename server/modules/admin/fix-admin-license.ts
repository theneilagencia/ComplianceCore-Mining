/**
 * Fix Admin License Router
 * One-time route to fix admin@qivo-mining.com license to ENTERPRISE
 */

import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const router = Router();

/**
 * Fix QIVO Admin License
 * POST /api/fix-admin-license
 * Body: { secret: string }
 */
router.post('/', async (req, res) => {
  try {
    const { secret } = req.body;
    
    // Temporary fallback for initial setup
    const validSecrets = [
      process.env.ADMIN_CREATION_SECRET,
      'qivo2025admin',
      'Bigtrade@4484'
    ].filter(Boolean);
    
    if (!validSecrets.includes(secret)) {
      return res.status(403).json({ error: 'Invalid secret' });
    }

    const db = await getDb();
    
    if (!db) {
      throw new Error('Database not available');
    }
    
    const adminEmail = 'admin@qivo-mining.com';
    
    // Find admin user
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    if (existingAdmin.length === 0) {
      return res.status(404).json({ error: 'Admin user not found' });
    }
    
    const userId = existingAdmin[0].id;
    const tenantId = existingAdmin[0].tenantId;
    
    // Delete existing license
    await db.delete(licenses).where(eq(licenses.userId, userId));
    
    console.log('[Fix Admin] Deleted existing license');
    
    // Create new ENTERPRISE license
    const licenseId = createId();
    
    await db.insert(licenses).values({
      id: licenseId,
      userId,
      tenantId,
      plan: 'ENTERPRISE',
      status: 'active',
      reportsUsed: 0,
      reportsLimit: 999,
      projectsLimit: 999,
      billingPeriod: 'annual',
      validFrom: new Date(),
      validUntil: null, // Never expires
    });
    
    console.log('[Fix Admin] ✅ ENTERPRISE license created successfully');
    console.log('[Fix Admin] Email: admin@qivo-mining.com');
    console.log('[Fix Admin] License: ENTERPRISE (999 reports)');
    
    res.json({
      success: true,
      message: 'Admin license fixed successfully',
      userId,
      licenseId,
      license: {
        plan: 'ENTERPRISE',
        reportsLimit: 999,
        projectsLimit: 999,
        status: 'active',
      },
    });
  } catch (error: any) {
    console.error('[Fix Admin] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

