/**
 * Create QIVO Admin User
 * Email: admin@qivo-mining.com
 * Password: Bigtrade@4484
 * Role: admin
 * Plan: ENTERPRISE
 */

import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { createId } from '@paralleldrive/cuid2';

export async function createQivoAdmin() {
  const db = await getDb();
  
  if (!db) {
    throw new Error('[Create QIVO Admin] Database not available');
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
    console.log('[Create QIVO Admin] ⚠️  Admin user already exists');
    return {
      success: true,
      message: 'Admin user already exists',
      userId: existingAdmin[0].id,
    };
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
    plan: 'ENTERPRISE',
    status: 'active',
    reportsUsed: 0,
    reportsLimit: 999,
    projectsActive: 0,
    projectsLimit: 999,
    billingPeriod: 'annual',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: null, // Never expires
  });
  
  console.log('[Create QIVO Admin] ✅ Admin user created successfully');
  console.log('[Create QIVO Admin] Email: admin@qivo-mining.com');
  console.log('[Create QIVO Admin] Password: Bigtrade@4484');
  console.log('[Create QIVO Admin] Role: admin');
  console.log('[Create QIVO Admin] License: ENTERPRISE (unlimited)');
  
  return {
    success: true,
    message: 'Admin user created successfully',
    userId: adminId,
    licenseId,
  };
}

