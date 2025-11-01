/**
 * MapBiomas API Client
 * 
 * Cliente para integração com a API do MapBiomas
 * Projeto de Mapeamento Anual da Cobertura e Uso do Solo no Brasil
 * 
 * Documentação: https://mapbiomas.org/api-docs
 * Base de dados: Áreas de mineração e infraestrutura associada
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface MapBiomasConfig {
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  timeout?: number;
}

export interface MapBiomasMiningArea {
  id: string;
  geometry: {
    type: string;
    coordinates: number[][];
  };
  properties: {
    name: string;
    state: string;
    municipality: string;
    area_ha: number;
    mineral: string;
    year: number;
    land_use_class: string;
    change_detected: boolean;
    last_update: string;
  };
}

export interface MapBiomasResponse {
  success: boolean;
  data: MapBiomasMiningArea[];
  total: number;
  error?: string;
}

export interface MapBiomasQueryParams {
  state?: string;
  municipality?: string;
  year?: number;
  minArea?: number;
  maxArea?: number;
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

export interface MapBiomasStatistics {
  totalArea: number;
  totalSites: number;
  byState: Record<string, { area: number; sites: number }>;
  byMineral: Record<string, { area: number; sites: number }>;
  yearlyGrowth: Record<number, { area: number; change: number }>;
}

// ============================================================================
// MAPBIOMAS CLIENT
// ============================================================================

export class MapBiomasClient {
  private client: AxiosInstance;
  private config: MapBiomasConfig;
  private lastRequestTime: number = 0;
  private requestDelay: number = 1500; // 1.5 segundos entre requisições

  constructor(config: MapBiomasConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('MapBiomas API key is required');
    }

    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'QIVO-Mining-Platform/1.3',
      },
    });

    // Request interceptor para rate limiting
    this.client.interceptors.request.use(async (config) => {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.requestDelay) {
        await new Promise(resolve => 
          setTimeout(resolve, this.requestDelay - timeSinceLastRequest)
        );
      }

      this.lastRequestTime = Date.now();
      return config;
    });

    // Response interceptor para logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[MapBiomasClient] Request successful: ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[MapBiomasClient] Request failed:`, error.message);
        throw error;
      }
    );
  }

  /**
   * Verifica se o serviço está habilitado
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Testa a conexão com a API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      console.error('[MapBiomasClient] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Busca áreas de mineração
   */
  async searchMiningAreas(params: MapBiomasQueryParams = {}): Promise<MapBiomasResponse> {
    if (!this.isEnabled()) {
      return {
        success: false,
        data: [],
        total: 0,
        error: 'MapBiomas client is disabled',
      };
    }

    try {
      const queryParams: any = {
        class: 'mining', // Classe de uso do solo: mineração
        year: params.year || new Date().getFullYear(),
      };

      if (params.state) queryParams.state = params.state;
      if (params.municipality) queryParams.municipality = params.municipality;
      if (params.minArea) queryParams.min_area = params.minArea;
      if (params.maxArea) queryParams.max_area = params.maxArea;
      if (params.bbox) queryParams.bbox = params.bbox.join(',');

      const response = await this.client.get('/land-use/mining', {
        params: queryParams,
      });

      return {
        success: true,
        data: response.data.features || [],
        total: response.data.total || 0,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        error: error.message || 'Failed to fetch MapBiomas data',
      };
    }
  }

  /**
   * Busca áreas por estado
   */
  async getMiningAreasByState(state: string): Promise<MapBiomasMiningArea[]> {
    const response = await this.searchMiningAreas({ state });
    return response.data;
  }

  /**
   * Busca áreas por município
   */
  async getMiningAreasByMunicipality(state: string, municipality: string): Promise<MapBiomasMiningArea[]> {
    const response = await this.searchMiningAreas({ state, municipality });
    return response.data;
  }

  /**
   * Busca áreas por região (bounding box)
   */
  async getMiningAreasByBBox(bbox: [number, number, number, number]): Promise<MapBiomasMiningArea[]> {
    const response = await this.searchMiningAreas({ bbox });
    return response.data;
  }

  /**
   * Obtém mudanças temporais em uma área
   */
  async getTemporalChanges(
    areaId: string,
    startYear: number,
    endYear: number
  ): Promise<{
    areaId: string;
    changes: Array<{
      year: number;
      area_ha: number;
      change_pct: number;
    }>;
  }> {
    if (!this.isEnabled()) {
      return {
        areaId,
        changes: [],
      };
    }

    try {
      const response = await this.client.get(`/land-use/changes/${areaId}`, {
        params: {
          start_year: startYear,
          end_year: endYear,
        },
      });

      return {
        areaId,
        changes: response.data.changes || [],
      };
    } catch (error) {
      console.error(`[MapBiomasClient] Failed to fetch changes for area ${areaId}:`, error);
      return {
        areaId,
        changes: [],
      };
    }
  }

  /**
   * Obtém estatísticas gerais
   */
  async getStatistics(year?: number): Promise<MapBiomasStatistics> {
    if (!this.isEnabled()) {
      return {
        totalArea: 0,
        totalSites: 0,
        byState: {},
        byMineral: {},
        yearlyGrowth: {},
      };
    }

    try {
      const response = await this.client.get('/statistics/mining', {
        params: {
          year: year || new Date().getFullYear(),
        },
      });

      return response.data;
    } catch (error) {
      console.error('[MapBiomasClient] Failed to fetch statistics:', error);
      return {
        totalArea: 0,
        totalSites: 0,
        byState: {},
        byMineral: {},
        yearlyGrowth: {},
      };
    }
  }

  /**
   * Obtém alertas de desmatamento em áreas de mineração
   */
  async getDeforestationAlerts(params: {
    state?: string;
    municipality?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<Array<{
    id: string;
    location: { lat: number; lon: number };
    area_ha: number;
    date: string;
    severity: 'low' | 'medium' | 'high';
    mining_area_id?: string;
  }>> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      const response = await this.client.get('/alerts/deforestation', {
        params: {
          land_use: 'mining',
          ...params,
        },
      });

      return response.data.alerts || [];
    } catch (error) {
      console.error('[MapBiomasClient] Failed to fetch deforestation alerts:', error);
      return [];
    }
  }

  /**
   * Exporta dados em formato GeoJSON
   */
  async exportGeoJSON(params: MapBiomasQueryParams = {}): Promise<any> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const response = await this.client.get('/export/geojson', {
        params: {
          class: 'mining',
          ...params,
        },
      });

      return response.data;
    } catch (error) {
      console.error('[MapBiomasClient] Failed to export GeoJSON:', error);
      return null;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let mapbiomasClient: MapBiomasClient | null = null;

/**
 * Obtém instância do cliente MapBiomas
 */
export function getMapBiomasClient(): MapBiomasClient {
  if (!mapbiomasClient) {
    const config: MapBiomasConfig = {
      apiUrl: process.env.MAPBIOMAS_API_URL || 'https://api.mapbiomas.org/v1',
      apiKey: process.env.MAPBIOMAS_API_KEY || '',
      enabled: process.env.MAPBIOMAS_ENABLED === 'true',
      timeout: 30000,
    };

    mapbiomasClient = new MapBiomasClient(config);
  }

  return mapbiomasClient;
}

/**
 * Configura cliente MapBiomas customizado (útil para testes)
 */
export function setMapBiomasClient(client: MapBiomasClient): void {
  mapbiomasClient = client;
}

export default {
  MapBiomasClient,
  getMapBiomasClient,
  setMapBiomasClient,
};
