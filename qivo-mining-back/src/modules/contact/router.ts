import express from 'express';

const router = express.Router();

// POST /api/contact - Send contact form email
router.post('/', async (req, res) => {
  try {
    const { nome, email, empresa, mensagem } = req.body;
    
    if (!nome || !email || !mensagem) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Nome, email e mensagem são obrigatórios'
      });
    }
    
    // Implement email sending logic
    console.log('Contact form submission:', {
      nome,
      email,
      empresa,
      mensagem,
      timestamp: new Date().toISOString()
    });
    
    try {
      const { sendGenericEmail } = await import('../radar/services/emailService');
      
      const supportEmail = process.env.SUPPORT_EMAIL || 'vinicius@qivomining.com';
      const subject = `📧 Novo Contato: ${nome}`;
      
      const text = `
Novo contato recebido através do formulário do site:

Nome: ${nome}
Email: ${email}
Empresa: ${empresa || 'N/A'}

Mensagem:
${mensagem}

---
Recebido em: ${new Date().toLocaleString('pt-BR')}
      `;
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">📧 Novo Contato Recebido</h2>
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Nome:</strong> ${nome}</p>
      <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p style="margin: 5px 0;"><strong>Empresa:</strong> ${empresa || 'N/A'}</p>
    </div>
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0 0 10px;"><strong>Mensagem:</strong></p>
      <p style="margin: 0; white-space: pre-wrap;">${mensagem}</p>
    </div>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #6b7280;">Recebido em: ${new Date().toLocaleString('pt-BR')}</p>
  </div>
</body>
</html>
      `;
      
      await sendGenericEmail(supportEmail, subject, text, html);
      console.log(`[Contact] Email sent to ${supportEmail}`);
    } catch (emailError: any) {
      console.error('[Contact] Failed to send email:', emailError.message);
      // Don't fail the request if email fails, just log it
    }
    
    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso!'
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao processar formulário de contato'
    });
  }
});

export default router;
