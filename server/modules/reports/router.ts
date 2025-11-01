import { Router } from 'express';
import { randomUUID } from 'crypto';
import { authenticateFromCookie } from '../payment/auth-helper';
import { getDb } from '../../db';
import { reports, users } from '../../../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';

const router = Router();

// Middleware to require authentication
const requireAuth = async (req: any, res: any, next: any) => {
  try {
    const user = await authenticateFromCookie(req);
    req.user = user;
    next();
  } catch (error) {
    console.error('[Reports] Auth error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// GET /api/reports - List user's reports
router.get('/', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    
    const userReports = await db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId))
      .orderBy(desc(reports.createdAt));

    res.json({
      reports: userReports,
      total: userReports.length,
    });
  } catch (error) {
    console.error('[Reports] List error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/:id - Get specific report
router.get('/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const reportId = req.params.id;

    const report = await db
      .select()
      .from(reports)
      .where(and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      ))
      .limit(1);

    if (!report || report.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report[0]);
  } catch (error) {
    console.error('[Reports] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// POST /api/reports - Create new report
router.post('/', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const { title, type, projectId, data } = req.body;

    const newReport = await db
      .insert(reports)
      .values({
        id: `report_${randomUUID()}`,
        userId,
        projectId: projectId || null,
        title: title || 'Novo Relatório',
        type: type || 'JORC',
        status: 'draft',
        data: data || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.json({
      success: true,
      report: newReport[0],
    });
  } catch (error) {
    console.error('[Reports] Create error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// PUT /api/reports/:id - Update report
router.put('/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const reportId = req.params.id;
    const { title, type, status, data } = req.body;

    const updated = await db
      .update(reports)
      .set({
        title,
        type,
        status,
        data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      ))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      report: updated[0],
    });
  } catch (error) {
    console.error('[Reports] Update error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// POST /api/reports/save - Save new complete report
router.post('/save', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const data = req.body;

    const newReport = await db
      .insert(reports)
      .values({
        id: `report_${randomUUID()}`,
        userId,
        title: data.title || 'Novo Relatório',
        type: data.standard || 'JORC',
        status: 'draft',
        data: data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.json({
      success: true,
      reportId: newReport[0].id,
      message: 'Relatório salvo com sucesso',
    });
  } catch (error) {
    console.error('[Reports] Save error:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// POST /api/reports/:id/save - Update existing report
router.post('/:id/save', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const reportId = req.params.id;
    const data = req.body;

    const updated = await db
      .update(reports)
      .set({
        title: data.title,
        type: data.standard,
        data: data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      ))
      .returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      reportId: updated[0].id,
      message: 'Relatório atualizado com sucesso',
    });
  } catch (error) {
    console.error('[Reports] Update save error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /api/reports/:id - Delete report
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    const userId = req.user.id;
    const reportId = req.params.id;

    const deleted = await db
      .delete(reports)
      .where(and(
        eq(reports.id, reportId),
        eq(reports.userId, userId)
      ))
      .returning();

    if (!deleted || deleted.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('[Reports] Delete error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;

