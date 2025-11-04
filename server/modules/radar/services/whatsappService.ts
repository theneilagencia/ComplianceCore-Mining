/**
 * WhatsApp Service usando Twilio
 * Envia notificações por WhatsApp para mudanças regulatórias
 * 
 * @module radar/whatsappService
 */

import twilio from 'twilio';
import type { RegulatoryUpdate } from './notifications';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/**
 * Cria cliente Twilio
 */
function createTwilioClient(): ReturnType<typeof twilio> | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    console.warn('[WhatsApp] Twilio credentials not configured');
    return null;
  }

  return twilio(accountSid, authToken);
}

/**
 * Formata mensagem para WhatsApp (texto simples)
 * WhatsApp via Twilio suporta apenas texto, sem formatação rica
 */
function formatWhatsAppMessage(update: RegulatoryUpdate): string {
  const severityEmojis = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '❗',
    critical: '🚨',
  };

  const severityLabels = {
    low: 'BAIXA',
    medium: 'MÉDIA',
    high: 'ALTA',
    critical: 'CRÍTICA',
  };

  const emoji = severityEmojis[update.severity];
  const severityLabel = severityLabels[update.severity];

  let message = `${emoji} *NOVA ATUALIZAÇÃO REGULATÓRIA*\n\n`;
  message += `*Severidade:* ${severityLabel}\n`;
  message += `*Fonte:* ${update.source} (${update.category})\n`;
  message += `*Data:* ${update.publishedAt.toLocaleDateString('pt-BR')}\n\n`;
  message += `*${update.title}*\n\n`;
  
  if (update.summary) {
    message += `${update.summary}\n\n`;
  }

  if (update.tags && update.tags.length > 0) {
    message += `_Tags: ${update.tags.join(', ')}_\n\n`;
  }

  message += `🔗 Ver detalhes: ${update.url}\n\n`;
  message += `---\n`;
  message += `_QIVO Mining Radar Regulatório_`;

  return message;
}

/**
 * Envia notificação por WhatsApp
 * 
 * @param to - Número de telefone no formato E.164 (ex: +5511999999999)
 * @param update - Dados da atualização regulatória
 */
export async function sendWhatsAppNotification(
  to: string,
  update: RegulatoryUpdate
): Promise<void> {
  const client = createTwilioClient();
  
  if (!client) {
    throw new Error('Twilio client not configured');
  }

  // Número WhatsApp do Twilio (sandbox ou número aprovado)
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio Sandbox
  
  // Garantir que o número de destino tenha o prefixo whatsapp:
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  const message = formatWhatsAppMessage(update);

  try {
    const result = await client.messages.create({
      from,
      to: toNumber,
      body: message,
    });

    console.log(`[WhatsApp] Notification sent to ${to}: ${result.sid}`);
  } catch (error: any) {
    console.error(`[WhatsApp] Failed to send notification to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Envia mensagem genérica por WhatsApp
 * 
 * @param to - Número de telefone no formato E.164
 * @param message - Texto da mensagem
 */
export async function sendGenericWhatsApp(
  to: string,
  message: string
): Promise<void> {
  const client = createTwilioClient();
  
  if (!client) {
    throw new Error('Twilio client not configured');
  }

  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
  const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  try {
    const result = await client.messages.create({
      from,
      to: toNumber,
      body: message,
    });

    console.log(`[WhatsApp] Generic message sent to ${to}: ${result.sid}`);
  } catch (error: any) {
    console.error(`[WhatsApp] Failed to send message to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Valida formato de número de telefone E.164
 * 
 * @param phoneNumber - Número a validar
 * @returns true se válido
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // Remove prefixo whatsapp: se existir
  const number = phoneNumber.replace('whatsapp:', '');
  
  // Formato E.164: +[código país][número]
  // Exemplo: +5511999999999
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  
  return e164Regex.test(number);
}
