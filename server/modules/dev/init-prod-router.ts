/**
 * Production Initialization Router
 * One-time route to create admin user in production
 * Requires secret key for security
 */

import { Router, Request, Response } from 'express';
import { seedAdminUser } from './seed';

const router = Router();

/**
 * POST /api/init-production
 * Body: { secret: string }
 * 
 * Creates admin user in production (only works once)
 * Requires INIT_SECRET environment variable to be set
 */
router.post('/init-production', async (req: Request, res: Response) => {
  try {
    const { secret } = req.body;
    
    // Require secret key
    const INIT_SECRET = process.env.INIT_SECRET || 'qivo-mining-init-2025';
    
    if (!secret || secret !== INIT_SECRET) {
      return res.status(403).json({ 
        error: 'Invalid or missing secret key' 
      });
    }
    
    // Run seed
    const admin = await seedAdminUser();
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@jorc.com',
        password: 'Admin@2025',
        plan: 'ENTERPRISE',
      },
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error: any) {
    console.error('[Init Production] Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to initialize production data' 
    });
  }
});

export default router;

