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
    
    // TODO: Implement email sending logic
    // For now, just log and return success
    console.log('Contact form submission:', {
      nome,
      email,
      empresa,
      mensagem,
      timestamp: new Date().toISOString()
    });
    
    // In production, you would send an email here using nodemailer or similar
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({
    //   to: 'vinicius@qivomining.com',
    //   subject: `Novo contato: ${nome}`,
    //   text: `Nome: ${nome}\nEmail: ${email}\nEmpresa: ${empresa || 'N/A'}\n\nMensagem:\n${mensagem}`
    // });
    
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
