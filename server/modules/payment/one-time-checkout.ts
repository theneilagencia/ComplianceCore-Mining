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

export type ReportType = 'simplified' | 'complete' | 'multinorm' | 'auditable' | 'esg' | 'simplificado' | 'tecnico_completo' | 'multinormativo' | 'auditavel' | 'esg_integrado';

/**
 * Report prices in cents (USD)
 */
const REPORT_PRICES: Record<ReportType, number> = {
  simplified: 280000,  // R$ 2.800
  complete: 680000,    // R$ 6.800
  multinorm: 980000,   // R$ 9.800
  auditable: 1200000,  // R$ 12.000
  esg: 1280000,        // R$ 12.800
  // Aliases em português
  simplificado: 280000,
  tecnico_completo: 680000,
  multinormativo: 980000,
  auditavel: 1200000,
  esg_integrado: 1280000,
};

/**
 * Report names
 */
const REPORT_NAMES: Record<ReportType, string> = {
  simplified: 'Relatório Simplificado - Visão rápida e acessível do status da operação',
  complete: 'Relatório Técnico Completo - Detalhamento técnico completo com parâmetros normativos',
  multinorm: 'Relatório Multinormativo - Compatível com múltiplos códigos internacionais',
  auditable: 'Relatório Auditável - Rastreabilidade total e validação independente',
  esg: 'Relatório ESG Integrado - Governança técnica, ambiental e social',
  // Aliases em português
  simplificado: 'Relatório Simplificado - Visão rápida e acessível do status da operação',
  tecnico_completo: 'Relatório Técnico Completo - Detalhamento técnico completo com parâmetros normativos',
  multinormativo: 'Relatório Multinormativo - Compatível com múltiplos códigos internacionais',
  auditavel: 'Relatório Auditável - Rastreabilidade total e validação independente',
  esg_integrado: 'Relatório ESG Integrado - Governança técnica, ambiental e social',
};

export interface OneTimeCheckoutParams {
  reportType: ReportType;
  userEmail: string;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
  hasActiveSubscription?: boolean; // Para aplicar desconto de 10%
}

/**
 * Create one-time payment checkout session for reports
 * Applies 10% discount for users with active subscription
 */
export async function createOneTimeCheckout(
  params: OneTimeCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  const { reportType, userEmail, userId, successUrl, cancelUrl, hasActiveSubscription } = params;

  const originalPrice = REPORT_PRICES[reportType];
  const name = REPORT_NAMES[reportType];

  if (!originalPrice || !name) {
    throw new Error(`Invalid report type: ${reportType}`);
  }

  // Aplicar desconto de 10% para assinantes
  const discount = hasActiveSubscription ? 0.10 : 0;
  const finalPrice = Math.round(originalPrice * (1 - discount));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment', // One-time payment
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: hasActiveSubscription ? `${name} (Desconto de Assinante - 10%)` : name,
            description: hasActiveSubscription 
              ? `Relatório técnico on-demand - QIVO Mining | Preço original: $${(originalPrice / 100).toFixed(2)} | Desconto: 10%`
              : `Relatório técnico on-demand - QIVO Mining`,
          },
          unit_amount: finalPrice,
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
      hasDiscount: hasActiveSubscription ? 'true' : 'false',
      originalPrice: originalPrice.toString(),
      finalPrice: finalPrice.toString(),
      discountPercentage: hasActiveSubscription ? '10' : '0',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

