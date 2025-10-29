import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { sql } from 'drizzle-orm';

const router = Router();

// Debug endpoint - REMOVE IN PRODUCTION
router.get('/debug/raw', async (req, res) => {
  try {
    const db = await getDb();
    
    // Test with raw SQL
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const users = await db.execute(sql`SELECT id, email, name FROM users LIMIT 5`);
    
    res.json({
      success: true,
      debug: {
        totalUsers: result.rows[0]?.count || 0,
        sampleUsers: users.rows,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Debug Raw] Error:', error);
    res.status(500).json({ 
      error: 'Debug raw query failed',
      message: error.message,
      stack: error.stack,
    });
  }
});

router.get('/debug/users', async (req, res) => {
  try {
    const db = await getDb();
    
    // Test 1: Count users
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    const totalUsers = countResult[0]?.count || 0;
    
    // Test 2: Get first 5 users with raw query
    const rawUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .limit(5);
    
    // Test 3: Count licenses
    const licenseCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(licenses);
    const totalLicenses = licenseCountResult[0]?.count || 0;
    
    res.json({
      success: true,
      debug: {
        totalUsers,
        totalLicenses,
        sampleUsers: rawUsers,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Debug] Error:', error);
    res.status(500).json({ 
      error: 'Debug query failed',
      message: error.message,
      stack: error.stack,
    });
  }
});

export default router;

