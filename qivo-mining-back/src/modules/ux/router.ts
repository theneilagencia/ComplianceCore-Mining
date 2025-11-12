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

// Endpoint para logging genérico de eventos UX
router.post('/log', async (req, res) => {
  try {
    const { level = 'info', message, context, ...extra } = req.body;
    
    const logEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'],
      ...extra
    };
    
    // Log baseado no nível
    switch (level) {
      case 'error':
        console.error('[UX LOG ERROR]', logEntry);
        break;
      case 'warn':
        console.warn('[UX LOG WARN]', logEntry);
        break;
      case 'info':
      default:
        console.log('[UX LOG INFO]', logEntry);
        break;
    }
    
    res.json({ ok: true, logged: true });
  } catch (error) {
    console.error('Error processing UX log:', error);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

export default router;

