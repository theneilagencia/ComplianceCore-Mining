/**
 * Create Admin Router
 * One-time route to create QIVO admin user in production
 */

import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { createId } from '@paralleldrive/cuid2';

const router = Router();

/**
 * Create QIVO Admin User
 * POST /api/create-admin
 * Body: { secret: string }
 */
router.post('/', async (req, res) => {
  try {
    // Require secret key to prevent unauthorized admin creation
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
    const adminPassword = 'Bigtrade@4484';
    
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);
    
    if (existingAdmin.length > 0) {
      // Delete existing admin and recreate
      const userId = existingAdmin[0].id;
      
      // Delete existing license
      await db.delete(licenses).where(eq(licenses.userId, userId));
      
      // Delete existing user
      await db.delete(users).where(eq(users.id, userId));
      
      console.log('[Create Admin] Deleted existing admin user');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Create admin user
    const adminId = createId();
    const tenantId = createId();
    
    await db.insert(users).values({
      id: adminId,
      email: adminEmail,
      passwordHash,
      name: 'QIVO Admin',
      role: 'admin',
      tenantId,
      loginMethod: 'local',
      createdAt: new Date(),
      lastSignedIn: new Date(),
    });
    
    // Create ENTERPRISE license for admin
    const licenseId = createId();
    
    await db.insert(licenses).values({
      id: licenseId,
      userId: adminId,
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
    
    console.log('[Create Admin] ✅ Admin user created successfully');
    console.log('[Create Admin] Email: admin@qivo-mining.com');
    console.log('[Create Admin] Password: Bigtrade@4484');
    console.log('[Create Admin] Role: admin');
    console.log('[Create Admin] License: ENTERPRISE (unlimited)');
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      userId: adminId,
      licenseId,
      credentials: {
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        plan: 'ENTERPRISE',
      },
    });
  } catch (error: any) {
    console.error('[Create Admin] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

