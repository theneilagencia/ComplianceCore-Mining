/**
 * Payment Router
 * Handles Stripe checkout and webhooks
 */

import express, { type Request, type Response } from 'express';
import { sdk } from '../../_core/sdk';
import * as stripeService from './stripe';
import * as licenseService from '../licenses/service';
import { authenticateFromCookie } from './auth-helper';

const router = express.Router();

/**
 * POST /api/payment/checkout
 * Create Stripe checkout session
 */
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    // Use cookie-based authentication as fallback until SDK build issue is resolved
    const user = await authenticateFromCookie(req);

    const { plan, billingPeriod } = req.body;

    if (!plan || !billingPeriod) {
      res.status(400).json({
        error: 'Missing required fields: plan, billingPeriod',
      });
      return;
    }

    if (plan === 'START') {
      res.status(400).json({
        error: 'START plan is free and does not require checkout',
      });
      return;
    }

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

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;

    const session = await stripeService.createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      plan,
      billingPeriod,
      successUrl,
      cancelUrl,
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[Payment] Checkout error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    });
  }
});

/**
 * POST /api/payment/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(req.body, signature);

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const data = await stripeService.handleCheckoutCompleted(session);

        // Check if user already has a license
        const existingLicense = await licenseService.getUserLicense(data.userId);

        if (existingLicense) {
          // Upgrade existing license
          await licenseService.upgradeLicense(
            existingLicense.id,
            data.plan,
            data.billingPeriod,
            {
              subscriptionId: data.subscriptionId,
              priceId: data.priceId,
            }
          );
          console.log(`[Stripe Webhook] Upgraded license for user ${data.userId} to ${data.plan}`);
        } else {
          // Create new license
          await licenseService.createLicense(
            data.userId,
            data.userId, // tenantId = userId for now
            data.plan,
            data.billingPeriod,
            {
              customerId: data.customerId,
              subscriptionId: data.subscriptionId,
              priceId: data.priceId,
            }
          );
          console.log(`[Stripe Webhook] Created ${data.plan} license for user ${data.userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const data = await stripeService.handleSubscriptionUpdated(subscription);

        const license = await licenseService.getLicenseByStripeSubscription(data.subscriptionId);

        if (license) {
          // Update license status based on subscription status
          if (data.status === 'active') {
            await licenseService.updateLicenseStatus(license.id, 'active');
          } else if (data.status === 'past_due' || data.status === 'unpaid') {
            await licenseService.updateLicenseStatus(license.id, 'suspended');
          } else if (data.status === 'canceled') {
            await licenseService.updateLicenseStatus(license.id, 'cancelled');
          }

          console.log(`[Stripe Webhook] Updated license ${license.id} status to ${data.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const data = await stripeService.handleSubscriptionDeleted(subscription);

        const license = await licenseService.getLicenseByStripeSubscription(data.subscriptionId);

        if (license) {
          await licenseService.cancelLicense(license.id);
          console.log(`[Stripe Webhook] Cancelled license ${license.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const data = await stripeService.handlePaymentFailed(invoice);

        if (data.subscriptionId) {
          const license = await licenseService.getLicenseByStripeSubscription(data.subscriptionId);

          if (license) {
            await licenseService.updateLicenseStatus(license.id, 'suspended');
            console.log(`[Stripe Webhook] Suspended license ${license.id} due to payment failure`);
          }
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    res.status(400).json({
      error: error.message || 'Webhook processing failed',
    });
  }
});

/**
 * GET /api/payment/portal
 * Get customer portal URL
 */
router.get('/portal', async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req);
    const license = await licenseService.getUserLicense(user.id);

    if (!license || !license.stripeCustomerId) {
      res.status(404).json({
        error: 'No active subscription found',
      });
      return;
    }

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const returnUrl = `${baseUrl}/account`;

    const portalUrl = await stripeService.createCustomerPortalSession(
      license.stripeCustomerId,
      returnUrl
    );

    res.json({ url: portalUrl });
  } catch (error: any) {
    console.error('[Payment] Portal error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create portal session',
    });
  }
});

export default router;

