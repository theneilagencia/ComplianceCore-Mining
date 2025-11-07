import { describe, it, expect } from 'vitest';

/**
 * Smoke Tests - Testes básicos para garantir que a aplicação não está quebrada
 * Estes testes devem rodar rápido e detectar problemas críticos
 */

describe('Smoke Tests - Application Health', () => {
  it('should pass basic sanity check', () => {
    expect(true).toBe(true);
  });

  it('should have Node.js environment', () => {
    expect(process).toBeDefined();
    expect(process.version).toBeDefined();
  });

  it('should have environment variables defined', () => {
    // Não verificar valores, apenas existência
    expect(process.env).toBeDefined();
  });
});

describe('Smoke Tests - Core Modules', () => {
  it('should be able to import core dependencies', async () => {
    // Testar imports básicos
    const express = await import('express');
    expect(express.default).toBeDefined();
  });

  it('should have database schema defined', async () => {
    const schema = await import('../../db/schema');
    expect(schema).toBeDefined();
    expect(schema.users).toBeDefined();
    expect(schema.tenants).toBeDefined();
  });
});

describe('Smoke Tests - Configuration', () => {
  it('should have valid package.json', async () => {
    const pkg = await import('../../package.json', { 
      assert: { type: 'json' } 
    });
    expect(pkg.default.name).toBe('qivo-mining-intelligence');
    expect(pkg.default.version).toBeDefined();
  });

  it('should have TypeScript configuration', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });
});
