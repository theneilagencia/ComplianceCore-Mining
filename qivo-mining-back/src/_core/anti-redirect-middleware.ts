import { Request, Response, NextFunction } from 'express';

/**
 * Middleware anti-redirect
 * 
 * Previne qualquer tentativa de redirect para o Vercel ou outras URLs externas.
 * Força o servidor a sempre servir o conteúdo localmente.
 */
export function antiRedirectMiddleware(req: Request, res: Response, next: NextFunction) {
  // Sobrescrever métodos de redirect para bloquear redirects
  const originalRedirect = res.redirect.bind(res);
  
  res.redirect = function(statusOrUrl: number | string, url?: string) {
    const targetUrl = typeof statusOrUrl === 'string' ? statusOrUrl : url;
    
    // Se tentar redirecionar para Vercel, bloquear
    if (targetUrl && (targetUrl.includes('vercel.app') || targetUrl.includes('vercel.com'))) {
      console.warn(`[ANTI-REDIRECT] Blocked redirect to: ${targetUrl}`);
      // Em vez de redirecionar, servir a página normalmente
      return next();
    }
    
    // Permitir redirects internos (OAuth, etc)
    return originalRedirect(statusOrUrl as any, url as any);
  };
  
  // Adicionar header para prevenir redirects no nível do proxy
  res.setHeader('X-Render-No-Redirect', 'true');
  
  next();
}

