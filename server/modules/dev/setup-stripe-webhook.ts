/**
 * Temporary Stripe Webhook Setup Router
 * Creates webhook endpoint in Stripe automatically
 * ⚠️ This is a one-time setup endpoint
 */

import { Router } from 'express';
import { ENV } from '../../_core/env';

const router = Router();

/**
 * POST /api/setup-stripe-webhook
 * Create webhook endpoint in Stripe
 */
router.post('/setup-stripe-webhook', async (req, res) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return res.status(500).json({ 
        error: 'STRIPE_SECRET_KEY not configured',
        message: 'Please set STRIPE_SECRET_KEY in environment variables'
      });
    }

    console.log('[Stripe Webhook] Creating webhook endpoint...');

    // Create webhook endpoint using Stripe API
    const webhookUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/api/webhooks/stripe`
      : `https://qivomining.com/api/webhooks/stripe`;
    
    const response = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams([
        ['url', webhookUrl],
        ['enabled_events[]', 'checkout.session.completed'],
        ['enabled_events[]', 'customer.subscription.created'],
        ['enabled_events[]', 'customer.subscription.updated'],
        ['enabled_events[]', 'customer.subscription.deleted'],
        ['enabled_events[]', 'invoice.payment_succeeded'],
        ['enabled_events[]', 'invoice.payment_failed'],
        ['description', 'QIVO Mining Webhook'],
      ]).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    const webhook = await response.json();

    console.log('[Stripe Webhook] ✅ Webhook created successfully!');
    console.log('[Stripe Webhook] Webhook ID:', webhook.id);
    console.log('[Stripe Webhook] Signing Secret:', webhook.secret);

    return res.json({
      success: true,
      message: 'Stripe webhook created successfully',
      webhook: {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.enabled_events,
      },
      nextSteps: [
        `Add STRIPE_WEBHOOK_SECRET=${webhook.secret} to environment variables`,
        'Rebuild and deploy the service',
        'Test webhook by creating a test payment',
      ],
    });

  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return res.status(500).json({
      error: 'Failed to create Stripe webhook',
      message: error.message,
      details: error.stack,
    });
  }
});

/**
 * GET /api/setup-stripe-webhook/status
 * Check existing webhooks
 */
router.get('/setup-stripe-webhook/status', async (req, res) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return res.status(500).json({ 
        error: 'STRIPE_SECRET_KEY not configured'
      });
    }

    const response = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stripe API error: ${error}`);
    }

    const webhooks = await response.json();

    return res.json({
      success: true,
      webhooks: webhooks.data.map((wh: any) => ({
        id: wh.id,
        url: wh.url,
        status: wh.status,
        events: wh.enabled_events,
      })),
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch webhooks',
      message: error.message,
    });
  }
});

export default router;

