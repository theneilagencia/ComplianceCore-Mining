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

    // Implement password change logic with bcrypt
    const db = await getDb();
    const userId = req.user.id;
    const bcrypt = require('bcryptjs');
    
    // Get user from database
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user || user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentUser = user[0];
    
    // Verify current password
    if (!currentUser.passwordHash) {
      return res.status(400).json({ error: 'Password not set. Please use password reset.' });
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, currentUser.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
    
    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in database
    await db
      .update(users)
      .set({ passwordHash: newPasswordHash })
      .where(eq(users.id, userId));
    
    console.log(`[Settings] Password changed for user ${userId}`);
    
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

    // Implement account deletion logic (soft delete)
    const { password } = req.body;
    const bcrypt = require('bcryptjs');
    
    if (!password) {
      return res.status(400).json({ error: 'Password confirmation required to delete account' });
    }
    
    // Get user from database
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user || user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentUser = user[0];
    
    // Verify password
    if (currentUser.passwordHash) {
      const isValidPassword = await bcrypt.compare(password, currentUser.passwordHash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Password is incorrect' });
      }
    }
    
    // Soft delete: anonymize user data instead of hard delete
    const anonymizedEmail = `deleted_${userId}@qivomining.com`;
    
    await db
      .update(users)
      .set({
        name: 'Deleted User',
        email: anonymizedEmail,
        passwordHash: null,
        googleId: null,
        refreshToken: null,
      })
      .where(eq(users.id, userId));
    
    // TODO: Cancel active subscriptions in Stripe
    // const { licenses } = await import('../../../drizzle/schema');
    // await db.update(licenses).set({ status: 'cancelled' }).where(eq(licenses.userId, userId));
    
    console.log(`[Settings] Account soft-deleted for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Account has been deleted. Your data has been anonymized.',
    });
  } catch (error) {
    console.error('[Settings] Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;

