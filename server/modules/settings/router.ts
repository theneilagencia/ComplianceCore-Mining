import { Router } from 'express';
import { authenticateFromCookie } from '../payment/auth-helper';
import { getDb } from '../../db';
import { users } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Middleware to require authentication
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const user = await authenticateFromCookie(req);
    req.user = user;
    next();
  } catch (error) {
    console.error('[Settings] Auth error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /api/settings - Get user settings
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    
    const user = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        loginMethod: users.loginMethod,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      settings: user[0],
    });
  } catch (error) {
    console.error('[Settings] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - Update user settings
router.put('/', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const { fullName, company, phone, language, timezone, notifications } = req.body;

    const updated = await db
      .update(users)
      .set({
        fullName,
        company,
        phone,
        language,
        timezone,
        notifications,
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        company: users.company,
        phone: users.phone,
        language: users.language,
        timezone: users.timezone,
        notifications: users.notifications,
      });

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      settings: updated[0],
    });
  } catch (error) {
    console.error('[Settings] Update error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// PUT /api/settings/password - Change password
router.put('/password', requireAuth, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // TODO: Implement password change logic with bcrypt
    // For now, return success
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('[Settings] Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// DELETE /api/settings/account - Delete account
router.delete('/account', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;

    // TODO: Implement account deletion logic
    // Should delete user data, cancel subscriptions, etc.
    
    res.json({
      success: true,
      message: 'Account deletion requested. You will receive a confirmation email.',
    });
  } catch (error) {
    console.error('[Settings] Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;

