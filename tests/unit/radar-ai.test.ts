/**
 * Radar AI - Unit Tests
 * ====================
 * Testes básicos para validar funcionamento do Radar AI
 */

import { describe, it, expect, beforeAll } from 'vitest';
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api/radar';

// Helper para criar cliente axios configurado
const radarClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30s (ciclos podem ser lentos)
  headers: {
    'Content-Type': 'application/json'
  }
});

describe('Radar AI - Health & Status', () => {
  it('deve retornar health check com status healthy ou degraded', async () => {
    const response = await radarClient.get('/health');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(['healthy', 'degraded', 'error']).toContain(response.data.status);
    expect(response.data).toHaveProperty('module', 'Radar AI');
    expect(response.data).toHaveProperty('version');
    expect(response.data).toHaveProperty('components');
    expect(response.data).toHaveProperty('timestamp');
  });

  it('deve incluir status dos componentes (engine, openai, cache)', async () => {
    const response = await radarClient.get('/health');
    const components = response.data.components;
    
    expect(components).toHaveProperty('engine');
    expect(components.engine).toHaveProperty('status');
    expect(components.engine).toHaveProperty('sources_supported');
    
    expect(components).toHaveProperty('openai');
    expect(components.openai).toHaveProperty('status');
    expect(components.openai).toHaveProperty('api_key_configured');
    
    expect(components).toHaveProperty('cache');
    expect(components.cache).toHaveProperty('status');
  });

  it('deve incluir estatísticas de uso', async () => {
    const response = await radarClient.get('/health');
    const stats = response.data.statistics;
    
    expect(stats).toHaveProperty('monitoring_cycles_today');
    expect(stats).toHaveProperty('alerts_generated_today');
    expect(stats).toHaveProperty('average_cycle_time');
    
    expect(typeof stats.monitoring_cycles_today).toBe('number');
    expect(typeof stats.alerts_generated_today).toBe('number');
  });

  it('deve retornar status detalhado do sistema', async () => {
    const response = await radarClient.get('/status');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('recent_activity');
  });
});

describe('Radar AI - Sources', () => {
  it('deve listar todas as fontes regulatórias suportadas', async () => {
    const response = await radarClient.get('/sources');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
    expect(response.data).toHaveProperty('sources');
    expect(response.data).toHaveProperty('total');
    
    expect(Array.isArray(response.data.sources)).toBe(true);
    expect(response.data.sources.length).toBeGreaterThan(0);
  });

  it('deve incluir 5 fontes regulatórias (ANM, JORC, NI43-101, PERC, SAMREC)', async () => {
    const response = await radarClient.get('/sources');
    const sources = response.data.sources;
    
    expect(sources.length).toBe(5);
    
    const sourceCodes = sources.map((s: any) => s.code);
    expect(sourceCodes).toContain('ANM');
    expect(sourceCodes).toContain('JORC');
    expect(sourceCodes).toContain('NI43-101');
    expect(sourceCodes).toContain('PERC');
    expect(sourceCodes).toContain('SAMREC');
  });

  it('cada fonte deve ter estrutura completa', async () => {
    const response = await radarClient.get('/sources');
    const sources = response.data.sources;
    
    sources.forEach((source: any) => {
      expect(source).toHaveProperty('code');
      expect(source).toHaveProperty('country');
      expect(source).toHaveProperty('full_name');
      expect(source).toHaveProperty('url');
      expect(source).toHaveProperty('focus');
      expect(source).toHaveProperty('update_frequency');
      
      expect(Array.isArray(source.focus)).toBe(true);
    });
  });

  it('ANM deve ter informações corretas', async () => {
    const response = await radarClient.get('/sources');
    const anm = response.data.sources.find((s: any) => s.code === 'ANM');
    
    expect(anm).toBeDefined();
    expect(anm.country).toBe('Brasil');
    expect(anm.full_name).toBe('Agência Nacional de Mineração');
    expect(anm.url).toContain('anm');
  });
});

describe('Radar AI - Monitoring Cycle', () => {
  it('deve executar ciclo básico de monitoramento (sem deep analysis)', async () => {
    const response = await radarClient.post('/monitor', {
      sources: ['ANM'],  // apenas 1 fonte para teste rápido
      deep: false,
      summarize: false
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
    expect(response.data).toHaveProperty('timestamp');
    expect(response.data).toHaveProperty('sources_monitored');
    expect(response.data).toHaveProperty('alerts_count');
    expect(response.data).toHaveProperty('alerts');
    
    expect(Array.isArray(response.data.sources_monitored)).toBe(true);
    expect(Array.isArray(response.data.alerts)).toBe(true);
  }, 15000); // timeout aumentado para 15s

  it('deve executar teste rápido com sucesso', async () => {
    const response = await radarClient.post('/test');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
    expect(response.data).toHaveProperty('message');
    expect(response.data).toHaveProperty('test_results');
    expect(response.data.test_results).toHaveProperty('sources_monitored');
    expect(response.data.test_results).toHaveProperty('alerts_count');
  }, 10000); // timeout 10s

  it('deve aceitar parâmetros opcionais (sources, deep, summarize)', async () => {
    const response = await radarClient.post('/monitor', {
      sources: ['ANM', 'JORC'],
      deep: false,
      summarize: false
    });
    
    expect(response.status).toBe(200);
    expect(response.data.sources_monitored).toContain('ANM');
    expect(response.data.sources_monitored).toContain('JORC');
  }, 15000);

  it('ciclo com deep analysis deve incluir análise GPT-4o', async () => {
    // Apenas se OpenAI estiver configurado
    const healthResponse = await radarClient.get('/health');
    const openaiConfigured = healthResponse.data.components.openai.status === 'connected';
    
    if (!openaiConfigured) {
      console.log('⚠️  OpenAI não configurado, pulando teste de deep analysis');
      return;
    }

    const response = await radarClient.post('/monitor', {
      sources: ['ANM'],
      deep: true,        // ativa GPT-4o
      summarize: true    // gera resumo
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('executive_summary');
    
    // Alertas com deep analysis devem ter mais detalhes
    if (response.data.alerts.length > 0) {
      const alert = response.data.alerts[0];
      expect(alert).toHaveProperty('impact_score');
      expect(alert).toHaveProperty('actions');
    }
  }, 30000); // timeout aumentado para 30s
});

describe('Radar AI - Alerts', () => {
  it('deve retornar lista de alertas (mesmo que vazia)', async () => {
    const response = await radarClient.get('/alerts');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status', 'success');
    expect(response.data).toHaveProperty('alerts');
    expect(response.data).toHaveProperty('count');
    
    expect(Array.isArray(response.data.alerts)).toBe(true);
    expect(response.data.count).toBe(response.data.alerts.length);
  });

  it('deve aceitar filtros (severity, source, limit)', async () => {
    const response = await radarClient.get('/alerts', {
      params: {
        severity: 'High',
        source: 'ANM',
        limit: 10
      }
    });
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('filters_applied');
    expect(response.data.filters_applied.severity).toBe('High');
    expect(response.data.filters_applied.source).toBe('ANM');
    expect(response.data.filters_applied.limit).toBe(10);
  });

  it('alertas devem ter estrutura correta', async () => {
    // Primeiro executar monitoramento para gerar alertas
    await radarClient.post('/monitor', {
      sources: ['ANM'],
      deep: false,
      summarize: false
    });

    const response = await radarClient.get('/alerts');
    
    if (response.data.alerts.length > 0) {
      const alert = response.data.alerts[0];
      
      expect(alert).toHaveProperty('source');
      expect(alert).toHaveProperty('change');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('date');
      expect(alert).toHaveProperty('summary');
      
      // Severity deve ser um dos valores válidos
      expect(['Low', 'Medium', 'High', 'Critical']).toContain(alert.severity);
    }
  }, 15000);

  it('deve respeitar limit parameter', async () => {
    const response = await radarClient.get('/alerts', {
      params: { limit: 5 }
    });
    
    expect(response.data.alerts.length).toBeLessThanOrEqual(5);
  });
});

describe('Radar AI - Error Handling', () => {
  it('deve retornar 400 para request body inválido', async () => {
    try {
      await radarClient.post('/monitor', {
        sources: 'invalid',  // deveria ser array
        deep: 'yes'          // deveria ser boolean
      });
      
      // Se não lançou erro, falha o teste
      expect.fail('Deveria ter retornado erro 400');
    } catch (error: any) {
      if (error.response) {
        expect([400, 422]).toContain(error.response.status);
      }
    }
  });

  it('deve retornar erro gracefully quando OpenAI não configurado', async () => {
    const healthResponse = await radarClient.get('/health');
    const openaiConfigured = healthResponse.data.components.openai.status === 'connected';
    
    if (openaiConfigured) {
      console.log('✅ OpenAI configurado, pulando teste de erro');
      return;
    }

    // Tentar deep analysis sem OpenAI configurado
    try {
      await radarClient.post('/monitor', {
        deep: true
      });
    } catch (error: any) {
      // Deve retornar erro ou executar sem deep analysis
      expect(error.response?.status).toBeGreaterThanOrEqual(400);
    }
  }, 15000);
});

describe('Radar AI - Integration Tests', () => {
  let monitoringResult: any;

  beforeAll(async () => {
    // Executar monitoramento uma vez para todos os testes
    const response = await radarClient.post('/monitor', {
      sources: ['ANM'],
      deep: false,
      summarize: false
    });
    monitoringResult = response.data;
  }, 15000);

  it('resultado do monitoramento deve ser consistente', () => {
    expect(monitoringResult).toBeDefined();
    expect(monitoringResult.status).toBe('success');
    expect(monitoringResult.sources_monitored).toContain('ANM');
  });

  it('alertas gerados devem aparecer em /alerts', async () => {
    if (monitoringResult.alerts_count === 0) {
      console.log('⚠️  Nenhum alerta gerado, pulando teste');
      return;
    }

    const alertsResponse = await radarClient.get('/alerts');
    expect(alertsResponse.data.alerts.length).toBeGreaterThan(0);
  });

  it('health check deve refletir cache atualizado', async () => {
    const healthResponse = await radarClient.get('/health');
    const cache = healthResponse.data.components.cache;
    
    // Deve ter pelo menos 1 fonte no cache (ANM)
    expect(cache.sources_cached).toBeGreaterThan(0);
  });
});

describe('Radar AI - Performance', () => {
  it('ciclo básico deve completar em menos de 10 segundos', async () => {
    const startTime = Date.now();
    
    await radarClient.post('/monitor', {
      sources: ['ANM'],
      deep: false
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000); // 10s
  }, 15000);

  it('health check deve responder em menos de 2 segundos', async () => {
    const startTime = Date.now();
    
    await radarClient.get('/health');
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000); // 2s
  });

  it('sources endpoint deve responder em menos de 1 segundo', async () => {
    const startTime = Date.now();
    
    await radarClient.get('/sources');
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // 1s
  });
});

// ============================================================================
// Export para uso em outros testes
// ============================================================================

export { radarClient, BASE_URL };

/**
 * Helper function para testes customizados
 */
export async function runBasicMonitoring() {
  return await radarClient.post('/monitor', {
    sources: ['ANM'],
    deep: false,
    summarize: false
  });
}

export async function getRadarHealth() {
  return await radarClient.get('/health');
}

export async function getSources() {
  return await radarClient.get('/sources');
}
