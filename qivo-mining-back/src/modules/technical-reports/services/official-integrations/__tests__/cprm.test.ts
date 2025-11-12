/**
 * CPRM Integration Tests
 * Tests for Serviço Geológico do Brasil API validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateWithCPRM_Real } from '../cprm';

describe('CPRM Integration', () => {
  beforeEach(() => {
    delete process.env.CPRM_API_KEY;
    vi.clearAllMocks();
  });

  describe('validateWithCPRM_Real - Coordinate Validation', () => {
    it('should reject coordinates outside Brazil (north)', async () => {
      const result = await validateWithCPRM_Real(10.0, -50.0); // Above 5.27

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('fora dos limites');
    });

    it('should reject coordinates outside Brazil (south)', async () => {
      const result = await validateWithCPRM_Real(-40.0, -50.0); // Below -33.75

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('fora dos limites');
    });

    it('should reject coordinates outside Brazil (east)', async () => {
      const result = await validateWithCPRM_Real(-15.0, -25.0); // East of -28.84

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('fora dos limites');
    });

    it('should reject coordinates outside Brazil (west)', async () => {
      const result = await validateWithCPRM_Real(-15.0, -75.0); // West of -73.99

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('fora dos limites');
    });

    it('should accept valid coordinates in Brazil', async () => {
      // Brasília coordinates
      const result = await validateWithCPRM_Real(-15.7801, -47.9292);

      expect(['valid', 'error', 'not_found']).toContain(result.status);
    });

    it('should accept coordinates at north boundary', async () => {
      const result = await validateWithCPRM_Real(5.27, -60.0);

      expect(result.status).not.toBe('invalid');
    });

    it('should accept coordinates at south boundary', async () => {
      const result = await validateWithCPRM_Real(-33.75, -53.0);

      expect(result.status).not.toBe('invalid');
    });
  });

  describe('validateWithCPRM_Real - Mock Fallback', () => {
    it('should use mock validation when API key not configured', async () => {
      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(result.message).toContain('MOCK');
    });

    it('should include coordinates in mock response', async () => {
      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(result.reportValue).toEqual({
        latitude: -19.9167,
        longitude: -43.9345,
        formation: undefined,
      });
    });
  });

  describe('validateWithCPRM_Real - API Integration', () => {
    beforeEach(() => {
      process.env.CPRM_API_KEY = 'test-api-key';
    });

    it('should make API request with valid coordinates', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: -19.9167,
          longitude: -43.9345,
          formacao_geologica: 'Supergrupo Minas',
          idade_geologica: 'Paleoproterozoico',
          litologia: 'Formação Ferrífera Bandada',
          mineralizacao: ['Ferro', 'Ouro'],
          provincia_mineral: 'Quadrilátero Ferrífero',
          fonte: 'Mapa Geológico do Brasil 1:1.000.000',
        }),
      });

      global.fetch = mockFetch as any;

      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://geosgb.cprm.gov.br/api/v1/geology?lat=-19.9167&lon=-43.9345',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );

      expect(result.status).toBe('valid');
      expect(result.officialValue).toBeDefined();
    });

    it('should validate geological formation match', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          formacao_geologica: 'Supergrupo Minas',
          idade_geologica: 'Paleoproterozoico',
          litologia: 'Itabirito',
          mineralizacao: ['Ferro'],
        }),
      });

      const result = await validateWithCPRM_Real(-19.9167, -43.9345, 'Supergrupo Minas');

      expect(result.status).toBe('valid');
    });

    it('should detect formation mismatch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          formacao_geologica: 'Grupo Bambuí',
          idade_geologica: 'Neoproterozoico',
          litologia: 'Calcário',
        }),
      });

      const result = await validateWithCPRM_Real(-19.9167, -43.9345, 'Supergrupo Minas');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('divergente');
    });

    it('should handle 404 not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(result.status).toBe('not_found');
      expect(result.message).toContain('não disponíveis');
    });
  });

  describe('Famous Brazilian Locations', () => {
    const testCases = [
      { name: 'Quadrilátero Ferrífero (Ouro Preto)', lat: -20.3858, lon: -43.5033 },
      { name: 'Carajás (Parauapebas)', lat: -6.0644, lon: -50.1597 },
      { name: 'Vale do Ribeira', lat: -24.7133, lon: -47.8414 },
      { name: 'Serra dos Carajás', lat: -6.3333, lon: -49.9167 },
    ];

    testCases.forEach(({ name, lat, lon }) => {
      it(`should accept coordinates for ${name}`, async () => {
        const result = await validateWithCPRM_Real(lat, lon);

        expect(result.status).not.toBe('invalid');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      process.env.CPRM_API_KEY = 'test-api-key';
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(result.status).toBe('error');
      expect(result.message).toContain('Erro ao consultar CPRM');
    });

    it('should handle timeout', async () => {
      process.env.CPRM_API_KEY = 'test-api-key';
      global.fetch = vi.fn().mockRejectedValue(new Error('timeout'));

      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(result.status).toBe('error');
    });
  });

  describe('Response Format', () => {
    it('should include CPRM URL', async () => {
      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(result.url).toContain('geosgb.cprm.gov.br');
    });

    it('should set source as CPRM', async () => {
      const result = await validateWithCPRM_Real(-19.9167, -43.9345);

      expect(result.source).toBe('CPRM');
    });

    it('should include coordinates in response', async () => {
      const result = await validateWithCPRM_Real(-19.9167, -43.9345, 'Supergrupo Minas');

      expect(result.reportValue).toMatchObject({
        latitude: -19.9167,
        longitude: -43.9345,
        formation: 'Supergrupo Minas',
      });
    });
  });
});
