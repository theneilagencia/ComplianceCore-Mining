/**
 * Stress Test with k6
 * Push system beyond normal capacity to find breaking point
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    // Ramp up to 100 users over 5 minutes
    { duration: '5m', target: 100 },
    // Sustain 100 users for 10 minutes
    { duration: '10m', target: 100 },
    // Ramp up to 200 users over 5 minutes (stress)
    { duration: '5m', target: 200 },
    // Sustain 200 users for 10 minutes
    { duration: '10m', target: 200 },
    // Ramp down to 0 users over 5 minutes
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    // Allow higher latency under stress
    http_req_duration: ['p(95)<1000'],
    // Error rate should still be below 5%
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export function setup() {
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

  // Simulate realistic user behavior
  const endpoints = [
    `${BASE_URL}/api/reports`,
    `${BASE_URL}/api/licenses/current`,
    `${BASE_URL}/api/integrations/status`,
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(endpoint, { headers });
  
  const success = check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429, // Allow rate limiting
  });
  
  errorRate.add(!success);
  
  sleep(Math.random() * 3); // Random sleep 0-3 seconds
}
