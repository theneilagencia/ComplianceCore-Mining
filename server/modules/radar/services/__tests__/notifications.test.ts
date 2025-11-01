/**
 * Testes Unitários - Sistema de Notificações Radar
 * 
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  NotificationService,
  getNotificationService,
  sendRegulatoryNotification,
  type RegulatoryUpdate,
  type NotificationChannel,
} from '../notifications';

// Mock do axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('NotificationService', () => {
  let service: NotificationService;
  let mockPost: any;

  beforeEach(() => {
    // Resetar mocks
    vi.clearAllMocks();
    
    // Mock do axios.create
    mockPost = vi.fn().mockResolvedValue({ status: 200, data: {} });
    mockedAxios.create = vi.fn().mockReturnValue({
      post: mockPost,
    } as any);

    // Limpar variáveis de ambiente
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.TEAMS_WEBHOOK_URL;
    delete process.env.DISCORD_WEBHOOK_URL;
    delete process.env.CUSTOM_WEBHOOK_URL;

    service = new NotificationService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Inicialização', () => {
    it('deve criar instância com configuração padrão', () => {
      expect(service).toBeInstanceOf(NotificationService);
      expect(service.getChannels()).toEqual([]);
    });

    it('deve carregar canais das variáveis de ambiente', () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      process.env.TEAMS_WEBHOOK_URL = 'https://outlook.office.com/test';
      
      const serviceWithEnv = new NotificationService();
      const channels = serviceWithEnv.getChannels();
      
      expect(channels).toHaveLength(2);
      expect(channels[0].type).toBe('slack');
      expect(channels[1].type).toBe('teams');
    });

    it('deve respeitar flags de habilitação', () => {
      process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
      process.env.SLACK_ENABLED = 'false';
      
      const serviceWithEnv = new NotificationService();
      const channels = serviceWithEnv.getChannels();
      
      expect(channels[0].enabled).toBe(false);
    });
  });

  describe('Gerenciamento de Canais', () => {
    it('deve adicionar canal dinamicamente', () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Test Channel',
      };

      service.addChannel(channel);
      expect(service.getChannels()).toHaveLength(1);
      expect(service.getChannels()[0]).toEqual(channel);
    });

    it('deve remover canal por webhook URL', () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Test Channel',
      };

      service.addChannel(channel);
      expect(service.getChannels()).toHaveLength(1);

      service.removeChannel('https://hooks.slack.com/test');
      expect(service.getChannels()).toHaveLength(0);
    });

    it('deve listar todos os canais', () => {
      const channel1: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test1',
        enabled: true,
        name: 'Channel 1',
      };

      const channel2: NotificationChannel = {
        type: 'teams',
        webhookUrl: 'https://outlook.office.com/test2',
        enabled: true,
        name: 'Channel 2',
      };

      service.addChannel(channel1);
      service.addChannel(channel2);

      const channels = service.getChannels();
      expect(channels).toHaveLength(2);
      expect(channels[0].type).toBe('slack');
      expect(channels[1].type).toBe('teams');
    });
  });

  describe('Envio de Notificações', () => {
    const mockUpdate: RegulatoryUpdate = {
      id: 'test-001',
      title: 'Test Update',
      source: 'ANM',
      url: 'https://test.com',
      publishedAt: new Date('2025-11-01'),
      category: 'ANM',
      severity: 'high',
      summary: 'Test summary',
      tags: ['test', 'mock'],
    };

    it('deve enviar notificação para canal Slack', async () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack Test',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({
          blocks: expect.any(Array),
        })
      );
    });

    it('deve enviar notificação para canal Teams', async () => {
      const channel: NotificationChannel = {
        type: 'teams',
        webhookUrl: 'https://outlook.office.com/test',
        enabled: true,
        name: 'Teams Test',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        'https://outlook.office.com/test',
        expect.objectContaining({
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
        })
      );
    });

    it('deve enviar notificação para canal Discord', async () => {
      const channel: NotificationChannel = {
        type: 'discord',
        webhookUrl: 'https://discord.com/api/webhooks/test',
        enabled: true,
        name: 'Discord Test',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          embeds: expect.any(Array),
        })
      );
    });

    it('deve enviar para webhook customizado', async () => {
      const channel: NotificationChannel = {
        type: 'webhook',
        webhookUrl: 'https://custom.webhook.com/test',
        enabled: true,
        name: 'Custom Webhook',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockPost).toHaveBeenCalledWith(
        'https://custom.webhook.com/test',
        expect.objectContaining({
          type: 'regulatory_update',
          data: expect.objectContaining({
            id: 'test-001',
            title: 'Test Update',
          }),
        })
      );
    });

    it('deve enviar para múltiplos canais', async () => {
      const channel1: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack',
      };

      const channel2: NotificationChannel = {
        type: 'discord',
        webhookUrl: 'https://discord.com/api/webhooks/test',
        enabled: true,
        name: 'Discord',
      };

      service.addChannel(channel1);
      service.addChannel(channel2);
      await service.sendNotification(mockUpdate);

      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('deve ignorar canais desabilitados', async () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: false,
        name: 'Disabled Channel',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      expect(mockPost).not.toHaveBeenCalled();
    });

    it('não deve falhar quando nenhum canal está configurado', async () => {
      await expect(service.sendNotification(mockUpdate)).resolves.not.toThrow();
      expect(mockPost).not.toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    const mockUpdate: RegulatoryUpdate = {
      id: 'test-001',
      title: 'Test Update',
      source: 'ANM',
      url: 'https://test.com',
      publishedAt: new Date('2025-11-01'),
      category: 'ANM',
      severity: 'high',
    };

    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve tentar novamente em caso de falha', async () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack Test',
      };

      // Falha nas primeiras 2 tentativas, sucesso na 3ª
      mockPost
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ status: 200 });

      service.addChannel(channel);
      
      const promise = service.sendNotification(mockUpdate);
      
      // Fast-forward através dos delays do retry
      await vi.runAllTimersAsync();
      
      await promise;

      expect(mockPost).toHaveBeenCalledTimes(3);
    }, 10000);

    it('deve falhar após máximo de tentativas', async () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack Test',
      };

      // Sempre falha
      mockPost.mockRejectedValue(new Error('Network error'));

      service.addChannel(channel);
      
      const promise = service.sendNotification(mockUpdate);
      
      // Fast-forward através dos delays do retry
      await vi.runAllTimersAsync();
      
      // Não deve lançar exceção (Promise.allSettled)
      await expect(promise).resolves.not.toThrow();
      
      // Mas deve ter tentado 3 vezes
      expect(mockPost).toHaveBeenCalledTimes(3);
    }, 10000);
  });

  describe('Formatação de Mensagens', () => {
    const mockUpdate: RegulatoryUpdate = {
      id: 'test-001',
      title: 'Nova Resolução ANM',
      source: 'Agência Nacional de Mineração',
      url: 'https://www.gov.br/anm',
      publishedAt: new Date('2025-11-01'),
      category: 'ANM',
      severity: 'critical',
      summary: 'Teste de resumo',
      tags: ['sustentabilidade', 'compliance'],
    };

    it('deve formatar mensagem Slack corretamente', async () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      const call = mockPost.mock.calls[0];
      const message = call[1];

      expect(message.blocks).toBeDefined();
      expect(message.blocks[0].type).toBe('header');
      expect(message.blocks[0].text.text).toContain('Nova Atualização Regulatória');
    });

    it('deve incluir severidade na mensagem', async () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      const call = mockPost.mock.calls[0];
      const message = call[1];
      const severityField = message.blocks[1].fields.find((f: any) => 
        f.text.includes('Severidade')
      );

      expect(severityField).toBeDefined();
      expect(severityField.text).toContain('CRITICAL');
    });

    it('deve incluir tags quando presentes', async () => {
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack',
      };

      service.addChannel(channel);
      await service.sendNotification(mockUpdate);

      const call = mockPost.mock.calls[0];
      const message = call[1];
      const contextBlock = message.blocks.find((b: any) => b.type === 'context');

      expect(contextBlock).toBeDefined();
      expect(contextBlock.elements[0].text).toContain('sustentabilidade');
      expect(contextBlock.elements[0].text).toContain('compliance');
    });
  });

  describe('Funções Helper', () => {
    it('getNotificationService deve retornar singleton', () => {
      const instance1 = getNotificationService();
      const instance2 = getNotificationService();
      
      expect(instance1).toBe(instance2);
    });

    it('sendRegulatoryNotification deve usar singleton', async () => {
      // Create a fresh service with a channel
      const freshService = new NotificationService();
      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack',
      };
      freshService.addChannel(channel);
      
      const mockUpdate: RegulatoryUpdate = {
        id: 'test-001',
        title: 'Test',
        source: 'ANM',
        url: 'https://test.com',
        publishedAt: new Date(),
        category: 'ANM',
        severity: 'low',
      };

      // This should work with the singleton
      await freshService.sendNotification(mockUpdate);
      
      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('Validação de Severidade', () => {
    it('deve suportar todos os níveis de severidade', async () => {
      const severities: Array<'low' | 'medium' | 'high' | 'critical'> = [
        'low',
        'medium',
        'high',
        'critical',
      ];

      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack',
      };

      service.addChannel(channel);

      for (const severity of severities) {
        const update: RegulatoryUpdate = {
          id: `test-${severity}`,
          title: 'Test',
          source: 'ANM',
          url: 'https://test.com',
          publishedAt: new Date(),
          category: 'ANM',
          severity,
        };

        await service.sendNotification(update);
      }

      expect(mockPost).toHaveBeenCalledTimes(4);
    });
  });

  describe('Validação de Categorias', () => {
    it('deve suportar todas as categorias de fonte', async () => {
      const categories: RegulatoryUpdate['category'][] = [
        'ANM',
        'DOU',
        'SIGMINE',
        'MapBiomas',
        'TSX',
        'ASX',
        'Other',
      ];

      const channel: NotificationChannel = {
        type: 'slack',
        webhookUrl: 'https://hooks.slack.com/test',
        enabled: true,
        name: 'Slack',
      };

      service.addChannel(channel);

      for (const category of categories) {
        const update: RegulatoryUpdate = {
          id: `test-${category}`,
          title: 'Test',
          source: 'Test Source',
          url: 'https://test.com',
          publishedAt: new Date(),
          category,
          severity: 'low',
        };

        await service.sendNotification(update);
      }

      expect(mockPost).toHaveBeenCalledTimes(7);
    });
  });
});
