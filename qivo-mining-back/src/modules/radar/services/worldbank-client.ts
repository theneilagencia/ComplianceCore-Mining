/**
 * World Bank Data API Client
 * 
 * Provides access to economic indicators, commodity prices,
 * and development statistics from the World Bank.
 * 
 * API Documentation: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../lib/logger';

interface WorldBankIndicator {
  id: string;
  name: string;
  unit: string;
  source: {
    id: string;
    value: string;
  };
  sourceNote: string;
  sourceOrganization: string;
}

interface WorldBankDataPoint {
  indicator: {
    id: string;
    value: string;
  };
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  obs_status: string;
  decimal: number;
}

interface WorldBankCommodityPrice {
  commodity: string;
  unit: string;
  date: string;
  value: number;
}

export class WorldBankClient {
  private baseUrl = 'https://api.worldbank.org/v2';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      params: {
        format: 'json',
        per_page: 1000,
      },
    });
  }

  /**
   * Get indicator data for a country
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'BR', 'US')
   * @param indicatorId - World Bank indicator ID
   * @param startYear - Start year (optional)
   * @param endYear - End year (optional)
   */
  async getIndicatorData(
    countryCode: string,
    indicatorId: string,
    startYear?: number,
    endYear?: number
  ): Promise<WorldBankDataPoint[]> {
    try {
      logger.info(`[WorldBank] Fetching ${indicatorId} for ${countryCode}`);

      const params: any = {};
      if (startYear && endYear) {
        params.date = `${startYear}:${endYear}`;
      }

      const response = await this.client.get(
        `/country/${countryCode}/indicator/${indicatorId}`,
        { params }
      );

      // World Bank API returns [metadata, data]
      const data = response.data[1] || [];

      logger.info(`[WorldBank] Retrieved ${data.length} data points`);
      
      return data;
    } catch (error: any) {
      logger.error('[WorldBank] Failed to get indicator data:', error.message);
      throw error;
    }
  }

  /**
   * Get mining sector contribution to GDP
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param startYear - Start year
   * @param endYear - End year
   */
  async getMiningGDPContribution(
    countryCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<WorldBankDataPoint[]> {
    // Indicator: NY.GDP.MINR.RT.ZS - Mining, Manufacturing, Utilities (% of GDP)
    return this.getIndicatorData(
      countryCode,
      'NY.GDP.MINR.RT.ZS',
      startYear,
      endYear
    );
  }

  /**
   * Get CO2 emissions data
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param startYear - Start year
   * @param endYear - End year
   */
  async getCO2Emissions(
    countryCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<WorldBankDataPoint[]> {
    // Indicator: EN.ATM.CO2E.PC - CO2 emissions (metric tons per capita)
    return this.getIndicatorData(
      countryCode,
      'EN.ATM.CO2E.PC',
      startYear,
      endYear
    );
  }

  /**
   * Get forest area data
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param startYear - Start year
   * @param endYear - End year
   */
  async getForestArea(
    countryCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<WorldBankDataPoint[]> {
    // Indicator: AG.LND.FRST.ZS - Forest area (% of land area)
    return this.getIndicatorData(
      countryCode,
      'AG.LND.FRST.ZS',
      startYear,
      endYear
    );
  }

  /**
   * Get electricity production from coal
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param startYear - Start year
   * @param endYear - End year
   */
  async getCoalElectricityProduction(
    countryCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<WorldBankDataPoint[]> {
    // Indicator: EG.ELC.COAL.ZS - Electricity production from coal sources (% of total)
    return this.getIndicatorData(
      countryCode,
      'EG.ELC.COAL.ZS',
      startYear,
      endYear
    );
  }

  /**
   * Get mineral rents (% of GDP)
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param startYear - Start year
   * @param endYear - End year
   */
  async getMineralRents(
    countryCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<WorldBankDataPoint[]> {
    // Indicator: NY.GDP.MINR.RT.ZS - Mineral rents (% of GDP)
    return this.getIndicatorData(
      countryCode,
      'NY.GDP.MINR.RT.ZS',
      startYear,
      endYear
    );
  }

  /**
   * Get commodity prices
   * 
   * Note: World Bank Commodity Price Data (Pink Sheet) is available but not via API
   * This is a placeholder for future implementation
   */
  async getCommodityPrices(
    commodity: string,
    startDate?: string,
    endDate?: string
  ): Promise<WorldBankCommodityPrice[]> {
    try {
      logger.info(`[WorldBank] Fetching commodity prices for ${commodity}`);

      // In production, this would scrape or parse Pink Sheet data
      // https://www.worldbank.org/en/research/commodity-markets

      const prices: WorldBankCommodityPrice[] = [];

      return prices;
    } catch (error: any) {
      logger.error('[WorldBank] Failed to get commodity prices:', error.message);
      throw error;
    }
  }

  /**
   * Get ESG-related indicators for a country
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param startYear - Start year
   * @param endYear - End year
   */
  async getESGIndicators(
    countryCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<{
    co2Emissions: WorldBankDataPoint[];
    forestArea: WorldBankDataPoint[];
    renewableEnergy: WorldBankDataPoint[];
    waterStress: WorldBankDataPoint[];
  }> {
    try {
      logger.info(`[WorldBank] Fetching ESG indicators for ${countryCode}`);

      const [co2Emissions, forestArea, renewableEnergy, waterStress] = await Promise.all([
        this.getIndicatorData(countryCode, 'EN.ATM.CO2E.PC', startYear, endYear), // CO2 emissions
        this.getIndicatorData(countryCode, 'AG.LND.FRST.ZS', startYear, endYear), // Forest area
        this.getIndicatorData(countryCode, 'EG.FEC.RNEW.ZS', startYear, endYear), // Renewable energy
        this.getIndicatorData(countryCode, 'ER.H2O.FWST.ZS', startYear, endYear), // Water stress
      ]);

      return {
        co2Emissions,
        forestArea,
        renewableEnergy,
        waterStress,
      };
    } catch (error: any) {
      logger.error('[WorldBank] Failed to get ESG indicators:', error.message);
      throw error;
    }
  }

  /**
   * Get mining-related indicators for a country
   * 
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param startYear - Start year
   * @param endYear - End year
   */
  async getMiningIndicators(
    countryCode: string,
    startYear?: number,
    endYear?: number
  ): Promise<{
    gdpContribution: WorldBankDataPoint[];
    mineralRents: WorldBankDataPoint[];
    oreExports: WorldBankDataPoint[];
  }> {
    try {
      logger.info(`[WorldBank] Fetching mining indicators for ${countryCode}`);

      const [gdpContribution, mineralRents, oreExports] = await Promise.all([
        this.getIndicatorData(countryCode, 'NY.GDP.MINR.RT.ZS', startYear, endYear), // Mining GDP
        this.getIndicatorData(countryCode, 'NY.GDP.MINR.RT.ZS', startYear, endYear), // Mineral rents
        this.getIndicatorData(countryCode, 'TX.VAL.MMTL.ZS.UN', startYear, endYear), // Ores and metals exports
      ]);

      return {
        gdpContribution,
        mineralRents,
        oreExports,
      };
    } catch (error: any) {
      logger.error('[WorldBank] Failed to get mining indicators:', error.message);
      throw error;
    }
  }

  /**
   * Compare indicators across multiple countries
   * 
   * @param countryCodes - Array of ISO 3166-1 alpha-2 country codes
   * @param indicatorId - World Bank indicator ID
   * @param year - Year to compare
   */
  async compareCountries(
    countryCodes: string[],
    indicatorId: string,
    year: number
  ): Promise<Array<{ country: string; value: number | null }>> {
    try {
      logger.info(`[WorldBank] Comparing ${indicatorId} across ${countryCodes.length} countries for ${year}`);

      const results = await Promise.all(
        countryCodes.map(async (code) => {
          const data = await this.getIndicatorData(code, indicatorId, year, year);
          const dataPoint = data.find((d) => d.date === year.toString());
          
          return {
            country: code,
            value: dataPoint?.value || null,
          };
        })
      );

      return results;
    } catch (error: any) {
      logger.error('[WorldBank] Failed to compare countries:', error.message);
      throw error;
    }
  }

  /**
   * Get list of all available indicators
   * 
   * @param search - Optional search term
   */
  async listIndicators(search?: string): Promise<WorldBankIndicator[]> {
    try {
      logger.info(`[WorldBank] Listing indicators${search ? ` (search: ${search})` : ''}`);

      const params: any = {};
      if (search) {
        params.search = search;
      }

      const response = await this.client.get('/indicator', { params });

      // World Bank API returns [metadata, data]
      const indicators = response.data[1] || [];

      logger.info(`[WorldBank] Found ${indicators.length} indicators`);
      
      return indicators;
    } catch (error: any) {
      logger.error('[WorldBank] Failed to list indicators:', error.message);
      throw error;
    }
  }

  /**
   * Search for mining-related indicators
   */
  async searchMiningIndicators(): Promise<WorldBankIndicator[]> {
    return this.listIndicators('mining');
  }

  /**
   * Search for ESG-related indicators
   */
  async searchESGIndicators(): Promise<WorldBankIndicator[]> {
    const keywords = ['environment', 'emission', 'forest', 'water', 'energy', 'climate'];
    const allIndicators: WorldBankIndicator[] = [];

    for (const keyword of keywords) {
      const indicators = await this.listIndicators(keyword);
      allIndicators.push(...indicators);
    }

    // Remove duplicates
    const unique = allIndicators.filter(
      (indicator, index, self) =>
        index === self.findIndex((i) => i.id === indicator.id)
    );

    return unique;
  }
}

// Export singleton instance
let worldBankClient: WorldBankClient | null = null;

export function getWorldBankClient(): WorldBankClient {
  if (!worldBankClient) {
    worldBankClient = new WorldBankClient();
  }

  return worldBankClient;
}

// Export common indicator IDs
export const INDICATORS = {
  // Mining
  MINING_GDP: 'NY.GDP.MINR.RT.ZS', // Mining, Manufacturing, Utilities (% of GDP)
  MINERAL_RENTS: 'NY.GDP.MINR.RT.ZS', // Mineral rents (% of GDP)
  ORE_EXPORTS: 'TX.VAL.MMTL.ZS.UN', // Ores and metals exports (% of merchandise exports)
  
  // Environment
  CO2_EMISSIONS: 'EN.ATM.CO2E.PC', // CO2 emissions (metric tons per capita)
  FOREST_AREA: 'AG.LND.FRST.ZS', // Forest area (% of land area)
  WATER_STRESS: 'ER.H2O.FWST.ZS', // Level of water stress
  
  // Energy
  RENEWABLE_ENERGY: 'EG.FEC.RNEW.ZS', // Renewable energy consumption (% of total)
  COAL_ELECTRICITY: 'EG.ELC.COAL.ZS', // Electricity production from coal (% of total)
  
  // Economic
  GDP_GROWTH: 'NY.GDP.MKTP.KD.ZG', // GDP growth (annual %)
  INFLATION: 'FP.CPI.TOTL.ZG', // Inflation, consumer prices (annual %)
  UNEMPLOYMENT: 'SL.UEM.TOTL.ZS', // Unemployment, total (% of total labor force)
} as const;
