/**
 * CPRM (Serviço Geológico do Brasil) Integration
 * Real API integration for geological data validation
 * 
 * API: https://geosgb.cprm.gov.br/api/v2
 * Rate Limit: 60 requests/minute
 */

import { metrics } from '../../../monitoring/metrics';

export interface ValidationResult {
  latitude: number;
  longitude: number;
  formacao_geologica: string;
  idade_geologica: string; // "Paleozoico", "Mesozoico", etc.
  litologia: string; // "Granito", "Gnaisse", "Xisto", etc.
  mineralizacao: string[];
  provincia_mineral?: string;
  distrito_mineral?: string;
  fonte: string;
}

export interface ValidationResult {
  source: 'ANM' | 'CPRM' | 'IBAMA' | 'ANP';
  field: string;
  status: 'valid' | 'invalid' | 'not_found' | 'error';
  message: string;
  officialValue?: any;
  reportValue?: any;
  url?: string;
}

/**
 * Validate geological formation with real CPRM API
 */
export async function validateWithCPRM_Real(
  latitude: number,
  longitude: number,
  formation?: string
): Promise<ValidationResult> {
  try {
    // Validate coordinates first
    if (latitude < -33.75 || latitude > 5.27 || longitude < -73.99 || longitude > -28.84) {
      return {
        source: 'CPRM',
        field: 'coordinates',
        status: 'invalid',
        message: 'Coordenadas fora dos limites do território brasileiro',
        reportValue: { latitude, longitude },
      };
    }

    // Check for API key
    const apiKey = process.env.CPRM_API_KEY;
    if (!apiKey) {
      console.warn('[CPRM] API Key not configured, using mock validation');
      return validateWithCPRM_Mock(latitude, longitude, formation);
    }

    console.log('[CPRM] Validating geology at:', { latitude, longitude });

    const response = await fetch(
      `https://geosgb.cprm.gov.br/api/v1/geology?lat=${latitude}&lon=${longitude}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          source: 'CPRM',
          field: 'geologicalFormation',
          status: 'not_found',
          message: 'Dados geológicos não disponíveis para esta localização no banco CPRM',
          reportValue: { latitude, longitude, formation },
          url: 'https://geosgb.cprm.gov.br/',
        };
      }
      throw new Error(`CPRM API error: ${response.status}`);
    }

    const data: CPRMGeologyResponse = await response.json();
    console.log('[CPRM] Geology data received:', data.formacao_geologica);

    // Compare with report data if provided
    if (formation) {
      const formationMatch = data.formacao_geologica.toLowerCase().includes(formation.toLowerCase());
      if (!formationMatch) {
        return {
          source: 'CPRM',
          field: 'geologicalFormation',
          status: 'invalid',
          message: `Formação geológica divergente. CPRM: "${data.formacao_geologica}", Relatório: "${formation}"`,
          reportValue: formation,
          officialValue: data.formacao_geologica,
          url: 'https://geosgb.cprm.gov.br/',
        };
      }
    }

    return {
      source: 'CPRM',
      field: 'geologicalFormation',
      status: 'valid',
      message: `Dados geológicos validados - ${data.formacao_geologica} (${data.idade_geologica})`,
      reportValue: formation,
      officialValue: {
        formacao: data.formacao_geologica,
        idade: data.idade_geologica,
        litologia: data.litologia,
        mineralizacao: data.mineralizacao,
        provincia_mineral: data.provincia_mineral,
      },
      url: 'https://geosgb.cprm.gov.br/',
    };
  } catch (error: any) {
    console.error('[CPRM] Validation error:', error.message);
    return {
      source: 'CPRM',
      field: 'geologicalFormation',
      status: 'error',
      message: `Erro ao consultar CPRM: ${error.message}`,
      reportValue: { latitude, longitude, formation },
    };
  }
}

/**
 * Mock validation (fallback)
 */
function validateWithCPRM_Mock(
  latitude: number,
  longitude: number,
  formation?: string
): ValidationResult {
  console.log('[CPRM] Using MOCK validation');
  
  // Basic coordinate validation
  if (latitude < -33.75 || latitude > 5.27 || longitude < -73.99 || longitude > -28.84) {
    return {
      source: 'CPRM',
      field: 'coordinates',
      status: 'invalid',
      message: 'Coordenadas fora dos limites do Brasil',
      reportValue: { latitude, longitude },
    };
  }

  return {
    source: 'CPRM',
    field: 'geologicalFormation',
    status: 'valid',
    message: 'Coordenadas válidas (MOCK - configure CPRM_API_KEY para validação real)',
    reportValue: { latitude, longitude, formation },
    url: 'https://geosgb.cprm.gov.br/',
  };
}
