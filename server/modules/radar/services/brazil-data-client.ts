/**
 * Brazil Government Data Client
 * 
 * Provides access to mining and environmental data from Brazilian government agencies:
 * - ANM (Agência Nacional de Mineração)
 * - CPRM/SGB (Serviço Geológico do Brasil)
 * - IBAMA (Instituto Brasileiro do Meio Ambiente)
 * 
 * Data Sources:
 * - ANM: https://dados.gov.br (CSV downloads)
 * - CPRM: https://geosgb.sgb.gov.br/ (WMS/WFS)
 * - IBAMA: https://dados.gov.br (CSV downloads)
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../lib/logger';
import * as csv from 'csv-parse/sync';
import * as xml2js from 'xml2js';

// ============================================================================
// ANM (Agência Nacional de Mineração)
// ============================================================================

interface ANMProcesso {
  numero_processo: string;
  ano: number;
  nome_area: string;
  fase: string;
  ult_evento: string;
  substancia: string;
  uso: string;
  uf: string;
  municipio: string;
  area_ha: number;
  disponibilidade: string;
  prioridade_obtencao: string;
  data_protocolo: string;
  data_publicacao_dou: string;
}

interface ANMArrecadacao {
  ano: number;
  mes: number;
  uf: string;
  municipio: string;
  substancia: string;
  valor_reais: number;
  quantidade: number;
  unidade: string;
}

export class ANMClient {
  private dadosGovBrUrl = 'https://dados.gov.br/dados/conjuntos-dados';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 60000,
      headers: {
        'User-Agent': 'QIVO-Mining-Radar/1.0',
      },
    });
  }

  /**
   * Download and parse ANM CSV data
   * 
   * Note: ANM data is available as CSV downloads from dados.gov.br
   * This should be run periodically (e.g., monthly) to sync data
   */
  async downloadProcessosMinerarios(): Promise<ANMProcesso[]> {
    try {
      logger.info('[ANM] Downloading processos minerários...');

      // In production, this would download from dados.gov.br
      // const csvUrl = `${this.dadosGovBrUrl}/processos-minerarios`;
      // const response = await this.client.get(csvUrl);
      // const records = csv.parse(response.data, { columns: true });

      const processos: ANMProcesso[] = [];

      logger.info(`[ANM] Downloaded ${processos.length} processos`);
      
      return processos;
    } catch (error: any) {
      logger.error('[ANM] Failed to download processos:', error.message);
      throw error;
    }
  }

  /**
   * Download CFEM (Compensação Financeira pela Exploração Mineral) data
   */
  async downloadArrecadacaoCFEM(): Promise<ANMArrecadacao[]> {
    try {
      logger.info('[ANM] Downloading arrecadação CFEM...');

      // In production, this would download from dados.gov.br
      // const csvUrl = `${this.dadosGovBrUrl}/arrecadacao-cfem`;

      const arrecadacao: ANMArrecadacao[] = [];

      logger.info(`[ANM] Downloaded ${arrecadacao.length} records`);
      
      return arrecadacao;
    } catch (error: any) {
      logger.error('[ANM] Failed to download CFEM data:', error.message);
      throw error;
    }
  }

  /**
   * Get processos by UF (state)
   */
  async getProcessosByUF(uf: string): Promise<ANMProcesso[]> {
    try {
      logger.info(`[ANM] Fetching processos for UF: ${uf}`);

      // In production, this would query local database
      // SELECT * FROM anm_processos WHERE uf = $1

      const processos: ANMProcesso[] = [];

      return processos;
    } catch (error: any) {
      logger.error('[ANM] Failed to get processos by UF:', error.message);
      throw error;
    }
  }

  /**
   * Get processos by município (city)
   */
  async getProcessosByMunicipio(municipio: string, uf: string): Promise<ANMProcesso[]> {
    try {
      logger.info(`[ANM] Fetching processos for ${municipio}/${uf}`);

      // In production, this would query local database
      // SELECT * FROM anm_processos WHERE municipio = $1 AND uf = $2

      const processos: ANMProcesso[] = [];

      return processos;
    } catch (error: any) {
      logger.error('[ANM] Failed to get processos by município:', error.message);
      throw error;
    }
  }

  /**
   * Get processos by substância (mineral)
   */
  async getProcessosBySubstancia(substancia: string): Promise<ANMProcesso[]> {
    try {
      logger.info(`[ANM] Fetching processos for substância: ${substancia}`);

      // In production, this would query local database
      // SELECT * FROM anm_processos WHERE substancia ILIKE $1

      const processos: ANMProcesso[] = [];

      return processos;
    } catch (error: any) {
      logger.error('[ANM] Failed to get processos by substância:', error.message);
      throw error;
    }
  }

  /**
   * Sync ANM data to local database
   * 
   * This should be run monthly to update local data
   */
  async syncData(): Promise<{ processos: number; cfem: number }> {
    try {
      logger.info('[ANM] Starting data sync...');

      const [processos, cfem] = await Promise.all([
        this.downloadProcessosMinerarios(),
        this.downloadArrecadacaoCFEM(),
      ]);

      // In production, this would import to PostgreSQL
      // await db.query('INSERT INTO anm_processos ...');
      // await db.query('INSERT INTO anm_cfem ...');

      logger.info(`[ANM] Sync completed: ${processos.length} processos, ${cfem.length} CFEM records`);

      return {
        processos: processos.length,
        cfem: cfem.length,
      };
    } catch (error: any) {
      logger.error('[ANM] Failed to sync data:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// CPRM/SGB (Serviço Geológico do Brasil)
// ============================================================================

interface CPRMFeature {
  type: 'Feature';
  id: string;
  geometry: any;
  properties: {
    nome: string;
    tipo: string;
    substancia: string;
    estado: string;
    municipio: string;
    [key: string]: any;
  };
}

export class CPRMClient {
  private geoserverUrl = 'https://geosgb.sgb.gov.br/geoserver';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'QIVO-Mining-Radar/1.0',
      },
    });
  }

  /**
   * Get mineral resources in a bounding box using WFS
   * 
   * @param bbox - Bounding box [minLon, minLat, maxLon, maxLat]
   */
  async getMineralResources(
    bbox: [number, number, number, number]
  ): Promise<CPRMFeature[]> {
    try {
      logger.info(`[CPRM] Fetching mineral resources in bbox: ${bbox.join(',')}`);

      const response = await this.client.get(`${this.geoserverUrl}/wfs`, {
        params: {
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeName: 'cprm:recursos_minerais',
          outputFormat: 'application/json',
          bbox: `${bbox.join(',')},EPSG:4326`,
        },
      });

      const features = response.data.features || [];

      logger.info(`[CPRM] Found ${features.length} mineral resources`);
      
      return features;
    } catch (error: any) {
      logger.error('[CPRM] Failed to get mineral resources:', error.message);
      throw error;
    }
  }

  /**
   * Get geological map for a bounding box using WMS
   * 
   * @param bbox - Bounding box [minLon, minLat, maxLon, maxLat]
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   */
  async getGeologicalMap(
    bbox: [number, number, number, number],
    width: number = 1024,
    height: number = 1024
  ): Promise<Buffer> {
    try {
      logger.info(`[CPRM] Fetching geological map for bbox: ${bbox.join(',')}`);

      const response = await this.client.get(`${this.geoserverUrl}/wms`, {
        params: {
          service: 'WMS',
          version: '1.1.0',
          request: 'GetMap',
          layers: 'geosgb:geologia',
          bbox: bbox.join(','),
          width,
          height,
          srs: 'EPSG:4326',
          format: 'image/png',
        },
        responseType: 'arraybuffer',
      });

      logger.info('[CPRM] Geological map retrieved successfully');
      
      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('[CPRM] Failed to get geological map:', error.message);
      throw error;
    }
  }

  /**
   * Get feature info at a specific point
   * 
   * @param lon - Longitude
   * @param lat - Latitude
   * @param layer - Layer name
   */
  async getFeatureInfo(
    lon: number,
    lat: number,
    layer: string = 'cprm:recursos_minerais'
  ): Promise<any> {
    try {
      logger.info(`[CPRM] Getting feature info at ${lon},${lat}`);

      // Create a small bbox around the point
      const buffer = 0.01; // ~1km
      const bbox = [lon - buffer, lat - buffer, lon + buffer, lat + buffer];

      const response = await this.client.get(`${this.geoserverUrl}/wms`, {
        params: {
          service: 'WMS',
          version: '1.1.0',
          request: 'GetFeatureInfo',
          layers: layer,
          query_layers: layer,
          x: 100,
          y: 100,
          width: 200,
          height: 200,
          srs: 'EPSG:4326',
          bbox: bbox.join(','),
          info_format: 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('[CPRM] Failed to get feature info:', error.message);
      throw error;
    }
  }

  /**
   * List available layers
   */
  async listLayers(): Promise<string[]> {
    try {
      logger.info('[CPRM] Listing available layers...');

      const response = await this.client.get(`${this.geoserverUrl}/wms`, {
        params: {
          service: 'WMS',
          version: '1.1.0',
          request: 'GetCapabilities',
        },
      });

      // Parse XML response
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);

      // Extract layer names
      const layers: string[] = [];
      // Note: This is simplified, actual parsing would be more complex

      logger.info(`[CPRM] Found ${layers.length} layers`);
      
      return layers;
    } catch (error: any) {
      logger.error('[CPRM] Failed to list layers:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// IBAMA (Instituto Brasileiro do Meio Ambiente)
// ============================================================================

interface IBAMALicenca {
  numero_licenca: string;
  tipo_licenca: string; // LP, LI, LO
  empreendimento: string;
  empreendedor: string;
  uf: string;
  municipio: string;
  atividade: string;
  data_emissao: string;
  data_validade: string;
  status: string;
}

interface IBAMAEmbargo {
  numero_auto: string;
  data_auto: string;
  uf: string;
  municipio: string;
  cpf_cnpj: string;
  nome_infrator: string;
  descricao: string;
  area_ha: number;
  valor_multa: number;
}

export class IBAMAClient {
  private dadosGovBrUrl = 'https://dados.gov.br/dados/conjuntos-dados';
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 60000,
      headers: {
        'User-Agent': 'QIVO-Mining-Radar/1.0',
      },
    });
  }

  /**
   * Download environmental licenses data
   */
  async downloadLicencas(): Promise<IBAMALicenca[]> {
    try {
      logger.info('[IBAMA] Downloading licenças ambientais...');

      // In production, this would download from dados.gov.br
      // const csvUrl = `${this.dadosGovBrUrl}/licencas-ambientais`;

      const licencas: IBAMALicenca[] = [];

      logger.info(`[IBAMA] Downloaded ${licencas.length} licenças`);
      
      return licencas;
    } catch (error: any) {
      logger.error('[IBAMA] Failed to download licenças:', error.message);
      throw error;
    }
  }

  /**
   * Download embargos and fines data
   */
  async downloadEmbargos(): Promise<IBAMAEmbargo[]> {
    try {
      logger.info('[IBAMA] Downloading embargos e multas...');

      // In production, this would download from dados.gov.br
      // const csvUrl = `${this.dadosGovBrUrl}/embargos-ibama`;

      const embargos: IBAMAEmbargo[] = [];

      logger.info(`[IBAMA] Downloaded ${embargos.length} embargos`);
      
      return embargos;
    } catch (error: any) {
      logger.error('[IBAMA] Failed to download embargos:', error.message);
      throw error;
    }
  }

  /**
   * Get mining-related licenses
   */
  async getMiningLicenses(): Promise<IBAMALicenca[]> {
    try {
      logger.info('[IBAMA] Fetching mining licenses...');

      // In production, this would query local database
      // SELECT * FROM ibama_licencas 
      // WHERE atividade ILIKE '%mineração%' OR atividade ILIKE '%extração%'

      const licencas: IBAMALicenca[] = [];

      return licencas;
    } catch (error: any) {
      logger.error('[IBAMA] Failed to get mining licenses:', error.message);
      throw error;
    }
  }

  /**
   * Get embargos by UF (state)
   */
  async getEmbargosByUF(uf: string): Promise<IBAMAEmbargo[]> {
    try {
      logger.info(`[IBAMA] Fetching embargos for UF: ${uf}`);

      // In production, this would query local database
      // SELECT * FROM ibama_embargos WHERE uf = $1

      const embargos: IBAMAEmbargo[] = [];

      return embargos;
    } catch (error: any) {
      logger.error('[IBAMA] Failed to get embargos by UF:', error.message);
      throw error;
    }
  }

  /**
   * Sync IBAMA data to local database
   */
  async syncData(): Promise<{ licencas: number; embargos: number }> {
    try {
      logger.info('[IBAMA] Starting data sync...');

      const [licencas, embargos] = await Promise.all([
        this.downloadLicencas(),
        this.downloadEmbargos(),
      ]);

      // In production, this would import to PostgreSQL
      // await db.query('INSERT INTO ibama_licencas ...');
      // await db.query('INSERT INTO ibama_embargos ...');

      logger.info(`[IBAMA] Sync completed: ${licencas.length} licenças, ${embargos.length} embargos`);

      return {
        licencas: licencas.length,
        embargos: embargos.length,
      };
    } catch (error: any) {
      logger.error('[IBAMA] Failed to sync data:', error.message);
      throw error;
    }
  }
}

// ============================================================================
// Unified Brazil Data Client
// ============================================================================

export class BrazilDataClient {
  private anm: ANMClient;
  private cprm: CPRMClient;
  private ibama: IBAMAClient;

  constructor() {
    this.anm = new ANMClient();
    this.cprm = new CPRMClient();
    this.ibama = new IBAMAClient();
  }

  /**
   * Get all mining data for a specific location
   * 
   * @param lat - Latitude
   * @param lon - Longitude
   * @param radiusKm - Search radius in kilometers
   */
  async getMiningDataForLocation(
    lat: number,
    lon: number,
    radiusKm: number = 50
  ): Promise<{
    anm_processos: ANMProcesso[];
    cprm_resources: CPRMFeature[];
    ibama_licencas: IBAMALicenca[];
    ibama_embargos: IBAMAEmbargo[];
  }> {
    try {
      logger.info(`[BrazilData] Fetching mining data for ${lat},${lon} (${radiusKm}km)`);

      // Create bounding box
      const kmToDegrees = radiusKm / 111; // Approximate
      const bbox: [number, number, number, number] = [
        lon - kmToDegrees,
        lat - kmToDegrees,
        lon + kmToDegrees,
        lat + kmToDegrees,
      ];

      // Fetch data from all sources
      const [cprm_resources] = await Promise.all([
        this.cprm.getMineralResources(bbox),
        // ANM and IBAMA would require querying local database
      ]);

      return {
        anm_processos: [],
        cprm_resources,
        ibama_licencas: [],
        ibama_embargos: [],
      };
    } catch (error: any) {
      logger.error('[BrazilData] Failed to get mining data:', error.message);
      throw error;
    }
  }

  /**
   * Sync all Brazilian government data
   * 
   * This should be run monthly
   */
  async syncAllData(): Promise<{
    anm: { processos: number; cfem: number };
    ibama: { licencas: number; embargos: number };
  }> {
    try {
      logger.info('[BrazilData] Starting full data sync...');

      const [anm, ibama] = await Promise.all([
        this.anm.syncData(),
        this.ibama.syncData(),
      ]);

      logger.info('[BrazilData] Full sync completed');

      return { anm, ibama };
    } catch (error: any) {
      logger.error('[BrazilData] Failed to sync all data:', error.message);
      throw error;
    }
  }

  // Expose individual clients
  getANMClient(): ANMClient {
    return this.anm;
  }

  getCPRMClient(): CPRMClient {
    return this.cprm;
  }

  getIBAMAClient(): IBAMAClient {
    return this.ibama;
  }
}

// Export singleton instance
let brazilDataClient: BrazilDataClient | null = null;

export function getBrazilDataClient(): BrazilDataClient {
  if (!brazilDataClient) {
    brazilDataClient = new BrazilDataClient();
  }

  return brazilDataClient;
}
