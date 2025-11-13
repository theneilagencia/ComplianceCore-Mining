/**
 * On-Demand Reports Router
 * Handles one-time report purchases via Stripe Checkout
 * 
 * Report Types:
 * - Relatório Simplificado: $2,800
 * - Relatório Técnico Completo: $6,800
 * - Relatório Multinormativo: $9,800
 * - Relatório Auditável: $12,000
 * - Relatório ESG Integrado: $12,800
 * 
 * @module technical-reports/onDemand
 */

import { Router } from 'express';
import { getDb } from '../../../db';
import { users, onDemandReports } from '../../../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { authenticateFromCookie } from '../../payment/auth-helper';
import Stripe from 'stripe';
import { createId } from '@paralleldrive/cuid2';

const router = Router();

const STRIPE_KEY = process.env.STRIPE_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY, { apiVersion: '2025-10-29.clover' }) : null;

/**
 * Report types and prices (in cents)
 */
const REPORT_TYPES = {
  simplified: {
    name: 'Relatório Simplificado',
    price: 280000, // $2,800
    description: 'Diagnóstico rápido e padronizado da operação',
  },
  complete: {
    name: 'Relatório Técnico Completo',
    price: 680000, // $6,800
    description: 'Documento técnico completo e pronto para revisão de um Qualified Person (QP)',
  },
  multinorm: {
    name: 'Relatório Multinormativo',
    price: 980000, // $9,800
    description: 'Relatório inteligente compatível com múltiplos padrões internacionais',
  },
  auditable: {
    name: 'Relatório Auditável',
    price: 1200000, // $12,000
    description: 'Verificação automatizada e rastreável da conformidade técnica',
  },
  esg: {
    name: 'Relatório ESG Integrado',
    price: 1280000, // $12,800
    description: 'Integra governança técnica, ambiental e social em um único documento',
  },
};

/**
 * Middleware to authenticate user
 */
async function requireAuth(req: any, res: any, next: any) {
  try {
    const user = await authenticateFromCookie(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

/**
 * GET /api/technical-reports/on-demand/types
 * List available report types and prices
 */
router.get('/types', async (req, res) => {
  res.json({
    reportTypes: Object.entries(REPORT_TYPES).map(([key, value]) => ({
      id: key,
      ...value,
      priceUSD: value.price / 100,
    })),
  });
});

/**
 * POST /api/technical-reports/on-demand/checkout
 * Create Stripe Checkout session for one-time report purchase
 */
router.post('/checkout', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { reportType, projectId, projectName } = req.body;
    const userId = req.user.id;

    // Validate report type
    if (!REPORT_TYPES[reportType as keyof typeof REPORT_TYPES]) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    const reportConfig = REPORT_TYPES[reportType as keyof typeof REPORT_TYPES];

    // Get or create Stripe customer
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult[0];
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId && stripe) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, userId));
    }

    // Create on-demand report record
    const reportId = createId();
    await db.insert(onDemandReports).values({
      id: reportId,
      userId,
      tenantId: user.tenantId,
      reportType,
      projectId: projectId || null,
      projectName: projectName || null,
      status: 'pending_payment',
      priceUSD: reportConfig.price / 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create Stripe Checkout session
    if (!stripe) {
      // Mock mode
      return res.json({
        checkoutUrl: `https://checkout.stripe.com/mock/${reportId}`,
        reportId,
        mock: true,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId || undefined,
      customer_email: !stripeCustomerId ? user.email : undefined,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: reportConfig.name,
              description: reportConfig.description,
              metadata: {
                reportId,
                reportType,
                userId,
              },
            },
            unit_amount: reportConfig.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        reportId,
        reportType,
        userId,
        projectId: projectId || '',
      },
      success_url: `${process.env.FRONTEND_URL || 'https://qivomining.com'}/reports/on-demand/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://qivomining.com'}/reports/on-demand`,
    });

    res.json({
      checkoutUrl: session.url,
      reportId,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('[On-Demand] Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * GET /api/technical-reports/on-demand/my-reports
 * List user's on-demand reports
 */
router.get('/my-reports', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const userId = req.user.id;

    const reports = await db
      .select()
      .from(onDemandReports)
      .where(eq(onDemandReports.userId, userId))
      .orderBy(onDemandReports.createdAt);

    res.json({ reports });
  } catch (error: any) {
    console.error('[On-Demand] List reports error:', error);
    res.status(500).json({ error: 'Failed to list reports' });
  }
});

/**
 * GET /api/technical-reports/on-demand/:reportId
 * Get on-demand report details
 */
router.get('/:reportId', requireAuth, async (req: any, res) => {
  try {
    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const { reportId } = req.params;
    const userId = req.user.id;

    const reportResult = await db
      .select()
      .from(onDemandReports)
      .where(eq(onDemandReports.id, reportId))
      .limit(1);

    if (reportResult.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportResult[0];

    // Check ownership
    if (report.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ report });
  } catch (error: any) {
    console.error('[On-Demand] Get report error:', error);
    res.status(500).json({ error: 'Failed to get report' });
  }
});

/**
 * POST /api/technical-reports/on-demand/webhook
 * Handle Stripe webhook for payment confirmation
 */
router.post('/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
      console.log('[On-Demand] Webhook: Stripe not configured');
      return res.status(200).json({ received: true, mock: true });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error('[On-Demand] Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const reportId = session.metadata?.reportId;

      if (reportId) {
        const db = await getDb();
        if (db) {
          await db
            .update(onDemandReports)
            .set({
              status: 'paid',
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent,
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(onDemandReports.id, reportId));

          console.log(`[On-Demand] Report ${reportId} marked as paid`);

          // TODO: Trigger report generation workflow
        }
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[On-Demand] Webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

export default router;
