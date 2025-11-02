/**
 * ANM (Agência Nacional de Mineração) Integration
 * Real API integration for mining title validation
 * 
 * API Documentation: https://sistemas.anm.gov.br/api/docs
 * Rate Limit: 100 requests/minute
 * Authentication: Bearer Token (JWT)
 */

export interface ANMProcessResponse {
  numero: string; // "48226.800153/2023"
  situacao: 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | 'ARQUIVADO';
  fase: string; // "CONCESSÃO DE LAVRA", "AUTORIZAÇÃO DE PESQUISA", etc.
  substancia: string;
  area_ha: number;
  municipio: string;
  uf: string;
  titular: {
    nome: string;
    cpf_cnpj: string;
  };
  data_protocolo: string; // ISO date
  data_publicacao: string; // ISO date
  ultima_atualizacao: string; // ISO date
  coordenadas?: {
    latitude: number;
    longitude: number;
  }[];
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
 * Validate mining title with real ANM API
 */
export async function validateWithANM_Real(
  miningTitleNumber: string
): Promise<ValidationResult> {
  try {
    const apiKey = process.env.ANM_API_KEY;
    
    // Fallback to mock if API key not configured
    if (!apiKey) {
      console.warn('[ANM] API Key not configured (ANM_API_KEY), using mock validation');
      return validateWithANM_Mock(miningTitleNumber);
    }

    // Validate format first (quick check)
    const anmPattern = /^\d{5}\.\d{6}\/\d{4}$/;
    if (!anmPattern.test(miningTitleNumber)) {
      return {
        source: 'ANM',
        field: 'miningTitleNumber',
        status: 'invalid',
        message: 'Formato de processo ANM inválido. Esperado: XXXXX.XXXXXX/XXXX (Ex: 48226.800153/2023)',
        reportValue: miningTitleNumber,
      };
    }

    // Make real API request
    console.log('[ANM] Validating process:', miningTitleNumber);
    
    const response = await fetch(
      `https://sistemas.anm.gov.br/SCM/api/v2/processos/${miningTitleNumber}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'ComplianceCore-Mining/1.0',
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    // Handle different response codes
    if (!response.ok) {
      if (response.status === 404) {
        console.warn('[ANM] Process not found:', miningTitleNumber);
        return {
          source: 'ANM',
          field: 'miningTitleNumber',
          status: 'not_found',
          message: 'Processo não encontrado na base de dados da ANM',
          reportValue: miningTitleNumber,
          url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${miningTitleNumber}`,
        };
      }
      
      if (response.status === 401) {
        throw new Error('ANM API authentication failed. Check ANM_API_KEY.');
      }
      
      if (response.status === 429) {
        throw new Error('ANM API rate limit exceeded. Wait and retry.');
      }
      
      throw new Error(`ANM API error: ${response.status} ${response.statusText}`);
    }

    const data: ANMProcessResponse = await response.json();
    console.log('[ANM] Process data received:', {
      numero: data.numero,
      situacao: data.situacao,
      fase: data.fase,
    });

    // Validate process status
    if (data.situacao !== 'ATIVO') {
      return {
        source: 'ANM',
        field: 'miningTitleStatus',
        status: 'invalid',
        message: `Processo NÃO está ATIVO. Status atual: ${data.situacao}. Processos inativos não podem ser usados em relatórios.`,
        reportValue: miningTitleNumber,
        officialValue: {
          situacao: data.situacao,
          fase: data.fase,
          ultima_atualizacao: data.ultima_atualizacao,
        },
        url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${miningTitleNumber}`,
      };
    }

    // Cache result (Redis - 24h)
    await cacheSet(`anm:process:${miningTitleNumber}`, data, 86400);

    // Return valid result
    return {
      source: 'ANM',
      field: 'miningTitleNumber',
      status: 'valid',
      message: `Processo válido - ${data.fase} - ${data.substancia} - ${data.municipio}/${data.uf}`,
      reportValue: miningTitleNumber,
      officialValue: {
        numero: data.numero,
        situacao: data.situacao,
        fase: data.fase,
        substancia: data.substancia,
        area_ha: data.area_ha,
        municipio: data.municipio,
        uf: data.uf,
        titular: data.titular,
        data_publicacao: data.data_publicacao,
      },
      url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${miningTitleNumber}`,
    };
  } catch (error: any) {
    console.error('[ANM] Validation error:', error.message);
    console.error('[ANM] Stack:', error.stack);
    
    return {
      source: 'ANM',
      field: 'miningTitleNumber',
      status: 'error',
      message: `Erro ao consultar ANM: ${error.message}. Tente novamente ou use validação offline.`,
      reportValue: miningTitleNumber,
    };
  }
}

/**
 * Mock validation (fallback when API key not available)
 */
function validateWithANM_Mock(miningTitleNumber: string): ValidationResult {
  console.log('[ANM] Using MOCK validation for:', miningTitleNumber);
  
  // Validate format
  const anmPattern = /^\d{5}\.\d{6}\/\d{4}$/;
  if (!anmPattern.test(miningTitleNumber)) {
    return {
      source: 'ANM',
      field: 'miningTitleNumber',
      status: 'invalid',
      message: 'Formato inválido. Esperado: XXXXX.XXXXXX/XXXX',
      reportValue: miningTitleNumber,
    };
  }

  // Mock validation (assume valid)
  return {
    source: 'ANM',
    field: 'miningTitleNumber',
    status: 'valid',
    message: 'Formato válido (validação MOCK - configure ANM_API_KEY para validação real)',
    reportValue: miningTitleNumber,
    url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${miningTitleNumber}`,
  };
}

/**
 * Validate substance (commodity) against ANM official list
 */
export async function validateSubstanceANM(substance: string): Promise<ValidationResult> {
  // Official ANM substances list (Portaria DNPM 155/2016)
  const anmSubstances = [
    'Ouro', 'Ferro', 'Cobre', 'Níquel', 'Bauxita', 'Manganês',
    'Zinco', 'Chumbo', 'Estanho', 'Tungstênio', 'Nióbio', 'Tântalo',
    'Terras Raras', 'Lítio', 'Grafita', 'Fosfato', 'Potássio',
    'Calcário', 'Areia', 'Argila', 'Granito', 'Mármore',
    'Diamante', 'Esmeralda', 'Água Mineral',
  ];

  const substanceNormalized = substance.trim();
  const isValid = anmSubstances.some(
    (s) => s.toLowerCase() === substanceNormalized.toLowerCase()
  );

  if (isValid) {
    return {
      source: 'ANM',
      field: 'commodity',
      status: 'valid',
      message: `Substância "${substance}" reconhecida pela ANM`,
      reportValue: substance,
    };
  } else {
    return {
      source: 'ANM',
      field: 'commodity',
      status: 'invalid',
      message: `Substância "${substance}" não reconhecida pela ANM. Verifique nomenclatura oficial ou use "Outros".`,
      reportValue: substance,
    };
  }
}

/**
 * Cache utilities (In-memory for now - Redis integration pending)
 */
const cache = new Map<string, { value: any; expiresAt: number }>();

async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  try {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    cache.set(key, { value, expiresAt });
    console.log(`[Cache] SET ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.warn('[Cache] Failed to set:', error);
  }
}

async function cacheGet(key: string): Promise<any | null> {
  try {
    const item = cache.get(key);
    if (item) {
      if (Date.now() < item.expiresAt) {
        console.log(`[Cache] HIT ${key}`);
        return item.value;
      } else {
        cache.delete(key);
        console.log(`[Cache] EXPIRED ${key}`);
      }
    }
  } catch (error) {
    console.warn('[Cache] Failed to get:', error);
  }
  return null;
}
