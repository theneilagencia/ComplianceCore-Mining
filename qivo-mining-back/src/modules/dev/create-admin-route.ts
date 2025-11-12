/**
 * Temporary route to create admin user in production
 * DELETE THIS AFTER USE!
 */

import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { hashPassword } from '../auth/service';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

export const createAdminRouter = Router();

createAdminRouter.post('/create-admin-secret-route-2025', async (req, res) => {
  try {
    console.log('🔧 Creating admin user...');
    
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }
    
    const adminEmail = 'admin@qivo.ai';
    const adminPassword = 'Bigtrade@4484';
    
    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (existing.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Admin user already exists',
        email: adminEmail 
      });
    }
    
    // Create admin user
    const adminId = createId();
    const passwordHash = await hashPassword(adminPassword);
    
    await db.insert(users).values({
      id: adminId,
      email: adminEmail,
      name: 'QIVO Admin',
      passwordHash,
      googleId: null,
      loginMethod: 'email',
      role: 'admin',
      tenantId: 'default',
      refreshToken: null,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    });
    
    // Create ENTERPRISE license for admin
    await db.insert(licenses).values({
      id: createId(),
      userId: adminId,
      tenantId: 'default',
      plan: 'ENTERPRISE',
      status: 'active',
      billingPeriod: 'annual',
      reportsLimit: 15,
      projectsLimit: 999999,
      reportsUsed: 0,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      lastResetAt: new Date(),
    });
    
    console.log('✅ Admin user created successfully!');
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      email: adminEmail,
      password: adminPassword,
      license: 'ENTERPRISE'
    });
    
  } catch (error: any) {
    console.error('❌ Error creating admin:', error);
    res.status(500).json({ error: error.message });
  }
});

