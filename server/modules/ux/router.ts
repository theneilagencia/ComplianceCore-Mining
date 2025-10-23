import { Router } from 'express';

const router = Router();

// Endpoint para receber relatórios de erros do frontend
router.post('/report', async (req, res) => {
  try {
    const { m: message, p: pathname, ...extra } = req.body;
    
    // Log do erro para monitoramento
    console.error('[UX ERROR REPORT]', {
      message,
      pathname,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ...extra
    });
    
    // Aqui você pode adicionar integração com serviços de monitoramento
    // como Sentry, LogRocket, etc.
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Error processing UX report:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

export default router;

