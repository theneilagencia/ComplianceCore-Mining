import { Router } from 'express';
import { getDb } from '../../db';
import { users } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * POST /api/dev/make-admin
 * Temporary endpoint to promote a user to admin role
 * Should be removed or protected in production
 */
router.post('/make-admin', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = getDb();

    // Find user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];

    // Update role to admin
    await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.id, user.id));

    console.log(`[Dev] User promoted to admin: ${email}`);

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      user: {
        id: user.id,
        email: user.email,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('[Dev] Make admin error:', error);
    res.status(500).json({ error: 'Failed to promote user to admin' });
  }
});

export default router;

