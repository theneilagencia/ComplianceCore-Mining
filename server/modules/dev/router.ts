/**
 * Development Router
 * Provides development-only routes for testing without OAuth/Stripe
 */

import { Router, Request, Response } from 'express';
import { runDevSeeds } from './seed';
import { createQivoAdmin } from './create-qivo-admin';
import { loginUser } from '../auth/service';
import { getUserLicense, upgradeLicense } from '../licenses/service';
import type { Plan } from '../licenses/service';

const router = Router();

// Only enable in development
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Initialize development data
 * POST /api/dev/init
 */
router.post('/init', async (req: Request, res: Response) => {
  if (!isDev) {
    return res.status(403).json({ error: 'Development routes disabled in production' });
  }
  
  try {
    await runDevSeeds();
    res.json({ 
      success: true,
      message: 'Development data initialized',
      credentials: {
        admin: { email: 'admin@jorc.com', password: 'Admin@2025', plan: 'ENTERPRISE' },
        test: { email: 'test@jorc.com', password: 'Test@2025', plan: 'START' },
        pro: { email: 'pro@jorc.com', password: 'Pro@2025', plan: 'PRO' },
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Quick login (bypass OAuth)
 * POST /api/dev/login
 * Body: { email: string, password: string }
 */
router.post('/login', async (req: Request, res: Response) => {
  if (!isDev) {
    return res.status(403).json({ error: 'Development routes disabled in production' });
  }
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const result = await loginUser({ email, password });
    
    res.json({
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

/**
 * Simulate payment (bypass Stripe)
 * POST /api/dev/simulate-payment
 * Body: { userId: string, plan: 'PRO' | 'ENTERPRISE', billingPeriod: 'monthly' | 'annual' }
 */
router.post('/simulate-payment', async (req: Request, res: Response) => {
  if (!isDev) {
    return res.status(403).json({ error: 'Development routes disabled in production' });
  }
  
  try {
    const { userId, plan, billingPeriod } = req.body;
    
    if (!userId || !plan || !billingPeriod) {
      return res.status(400).json({ error: 'userId, plan, and billingPeriod required' });
    }
    
    if (plan !== 'PRO' && plan !== 'ENTERPRISE') {
      return res.status(400).json({ error: 'Invalid plan. Must be PRO or ENTERPRISE' });
    }
    
    // Simulate successful payment by upgrading license
    const license = await upgradeLicense(userId, plan, billingPeriod, {
      subscriptionId: 'sim_' + Date.now(),
      priceId: 'price_sim_' + plan,
    });
    
    res.json({
      success: true,
      message: `Payment simulated successfully. License upgraded to ${plan}`,
      license: {
        plan: license.plan,
        status: license.status,
        billingPeriod: license.billingPeriod,
        reportsLimit: license.reportsLimit,
        projectsLimit: license.projectsLimit,
        validUntil: license.validUntil,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get user info with license
 * GET /api/dev/user/:userId
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  if (!isDev) {
    return res.status(403).json({ error: 'Development routes disabled in production' });
  }
  
  try {
    const { userId } = req.params;
    
    const license = await getUserLicense(userId);
    
    if (!license) {
      return res.status(404).json({ error: 'User or license not found' });
    }
    
    res.json({
      success: true,
      license: {
        plan: license.plan,
        status: license.status,
        billingPeriod: license.billingPeriod,
        reportsLimit: license.reportsLimit,
        reportsUsed: license.reportsUsed,
        projectsLimit: license.projectsLimit,
        validUntil: license.validUntil,
        lastResetAt: license.lastResetAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create QIVO Admin User
 * POST /api/dev/create-qivo-admin
 */
router.post('/create-qivo-admin', async (req: Request, res: Response) => {
  try {
    const result = await createQivoAdmin();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Setup Database (push schema + create admin)
 * POST /api/dev/setup-database
 */
router.post('/setup-database', async (req: Request, res: Response) => {
  try {
    const results: any = {
      schema: 'pending',
      adminUser: 'pending',
      errors: [],
    };
    
    // Step 1: Push schema to database using raw SQL
    try {
      const { getSqlClient } = await import('../../db');
      const sqlClient = await getSqlClient();
      
      if (!sqlClient) {
        throw new Error('SQL client not available');
      }
      
      // Create enums first
      await sqlClient`
        DO $$ BEGIN
          CREATE TYPE role AS ENUM ('user', 'admin', 'parceiro', 'backoffice');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      
      await sqlClient`
        DO $$ BEGIN
          CREATE TYPE plan AS ENUM ('START', 'PRO', 'ENTERPRISE');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      
      await sqlClient`
        DO $$ BEGIN
          CREATE TYPE license_status AS ENUM ('active', 'expired', 'cancelled', 'suspended');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      
      await sqlClient`
        DO $$ BEGIN
          CREATE TYPE billing_period AS ENUM ('monthly', 'annual');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `;
      
      // Create users table
      await sqlClient`
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
          "stripeCustomerId" VARCHAR(128),
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "lastSignedIn" TIMESTAMP DEFAULT NOW()
        )
      `;
      
      // Add stripeCustomerId column if it doesn't exist (for existing tables)
      await sqlClient`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS "stripeCustomerId" VARCHAR(128)
      `;
      
      // Create licenses table
      await sqlClient`
        CREATE TABLE IF NOT EXISTS licenses (
          id VARCHAR(64) PRIMARY KEY,
          "userId" VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          "tenantId" VARCHAR(64) NOT NULL,
          plan plan DEFAULT 'START' NOT NULL,
          status license_status DEFAULT 'active' NOT NULL,
          "billingPeriod" billing_period DEFAULT 'monthly' NOT NULL,
          "reportsLimit" INTEGER DEFAULT 5 NOT NULL,
          "projectsLimit" INTEGER DEFAULT 3 NOT NULL,
          "reportsUsed" INTEGER DEFAULT 0 NOT NULL,
          "stripeCustomerId" VARCHAR(255),
          "stripeSubscriptionId" VARCHAR(255),
          "stripePriceId" VARCHAR(255),
          "validFrom" TIMESTAMP DEFAULT NOW(),
          "validUntil" TIMESTAMP,
          "lastResetAt" TIMESTAMP DEFAULT NOW()
        )
      `;
      
      results.schema = 'success';
    } catch (error: any) {
      results.schema = 'failed';
      results.errors.push(`Schema: ${error.message}`);
    }
    
    // Step 2: Create admin user using raw SQL
    try {
      const { getSqlClient } = await import('../../db');
      const { hashPassword } = await import('../auth/service');
      const { createId } = await import('@paralleldrive/cuid2');
      
      const sqlClient = await getSqlClient();
      
      if (!sqlClient) {
        throw new Error('SQL client not available');
      }
      
      const adminEmail = 'admin@qivo-mining.com';
      const adminPassword = 'Bigtrade@4484';
      
      // Check if admin already exists using raw SQL
      const existing = await sqlClient`
        SELECT id, email FROM users WHERE email = ${adminEmail} LIMIT 1
      `;
      
      if (existing.length > 0) {
        results.adminUser = 'already_exists';
        results.adminData = { email: adminEmail, id: existing[0].id };
      } else {
        // Create admin user with raw SQL
        const adminId = createId();
        const passwordHash = await hashPassword(adminPassword);
        
        await sqlClient`
          INSERT INTO users (
            id, email, name, "passwordHash", "googleId", "loginMethod",
            role, "tenantId", "refreshToken", "stripeCustomerId",
            "createdAt", "lastSignedIn"
          ) VALUES (
            ${adminId},
            ${adminEmail},
            'QIVO Admin',
            ${passwordHash},
            NULL,
            'email',
            'admin',
            'default',
            NULL,
            NULL,
            NOW(),
            NOW()
          )
        `;
        
        // Create ENTERPRISE license with raw SQL
        const licenseId = createId();
        const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        
        await sqlClient`
          INSERT INTO licenses (
            id, "userId", "tenantId", plan, status, "billingPeriod",
            "reportsLimit", "projectsLimit", "reportsUsed",
            "stripeCustomerId", "stripeSubscriptionId", "stripePriceId",
            "validFrom", "validUntil", "lastResetAt"
          ) VALUES (
            ${licenseId},
            ${adminId},
            'default',
            'ENTERPRISE',
            'active',
            'annual',
            15,
            999999,
            0,
            NULL,
            NULL,
            NULL,
            NOW(),
            ${validUntil}::timestamp,
            NOW()
          )
        `;
        
        results.adminUser = 'created';
        results.adminData = { email: adminEmail, id: adminId };
      }
    } catch (error: any) {
      results.adminUser = 'failed';
      results.errors.push(`Admin user: ${error.message}`);
    }
    
    // Verify using raw SQL
    try {
      const { getSqlClient } = await import('../../db');
      const sqlClient = await getSqlClient();
      
      if (sqlClient) {
        const userCount = await sqlClient`SELECT COUNT(*) as count FROM users`;
        results.userCount = parseInt(userCount[0].count);
      }
    } catch (error: any) {
      results.errors.push(`Verification: ${error.message}`);
    }
    
    const success = results.errors.length === 0;
    
    res.status(success ? 200 : 500).json({
      success,
      message: success ? 'Database setup completed' : 'Database setup with errors',
      results,
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Health check for dev mode
 * GET /api/dev/status
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    devMode: isDev,
    message: isDev 
      ? 'Development mode enabled. Use /api/dev/init to create test users.'
      : 'Development mode disabled (production)',
    endpoints: isDev ? [
      'POST /api/dev/init - Initialize test users',
      'POST /api/dev/login - Quick login',
      'POST /api/dev/simulate-payment - Simulate Stripe payment',
      'GET /api/dev/user/:userId - Get user license info',
    ] : [],
  });
});

export default router;

