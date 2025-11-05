import { Router, Request, Response } from 'express';
import { BrandingService } from './service';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

/**
 * GET /api/branding
 * Obtém configurações de branding do usuário autenticado
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const branding = await BrandingService.getBranding(userId);
    
    // Verificar se usuário pode customizar
    const canCustomize = await BrandingService.canCustomizeBranding(userId);

    res.json({
      branding,
      canCustomize,
    });
  } catch (error: any) {
    console.error('Error getting branding:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar configurações de marca' });
  }
});

/**
 * POST /api/branding
 * Cria ou atualiza configurações de branding
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const { logo, primaryColor, secondaryColor, headerText, footerText } = req.body;

    const branding = await BrandingService.upsertBranding(userId, {
      logo,
      primaryColor,
      secondaryColor,
      headerText,
      footerText,
    });

    res.json({
      message: 'Configurações de marca salvas com sucesso',
      branding,
    });
  } catch (error: any) {
    console.error('Error upserting branding:', error);
    
    if (error.message.includes('disponível apenas para planos')) {
      return res.status(403).json({ error: error.message });
    }
    
    res.status(400).json({ error: error.message || 'Erro ao salvar configurações de marca' });
  }
});

/**
 * DELETE /api/branding
 * Remove configurações de branding (volta para padrão Qivo)
 */
router.delete('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    await BrandingService.deleteBranding(userId);

    res.json({
      message: 'Configurações de marca removidas. Voltando para padrão Qivo.',
    });
  } catch (error: any) {
    console.error('Error deleting branding:', error);
    res.status(500).json({ error: error.message || 'Erro ao remover configurações de marca' });
  }
});

export default router;
