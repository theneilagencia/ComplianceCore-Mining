/**
 * IBAMA (Instituto Brasileiro do Meio Ambiente) Integration
 * Real API integration for environmental license validation
 * 
 * API: https://servicos.ibama.gov.br/licenciamento/api/v1/
 * Rate Limit: 50 requests/minute
 */

export interface IBAMALicenseResponse {
  numero: string; // "123456/2023"
  tipo: 'LP' | 'LI' | 'LO' | 'LA'; // Prévia, Instalação, Operação, Autorização
  status: 'ATIVO' | 'VENCIDO' | 'SUSPENSO' | 'CANCELADO';
  empreendimento: string;
  titular: {
    nome: string;
    cpf_cnpj: string;
  };
  atividade: string;
  municipio: string;
  uf: string;
  data_emissao: string;
  data_validade: string;
  condicoes: string[];
  area_ha?: number;
  coordenadas?: {
    latitude: number;
    longitude: number;
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
 * Validate environmental license with real IBAMA API
 */
export async function validateWithIBAMA_Real(
  licenseNumber: string
): Promise<ValidationResult> {
  try {
    // Validate format
    const ibamaPattern = /^\d{6}\/\d{4}$/;
    if (!ibamaPattern.test(licenseNumber)) {
      return {
        source: 'IBAMA',
        field: 'environmentalLicense',
        status: 'invalid',
        message: 'Formato de licença IBAMA inválido. Esperado: XXXXXX/XXXX (Ex: 123456/2023)',
        reportValue: licenseNumber,
      };
    }

    const apiKey = process.env.IBAMA_API_KEY;
    if (!apiKey) {
      console.warn('[IBAMA] API Key not configured, using mock validation');
      return validateWithIBAMA_Mock(licenseNumber);
    }

    console.log('[IBAMA] Validating license:', licenseNumber);

    const response = await fetch(
      `https://servicos.ibama.gov.br/licenciamento/api/v1/consulta?numero=${licenseNumber}`,
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
          source: 'IBAMA',
          field: 'environmentalLicense',
          status: 'not_found',
          message: 'Licença não encontrada no sistema IBAMA',
          reportValue: licenseNumber,
          url: 'https://servicos.ibama.gov.br/ctf/publico/licenciamento/consulta.php',
        };
      }
      throw new Error(`IBAMA API error: ${response.status}`);
    }

    const data: IBAMALicenseResponse = await response.json();
    console.log('[IBAMA] License data received:', { numero: data.numero, tipo: data.tipo, status: data.status });

    // Check if license is active
    if (data.status !== 'ATIVO') {
      return {
        source: 'IBAMA',
        field: 'environmentalLicenseStatus',
        status: 'invalid',
        message: `Licença NÃO está ATIVA. Status: ${data.status}`,
        reportValue: licenseNumber,
        officialValue: {
          status: data.status,
          tipo: data.tipo,
          data_validade: data.data_validade,
        },
        url: 'https://servicos.ibama.gov.br/ctf/publico/licenciamento/consulta.php',
      };
    }

    // Check if license is expired
    const validityDate = new Date(data.data_validade);
    if (validityDate < new Date()) {
      return {
        source: 'IBAMA',
        field: 'environmentalLicenseValidity',
        status: 'invalid',
        message: `Licença VENCIDA em ${data.data_validade}. Renove a licença antes de gerar o relatório.`,
        reportValue: licenseNumber,
        officialValue: {
          data_validade: data.data_validade,
          tipo: data.tipo,
        },
        url: 'https://servicos.ibama.gov.br/ctf/publico/licenciamento/consulta.php',
      };
    }

    // Validate license type (LA not acceptable for technical reports)
    if (data.tipo === 'LA') {
      return {
        source: 'IBAMA',
        field: 'environmentalLicenseType',
        status: 'invalid',
        message: 'Licença tipo LA (Autorização) não é válida para relatórios técnicos. Necessário LP, LI ou LO.',
        reportValue: licenseNumber,
        officialValue: { tipo: data.tipo },
        url: 'https://servicos.ibama.gov.br/ctf/publico/licenciamento/consulta.php',
      };
    }

    return {
      source: 'IBAMA',
      field: 'environmentalLicense',
      status: 'valid',
      message: `Licença ${data.tipo} válida até ${data.data_validade} - ${data.empreendimento}`,
      reportValue: licenseNumber,
      officialValue: {
        numero: data.numero,
        tipo: data.tipo,
        status: data.status,
        empreendimento: data.empreendimento,
        titular: data.titular,
        data_emissao: data.data_emissao,
        data_validade: data.data_validade,
        condicoes: data.condicoes,
      },
      url: 'https://servicos.ibama.gov.br/ctf/publico/licenciamento/consulta.php',
    };
  } catch (error: any) {
    console.error('[IBAMA] Validation error:', error.message);
    return {
      source: 'IBAMA',
      field: 'environmentalLicense',
      status: 'error',
      message: `Erro ao consultar IBAMA: ${error.message}`,
      reportValue: licenseNumber,
    };
  }
}

/**
 * Mock validation (fallback)
 */
function validateWithIBAMA_Mock(licenseNumber: string): ValidationResult {
  console.log('[IBAMA] Using MOCK validation');
  
  const ibamaPattern = /^\d{6}\/\d{4}$/;
  if (!ibamaPattern.test(licenseNumber)) {
    return {
      source: 'IBAMA',
      field: 'environmentalLicense',
      status: 'invalid',
      message: 'Formato inválido. Esperado: XXXXXX/XXXX',
      reportValue: licenseNumber,
    };
  }

  return {
    source: 'IBAMA',
    field: 'environmentalLicense',
    status: 'valid',
    message: 'Formato válido (MOCK - configure IBAMA_API_KEY para validação real)',
    reportValue: licenseNumber,
    url: 'https://servicos.ibama.gov.br/ctf/publico/licenciamento/consulta.php',
  };
}
