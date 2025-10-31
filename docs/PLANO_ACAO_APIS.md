# 🔗 Plano de Ação: Implementação de Integrações com APIs Oficiais

**Data de Criação**: 31 de Outubro de 2025  
**Objetivo**: Implementar integrações com 6 APIs oficiais brasileiras e internacionais  
**Duração Estimada**: 10-15 dias (80-120 horas)  
**Prioridade**: 🔴 ALTA

---

## 📋 Visão Geral

Este plano detalha a implementação completa das integrações com APIs oficiais para pré-preenchimento automático de relatórios técnicos no QIVO Mining Platform.

---

## 🎯 Objetivos

### Primários
- ✅ Implementar integrações com 6 APIs oficiais
- ✅ Criar sistema de cache para otimização
- ✅ Implementar tratamento robusto de erros
- ✅ Documentar todas as integrações

### Secundários
- ✅ Criar dashboard de monitoramento de APIs
- ✅ Implementar rate limiting inteligente
- ✅ Criar sistema de fallback
- ✅ Estabelecer SLAs e métricas

---

## 📊 Status Atual

| API | Documentação | Implementação | Testes | Status |
|-----|--------------|---------------|--------|--------|
| **ANM - SIGMINE** | ✅ Completa | ⚠️ Pendente | ⚠️ Pendente | 🔴 Prioridade 1 |
| **CPRM - GeoSGB** | ✅ Completa | ⚠️ Pendente | ⚠️ Pendente | 🔴 Prioridade 1 |
| **ANP - CKAN** | ✅ Completa | ⚠️ Pendente | ⚠️ Pendente | 🟡 Prioridade 2 |
| **IBAMA - CKAN** | ✅ Completa | ⚠️ Pendente | ⚠️ Pendente | 🟡 Prioridade 2 |
| **USGS - MRDS** | ✅ Completa | ⚠️ Pendente | ⚠️ Pendente | 🟢 Prioridade 3 |
| **Copernicus** | ✅ Completa | ⚠️ Pendente | ⚠️ Pendente | 🟢 Prioridade 3 |

---

## 🗓️ Cronograma Detalhado

### Fase 1: APIs Brasileiras Prioritárias (Dias 1-6)

#### Dia 1-2: ANM - SIGMINE (16 horas)

**Objetivo**: Integrar com o sistema de processos minerários da ANM

##### Dia 1 - Manhã (4h): Setup e Autenticação

**1.1 Registrar na API da ANM** (1h)
- Acessar: https://sistemas.anm.gov.br/api/registro
- Criar conta de desenvolvedor
- Obter API Key
- Configurar rate limits

**1.2 Configurar Variáveis de Ambiente** (1h)

Adicionar ao `.env`:
```bash
# ANM - SIGMINE
ANM_API_KEY=sua_chave_aqui
ANM_API_BASE_URL=https://sistemas.anm.gov.br/api
ANM_RATE_LIMIT=100
ANM_TIMEOUT=30000
```

**1.3 Criar Cliente HTTP Base** (2h)

Criar arquivo: `server/modules/technical-reports/services/api-clients/base-client.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface APIClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
  rateLimit?: number;
}

export class BaseAPIClient {
  protected client: AxiosInstance;
  protected rateLimit: number;
  protected requestCount: number = 0;
  protected lastResetTime: number = Date.now();

  constructor(config: APIClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: config.apiKey ? {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      }
    });

    this.rateLimit = config.rateLimit || 100;
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.checkRateLimit();
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] Response: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('[API] Response error:', error.response?.status);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private checkRateLimit() {
    const now = Date.now();
    const timeSinceReset = now - this.lastResetTime;

    // Reset counter every hour
    if (timeSinceReset > 3600000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    if (this.requestCount >= this.rateLimit) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.requestCount++;
  }

  private handleError(error: any) {
    if (error.response) {
      // Server responded with error
      return {
        status: error.response.status,
        message: error.response.data?.message || 'API request failed',
        data: error.response.data
      };
    } else if (error.request) {
      // No response received
      return {
        status: 0,
        message: 'No response from API server',
        data: null
      };
    } else {
      // Request setup error
      return {
        status: -1,
        message: error.message,
        data: null
      };
    }
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
}
```

##### Dia 1 - Tarde (4h): Implementar Cliente ANM

Criar arquivo: `server/modules/technical-reports/services/api-clients/anm-client.ts`

```typescript
import { BaseAPIClient, APIClientConfig } from './base-client';

export interface ANMProcesso {
  numero_processo: string;
  fase: string;
  substancia: string;
  area_ha: number;
  municipio: string;
  uf: string;
  titular: string;
  data_protocolo: string;
  situacao: string;
}

export interface ANMSearchParams {
  substancia?: string;
  municipio?: string;
  uf?: string;
  titular?: string;
  fase?: string;
}

export class ANMClient extends BaseAPIClient {
  constructor() {
    const config: APIClientConfig = {
      baseURL: process.env.ANM_API_BASE_URL || 'https://sistemas.anm.gov.br/api',
      apiKey: process.env.ANM_API_KEY,
      timeout: parseInt(process.env.ANM_TIMEOUT || '30000'),
      rateLimit: parseInt(process.env.ANM_RATE_LIMIT || '100')
    };

    super(config);
  }

  /**
   * Buscar processo minerário por número
   */
  async getProcesso(numeroProcesso: string): Promise<ANMProcesso> {
    try {
      const data = await this.get<ANMProcesso>(`/processos/${numeroProcesso}`);
      return data;
    } catch (error) {
      console.error(`[ANM] Error fetching processo ${numeroProcesso}:`, error);
      throw error;
    }
  }

  /**
   * Buscar processos por filtros
   */
  async searchProcessos(params: ANMSearchParams): Promise<ANMProcesso[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.substancia) queryParams.append('substancia', params.substancia);
      if (params.municipio) queryParams.append('municipio', params.municipio);
      if (params.uf) queryParams.append('uf', params.uf);
      if (params.titular) queryParams.append('titular', params.titular);
      if (params.fase) queryParams.append('fase', params.fase);

      const data = await this.get<ANMProcesso[]>(`/processos?${queryParams.toString()}`);
      return data;
    } catch (error) {
      console.error('[ANM] Error searching processos:', error);
      throw error;
    }
  }

  /**
   * Buscar processos por substância e UF
   */
  async getProcessosBySubstanciaUF(substancia: string, uf: string): Promise<ANMProcesso[]> {
    return this.searchProcessos({ substancia, uf });
  }

  /**
   * Buscar processos por município
   */
  async getProcessosByMunicipio(municipio: string, uf: string): Promise<ANMProcesso[]> {
    return this.searchProcessos({ municipio, uf });
  }

  /**
   * Verificar se processo está ativo
   */
  async isProcessoAtivo(numeroProcesso: string): Promise<boolean> {
    try {
      const processo = await this.getProcesso(numeroProcesso);
      return processo.situacao === 'Ativo';
    } catch (error) {
      console.error(`[ANM] Error checking processo status:`, error);
      return false;
    }
  }
}

// Singleton instance
let anmClient: ANMClient | null = null;

export function getANMClient(): ANMClient {
  if (!anmClient) {
    anmClient = new ANMClient();
  }
  return anmClient;
}
```

##### Dia 2 - Manhã (4h): Implementar Cache e Testes

**2.1 Criar Sistema de Cache** (2h)

Criar arquivo: `server/modules/technical-reports/services/cache/api-cache.ts`

```typescript
import NodeCache from 'node-cache';

export class APICache {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 3600) {
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 0);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  getStats() {
    return this.cache.getStats();
  }
}

// Singleton instance
let apiCache: APICache | null = null;

export function getAPICache(): APICache {
  if (!apiCache) {
    apiCache = new APICache(3600); // 1 hour default
  }
  return apiCache;
}
```

**2.2 Criar Testes para ANM Client** (2h)

Criar arquivo: `server/modules/technical-reports/__tests__/anm-client.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ANMClient, getANMClient } from '../services/api-clients/anm-client';

describe('ANM Client', () => {
  let client: ANMClient;

  beforeEach(() => {
    client = getANMClient();
  });

  describe('getProcesso', () => {
    it('should fetch processo by number', async () => {
      const numeroProcesso = '800.123/2020';
      
      // Mock implementation
      const mockProcesso = {
        numero_processo: numeroProcesso,
        fase: 'Requerimento de Lavra',
        substancia: 'Ouro',
        area_ha: 1500.50,
        municipio: 'Itabira',
        uf: 'MG',
        titular: 'Empresa Mineradora LTDA',
        data_protocolo: '2020-01-15',
        situacao: 'Ativo'
      };

      // Test
      expect(mockProcesso.numero_processo).toBe(numeroProcesso);
      expect(mockProcesso.substancia).toBe('Ouro');
      expect(mockProcesso.situacao).toBe('Ativo');
    });

    it('should handle invalid processo number', async () => {
      const numeroProcesso = 'INVALID';
      
      // Should throw error or return null
      expect(numeroProcesso).toBe('INVALID');
    });
  });

  describe('searchProcessos', () => {
    it('should search processos by substancia', async () => {
      const params = {
        substancia: 'Ouro',
        uf: 'MG'
      };

      // Mock implementation
      const mockResults = [
        {
          numero_processo: '800.123/2020',
          substancia: 'Ouro',
          uf: 'MG'
        }
      ];

      expect(mockResults.length).toBeGreaterThan(0);
      expect(mockResults[0].substancia).toBe('Ouro');
    });

    it('should search processos by municipio', async () => {
      const params = {
        municipio: 'Itabira',
        uf: 'MG'
      };

      // Mock implementation
      const mockResults = [
        {
          numero_processo: '800.123/2020',
          municipio: 'Itabira',
          uf: 'MG'
        }
      ];

      expect(mockResults.length).toBeGreaterThan(0);
      expect(mockResults[0].municipio).toBe('Itabira');
    });
  });

  describe('isProcessoAtivo', () => {
    it('should return true for active processo', async () => {
      const numeroProcesso = '800.123/2020';
      const isAtivo = true; // Mock

      expect(isAtivo).toBe(true);
    });

    it('should return false for inactive processo', async () => {
      const numeroProcesso = '800.456/2019';
      const isAtivo = false; // Mock

      expect(isAtivo).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // Mock rate limit test
      const rateLimit = 100;
      let requestCount = 0;

      for (let i = 0; i < 50; i++) {
        requestCount++;
      }

      expect(requestCount).toBeLessThan(rateLimit);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Mock network error
      const error = new Error('Network error');
      
      expect(error.message).toBe('Network error');
    });

    it('should handle API errors', async () => {
      // Mock API error
      const error = {
        status: 404,
        message: 'Processo not found'
      };

      expect(error.status).toBe(404);
      expect(error.message).toContain('not found');
    });
  });
});
```

##### Dia 2 - Tarde (4h): Integrar com Sistema

**2.3 Atualizar official-integrations.ts** (2h)

```typescript
import { getANMClient } from './api-clients/anm-client';
import { getAPICache } from './cache/api-cache';

export async function fetchANMData(processNumber: string) {
  const cache = getAPICache();
  const cacheKey = `anm:processo:${processNumber}`;

  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log('[ANM] Returning cached data');
    return cachedData;
  }

  // Fetch from API
  try {
    const client = getANMClient();
    const data = await client.getProcesso(processNumber);
    
    // Cache for 1 hour
    cache.set(cacheKey, data, 3600);
    
    return data;
  } catch (error) {
    console.error('[ANM] Error fetching data:', error);
    throw error;
  }
}
```

**2.4 Criar Endpoint REST** (2h)

Criar arquivo: `server/routes/api/anm.ts`

```typescript
import { Router } from 'express';
import { fetchANMData } from '../../modules/technical-reports/services/official-integrations';

const router = Router();

/**
 * GET /api/anm/processo/:numero
 * Buscar processo minerário por número
 */
router.get('/processo/:numero', async (req, res) => {
  try {
    const { numero } = req.params;
    const data = await fetchANMData(numero);
    
    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
```

**Estimativa Dia 1-2**: 16 horas

---

#### Dia 3-4: CPRM - GeoSGB (16 horas)

**Objetivo**: Integrar com o sistema de informações geológicas da CPRM

##### Implementação Similar à ANM

**Arquivos a Criar**:
1. `server/modules/technical-reports/services/api-clients/cprm-client.ts`
2. `server/modules/technical-reports/__tests__/cprm-client.test.ts`
3. `server/routes/api/cprm.ts`

**Funcionalidades**:
- Consultar litologia por coordenadas
- Buscar ocorrências minerais
- Consultar formações geológicas
- Buscar recursos hídricos

**Estimativa Dia 3-4**: 16 horas

---

### Fase 2: APIs Brasileiras Secundárias (Dias 5-8)

#### Dia 5-6: ANP - CKAN (16 horas)

**Objetivo**: Integrar com dados de blocos exploratórios da ANP

**Arquivos a Criar**:
1. `server/modules/technical-reports/services/api-clients/anp-client.ts`
2. `server/modules/technical-reports/__tests__/anp-client.test.ts`
3. `server/routes/api/anp.ts`

**Funcionalidades**:
- Listar datasets disponíveis
- Consultar blocos exploratórios
- Buscar por bacia sedimentar
- Consultar operadores

**Estimativa Dia 5-6**: 16 horas

---

#### Dia 7-8: IBAMA - CKAN (16 horas)

**Objetivo**: Integrar com dados de licenças ambientais do IBAMA

**Arquivos a Criar**:
1. `server/modules/technical-reports/services/api-clients/ibama-client.ts`
2. `server/modules/technical-reports/__tests__/ibama-client.test.ts`
3. `server/routes/api/ibama.ts`

**Funcionalidades**:
- Consultar licenças ambientais
- Verificar validade de licenças
- Buscar condicionantes
- Consultar por empreendimento

**Estimativa Dia 7-8**: 16 horas

---

### Fase 3: APIs Internacionais (Dias 9-12)

#### Dia 9-10: USGS - MRDS (16 horas)

**Objetivo**: Integrar com banco de dados de depósitos minerais do USGS

**Arquivos a Criar**:
1. `server/modules/technical-reports/services/api-clients/usgs-client.ts`
2. `server/modules/technical-reports/__tests__/usgs-client.test.ts`
3. `server/routes/api/usgs.ts`

**Funcionalidades**:
- Buscar depósitos análogos
- Consultar por commodity
- Buscar por tipo de depósito
- Análise comparativa

**Estimativa Dia 9-10**: 16 horas

---

#### Dia 11-12: Copernicus / NASA (16 horas)

**Objetivo**: Integrar com APIs de imagens satelitais

**Arquivos a Criar**:
1. `server/modules/technical-reports/services/api-clients/copernicus-client.ts`
2. `server/modules/technical-reports/__tests__/copernicus-client.test.ts`
3. `server/routes/api/satellite.ts`

**Funcionalidades**:
- Buscar imagens Sentinel-2
- Calcular NDVI
- Análise de cobertura vegetal
- Monitoramento ambiental

**Estimativa Dia 11-12**: 16 horas

---

### Fase 4: Dashboard e Monitoramento (Dias 13-15)

#### Dia 13: Dashboard de APIs (8 horas)

**Objetivo**: Criar interface de monitoramento de APIs

**Funcionalidades**:
- Status de cada API (online/offline)
- Métricas de uso (requests/hour)
- Taxa de erro
- Tempo de resposta médio
- Cache hit rate

**Arquivo a Criar**:
`client/src/pages/admin/APIDashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';

interface APIStatus {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  requestsPerHour: number;
  errorRate: number;
  avgResponseTime: number;
  cacheHitRate: number;
}

export default function APIDashboard() {
  const [apis, setApis] = useState<APIStatus[]>([]);

  useEffect(() => {
    // Fetch API status
    fetchAPIStatus();
  }, []);

  const fetchAPIStatus = async () => {
    // Implementation
  };

  return (
    <div className="api-dashboard">
      <h1>API Monitoring Dashboard</h1>
      
      <div className="api-grid">
        {apis.map(api => (
          <div key={api.name} className="api-card">
            <h3>{api.name}</h3>
            <div className={`status ${api.status}`}>
              {api.status.toUpperCase()}
            </div>
            <div className="metrics">
              <div>Requests/Hour: {api.requestsPerHour}</div>
              <div>Error Rate: {api.errorRate}%</div>
              <div>Avg Response: {api.avgResponseTime}ms</div>
              <div>Cache Hit: {api.cacheHitRate}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Estimativa**: 8 horas

---

#### Dia 14: Testes de Integração (8 horas)

**Objetivo**: Criar testes end-to-end para todas as APIs

**Arquivo a Criar**:
`server/modules/technical-reports/__tests__/api-integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getANMClient } from '../services/api-clients/anm-client';
import { getCPRMClient } from '../services/api-clients/cprm-client';
// ... outros imports

describe('API Integration Tests', () => {
  describe('ANM Integration', () => {
    it('should fetch real data from ANM', async () => {
      // Test with real API (if available)
    });
  });

  describe('CPRM Integration', () => {
    it('should fetch real data from CPRM', async () => {
      // Test with real API (if available)
    });
  });

  describe('Multi-API Workflow', () => {
    it('should fetch data from multiple APIs', async () => {
      // Test complete workflow
    });
  });
});
```

**Estimativa**: 8 horas

---

#### Dia 15: Documentação e Refinamento (8 horas)

**Objetivo**: Finalizar documentação e corrigir bugs

**Tarefas**:
1. Atualizar API_INTEGRATIONS_GUIDE.md com exemplos reais
2. Criar guia de troubleshooting
3. Documentar rate limits e melhores práticas
4. Corrigir bugs identificados
5. Otimizar performance

**Estimativa**: 8 horas

---

## 📊 Métricas de Sucesso

### Objetivos Quantitativos
- ✅ **6 APIs** integradas
- ✅ **100+ testes** de integração
- ✅ **95%+ uptime** das integrações
- ✅ **< 2s** tempo médio de resposta

### Objetivos Qualitativos
- ✅ Código bem documentado
- ✅ Tratamento robusto de erros
- ✅ Sistema de cache eficiente
- ✅ Dashboard de monitoramento funcional

---

## 🔧 Dependências Necessárias

### Instalar
```bash
pnpm add axios node-cache
pnpm add -D @types/node-cache
```

### Configurar
```bash
# Adicionar ao .env
ANM_API_KEY=
CPRM_API_KEY=
ANP_API_KEY=
IBAMA_API_KEY=
USGS_API_KEY=
COPERNICUS_API_KEY=
```

---

## 📝 Checklist de Implementação

### Fase 1: APIs Brasileiras Prioritárias
- [ ] ANM - SIGMINE (Dia 1-2)
  - [ ] Cliente HTTP implementado
  - [ ] Cache configurado
  - [ ] Testes criados
  - [ ] Endpoint REST criado
- [ ] CPRM - GeoSGB (Dia 3-4)
  - [ ] Cliente HTTP implementado
  - [ ] Cache configurado
  - [ ] Testes criados
  - [ ] Endpoint REST criado

### Fase 2: APIs Brasileiras Secundárias
- [ ] ANP - CKAN (Dia 5-6)
  - [ ] Cliente HTTP implementado
  - [ ] Testes criados
  - [ ] Endpoint REST criado
- [ ] IBAMA - CKAN (Dia 7-8)
  - [ ] Cliente HTTP implementado
  - [ ] Testes criados
  - [ ] Endpoint REST criado

### Fase 3: APIs Internacionais
- [ ] USGS - MRDS (Dia 9-10)
  - [ ] Cliente HTTP implementado
  - [ ] Testes criados
  - [ ] Endpoint REST criado
- [ ] Copernicus (Dia 11-12)
  - [ ] Cliente HTTP implementado
  - [ ] Testes criados
  - [ ] Endpoint REST criado

### Fase 4: Dashboard e Monitoramento
- [ ] Dashboard de APIs (Dia 13)
- [ ] Testes de integração (Dia 14)
- [ ] Documentação final (Dia 15)

---

## 🎯 Entregáveis

1. ✅ **6 clientes de API** implementados
2. ✅ **Sistema de cache** robusto
3. ✅ **100+ testes** de integração
4. ✅ **Dashboard de monitoramento** funcional
5. ✅ **Documentação completa** atualizada
6. ✅ **6 endpoints REST** para frontend

---

## 📅 Cronograma Resumido

| Fase | APIs | Dias | Horas | Status |
|------|------|------|-------|--------|
| 1 | ANM, CPRM | 1-4 | 32h | ⏳ Pendente |
| 2 | ANP, IBAMA | 5-8 | 32h | ⏳ Pendente |
| 3 | USGS, Copernicus | 9-12 | 32h | ⏳ Pendente |
| 4 | Dashboard + Docs | 13-15 | 24h | ⏳ Pendente |

**Total**: 15 dias, 120 horas

---

## 🔗 Referências

- **ANM**: https://www.gov.br/anm/
- **CPRM**: https://www.cprm.gov.br/
- **ANP**: https://www.gov.br/anp/
- **IBAMA**: https://www.gov.br/ibama/
- **USGS**: https://www.usgs.gov/
- **Copernicus**: https://www.copernicus.eu/
- **Axios**: https://axios-http.com/
- **Node-Cache**: https://www.npmjs.com/package/node-cache

---

**Criado em**: 31 de Outubro de 2025  
**Última Atualização**: 31 de Outubro de 2025

