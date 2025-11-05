/**
 * Performance Tests with k6
 * Load, stress, and spike tests for critical endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Test configuration
export const options = {
  stages: [
    // Load Test: Ramp up to 50 users over 2 minutes
    { duration: '2m', target: 50 },
    // Sustain 50 users for 5 minutes
    { duration: '5m', target: 50 },
    // Ramp down to 0 users over 1 minute
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // 95% of requests should be below 250ms (requirement)
    http_req_duration: ['p(95)<250'],
    // Error rate should be below 1%
    errors: ['rate<0.01'],
    // 99% of requests should complete within 1s
    http_req_duration: ['p(99)<1000'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Test data
let accessToken = '';

export function setup() {
  // Login to get access token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: __ENV.TEST_USER_EMAIL || 'test@qivomining.com',
    password: __ENV.TEST_USER_PASSWORD || 'TestPassword123!',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const cookies = loginRes.headers['Set-Cookie'];
  const tokenMatch = cookies ? cookies.match(/accessToken=([^;]+)/) : null;
  
  return {
    accessToken: tokenMatch ? tokenMatch[1] : '',
  };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': `accessToken=${data.accessToken}`,
  };

  // Test 1: List reports (read-heavy endpoint)
  {
    const res = http.get(`${BASE_URL}/api/reports`, { headers });
    
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 250ms': (r) => r.timings.duration < 250,
    });
    
    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
  }

  sleep(1);

  // Test 2: Get user license (cached endpoint)
  {
    const res = http.get(`${BASE_URL}/api/licenses/current`, { headers });
    
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100, // Should be fast (cached)
    });
    
    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
  }

  sleep(1);

  // Test 3: Validate ANM (integration endpoint)
  {
    const res = http.post(`${BASE_URL}/api/integrations/anm/validate`, JSON.stringify({
      processNumber: '800.000/2020',
    }), { headers });
    
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000, // External API, allow more time
    });
    
    errorRate.add(!success);
    apiLatency.add(res.timings.duration);
  }

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
  console.log('Performance test completed');
}
