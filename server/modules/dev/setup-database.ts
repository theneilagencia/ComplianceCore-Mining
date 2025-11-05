/**
 * Database Setup Endpoint
 * POST /api/dev/setup-database
 * 
 * This endpoint will:
 * 1. Run all migrations
 * 2. Create admin user if not exists
 * 3. Return status
 */

import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { hashPassword } from '../auth/service';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const router = Router();

router.post('/setup-database', async (req, res) => {
  try {
    console.log('🔧 Starting database setup...');
    
    const db = await getDb();
    
    if (!db) {
      throw new Error('Database not available');
    }
    
    const results = {
      migrations: 'pending',
      adminUser: 'pending',
      errors: [] as string[],
    };
    
    // Step 1: Run migrations
    try {
      console.log('📦 Running migrations...');
      
      // Get connection string from env
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error('DATABASE_URL not set');
      }
      
      // Create migration client
      const migrationClient = postgres(connectionString, { max: 1 });
      
      // Run migrations
      await migrate(db as any, { migrationsFolder: './drizzle' });
      
      await migrationClient.end();
      
      results.migrations = 'success';
      console.log('✅ Migrations completed');
    } catch (error: any) {
      console.error('❌ Migration error:', error.message);
      results.migrations = 'failed';
      results.errors.push(`Migrations: ${error.message}`);
    }
    
    // Step 2: Create admin user
    try {
      console.log('👤 Creating admin user...');
      
      const adminEmail = 'admin@qivo-mining.com';
      const adminPassword = 'Bigtrade@4484';
      
      // Check if admin already exists
      const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
      
      if (existing.length > 0) {
        console.log('✅ Admin user already exists');
        results.adminUser = 'already_exists';
      } else {
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
        results.adminUser = 'created';
      }
    } catch (error: any) {
      console.error('❌ Admin creation error:', error.message);
      results.adminUser = 'failed';
      results.errors.push(`Admin user: ${error.message}`);
    }
    
    // Step 3: Verify database state
    try {
      const userCount = await db.select().from(users).execute();
      console.log(`📊 Total users in database: ${userCount.length}`);
      
      results['userCount'] = userCount.length;
    } catch (error: any) {
      console.error('❌ Verification error:', error.message);
      results.errors.push(`Verification: ${error.message}`);
    }
    
    // Return results
    const success = results.errors.length === 0;
    
    res.status(success ? 200 : 500).json({
      success,
      message: success ? 'Database setup completed successfully' : 'Database setup completed with errors',
      results,
    });
    
  } catch (error: any) {
    console.error('❌ Setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});

export default router;
