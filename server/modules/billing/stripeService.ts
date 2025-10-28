/**
 * Stripe Billing Service - QIVO Mining
 * 
 * Features:
 * - Customer portal
 * - Webhooks: invoice.paid, subscription.updated, checkout.completed
 * - Discounts: 10%, 25%, 40%
 * - Add-ons
 * - Auto-detect real Stripe keys or use mock
 */

const STRIPE_KEY = process.env.STRIPE_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const IS_MOCK = !STRIPE_KEY || !STRIPE_WEBHOOK_SECRET;

// Mock Stripe if keys not available
let stripe: any;

if (!IS_MOCK) {
  try {
    const Stripe = require('stripe');
    stripe = new Stripe(STRIPE_KEY, {
      apiVersion: '2023-10-16',
    });
    console.log('✅ Stripe initialized with real keys');
  } catch (error) {
    console.warn('⚠️ Stripe package not installed, using mock');
    stripe = null;
  }
}

/**
 * Create customer portal session
 */
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: createCustomerPortalSession');
    return {
      url: `https://billing.stripe.com/session/mock_${customerId}`,
      mock: true,
    };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return { url: session.url, mock: false };
  } catch (error) {
    console.error('Stripe portal error:', error);
    throw error;
  }
}

/**
 * Create checkout session
 */
export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  discountCode?: string;
  addOns?: string[];
}) {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: createCheckoutSession');
    return {
      url: `https://checkout.stripe.com/session/mock_${Date.now()}`,
      sessionId: `cs_mock_${Date.now()}`,
      mock: true,
    };
  }

  try {
    const lineItems: any[] = [
      {
        price: params.priceId,
        quantity: 1,
      },
    ];

    // Add add-ons
    if (params.addOns && params.addOns.length > 0) {
      for (const addOnPriceId of params.addOns) {
        lineItems.push({
          price: addOnPriceId,
          quantity: 1,
        });
      }
    }

    const sessionParams: any = {
      mode: 'subscription',
      line_items: lineItems,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    };

    if (params.customerId) {
      sessionParams.customer = params.customerId;
    } else if (params.customerEmail) {
      sessionParams.customer_email = params.customerEmail;
    }

    // Apply discount code
    if (params.discountCode) {
      sessionParams.discounts = [{ coupon: params.discountCode }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { url: session.url, sessionId: session.id, mock: false };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: getSubscription');
    return {
      id: subscriptionId,
      status: 'active',
      current_period_end: Date.now() + 30 * 24 * 60 * 60 * 1000,
      plan: {
        id: 'price_professional',
        amount: 29900,
        currency: 'usd',
        interval: 'month',
      },
      mock: true,
    };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return { ...subscription, mock: false };
  } catch (error) {
    console.error('Stripe subscription error:', error);
    throw error;
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string, immediately: boolean = false) {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: cancelSubscription');
    return {
      id: subscriptionId,
      status: immediately ? 'canceled' : 'active',
      cancel_at_period_end: !immediately,
      mock: true,
    };
  }

  try {
    if (immediately) {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return { ...subscription, mock: false };
    } else {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return { ...subscription, mock: false };
    }
  } catch (error) {
    console.error('Stripe cancel error:', error);
    throw error;
  }
}

/**
 * Update subscription (change plan)
 */
export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: updateSubscription');
    return {
      id: subscriptionId,
      status: 'active',
      plan: {
        id: newPriceId,
      },
      mock: true,
    };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    });
    return { ...updatedSubscription, mock: false };
  } catch (error) {
    console.error('Stripe update error:', error);
    throw error;
  }
}

/**
 * List invoices
 */
export async function listInvoices(customerId: string, limit: number = 10) {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: listInvoices');
    return {
      data: [
        {
          id: 'in_mock_1',
          number: 'INV-2025-001',
          amount_paid: 29900,
          currency: 'usd',
          status: 'paid',
          created: Date.now() - 30 * 24 * 60 * 60 * 1000,
          invoice_pdf: 'https://invoice.stripe.com/mock_1.pdf',
        },
        {
          id: 'in_mock_2',
          number: 'INV-2024-012',
          amount_paid: 29900,
          currency: 'usd',
          status: 'paid',
          created: Date.now() - 60 * 24 * 60 * 60 * 1000,
          invoice_pdf: 'https://invoice.stripe.com/mock_2.pdf',
        },
      ],
      mock: true,
    };
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });
    return { ...invoices, mock: false };
  } catch (error) {
    console.error('Stripe invoices error:', error);
    throw error;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): any {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: verifyWebhookSignature');
    return JSON.parse(payload);
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

/**
 * Handle webhook events
 */
export async function handleWebhookEvent(event: any) {
  console.log(`📨 Webhook event: ${event.type}`);

  switch (event.type) {
    case 'invoice.paid':
      return handleInvoicePaid(event.data.object);
    
    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event.data.object);
    
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object);
    
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object);
    
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event.data.object);
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
      return { handled: false };
  }
}

async function handleInvoicePaid(invoice: any) {
  console.log(`✅ Invoice paid: ${invoice.id}`);
  // Update database: mark invoice as paid
  // Send confirmation email
  return { handled: true, action: 'invoice_paid' };
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`❌ Invoice payment failed: ${invoice.id}`);
  // Update database: mark invoice as failed
  // Send payment failed email
  return { handled: true, action: 'invoice_failed' };
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  // Update database: subscription status, plan, etc.
  return { handled: true, action: 'subscription_updated' };
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);
  // Update database: mark subscription as canceled
  // Revoke access
  return { handled: true, action: 'subscription_deleted' };
}

async function handleCheckoutCompleted(session: any) {
  console.log(`✅ Checkout completed: ${session.id}`);
  // Create subscription in database
  // Send welcome email
  // Grant access
  return { handled: true, action: 'checkout_completed' };
}

/**
 * Create discount coupon
 */
export async function createDiscountCoupon(params: {
  code: string;
  percentOff: 10 | 25 | 40;
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
}) {
  if (IS_MOCK || !stripe) {
    console.log('🔧 Mock: createDiscountCoupon');
    return {
      id: `coupon_${params.code}`,
      percent_off: params.percentOff,
      duration: params.duration,
      mock: true,
    };
  }

  try {
    const coupon = await stripe.coupons.create({
      percent_off: params.percentOff,
      duration: params.duration,
      duration_in_months: params.durationInMonths,
    });

    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: params.code,
    });

    return { coupon, promotionCode, mock: false };
  } catch (error) {
    console.error('Stripe coupon error:', error);
    throw error;
  }
}

/**
 * Get service status
 */
export function getStripeStatus() {
  return {
    enabled: !IS_MOCK && !!stripe,
    mock: IS_MOCK,
    hasKeys: !!STRIPE_KEY && !!STRIPE_WEBHOOK_SECRET,
  };
}

