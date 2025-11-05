/**
 * Stripe Price IDs - QIVO Mining
 * 
 * Preços configurados em produção
 */

export const STRIPE_PRICES = {
  START: {
    MONTHLY: 'price_1SPuu9GwHsvLMl1qQ3qBYdcY',  // $2,500/mês
    ANNUAL: 'price_1SPuu9GwHsvLMl1q2qNEVIjG',   // $27,000/ano
  },
  PRO: {
    MONTHLY: 'price_1SPuuAGwHsvLMl1q6agx7kSF',  // $12,500/mês
    ANNUAL: 'price_1SPuuAGwHsvLMl1qNcfYbfVo',   // $135,000/ano
  },
  ENTERPRISE: {
    MONTHLY: 'price_1SPuuAGwHsvLMl1qm6QGeNnc',  // $18,900/mês
    ANNUAL: 'price_1SPuuBGwHsvLMl1q2jtFPQPx',   // $170,100/ano
  },
};

/**
 * Get price ID by plan and period
 */
export function getPriceId(plan: 'START' | 'PRO' | 'ENTERPRISE', period: 'MONTHLY' | 'ANNUAL'): string {
  return STRIPE_PRICES[plan][period];
}

/**
 * Get all price IDs
 */
export function getAllPriceIds(): string[] {
  return [
    STRIPE_PRICES.START.MONTHLY,
    STRIPE_PRICES.START.ANNUAL,
    STRIPE_PRICES.PRO.MONTHLY,
    STRIPE_PRICES.PRO.ANNUAL,
    STRIPE_PRICES.ENTERPRISE.MONTHLY,
    STRIPE_PRICES.ENTERPRISE.ANNUAL,
  ];
}
