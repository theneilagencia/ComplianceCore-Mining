/**
 * External API Client com fallback seguro
 * QIVO Mining Platform v1.4.2
 * 
 * Gerencia chamadas para APIs externas (SIGMINE, MapBiomas, GFW)
 * com tratamento de API keys ausentes ou inválidas
 */

type APIProvider = 'SIGMINE' | 'MAPBIOMAS' | 'GFW';

interface APIConfig {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
}

interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  status: 'success' | 'skipped' | 'error';
  reason?: string;
  provider: APIProvider;
}

class ExternalAPIClient {
  private configs: Record<APIProvider, APIConfig> = {
    SIGMINE: {
      name: 'SIGMINE',
      apiKey: process.env.SIGMINE_API_KEY,
      baseUrl: process.env.SIGMINE_API_URL || 'https://api.sigmine.gov.br/v1',
      enabled: process.env.ENABLE_SIGMINE === 'true',
    },
    MAPBIOMAS: {
      name: 'MapBiomas',
      apiKey: process.env.MAPBIOMAS_API_KEY,
      baseUrl: process.env.MAPBIOMAS_API_URL || 'https://api.mapbiomas.org',
      enabled: process.env.ENABLE_MAPBIOMAS === 'true',
    },
    GFW: {
      name: 'Global Forest Watch',
      apiKey: process.env.GFW_API_KEY,
      baseUrl: process.env.GFW_API_URL || 'https://api.globalforestwatch.org/v1',
      enabled: process.env.ENABLE_GFW === 'true',
    },
  };

  /**
   * Valida se a API está configurada e habilitada
   */
  private validateAPI(provider: APIProvider): { valid: boolean; reason?: string } {
    const config = this.configs[provider];

    if (!config.enabled) {
      return {
        valid: false,
        reason: `${config.name} API is disabled (ENABLE_${provider}=false)`,
      };
    }

    if (!config.apiKey) {
      return {
        valid: false,
        reason: `${config.name} API key is missing (${provider}_API_KEY not set)`,
      };
    }

    if (!config.baseUrl) {
      return {
        valid: false,
        reason: `${config.name} API URL is missing (${provider}_API_URL not set)`,
      };
    }

    return { valid: true };
  }

  /**
   * Executa chamada para API externa com fallback seguro
   */
  async fetch<T = any>(
    provider: APIProvider,
    endpoint: string,
    options?: RequestInit
  ): Promise<APIResponse<T>> {
    const validation = this.validateAPI(provider);
    const config = this.configs[provider];

    if (!validation.valid) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[${provider}] ${validation.reason}`);
      }
      return {
        success: false,
        status: 'skipped',
        reason: validation.reason,
        provider,
      };
    }

    try {
      const url = `${config.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        status: 'success',
        data,
        provider,
      };
    } catch (error: any) {
      console.error(`[${provider}] API call failed:`, error.message);
      return {
        success: false,
        status: 'error',
        reason: error.message,
        provider,
      };
    }
  }

  /**
   * Busca dados de múltiplas APIs com fallback
   */
  async fetchMultiple<T = any>(
    providers: APIProvider[],
    endpoint: string,
    options?: RequestInit
  ): Promise<APIResponse<T>[]> {
    const promises = providers.map(provider =>
      this.fetch<T>(provider, endpoint, options)
    );
    return Promise.all(promises);
  }

  /**
   * Retorna status de todas as APIs
   */
  getStatus(): Record<APIProvider, { enabled: boolean; configured: boolean }> {
    return {
      SIGMINE: {
        enabled: this.configs.SIGMINE.enabled,
        configured: !!this.configs.SIGMINE.apiKey,
      },
      MAPBIOMAS: {
        enabled: this.configs.MAPBIOMAS.enabled,
        configured: !!this.configs.MAPBIOMAS.apiKey,
      },
      GFW: {
        enabled: this.configs.GFW.enabled,
        configured: !!this.configs.GFW.apiKey,
      },
    };
  }
}

// Singleton instance
export const externalAPI = new ExternalAPIClient();

// Export types
export type { APIProvider, APIResponse, APIConfig };
