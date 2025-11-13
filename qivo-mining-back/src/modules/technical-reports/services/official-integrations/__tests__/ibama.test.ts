/**
 * IBAMA Integration Tests
 * Tests for Instituto Brasileiro do Meio Ambiente API validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateWithIBAMA_Real } from '../ibama';

describe('IBAMA Integration', () => {
  beforeEach(() => {
    delete process.env.IBAMA_API_KEY;
    vi.clearAllMocks();
  });

  describe('validateWithIBAMA_Real - Format Validation', () => {
    it('should reject invalid format', async () => {
      const result = await validateWithIBAMA_Real('invalid');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('Formato de licença IBAMA inválido');
    });

    it('should accept valid format XXXXXX/XXXX', async () => {
      const result = await validateWithIBAMA_Real('123456/2023');

      expect(['valid', 'error', 'not_found']).toContain(result.status);
    });

    it('should reject format without slash', async () => {
      const result = await validateWithIBAMA_Real('1234562023');

      expect(result.status).toBe('invalid');
    });

    it('should reject format with wrong year length', async () => {
      const result = await validateWithIBAMA_Real('123456/23');

      expect(result.status).toBe('invalid');
    });
  });

  describe('validateWithIBAMA_Real - Mock Fallback', () => {
    it('should use mock validation when API key not configured', async () => {
      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.message).toContain('MOCK');
    });
  });

  describe('validateWithIBAMA_Real - API Integration', () => {
    beforeEach(() => {
      process.env.IBAMA_API_KEY = 'test-api-key';
    });

    it('should validate ATIVO license', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LI',
          status: 'ATIVO',
          empreendimento: 'Mina de Ouro XYZ',
          titular: {
            nome: 'Mineradora XYZ Ltda',
            cpf_cnpj: '12.345.678/0001-99',
          },
          data_emissao: '2023-01-15',
          data_validade: '2025-12-31',
          condicoes: ['Monitoramento trimestral'],
        }),
      });

      global.fetch = mockFetch as any;

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('valid');
      expect(result.officialValue?.tipo).toBe('LI');
    });

    it('should reject VENCIDO license', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LO',
          status: 'VENCIDO',
          data_validade: '2022-12-31',
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('NÃO está ATIVA');
    });

    it('should reject SUSPENSO license', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LP',
          status: 'SUSPENSO',
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('SUSPENSO');
    });

    it('should reject CANCELADO license', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LI',
          status: 'CANCELADO',
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('invalid');
    });

    it('should check expiration date', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LO',
          status: 'ATIVO',
          data_validade: pastDate.toISOString().split('T')[0],
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('VENCIDA');
    });

    it('should reject LA (Autorização) license type', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LA',
          status: 'ATIVO',
          data_validade: '2025-12-31',
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('invalid');
      expect(result.message).toContain('LA (Autorização) não é válida');
    });

    it('should accept LP (Prévia)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LP',
          status: 'ATIVO',
          data_validade: '2025-12-31',
          empreendimento: 'Projeto Mineração',
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('valid');
    });

    it('should accept LI (Instalação)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LI',
          status: 'ATIVO',
          data_validade: '2025-12-31',
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('valid');
    });

    it('should accept LO (Operação)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          numero: '123456/2023',
          tipo: 'LO',
          status: 'ATIVO',
          data_validade: '2025-12-31',
        }),
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('valid');
    });

    it('should handle 404 not found', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('not_found');
      expect(result.message).toContain('não encontrada');
    });
  });

  describe('Response Format', () => {
    it('should include IBAMA consultation URL', async () => {
      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.url).toContain('servicos.ibama.gov.br');
      expect(result.url).toContain('licenciamento');
    });

    it('should set source as IBAMA', async () => {
      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.source).toBe('IBAMA');
    });

    it('should include license number in response', async () => {
      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.reportValue).toBe('123456/2023');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      process.env.IBAMA_API_KEY = 'test-api-key';
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('error');
      expect(result.message).toContain('Erro ao consultar IBAMA');
    });

    it('should handle timeout', async () => {
      process.env.IBAMA_API_KEY = 'test-api-key';
      global.fetch = vi.fn().mockRejectedValue(new Error('timeout exceeded'));

      const result = await validateWithIBAMA_Real('123456/2023');

      expect(result.status).toBe('error');
    });
  });
});
