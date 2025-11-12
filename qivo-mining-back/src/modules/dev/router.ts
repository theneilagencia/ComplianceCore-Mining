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

