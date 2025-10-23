/**
 * License Router
 * Handles license status, verification, and management
 */

import express, { type Request, type Response } from 'express';
import { sdk } from '../../_core/sdk';
import * as licenseService from './service';

const router = express.Router();

/**
 * GET /api/license/status
 * Get current user's license status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const license = await licenseService.getUserLicense(user.id);

    if (!license) {
      res.status(404).json({
        error: 'No active license found',
      });
      return;
    }

    const stats = await licenseService.getLicenseStats(license.id);

    res.json({
      license: {
        id: license.id,
        plan: license.plan,
        status: license.status,
        billingPeriod: license.billingPeriod,
        validFrom: license.validFrom,
        validUntil: license.validUntil,
      },
      stats,
    });
  } catch (error: any) {
    console.error('[License] Status error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get license status',
    });
  }
});

/**
 * GET /api/license/can-create-report
 * Check if user can create a new report
 */
router.get('/can-create-report', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const result = await licenseService.canCreateReport(user.id);

    res.json(result);
  } catch (error: any) {
    console.error('[License] Can create report error:', error);
    res.status(500).json({
      error: error.message || 'Failed to check report creation permission',
    });
  }
});

/**
 * POST /api/license/use-report
 * Increment report usage (called when creating a report)
 */
router.post('/use-report', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const result = await licenseService.canCreateReport(user.id);

    if (!result.allowed) {
      res.status(403).json({
        error: result.reason,
        license: result.license,
      });
      return;
    }

    await licenseService.incrementReportUsage(result.license!.id);

    const updatedLicense = await licenseService.getUserLicense(user.id);
    const stats = await licenseService.getLicenseStats(updatedLicense!.id);

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[License] Use report error:', error);
    res.status(500).json({
      error: error.message || 'Failed to use report',
    });
  }
});

/**
 * GET /api/license/plans
 * Get available plans and pricing
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = Object.entries(licenseService.PLAN_LIMITS).map(([plan, limits]) => ({
      name: plan,
      reportsLimit: limits.reportsLimit,
      projectsLimit: limits.projectsLimit === -1 ? 'unlimited' : limits.projectsLimit,
      priceMonthly: limits.price,
      priceAnnual: 'priceAnnual' in limits ? limits.priceAnnual : null,
    }));

    res.json({ plans });
  } catch (error: any) {
    console.error('[License] Plans error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get plans',
    });
  }
});

/**
 * GET /api/license/subscription
 * Get detailed subscription information
 */
router.get('/subscription', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const license = await licenseService.getUserLicense(user.id);

    if (!license) {
      res.status(404).json({
        error: 'No active license found',
      });
      return;
    }

    let subscriptionDetails = null;
    if (license.stripeSubscriptionId) {
      const stripeService = await import('../payment/stripe');
      const subscription = await stripeService.getSubscription(license.stripeSubscriptionId);
      
      subscriptionDetails = {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
      };
    }

    const stats = await licenseService.getLicenseStats(license.id);

    res.json({
      license: {
        id: license.id,
        plan: license.plan,
        status: license.status,
        billingPeriod: license.billingPeriod,
        validFrom: license.validFrom,
        validUntil: license.validUntil,
        stripeCustomerId: license.stripeCustomerId,
        stripeSubscriptionId: license.stripeSubscriptionId,
      },
      subscription: subscriptionDetails,
      stats,
    });
  } catch (error: any) {
    console.error('[License] Subscription error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get subscription details',
    });
  }
});

/**
 * GET /api/license/invoices
 * Get customer invoices
 */
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const license = await licenseService.getUserLicense(user.id);

    if (!license || !license.stripeCustomerId) {
      res.json({ invoices: [] });
      return;
    }

    const stripeService = await import('../payment/stripe');
    const invoices = await stripeService.getCustomerInvoices(license.stripeCustomerId);

    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      created: new Date(invoice.created * 1000),
      pdfUrl: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
    }));

    res.json({ invoices: formattedInvoices });
  } catch (error: any) {
    console.error('[License] Invoices error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get invoices',
    });
  }
});

/**
 * POST /api/license/change-plan
 * Change subscription plan
 */
router.post('/change-plan', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const { plan, billingPeriod } = req.body;

    if (!['PRO', 'ENTERPRISE'].includes(plan)) {
      res.status(400).json({
        error: 'Invalid plan. Must be PRO or ENTERPRISE',
      });
      return;
    }

    if (!['monthly', 'annual'].includes(billingPeriod)) {
      res.status(400).json({
        error: 'Invalid billing period. Must be monthly or annual',
      });
      return;
    }

    const license = await licenseService.getUserLicense(user.id);

    if (!license || !license.stripeSubscriptionId) {
      res.status(400).json({
        error: 'No active subscription found',
      });
      return;
    }

    const stripeService = await import('../payment/stripe');
    const newPriceId = stripeService.getPriceId(plan, billingPeriod);

    if (!newPriceId) {
      res.status(400).json({
        error: 'Invalid plan or billing period',
      });
      return;
    }

    // Update subscription in Stripe
    await stripeService.updateSubscription(license.stripeSubscriptionId, newPriceId);

    // Update license in database
    await licenseService.upgradeLicense(
      license.id,
      plan,
      billingPeriod,
      {
        subscriptionId: license.stripeSubscriptionId,
        priceId: newPriceId,
      }
    );

    res.json({
      success: true,
      message: 'Plan changed successfully',
    });
  } catch (error: any) {
    console.error('[License] Change plan error:', error);
    res.status(500).json({
      error: error.message || 'Failed to change plan',
    });
  }
});

/**
 * POST /api/license/portal
 * Create Stripe Customer Portal session
 */
router.post('/portal', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const license = await licenseService.getUserLicense(user.id);

    if (!license || !license.stripeCustomerId) {
      res.status(400).json({
        error: 'No Stripe customer found',
      });
      return;
    }

    const stripeService = await import('../payment/stripe');
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const returnUrl = `${baseUrl}/subscription`;

    const portalUrl = await stripeService.createCustomerPortalSession(
      license.stripeCustomerId,
      returnUrl
    );

    res.json({
      url: portalUrl,
    });
  } catch (error: any) {
    console.error('[License] Portal error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create portal session',
    });
  }
});

/**
 * POST /api/license/cancel
 * Cancel current subscription
 */
router.post('/cancel', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const license = await licenseService.getUserLicense(user.id);

    if (!license) {
      res.status(404).json({
        error: 'No active license found',
      });
      return;
    }

    if (license.plan === 'START') {
      res.status(400).json({
        error: 'Cannot cancel free plan',
      });
      return;
    }

    await licenseService.cancelLicense(license.id);

    // Also cancel in Stripe if subscription exists
    if (license.stripeSubscriptionId) {
      const stripeService = await import('../payment/stripe');
      await stripeService.cancelSubscription(license.stripeSubscriptionId);
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error: any) {
    console.error('[License] Cancel error:', error);
    res.status(500).json({
      error: error.message || 'Failed to cancel subscription',
    });
  }
});

export default router;

