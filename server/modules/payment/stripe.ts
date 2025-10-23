/**
 * Stripe Integration Service
 * Handles checkout sessions, webhooks, and subscription management
 */

import Stripe from 'stripe';
import type { Plan } from '../licenses/service';

// Lazy initialization to avoid crash when Stripe is not configured
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('STRIPE_SECRET_KEY not configured. Please add it to environment variables.');
    }
    _stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return _stripe;
}

export interface CheckoutSessionParams {
  userId: string;
  userEmail: string;
  plan: Plan;
  billingPeriod: 'monthly' | 'annual';
  successUrl: string;
  cancelUrl: string;
}

/**
 * Get Stripe Price ID for a plan
 */
export function getPriceId(plan: Plan, billingPeriod: 'monthly' | 'annual'): string {
  const priceIds: Record<string, string> = {
    'START': process.env.STRIPE_PRICE_STARTER || '',
    'PRO_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1SLM9VGwHsvLMl1q4XSy1mZc',
    'PRO_annual': process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_1SLM9VGwHsvLMl1qDU9ti4Wv',
    'ENTERPRISE_monthly': process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_1SLM9WGwHsvLMl1qPo2yp6OI',
    'ENTERPRISE_annual': process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_1SLM9WGwHsvLMl1q1lj7bd0R',
  };

  if (plan === 'START') {
    return priceIds['START'];
  }

  const key = `${plan}_${billingPeriod}`;
  return priceIds[key] || '';
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe(); // Lazy init
  const { userId, userEmail, plan, billingPeriod, successUrl, cancelUrl } = params;

  if (plan === 'START') {
    throw new Error('START plan is free and does not require checkout');
  }

  const priceId = getPriceId(plan, billingPeriod);

  if (!priceId) {
    throw new Error(`Invalid plan or billing period: ${plan} ${billingPeriod}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      plan,
      billingPeriod,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId,
        plan,
        billingPeriod,
      },
    },
  });

  return session;
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe(); // Lazy init
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Handle checkout session completed
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<{
  userId: string;
  plan: Plan;
  billingPeriod: 'monthly' | 'annual';
  customerId: string;
  subscriptionId: string;
  priceId: string;
}> {
  const stripe = getStripe(); // Lazy init
  const userId = session.metadata?.userId || session.client_reference_id;
  const plan = session.metadata?.plan as Plan;
  const billingPeriod = session.metadata?.billingPeriod as 'monthly' | 'annual';
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!userId || !plan || !billingPeriod) {
    throw new Error('Missing required metadata in checkout session');
  }

  // Get subscription details to extract price ID
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id || '';

  return {
    userId,
    plan,
    billingPeriod,
    customerId,
    subscriptionId,
    priceId,
  };
}

/**
 * Handle subscription updated
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<{
  subscriptionId: string;
  status: string;
  currentPeriodEnd: Date;
}> {
  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  };
}

/**
 * Handle subscription deleted/cancelled
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<{
  subscriptionId: string;
}> {
  return {
    subscriptionId: subscription.id,
  };
}

/**
 * Handle payment failed
 */
export async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<{
  subscriptionId: string | null;
  customerId: string;
}> {
  return {
    subscriptionId: invoice.subscription as string | null,
    customerId: invoice.customer as string,
  };
}

/**
 * Cancel subscription in Stripe
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe(); // Lazy init
  await stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Get customer portal URL
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe(); // Lazy init
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

