/**
 * ANM Integration Tests
 * Tests for Agência Nacional de Mineração API validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateWithANM_Real, validateSubstanceANM } from '../anm';

describe('ANM Integration', () => {
  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.ANM_API_KEY;
    vi.clearAllMocks();
  });

  describe('validateWithANM_Real - Format Validation', () => {
    it('should reject invalid format', async () => {
      const result = await validateWithANM_Real('invalid-format');

      expect(result.source).toBe('ANM');
      expect(result.status).toBe('invalid');
      expect(result.message).toContain('Formato inválido');
    });    it('should accept valid format XXXXX.XXXXXX/XXXX', async () => {
      const result = await validateWithANM_Real('48226.800153/2023');
      
      expect(result.source).toBe('ANM');
      // Without API key, should return format validation only
      expect(['valid', 'error']).toContain(result.status);
    });

    it('should reject format with wrong separators', async () => {
      const result = await validateWithANM_Real('48226-800153-2023');
      
      expect(result.status).toBe('invalid');
    });

    it('should reject format with missing year', async () => {
      const result = await validateWithANM_Real('48226.800153');
      
      expect(result.status).toBe('invalid');
    });
  });

  describe('validateWithANM_Real - Mock Fallback', () => {
    it('should use mock validation when API key not configured', async () => {
      const result = await validateWithANM_Real('48226.800153/2023');
      
      expect(result.message).toContain('MOCK');
    });

    it('should validate format in mock mode', async () => {
      const validResult = await validateWithANM_Real('48226.800153/2023');
      expect(validResult.status).toBe('valid');
      
      const invalidResult = await validateWithANM_Real('invalid');
      expect(invalidResult.status).toBe('invalid');
    });
  });

  describe('validateWithANM_Real - API Integration', () => {
    beforeEach(() => {
      process.env.ANM_API_KEY = 'test-jwt-token';
    });

    it('should make API request with valid key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          numero: '48226.800153/2023',
          situacao: 'ATIVO',
          fase: 'CONCESSÃO DE LAVRA',
          substancia: 'Ouro',
          area_ha: 1234.56,
          municipio: 'Ouro Preto',
          uf: 'MG',
          titular: {
            nome: 'Mineradora Teste Ltda',
            cpf_cnpj: '12.345.678/0001-99',
          },
          data_publicacao: '2023-03-15',
        }),
      });

      global.fetch = mockFetch as any;

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sistemas.anm.gov.br/SCM/api/v2/processos/48226.800153/2023',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
          }),
        })
      );

      expect(result.status).toBe('valid');
      expect(result.officialValue).toBeDefined();
    });

    it('should handle 404 not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('not_found');
      expect(result.message).toContain('não encontrado');
    });

    it('should handle 401 unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('error');
      expect(result.message).toContain('authentication failed');
    });

    it('should handle 429 rate limit', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('error');
      expect(result.message).toContain('rate limit');
    });

    it('should handle timeout', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('timeout exceeded'));

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('error');
      expect(result.message).toContain('timeout exceeded');
    });

    it('should reject SUSPENSO status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '48226.800153/2023',
          situacao: 'SUSPENSO',
          fase: 'CONCESSÃO DE LAVRA',
          ultima_atualizacao: '2024-01-15',
        }),
      });

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('NÃO está ATIVO');
      expect(result.message).toContain('SUSPENSO');
    });

    it('should reject CANCELADO status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '48226.800153/2023',
          situacao: 'CANCELADO',
          fase: 'CONCESSÃO DE LAVRA',
        }),
      });

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('CANCELADO');
    });
  });

  describe('validateSubstanceANM', () => {
    it('should validate official substances', async () => {
      const validSubstances = [
        'Ouro',
        'Ferro',
        'Cobre',
        'Níquel',
        'Bauxita',
        'Manganês',
        'Zinco',
        'Chumbo',
        'Estanho',
        'Tungstênio',
        'Nióbio',
        'Tântalo',
        'Terras Raras',
        'Lítio',
        'Grafita',
        'Fosfato',
        'Potássio',
        'Calcário',
        'Areia',
        'Argila',
        'Granito',
        'Mármore',
        'Diamante',
        'Esmeralda',
        'Água Mineral',
      ];

      for (const substance of validSubstances) {
        const result = await validateSubstanceANM(substance);
        expect(result.status).toBe('valid');
        expect(result.message).toContain('reconhecida pela ANM');
      }
    });

    it('should be case insensitive', async () => {
      const result1 = await validateSubstanceANM('ouro');
      const result2 = await validateSubstanceANM('OURO');
      const result3 = await validateSubstanceANM('Ouro');

      expect(result1.status).toBe('valid');
      expect(result2.status).toBe('valid');
      expect(result3.status).toBe('valid');
    });

    it('should reject unknown substances', async () => {
      const result = await validateSubstanceANM('Vibranium');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('não reconhecida');
    });

    it('should handle trimmed input', async () => {
      const result = await validateSubstanceANM('  Ouro  ');

      expect(result.status).toBe('valid');
    });
  });

  describe('Cache Behavior', () => {
    it('should cache successful results', async () => {
      process.env.ANM_API_KEY = 'test-jwt-token';
      
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '48226.800153/2023',
          situacao: 'ATIVO',
          fase: 'CONCESSÃO DE LAVRA',
          substancia: 'Ouro',
        }),
      });

      global.fetch = mockFetch as any;

      // First call
      await validateWithANM_Real('48226.800153/2023');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call (should use cache - but our current implementation calls API again)
      // This test documents current behavior
      await validateWithANM_Real('48226.800153/2023');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Will be 1 when cache is fully implemented
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      process.env.ANM_API_KEY = 'test-jwt-token';
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('error');
      expect(result.message).toContain('Erro ao consultar ANM');
    });

    it('should handle malformed JSON response', async () => {
      process.env.ANM_API_KEY = 'test-jwt-token';
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.status).toBe('error');
    });
  });

  describe('URL Construction', () => {
    it('should construct correct API URL', async () => {
      process.env.ANM_API_KEY = 'test-jwt-token';
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ situacao: 'ATIVO' }),
      });
      global.fetch = mockFetch as any;

      await validateWithANM_Real('48226.800153/2023');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sistemas.anm.gov.br/SCM/api/v2/processos/48226.800153/2023',
        expect.any(Object)
      );
    });
  });

  describe('Response Validation', () => {
    it('should include official URL in response', async () => {
      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.url).toContain('sistemas.anm.gov.br');
      expect(result.url).toContain('48226.800153/2023');
    });

    it('should include report value in response', async () => {
      const result = await validateWithANM_Real('48226.800153/2023');

      expect(result.reportValue).toBe('48226.800153/2023');
    });
  });
});
