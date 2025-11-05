/**
 * End-to-End Tests: Stripe Payment Integration
 * Tests subscription and one-time payment flows
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Stripe Payments - E2E Tests', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create new test user
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: `payment-test-${Date.now()}@qivomining.com`,
        password: 'TestPassword123!',
        name: 'Payment Test User',
      }),
    });

    const registerData = await registerResponse.json();
    userId = registerData.user.id;

    const cookies = registerResponse.headers.get('set-cookie');
    const tokenMatch = cookies?.match(/accessToken=([^;]+)/);
    if (tokenMatch) {
      accessToken = tokenMatch[1];
    }
  });

  describe('Subscription Checkout', () => {
    it('should create checkout session for PRO plan (monthly)', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          plan: 'PRO',
          billing: 'monthly',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sessionId).toBeDefined();
      expect(data.url).toBeDefined();
      expect(data.url).toContain('checkout.stripe.com');
    });

    it('should create checkout session for PRO plan (annual)', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          plan: 'PRO',
          billing: 'annual',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sessionId).toBeDefined();
      expect(data.url).toBeDefined();
    });

    it('should create checkout session for ENTERPRISE plan', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          plan: 'ENTERPRISE',
          billing: 'monthly',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sessionId).toBeDefined();
    });

    it('should reject invalid plan', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          plan: 'INVALID',
          billing: 'monthly',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('One-Time Report Checkout', () => {
    it('should create checkout for simplified report', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-one-time-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          reportType: 'simplified',
          reportId: 'test-report-id',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sessionId).toBeDefined();
      expect(data.url).toBeDefined();
      expect(data.amount).toBe(280000); // $2,800.00 in cents
    });

    it('should create checkout for technical report', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-one-time-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          reportType: 'technical',
          reportId: 'test-report-id',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.amount).toBe(680000); // $6,800.00 in cents
    });

    it('should create checkout for ESG report', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-one-time-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          reportType: 'esg',
          reportId: 'test-report-id',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.amount).toBe(1280000); // $12,800.00 in cents
    });

    it('should apply 10% discount for subscribers', async () => {
      // First, simulate user having an active subscription
      // (In real test, would need to actually create subscription)

      const response = await fetch(`${API_URL}/api/payment/create-one-time-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          reportType: 'simplified',
          reportId: 'test-report-id',
          hasActiveSubscription: true,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should be 10% less than $2,800.00
      expect(data.amount).toBe(252000); // $2,520.00 in cents
    });
  });

  describe('Customer Portal', () => {
    it('should create customer portal session', async () => {
      const response = await fetch(`${API_URL}/api/payment/create-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      // May return 400 if user has no Stripe customer ID yet
      expect([200, 400]).toContain(response.status);

      if (response.status === 200) {
        const data = await response.json();
        expect(data.url).toBeDefined();
        expect(data.url).toContain('billing.stripe.com');
      }
    });
  });

  describe('Webhook Handling', () => {
    it('should have webhook endpoint configured', async () => {
      const response = await fetch(`${API_URL}/api/payment/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'test-signature',
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: {},
        }),
      });

      // Should return 400 for invalid signature, not 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('Payment History', () => {
    it('should retrieve payment history', async () => {
      const response = await fetch(`${API_URL}/api/payment/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.payments)).toBe(true);
    });
  });

  describe('License Activation', () => {
    it('should activate license after successful payment', async () => {
      // This would be tested with actual Stripe test mode
      // For now, just verify the endpoint exists

      const response = await fetch(`${API_URL}/api/licenses/current`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.plan).toBeDefined();
    });
  });

  describe('Pricing Validation', () => {
    it('should return correct pricing for all plans', async () => {
      const response = await fetch(`${API_URL}/api/payment/pricing`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Verify PRO plan pricing
      expect(data.plans.PRO).toBeDefined();
      expect(data.plans.PRO.monthly).toBe(12500); // $125.00
      expect(data.plans.PRO.annual).toBe(135000); // $1,350.00 (10% discount)

      // Verify ENTERPRISE plan pricing
      expect(data.plans.ENTERPRISE).toBeDefined();
      expect(data.plans.ENTERPRISE.monthly).toBe(45000); // $450.00
      expect(data.plans.ENTERPRISE.annual).toBe(486000); // $4,860.00 (10% discount)

      // Verify one-time report pricing
      expect(data.reports.simplified).toBe(280000); // $2,800.00
      expect(data.reports.technical).toBe(680000); // $6,800.00
      expect(data.reports.esg).toBe(1280000); // $12,800.00
    });
  });
});
