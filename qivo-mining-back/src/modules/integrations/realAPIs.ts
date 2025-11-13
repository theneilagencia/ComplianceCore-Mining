/**
 * Real APIs Integration - QIVO Mining
 * 
 * Features:
 * - IBAMA: licenças ambientais
 * - Copernicus: dados satelitais (NDVI, desmatamento)
 * - LME/COMEX: preços de commodities
 * - Auto-detect API keys or fallback to mock
 */

const IBAMA_API_KEY = process.env.IBAMA_API_KEY;
const COPERNICUS_API_KEY = process.env.COPERNICUS_API_KEY;
const LME_API_KEY = process.env.LME_API_KEY;
const COMEX_API_KEY = process.env.COMEX_API_KEY;

/**
 * IBAMA Service - Licenças Ambientais
 */
export async function getIBAMALicenses(params: {
  cnpj?: string;
  projectName?: string;
  state?: string;
}) {
  if (!IBAMA_API_KEY) {
    console.log('🔧 Mock: IBAMA API (no key)');
    return {
      licenses: [
        {
          id: 'LA-123456',
          type: 'Licença Prévia (LP)',
          status: 'Ativa',
          issueDate: '2023-01-15',
          expiryDate: '2025-01-15',
          projectName: params.projectName || 'Projeto Exemplo',
          state: params.state || 'MG',
          conditions: [
            'Monitoramento de qualidade da água',
            'Plano de recuperação de áreas degradadas',
            'Relatório semestral de atividades',
          ],
        },
        {
          id: 'LI-789012',
          type: 'Licença de Instalação (LI)',
          status: 'Em Análise',
          issueDate: '2024-06-01',
          expiryDate: '2026-06-01',
          projectName: params.projectName || 'Projeto Exemplo',
          state: params.state || 'MG',
          conditions: [
            'Implementação de sistema de tratamento de efluentes',
            'Compensação ambiental',
          ],
        },
      ],
      mock: true,
    };
  }

  try {
    // Real IBAMA API call
    const response = await fetch('https://api.ibama.gov.br/v1/licenses', {
      headers: {
        'Authorization': `Bearer ${IBAMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`IBAMA API error: ${response.status}`);
    }

    const data = await response.json();
    return { ...data, mock: false };
  } catch (error) {
    console.error('IBAMA API error:', error);
    // Fallback to mock
    return getIBAMALicenses(params);
  }
}

/**
 * Copernicus Service - Dados Satelitais
 */
export async function getCopernicusData(params: {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  dataType: 'ndvi' | 'deforestation' | 'land_cover';
}) {
  if (!COPERNICUS_API_KEY) {
    console.log('🔧 Mock: Copernicus API (no key)');
    
    const mockData: any = {
      latitude: params.latitude,
      longitude: params.longitude,
      startDate: params.startDate,
      endDate: params.endDate,
      dataType: params.dataType,
      mock: true,
    };

    if (params.dataType === 'ndvi') {
      mockData.ndviValues = [
        { date: '2024-01-01', value: 0.65 },
        { date: '2024-02-01', value: 0.68 },
        { date: '2024-03-01', value: 0.72 },
        { date: '2024-04-01', value: 0.70 },
        { date: '2024-05-01', value: 0.67 },
        { date: '2024-06-01', value: 0.63 },
      ];
      mockData.averageNDVI = 0.675;
    } else if (params.dataType === 'deforestation') {
      mockData.deforestation = {
        totalArea: 1250.5, // hectares
        alerts: [
          { date: '2024-03-15', area: 12.3, severity: 'medium' },
          { date: '2024-05-22', area: 8.7, severity: 'low' },
        ],
      };
    } else if (params.dataType === 'land_cover') {
      mockData.landCover = {
        forest: 65.2,
        agriculture: 18.5,
        mining: 8.3,
        water: 3.1,
        urban: 2.4,
        other: 2.5,
      };
    }

    return mockData;
  }

  try {
    // Real Copernicus API call
    const response = await fetch('https://api.copernicus.eu/v1/data', {
      headers: {
        'Authorization': `Bearer ${COPERNICUS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Copernicus API error: ${response.status}`);
    }

    const data = await response.json();
    return { ...data, mock: false };
  } catch (error) {
    console.error('Copernicus API error:', error);
    // Fallback to mock
    return getCopernicusData(params);
  }
}

/**
 * LME Service - London Metal Exchange Prices
 */
export async function getLMEPrices(metals: string[]) {
  if (!LME_API_KEY) {
    console.log('🔧 Mock: LME API (no key)');
    
    const mockPrices: Record<string, number> = {
      copper: 8450.50,
      aluminum: 2340.25,
      zinc: 2890.75,
      nickel: 16780.00,
      lead: 2150.30,
      tin: 25340.80,
    };

    return {
      prices: metals.map(metal => ({
        metal,
        price: mockPrices[metal.toLowerCase()] || 0,
        currency: 'USD',
        unit: 'per tonne',
        timestamp: new Date().toISOString(),
      })),
      mock: true,
    };
  }

  try {
    // Real LME API call
    const response = await fetch('https://api.lme.com/v1/prices', {
      headers: {
        'Authorization': `Bearer ${LME_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metals }),
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`LME API error: ${response.status}`);
    }

    const data = await response.json();
    return { ...data, mock: false };
  } catch (error) {
    console.error('LME API error:', error);
    // Fallback to mock
    return getLMEPrices(metals);
  }
}

/**
 * COMEX Service - Commodity Exchange Prices (Brasil)
 */
export async function getCOMEXPrices(commodities: string[]) {
  if (!COMEX_API_KEY) {
    console.log('🔧 Mock: COMEX API (no key)');
    
    const mockPrices: Record<string, number> = {
      iron_ore: 120.50,
      gold: 2050.75,
      silver: 24.30,
      manganese: 185.40,
      bauxite: 45.20,
    };

    return {
      prices: commodities.map(commodity => ({
        commodity,
        price: mockPrices[commodity.toLowerCase()] || 0,
        currency: 'USD',
        unit: 'per tonne',
        timestamp: new Date().toISOString(),
      })),
      mock: true,
    };
  }

  try {
    // Real COMEX API call
    const response = await fetch('https://api.comexbrasil.gov.br/v1/prices', {
      headers: {
        'Authorization': `Bearer ${COMEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ commodities }),
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`COMEX API error: ${response.status}`);
    }

    const data = await response.json();
    return { ...data, mock: false };
  } catch (error) {
    console.error('COMEX API error:', error);
    // Fallback to mock
    return getCOMEXPrices(commodities);
  }
}

/**
 * Get API status
 */
export function getAPIsStatus() {
  return {
    ibama: {
      enabled: !!IBAMA_API_KEY,
      mock: !IBAMA_API_KEY,
    },
    copernicus: {
      enabled: !!COPERNICUS_API_KEY,
      mock: !COPERNICUS_API_KEY,
    },
    lme: {
      enabled: !!LME_API_KEY,
      mock: !LME_API_KEY,
    },
    comex: {
      enabled: !!COMEX_API_KEY,
      mock: !COMEX_API_KEY,
    },
  };
}

