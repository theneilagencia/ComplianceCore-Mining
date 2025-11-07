/**
 * Global Forest Watch (GFW) API Client
 * 
 * Provides access to deforestation alerts, forest cover loss,
 * protected areas, and mining concessions data.
 * 
 * API Documentation: https://data-api.globalforestwatch.org/
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../lib/logger';

interface GFWAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface GFWDataset {
  dataset: string;
  version: string;
  metadata: {
    title: string;
    description: string;
    source: string;
    update_frequency: string;
  };
}

interface GFWAlert {
  id: string;
  date: string;
  latitude: number;
  longitude: number;
  confidence: string;
  area_ha: number;
  geostore_id?: string;
}

interface GFWQueryResult {
  data: any[];
  status: string;
}

export class GFWClient {
  private baseUrl = 'https://data-api.globalforestwatch.org';
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private email: string,
    private password: string
  ) {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate with GFW API
   */
  private async authenticate(): Promise<string> {
    try {
      // Check if token is still valid
      if (this.accessToken && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      logger.info('[GFW] Authenticating...');

      const response = await this.client.post<GFWAuthResponse>('/auth/token', {
        email: this.email,
        password: this.password,
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 min buffer

      logger.info('[GFW] Authentication successful');

      return this.accessToken;
    } catch (error: any) {
      logger.error('[GFW] Authentication failed:', error.message);
      throw new Error(`GFW authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authenticated headers
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * List available datasets
   */
  async listDatasets(): Promise<GFWDataset[]> {
    try {
      const headers = await this.getHeaders();
      const response = await this.client.get('/datasets', { headers });
      
      return response.data.data || [];
    } catch (error: any) {
      logger.error('[GFW] Failed to list datasets:', error.message);
      throw error;
    }
  }

  /**
   * Get deforestation alerts for a specific area
   * 
   * @param geostoreId - GFW geostore ID for the area of interest
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   */
  async getDeforestationAlerts(
    geostoreId: string,
    startDate: string,
    endDate: string
  ): Promise<GFWAlert[]> {
    try {
      const headers = await this.getHeaders();
      
      const sql = `
        SELECT * FROM data 
        WHERE geostore_id = '${geostoreId}' 
        AND alert_date >= '${startDate}' 
        AND alert_date <= '${endDate}'
        ORDER BY alert_date DESC
      `;

      const response = await this.client.post<GFWQueryResult>(
        '/dataset/umd_tree_cover_loss_from_fires/v1.7/query',
        { sql },
        { headers }
      );

      return response.data.data || [];
    } catch (error: any) {
      logger.error('[GFW] Failed to get deforestation alerts:', error.message);
      throw error;
    }
  }

  /**
   * Get forest cover loss for a specific area
   * 
   * @param bbox - Bounding box [minLon, minLat, maxLon, maxLat]
   * @param year - Year to query (e.g., 2023)
   */
  async getForestCoverLoss(
    bbox: [number, number, number, number],
    year: number
  ): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const sql = `
        SELECT 
          SUM(area_ha) as total_loss_ha,
          COUNT(*) as alert_count
        FROM data 
        WHERE 
          longitude >= ${bbox[0]} AND longitude <= ${bbox[2]}
          AND latitude >= ${bbox[1]} AND latitude <= ${bbox[3]}
          AND umd_tree_cover_loss__year = ${year}
      `;

      const response = await this.client.post<GFWQueryResult>(
        '/dataset/umd_tree_cover_loss/v1.10/query',
        { sql },
        { headers }
      );

      return response.data.data[0] || null;
    } catch (error: any) {
      logger.error('[GFW] Failed to get forest cover loss:', error.message);
      throw error;
    }
  }

  /**
   * Get mining concessions in a specific area
   * 
   * @param bbox - Bounding box [minLon, minLat, maxLon, maxLat]
   */
  async getMiningConcessions(
    bbox: [number, number, number, number]
  ): Promise<any[]> {
    try {
      const headers = await this.getHeaders();
      
      const sql = `
        SELECT * FROM data 
        WHERE 
          longitude >= ${bbox[0]} AND longitude <= ${bbox[2]}
          AND latitude >= ${bbox[1]} AND latitude <= ${bbox[3]}
      `;

      const response = await this.client.post<GFWQueryResult>(
        '/dataset/gfw_mining/v1.0/query',
        { sql },
        { headers }
      );

      return response.data.data || [];
    } catch (error: any) {
      logger.error('[GFW] Failed to get mining concessions:', error.message);
      throw error;
    }
  }

  /**
   * Create a geostore from geometry
   * 
   * @param geometry - GeoJSON geometry object
   */
  async createGeostore(geometry: any): Promise<string> {
    try {
      const headers = await this.getHeaders();
      
      const response = await this.client.post(
        '/geostore',
        { geojson: geometry },
        { headers }
      );

      return response.data.data.id;
    } catch (error: any) {
      logger.error('[GFW] Failed to create geostore:', error.message);
      throw error;
    }
  }

  /**
   * Get zonal statistics for a specific area
   * 
   * @param geostoreId - GFW geostore ID
   * @param dataset - Dataset name
   * @param version - Dataset version
   */
  async getZonalStats(
    geostoreId: string,
    dataset: string,
    version: string
  ): Promise<any> {
    try {
      const headers = await this.getHeaders();
      
      const response = await this.client.get(
        `/analysis/zonal/${geostoreId}`,
        {
          headers,
          params: {
            dataset,
            version,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      logger.error('[GFW] Failed to get zonal stats:', error.message);
      throw error;
    }
  }

  /**
   * Monitor deforestation in mining areas
   * 
   * @param miningAreas - Array of mining area coordinates
   * @param startDate - Start date for monitoring
   * @param endDate - End date for monitoring
   */
  async monitorMiningDeforestation(
    miningAreas: Array<{ name: string; bbox: [number, number, number, number] }>,
    startDate: string,
    endDate: string
  ): Promise<Array<{ area: string; alerts: GFWAlert[]; totalLoss: number }>> {
    const results = [];

    for (const area of miningAreas) {
      try {
        // Create geostore for the area
        const geometry = {
          type: 'Polygon',
          coordinates: [[
            [area.bbox[0], area.bbox[1]],
            [area.bbox[2], area.bbox[1]],
            [area.bbox[2], area.bbox[3]],
            [area.bbox[0], area.bbox[3]],
            [area.bbox[0], area.bbox[1]],
          ]],
        };

        const geostoreId = await this.createGeostore(geometry);

        // Get deforestation alerts
        const alerts = await this.getDeforestationAlerts(
          geostoreId,
          startDate,
          endDate
        );

        // Calculate total loss
        const totalLoss = alerts.reduce((sum, alert) => sum + (alert.area_ha || 0), 0);

        results.push({
          area: area.name,
          alerts,
          totalLoss,
        });

        logger.info(`[GFW] Monitored ${area.name}: ${alerts.length} alerts, ${totalLoss.toFixed(2)} ha lost`);
      } catch (error: any) {
        logger.error(`[GFW] Failed to monitor ${area.name}:`, error.message);
        results.push({
          area: area.name,
          alerts: [],
          totalLoss: 0,
        });
      }
    }

    return results;
  }
}

// Export singleton instance
let gfwClient: GFWClient | null = null;

export function getGFWClient(): GFWClient {
  if (!gfwClient) {
    const email = process.env.GFW_EMAIL;
    const password = process.env.GFW_PASSWORD;

    if (!email || !password) {
      throw new Error('GFW credentials not configured. Set GFW_EMAIL and GFW_PASSWORD environment variables.');
    }

    gfwClient = new GFWClient(email, password);
  }

  return gfwClient;
}
