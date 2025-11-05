/**
 * End-to-End Tests: Authentication Module
 * Tests all authentication flows including register, login, logout, and OAuth
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Authentication Module - E2E Tests', () => {
  let testEmail: string;
  let testPassword: string;
  let accessToken: string;

  beforeAll(() => {
    // Generate unique test email
    testEmail = `test-${Date.now()}@qivomining.com`;
    testPassword = 'TestPassword123!';
  });

  describe('User Registration', () => {
    it('should reject registration with weak password', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'weak',
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('caracteres');
    });

    it('should reject registration without uppercase letter', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'testpassword123!',
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('maiúscula');
    });

    it('should reject registration without number', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'TestPassword!',
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('número');
    });

    it('should reject registration without special character', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'TestPassword123',
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('caractere especial');
    });

    it('should successfully register with valid credentials', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test User',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      
      // Check for cookies
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toBeDefined();
      expect(cookies).toContain('accessToken');
      expect(cookies).toContain('refreshToken');
    });

    it('should reject duplicate email registration', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Test User 2',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('User Login', () => {
    it('should reject login with wrong password', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'WrongPassword123!',
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should reject login with non-existent email', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@qivomining.com',
          password: testPassword,
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should successfully login with valid credentials', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testEmail);
      
      // Check for cookies
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toBeDefined();
      expect(cookies).toContain('accessToken');
      expect(cookies).toContain('refreshToken');
      
      // Extract access token for subsequent tests
      const tokenMatch = cookies?.match(/accessToken=([^;]+)/);
      if (tokenMatch) {
        accessToken = tokenMatch[1];
      }
    });
  });

  describe('Protected Routes', () => {
    it('should reject access without token', async () => {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(response.status).toBe(401);
    });

    it('should allow access with valid token', async () => {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      // Should return 200 or 403 (if no license), but not 401
      expect(response.status).not.toBe(401);
    });
  });

  describe('User Logout', () => {
    it('should successfully logout', async () => {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        credentials: 'include',
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      
      // Check that cookies are cleared
      const cookies = response.headers.get('set-cookie');
      expect(cookies).toBeDefined();
      expect(cookies).toContain('accessToken=;');
      expect(cookies).toContain('refreshToken=;');
    });

    it('should reject access after logout', async () => {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      const promises = [];
      
      // Send 150 requests (limit is 100 per 15 minutes)
      for (let i = 0; i < 150; i++) {
        promises.push(
          fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password',
            }),
          })
        );
      }
      
      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      // Should have at least some rate-limited responses
      expect(rateLimited.length).toBeGreaterThan(0);
    }, 30000); // 30 second timeout
  });
});
