/**
 * SIGMINE API Client
 * 
 * Cliente para integração com a API da ANM (Agência Nacional de Mineração)
 * Sistema de Informações Geográficas da Mineração - SIGMINE
 * 
 * Documentação: https://dados.gov.br/dados/conjuntos-dados/sigmine
 * Base de dados: Processos minerários brasileiros
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SIGMINEConfig {
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  timeout?: number;
}

export interface SIGMINEProcess {
  numero: string;
  ano: string;
  tipo: string;
  fase: string;
  uf: string;
  municipio: string;
  substancia: string;
  titular: string;
  area_ha: number;
  data_protocolo: string;
  situacao: string;
  latitude?: number;
  longitude?: number;
}

export interface SIGMINEResponse {
  success: boolean;
  data: SIGMINEProcess[];
  total: number;
  page: number;
  pageSize: number;
  error?: string;
}

export interface SIGMINEQueryParams {
  uf?: string;
  municipio?: string;
  substancia?: string;
  fase?: string;
  situacao?: string;
  titular?: string;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// SIGMINE CLIENT
// ============================================================================

export class SIGMINEClient {
  private client: AxiosInstance;
  private config: SIGMINEConfig;
  private lastRequestTime: number = 0;
  private requestDelay: number = 1000; // 1 segundo entre requisições

  constructor(config: SIGMINEConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new Error('SIGMINE API key is required');
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
        console.log(`[SIGMINEClient] Request successful: ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`[SIGMINEClient] Request failed:`, error.message);
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
      console.error('[SIGMINEClient] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Busca processos minerários
   */
  async searchProcesses(params: SIGMINEQueryParams = {}): Promise<SIGMINEResponse> {
    if (!this.isEnabled()) {
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        pageSize: 0,
        error: 'SIGMINE client is disabled',
      };
    }

    try {
      const response = await this.client.get('/processos', {
        params: {
          page: params.page || 1,
          pageSize: params.pageSize || 100,
          ...params,
        },
      });

      return {
        success: true,
        data: response.data.results || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.pageSize || 100,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        pageSize: 0,
        error: error.message || 'Failed to fetch SIGMINE data',
      };
    }
  }

  /**
   * Busca processo específico por número
   */
  async getProcessByNumber(numero: string, ano: string): Promise<SIGMINEProcess | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const response = await this.client.get(`/processos/${numero}/${ano}`);
      return response.data;
    } catch (error) {
      console.error(`[SIGMINEClient] Failed to fetch process ${numero}/${ano}:`, error);
      return null;
    }
  }

  /**
   * Busca processos por município
   */
  async getProcessesByMunicipio(uf: string, municipio: string): Promise<SIGMINEProcess[]> {
    const response = await this.searchProcesses({ uf, municipio });
    return response.data;
  }

  /**
   * Busca processos por substância
   */
  async getProcessesBySubstancia(substancia: string): Promise<SIGMINEProcess[]> {
    const response = await this.searchProcesses({ substancia });
    return response.data;
  }

  /**
   * Busca processos por titular
   */
  async getProcessesByTitular(titular: string): Promise<SIGMINEProcess[]> {
    const response = await this.searchProcesses({ titular });
    return response.data;
  }

  /**
   * Obtém estatísticas gerais
   */
  async getStatistics(): Promise<{
    total: number;
    porUF: Record<string, number>;
    porFase: Record<string, number>;
    porSubstancia: Record<string, number>;
  }> {
    if (!this.isEnabled()) {
      return {
        total: 0,
        porUF: {},
        porFase: {},
        porSubstancia: {},
      };
    }

    try {
      const response = await this.client.get('/estatisticas');
      return response.data;
    } catch (error) {
      console.error('[SIGMINEClient] Failed to fetch statistics:', error);
      return {
        total: 0,
        porUF: {},
        porFase: {},
        porSubstancia: {},
      };
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let sigmineClient: SIGMINEClient | null = null;

/**
 * Obtém instância do cliente SIGMINE
 */
export function getSIGMINEClient(): SIGMINEClient {
  if (!sigmineClient) {
    const config: SIGMINEConfig = {
      apiUrl: process.env.SIGMINE_API_URL || 'https://api.anm.gov.br/sigmine/v1',
      apiKey: process.env.SIGMINE_API_KEY || '',
      enabled: process.env.SIGMINE_ENABLED === 'true',
      timeout: 30000,
    };

    sigmineClient = new SIGMINEClient(config);
  }

  return sigmineClient;
}

/**
 * Configura cliente SIGMINE customizado (útil para testes)
 */
export function setSIGMINEClient(client: SIGMINEClient): void {
  sigmineClient = client;
}

export default {
  SIGMINEClient,
  getSIGMINEClient,
  setSIGMINEClient,
};
