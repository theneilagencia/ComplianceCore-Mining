#!/usr/bin/env tsx

/**
 * QIVO Engineer AI v2 - Technical Core
 * generateAudit.ts
 * 
 * Gera relatório técnico completo de auditoria:
 * - Tempo de build
 * - Análise de dependências
 * - Tamanho de bundles
 * - Métricas de qualidade
 * - Health checks
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, statSync, readdirSync } from 'fs';
import { join } from 'path';

interface AuditResult {
  timestamp: string;
  build: {
    duration: number;
    success: boolean;
    errors: string[];
  };
  dependencies: {
    total: number;
    outdated: number;
    vulnerable: number;
    list: Array<{ name: string; current: string; wanted: string; latest: string }>;
  };
  bundles: {
    client: { size: number; files: number };
    server: { size: number; files: number };
  };
  quality: {
    lintErrors: number;
    lintWarnings: number;
    typeErrors: number;
    testCoverage: number;
  };
  health: {
    status: 'healthy' | 'degraded' | 'down';
    checks: Record<string, boolean>;
  };
}

async function generateAudit(): Promise<AuditResult> {
  const audit: AuditResult = {
    timestamp: new Date().toISOString(),
    build: { duration: 0, success: false, errors: [] },
    dependencies: { total: 0, outdated: 0, vulnerable: 0, list: [] },
    bundles: {
      client: { size: 0, files: 0 },
      server: { size: 0, files: 0 }
    },
    quality: {
      lintErrors: 0,
      lintWarnings: 0,
      typeErrors: 0,
      testCoverage: 0
    },
    health: {
      status: 'healthy',
      checks: {}
    }
  };

  console.log('🤖 QIVO Engineer AI v2 - Technical Audit Starting...\n');

  // 1. Build Test
  console.log('📦 Testing build process...');
  const buildStart = Date.now();
  try {
    execSync('pnpm run build', { stdio: 'pipe', encoding: 'utf-8' });
    audit.build.duration = Date.now() - buildStart;
    audit.build.success = true;
    console.log(`✅ Build successful in ${audit.build.duration}ms`);
  } catch (error: any) {
    audit.build.duration = Date.now() - buildStart;
    audit.build.success = false;
    audit.build.errors.push(error.message);
    console.log(`❌ Build failed: ${error.message}`);
  }

  // 2. Dependencies Analysis
  console.log('\n📋 Analyzing dependencies...');
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    audit.dependencies.total = Object.keys(deps).length;

    // Check for outdated
    try {
      const outdated = execSync('pnpm outdated --format json', { 
        stdio: 'pipe', 
        encoding: 'utf-8' 
      });
      const outdatedPkgs = JSON.parse(outdated);
      audit.dependencies.outdated = Object.keys(outdatedPkgs).length;
      audit.dependencies.list = Object.entries(outdatedPkgs).map(([name, info]: [string, any]) => ({
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest
      }));
    } catch {
      // No outdated packages or pnpm outdated not available
    }

    // Check for vulnerabilities
    try {
      const auditOutput = execSync('pnpm audit --json', { 
        stdio: 'pipe', 
        encoding: 'utf-8' 
      });
      const auditData = JSON.parse(auditOutput);
      audit.dependencies.vulnerable = auditData.metadata?.vulnerabilities?.total || 0;
    } catch {
      // No vulnerabilities or audit not available
    }

    console.log(`✅ Dependencies: ${audit.dependencies.total} total, ${audit.dependencies.outdated} outdated, ${audit.dependencies.vulnerable} vulnerable`);
  } catch (error: any) {
    console.log(`⚠️  Dependencies analysis failed: ${error.message}`);
  }

  // 3. Bundle Size Analysis
  console.log('\n📊 Analyzing bundle sizes...');
  try {
    const distPath = join(process.cwd(), 'dist');
    
    // Client bundles
    const clientPath = join(distPath, 'public');
    if (readdirSync(clientPath).length > 0) {
      const clientStats = getDirectorySize(clientPath);
      audit.bundles.client = clientStats;
      console.log(`✅ Client bundle: ${(clientStats.size / 1024 / 1024).toFixed(2)} MB (${clientStats.files} files)`);
    }

    // Server bundles
    const serverPath = join(distPath, 'server');
    if (readdirSync(serverPath).length > 0) {
      const serverStats = getDirectorySize(serverPath);
      audit.bundles.server = serverStats;
      console.log(`✅ Server bundle: ${(serverStats.size / 1024 / 1024).toFixed(2)} MB (${serverStats.files} files)`);
    }
  } catch (error: any) {
    console.log(`⚠️  Bundle analysis skipped: ${error.message}`);
  }

  // 4. Code Quality Analysis
  console.log('\n🔍 Analyzing code quality...');
  try {
    // ESLint
    try {
      execSync('pnpm run lint', { stdio: 'pipe' });
      console.log('✅ ESLint: No errors');
    } catch (error: any) {
      const output = error.stdout?.toString() || '';
      const errors = (output.match(/error/gi) || []).length;
      const warnings = (output.match(/warning/gi) || []).length;
      audit.quality.lintErrors = errors;
      audit.quality.lintWarnings = warnings;
      console.log(`⚠️  ESLint: ${errors} errors, ${warnings} warnings`);
    }

    // TypeScript
    try {
      execSync('pnpm tsc --noEmit', { stdio: 'pipe' });
      console.log('✅ TypeScript: No type errors');
    } catch (error: any) {
      const output = error.stdout?.toString() || '';
      const errors = (output.match(/error TS/gi) || []).length;
      audit.quality.typeErrors = errors;
      console.log(`⚠️  TypeScript: ${errors} type errors`);
    }

    // Test Coverage
    try {
      const coverage = execSync('pnpm test:coverage --reporter=json', { 
        stdio: 'pipe',
        encoding: 'utf-8' 
      });
      const coverageData = JSON.parse(coverage);
      audit.quality.testCoverage = coverageData.total?.lines?.pct || 0;
      console.log(`✅ Test Coverage: ${audit.quality.testCoverage.toFixed(1)}%`);
    } catch {
      console.log('⚠️  Test coverage not available');
    }
  } catch (error: any) {
    console.log(`⚠️  Quality analysis partially failed: ${error.message}`);
  }

  // 5. Health Checks
  console.log('\n🏥 Running health checks...');
  const healthChecks = [
    { name: 'API Server', endpoint: '/api/health' },
    { name: 'Database', endpoint: '/api/health/db' },
    { name: 'Storage', endpoint: '/api/health/storage' },
    { name: 'AI Engines', endpoint: '/api/health/ai' }
  ];

  for (const check of healthChecks) {
    try {
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}${check.endpoint}`);
      audit.health.checks[check.name] = response.ok;
      console.log(`${response.ok ? '✅' : '❌'} ${check.name}: ${response.status}`);
    } catch {
      audit.health.checks[check.name] = false;
      console.log(`❌ ${check.name}: Connection failed`);
    }
  }

  const healthyChecks = Object.values(audit.health.checks).filter(Boolean).length;
  const totalChecks = Object.keys(audit.health.checks).length;
  
  if (healthyChecks === totalChecks) {
    audit.health.status = 'healthy';
  } else if (healthyChecks > 0) {
    audit.health.status = 'degraded';
  } else {
    audit.health.status = 'down';
  }

  return audit;
}

function getDirectorySize(dirPath: string): { size: number; files: number } {
  let totalSize = 0;
  let fileCount = 0;

  function traverse(currentPath: string) {
    const items = readdirSync(currentPath);
    
    for (const item of items) {
      const itemPath = join(currentPath, item);
      const stats = statSync(itemPath);
      
      if (stats.isDirectory()) {
        traverse(itemPath);
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }
  }

  traverse(dirPath);
  return { size: totalSize, files: fileCount };
}

function generateMarkdownReport(audit: AuditResult): string {
  return `# 🤖 QIVO Engineer AI v2 - Technical Audit Report

**Generated:** ${new Date(audit.timestamp).toLocaleString()}  
**Status:** ${getOverallStatus(audit)}

---

## 📦 Build Analysis

- **Duration:** ${audit.build.duration}ms
- **Status:** ${audit.build.success ? '✅ Success' : '❌ Failed'}
${audit.build.errors.length > 0 ? `- **Errors:**\n${audit.build.errors.map(e => `  - ${e}`).join('\n')}` : ''}

---

## 📋 Dependencies

- **Total:** ${audit.dependencies.total}
- **Outdated:** ${audit.dependencies.outdated} ${audit.dependencies.outdated > 0 ? '⚠️' : '✅'}
- **Vulnerable:** ${audit.dependencies.vulnerable} ${audit.dependencies.vulnerable > 0 ? '🚨' : '✅'}

${audit.dependencies.list.length > 0 ? `
### Outdated Packages
| Package | Current | Wanted | Latest |
|---------|---------|--------|--------|
${audit.dependencies.list.slice(0, 10).map(pkg => 
  `| ${pkg.name} | ${pkg.current} | ${pkg.wanted} | ${pkg.latest} |`
).join('\n')}
${audit.dependencies.list.length > 10 ? `\n... and ${audit.dependencies.list.length - 10} more` : ''}
` : ''}

---

## 📊 Bundle Sizes

### Client
- **Size:** ${(audit.bundles.client.size / 1024 / 1024).toFixed(2)} MB
- **Files:** ${audit.bundles.client.files}

### Server
- **Size:** ${(audit.bundles.server.size / 1024 / 1024).toFixed(2)} MB
- **Files:** ${audit.bundles.server.files}

---

## 🔍 Code Quality

- **Lint Errors:** ${audit.quality.lintErrors} ${audit.quality.lintErrors === 0 ? '✅' : '❌'}
- **Lint Warnings:** ${audit.quality.lintWarnings} ${audit.quality.lintWarnings === 0 ? '✅' : '⚠️'}
- **Type Errors:** ${audit.quality.typeErrors} ${audit.quality.typeErrors === 0 ? '✅' : '❌'}
- **Test Coverage:** ${audit.quality.testCoverage.toFixed(1)}% ${audit.quality.testCoverage >= 80 ? '✅' : '⚠️'}

---

## 🏥 Health Status: ${audit.health.status.toUpperCase()}

${Object.entries(audit.health.checks).map(([name, status]) => 
  `- ${status ? '✅' : '❌'} **${name}**`
).join('\n')}

---

## 📊 Overall Score

${calculateScore(audit)}/100

${generateRecommendations(audit)}
`;
}

function getOverallStatus(audit: AuditResult): string {
  if (!audit.build.success) return '🔴 Critical';
  if (audit.dependencies.vulnerable > 0) return '🟡 Warning';
  if (audit.quality.lintErrors > 0 || audit.quality.typeErrors > 0) return '🟡 Warning';
  if (audit.health.status !== 'healthy') return '🟡 Warning';
  return '🟢 Healthy';
}

function calculateScore(audit: AuditResult): number {
  let score = 100;
  
  if (!audit.build.success) score -= 30;
  score -= audit.dependencies.vulnerable * 2;
  score -= audit.dependencies.outdated * 0.5;
  score -= audit.quality.lintErrors * 1;
  score -= audit.quality.lintWarnings * 0.2;
  score -= audit.quality.typeErrors * 1;
  
  const coveragePenalty = Math.max(0, (80 - audit.quality.testCoverage) * 0.5);
  score -= coveragePenalty;
  
  if (audit.health.status === 'degraded') score -= 10;
  if (audit.health.status === 'down') score -= 20;
  
  return Math.max(0, Math.round(score));
}

function generateRecommendations(audit: AuditResult): string {
  const recommendations: string[] = [];
  
  if (!audit.build.success) {
    recommendations.push('🔧 **Fix build errors immediately** - Build is failing');
  }
  
  if (audit.dependencies.vulnerable > 0) {
    recommendations.push(`🚨 **Update vulnerable dependencies** - ${audit.dependencies.vulnerable} packages have known vulnerabilities`);
  }
  
  if (audit.dependencies.outdated > 10) {
    recommendations.push(`📦 **Update outdated packages** - ${audit.dependencies.outdated} packages are outdated`);
  }
  
  if (audit.quality.lintErrors > 0) {
    recommendations.push(`🔍 **Fix ESLint errors** - ${audit.quality.lintErrors} errors found`);
  }
  
  if (audit.quality.typeErrors > 0) {
    recommendations.push(`📝 **Fix TypeScript errors** - ${audit.quality.typeErrors} type errors found`);
  }
  
  if (audit.quality.testCoverage < 80) {
    recommendations.push(`🧪 **Increase test coverage** - Current: ${audit.quality.testCoverage.toFixed(1)}%, Target: 80%`);
  }
  
  if (audit.bundles.client.size > 5 * 1024 * 1024) {
    recommendations.push(`📊 **Optimize client bundle** - Size is ${(audit.bundles.client.size / 1024 / 1024).toFixed(2)} MB (target < 5 MB)`);
  }
  
  if (audit.health.status !== 'healthy') {
    recommendations.push(`🏥 **Check unhealthy services** - Some health checks are failing`);
  }
  
  if (recommendations.length === 0) {
    return '## ✅ No Critical Issues\n\nAll systems are operating within acceptable parameters.';
  }
  
  return `## 🎯 Recommendations\n\n${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
}

// Main execution
(async () => {
  try {
    const audit = await generateAudit();
    const report = generateMarkdownReport(audit);
    
    // Save report
    const outputPath = join(process.cwd(), 'docs', 'QIVO_TECHNICAL_AUDIT.md');
    writeFileSync(outputPath, report, 'utf-8');
    
    console.log(`\n✅ Audit report generated: ${outputPath}`);
    console.log(`📊 Overall Score: ${calculateScore(audit)}/100`);
    
    // Exit with appropriate code
    const score = calculateScore(audit);
    if (score < 70) {
      console.log('\n❌ Audit score below threshold (70)');
      process.exit(1);
    } else if (score < 90) {
      console.log('\n⚠️  Audit score needs improvement (90)');
      process.exit(0);
    } else {
      console.log('\n✅ Audit passed with excellent score!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  }
})();
