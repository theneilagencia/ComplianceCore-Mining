/**
 * Sistema de Notificações para Mudanças Regulatórias
 * 
 * Suporta webhooks para:
 * - Slack
 * - Microsoft Teams
 * - Discord
 * - Webhooks customizados
 * 
 * @module radar/notifications
 * @author QIVO Mining Platform
 * @date 01/11/2025
 */

import axios, { AxiosInstance } from 'axios';

// ==================== TIPOS E INTERFACES ====================

export interface RegulatoryUpdate {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: 'ANM' | 'DOU' | 'SIGMINE' | 'MapBiomas' | 'TSX' | 'ASX' | 'Other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  summary?: string;
  tags?: string[];
}

export interface NotificationChannel {
  type: 'slack' | 'teams' | 'discord' | 'webhook';
  webhookUrl: string;
  enabled: boolean;
  name: string;
}

export interface NotificationConfig {
  channels: NotificationChannel[];
  retryAttempts: number;
  retryDelay: number; // em ms
  timeout: number; // em ms
}

interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

interface TeamsMessage {
  '@type': string;
  '@context': string;
  summary: string;
  sections?: any[];
  potentialAction?: any[];
}

interface DiscordMessage {
  content?: string;
  embeds?: any[];
}

// ==================== CONFIGURAÇÃO ====================

const DEFAULT_CONFIG: NotificationConfig = {
  channels: [],
  retryAttempts: 3,
  retryDelay: 2000,
  timeout: 10000,
};

// Carregar configuração das variáveis de ambiente
function loadChannelsFromEnv(): NotificationChannel[] {
  const channels: NotificationChannel[] = [];

  // Slack
  if (process.env.SLACK_WEBHOOK_URL) {
    channels.push({
      type: 'slack',
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      enabled: process.env.SLACK_ENABLED !== 'false',
      name: process.env.SLACK_CHANNEL_NAME || 'Regulatory Updates',
    });
  }

  // Microsoft Teams
  if (process.env.TEAMS_WEBHOOK_URL) {
    channels.push({
      type: 'teams',
      webhookUrl: process.env.TEAMS_WEBHOOK_URL,
      enabled: process.env.TEAMS_ENABLED !== 'false',
      name: process.env.TEAMS_CHANNEL_NAME || 'Regulatory Updates',
    });
  }

  // Discord
  if (process.env.DISCORD_WEBHOOK_URL) {
    channels.push({
      type: 'discord',
      webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      enabled: process.env.DISCORD_ENABLED !== 'false',
      name: process.env.DISCORD_CHANNEL_NAME || 'Regulatory Updates',
    });
  }

  // Webhook customizado
  if (process.env.CUSTOM_WEBHOOK_URL) {
    channels.push({
      type: 'webhook',
      webhookUrl: process.env.CUSTOM_WEBHOOK_URL,
      enabled: process.env.CUSTOM_WEBHOOK_ENABLED !== 'false',
      name: process.env.CUSTOM_WEBHOOK_NAME || 'Custom Webhook',
    });
  }

  return channels;
}

// ==================== FORMATADORES DE MENSAGENS ====================

class MessageFormatter {
  /**
   * Formata mensagem para Slack
   */
  static formatSlackMessage(update: RegulatoryUpdate): SlackMessage {
    const severityEmoji = {
      low: ':information_source:',
      medium: ':warning:',
      high: ':exclamation:',
      critical: ':rotating_light:',
    };

    const categoryEmoji = {
      ANM: ':pick:',
      DOU: ':newspaper:',
      SIGMINE: ':bar_chart:',
      MapBiomas: ':world_map:',
      TSX: ':canada:',
      ASX: ':australia:',
      Other: ':globe_with_meridians:',
    };

    return {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${severityEmoji[update.severity]} Nova Atualização Regulatória`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Fonte:*\n${categoryEmoji[update.category]} ${update.source}`,
            },
            {
              type: 'mrkdwn',
              text: `*Severidade:*\n${update.severity.toUpperCase()}`,
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${update.title}*\n${update.summary || 'Sem resumo disponível'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Publicado em:* ${update.publishedAt.toLocaleDateString('pt-BR')}`,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Ver Detalhes',
              emoji: true,
            },
            url: update.url,
            action_id: 'view_details',
          },
        },
        ...(update.tags && update.tags.length > 0
          ? [
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Tags: ${update.tags.map(tag => `\`${tag}\``).join(' ')}`,
                  },
                ],
              },
            ]
          : []),
        {
          type: 'divider',
        },
      ],
    };
  }

  /**
   * Formata mensagem para Microsoft Teams
   */
  static formatTeamsMessage(update: RegulatoryUpdate): TeamsMessage {
    const severityColor = {
      low: '0078D4',
      medium: 'FFA500',
      high: 'FF4500',
      critical: 'DC143C',
    };

    return {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `Nova Atualização Regulatória: ${update.title}`,
      themeColor: severityColor[update.severity],
      sections: [
        {
          activityTitle: update.title,
          activitySubtitle: `${update.source} - ${update.publishedAt.toLocaleDateString('pt-BR')}`,
          facts: [
            {
              name: 'Categoria:',
              value: update.category,
            },
            {
              name: 'Severidade:',
              value: update.severity.toUpperCase(),
            },
            ...(update.tags
              ? [
                  {
                    name: 'Tags:',
                    value: update.tags.join(', '),
                  },
                ]
              : []),
          ],
          text: update.summary || 'Sem resumo disponível',
        },
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Ver Detalhes',
          targets: [
            {
              os: 'default',
              uri: update.url,
            },
          ],
        },
      ],
    };
  }

  /**
   * Formata mensagem para Discord
   */
  static formatDiscordMessage(update: RegulatoryUpdate): DiscordMessage {
    const severityColor = {
      low: 0x0078d4,
      medium: 0xffa500,
      high: 0xff4500,
      critical: 0xdc143c,
    };

    return {
      embeds: [
        {
          title: update.title,
          description: update.summary || 'Sem resumo disponível',
          url: update.url,
          color: severityColor[update.severity],
          fields: [
            {
              name: 'Fonte',
              value: update.source,
              inline: true,
            },
            {
              name: 'Categoria',
              value: update.category,
              inline: true,
            },
            {
              name: 'Severidade',
              value: update.severity.toUpperCase(),
              inline: true,
            },
            ...(update.tags && update.tags.length > 0
              ? [
                  {
                    name: 'Tags',
                    value: update.tags.join(', '),
                    inline: false,
                  },
                ]
              : []),
          ],
          timestamp: update.publishedAt.toISOString(),
          footer: {
            text: 'QIVO Mining Platform',
          },
        },
      ],
    };
  }

  /**
   * Formata mensagem para webhook customizado (JSON genérico)
   */
  static formatCustomMessage(update: RegulatoryUpdate): any {
    return {
      type: 'regulatory_update',
      timestamp: new Date().toISOString(),
      data: {
        id: update.id,
        title: update.title,
        source: update.source,
        url: update.url,
        publishedAt: update.publishedAt.toISOString(),
        category: update.category,
        severity: update.severity,
        summary: update.summary,
        tags: update.tags,
      },
    };
  }
}

// ==================== SERVIÇO DE NOTIFICAÇÕES ====================

export class NotificationService {
  private config: NotificationConfig;
  private httpClient: AxiosInstance;

  constructor(config?: Partial<NotificationConfig>) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      channels: loadChannelsFromEnv(),
    };

    this.httpClient = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Envia notificação para todos os canais configurados
   */
  async sendNotification(update: RegulatoryUpdate): Promise<void> {
    const enabledChannels = this.config.channels.filter(channel => channel.enabled);

    if (enabledChannels.length === 0) {
      console.warn('⚠️  Nenhum canal de notificação configurado');
      return;
    }

    console.log(`📢 Enviando notificação para ${enabledChannels.length} canal(is)...`);

    const results = await Promise.allSettled(
      enabledChannels.map(channel => this.sendToChannel(channel, update))
    );

    // Log resultados
    results.forEach((result, index) => {
      const channel = enabledChannels[index];
      if (result.status === 'fulfilled') {
        console.log(`  ✅ ${channel.type} (${channel.name}): Enviado com sucesso`);
      } else {
        console.error(`  ❌ ${channel.type} (${channel.name}): ${result.reason}`);
      }
    });
  }

  /**
   * Envia notificação para um canal específico com retry
   */
  private async sendToChannel(
    channel: NotificationChannel,
    update: RegulatoryUpdate
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const message = this.formatMessage(channel.type, update);
        
        await this.httpClient.post(channel.webhookUrl, message);
        
        return; // Sucesso
      } catch (error: any) {
        lastError = error;
        
        console.warn(
          `  ⚠️  Tentativa ${attempt}/${this.config.retryAttempts} falhou para ${channel.type}: ${error.message}`
        );

        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(
      `Falha ao enviar notificação após ${this.config.retryAttempts} tentativas: ${lastError?.message}`
    );
  }

  /**
   * Formata mensagem de acordo com o tipo de canal
   */
  private formatMessage(
    channelType: NotificationChannel['type'],
    update: RegulatoryUpdate
  ): any {
    switch (channelType) {
      case 'slack':
        return MessageFormatter.formatSlackMessage(update);
      case 'teams':
        return MessageFormatter.formatTeamsMessage(update);
      case 'discord':
        return MessageFormatter.formatDiscordMessage(update);
      case 'webhook':
        return MessageFormatter.formatCustomMessage(update);
      default:
        throw new Error(`Tipo de canal não suportado: ${channelType}`);
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Adiciona um canal de notificação dinamicamente
   */
  addChannel(channel: NotificationChannel): void {
    this.config.channels.push(channel);
  }

  /**
   * Remove um canal de notificação
   */
  removeChannel(webhookUrl: string): void {
    this.config.channels = this.config.channels.filter(
      channel => channel.webhookUrl !== webhookUrl
    );
  }

  /**
   * Lista todos os canais configurados
   */
  getChannels(): NotificationChannel[] {
    return this.config.channels;
  }

  /**
   * Testa conexão com todos os canais
   */
  async testAllChannels(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const channel of this.config.channels.filter(c => c.enabled)) {
      try {
        const testUpdate: RegulatoryUpdate = {
          id: 'test-' + Date.now(),
          title: '🧪 Teste de Notificação - QIVO Mining Platform',
          source: 'Sistema',
          url: 'https://qivo.mining.com',
          publishedAt: new Date(),
          category: 'Other',
          severity: 'low',
          summary: 'Esta é uma mensagem de teste do sistema de notificações.',
          tags: ['teste', 'sistema'],
        };

        await this.sendToChannel(channel, testUpdate);
        results.set(channel.name, true);
      } catch (error) {
        results.set(channel.name, false);
      }
    }

    return results;
  }
}

// ==================== INSTÂNCIA SINGLETON ====================

let notificationServiceInstance: NotificationService | null = null;

export function getNotificationService(): NotificationService {
  if (!notificationServiceInstance) {
    notificationServiceInstance = new NotificationService();
  }
  return notificationServiceInstance;
}

// ==================== HELPERS ====================

/**
 * Envia uma notificação rápida (usa instância singleton)
 */
export async function sendRegulatoryNotification(
  update: RegulatoryUpdate
): Promise<void> {
  const service = getNotificationService();
  await service.sendNotification(update);
}

/**
 * Testa todos os canais configurados
 */
export async function testNotificationChannels(): Promise<void> {
  const service = getNotificationService();
  const results = await service.testAllChannels();

  console.log('\n🧪 Resultados do Teste de Notificações:');
  console.log('━'.repeat(50));
  
  for (const [channelName, success] of results.entries()) {
    console.log(`${success ? '✅' : '❌'} ${channelName}`);
  }
  
  console.log('━'.repeat(50));
}
