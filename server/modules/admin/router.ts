import { Router } from 'express';
import { getDb } from '../../db';
import { users, licenses } from '../../../drizzle/schema';
import { eq, desc, sql, and, gte } from 'drizzle-orm';
import { authenticateFromCookie } from '../payment/auth-helper';

const router = Router();

// Middleware to check if user is admin
async function requireAdmin(req: any, res: any, next: any) {
  try {
    const user = await authenticateFromCookie(req);
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('[Admin] Access denied for user:', user.email, 'role:', user.role);
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    
    console.log('[Admin] Access granted for admin:', user.email);

    req.user = user;
    next();
  } catch (error) {
    console.error('[Admin] Auth error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();

    // Total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Active licenses by plan
    const licensesByPlan = await db
      .select({
        plan: licenses.plan,
        count: sql<number>`count(*)::int`,
      })
      .from(licenses)
      .where(eq(licenses.status, 'active'))
      .groupBy(licenses.plan);

    // Recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));
    const recentUsers = recentUsersResult[0]?.count || 0;

    // Calculate MRR (Monthly Recurring Revenue)
    const planPrices: Record<string, number> = {
      'START': 0,
      'PRO': 899,
      'ENTERPRISE': 1990,
    };

    let mrr = 0;
    licensesByPlan.forEach(({ plan, count }) => {
      mrr += (planPrices[plan] || 0) * count;
    });

    res.json({
      totalUsers,
      recentUsers,
      licensesByPlan,
      mrr,
      stats: {
        startUsers: licensesByPlan.find(l => l.plan === 'START')?.count || 0,
        proUsers: licensesByPlan.find(l => l.plan === 'PRO')?.count || 0,
        enterpriseUsers: licensesByPlan.find(l => l.plan === 'ENTERPRISE')?.count || 0,
      },
    });
  } catch (error) {
    console.error('[Admin] Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/admin/users - List all users with pagination
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    // Build query - fetch users and licenses separately to avoid nested object issues
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        licenseId: licenses.id,
        licensePlan: licenses.plan,
        licenseStatus: licenses.status,
        reportsUsed: licenses.reportsUsed,
        reportsLimit: licenses.reportsLimit,
        projectsActive: licenses.projectsActive,
        projectsLimit: licenses.projectsLimit,
      })
      .from(users)
      .leftJoin(licenses, and(
        eq(users.id, licenses.userId),
        eq(licenses.status, 'active')
      ))
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform to expected format
    const transformedUsers = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      license: u.licenseId ? {
        id: u.licenseId,
        plan: u.licensePlan,
        status: u.licenseStatus,
        reportsUsed: u.reportsUsed,
        reportsLimit: u.reportsLimit,
        projectsActive: u.projectsActive,
        projectsLimit: u.projectsLimit,
      } : null,
    }));

    // Filter by search if provided
    let filteredUsers = transformedUsers;
    if (search) {
      filteredUsers = transformedUsers.filter(u => 
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    const total = totalResult[0]?.count || 0;

    res.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin] Users list error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:userId - Get user details
router.get('/users/:userId', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { userId } = req.params;

    // Get user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Get all licenses (including inactive)
    const userLicenses = await db
      .select()
      .from(licenses)
      .where(eq(licenses.userId, userId))
      .orderBy(desc(licenses.createdAt));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      licenses: userLicenses,
    });
  } catch (error) {
    console.error('[Admin] User details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// POST /api/admin/users/:userId/license - Update user license
router.post('/users/:userId/license', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const { userId } = req.params;
    const { plan, status } = req.body;

    if (!plan || !status) {
      return res.status(400).json({ error: 'Plan and status are required' });
    }

    // Get active license
    const activeLicenses = await db
      .select()
      .from(licenses)
      .where(and(
        eq(licenses.userId, userId),
        eq(licenses.status, 'active')
      ))
      .limit(1);

    if (activeLicenses.length === 0) {
      return res.status(404).json({ error: 'No active license found' });
    }

    const license = activeLicenses[0];

    // Update license
    const planLimits: Record<string, { reports: number; projects: number }> = {
      'START': { reports: 1, projects: 1 },
      'PRO': { reports: 5, projects: 3 },
      'ENTERPRISE': { reports: 15, projects: 999 },
    };

    const limits = planLimits[plan] || planLimits['START'];

    await db
      .update(licenses)
      .set({
        plan,
        status,
        reportsLimit: limits.reports,
        projectsLimit: limits.projects,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, license.id));

    res.json({ success: true, message: 'License updated successfully' });
  } catch (error) {
    console.error('[Admin] Update license error:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
});

// GET /api/admin/subscriptions - List all active subscriptions
router.get('/subscriptions', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();

    const subscriptions = await db
      .select({
        licenseId: licenses.id,
        userId: licenses.userId,
        userEmail: users.email,
        userName: users.fullName,
        plan: licenses.plan,
        status: licenses.status,
        reportsUsed: licenses.reportsUsed,
        reportsLimit: licenses.reportsLimit,
        projectsActive: licenses.projectsActive,
        projectsLimit: licenses.projectsLimit,
        stripeSubscriptionId: licenses.stripeSubscriptionId,
        createdAt: licenses.createdAt,
        expiresAt: licenses.expiresAt,
      })
      .from(licenses)
      .leftJoin(users, eq(licenses.userId, users.id))
      .where(eq(licenses.status, 'active'))
      .orderBy(desc(licenses.createdAt));

    res.json({ subscriptions });
  } catch (error) {
    console.error('[Admin] Subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// GET /api/admin/revenue - Revenue statistics
router.get('/revenue', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();

    // Get active licenses by plan
    const licensesByPlan = await db
      .select({
        plan: licenses.plan,
        count: sql<number>`count(*)::int`,
      })
      .from(licenses)
      .where(eq(licenses.status, 'active'))
      .groupBy(licenses.plan);

    // Plan prices (monthly)
    const planPrices: Record<string, number> = {
      'START': 0,
      'PRO': 899,
      'ENTERPRISE': 1990,
    };

    // Calculate MRR and ARR
    let mrr = 0;
    const revenueByPlan: Record<string, { count: number; revenue: number }> = {};

    licensesByPlan.forEach(({ plan, count }) => {
      const price = planPrices[plan] || 0;
      const revenue = price * count;
      mrr += revenue;
      revenueByPlan[plan] = { count, revenue };
    });

    const arr = mrr * 12;

    res.json({
      mrr,
      arr,
      revenueByPlan,
      totalActiveSubscriptions: licensesByPlan.reduce((sum, l) => sum + l.count, 0),
    });
  } catch (error) {
    console.error('[Admin] Revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue statistics' });
  }
});

export default router;

