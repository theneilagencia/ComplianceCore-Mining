/**
 * Stripe Frontend Integration
 * Handles checkout sessions and redirects
 */

import { loadStripe, type Stripe } from '@stripe/stripe-js';

// Lazy load Stripe
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY not configured');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
}

export interface CheckoutParams {
  plan: 'PRO' | 'ENTERPRISE';
  billingPeriod: 'monthly' | 'annual';
}

/**
 * Create checkout session and redirect to Stripe
 */
export async function redirectToCheckout(params: CheckoutParams): Promise<void> {
  try {
    const response = await fetch('/api/payment/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();

    // Redirect to Stripe Checkout
    if (url) {
      window.location.href = url;
    } else {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('[Stripe] Checkout error:', error);
    throw error;
  }
}

/**
 * Get customer portal URL
 */
export async function getCustomerPortalUrl(): Promise<string> {
  try {
    const response = await fetch('/api/payment/portal', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get portal URL');
    }

    const { url } = await response.json();
    return url;
  } catch (error: any) {
    console.error('[Stripe] Portal error:', error);
    throw error;
  }
}

/**
 * Open customer portal in new tab
 */
export async function openCustomerPortal(): Promise<void> {
  try {
    const url = await getCustomerPortalUrl();
    window.open(url, '_blank');
  } catch (error: any) {
    console.error('[Stripe] Failed to open portal:', error);
    throw error;
  }
}

