/**
 * Create Admin User in Production
 * Run with: npx tsx server/scripts/create-admin.ts
 */

import { getDb } from '../db';
import { users, licenses } from '../../drizzle/schema';
import { hashPassword } from '../modules/auth/service';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

async function createAdminUser() {
  console.log('🔧 Creating admin user...');
  
  const db = await getDb();
  
  if (!db) {
    throw new Error('Database not available');
  }
  
  const adminEmail = 'admin@qivo.ai';
  const adminPassword = 'Bigtrade@4484';
  
  // Check if admin already exists
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  
  if (existing.length > 0) {
    console.log('✅ Admin user already exists');
    console.log('Email:', adminEmail);
    return existing[0];
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
    projectsLimit: 999999, // Unlimited
    reportsUsed: 0,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    lastResetAt: new Date(),
  });
  
  console.log('✅ Admin user created successfully!');
  console.log('Email:', adminEmail);
  console.log('Password:', adminPassword);
  console.log('License: ENTERPRISE (unlimited)');
  
  return { id: adminId, email: adminEmail, name: 'QIVO Admin' };
}

// Run
createAdminUser()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

