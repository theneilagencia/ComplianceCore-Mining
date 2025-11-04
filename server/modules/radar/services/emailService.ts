/**
 * Email Service usando SendGrid
 * Envia notificações por email para mudanças regulatórias
 * 
 * @module radar/emailService
 */

import nodemailer from 'nodemailer';
import type { RegulatoryUpdate } from './notifications';

interface EmailConfig {
  apiKey: string;
  from: string;
  fromName: string;
}

/**
 * Cria transporter do nodemailer configurado com SendGrid
 */
function createEmailTransporter(): nodemailer.Transporter | null {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('[Email] SENDGRID_API_KEY not configured');
    return null;
  }

  return nodemailer.createTransporter({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false, // TLS
    auth: {
      user: 'apikey',
      pass: apiKey,
    },
  });
}

/**
 * Formata HTML para email de notificação regulatória
 */
function formatEmailHTML(update: RegulatoryUpdate): string {
  const severityColors = {
    low: '#3B82F6', // blue
    medium: '#F59E0B', // amber
    high: '#EF4444', // red
    critical: '#DC2626', // dark red
  };

  const severityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  };

  const color = severityColors[update.severity];
  const severityLabel = severityLabels[update.severity];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova Atualização Regulatória</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #1e293b; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                🔔 Nova Atualização Regulatória
              </h1>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding: 20px 30px 10px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: ${color}; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                      Severidade: ${severityLabel}
                    </span>
                  </td>
                  <td align="right">
                    <span style="color: #6b7280; font-size: 14px;">
                      ${update.publishedAt.toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 30px;">
              <h2 style="margin: 0 0 15px; color: #1e293b; font-size: 20px; font-weight: 600;">
                ${update.title}
              </h2>
              
              <div style="background-color: #f9fafb; border-left: 4px solid ${color}; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                  <strong>Fonte:</strong> ${update.source} (${update.category})
                </p>
              </div>

              ${update.summary ? `
                <p style="margin: 0 0 20px; color: #4b5563; font-size: 15px; line-height: 1.6;">
                  ${update.summary}
                </p>
              ` : ''}

              ${update.tags && update.tags.length > 0 ? `
                <div style="margin-bottom: 20px;">
                  ${update.tags.map(tag => `
                    <span style="display: inline-block; background-color: #e5e7eb; color: #374151; padding: 4px 10px; border-radius: 4px; font-size: 12px; margin-right: 6px; margin-bottom: 6px;">
                      ${tag}
                    </span>
                  `).join('')}
                </div>
              ` : ''}

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-top: 20px;">
                    <a href="${update.url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 15px; font-weight: 600;">
                      Ver Detalhes Completos
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                Esta é uma notificação automática do <strong>QIVO Mining Radar Regulatório</strong>.<br>
                Para gerenciar suas preferências de notificação, acesse o painel de controle.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Formata texto plano para email (fallback)
 */
function formatEmailText(update: RegulatoryUpdate): string {
  const severityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    critical: 'Crítica',
  };

  return `
🔔 NOVA ATUALIZAÇÃO REGULATÓRIA

Título: ${update.title}
Fonte: ${update.source} (${update.category})
Severidade: ${severityLabels[update.severity]}
Data de Publicação: ${update.publishedAt.toLocaleDateString('pt-BR')}

${update.summary || 'Sem resumo disponível.'}

${update.tags && update.tags.length > 0 ? `Tags: ${update.tags.join(', ')}` : ''}

Ver detalhes completos: ${update.url}

---
Esta é uma notificação automática do QIVO Mining Radar Regulatório.
  `.trim();
}

/**
 * Envia email de notificação regulatória
 */
export async function sendEmailNotification(
  to: string,
  update: RegulatoryUpdate
): Promise<void> {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    throw new Error('Email transporter not configured');
  }

  const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@qivomining.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'QIVO Mining';

  const subject = `🔔 [${update.severity.toUpperCase()}] ${update.title}`;
  const html = formatEmailHTML(update);
  const text = formatEmailText(update);

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email] Notification sent to ${to}: ${info.messageId}`);
  } catch (error: any) {
    console.error(`[Email] Failed to send notification to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Envia email genérico (para formulário de contato, etc)
 */
export async function sendGenericEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<void> {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    throw new Error('Email transporter not configured');
  }

  const from = process.env.SENDGRID_FROM_EMAIL || 'noreply@qivomining.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'QIVO Mining';

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log(`[Email] Generic email sent to ${to}: ${info.messageId}`);
  } catch (error: any) {
    console.error(`[Email] Failed to send email to ${to}:`, error.message);
    throw error;
  }
}
