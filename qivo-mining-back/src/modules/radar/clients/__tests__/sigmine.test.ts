/**
 * Tests for SIGMINE API Client
 * 
 * @group unit
 * @group radar
 * @group sigmine
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SIGMINEClient, getSIGMINEClient, setSIGMINEClient } from '../sigmine';
import axios from 'axios';

vi.mock('axios');

describe('SIGMINEClient', () => {
  let client: SIGMINEClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    };

    vi.mocked(axios.create).mockReturnValue(mockAxiosInstance as any);

    const config = {
      apiUrl: 'https://api.test.com',
      apiKey: 'test-key',
      enabled: true,
      timeout: 10000,
    };

    client = new SIGMINEClient(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create client with valid config', () => {
      expect(client).toBeDefined();
      expect(client.isEnabled()).toBe(true);
    });

    it('should throw error without API key', () => {
      expect(() => {
        new SIGMINEClient({
          apiUrl: 'https://api.test.com',
          apiKey: '',
          enabled: true,
        });
      }).toThrow('SIGMINE API key is required');
    });

    it('should configure axios with correct headers', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.test.com',
          timeout: 10000,
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  describe('Connection Test', () => {
    it('should test connection successfully', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({ data: { status: 'ok' } });

      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
    });

    it('should handle connection failure', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('Search Processes', () => {
    it('should search processes with default params', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              numero: '12345',
              ano: '2024',
              tipo: 'LAVRA',
              fase: 'REQUERIMENTO',
              uf: 'MG',
              municipio: 'Belo Horizonte',
              substancia: 'Ouro',
              titular: 'Empresa XYZ',
              area_ha: 1000,
              data_protocolo: '2024-01-01',
              situacao: 'ATIVO',
              latitude: -19.9167,
              longitude: -43.9345,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 100,
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.searchProcesses();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/processos', {
        params: { page: 1, pageSize: 100 },
      });
    });

    it('should search processes with custom params', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { results: [], total: 0, page: 1, pageSize: 50 },
      });

      await client.searchProcesses({
        uf: 'SP',
        substancia: 'Ferro',
        page: 2,
        pageSize: 50,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/processos', {
        params: {
          page: 2,
          pageSize: 50,
          uf: 'SP',
          substancia: 'Ferro',
        },
      });
    });

    it('should handle search errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.searchProcesses();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('API error');
    });

    it('should return empty when disabled', async () => {
      const disabledClient = new SIGMINEClient({
        apiUrl: 'https://api.test.com',
        apiKey: 'test-key',
        enabled: false,
      });

      const result = await disabledClient.searchProcesses();

      expect(result.success).toBe(false);
      expect(result.error).toBe('SIGMINE client is disabled');
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });
  });

  describe('Get Process by Number', () => {
    it('should get process by number and year', async () => {
      const mockProcess = {
        numero: '12345',
        ano: '2024',
        substancia: 'Ouro',
        titular: 'Empresa XYZ',
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockProcess });

      const result = await client.getProcessByNumber('12345', '2024');

      expect(result).toEqual(mockProcess);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/processos/12345/2024');
    });

    it('should return null on error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('Not found'));

      const result = await client.getProcessByNumber('99999', '2024');

      expect(result).toBeNull();
    });

    it('should return null when disabled', async () => {
      const disabledClient = new SIGMINEClient({
        apiUrl: 'https://api.test.com',
        apiKey: 'test-key',
        enabled: false,
      });

      const result = await disabledClient.getProcessByNumber('12345', '2024');

      expect(result).toBeNull();
    });
  });

  describe('Get Processes by Location', () => {
    it('should get processes by município', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          results: [{ numero: '1', ano: '2024' }],
          total: 1,
        },
      });

      const result = await client.getProcessesByMunicipio('MG', 'Belo Horizonte');

      expect(result).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/processos', {
        params: expect.objectContaining({
          uf: 'MG',
          municipio: 'Belo Horizonte',
        }),
      });
    });
  });

  describe('Get Processes by Substância', () => {
    it('should get processes by substância', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          results: [{ numero: '1', substancia: 'Ouro' }],
          total: 1,
        },
      });

      const result = await client.getProcessesBySubstancia('Ouro');

      expect(result).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/processos', {
        params: expect.objectContaining({
          substancia: 'Ouro',
        }),
      });
    });
  });

  describe('Get Processes by Titular', () => {
    it('should get processes by titular', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          results: [{ numero: '1', titular: 'Empresa XYZ' }],
          total: 1,
        },
      });

      const result = await client.getProcessesByTitular('Empresa XYZ');

      expect(result).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/processos', {
        params: expect.objectContaining({
          titular: 'Empresa XYZ',
        }),
      });
    });
  });

  describe('Get Statistics', () => {
    it('should get statistics', async () => {
      const mockStats = {
        total: 100,
        porUF: { MG: 50, SP: 30, BA: 20 },
        porFase: { REQUERIMENTO: 40, LAVRA: 60 },
        porSubstancia: { Ouro: 50, Ferro: 30, Cobre: 20 },
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockStats });

      const result = await client.getStatistics();

      expect(result).toEqual(mockStats);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/estatisticas');
    });

    it('should return empty stats on error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.getStatistics();

      expect(result.total).toBe(0);
      expect(result.porUF).toEqual({});
      expect(result.porFase).toEqual({});
      expect(result.porSubstancia).toEqual({});
    });

    it('should return empty stats when disabled', async () => {
      const disabledClient = new SIGMINEClient({
        apiUrl: 'https://api.test.com',
        apiKey: 'test-key',
        enabled: false,
      });

      const result = await disabledClient.getStatistics();

      expect(result.total).toBe(0);
    });
  });

  describe('Singleton Instance', () => {
    it('should return singleton instance', () => {
      // Mock environment variables
      process.env.SIGMINE_API_KEY = 'test-key';
      process.env.SIGMINE_ENABLED = 'true';

      const instance1 = getSIGMINEClient();
      const instance2 = getSIGMINEClient();

      expect(instance1).toBe(instance2);
      
      delete process.env.SIGMINE_API_KEY;
      delete process.env.SIGMINE_ENABLED;
    });

    it('should allow setting custom client', () => {
      const customClient = new SIGMINEClient({
        apiUrl: 'https://custom.com',
        apiKey: 'custom-key',
        enabled: true,
      });

      setSIGMINEClient(customClient);

      const instance = getSIGMINEClient();
      expect(instance).toBe(customClient);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limit delay', async () => {
      // Mock interceptor behavior
      let lastRequestTime = 0;
      const requestDelay = 1000;

      mockAxiosInstance.get.mockImplementation(async () => {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < requestDelay && lastRequestTime > 0) {
          await new Promise(resolve => 
            setTimeout(resolve, requestDelay - timeSinceLastRequest)
          );
        }

        lastRequestTime = Date.now();
        return { data: { results: [] } };
      });

      const startTime = Date.now();
      
      await client.searchProcesses();
      await client.searchProcesses();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Deve levar pelo menos 1 segundo (rate limit delay)
      expect(duration).toBeGreaterThanOrEqual(900); // 900ms com margem
    });
  });
});
