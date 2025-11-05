/**
 * Email Verification Service
 * Handles email verification for new user registrations
 */

import crypto from 'crypto';
import { db } from '../../db';
import { sendEmail } from '../../email';

interface VerificationToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

// In-memory storage for verification tokens (in production, use Redis or DB)
const verificationTokens = new Map<string, VerificationToken>();

/**
 * Generate verification token
 */
export function generateVerificationToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry
  
  verificationTokens.set(token, {
    token,
    userId,
    expiresAt,
  });
  
  return token;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #2f2c79 0%, #b96e48 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #2f2c79;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Bem-vindo ao QIVO Mining</h1>
      </div>
      <div class="content">
        <p>Olá ${name},</p>
        
        <p>Obrigado por se registrar na plataforma QIVO Mining. Para completar seu cadastro e ativar sua conta, por favor verifique seu endereço de email clicando no botão abaixo:</p>
        
        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">Verificar Email</a>
        </div>
        
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="background: white; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${verificationUrl}
        </p>
        
        <p><strong>Este link expira em 24 horas.</strong></p>
        
        <p>Se você não criou uma conta no QIVO Mining, por favor ignore este email.</p>
        
        <p>Atenciosamente,<br>Equipe QIVO Mining</p>
      </div>
      <div class="footer">
        <p>QIVO Mining - Plataforma de Conformidade para Mineração</p>
        <p>Este é um email automático, por favor não responda.</p>
      </div>
    </body>
    </html>
  `;
  
  await sendEmail({
    to: email,
    subject: 'Verifique seu email - QIVO Mining',
    html,
  });
  
  console.log(`[EmailVerification] Verification email sent to ${email}`);
}

/**
 * Verify email token
 */
export async function verifyEmailToken(token: string): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
}> {
  const verification = verificationTokens.get(token);
  
  if (!verification) {
    return {
      success: false,
      error: 'Token inválido ou expirado',
    };
  }
  
  // Check if token is expired
  if (new Date() > verification.expiresAt) {
    verificationTokens.delete(token);
    return {
      success: false,
      error: 'Token expirado. Por favor, solicite um novo email de verificação.',
    };
  }
  
  // Mark user as verified
  await db.users.update({
    where: { id: verification.userId },
    data: { emailVerified: true },
  });
  
  // Delete token after successful verification
  verificationTokens.delete(token);
  
  console.log(`[EmailVerification] Email verified for user ${verification.userId}`);
  
  return {
    success: true,
    userId: verification.userId,
  };
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await db.users.findUnique({
    where: { id: userId },
  });
  
  if (!user) {
    return {
      success: false,
      error: 'Usuário não encontrado',
    };
  }
  
  if (user.emailVerified) {
    return {
      success: false,
      error: 'Email já verificado',
    };
  }
  
  // Generate new token
  const token = generateVerificationToken(userId);
  
  // Send email
  await sendVerificationEmail(user.email, user.name, token);
  
  return {
    success: true,
  };
}

/**
 * Check if email is verified
 */
export async function isEmailVerified(userId: string): Promise<boolean> {
  const user = await db.users.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  
  return user?.emailVerified || false;
}

/**
 * Middleware to require email verification
 */
export async function requireEmailVerification(
  req: any,
  res: any,
  next: any
): Promise<void> {
  if (!req.user) {
    return res.status(401).json({
      error: 'Não autenticado',
    });
  }
  
  const verified = await isEmailVerified(req.user.id);
  
  if (!verified) {
    return res.status(403).json({
      error: 'Email não verificado',
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Por favor, verifique seu email antes de continuar.',
      resendUrl: '/api/auth/resend-verification',
    });
  }
  
  next();
}
