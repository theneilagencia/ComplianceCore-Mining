import { describe, it, expect, beforeAll } from 'vitest';
import axios, { AxiosInstance } from 'axios';

describe('Manus AI - Report Generation Assistant', () => {
  let client: AxiosInstance;
  const BASE_URL = process.env.API_URL || 'http://localhost:8000';

  beforeAll(() => {
    client = axios.create({
      baseURL: BASE_URL,
      timeout: 120000, // 2 minutes for report generation
      headers: {
        'Content-Type': 'application/json'
      }
    });
  });

  describe('Templates Management', () => {
    it('should list all available templates', async () => {
      const response = await client.get('/api/manus/templates');
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.templates).toBeInstanceOf(Array);
      expect(response.data.templates).toHaveLength(3);
      expect(response.data.total).toBe(3);

      // Verify JORC 2012
      const jorc = response.data.templates.find((t: any) => t.id === 'jorc_2012');
      expect(jorc).toBeDefined();
      expect(jorc.name).toBe('JORC Code 2012');
      expect(jorc.sections).toBe(19);
      expect(jorc.jurisdiction).toBe('Australia');

      // Verify NI 43-101
      const ni43101 = response.data.templates.find((t: any) => t.id === 'ni_43_101');
      expect(ni43101).toBeDefined();
      expect(ni43101.sections).toBe(30);
      expect(ni43101.jurisdiction).toBe('Canada');

      // Verify PRMS
      const prms = response.data.templates.find((t: any) => t.id === 'prms');
      expect(prms).toBeDefined();
      expect(prms.sections).toBe(7);
      expect(prms.jurisdiction).toBe('International');
    });

    it('should retrieve JORC 2012 template sections', async () => {
      const response = await client.get('/api/manus/templates/jorc_2012/sections');
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.template_id).toBe('jorc_2012');
      expect(response.data.sections).toBeInstanceOf(Array);
      expect(response.data.sections).toHaveLength(19);
      expect(response.data.total).toBe(19);

      // Verify key sections
      expect(response.data.sections).toContain('Summary');
      expect(response.data.sections).toContain('Introduction');
      expect(response.data.sections).toContain('Geology and Geological Interpretation');
      expect(response.data.sections).toContain('Estimation and Reporting of Mineral Resources');
    });

    it('should retrieve NI 43-101 template sections', async () => {
      const response = await client.get('/api/manus/templates/ni_43_101/sections');
      
      expect(response.status).toBe(200);
      expect(response.data.sections).toHaveLength(30);
      expect(response.data.sections).toContain('Title Page');
      expect(response.data.sections).toContain('Summary');
      expect(response.data.sections).toContain('Certificates');
    });

    it('should return error for invalid template ID', async () => {
      try {
        await client.get('/api/manus/templates/invalid_template/sections');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await client.get('/api/manus/health');
      
      expect(response.status).toBe(200);
      expect(response.data.status).toMatch(/healthy|degraded/);
      expect(response.data.module).toBe('Manus AI');
      expect(response.data.version).toBeDefined();

      // Components
      expect(response.data.components.engine).toBeDefined();
      expect(response.data.components.engine.status).toBe('initialized');
      expect(response.data.components.engine.templates_loaded).toBe(3);

      expect(response.data.components.openai).toBeDefined();

      // Templates
      expect(response.data.templates.jorc_2012).toBeDefined();
      expect(response.data.templates.jorc_2012.sections).toBe(19);
      expect(response.data.templates.ni_43_101.sections).toBe(30);
      expect(response.data.templates.prms.sections).toBe(7);

      // Statistics
      expect(response.data.statistics).toBeDefined();
      expect(response.data.statistics.reports_generated_today).toBeGreaterThanOrEqual(0);
    });

    it('should return detailed status', async () => {
      const response = await client.get('/api/manus/status');
      
      expect(response.status).toBe(200);
      expect(response.data.module).toBe('Manus AI');
      expect(response.data.health).toBeDefined();
      expect(response.data.capabilities).toBeDefined();
      expect(response.data.capabilities.templates).toBe(3);
      expect(response.data.capabilities.total_sections).toBe(56);
    });

    it('should complete in less than 2 seconds', async () => {
      const start = Date.now();
      await client.get('/api/manus/health');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Section Generation', () => {
    it('should generate a single section successfully', async () => {
      const request = {
        section_name: 'Summary',
        template: 'jorc_2012',
        project_name: 'Test Gold Project',
        data: {
          location: 'Queensland, Australia',
          commodity: 'Gold',
          resources: {
            indicated: '1.0M tonnes @ 2.5 g/t Au'
          }
        }
      };

      const response = await client.post('/api/manus/section', request);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.section_name).toBe('Summary');
      expect(response.data.template).toBe('jorc_2012');
      expect(response.data.content).toBeDefined();
      expect(response.data.content.length).toBeGreaterThan(100);
      expect(response.data.word_count).toBeGreaterThan(0);
      expect(response.data.timestamp).toBeDefined();
    }, 10000); // 10s timeout

    it('should generate section with custom data', async () => {
      const request = {
        section_name: 'Geology and Geological Interpretation',
        template: 'jorc_2012',
        project_name: 'Iron Ore Project',
        data: {
          geology: {
            rock_type: 'Banded Iron Formation (BIF)',
            age: 'Paleoproterozoic',
            mineralization: 'High-grade hematite',
            structural_controls: 'Fold hinges and thrust zones'
          }
        }
      };

      const response = await client.post('/api/manus/section', request);
      
      expect(response.status).toBe(200);
      expect(response.data.content).toBeDefined();
      expect(response.data.content.toLowerCase()).toContain('iron');
    }, 10000);

    it('should return error for invalid template', async () => {
      const request = {
        section_name: 'Summary',
        template: 'invalid_template',
        project_name: 'Test Project',
        data: {}
      };

      try {
        await client.post('/api/manus/section', request);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should complete in less than 10 seconds', async () => {
      const request = {
        section_name: 'Summary',
        template: 'prms',
        project_name: 'Oil & Gas Field',
        data: {
          reserves: '50 MMbbl',
          location: 'North Sea'
        }
      };

      const start = Date.now();
      await client.post('/api/manus/section', request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10000);
    }, 15000);
  });

  describe('Report Generation', () => {
    it('should generate PRMS report (fast)', async () => {
      const request = {
        template: 'prms',
        project_name: 'Offshore Oil Field',
        commodity: 'Crude Oil',
        location: 'Gulf of Mexico',
        data: {
          reserves: {
            proved: '100 MMbbl',
            probable: '50 MMbbl'
          },
          production: {
            rate: '10,000 bbl/day'
          }
        },
        format: 'json'
      };

      const response = await client.post('/api/manus/generate', request);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.template).toBe('prms');
      expect(response.data.template_name).toBe('PRMS Executive Summary');
      expect(response.data.sections).toBe(7);
      expect(response.data.sections_data).toHaveLength(7);

      // Quality check
      expect(response.data.quality).toBeDefined();
      expect(response.data.quality.score).toBeGreaterThan(0);
      expect(response.data.quality.score).toBeLessThanOrEqual(100);
      expect(response.data.quality.breakdown).toBeDefined();

      // Metadata
      expect(response.data.metadata.project).toBe('Offshore Oil Field');
      expect(response.data.metadata.total_words).toBeGreaterThan(0);
    }, 60000); // 60s timeout for full report

    it('should validate quality metrics', async () => {
      const request = {
        template: 'prms',
        project_name: 'Test Field',
        commodity: 'Natural Gas',
        location: 'Texas, USA',
        data: {
          reserves: { proved: '1 Tcf' }
        },
        format: 'json'
      };

      const response = await client.post('/api/manus/generate', request);
      
      const quality = response.data.quality;
      expect(quality.breakdown.compliance_score).toBeGreaterThan(0);
      expect(quality.breakdown.technical_quality).toBeGreaterThan(0);
      expect(quality.breakdown.completeness).toBeGreaterThan(0);
      expect(quality.breakdown.presentation).toBeGreaterThan(0);

      expect(quality.statistics).toBeDefined();
      expect(quality.statistics.word_count).toBeGreaterThan(0);
      expect(quality.statistics.section_count).toBe(7);
    }, 60000);

    it('should generate with minimal data', async () => {
      const request = {
        template: 'prms',
        project_name: 'Minimal Test',
        data: {},
        format: 'json'
      };

      const response = await client.post('/api/manus/generate', request);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('success');
      expect(response.data.sections).toBe(7);
    }, 60000);

    it('should handle text format output', async () => {
      const request = {
        template: 'prms',
        project_name: 'Text Format Test',
        data: { reserves: { proved: '50 MMbbl' } },
        format: 'text'
      };

      const response = await client.post('/api/manus/generate', request);
      
      expect(response.status).toBe(200);
      expect(response.data.metadata.format).toBe('text');
    }, 60000);
  });

  describe('Quality Validation', () => {
    it('should validate report content', async () => {
      const content = `
PRMS EXECUTIVE SUMMARY

1. Overview
This report presents petroleum resources assessment...

2. Resources Summary
Total resources: 100 MMbbl

3. Reserves Summary
Proved reserves: 50 MMbbl
Probable reserves: 30 MMbbl

4. Economic Analysis
NPV @ 10%: $500M

5. Key Assumptions
Oil price: $70/bbl
Discount rate: 10%

6. Risks and Uncertainties
- Geological risk: Medium
- Market risk: Low

7. Recommendations
Proceed with development
      `;

      const response = await client.post('/api/manus/validate', {
        content,
        template: 'prms'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.status).toMatch(/pass|warning/);
      expect(response.data.score).toBeGreaterThan(0);
      expect(response.data.score).toBeLessThanOrEqual(100);
      expect(response.data.breakdown).toBeDefined();
    });

    it('should detect low quality content', async () => {
      const content = 'This is a very short and incomplete report.';

      const response = await client.post('/api/manus/validate', {
        content,
        template: 'jorc_2012'
      });
      
      expect(response.status).toBe(200);
      expect(response.data.score).toBeLessThan(50);
    });
  });

  describe('Quick Test', () => {
    it('should perform quick functionality test', async () => {
      const response = await client.post('/api/manus/test');
      
      expect(response.status).toBe(200);
      expect(response.data.status).toMatch(/success|warning/);
      expect(response.data.test).toBe('section_generation');
      expect(response.data.template).toBe('prms');
      expect(response.data.message).toBeDefined();
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle missing required fields', async () => {
      try {
        await client.post('/api/manus/generate', {
          // Missing template
          project_name: 'Test'
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBe(422); // Validation error
      }
    });

    it('should handle invalid template for section generation', async () => {
      try {
        await client.post('/api/manus/section', {
          section_name: 'Summary',
          template: 'non_existent',
          project_name: 'Test',
          data: {}
        });
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('Performance Benchmarks', () => {
    it('templates endpoint should respond in < 1s', async () => {
      const start = Date.now();
      await client.get('/api/manus/templates');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(1000);
    });

    it('health check should respond in < 2s', async () => {
      const start = Date.now();
      await client.get('/api/manus/health');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(2000);
    });

    it('section generation should complete in < 10s', async () => {
      const request = {
        section_name: 'Overview',
        template: 'prms',
        project_name: 'Performance Test',
        data: {}
      };

      const start = Date.now();
      await client.post('/api/manus/section', request);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10000);
    }, 15000);
  });
});
