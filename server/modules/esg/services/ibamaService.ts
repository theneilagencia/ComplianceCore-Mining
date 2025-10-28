/**
 * IBAMA Integration Service
 * Fetches environmental licensing data from IBAMA (Brazilian environmental agency)
 */

import type { IBAMAData } from '../types';

/**
 * Fetch IBAMA environmental license data
 * 
 * Note: IBAMA doesn't have a public API, so this is a placeholder
 * In production, you would need to:
 * 1. Use web scraping (with permission)
 * 2. Partner with IBAMA for API access
 * 3. Use third-party data providers
 */
export async function fetchIBAMALicense(
  projectName: string,
  location?: { latitude: number; longitude: number }
): Promise<IBAMAData | null> {
  try {
    console.log(`[IBAMA] Fetching license data for ${projectName}...`);
    
    // TODO: Implement actual IBAMA API integration
    // For now, return mock data based on project characteristics
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data for demonstration
    const mockData: IBAMAData = {
      licenseNumber: `LO-${Math.floor(Math.random() * 100000)}/2024`,
      licenseType: 'LO', // Licença de Operação
      issueDate: '2024-01-15',
      expiryDate: '2029-01-15',
      status: 'active',
      conditions: [
        'Monitoramento trimestral da qualidade da água',
        'Relatório anual de emissões atmosféricas',
        'Programa de recuperação de áreas degradadas',
        'Compensação ambiental de 0.5% do investimento',
      ],
    };
    
    return mockData;
  } catch (error) {
    console.error('[IBAMA] Error fetching license data:', error);
    return null;
  }
}

/**
 * Validate IBAMA license status
 */
export function validateLicenseStatus(license: IBAMAData): {
  isValid: boolean;
  daysUntilExpiry: number;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (!license.expiryDate) {
    return {
      isValid: false,
      daysUntilExpiry: 0,
      warnings: ['License expiry date not found'],
    };
  }
  
  const expiryDate = new Date(license.expiryDate);
  const today = new Date();
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    warnings.push('⚠️ License expired');
  } else if (daysUntilExpiry < 180) {
    warnings.push(`⚠️ License expires in ${daysUntilExpiry} days - renewal required`);
  } else if (daysUntilExpiry < 365) {
    warnings.push(`License expires in ${daysUntilExpiry} days - consider renewal process`);
  }
  
  if (license.status !== 'active') {
    warnings.push(`⚠️ License status: ${license.status}`);
  }
  
  return {
    isValid: license.status === 'active' && daysUntilExpiry > 0,
    daysUntilExpiry,
    warnings,
  };
}

