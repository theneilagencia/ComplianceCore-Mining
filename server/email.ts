/**
 * Email Service
 * Handles email sending via SMTP or email service provider
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter
let transporter: nodemailer.Transporter;

/**
 * Initialize email transporter
 */
function initTransporter() {
  if (transporter) return transporter;
  
  // Check if using external email service (e.g., SendGrid, Mailgun)
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  } else if (process.env.EMAIL_SERVICE === 'mailgun') {
    transporter = nodemailer.createTransport({
      host: 'smtp.mailgun.org',
      port: 587,
      auth: {
        user: process.env.MAILGUN_SMTP_USER,
        pass: process.env.MAILGUN_SMTP_PASSWORD,
      },
    });
  } else if (process.env.SMTP_HOST) {
    // Custom SMTP server
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Development mode - use ethereal.email
    console.warn('[Email] No email service configured, using ethereal.email for development');
    
    // This will be replaced with actual credentials in production
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER || 'test@ethereal.email',
        pass: process.env.ETHEREAL_PASSWORD || 'test',
      },
    });
  }
  
  return transporter;
}

/**
 * Send email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const transport = initTransporter();
  
  try {
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || 'QIVO Mining <noreply@qivomining.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html),
    });
    
    console.log('[Email] Message sent:', info.messageId);
    
    // Log preview URL in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email] Preview URL:', nodemailer.getTestMessageUrl(info));
    }
  } catch (error: any) {
    console.error('[Email] Failed to send email:', error.message);
    throw new Error('Failed to send email');
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  const transport = initTransporter();
  
  try {
    await transport.verify();
    console.log('[Email] Email service is ready');
    return true;
  } catch (error: any) {
    console.error('[Email] Email service verification failed:', error.message);
    return false;
  }
}
