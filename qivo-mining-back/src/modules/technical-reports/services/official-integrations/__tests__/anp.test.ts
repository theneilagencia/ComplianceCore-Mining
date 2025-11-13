/**
 * ANP Integration Tests
 * Tests for Agência Nacional do Petróleo API validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateWithANP_Real } from '../anp';

describe('ANP Integration', () => {
  beforeEach(() => {
    delete process.env.ANP_API_KEY;
    vi.clearAllMocks();
  });

  describe('validateWithANP_Real - Format Validation', () => {
    it('should reject invalid format', async () => {
      const result = await validateWithANP_Real('invalid-format');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('Formato de bloco ANP inválido');
    });

    it('should accept valid format BM-S-11', async () => {
      const result = await validateWithANP_Real('BM-S-11');

      expect(['valid', 'error', 'not_found']).toContain(result.status);
    });

    it('should accept valid format ES-T-19', async () => {
      const result = await validateWithANP_Real('ES-T-19');

      expect(['valid', 'error', 'not_found']).toContain(result.status);
    });

    it('should accept 3-letter prefix (e.g., POT-M-659)', async () => {
      const result = await validateWithANP_Real('POT-M-659');

      expect(['valid', 'error', 'not_found']).toContain(result.status);
    });

    it('should reject format without hyphens', async () => {
      const result = await validateWithANP_Real('BMS11');

      expect(result.status).toBe('invalid');
    });

    it('should reject format with lowercase', async () => {
      const result = await validateWithANP_Real('bm-s-11');

      expect(result.status).toBe('invalid');
    });

    it('should reject format with wrong separators', async () => {
      const result = await validateWithANP_Real('BM_S_11');

      expect(result.status).toBe('invalid');
    });
  });

  describe('validateWithANP_Real - Mock Fallback', () => {
    it('should use mock validation when API key not configured', async () => {
      const result = await validateWithANP_Real('BM-S-11');

      expect(result.message).toContain('MOCK');
    });
  });

  describe('validateWithANP_Real - API Integration', () => {
    beforeEach(() => {
      process.env.ANP_API_KEY = 'test-api-key';
    });

    it('should validate ATIVO concession', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bloco: 'BM-S-11',
          bacia: 'Santos',
          situacao: 'ATIVO',
          fase: 'PRODUÇÃO',
          concessao_numero: 'ANP/DPC-002/2010',
          operador: {
            nome: 'Petrobras S.A.',
            cnpj: '33.000.167/0001-01',
            participacao: 65.0,
          },
          participantes: [],
          data_inicio: '2010-12-15',
          data_termino: '2045-12-15',
          area_km2: 800.5,
          laminaDagua_m: 2150,
          producao: {
            petroleo_bpd: 150000,
            gas_m3d: 8500000,
          },
        }),
      });

      global.fetch = mockFetch as any;

      const result = await validateWithANP_Real('BM-S-11');

      expect(result.status).toBe('valid');
      expect(result.officialValue?.bacia).toBe('Santos');
      expect(result.officialValue?.fase).toBe('PRODUÇÃO');
    });

    it('should reject ENCERRADO concession', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bloco: 'ES-T-19',
          bacia: 'Espírito Santo',
          situacao: 'ENCERRADO',
          fase: 'EXPLORAÇÃO',
          data_termino: '2020-12-31',
        }),
      });

      const result = await validateWithANP_Real('ES-T-19');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('NÃO está ATIVO');
    });

    it('should reject DEVOLVIDO concession', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bloco: 'BM-S-11',
          situacao: 'DEVOLVIDO',
        }),
      });

      const result = await validateWithANP_Real('BM-S-11');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('DEVOLVIDO');
    });

    it('should check expiration date', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bloco: 'BM-S-11',
          situacao: 'ATIVO',
          fase: 'PRODUÇÃO',
          data_termino: pastDate.toISOString().split('T')[0],
        }),
      });

      const result = await validateWithANP_Real('BM-S-11');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('EXPIRADA');
    });

    it('should accept EXPLORAÇÃO phase', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bloco: 'BM-S-50',
          bacia: 'Santos',
          situacao: 'ATIVO',
          fase: 'EXPLORAÇÃO',
          data_termino: '2030-12-31',
          operador: { nome: 'Shell Brasil', cnpj: '...' },
        }),
      });

      const result = await validateWithANP_Real('BM-S-50');

      expect(result.status).toBe('valid');
    });

    it('should accept DESENVOLVIMENTO phase', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          bloco: 'BM-S-11',
          situacao: 'ATIVO',
          fase: 'DESENVOLVIMENTO',
          data_termino: '2040-12-31',
        }),
      });

      const result = await validateWithANP_Real('BM-S-11');

      expect(result.status).toBe('valid');
    });

    it('should handle 404 not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await validateWithANP_Real('BM-S-11');

      expect(result.status).toBe('not_found');
      expect(result.message).toContain('não encontrado');
    });
  });

  describe('Famous Brazilian Basins', () => {
    const testCases = [
      'BM-S-11', // Santos
      'ES-T-19', // Espírito Santo
      'BM-C-33', // Campos
      'BM-SEAL-10', // Sergipe-Alagoas
      'POT-M-659', // Potiguar
    ];

    testCases.forEach((block) => {
      it(`should accept format for block ${block}`, async () => {
        const result = await validateWithANP_Real(block);

        expect(result.status).not.toBe('invalid');
      });
    });
  });

  describe('Response Format', () => {
    it('should include ANP URL', async () => {
      const result = await validateWithANP_Real('BM-S-11');

      expect(result.url).toContain('gov.br/anp');
    });

    it('should set source as ANP', async () => {
      const result = await validateWithANP_Real('BM-S-11');

      expect(result.source).toBe('ANP');
    });

    it('should include block code in response', async () => {
      const result = await validateWithANP_Real('BM-S-11');

      expect(result.reportValue).toBe('BM-S-11');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      process.env.ANP_API_KEY = 'test-api-key';
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await validateWithANP_Real('BM-S-11');

      expect(result.status).toBe('error');
      expect(result.message).toContain('Erro ao consultar ANP');
    });

    it('should handle timeout', async () => {
      process.env.ANP_API_KEY = 'test-api-key';
      global.fetch = vi.fn().mockRejectedValue(new Error('timeout'));

      const result = await validateWithANP_Real('BM-S-11');

      expect(result.status).toBe('error');
    });
  });
});
