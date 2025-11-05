/**
 * End-to-End Tests: Technical Reports Module
 * Tests complete report generation workflow
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Technical Reports Module - E2E Tests', () => {
  let accessToken: string;
  let reportId: string;

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

  describe('Report Creation', () => {
    it('should create a new report', async () => {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          title: 'Test Report - JORC Compliance',
          standard: 'JORC',
          projectName: 'Test Mining Project',
          location: 'Brazil',
          reportType: 'simplified',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.standard).toBe('JORC');
      
      reportId = data.id;
    });

    it('should reject report creation without license', async () => {
      // Create a new user without license
      const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `nolicense-${Date.now()}@qivomining.com`,
          password: 'TestPassword123!',
          name: 'No License User',
        }),
      });

      const cookies = registerResponse.headers.get('set-cookie');
      const tokenMatch = cookies?.match(/accessToken=([^;]+)/);
      const noLicenseToken = tokenMatch ? tokenMatch[1] : '';

      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${noLicenseToken}`,
        },
        body: JSON.stringify({
          title: 'Test Report',
          standard: 'JORC',
        }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Report Data Upload', () => {
    it('should upload geological data', async () => {
      const testData = {
        geology: {
          rockType: 'Granite',
          mineralization: 'Gold',
          alterationType: 'Hydrothermal',
        },
      };

      const response = await fetch(`${API_URL}/api/reports/${reportId}/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
    });

    it('should upload resource estimate', async () => {
      const testData = {
        resources: {
          measured: 1000000,
          indicated: 500000,
          inferred: 250000,
          unit: 'tonnes',
          grade: 2.5,
          gradeUnit: 'g/t Au',
        },
      };

      const response = await fetch(`${API_URL}/api/reports/${reportId}/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify(testData),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('KRCI Audit', () => {
    it('should run KRCI audit on report', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.score).toBeDefined();
      expect(data.issues).toBeDefined();
      expect(Array.isArray(data.issues)).toBe(true);
    });

    it('should return audit results', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/audit`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.score).toBeGreaterThanOrEqual(0);
      expect(data.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Report Generation', () => {
    it('should generate PDF report', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          format: 'pdf',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBeDefined();
      expect(data.url).toContain('.pdf');
    }, 60000); // 60 second timeout for generation

    it('should generate DOCX report', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          format: 'docx',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBeDefined();
      expect(data.url).toContain('.docx');
    }, 60000);

    it('should generate XLSX report', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          format: 'xlsx',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.url).toBeDefined();
      expect(data.url).toContain('.xlsx');
    }, 60000);
  });

  describe('Report Standards', () => {
    const standards = ['JORC', 'NI43-101', 'PERC', 'SAMREC', 'CBRR'];

    standards.forEach((standard) => {
      it(`should support ${standard} standard`, async () => {
        const response = await fetch(`${API_URL}/api/reports`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `accessToken=${accessToken}`,
          },
          body: JSON.stringify({
            title: `Test Report - ${standard}`,
            standard,
            projectName: 'Test Project',
          }),
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.standard).toBe(standard);
      });
    });
  });

  describe('Bridge Regulatória', () => {
    it('should convert JORC to NI43-101', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
        body: JSON.stringify({
          targetStandard: 'NI43-101',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.convertedReportId).toBeDefined();
    });
  });

  describe('Report Listing and Filtering', () => {
    it('should list all reports', async () => {
      const response = await fetch(`${API_URL}/api/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.reports)).toBe(true);
      expect(data.reports.length).toBeGreaterThan(0);
    });

    it('should filter reports by standard', async () => {
      const response = await fetch(`${API_URL}/api/reports?standard=JORC`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.reports)).toBe(true);
      data.reports.forEach((report: any) => {
        expect(report.standard).toBe('JORC');
      });
    });
  });

  describe('Report Deletion', () => {
    it('should delete report', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(200);
    });

    it('should return 404 for deleted report', async () => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `accessToken=${accessToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });
});
