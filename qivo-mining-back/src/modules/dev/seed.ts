/**
 * Development Seed Data
 * Creates admin user and test licenses for development
 */

import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { hashPassword } from '../auth/service';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

/**
 * Seed admin user for development
 */
export async function seedAdminUser() {
  const db = await getDb();
  
  if (!db) {
    throw new Error('[Dev Seed] Database not available');
  }
  
  const adminEmail = 'admin@jorc.com';
  const adminPassword = 'Admin@2025';
  
  // Check if admin already exists
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  
  if (existing.length > 0) {
    console.log('[Dev Seed] Admin user already exists');
    return existing[0];
  }
  
  // Create admin user
  const adminId = createId();
  const passwordHash = await hashPassword(adminPassword);
  
  await db.insert(users).values({
    id: adminId,
    email: adminEmail,
    name: 'Admin User',
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
  
  console.log('[Dev Seed] ✅ Admin user created');
  console.log('[Dev Seed] Email: admin@jorc.com');
  console.log('[Dev Seed] Password: Admin@2025');
  console.log('[Dev Seed] License: ENTERPRISE (unlimited)');
  
  return { id: adminId, email: adminEmail, name: 'Admin User' };
}

/**
 * Seed test users for development
 */
export async function seedTestUsers() {
  const db = await getDb();
  
  if (!db) {
    throw new Error('[Dev Seed] Database not available');
  }
  
  const testUsers = [
    {
      email: 'test@jorc.com',
      password: 'Test@2025',
      name: 'Test User',
      plan: 'START' as const,
    },
    {
      email: 'pro@jorc.com',
      password: 'Pro@2025',
      name: 'PRO User',
      plan: 'PRO' as const,
    },
  ];
  
  for (const testUser of testUsers) {
    // Check if user already exists
    const existing = await db.select().from(users).where(eq(users.email, testUser.email)).limit(1);
    
    if (existing.length > 0) {
      console.log(`[Dev Seed] ${testUser.email} already exists`);
      continue;
    }
    
    // Create user
    const userId = createId();
    const passwordHash = await hashPassword(testUser.password);
    
    await db.insert(users).values({
      id: userId,
      email: testUser.email,
      name: testUser.name,
      passwordHash,
      googleId: null,
      loginMethod: 'email',
      role: 'user',
      tenantId: 'default',
      refreshToken: null,
      createdAt: new Date(),
      lastSignedIn: new Date(),
    });
    
    // Create license
    const licenseConfig = {
      START: { reports: 1, projects: 1 },
      PRO: { reports: 5, projects: 3 },
      ENTERPRISE: { reports: 15, projects: 999999 },
    };
    
    const config = licenseConfig[testUser.plan];
    
    await db.insert(licenses).values({
      id: createId(),
      userId,
      tenantId: 'default',
      plan: testUser.plan,
      status: 'active',
      billingPeriod: 'monthly',
      reportsLimit: config.reports,
      projectsLimit: config.projects,
      reportsUsed: 0,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      lastResetAt: new Date(),
    });
    
    console.log(`[Dev Seed] ✅ ${testUser.email} created (${testUser.plan})`);
  }
}

/**
 * Run all seeds
 */
export async function runDevSeeds() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[Dev Seed] ⚠️  Skipping seeds in production');
    return;
  }
  
  console.log('[Dev Seed] 🌱 Running development seeds...');
  
  try {
    await seedAdminUser();
    await seedTestUsers();
    console.log('[Dev Seed] ✅ All seeds completed');
  } catch (error: any) {
    console.error('[Dev Seed] ❌ Error running seeds:', error.message);
  }
}

