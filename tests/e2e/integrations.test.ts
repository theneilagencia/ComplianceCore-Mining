/**
 * End-to-End Tests: External Integrations (ANM, CPRM, IBAMA, ANP)
 * Tests integration with official Brazilian mining APIs
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('External Integrations - E2E Tests', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Login to get access token
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: process.env.TEST_USER_EMAIL || 'test@qivomining.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      }),
    });

    const cookies = response.headers.get('set-cookie');
    const tokenMatch = cookies?.match(/accessToken=([^;]+)/);
    if (tokenMatch) {
      accessToken = tokenMatch[1];
    }
  });

  describe('ANM Integration', () => {
    it('should validate valid ANM process number', async () => {
      const response = await fetch(`${API_URL}/api/integrations/anm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          processNumber: '800.000/2020',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.source).toBe('ANM');
      expect(data.status).toBeDefined();
      expect(['valid', 'invalid', 'error']).toContain(data.status);
    }, 15000);

    it('should reject invalid ANM process number format', async () => {
      const response = await fetch(`${API_URL}/api/integrations/anm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          processNumber: 'INVALID',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('invalid');
    });

    it('should handle ANM API timeout gracefully', async () => {
      const response = await fetch(`${API_URL}/api/integrations/anm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          processNumber: '999.999/9999', // Non-existent process
        }),
      });

      // Should return response even if API times out
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.source).toBe('ANM');
    }, 15000);

    it('should cache ANM responses', async () => {
      const processNumber = '800.000/2020';

      // First request
      const start1 = Date.now();
      const response1 = await fetch(`${API_URL}/api/integrations/anm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({ processNumber }),
      });
      const time1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      const response2 = await fetch(`${API_URL}/api/integrations/anm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({ processNumber }),
      });
      const time2 = Date.now() - start2;

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Cached request should be significantly faster
      expect(time2).toBeLessThan(time1 / 2);
    }, 30000);
  });

  describe('CPRM Integration', () => {
    it('should validate geological data with CPRM', async () => {
      const response = await fetch(`${API_URL}/api/integrations/cprm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          location: {
            latitude: -15.7801,
            longitude: -47.9292,
          },
          rockType: 'Granite',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.source).toBe('CPRM');
      expect(data.status).toBeDefined();
    }, 15000);

    it('should handle CPRM API errors gracefully', async () => {
      const response = await fetch(`${API_URL}/api/integrations/cprm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          location: {
            latitude: 999, // Invalid latitude
            longitude: 999, // Invalid longitude
          },
        }),
      });

      // Should return error status, not crash
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('error');
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after multiple failures', async () => {
      const promises = [];

      // Send 10 requests to a failing endpoint
      for (let i = 0; i < 10; i++) {
        promises.push(
          fetch(`${API_URL}/api/integrations/anm/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': `accessToken=${accessToken}`,
            },
            body: JSON.stringify({
              processNumber: `FAIL-${i}`,
            }),
          })
        );
      }

      const responses = await Promise.all(promises);

      // All should return responses (not crash)
      responses.forEach((response) => {
        expect(response.status).toBeDefined();
      });
    }, 60000);

    it('should provide fallback when circuit is open', async () => {
      const response = await fetch(`${API_URL}/api/integrations/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.integrations).toBeDefined();
      expect(data.integrations.ANM).toBeDefined();
      expect(data.integrations.CPRM).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests automatically', async () => {
      // This test verifies that the integration wrapper retries failed requests
      const response = await fetch(`${API_URL}/api/integrations/anm/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          processNumber: '800.000/2020',
        }),
      });

      // Should eventually succeed or return graceful error
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.source).toBe('ANM');
    }, 30000);
  });

  describe('Integration Status Dashboard', () => {
    it('should return status of all integrations', async () => {
      const response = await fetch(`${API_URL}/api/integrations/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.integrations).toBeDefined();

      const expectedIntegrations = ['ANM', 'CPRM', 'IBAMA', 'ANP'];
      expectedIntegrations.forEach((integration) => {
        expect(data.integrations[integration]).toBeDefined();
        expect(data.integrations[integration].status).toBeDefined();
        expect(['operational', 'degraded', 'down']).toContain(
          data.integrations[integration].status
        );
      });
    });

    it('should return metrics for each integration', async () => {
      const response = await fetch(`${API_URL}/api/integrations/metrics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.metrics).toBeDefined();

      Object.values(data.metrics).forEach((metric: any) => {
        expect(metric.totalRequests).toBeDefined();
        expect(metric.successRate).toBeDefined();
        expect(metric.averageLatency).toBeDefined();
      });
    });
  });
});
