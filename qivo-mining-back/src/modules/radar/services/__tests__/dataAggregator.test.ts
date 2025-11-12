import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  aggregateAllData,
  getDiagnostic,
  type MiningOperation,
  type DataSource,
} from '../dataAggregator';

// Mock axios
vi.mock('axios');

describe('DataAggregator Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('aggregateAllData', () => {
    it('should return operations and sources structure', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await aggregateAllData();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('operations');
      expect(result).toHaveProperty('sources');
      expect(Array.isArray(result.operations)).toBe(true);
      expect(Array.isArray(result.sources)).toBe(true);
    });

    it('should include all expected data sources', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await aggregateAllData();

      expect(result.sources).toHaveLength(5);
      
      const sourceIds = result.sources.map(s => s.id);
      expect(sourceIds).toContain('usgs');
      expect(sourceIds).toContain('gfw');
      expect(sourceIds).toContain('sigmine');
      expect(sourceIds).toContain('mapbiomas');
      expect(sourceIds).toContain('resourcewatch');
    });

    it('should fetch and parse USGS data correctly', async () => {
      const mockUSGSData = {
        features: [
          {
            properties: {
              site_name: 'Golden Gate Mine',
              commodity: 'Gold',
              country: 'USA',
              dev_stat: 'Active',
            },
            geometry: {
              coordinates: [-122.4194, 37.7749],
            },
          },
        ],
      };

      vi.mocked(axios.get).mockResolvedValue({
        data: mockUSGSData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await aggregateAllData();

      expect(result.operations.length).toBeGreaterThan(0);
      
      const usgsSource = result.sources.find(s => s.id === 'usgs');
      expect(usgsSource).toBeDefined();
      expect(usgsSource?.status).toBe('active');
      expect(usgsSource?.entriesCount).toBeGreaterThan(0);
    });

    it('should handle USGS API errors gracefully', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('USGS API timeout'));

      const result = await aggregateAllData();

      // Verify the function completes even with errors
      expect(result).toBeDefined();
      expect(result.sources).toBeDefined();
      
      // Check if error logging occurred (errors are caught and logged)
      const allSources = result.sources;
      expect(allSources.length).toBe(5);
    });

    it('should validate operation coordinates', async () => {
      const mockData = {
        features: [
          {
            properties: {
              site_name: 'Test Mine',
              commodity: 'Copper',
              country: 'Chile',
              dev_stat: 'Active',
            },
            geometry: {
              coordinates: [-70.6483, -33.4569], // Valid coordinates
            },
          },
        ],
      };

      vi.mocked(axios.get).mockResolvedValue({
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await aggregateAllData();

      result.operations.forEach(op => {
        if (op.latitude !== undefined && op.longitude !== undefined) {
          expect(op.latitude).toBeGreaterThanOrEqual(-90);
          expect(op.latitude).toBeLessThanOrEqual(90);
          expect(op.longitude).toBeGreaterThanOrEqual(-180);
          expect(op.longitude).toBeLessThanOrEqual(180);
        }
      });
    });

    it('should handle empty responses from all sources', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await aggregateAllData();

      expect(result.operations).toEqual([]);
      
      // When response is successful but empty, entriesCount should be 0
      result.sources.forEach(source => {
        expect(source.entriesCount).toBe(0);
      });
    });

    it('should update lastSync timestamps for successful sources', async () => {
      const beforeTime = new Date().toISOString();
      
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await aggregateAllData();

      const afterTime = new Date().toISOString();

      // At least some sources should have lastSync updated
      const sourcesWithSync = result.sources.filter(s => s.lastSync && s.lastSync !== '');
      expect(sourcesWithSync.length).toBeGreaterThan(0);
      
      sourcesWithSync.forEach(source => {
        // Verify timestamp is between before and after
        expect(new Date(source.lastSync).getTime()).toBeGreaterThanOrEqual(new Date(beforeTime).getTime());
        expect(new Date(source.lastSync).getTime()).toBeLessThanOrEqual(new Date(afterTime).getTime());
      });
    });

    it('should aggregate operations from multiple sources', async () => {
      let callCount = 0;
      vi.mocked(axios.get).mockImplementation(async () => {
        callCount++;
        return {
          data: {
            features: [
              {
                properties: {
                  site_name: `Mine ${callCount}`,
                  commodity: 'Mixed',
                  country: 'Test',
                  dev_stat: 'Active',
                },
                geometry: {
                  coordinates: [0, 0],
                },
              },
            ],
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };
      });

      const result = await aggregateAllData();

      // Should have operations from at least one source
      expect(result.operations.length).toBeGreaterThan(0);
      
      // Should track entry counts correctly
      const totalEntries = result.sources.reduce((sum, s) => sum + s.entriesCount, 0);
      expect(totalEntries).toBeGreaterThan(0);
    });

    it('should handle mixed success and failure from sources', async () => {
      let callCount = 0;
      vi.mocked(axios.get).mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('First source failed');
        }
        return {
          data: { features: [] },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };
      });

      const result = await aggregateAllData();

      // Should complete even with some failures
      expect(result).toBeDefined();
      expect(result.sources).toHaveLength(5);
      
      // At least one source should have been attempted
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should log aggregation progress', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await aggregateAllData();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DataAggregator] Starting data aggregation')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DataAggregator] Aggregation completed')
      );
    });
  });

  describe('getDiagnostic', () => {
    it('should return sources diagnostic information', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const sources = await getDiagnostic();

      expect(Array.isArray(sources)).toBe(true);
      expect(sources.length).toBeGreaterThan(0);
      
      sources.forEach(source => {
        expect(source).toHaveProperty('id');
        expect(source).toHaveProperty('name');
        expect(source).toHaveProperty('region');
        expect(source).toHaveProperty('status');
        expect(source).toHaveProperty('lastSync');
        expect(source).toHaveProperty('entriesCount');
      });
    });

    it('should include status for all sources', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const sources = await getDiagnostic();

      const validStatuses = ['active', 'unavailable', 'error'];
      sources.forEach(source => {
        expect(validStatuses).toContain(source.status);
      });
    });

    it('should reflect current state of data sources', async () => {
      const mockDataWithResults = {
        features: [
          {
            properties: {
              site_name: 'Test',
              commodity: 'Gold',
              country: 'USA',
              dev_stat: 'Active',
            },
            geometry: { coordinates: [0, 0] },
          },
        ],
      };

      vi.mocked(axios.get).mockResolvedValue({
        data: mockDataWithResults,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const sources = await getDiagnostic();

      // At least one source should show activity
      const activeSources = sources.filter(s => s.status === 'active' && s.entriesCount > 0);
      expect(activeSources.length).toBeGreaterThan(0);
    });

    it('should return diagnostic information even when sources fail', async () => {
      vi.mocked(axios.get).mockRejectedValue(new Error('All sources unavailable'));

      const sources = await getDiagnostic();

      // Should still return diagnostic info even when APIs fail
      expect(sources).toBeDefined();
      expect(sources.length).toBe(5);
      expect(Array.isArray(sources)).toBe(true);
    });

    it('should call aggregateAllData internally', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const sources = await getDiagnostic();
      
      // Verify axios was called (indicates aggregateAllData was executed)
      expect(axios.get).toHaveBeenCalled();
      expect(sources).toBeDefined();
    });
  });

  describe('Data Source Integration', () => {
    it('should handle USGS data format correctly', async () => {
      const mockUSGSData = {
        features: [
          {
            properties: {
              site_name: 'Escondida Mine',
              commodity: 'Copper',
              country: 'Chile',
              dev_stat: 'Operating',
            },
            geometry: {
              coordinates: [-69.0573, -24.2363],
            },
          },
        ],
      };

      vi.mocked(axios.get).mockResolvedValue({
        data: mockUSGSData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const result = await aggregateAllData();

      expect(result.operations.length).toBeGreaterThan(0);
    });

    it('should handle GFW data format correctly', async () => {
      const mockGFWData = {
        features: [
          {
            properties: {
              name: 'Forest Area',
              type: 'Conservation',
            },
            geometry: {
              coordinates: [-60.0, -3.0],
            },
          },
        ],
      };

      let callCount = 0;
      vi.mocked(axios.get).mockImplementation(async () => {
        callCount++;
        return {
          data: callCount === 2 ? mockGFWData : { features: [] },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };
      });

      const result = await aggregateAllData();

      const gfwSource = result.sources.find(s => s.id === 'gfw');
      expect(gfwSource).toBeDefined();
    });

    it('should handle SIGMINE data format correctly', async () => {
      const mockSIGMINEData = {
        features: [
          {
            properties: {
              nome: 'Mina Teste',
              substancia: 'Ouro',
              uf: 'MG',
              situacao: 'Ativo',
            },
            geometry: {
              coordinates: [-44.0, -20.0],
            },
          },
        ],
      };

      let callCount = 0;
      vi.mocked(axios.get).mockImplementation(async () => {
        callCount++;
        return {
          data: callCount === 3 ? mockSIGMINEData : { features: [] },
          status: 200,
          statusText: 'OK',
          headers: {},
          config: {} as any,
        };
      });

      const result = await aggregateAllData();

      const sigmineSource = result.sources.find(s => s.id === 'sigmine');
      expect(sigmineSource).toBeDefined();
    });
  });

  describe('Performance and Timing', () => {
    it('should complete aggregation within reasonable time', async () => {
      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const startTime = Date.now();
      await aggregateAllData();
      const duration = Date.now() - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    });

    it('should log execution duration', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      vi.mocked(axios.get).mockResolvedValue({
        data: { features: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await aggregateAllData();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/Aggregation completed in \d+ms/)
      );
    });
  });
});
