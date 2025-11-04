/**
 * Temporary DB Initialization Router
 * Creates tables and seeds development users
 * ⚠️ This is a one-time setup endpoint
 */

import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { hashPassword } from '../auth/service';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

const router = Router();

/**
 * POST /api/init-db
 * Initialize database with tables and seed users
 */
router.post('/init-db', async (req, res) => {
  try {
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({ 
        error: 'Database connection not available',
        message: 'DATABASE_URL not configured'
      });
    }

    console.log('[Init DB] Starting database initialization...');

    // Step 1: Create enums using raw postgres client (if not exist)
    console.log('[Init DB] Creating enums...');
    const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    const client = postgres(dbUrl, { ssl: 'require' });
    
    try {
      await client.unsafe(`CREATE TYPE role AS ENUM ('user', 'admin', 'parceiro', 'backoffice')`);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) console.log('[Init DB] ENUM role already exists or error:', e.message);
    }
    
    try {
      await client.unsafe(`CREATE TYPE plan AS ENUM ('START', 'PRO', 'ENTERPRISE')`);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) console.log('[Init DB] ENUM plan already exists or error:', e.message);
    }
    
    try {
      await client.unsafe(`CREATE TYPE license_status AS ENUM ('active', 'expired', 'cancelled', 'suspended')`);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) console.log('[Init DB] ENUM license_status already exists or error:', e.message);
    }
    
    try {
      await client.unsafe(`CREATE TYPE billing_period AS ENUM ('monthly', 'annual')`);
    } catch (e: any) {
      if (!e.message?.includes('already exists')) console.log('[Init DB] ENUM billing_period already exists or error:', e.message);
    }

    // Step 2: Create users table
    console.log('[Init DB] Creating users table...');
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name TEXT,
        email VARCHAR(320) UNIQUE NOT NULL,
        "passwordHash" TEXT,
        "googleId" VARCHAR(128),
        "loginMethod" VARCHAR(64),
        role role DEFAULT 'user' NOT NULL,
        "tenantId" VARCHAR(64) NOT NULL,
        "refreshToken" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "lastSignedIn" TIMESTAMP DEFAULT NOW()
      )
    `);

    // Step 3: Create licenses table
    console.log('[Init DB] Creating licenses table...');
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS licenses (
        id VARCHAR(64) PRIMARY KEY,
        "userId" VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "tenantId" VARCHAR(64) NOT NULL,
        plan plan DEFAULT 'START' NOT NULL,
        status license_status DEFAULT 'active' NOT NULL,
        "billingPeriod" billing_period,
        "stripeCustomerId" VARCHAR(128),
        "stripeSubscriptionId" VARCHAR(128),
        "stripePriceId" VARCHAR(128),
        "reportsLimit" INTEGER DEFAULT 1 NOT NULL,
        "reportsUsed" INTEGER DEFAULT 0 NOT NULL,
        "projectsLimit" INTEGER DEFAULT 1 NOT NULL,
        "validFrom" TIMESTAMP DEFAULT NOW() NOT NULL,
        "validUntil" TIMESTAMP,
        "lastResetAt" TIMESTAMP DEFAULT NOW(),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Close the postgres client to avoid connection conflicts
    await client.end();

    // Step 4: Seed development users
    console.log('[Init DB] Seeding development users...');
    
    const testUsers = [
      {
        id: 'admin_dev_001',
        email: 'admin@jorc.com',
        password: 'Admin@2025',
        name: 'Admin User',
        role: 'admin' as const,
        plan: 'ENTERPRISE' as const,
        reportsLimit: 15,
        projectsLimit: 999999,
        billingPeriod: 'annual' as const,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        id: 'test_dev_002',
        email: 'test@jorc.com',
        password: 'Test@2025',
        name: 'Test User',
        role: 'user' as const,
        plan: 'START' as const,
        reportsLimit: 1,
        projectsLimit: 1,
        billingPeriod: 'monthly' as const,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      {
        id: 'pro_dev_003',
        email: 'pro@jorc.com',
        password: 'Pro@2025',
        name: 'PRO User',
        role: 'user' as const,
        plan: 'PRO' as const,
        reportsLimit: 5,
        projectsLimit: 3,
        billingPeriod: 'monthly' as const,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    ];

    const createdUsers = [];

    for (const testUser of testUsers) {
      // Check if user exists
      const existing = await db.select().from(users).where(sql`email = ${testUser.email}`).limit(1);
      
      if (existing.length > 0) {
        console.log(`[Init DB] User ${testUser.email} already exists, skipping...`);
        createdUsers.push({ email: testUser.email, status: 'already_exists' });
        continue;
      }

      // Hash password
      const passwordHash = await hashPassword(testUser.password);

      // Insert user
      await db.insert(users).values({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        passwordHash,
        googleId: null,
        loginMethod: 'email',
        role: testUser.role,
        tenantId: 'default',
        refreshToken: null,
        createdAt: new Date(),
        lastSignedIn: new Date(),
      });

      // Insert license
      await db.insert(licenses).values({
        id: `lic_${testUser.id}`,
        userId: testUser.id,
        tenantId: 'default',
        plan: testUser.plan,
        status: 'active',
        billingPeriod: testUser.billingPeriod,
        reportsLimit: testUser.reportsLimit,
        reportsUsed: 0,
        projectsLimit: testUser.projectsLimit,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        validFrom: new Date(),
        validUntil: testUser.validUntil,
        lastResetAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`[Init DB] ✅ Created user: ${testUser.email} (${testUser.plan})`);
      createdUsers.push({ 
        email: testUser.email, 
        plan: testUser.plan,
        password: testUser.password,
        status: 'created' 
      });
    }

    console.log('[Init DB] ✅ Database initialization completed!');

    return res.json({
      success: true,
      message: 'Database initialized successfully',
      users: createdUsers,
      credentials: {
        admin: { email: 'admin@jorc.com', password: 'Admin@2025', plan: 'ENTERPRISE' },
        test: { email: 'test@jorc.com', password: 'Test@2025', plan: 'START' },
        pro: { email: 'pro@jorc.com', password: 'Pro@2025', plan: 'PRO' },
      },
      loginUrl: 'https://qivomining.com/login',
    });

  } catch (error: any) {
    console.error('[Init DB] Error:', error);
    return res.status(500).json({
      error: 'Database initialization failed',
      message: error.message,
      details: error.stack,
    });
  }
});

/**
 * GET /api/init-db/status
 * Check if database is initialized
 */
router.get('/init-db/status', async (req, res) => {
  try {
    const db = await getDb();
    
    if (!db) {
      return res.status(500).json({ 
        initialized: false,
        error: 'Database connection not available'
      });
    }

    // Check if users table exists and has data
    const userCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM users WHERE email IN ('admin@jorc.com', 'test@jorc.com', 'pro@jorc.com')
    `);

    const count = parseInt((userCount[0] as any).count || '0');

    return res.json({
      initialized: count === 3,
      userCount: count,
      expectedUsers: 3,
      status: count === 3 ? 'ready' : 'needs_initialization',
    });

  } catch (error: any) {
    return res.json({
      initialized: false,
      error: error.message,
      status: 'error',
    });
  }
});

export default router;

