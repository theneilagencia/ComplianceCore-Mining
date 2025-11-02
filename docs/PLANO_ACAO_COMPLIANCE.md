# PLANO DE AÇÃO: CORREÇÃO DO MÓDULO DE RELATÓRIOS
**Prioridade:** 🔴 CRÍTICA  
**Prazo:** Sprint 6 (2 semanas)  
**Data início:** 2 de novembro de 2025

---

## 🎯 OBJETIVO

Tornar o módulo de geração de relatórios **100% compliant** com:
1. ✅ Padrões internacionais CRIRSCO (JORC, NI 43-101, PERC, SAMREC)
2. ❌ SEC S-K 1300 (EUA) - **IMPLEMENTAR**
3. ❌ Equivalências nacionais (ANM, ANP, CPRM, IBAMA) - **INTEGRAR**
4. ✅ Upload de arquivos - **CORRIGIDO**

---

## 📋 TAREFAS PRIORITÁRIAS

### FASE 1: SEC S-K 1300 (5 dias) 🔴 CRÍTICO

#### Tarefa 1.1: Adicionar SEC ao Schema do Banco
**Prazo:** Dia 1  
**Responsável:** Backend  
**Complexidade:** BAIXA

```sql
-- Migration: Add SEC_SK_1300 to standard enum
ALTER TYPE standard ADD VALUE 'SEC_SK_1300' AFTER 'CBRR';
```

```typescript
// drizzle/schema.ts
export const standardEnum = pgEnum('standard', [
  'JORC_2012', 
  'NI_43_101', 
  'PERC', 
  'SAMREC', 
  'CRIRSCO', 
  'CBRR',
  'SEC_SK_1300' // ✅ NOVO
]);
```

**Validação:**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

---

#### Tarefa 1.2: Criar Schema SEC S-K 1300
**Prazo:** Dias 2-3  
**Responsável:** Compliance + Backend  
**Complexidade:** ALTA

**Arquivo:** `client/src/modules/technical-reports/schemas/sec-sk-1300-schema.ts`

```typescript
/**
 * SEC S-K 1300 Schema
 * Securities and Exchange Commission - Regulation S-K Item 1300
 * Mining Property Disclosure Requirements
 */

export const SEC_SK_1300_SCHEMA: StandardSchema = {
  code: 'SEC_SK_1300',
  name: 'SEC S-K 1300',
  description: 'U.S. Securities and Exchange Commission Mining Property Disclosure',
  sections: [
    {
      title: 'Item 1301 - Property Description and Location',
      description: 'Description and location of the registrant\'s material properties',
      fields: [
        {
          name: 'propertyName',
          label: 'Property Name',
          type: 'text',
          required: true,
          placeholder: 'Ex: Copper Mountain Mine',
          helpText: 'Official name of the mining property',
        },
        {
          name: 'propertyLocation',
          label: 'Property Location',
          type: 'text',
          required: true,
          placeholder: 'Ex: British Columbia, Canada',
          helpText: 'Geographic location with coordinates',
        },
        {
          name: 'propertySize',
          label: 'Property Size (acres)',
          type: 'number',
          required: true,
          helpText: 'Total property area in acres',
        },
        {
          name: 'accessDescription',
          label: 'Access and Infrastructure',
          type: 'textarea',
          required: true,
          helpText: 'Description of access routes, power, water, and infrastructure',
        },
        {
          name: 'climate',
          label: 'Climate and Operating Season',
          type: 'textarea',
          required: true,
          helpText: 'Describe climate conditions and impact on operations',
        },
      ],
    },
    {
      title: 'Item 1302 - Property Ownership',
      description: 'Information about property ownership and agreements',
      fields: [
        {
          name: 'ownershipType',
          label: 'Ownership Type',
          type: 'select',
          required: true,
          options: [
            { value: 'fee_simple', label: 'Fee Simple' },
            { value: 'leasehold', label: 'Leasehold' },
            { value: 'concession', label: 'Concession' },
            { value: 'patented_claim', label: 'Patented Mining Claim' },
            { value: 'unpatented_claim', label: 'Unpatented Mining Claim' },
          ],
        },
        {
          name: 'ownershipDetails',
          label: 'Ownership Details',
          type: 'textarea',
          required: true,
          helpText: 'Describe ownership structure, agreements, and terms',
        },
        {
          name: 'royalties',
          label: 'Royalties and Encumbrances',
          type: 'textarea',
          required: true,
          helpText: 'List all royalties, liens, and encumbrances',
        },
        {
          name: 'permitsRequired',
          label: 'Required Permits',
          type: 'textarea',
          required: true,
          helpText: 'List all required permits and their status',
        },
      ],
    },
    {
      title: 'Item 1303 - Material Agreements',
      description: 'Agreements affecting the property rights',
      fields: [
        {
          name: 'agreementsList',
          label: 'Material Agreements',
          type: 'textarea',
          required: false,
          helpText: 'List all material agreements (earn-in, joint venture, etc.)',
        },
        {
          name: 'agreementTerms',
          label: 'Agreement Terms',
          type: 'textarea',
          required: false,
          helpText: 'Summarize key terms and conditions',
        },
      ],
    },
    {
      title: 'Item 1304 - Exploration History',
      description: 'Historical and recent exploration activities',
      fields: [
        {
          name: 'historicalExploration',
          label: 'Historical Exploration',
          type: 'textarea',
          required: true,
          helpText: 'Summary of historical exploration activities',
        },
        {
          name: 'recentExploration',
          label: 'Recent Exploration (Last 5 Years)',
          type: 'textarea',
          required: true,
          helpText: 'Detailed description of recent exploration work',
        },
        {
          name: 'explorationBudget',
          label: 'Exploration Budget ($)',
          type: 'number',
          required: false,
          helpText: 'Estimated or actual exploration expenditure',
        },
      ],
    },
    {
      title: 'Item 1305 - Environmental Considerations',
      description: 'Environmental aspects and compliance',
      fields: [
        {
          name: 'environmentalPermits',
          label: 'Environmental Permits',
          type: 'textarea',
          required: true,
          helpText: 'List all environmental permits and status',
        },
        {
          name: 'environmentalLiabilities',
          label: 'Known Environmental Liabilities',
          type: 'textarea',
          required: true,
          helpText: 'Describe any known environmental issues or liabilities',
        },
        {
          name: 'reclamationPlan',
          label: 'Reclamation and Closure Plan',
          type: 'textarea',
          required: true,
          helpText: 'Summary of reclamation plan and estimated costs',
        },
        {
          name: 'reclamationBond',
          label: 'Reclamation Bond ($)',
          type: 'number',
          required: false,
          helpText: 'Amount of reclamation bond or financial assurance',
        },
      ],
    },
    {
      title: 'Item 1306 - Mineral Resource Estimates',
      description: 'Mineral resource estimates in compliance with S-K 1300',
      fields: [
        {
          name: 'effectiveDate',
          label: 'Effective Date',
          type: 'date',
          required: true,
          helpText: 'Date of the mineral resource estimate',
        },
        {
          name: 'resourceMeasured',
          label: 'Measured Resources',
          type: 'textarea',
          required: false,
          placeholder: 'Tonnage, grade, contained metal',
          helpText: 'Measured mineral resources (highest confidence)',
        },
        {
          name: 'resourceIndicated',
          label: 'Indicated Resources',
          type: 'textarea',
          required: true,
          placeholder: 'Tonnage, grade, contained metal',
          helpText: 'Indicated mineral resources (moderate confidence)',
        },
        {
          name: 'resourceInferred',
          label: 'Inferred Resources',
          type: 'textarea',
          required: false,
          placeholder: 'Tonnage, grade, contained metal',
          helpText: 'Inferred mineral resources (low confidence)',
        },
        {
          name: 'cutoffGrade',
          label: 'Cut-off Grade',
          type: 'text',
          required: true,
          helpText: 'Cut-off grade used for resource estimate',
        },
        {
          name: 'estimationMethod',
          label: 'Estimation Method',
          type: 'textarea',
          required: true,
          helpText: 'Method used for mineral resource estimation (kriging, inverse distance, etc.)',
        },
      ],
    },
    {
      title: 'Item 1307 - Modifying Factors',
      description: 'Factors used to convert resources to reserves',
      fields: [
        {
          name: 'miningMethod',
          label: 'Mining Method',
          type: 'select',
          required: true,
          options: [
            { value: 'open_pit', label: 'Open Pit' },
            { value: 'underground', label: 'Underground' },
            { value: 'combination', label: 'Combination' },
          ],
        },
        {
          name: 'miningRecovery',
          label: 'Mining Recovery (%)',
          type: 'number',
          required: true,
          helpText: 'Estimated mining recovery factor',
        },
        {
          name: 'processingMethod',
          label: 'Processing Method',
          type: 'textarea',
          required: true,
          helpText: 'Description of ore processing method',
        },
        {
          name: 'processingRecovery',
          label: 'Processing Recovery (%)',
          type: 'number',
          required: true,
          helpText: 'Estimated metallurgical recovery',
        },
        {
          name: 'dilution',
          label: 'Dilution (%)',
          type: 'number',
          required: true,
          helpText: 'Estimated dilution factor',
        },
      ],
    },
    {
      title: 'Item 1308 - Mineral Reserve Estimates',
      description: 'Mineral reserve estimates (economically mineable)',
      fields: [
        {
          name: 'reserveProven',
          label: 'Proven Reserves',
          type: 'textarea',
          required: false,
          placeholder: 'Tonnage, grade, contained metal',
          helpText: 'Proven mineral reserves (highest confidence, economically viable)',
        },
        {
          name: 'reserveProbable',
          label: 'Probable Reserves',
          type: 'textarea',
          required: false,
          placeholder: 'Tonnage, grade, contained metal',
          helpText: 'Probable mineral reserves (lower confidence, economically viable)',
        },
        {
          name: 'reserveEffectiveDate',
          label: 'Reserve Effective Date',
          type: 'date',
          required: false,
          helpText: 'Date of the mineral reserve estimate',
        },
      ],
    },
    {
      title: 'Item 1309 - Capital and Operating Costs',
      description: 'Estimated capital and operating costs',
      fields: [
        {
          name: 'initialCapex',
          label: 'Initial Capital (CAPEX) ($M)',
          type: 'number',
          required: true,
          helpText: 'Estimated initial capital expenditure',
        },
        {
          name: 'sustainingCapex',
          label: 'Sustaining Capital ($M)',
          type: 'number',
          required: false,
          helpText: 'Estimated sustaining capital over mine life',
        },
        {
          name: 'operatingCost',
          label: 'Operating Cost ($/ton)',
          type: 'number',
          required: true,
          helpText: 'Estimated operating cost per ton mined',
        },
        {
          name: 'cashCost',
          label: 'All-in Cash Cost ($/oz or $/lb)',
          type: 'number',
          required: false,
          helpText: 'All-in sustaining cash cost per unit of production',
        },
      ],
    },
    {
      title: 'Item 1310 - Economic Analysis',
      description: 'Economic analysis and feasibility',
      fields: [
        {
          name: 'npv',
          label: 'Net Present Value (NPV) ($M)',
          type: 'number',
          required: true,
          helpText: 'NPV at specified discount rate',
        },
        {
          name: 'irr',
          label: 'Internal Rate of Return (IRR) (%)',
          type: 'number',
          required: true,
          helpText: 'Project internal rate of return',
        },
        {
          name: 'paybackPeriod',
          label: 'Payback Period (years)',
          type: 'number',
          required: true,
          helpText: 'Estimated payback period',
        },
        {
          name: 'mineLife',
          label: 'Mine Life (years)',
          type: 'number',
          required: true,
          helpText: 'Estimated mine life',
        },
        {
          name: 'commodityPrice',
          label: 'Commodity Price Assumption',
          type: 'text',
          required: true,
          helpText: 'Metal price assumption used in economic analysis',
        },
        {
          name: 'discountRate',
          label: 'Discount Rate (%)',
          type: 'number',
          required: true,
          helpText: 'Discount rate used for NPV calculation',
        },
        {
          name: 'sensitivityAnalysis',
          label: 'Sensitivity Analysis',
          type: 'textarea',
          required: true,
          helpText: 'Summary of sensitivity to key variables (price, grade, costs)',
        },
      ],
    },
    {
      title: 'Qualified Person Declaration',
      description: 'Qualified Person(s) responsible for technical report',
      fields: [
        {
          name: 'qualifiedPersonName',
          label: 'Qualified Person Name',
          type: 'text',
          required: true,
          helpText: 'Name of the qualified person (QP)',
        },
        {
          name: 'qualifiedPersonTitle',
          label: 'QP Title and Affiliation',
          type: 'text',
          required: true,
          helpText: 'Professional title and company affiliation',
        },
        {
          name: 'qualifiedPersonCredentials',
          label: 'QP Credentials',
          type: 'text',
          required: true,
          placeholder: 'Ex: P.E., P.Geo., CPG',
          helpText: 'Professional credentials and registration',
        },
        {
          name: 'qualifiedPersonExperience',
          label: 'QP Relevant Experience',
          type: 'textarea',
          required: true,
          helpText: 'Summary of relevant experience (minimum 5 years)',
        },
        {
          name: 'qualifiedPersonIndependence',
          label: 'QP Independence',
          type: 'select',
          required: true,
          options: [
            { value: 'independent', label: 'Independent' },
            { value: 'employee', label: 'Employee of Registrant' },
            { value: 'related', label: 'Related Party' },
          ],
        },
      ],
    },
  ],
};
```

**Validação:**
```typescript
// Adicionar ao getAllStandards()
export function getAllStandards(): Array<{ code: string; name: string; description: string }> {
  return [
    // ... existing standards
    {
      code: 'SEC_SK_1300',
      name: 'SEC S-K 1300',
      description: 'U.S. Securities and Exchange Commission Mining Property Disclosure',
    },
  ];
}

// Adicionar ao getSchemaByStandard()
case 'SEC_SK_1300':
  return SEC_SK_1300_SCHEMA;
```

---

#### Tarefa 1.3: Adicionar Validação SEC S-K 1300
**Prazo:** Dia 4  
**Responsável:** Backend  
**Complexidade:** MÉDIA

**Arquivo:** `server/modules/technical-reports/services/krci-extended.ts`

```typescript
// Adicionar regras específicas SEC S-K 1300
{
  code: 'KRCI-SEC001',
  category: 'norma',
  section: 'SEC S-K 1300',
  message: 'Qualified Person não especificado',
  weight: 25,
  severity: 'critical',
  mode: 'light',
  check: (r) => r.standard === 'SEC_SK_1300' && !r.qualifiedPersonName,
  recommendation: 'SEC S-K 1300 requer Qualified Person com credenciais P.E., P.Geo., ou CPG',
},
{
  code: 'KRCI-SEC002',
  category: 'norma',
  section: 'SEC S-K 1300',
  message: 'NPV não especificado',
  weight: 20,
  severity: 'critical',
  mode: 'light',
  check: (r) => r.standard === 'SEC_SK_1300' && !r.npv,
  recommendation: 'SEC S-K 1300 requer análise econômica com NPV e IRR',
},
{
  code: 'KRCI-SEC003',
  category: 'norma',
  section: 'SEC S-K 1300',
  message: 'Modifying factors incompletos',
  weight: 18,
  severity: 'high',
  mode: 'full',
  check: (r) => r.standard === 'SEC_SK_1300' && (!r.miningRecovery || !r.processingRecovery),
  recommendation: 'Item 1307 requer fatores de recuperação (mining e processing)',
},
```

---

#### Tarefa 1.4: Atualizar Templates e Exportação
**Prazo:** Dia 5  
**Responsável:** Backend  
**Complexidade:** MÉDIA

```typescript
// docx-renderer.ts
const STANDARD_TITLES = {
  JORC_2012: 'JORC Code 2012 Edition',
  NI_43_101: 'NI 43-101 Standards of Disclosure',
  PERC: 'Pan-European Reserves and Resources Reporting Committee',
  SAMREC: 'South African Mineral Resource Committee',
  SEC_SK_1300: 'SEC Regulation S-K Item 1300', // ✅ NOVO
};
```

---

### FASE 2: Integrações com Órgãos Oficiais (7 dias) 🔴 CRÍTICO

#### Tarefa 2.1: Integração Real com ANM
**Prazo:** Dias 6-8  
**Responsável:** Backend + Integrações  
**Complexidade:** ALTA

**API da ANM:**
- Endpoint: `https://sistemas.anm.gov.br/SCM/api/v2/processos`
- Autenticação: Token JWT
- Rate limit: 100 req/min

**Implementação:**

```typescript
// server/modules/technical-reports/services/official-integrations/anm.ts

interface ANMProcessResponse {
  numero: string; // "48226.800153/2023"
  situacao: 'ATIVO' | 'SUSPENSO' | 'CANCELADO' | 'ARQUIVADO';
  fase: string; // "CONCESSÃO DE LAVRA"
  substancia: string;
  area_ha: number;
  municipio: string;
  uf: string;
  titular: {
    nome: string;
    cpf_cnpj: string;
  };
  data_protocolo: string;
  data_publicacao: string;
}

export async function validateWithANM_Real(
  miningTitleNumber: string
): Promise<ValidationResult> {
  try {
    const apiKey = process.env.ANM_API_KEY;
    
    if (!apiKey) {
      console.warn('[ANM] API Key not configured, using mock validation');
      return validateWithANM_Mock(miningTitleNumber);
    }

    // Validar formato do número de processo
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

    // Fazer requisição à API da ANM
    const response = await fetch(
      `https://sistemas.anm.gov.br/SCM/api/v2/processos/${miningTitleNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          source: 'ANM',
          field: 'miningTitleNumber',
          status: 'not_found',
          message: 'Processo não encontrado na base da ANM',
          reportValue: miningTitleNumber,
          url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${miningTitleNumber}`,
        };
      }
      
      throw new Error(`ANM API error: ${response.status}`);
    }

    const data: ANMProcessResponse = await response.json();

    // Validar status do processo
    if (data.situacao !== 'ATIVO') {
      return {
        source: 'ANM',
        field: 'miningTitleStatus',
        status: 'invalid',
        message: `Processo não está ATIVO. Status atual: ${data.situacao}`,
        reportValue: miningTitleNumber,
        officialValue: data.situacao,
        url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${miningTitleNumber}`,
      };
    }

    // Cache do resultado (Redis - 24h)
    await cacheSet(`anm:${miningTitleNumber}`, data, 86400);

    return {
      source: 'ANM',
      field: 'miningTitleNumber',
      status: 'valid',
      message: `Processo válido - ${data.fase} - ${data.substancia}`,
      reportValue: miningTitleNumber,
      officialValue: data,
      url: `https://sistemas.anm.gov.br/SCM/site/admin/Default.aspx?ProcessoNumero=${miningTitleNumber}`,
    };
  } catch (error: any) {
    console.error('[ANM] Validation error:', error);
    
    return {
      source: 'ANM',
      field: 'miningTitleNumber',
      status: 'error',
      message: `Erro ao consultar ANM: ${error.message}`,
      reportValue: miningTitleNumber,
    };
  }
}
```

**Variáveis de Ambiente:**
```bash
# .env
ANM_API_KEY=your_anm_api_key_here
ANM_API_URL=https://sistemas.anm.gov.br/SCM/api/v2
```

---

#### Tarefa 2.2: Integração Real com CPRM
**Prazo:** Dias 9-10  
**Responsável:** Backend + Integrações  
**Complexidade:** ALTA

```typescript
// server/modules/technical-reports/services/official-integrations/cprm.ts

interface CPRMGeologyResponse {
  formacao_geologica: string;
  idade_geologica: string;
  litologia: string[];
  mineralizacao: string[];
  provincia_geologica: string;
}

export async function validateWithCPRM_Real(
  latitude: number,
  longitude: number
): Promise<ValidationResult> {
  try {
    const response = await fetch(
      `https://geosgb.cprm.gov.br/api/v1/geology?lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      throw new Error(`CPRM API error: ${response.status}`);
    }

    const data: CPRMGeologyResponse = await response.json();

    return {
      source: 'CPRM',
      field: 'geologicalFormation',
      status: 'valid',
      message: `Formação geológica: ${data.formacao_geologica}`,
      officialValue: data,
    };
  } catch (error: any) {
    console.error('[CPRM] Validation error:', error);
    
    return {
      source: 'CPRM',
      field: 'geologicalFormation',
      status: 'error',
      message: `Erro ao consultar CPRM: ${error.message}`,
    };
  }
}
```

---

#### Tarefa 2.3: Integração Real com IBAMA
**Prazo:** Dias 11-12  
**Responsável:** Backend + Integrações  
**Complexidade:** ALTA

```typescript
// server/modules/technical-reports/services/official-integrations/ibama.ts

interface IBAMALicenseResponse {
  numero_processo: string;
  status: 'VÁLIDA' | 'VENCIDA' | 'SUSPENSA' | 'CANCELADA';
  tipo: 'LP' | 'LI' | 'LO';
  validade: string; // ISO date
  emissao: string; // ISO date
  condicionantes: string[];
  area_estudo: number; // hectares
  municipios: string[];
}

export async function validateWithIBAMA_Real(
  licenseNumber: string,
  cnpj: string
): Promise<ValidationResult> {
  try {
    const response = await fetch(
      'https://servicos.ibama.gov.br/licenciamento/api/v1/consulta',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          numero_processo: licenseNumber,
          cpf_cnpj: cnpj,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          source: 'IBAMA',
          field: 'environmentalLicense',
          status: 'not_found',
          message: 'Licença ambiental não encontrada no SISNAMA',
          reportValue: licenseNumber,
        };
      }
      
      throw new Error(`IBAMA API error: ${response.status}`);
    }

    const data: IBAMALicenseResponse = await response.json();

    // Verificar validade
    const validade = new Date(data.validade);
    const hoje = new Date();
    
    if (validade < hoje) {
      return {
        source: 'IBAMA',
        field: 'environmentalLicense',
        status: 'invalid',
        message: `Licença VENCIDA. Validade: ${validade.toLocaleDateString('pt-BR')}`,
        reportValue: licenseNumber,
        officialValue: data,
      };
    }

    if (data.status !== 'VÁLIDA') {
      return {
        source: 'IBAMA',
        field: 'environmentalLicense',
        status: 'invalid',
        message: `Licença com status: ${data.status}`,
        reportValue: licenseNumber,
        officialValue: data,
      };
    }

    return {
      source: 'IBAMA',
      field: 'environmentalLicense',
      status: 'valid',
      message: `Licença ${data.tipo} válida até ${validade.toLocaleDateString('pt-BR')}`,
      reportValue: licenseNumber,
      officialValue: data,
      url: `https://servicos.ibama.gov.br/licenciamento/consulta/${licenseNumber}`,
    };
  } catch (error: any) {
    console.error('[IBAMA] Validation error:', error);
    
    return {
      source: 'IBAMA',
      field: 'environmentalLicense',
      status: 'error',
      message: `Erro ao consultar IBAMA: ${error.message}`,
      reportValue: licenseNumber,
    };
  }
}
```

---

### FASE 3: Testes e Validação (2 dias)

#### Tarefa 3.1: Testes Unitários
**Prazo:** Dia 13  
**Responsável:** QA

```typescript
// tests/integration/official-integrations.test.ts

describe('Official Integrations', () => {
  describe('ANM Integration', () => {
    it('should validate valid ANM process number', async () => {
      const result = await validateWithANM_Real('48226.800153/2023');
      expect(result.status).toBe('valid');
      expect(result.officialValue.situacao).toBe('ATIVO');
    });

    it('should reject invalid format', async () => {
      const result = await validateWithANM_Real('123456');
      expect(result.status).toBe('invalid');
      expect(result.message).toContain('Formato inválido');
    });

    it('should handle not found', async () => {
      const result = await validateWithANM_Real('00000.000000/0000');
      expect(result.status).toBe('not_found');
    });
  });

  describe('CPRM Integration', () => {
    it('should validate geological data', async () => {
      const result = await validateWithCPRM_Real(-6.0, -50.0); // Carajás
      expect(result.status).toBe('valid');
      expect(result.officialValue.formacao_geologica).toBeDefined();
    });
  });

  describe('IBAMA Integration', () => {
    it('should validate active license', async () => {
      const result = await validateWithIBAMA_Real('12345/2024', '12.345.678/0001-90');
      expect(result.status).toBe('valid');
    });

    it('should reject expired license', async () => {
      const result = await validateWithIBAMA_Real('99999/2020', '12.345.678/0001-90');
      expect(result.status).toBe('invalid');
      expect(result.message).toContain('VENCIDA');
    });
  });
});
```

---

## 📊 MÉTRICAS DE SUCESSO

### Critérios de Aceitação

| Métrica | Meta | Atual | Status |
|---------|------|-------|--------|
| SEC S-K 1300 implementado | 100% | 0% | ❌ |
| ANM integração real | 100% | 0% (mock) | ❌ |
| CPRM integração real | 100% | 0% (mock) | ❌ |
| IBAMA integração real | 100% | 0% (mock) | ❌ |
| Upload funcionando | 100% | 100% | ✅ |
| Testes unitários (novos) | 50+ | 0 | ❌ |
| Cobertura de código (integrações) | 80% | 30% | ❌ |

---

## 🚀 DEPLOY E ROLLOUT

### Estratégia de Deploy

1. **Ambiente de Desenvolvimento**
   - Testar com mocks primeiro
   - Validar schemas e validações

2. **Ambiente de Staging**
   - Ativar APIs reais (ANM, CPRM, IBAMA)
   - Testar com dados de produção (sandbox)

3. **Ambiente de Produção**
   - Feature flag: `ENABLE_SEC_SK_1300`
   - Feature flag: `ENABLE_OFFICIAL_INTEGRATIONS`
   - Rollout gradual: 10% → 50% → 100%

### Rollback Plan

Se houver problemas críticos:
1. Desativar feature flags
2. Reverter para mocks
3. Investigar logs de erro
4. Corrigir e re-deploy

---

## 📞 RESPONSÁVEIS

| Tarefa | Responsável | Email | Status |
|--------|-------------|-------|--------|
| SEC S-K 1300 Schema | Compliance Team | compliance@company.com | ⏳ TODO |
| Integração ANM | Backend Team | backend@company.com | ⏳ TODO |
| Integração CPRM | Backend Team | backend@company.com | ⏳ TODO |
| Integração IBAMA | Backend Team | backend@company.com | ⏳ TODO |
| Testes | QA Team | qa@company.com | ⏳ TODO |
| Deploy | DevOps | devops@company.com | ⏳ TODO |

---

## ✅ CHECKLIST FINAL

### Antes do Deploy

- [ ] SEC S-K 1300 schema completo (10 items)
- [ ] Validações KRCI específicas SEC
- [ ] Integração ANM testada (100 processos)
- [ ] Integração CPRM testada (50 coordenadas)
- [ ] Integração IBAMA testada (50 licenças)
- [ ] Testes unitários passando (100%)
- [ ] Testes E2E passando (100%)
- [ ] Feature flags configuradas
- [ ] Documentação atualizada
- [ ] Changelog atualizado

### Após Deploy

- [ ] Monitorar erros (Sentry/Datadog)
- [ ] Verificar taxa de sucesso APIs
- [ ] Validar performance (<5s por consulta)
- [ ] Coletar feedback de usuários
- [ ] Ajustar rate limits se necessário

---

**Status Final:** 🔴 **AGUARDANDO EXECUÇÃO**

**Próxima Revisão:** 16 de novembro de 2025 (Sprint 6 Review)
