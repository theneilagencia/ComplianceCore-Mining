import { Router } from 'express';
import { randomUUID } from 'crypto';
import { authenticateFromCookie } from '../payment/auth-helper';
import { getDb } from '../../db';
import { audits } from '../../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';

const router = Router();

// Middleware to require authentication
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const user = await authenticateFromCookie(req);
    req.user = user;
    next();
  } catch (error) {
    console.error('[Audits] Auth error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /api/audits - List user's audits
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    
    const userAudits = await db
      .select()
      .from(audits)
      .where(eq(audits.userId, userId))
      .orderBy(desc(audits.createdAt));

    res.json({
      audits: userAudits,
      total: userAudits.length,
    });
  } catch (error) {
    console.error('[Audits] List error:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// GET /api/audits/:id - Get specific audit
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const auditId = req.params.id;

    const audit = await db
      .select()
      .from(audits)
      .where(and(
        eq(audits.id, auditId),
        eq(audits.userId, userId)
      ))
      .limit(1);

    if (!audit || audit.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json(audit[0]);
  } catch (error) {
    console.error('[Audits] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// POST /api/audits - Create new audit
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const { title, type, reportId, findings } = req.body;

    const newAudit = await db
      .insert(audits)
      .values({
        id: `audit_${randomUUID()}`,
        userId,
        reportId: reportId || null,
        title: title || 'Nova Auditoria KRCI',
        type: type || 'KRCI',
        status: 'in_progress',
        findings: findings || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.json({
      success: true,
      audit: newAudit[0],
    });
  } catch (error) {
    console.error('[Audits] Create error:', error);
    res.status(500).json({ error: 'Failed to create audit' });
  }
});

// PUT /api/audits/:id - Update audit
router.put('/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const auditId = req.params.id;
    const { title, type, status, findings } = req.body;

    const updated = await db
      .update(audits)
      .set({
        title,
        type,
        status,
        findings,
        updatedAt: new Date(),
      })
      .where(and(
        eq(audits.id, auditId),
        eq(audits.userId, userId)
      ))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json({
      success: true,
      audit: updated[0],
    });
  } catch (error) {
    console.error('[Audits] Update error:', error);
    res.status(500).json({ error: 'Failed to update audit' });
  }
});

// DELETE /api/audits/:id - Delete audit
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const auditId = req.params.id;

    const deleted = await db
      .delete(audits)
      .where(and(
        eq(audits.id, auditId),
        eq(audits.userId, userId)
      ))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json({
      success: true,
      message: 'Audit deleted successfully',
    });
  } catch (error) {
    console.error('[Audits] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete audit' });
  }
});

export default router;

