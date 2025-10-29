/**
 * One-Time Report Checkout
 * Handles Stripe checkout for on-demand reports
 */

import Stripe from 'stripe';

// Lazy initialization
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    _stripe = new Stripe(apiKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return _stripe;
}

export type ReportType = 'simplified' | 'complete' | 'multinorm' | 'auditable' | 'esg';

/**
 * Report prices in cents (USD)
 */
const REPORT_PRICES: Record<ReportType, number> = {
  simplified: 200000,  // $2,000
  complete: 490000,    // $4,900
  multinorm: 750000,   // $7,500
  auditable: 980000,   // $9,800
  esg: 1250000,        // $12,500
};

/**
 * Report names
 */
const REPORT_NAMES: Record<ReportType, string> = {
  simplified: 'Relatório Simplificado - Sumário técnico automatizado CRIRSCO',
  complete: 'Relatório Técnico Completo - Validado por IA e QP',
  multinorm: 'Relatório Multinormativo - Conversão NI ↔ JORC ↔ ANM com Loss Map',
  auditable: 'Relatório Auditável - Com KRCI e assinatura digital verificável',
  esg: 'Relatório ESG Integrado - Integra dados IBAMA + Copernicus + NASA',
};

export interface OneTimeCheckoutParams {
  reportType: ReportType;
  userEmail: string;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create one-time payment checkout session for reports
 */
export async function createOneTimeCheckout(
  params: OneTimeCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const { reportType, userEmail, userId, successUrl, cancelUrl } = params;

  const price = REPORT_PRICES[reportType];
  const name = REPORT_NAMES[reportType];

  if (!price || !name) {
    throw new Error(`Invalid report type: ${reportType}`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment', // One-time payment
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name,
            description: `Relatório técnico on-demand - QIVO Mining`,
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    customer_email: userEmail,
    client_reference_id: userId || userEmail,
    metadata: {
      reportType,
      userId: userId || '',
      type: 'one_time_report',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

