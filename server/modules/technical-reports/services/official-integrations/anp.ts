/**
 * ANP (Agência Nacional do Petróleo, Gás Natural e Biocombustíveis) Integration
 * Real API integration for oil & gas concession validation
 * 
 * API: https://dados.anp.gov.br/api/v1/
 * Rate Limit: 100 requests/minute
 */

export interface ANPConcessionResponse {
  bloco: string; // "BM-S-11"
  bacia: string; // "Santos"
  situacao: 'ATIVO' | 'ENCERRADO' | 'DEVOLVIDO';
  fase: 'EXPLORAÇÃO' | 'PRODUÇÃO' | 'DESENVOLVIMENTO';
  concessao_numero: string;
  operador: {
    nome: string;
    cnpj: string;
    participacao: number; // percentage
  };
  participantes: Array<{
    nome: string;
    cnpj: string;
    participacao: number;
  }>;
  data_inicio: string;
  data_termino: string;
  area_km2: number;
  laminaDagua_m?: number;
  producao?: {
    petroleo_bpd: number;
    gas_m3d: number;
  };
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
 * Validate oil & gas concession with real ANP API
 */
export async function validateWithANP_Real(
  concessionNumber: string
): Promise<ValidationResult> {
  try {
    // Validate format (block code pattern)
    const anpPattern = /^[A-Z]{2,3}-[A-Z]-\d{1,3}$/; // Ex: BM-S-11, ES-T-19
    if (!anpPattern.test(concessionNumber)) {
      return {
        source: 'ANP',
        field: 'concessionNumber',
        status: 'invalid',
        message: 'Formato de bloco ANP inválido. Esperado: XX-Y-ZZ (Ex: BM-S-11, ES-T-19)',
        reportValue: concessionNumber,
      };
    }

    const apiKey = process.env.ANP_API_KEY;
    if (!apiKey) {
      console.warn('[ANP] API Key not configured, using mock validation');
      return validateWithANP_Mock(concessionNumber);
    }

    console.log('[ANP] Validating concession:', concessionNumber);

    const response = await fetch(
      `https://dados.anp.gov.br/api/v1/blocos/${concessionNumber}`,
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
          source: 'ANP',
          field: 'concessionNumber',
          status: 'not_found',
          message: 'Bloco não encontrado na base de dados da ANP',
          reportValue: concessionNumber,
          url: 'https://www.gov.br/anp/pt-br/assuntos/exploracao-e-producao-de-oleo-e-gas/dados-tecnicos',
        };
      }
      throw new Error(`ANP API error: ${response.status}`);
    }

    const data: ANPConcessionResponse = await response.json();
    console.log('[ANP] Concession data received:', {
      bloco: data.bloco,
      situacao: data.situacao,
      fase: data.fase,
    });

    // Check if concession is active
    if (data.situacao !== 'ATIVO') {
      return {
        source: 'ANP',
        field: 'concessionStatus',
        status: 'invalid',
        message: `Bloco NÃO está ATIVO. Status: ${data.situacao}`,
        reportValue: concessionNumber,
        officialValue: {
          situacao: data.situacao,
          fase: data.fase,
          data_termino: data.data_termino,
        },
        url: 'https://www.gov.br/anp/pt-br/assuntos/exploracao-e-producao-de-oleo-e-gas/dados-tecnicos',
      };
    }

    // Check if concession is expired
    const endDate = new Date(data.data_termino);
    if (endDate < new Date()) {
      return {
        source: 'ANP',
        field: 'concessionValidity',
        status: 'invalid',
        message: `Concessão EXPIRADA em ${data.data_termino}`,
        reportValue: concessionNumber,
        officialValue: {
          data_termino: data.data_termino,
          situacao: data.situacao,
        },
        url: 'https://www.gov.br/anp/pt-br/assuntos/exploracao-e-producao-de-oleo-e-gas/dados-tecnicos',
      };
    }

    return {
      source: 'ANP',
      field: 'concessionNumber',
      status: 'valid',
      message: `Bloco ${data.fase} válido - Bacia ${data.bacia} - Operador: ${data.operador.nome}`,
      reportValue: concessionNumber,
      officialValue: {
        bloco: data.bloco,
        bacia: data.bacia,
        situacao: data.situacao,
        fase: data.fase,
        concessao_numero: data.concessao_numero,
        operador: data.operador,
        participantes: data.participantes,
        data_inicio: data.data_inicio,
        data_termino: data.data_termino,
        area_km2: data.area_km2,
        producao: data.producao,
      },
      url: 'https://www.gov.br/anp/pt-br/assuntos/exploracao-e-producao-de-oleo-e-gas/dados-tecnicos',
    };
  } catch (error: any) {
    console.error('[ANP] Validation error:', error.message);
    return {
      source: 'ANP',
      field: 'concessionNumber',
      status: 'error',
      message: `Erro ao consultar ANP: ${error.message}`,
      reportValue: concessionNumber,
    };
  }
}

/**
 * Mock validation (fallback)
 */
function validateWithANP_Mock(concessionNumber: string): ValidationResult {
  console.log('[ANP] Using MOCK validation');
  
  const anpPattern = /^[A-Z]{2,3}-[A-Z]-\d{1,3}$/;
  if (!anpPattern.test(concessionNumber)) {
    return {
      source: 'ANP',
      field: 'concessionNumber',
      status: 'invalid',
      message: 'Formato inválido. Esperado: XX-Y-ZZ',
      reportValue: concessionNumber,
    };
  }

  return {
    source: 'ANP',
    field: 'concessionNumber',
    status: 'valid',
    message: 'Formato válido (MOCK - configure ANP_API_KEY para validação real)',
    reportValue: concessionNumber,
    url: 'https://www.gov.br/anp/pt-br/assuntos/exploracao-e-producao-de-oleo-e-gas/dados-tecnicos',
  };
}
