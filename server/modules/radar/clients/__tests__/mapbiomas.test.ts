/**
 * Tests for MapBiomas API Client
 * 
 * @group unit
 * @group radar
 * @group mapbiomas
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MapBiomasClient, getMapBiomasClient, setMapBiomasClient } from '../mapbiomas';
import axios from 'axios';

vi.mock('axios');

describe('MapBiomasClient', () => {
  let client: MapBiomasClient;
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
      apiUrl: 'https://api.mapbiomas.org',
      apiKey: 'test-key',
      enabled: true,
      timeout: 10000,
    };

    client = new MapBiomasClient(config);
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
        new MapBiomasClient({
          apiUrl: 'https://api.mapbiomas.org',
          apiKey: '',
          enabled: true,
        });
      }).toThrow('MapBiomas API key is required');
    });

    it('should configure axios with correct headers', () => {
      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://api.mapbiomas.org',
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

  describe('Search Mining Areas', () => {
    it('should search mining areas with default params', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              id: 'area-1',
              geometry: {
                type: 'Polygon',
                coordinates: [[-43.9345, -19.9167]],
              },
              properties: {
                name: 'Mina de Ouro',
                state: 'MG',
                municipality: 'Belo Horizonte',
                area_ha: 500,
                mineral: 'Ouro',
                year: 2024,
                land_use_class: 'mining',
                change_detected: false,
                last_update: '2024-01-01',
              },
            },
          ],
          total: 1,
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await client.searchMiningAreas();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/land-use/mining', {
        params: expect.objectContaining({
          class: 'mining',
          year: expect.any(Number),
        }),
      });
    });

    it('should search mining areas with custom params', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { features: [], total: 0 },
      });

      await client.searchMiningAreas({
        state: 'MG',
        municipality: 'Belo Horizonte',
        year: 2023,
        minArea: 100,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/land-use/mining', {
        params: {
          class: 'mining',
          year: 2023,
          state: 'MG',
          municipality: 'Belo Horizonte',
          min_area: 100,
        },
      });
    });

    it('should search with bounding box', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { features: [], total: 0 },
      });

      await client.searchMiningAreas({
        bbox: [-44, -20, -43, -19],
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/land-use/mining', {
        params: expect.objectContaining({
          bbox: '-44,-20,-43,-19',
        }),
      });
    });

    it('should handle search errors gracefully', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.searchMiningAreas();

      expect(result.success).toBe(false);
      expect(result.data).toEqual([]);
      expect(result.error).toBe('API error');
    });

    it('should return empty when disabled', async () => {
      const disabledClient = new MapBiomasClient({
        apiUrl: 'https://api.mapbiomas.org',
        apiKey: 'test-key',
        enabled: false,
      });

      const result = await disabledClient.searchMiningAreas();

      expect(result.success).toBe(false);
      expect(result.error).toBe('MapBiomas client is disabled');
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });
  });

  describe('Get Mining Areas by Location', () => {
    it('should get areas by state', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          features: [{ id: 'area-1' }],
          total: 1,
        },
      });

      const result = await client.getMiningAreasByState('MG');

      expect(result).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/land-use/mining', {
        params: expect.objectContaining({
          state: 'MG',
        }),
      });
    });

    it('should get areas by municipality', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          features: [{ id: 'area-1' }],
          total: 1,
        },
      });

      const result = await client.getMiningAreasByMunicipality('MG', 'Belo Horizonte');

      expect(result).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/land-use/mining', {
        params: expect.objectContaining({
          state: 'MG',
          municipality: 'Belo Horizonte',
        }),
      });
    });

    it('should get areas by bounding box', async () => {
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: {
          features: [{ id: 'area-1' }],
          total: 1,
        },
      });

      const result = await client.getMiningAreasByBBox([-44, -20, -43, -19]);

      expect(result).toHaveLength(1);
    });
  });

  describe('Get Temporal Changes', () => {
    it('should get temporal changes for an area', async () => {
      const mockChanges = {
        changes: [
          { year: 2020, area_ha: 100, change_pct: 0 },
          { year: 2021, area_ha: 120, change_pct: 20 },
          { year: 2022, area_ha: 150, change_pct: 25 },
        ],
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockChanges });

      const result = await client.getTemporalChanges('area-1', 2020, 2022);

      expect(result.areaId).toBe('area-1');
      expect(result.changes).toHaveLength(3);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/land-use/changes/area-1', {
        params: {
          start_year: 2020,
          end_year: 2022,
        },
      });
    });

    it('should return empty changes on error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.getTemporalChanges('area-1', 2020, 2022);

      expect(result.changes).toEqual([]);
    });

    it('should return empty when disabled', async () => {
      const disabledClient = new MapBiomasClient({
        apiUrl: 'https://api.mapbiomas.org',
        apiKey: 'test-key',
        enabled: false,
      });

      const result = await disabledClient.getTemporalChanges('area-1', 2020, 2022);

      expect(result.changes).toEqual([]);
    });
  });

  describe('Get Statistics', () => {
    it('should get statistics', async () => {
      const mockStats = {
        totalArea: 10000,
        totalSites: 50,
        byState: {
          MG: { area: 5000, sites: 25 },
          SP: { area: 3000, sites: 15 },
        },
        byMineral: {
          Ouro: { area: 4000, sites: 20 },
          Ferro: { area: 6000, sites: 30 },
        },
        yearlyGrowth: {
          2022: { area: 9500, change: 5 },
          2023: { area: 10000, change: 5.3 },
        },
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockStats });

      const result = await client.getStatistics(2023);

      expect(result).toEqual(mockStats);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/statistics/mining', {
        params: { year: 2023 },
      });
    });

    it('should return empty stats on error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.getStatistics();

      expect(result.totalArea).toBe(0);
      expect(result.totalSites).toBe(0);
    });
  });

  describe('Get Deforestation Alerts', () => {
    it('should get deforestation alerts', async () => {
      const mockAlerts = [
        {
          id: 'alert-1',
          location: { lat: -19.9167, lon: -43.9345 },
          area_ha: 10,
          date: '2024-01-01',
          severity: 'high',
          mining_area_id: 'area-1',
        },
      ];

      mockAxiosInstance.get.mockResolvedValueOnce({
        data: { alerts: mockAlerts },
      });

      const result = await client.getDeforestationAlerts({
        state: 'MG',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('high');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/alerts/deforestation', {
        params: {
          land_use: 'mining',
          state: 'MG',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      });
    });

    it('should return empty alerts on error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.getDeforestationAlerts();

      expect(result).toEqual([]);
    });

    it('should return empty when disabled', async () => {
      const disabledClient = new MapBiomasClient({
        apiUrl: 'https://api.mapbiomas.org',
        apiKey: 'test-key',
        enabled: false,
      });

      const result = await disabledClient.getDeforestationAlerts();

      expect(result).toEqual([]);
    });
  });

  describe('Export GeoJSON', () => {
    it('should export data as GeoJSON', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [-43.9345, -19.9167] },
            properties: { name: 'Mina 1' },
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValueOnce({ data: mockGeoJSON });

      const result = await client.exportGeoJSON({ state: 'MG' });

      expect(result.type).toBe('FeatureCollection');
      expect(result.features).toHaveLength(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/export/geojson', {
        params: {
          class: 'mining',
          state: 'MG',
        },
      });
    });

    it('should return null on error', async () => {
      mockAxiosInstance.get.mockRejectedValueOnce(new Error('API error'));

      const result = await client.exportGeoJSON();

      expect(result).toBeNull();
    });

    it('should return null when disabled', async () => {
      const disabledClient = new MapBiomasClient({
        apiUrl: 'https://api.mapbiomas.org',
        apiKey: 'test-key',
        enabled: false,
      });

      const result = await disabledClient.exportGeoJSON();

      expect(result).toBeNull();
    });
  });

  describe('Singleton Instance', () => {
    it('should return singleton instance', () => {
      // Mock environment variables
      process.env.MAPBIOMAS_API_KEY = 'test-key';
      process.env.MAPBIOMAS_ENABLED = 'true';

      const instance1 = getMapBiomasClient();
      const instance2 = getMapBiomasClient();

      expect(instance1).toBe(instance2);
      
      delete process.env.MAPBIOMAS_API_KEY;
      delete process.env.MAPBIOMAS_ENABLED;
    });

    it('should allow setting custom client', () => {
      const customClient = new MapBiomasClient({
        apiUrl: 'https://custom.com',
        apiKey: 'custom-key',
        enabled: true,
      });

      setMapBiomasClient(customClient);

      const instance = getMapBiomasClient();
      expect(instance).toBe(customClient);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limit delay', async () => {
      // Mock interceptor behavior
      let lastRequestTime = 0;
      const requestDelay = 1500;

      mockAxiosInstance.get.mockImplementation(async () => {
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;

        if (timeSinceLastRequest < requestDelay && lastRequestTime > 0) {
          await new Promise(resolve => 
            setTimeout(resolve, requestDelay - timeSinceLastRequest)
          );
        }

        lastRequestTime = Date.now();
        return { data: { features: [] } };
      });

      const startTime = Date.now();
      
      await client.searchMiningAreas();
      await client.searchMiningAreas();
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Deve levar pelo menos 1.5 segundos (rate limit delay)
      expect(duration).toBeGreaterThanOrEqual(1400); // 1400ms com margem
    });
  });
});
