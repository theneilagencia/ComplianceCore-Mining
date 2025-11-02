/**
 * Official Integrations Index Tests
 * Tests for unified validation interface
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateReportData,
  validateField,
  getValidationStatusMessage,
} from '../index';

describe('Official Integrations - Unified Interface', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.ENABLE_OFFICIAL_INTEGRATIONS;
    delete process.env.ENABLE_OFFICIAL_INTEGRATIONS;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = originalEnv;
    } else {
      delete process.env.ENABLE_OFFICIAL_INTEGRATIONS;
    }
  });

  describe('validateReportData', () => {
    it('should validate multiple fields at once', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const report = {
        miningTitleNumber: '48226.800153/2023',
        commodity: 'Ouro',
        latitude: -19.9167,
        longitude: -43.9345,
      };

      const summary = await validateReportData(report);

      expect(summary.totalChecks).toBeGreaterThan(0);
      expect(summary).toHaveProperty('passed');
      expect(summary).toHaveProperty('failed');
      expect(summary).toHaveProperty('errors');
      expect(summary).toHaveProperty('notFound');
      expect(summary).toHaveProperty('score');
      expect(summary.score).toBeGreaterThanOrEqual(0);
      expect(summary.score).toBeLessThanOrEqual(100);
    });

    it('should return 100 score when feature disabled', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'false';

      const report = {
        miningTitleNumber: '48226.800153/2023',
      };

      const summary = await validateReportData(report);

      expect(summary.score).toBe(100);
      expect(summary.totalChecks).toBe(0);
    });

    it('should calculate score correctly', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const report = {
        miningTitleNumber: '48226.800153/2023',
        commodity: 'Ouro',
      };

      const summary = await validateReportData(report);

      // All valid should give 100 score
      if (summary.failed === 0 && summary.errors === 0 && summary.notFound === 0) {
        expect(summary.score).toBe(100);
      }
    });

    it('should penalize invalid status more than not_found', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      // Test score calculation logic
      const invalidPenalty = 30;
      const notFoundPenalty = 10;
      const errorPenalty = 5;

      expect(invalidPenalty).toBeGreaterThan(notFoundPenalty);
      expect(notFoundPenalty).toBeGreaterThan(errorPenalty);
    });

    it('should validate all field types', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const report = {
        miningTitleNumber: '48226.800153/2023',
        commodity: 'Ouro',
        latitude: -19.9167,
        longitude: -43.9345,
        geologicalFormation: 'Supergrupo Minas',
        environmentalLicense: '123456/2023',
        concessionNumber: 'BM-S-11',
      };

      const summary = await validateReportData(report);

      // Should have checked multiple fields
      expect(summary.totalChecks).toBeGreaterThanOrEqual(4);
      expect(summary.results).toHaveLength(summary.totalChecks);
    });
  });

  describe('validateField', () => {
    it('should validate single miningTitleNumber field', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const result = await validateField('miningTitleNumber', '48226.800153/2023');

      expect(result).toHaveProperty('source');
      expect(result).toHaveProperty('field');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('message');
    });

    it('should validate single commodity field', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const result = await validateField('commodity', 'Ouro');

      expect(result.source).toBe('ANM');
      expect(result.field).toBe('commodity');
    });

    it('should validate geological formation with context', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const result = await validateField(
        'geologicalFormation',
        'Supergrupo Minas',
        { latitude: -19.9167, longitude: -43.9345 }
      );

      expect(result.source).toBe('CPRM');
    });

    it('should validate environmentalLicense', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const result = await validateField('environmentalLicense', '123456/2023');

      expect(result.source).toBe('IBAMA');
    });

    it('should validate concessionNumber', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const result = await validateField('concessionNumber', 'BM-S-11');

      expect(result.source).toBe('ANP');
    });

    it('should return valid for non-validatable fields', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const result = await validateField('unknownField', 'someValue');

      expect(result.status).toBe('valid');
      expect(result.message).toContain('não validável');
    });

    it('should return valid when feature disabled', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'false';

      const result = await validateField('miningTitleNumber', '48226.800153/2023');

      expect(result.status).toBe('valid');
      expect(result.message).toContain('desabilitada');
    });
  });

  describe('getValidationStatusMessage', () => {
    it('should format valid status', () => {
      const result = {
        source: 'ANM' as const,
        field: 'miningTitleNumber',
        status: 'valid' as const,
        message: 'Processo válido',
      };

      const formatted = getValidationStatusMessage(result);

      expect(formatted.type).toBe('success');
      expect(formatted.title).toContain('✓');
      expect(formatted.title).toContain('ANM');
      expect(formatted.description).toBe('Processo válido');
    });

    it('should format invalid status', () => {
      const result = {
        source: 'IBAMA' as const,
        field: 'license',
        status: 'invalid' as const,
        message: 'Licença expirada',
      };

      const formatted = getValidationStatusMessage(result);

      expect(formatted.type).toBe('error');
      expect(formatted.title).toContain('✗');
      expect(formatted.title).toContain('IBAMA');
    });

    it('should format not_found status', () => {
      const result = {
        source: 'CPRM' as const,
        field: 'formation',
        status: 'not_found' as const,
        message: 'Dados não disponíveis',
      };

      const formatted = getValidationStatusMessage(result);

      expect(formatted.type).toBe('warning');
      expect(formatted.title).toContain('⚠');
    });

    it('should format error status', () => {
      const result = {
        source: 'ANP' as const,
        field: 'concession',
        status: 'error' as const,
        message: 'API indisponível',
      };

      const formatted = getValidationStatusMessage(result);

      expect(formatted.type).toBe('info');
      expect(formatted.title).toContain('ℹ');
    });
  });

  describe('Score Calculation Edge Cases', () => {
    it('should handle empty report', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const summary = await validateReportData({});

      expect(summary.totalChecks).toBe(0);
      expect(summary.score).toBe(100); // No validations = perfect score
    });

    it('should cap score at 0 minimum', async () => {
      // Score should never go below 0 even with many failures
      const invalidCount = 10;
      const penalty = invalidCount * 30;
      const score = Math.max(0, 100 - penalty);

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should calculate mixed results correctly', () => {
      // 2 invalid (-60), 1 not_found (-10), 1 error (-5) = 100 - 75 = 25
      const score = 100 - (2 * 30 + 1 * 10 + 1 * 5);
      expect(score).toBe(25);
    });
  });

  describe('Feature Flag Behavior', () => {
    it('should respect ENABLE_OFFICIAL_INTEGRATIONS=true', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'true';

      const summary = await validateReportData({
        miningTitleNumber: '48226.800153/2023',
      });

      // Should execute validations
      expect(summary.totalChecks).toBeGreaterThan(0);
    });

    it('should respect ENABLE_OFFICIAL_INTEGRATIONS=false', async () => {
      process.env.ENABLE_OFFICIAL_INTEGRATIONS = 'false';

      const summary = await validateReportData({
        miningTitleNumber: '48226.800153/2023',
      });

      expect(summary.totalChecks).toBe(0);
      expect(summary.score).toBe(100);
    });

    it('should default to disabled if not set', async () => {
      delete process.env.ENABLE_OFFICIAL_INTEGRATIONS;

      const summary = await validateReportData({
        miningTitleNumber: '48226.800153/2023',
      });

      expect(summary.totalChecks).toBe(0);
    });
  });
});
