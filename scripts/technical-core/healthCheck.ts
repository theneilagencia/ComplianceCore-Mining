#!/usr/bin/env tsx

/**
 * QIVO Engineer AI v2 - Technical Core
 * healthCheck.ts
 * 
 * Testa endpoints de health e registra status
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

interface HealthCheckResult {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'down';
  checks: Array<{
    name: string;
    endpoint: string;
    status: number;
    ok: boolean;
    responseTime: number;
    error?: string;
  }>;
}

async function runHealthChecks(): Promise<HealthCheckResult> {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  
  const endpoints = [
    { name: 'API Health', endpoint: '/api/health' },
    { name: 'Database', endpoint: '/api/health/db' },
    { name: 'Storage', endpoint: '/api/health/storage' },
    { name: 'AI Engines', endpoint: '/api/health/ai' },
    { name: 'Validator AI', endpoint: '/api/validator/health' },
    { name: 'Bridge AI', endpoint: '/api/bridge/health' },
    { name: 'Radar AI', endpoint: '/api/radar/health' },
    { name: 'Manus AI', endpoint: '/api/manus/health' }
  ];

  const result: HealthCheckResult = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    checks: []
  };

  console.log('🏥 QIVO Engineer AI v2 - Health Check\n');

  for (const check of endpoints) {
    const start = Date.now();
    try {
      const response = await fetch(`${baseUrl}${check.endpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      const responseTime = Date.now() - start;
      
      result.checks.push({
        name: check.name,
        endpoint: check.endpoint,
        status: response.status,
        ok: response.ok,
        responseTime
      });

      console.log(`${response.ok ? '✅' : '❌'} ${check.name}: ${response.status} (${responseTime}ms)`);
    } catch (error: any) {
      const responseTime = Date.now() - start;
      result.checks.push({
        name: check.name,
        endpoint: check.endpoint,
        status: 0,
        ok: false,
        responseTime,
        error: error.message
      });
      console.log(`❌ ${check.name}: Connection failed`);
    }
  }

  const healthyCount = result.checks.filter(c => c.ok).length;
  if (healthyCount === result.checks.length) {
    result.overall = 'healthy';
  } else if (healthyCount > 0) {
    result.overall = 'degraded';
  } else {
    result.overall = 'down';
  }

  return result;
}

(async () => {
  try {
    const result = await runHealthChecks();
    
    const report = `# Health Check Report

**Time:** ${new Date(result.timestamp).toLocaleString()}
**Overall:** ${result.overall.toUpperCase()}

## Checks

${result.checks.map(c => `- ${c.ok ? '✅' : '❌'} **${c.name}**: ${c.status} (${c.responseTime}ms)${c.error ? ` - ${c.error}` : ''}`).join('\n')}
`;

    writeFileSync(join(process.cwd(), 'docs', 'QIVO_HEALTH_CHECK.md'), report);
    console.log(`\n✅ Health check complete: ${result.overall}`);
    
    process.exit(result.overall === 'down' ? 1 : 0);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
})();
