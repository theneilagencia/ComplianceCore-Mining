import { Branding, BrandingCreationAttributes } from './model';
import { User } from '../users/model';
import { License } from '../licenses/model';

export class BrandingService {
  /**
   * Verifica se o usuário tem permissão para customizar marca
   * START: Não permitido
   * PRO: Permitido
   * ENTERPRISE: Permitido
   */
  static async canCustomizeBranding(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId, {
      include: [{ model: License, as: 'license' }],
    });

    if (!user || !user.license) {
      return false;
    }

    const plan = user.license.plan;
    return plan === 'PRO' || plan === 'ENTERPRISE';
  }

  /**
   * Obtém configurações de branding do usuário
   * Se não existir, retorna configurações padrão Qivo
   */
  static async getBranding(userId: string): Promise<Branding | null> {
    const branding = await Branding.findOne({ where: { userId } });
    
    if (!branding) {
      // Retornar configurações padrão Qivo
      return {
        id: 'default',
        userId,
        logo: '/assets/logo-Qivo.png',
        primaryColor: '#2f2c79',
        secondaryColor: '#b96e48',
        headerText: undefined,
        footerText: 'Powered by QIVO Mining - Regulatory Governance Infrastructure',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Branding;
    }

    return branding;
  }

  /**
   * Cria ou atualiza configurações de branding
   */
  static async upsertBranding(
    userId: string,
    data: Partial<BrandingCreationAttributes>
  ): Promise<Branding> {
    // Verificar permissão
    const canCustomize = await this.canCustomizeBranding(userId);
    if (!canCustomize) {
      throw new Error('Customização de marca disponível apenas para planos PRO e ENTERPRISE');
    }

    // Validar cores (formato #RRGGBB)
    if (data.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)) {
      throw new Error('Cor primária inválida. Use o formato #RRGGBB');
    }
    if (data.secondaryColor && !/^#[0-9A-Fa-f]{6}$/.test(data.secondaryColor)) {
      throw new Error('Cor secundária inválida. Use o formato #RRGGBB');
    }

    // Validar logo (URL ou base64)
    if (data.logo) {
      const isURL = /^https?:\/\/.+/.test(data.logo);
      const isBase64 = /^data:image\/(png|jpeg|jpg|svg\+xml);base64,.+/.test(data.logo);
      
      if (!isURL && !isBase64) {
        throw new Error('Logo deve ser uma URL válida ou imagem base64');
      }
    }

    // Upsert (create or update)
    const [branding] = await Branding.upsert({
      userId,
      ...data,
    });

    return branding;
  }

  /**
   * Remove configurações de branding (volta para padrão Qivo)
   */
  static async deleteBranding(userId: string): Promise<void> {
    await Branding.destroy({ where: { userId } });
  }

  /**
   * Aplica branding em dados de relatório
   */
  static async applyBrandingToReport(
    userId: string,
    reportData: any
  ): Promise<any> {
    const branding = await this.getBranding(userId);
    
    return {
      ...reportData,
      branding: {
        logo: branding?.logo || '/assets/logo-Qivo.png',
        primaryColor: branding?.primaryColor || '#2f2c79',
        secondaryColor: branding?.secondaryColor || '#b96e48',
        headerText: branding?.headerText,
        footerText: branding?.footerText || 'Powered by QIVO Mining - Regulatory Governance Infrastructure',
      },
    };
  }
}
