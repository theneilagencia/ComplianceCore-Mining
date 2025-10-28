/**
 * KRCI Extended - 100+ Compliance Rules
 * 
 * Organized by category and scan mode:
 * - Light: 30 critical rules (~5 min)
 * - Full: 70 rules (~15 min)
 * - Deep: 100+ rules (~30 min)
 * 
 * Categories:
 * - Tenure (15 rules): Mining titles, ANM, DNPM
 * - Geo (20 rules): Geology, resources, reserves
 * - ESG (20 rules): Environmental, social, governance
 * - Norma (20 rules): Standards compliance
 * - Satélite (15 rules): Remote sensing, NDVI, deforestation
 * - Benchmark (10 rules): Peer comparison
 */

export type ScanMode = 'light' | 'full' | 'deep';
export type RuleCategory = 'tenure' | 'geo' | 'esg' | 'norma' | 'satelite' | 'benchmark';
export type RuleSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface KRCIRule {
  code: string;
  category: RuleCategory;
  section: string;
  message: string;
  weight: number;
  severity: RuleSeverity;
  mode: ScanMode; // Minimum mode required to run this rule
  check: (report: any) => boolean;
  recommendation?: string;
}

export interface KRCIScanResult {
  mode: ScanMode;
  score: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  krcis: Array<{
    code: string;
    category: RuleCategory;
    section: string;
    message: string;
    severity: RuleSeverity;
    weight: number;
    recommendation?: string;
  }>;
  categoryScores: Record<RuleCategory, number>;
  recommendations: string[];
  executionTime: number; // milliseconds
}

/**
 * 100+ KRCI Rules organized by category
 */
export const KRCI_RULES: KRCIRule[] = [
  
  // ============================================================
  // TENURE RULES (15 rules) - Mining titles and regulatory
  // ============================================================
  
  {
    code: 'KRCI-T001',
    category: 'tenure',
    section: 'Tenure',
    message: 'Número do processo ANM ausente',
    weight: 20,
    severity: 'critical',
    mode: 'light',
    check: (r) => !r.metadata?.anmProcess,
    recommendation: 'Incluir número do processo ANM (formato: 800.XXX/ANO)',
  },
  {
    code: 'KRCI-T002',
    category: 'tenure',
    section: 'Tenure',
    message: 'Código DNPM ausente (para processos antigos)',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.metadata?.dnpmCode && r.metadata?.effectiveDate && new Date(r.metadata.effectiveDate) < new Date('2017-01-01'),
    recommendation: 'Incluir código DNPM para processos anteriores a 2017',
  },
  {
    code: 'KRCI-T003',
    category: 'tenure',
    section: 'Tenure',
    message: 'Fase do título minerário não especificada',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.tenure?.phase,
    recommendation: 'Especificar fase: Autorização de Pesquisa, Concessão de Lavra, etc.',
  },
  {
    code: 'KRCI-T004',
    category: 'tenure',
    section: 'Tenure',
    message: 'Área do título minerário não especificada',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.tenure?.area,
    recommendation: 'Incluir área em hectares',
  },
  {
    code: 'KRCI-T005',
    category: 'tenure',
    section: 'Tenure',
    message: 'Substância mineral não declarada',
    weight: 18,
    severity: 'critical',
    mode: 'light',
    check: (r) => !r.tenure?.substance,
    recommendation: 'Declarar substância mineral autorizada (ouro, ferro, etc.)',
  },
  {
    code: 'KRCI-T006',
    category: 'tenure',
    section: 'Tenure',
    message: 'Titular do direito minerário ausente',
    weight: 15,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.tenure?.holder,
    recommendation: 'Incluir razão social do titular',
  },
  {
    code: 'KRCI-T007',
    category: 'tenure',
    section: 'Tenure',
    message: 'CNPJ do titular ausente',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.tenure?.holderCnpj,
    recommendation: 'Incluir CNPJ do titular',
  },
  {
    code: 'KRCI-T008',
    category: 'tenure',
    section: 'Tenure',
    message: 'Data de outorga ausente',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.tenure?.grantDate,
    recommendation: 'Incluir data de outorga do título',
  },
  {
    code: 'KRCI-T009',
    category: 'tenure',
    section: 'Tenure',
    message: 'Data de validade ausente',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.tenure?.expiryDate,
    recommendation: 'Incluir data de validade do título',
  },
  {
    code: 'KRCI-T010',
    category: 'tenure',
    section: 'Tenure',
    message: 'Título minerário vencido ou próximo do vencimento (<6 meses)',
    weight: 18,
    severity: 'critical',
    mode: 'light',
    check: (r) => {
      if (!r.tenure?.expiryDate) return false;
      const expiry = new Date(r.tenure.expiryDate);
      const now = new Date();
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
      return expiry.getTime() - now.getTime() < sixMonths;
    },
    recommendation: 'Renovar título minerário ou atualizar data de validade',
  },
  {
    code: 'KRCI-T011',
    category: 'tenure',
    section: 'Tenure',
    message: 'Coordenadas geográficas do polígono ausentes',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.tenure?.coordinates || r.tenure.coordinates.length === 0,
    recommendation: 'Incluir coordenadas do polígono (SIRGAS 2000)',
  },
  {
    code: 'KRCI-T012',
    category: 'tenure',
    section: 'Tenure',
    message: 'Sobreposição com áreas protegidas não verificada',
    weight: 15,
    severity: 'high',
    mode: 'deep',
    check: (r) => !r.tenure?.protectedAreasCheck,
    recommendation: 'Verificar sobreposição com UCs, TIs, etc.',
  },
  {
    code: 'KRCI-T013',
    category: 'tenure',
    section: 'Tenure',
    message: 'Regime de aproveitamento não especificado',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.tenure?.regime,
    recommendation: 'Especificar: Autorização de Pesquisa, Concessão de Lavra, etc.',
  },
  {
    code: 'KRCI-T014',
    category: 'tenure',
    section: 'Tenure',
    message: 'Município(s) abrangido(s) não declarado(s)',
    weight: 6,
    severity: 'low',
    mode: 'full',
    check: (r) => !r.tenure?.municipalities || r.tenure.municipalities.length === 0,
    recommendation: 'Listar municípios abrangidos pelo título',
  },
  {
    code: 'KRCI-T015',
    category: 'tenure',
    section: 'Tenure',
    message: 'UF (Estado) não declarado',
    weight: 6,
    severity: 'low',
    mode: 'full',
    check: (r) => !r.tenure?.state,
    recommendation: 'Incluir UF do título minerário',
  },

  // ============================================================
  // GEO RULES (20 rules) - Geology, resources, reserves
  // ============================================================
  
  {
    code: 'KRCI-G001',
    category: 'geo',
    section: 'Geology',
    message: 'Modelo geológico não descrito',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.geology?.model,
    recommendation: 'Descrever modelo geológico conceitual',
  },
  {
    code: 'KRCI-G002',
    category: 'geo',
    section: 'Geology',
    message: 'Litologia predominante não especificada',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.geology?.lithology,
    recommendation: 'Descrever litologia predominante',
  },
  {
    code: 'KRCI-G003',
    category: 'geo',
    section: 'Geology',
    message: 'Mineralização não caracterizada',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.geology?.mineralization,
    recommendation: 'Caracterizar tipo de mineralização',
  },
  {
    code: 'KRCI-G004',
    category: 'geo',
    section: 'Resources',
    message: 'Recursos Medidos ausentes',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => {
      if (!r.resourceEstimates) return false;
      return !r.resourceEstimates.some((re: any) => re.category?.toLowerCase() === 'measured');
    },
    recommendation: 'Incluir recursos Medidos (se aplicável)',
  },
  {
    code: 'KRCI-G005',
    category: 'geo',
    section: 'Resources',
    message: 'Recursos Indicados ausentes',
    weight: 6,
    severity: 'low',
    mode: 'full',
    check: (r) => {
      if (!r.resourceEstimates) return false;
      return !r.resourceEstimates.some((re: any) => re.category?.toLowerCase() === 'indicated');
    },
    recommendation: 'Incluir recursos Indicados (se aplicável)',
  },
  {
    code: 'KRCI-G006',
    category: 'geo',
    section: 'Resources',
    message: 'Recursos Inferidos ausentes',
    weight: 4,
    severity: 'low',
    mode: 'deep',
    check: (r) => {
      if (!r.resourceEstimates) return false;
      return !r.resourceEstimates.some((re: any) => re.category?.toLowerCase() === 'inferred');
    },
    recommendation: 'Incluir recursos Inferidos (se aplicável)',
  },
  {
    code: 'KRCI-G007',
    category: 'geo',
    section: 'Resources',
    message: 'Método de estimativa não especificado',
    weight: 12,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.geology?.estimationMethod,
    recommendation: 'Especificar método: krigagem, inverso da distância, etc.',
  },
  {
    code: 'KRCI-G008',
    category: 'geo',
    section: 'Resources',
    message: 'Parâmetros de krigagem não documentados',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => r.geology?.estimationMethod?.toLowerCase().includes('kriging') && !r.geology?.krigingParams,
    recommendation: 'Documentar parâmetros de krigagem (variograma, etc.)',
  },
  {
    code: 'KRCI-G009',
    category: 'geo',
    section: 'Drilling',
    message: 'Número de furos não especificado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.drilling?.totalHoles,
    recommendation: 'Incluir número total de furos de sondagem',
  },
  {
    code: 'KRCI-G010',
    category: 'geo',
    section: 'Drilling',
    message: 'Metragem total de sondagem não especificada',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.drilling?.totalMeters,
    recommendation: 'Incluir metragem total perfurada',
  },
  {
    code: 'KRCI-G011',
    category: 'geo',
    section: 'Drilling',
    message: 'Espaçamento de furos não especificado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.drilling?.spacing,
    recommendation: 'Especificar espaçamento médio entre furos',
  },
  {
    code: 'KRCI-G012',
    category: 'geo',
    section: 'Drilling',
    message: 'Tipo de sondagem não especificado',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.drilling?.type,
    recommendation: 'Especificar tipo: diamantada, rotativa, etc.',
  },
  {
    code: 'KRCI-G013',
    category: 'geo',
    section: 'Sampling',
    message: 'Protocolo de amostragem não documentado',
    weight: 12,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.sampling?.protocol,
    recommendation: 'Documentar protocolo de amostragem',
  },
  {
    code: 'KRCI-G014',
    category: 'geo',
    section: 'Sampling',
    message: 'Número de amostras não especificado',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.sampling?.totalSamples,
    recommendation: 'Incluir número total de amostras',
  },
  {
    code: 'KRCI-G015',
    category: 'geo',
    section: 'Sampling',
    message: 'Laboratório de análise não identificado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.sampling?.laboratory,
    recommendation: 'Identificar laboratório responsável pelas análises',
  },
  {
    code: 'KRCI-G016',
    category: 'geo',
    section: 'Sampling',
    message: 'Método analítico não especificado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.sampling?.analyticalMethod,
    recommendation: 'Especificar método: ICP, fire assay, etc.',
  },
  {
    code: 'KRCI-G017',
    category: 'geo',
    section: 'Reserves',
    message: 'Reservas Provadas não declaradas',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.reserves || !r.reserves.proven,
    recommendation: 'Declarar reservas Provadas (se aplicável)',
  },
  {
    code: 'KRCI-G018',
    category: 'geo',
    section: 'Reserves',
    message: 'Reservas Prováveis não declaradas',
    weight: 6,
    severity: 'low',
    mode: 'full',
    check: (r) => !r.reserves || !r.reserves.probable,
    recommendation: 'Declarar reservas Prováveis (se aplicável)',
  },
  {
    code: 'KRCI-G019',
    category: 'geo',
    section: 'Reserves',
    message: 'Fatores modificadores não documentados',
    weight: 12,
    severity: 'high',
    mode: 'deep',
    check: (r) => !r.reserves?.modifyingFactors,
    recommendation: 'Documentar fatores modificadores (mineração, metalurgia, etc.)',
  },
  {
    code: 'KRCI-G020',
    category: 'geo',
    section: 'Geology',
    message: 'Controles de mineralização não descritos',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.geology?.controls,
    recommendation: 'Descrever controles estruturais, litológicos, etc.',
  },

  // ============================================================
  // ESG RULES (20 rules) - Environmental, Social, Governance
  // ============================================================
  
  {
    code: 'KRCI-E001',
    category: 'esg',
    section: 'Environmental',
    message: 'Licença ambiental ausente',
    weight: 20,
    severity: 'critical',
    mode: 'light',
    check: (r) => !r.environmental?.license,
    recommendation: 'Obter licença ambiental (LP, LI ou LO)',
  },
  {
    code: 'KRCI-E002',
    category: 'esg',
    section: 'Environmental',
    message: 'Número da licença ambiental ausente',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.environmental?.licenseNumber,
    recommendation: 'Incluir número da licença ambiental',
  },
  {
    code: 'KRCI-E003',
    category: 'esg',
    section: 'Environmental',
    message: 'Órgão emissor da licença não especificado',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.environmental?.issuingAgency,
    recommendation: 'Especificar órgão: IBAMA, SEMA estadual, etc.',
  },
  {
    code: 'KRCI-E004',
    category: 'esg',
    section: 'Environmental',
    message: 'Data de validade da licença ausente',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.environmental?.licenseExpiry,
    recommendation: 'Incluir data de validade da licença',
  },
  {
    code: 'KRCI-E005',
    category: 'esg',
    section: 'Environmental',
    message: 'Licença ambiental vencida ou próxima do vencimento (<6 meses)',
    weight: 18,
    severity: 'critical',
    mode: 'light',
    check: (r) => {
      if (!r.environmental?.licenseExpiry) return false;
      const expiry = new Date(r.environmental.licenseExpiry);
      const now = new Date();
      const sixMonths = 6 * 30 * 24 * 60 * 60 * 1000;
      return expiry.getTime() - now.getTime() < sixMonths;
    },
    recommendation: 'Renovar licença ambiental',
  },
  {
    code: 'KRCI-E006',
    category: 'esg',
    section: 'Environmental',
    message: 'EIA/RIMA não mencionado (para projetos de grande porte)',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => r.project?.size === 'large' && !r.environmental?.eia,
    recommendation: 'Elaborar EIA/RIMA para projetos de grande porte',
  },
  {
    code: 'KRCI-E007',
    category: 'esg',
    section: 'Environmental',
    message: 'Plano de recuperação de áreas degradadas (PRAD) ausente',
    weight: 15,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.environmental?.prad,
    recommendation: 'Elaborar PRAD conforme legislação',
  },
  {
    code: 'KRCI-E008',
    category: 'esg',
    section: 'Environmental',
    message: 'Gestão de rejeitos não documentada',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.environmental?.tailingsManagement,
    recommendation: 'Documentar plano de gestão de rejeitos',
  },
  {
    code: 'KRCI-E009',
    category: 'esg',
    section: 'Environmental',
    message: 'Barragem de rejeitos não declarada (se aplicável)',
    weight: 18,
    severity: 'critical',
    mode: 'light',
    check: (r) => r.environmental?.hasTailingsDam && !r.environmental?.damDetails,
    recommendation: 'Declarar detalhes da barragem (categoria de risco, etc.)',
  },
  {
    code: 'KRCI-E010',
    category: 'esg',
    section: 'Environmental',
    message: 'Consumo de água não estimado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.environmental?.waterConsumption,
    recommendation: 'Estimar consumo de água (m³/dia)',
  },
  {
    code: 'KRCI-E011',
    category: 'esg',
    section: 'Environmental',
    message: 'Emissões de GEE não estimadas',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.environmental?.ghgEmissions,
    recommendation: 'Estimar emissões de GEE (tCO₂e/ano)',
  },
  {
    code: 'KRCI-E012',
    category: 'esg',
    section: 'Social',
    message: 'Consulta a comunidades locais não documentada',
    weight: 15,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.social?.communityConsultation,
    recommendation: 'Documentar consultas às comunidades afetadas',
  },
  {
    code: 'KRCI-E013',
    category: 'esg',
    section: 'Social',
    message: 'Plano de contratação local não especificado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.social?.localHiring,
    recommendation: 'Especificar metas de contratação local',
  },
  {
    code: 'KRCI-E014',
    category: 'esg',
    section: 'Social',
    message: 'Impactos sociais não avaliados',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.social?.impactAssessment,
    recommendation: 'Avaliar impactos sociais do projeto',
  },
  {
    code: 'KRCI-E015',
    category: 'esg',
    section: 'Social',
    message: 'Terras indígenas não verificadas',
    weight: 18,
    severity: 'critical',
    mode: 'light',
    check: (r) => !r.social?.indigenousLandsCheck,
    recommendation: 'Verificar sobreposição com terras indígenas',
  },
  {
    code: 'KRCI-E016',
    category: 'esg',
    section: 'Social',
    message: 'Comunidades quilombolas não verificadas',
    weight: 15,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.social?.quilombolaCheck,
    recommendation: 'Verificar presença de comunidades quilombolas',
  },
  {
    code: 'KRCI-E017',
    category: 'esg',
    section: 'Governance',
    message: 'Política de compliance não documentada',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.governance?.compliancePolicy,
    recommendation: 'Documentar política de compliance',
  },
  {
    code: 'KRCI-E018',
    category: 'esg',
    section: 'Governance',
    message: 'Código de conduta ausente',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.governance?.codeOfConduct,
    recommendation: 'Elaborar código de conduta',
  },
  {
    code: 'KRCI-E019',
    category: 'esg',
    section: 'Governance',
    message: 'Canal de denúncias não implementado',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.governance?.whistleblower,
    recommendation: 'Implementar canal de denúncias',
  },
  {
    code: 'KRCI-E020',
    category: 'esg',
    section: 'Governance',
    message: 'Política anticorrupção não documentada',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => !r.governance?.antiCorruption,
    recommendation: 'Documentar política anticorrupção',
  },

  // ============================================================
  // NORMA RULES (20 rules) - Standards compliance
  // ============================================================
  
  {
    code: 'KRCI-N001',
    category: 'norma',
    section: 'Standards',
    message: 'Padrão internacional não identificado',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => !r.metadata?.standard,
    recommendation: 'Especificar padrão: JORC, NI 43-101, PERC, SAMREC',
  },
  {
    code: 'KRCI-N002',
    category: 'norma',
    section: 'Standards',
    message: 'Versão do padrão não especificada',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.metadata?.standardVersion,
    recommendation: 'Especificar versão (ex: JORC 2012)',
  },
  {
    code: 'KRCI-N003',
    category: 'norma',
    section: 'Standards',
    message: 'Tabela 1 do JORC ausente (Sampling Techniques)',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => r.metadata?.standard?.includes('JORC') && !r.jorc?.table1,
    recommendation: 'Incluir Tabela 1 do JORC Code',
  },
  {
    code: 'KRCI-N004',
    category: 'norma',
    section: 'Standards',
    message: 'Tabela 2 do JORC ausente (Reporting of Exploration Results)',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => r.metadata?.standard?.includes('JORC') && !r.jorc?.table2,
    recommendation: 'Incluir Tabela 2 do JORC Code',
  },
  {
    code: 'KRCI-N005',
    category: 'norma',
    section: 'Standards',
    message: 'Seção 1.4 do NI 43-101 ausente (Property Description)',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => r.metadata?.standard?.includes('NI 43-101') && !r.ni43101?.section14,
    recommendation: 'Incluir Seção 1.4 conforme NI 43-101',
  },
  {
    code: 'KRCI-N006',
    category: 'norma',
    section: 'Standards',
    message: 'Declaração de Pessoa Competente ausente',
    weight: 20,
    severity: 'critical',
    mode: 'light',
    check: (r) => !r.competentPersons || r.competentPersons.length === 0,
    recommendation: 'Incluir declaração de Pessoa Competente/Qualificada',
  },
  {
    code: 'KRCI-N007',
    category: 'norma',
    section: 'Standards',
    message: 'Registro profissional da Pessoa Competente ausente (CREA)',
    weight: 15,
    severity: 'high',
    mode: 'light',
    check: (r) => {
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.creaNumber;
    },
    recommendation: 'Incluir número do CREA da Pessoa Competente',
  },
  {
    code: 'KRCI-N008',
    category: 'norma',
    section: 'Standards',
    message: 'CPF da Pessoa Competente ausente',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => {
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.cpf;
    },
    recommendation: 'Incluir CPF da Pessoa Competente',
  },
  {
    code: 'KRCI-N009',
    category: 'norma',
    section: 'Standards',
    message: 'Experiência da Pessoa Competente não documentada',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => {
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.experience;
    },
    recommendation: 'Documentar experiência relevante (anos, projetos)',
  },
  {
    code: 'KRCI-N010',
    category: 'norma',
    section: 'Standards',
    message: 'Declaração de independência ausente',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => {
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return r.competentPersons[0]?.independence === undefined;
    },
    recommendation: 'Declarar independência da Pessoa Competente',
  },
  {
    code: 'KRCI-N011',
    category: 'norma',
    section: 'Standards',
    message: 'Data de visita ao site não especificada',
    weight: 12,
    severity: 'high',
    mode: 'full',
    check: (r) => {
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.siteVisitDate;
    },
    recommendation: 'Incluir data da visita ao site',
  },
  {
    code: 'KRCI-N012',
    category: 'norma',
    section: 'Standards',
    message: 'Disclaimer de forward-looking statements ausente',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.disclaimers?.forwardLooking,
    recommendation: 'Incluir disclaimer de projeções futuras',
  },
  {
    code: 'KRCI-N013',
    category: 'norma',
    section: 'Standards',
    message: 'Disclaimer de riscos ausente',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.disclaimers?.risks,
    recommendation: 'Incluir disclaimer de riscos',
  },
  {
    code: 'KRCI-N014',
    category: 'norma',
    section: 'Standards',
    message: 'Referências bibliográficas ausentes',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.references || r.references.length === 0,
    recommendation: 'Incluir referências bibliográficas',
  },
  {
    code: 'KRCI-N015',
    category: 'norma',
    section: 'Standards',
    message: 'Glossário de termos técnicos ausente',
    weight: 4,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.glossary,
    recommendation: 'Incluir glossário de termos técnicos',
  },
  {
    code: 'KRCI-N016',
    category: 'norma',
    section: 'Standards',
    message: 'Unidades de medida não especificadas',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.metadata?.units,
    recommendation: 'Especificar unidades: métricas, imperiais, etc.',
  },
  {
    code: 'KRCI-N017',
    category: 'norma',
    section: 'Standards',
    message: 'Datum geodésico não especificado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.metadata?.datum,
    recommendation: 'Especificar datum: SIRGAS 2000, WGS84, etc.',
  },
  {
    code: 'KRCI-N018',
    category: 'norma',
    section: 'Standards',
    message: 'Sistema de coordenadas não especificado',
    weight: 10,
    severity: 'medium',
    mode: 'full',
    check: (r) => !r.metadata?.coordinateSystem,
    recommendation: 'Especificar sistema: UTM, lat/long, etc.',
  },
  {
    code: 'KRCI-N019',
    category: 'norma',
    section: 'Standards',
    message: 'Moeda não especificada (para valores econômicos)',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => r.economicAssumptions && !r.metadata?.currency,
    recommendation: 'Especificar moeda: BRL, USD, etc.',
  },
  {
    code: 'KRCI-N020',
    category: 'norma',
    section: 'Standards',
    message: 'Data base para valores econômicos não especificada',
    weight: 8,
    severity: 'medium',
    mode: 'full',
    check: (r) => r.economicAssumptions && !r.metadata?.priceDate,
    recommendation: 'Especificar data base para preços e custos',
  },

  // ============================================================
  // SATÉLITE RULES (15 rules) - Remote sensing data
  // ============================================================
  
  {
    code: 'KRCI-S001',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Dados de sensoriamento remoto não utilizados',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.remoteSensing,
    recommendation: 'Utilizar dados de sensoriamento remoto (Landsat, Sentinel, etc.)',
  },
  {
    code: 'KRCI-S002',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'NDVI não calculado',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.ndvi,
    recommendation: 'Calcular NDVI para análise de vegetação',
  },
  {
    code: 'KRCI-S003',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Análise de desmatamento não realizada',
    weight: 12,
    severity: 'high',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.deforestation,
    recommendation: 'Analisar desmatamento na área do projeto',
  },
  {
    code: 'KRCI-S004',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Alterações de uso do solo não mapeadas',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.landUseChange,
    recommendation: 'Mapear alterações de uso do solo',
  },
  {
    code: 'KRCI-S005',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Corpos d\'água não mapeados',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.waterBodies,
    recommendation: 'Mapear corpos d\'água próximos',
  },
  {
    code: 'KRCI-S006',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Modelo digital de elevação não utilizado',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.dem,
    recommendation: 'Utilizar DEM para análise topográfica',
  },
  {
    code: 'KRCI-S007',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Análise de alterações espectrais não realizada',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.spectralChange,
    recommendation: 'Analisar alterações espectrais ao longo do tempo',
  },
  {
    code: 'KRCI-S008',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Fonte dos dados satelitais não especificada',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => r.remoteSensing && !r.remoteSensing.source,
    recommendation: 'Especificar fonte: Landsat, Sentinel, CBERS, etc.',
  },
  {
    code: 'KRCI-S009',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Data das imagens satelitais não especificada',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => r.remoteSensing && !r.remoteSensing.imageDate,
    recommendation: 'Especificar data das imagens utilizadas',
  },
  {
    code: 'KRCI-S010',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Resolução espacial não especificada',
    weight: 4,
    severity: 'low',
    mode: 'deep',
    check: (r) => r.remoteSensing && !r.remoteSensing.resolution,
    recommendation: 'Especificar resolução espacial (metros)',
  },
  {
    code: 'KRCI-S011',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Análise multitemporal não realizada',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.multitemporal,
    recommendation: 'Realizar análise multitemporal (antes/depois)',
  },
  {
    code: 'KRCI-S012',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Índices de vegetação não calculados',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.vegetationIndices,
    recommendation: 'Calcular índices: NDVI, EVI, SAVI, etc.',
  },
  {
    code: 'KRCI-S013',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Alertas de desmatamento não verificados (DETER/PRODES)',
    weight: 12,
    severity: 'high',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.deforestationAlerts,
    recommendation: 'Verificar alertas DETER/PRODES do INPE',
  },
  {
    code: 'KRCI-S014',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Focos de calor não verificados',
    weight: 10,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.remoteSensing?.fireHotspots,
    recommendation: 'Verificar focos de calor (INPE)',
  },
  {
    code: 'KRCI-S015',
    category: 'satelite',
    section: 'Remote Sensing',
    message: 'Análise de qualidade da água não realizada (se aplicável)',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => r.remoteSensing?.waterBodies && !r.remoteSensing?.waterQuality,
    recommendation: 'Analisar qualidade da água via sensoriamento remoto',
  },

  // ============================================================
  // BENCHMARK RULES (10 rules) - Peer comparison
  // ============================================================
  
  {
    code: 'KRCI-B001',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'Comparação com projetos similares não realizada',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.benchmark,
    recommendation: 'Comparar com projetos similares (região, commodity)',
  },
  {
    code: 'KRCI-B002',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'Grade médio não comparado com peers',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.benchmark?.gradeComparison,
    recommendation: 'Comparar grade médio com projetos similares',
  },
  {
    code: 'KRCI-B003',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'OPEX não comparado com peers',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.benchmark?.opexComparison,
    recommendation: 'Comparar OPEX com projetos similares',
  },
  {
    code: 'KRCI-B004',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'CAPEX não comparado com peers',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.benchmark?.capexComparison,
    recommendation: 'Comparar CAPEX com projetos similares',
  },
  {
    code: 'KRCI-B005',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'Taxa de recuperação não comparada com peers',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.benchmark?.recoveryComparison,
    recommendation: 'Comparar taxa de recuperação com projetos similares',
  },
  {
    code: 'KRCI-B006',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'Vida útil da mina não comparada com peers',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.benchmark?.mineLifeComparison,
    recommendation: 'Comparar vida útil com projetos similares',
  },
  {
    code: 'KRCI-B007',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'NPV não comparado com peers',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.benchmark?.npvComparison,
    recommendation: 'Comparar NPV com projetos similares',
  },
  {
    code: 'KRCI-B008',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'IRR não comparado com peers',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.benchmark?.irrComparison,
    recommendation: 'Comparar IRR com projetos similares',
  },
  {
    code: 'KRCI-B009',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'Payback não comparado com peers',
    weight: 6,
    severity: 'low',
    mode: 'deep',
    check: (r) => !r.benchmark?.paybackComparison,
    recommendation: 'Comparar payback com projetos similares',
  },
  {
    code: 'KRCI-B010',
    category: 'benchmark',
    section: 'Benchmark',
    message: 'Métricas ESG não comparadas com peers',
    weight: 8,
    severity: 'medium',
    mode: 'deep',
    check: (r) => !r.benchmark?.esgComparison,
    recommendation: 'Comparar métricas ESG com projetos similares',
  },
];

/**
 * Run KRCI scan with specified mode
 */
export function runKRCIScan(report: any, mode: ScanMode = 'full'): KRCIScanResult {
  const startTime = Date.now();
  
  // Filter rules by mode
  const applicableRules = KRCI_RULES.filter(rule => {
    if (mode === 'light') return rule.mode === 'light';
    if (mode === 'full') return rule.mode === 'light' || rule.mode === 'full';
    return true; // deep includes all
  });
  
  // Run checks
  const failedRules: typeof KRCI_RULES = [];
  let totalWeight = 0;
  let failedWeight = 0;
  
  for (const rule of applicableRules) {
    totalWeight += rule.weight;
    const failed = rule.check(report);
    if (failed) {
      failedWeight += rule.weight;
      failedRules.push(rule);
    }
  }
  
  // Calculate score
  const score = totalWeight > 0 ? Math.round(((totalWeight - failedWeight) / totalWeight) * 100) : 0;
  
  // Calculate category scores
  const categoryScores: Record<RuleCategory, number> = {
    tenure: 0,
    geo: 0,
    esg: 0,
    norma: 0,
    satelite: 0,
    benchmark: 0,
  };
  
  const categories: RuleCategory[] = ['tenure', 'geo', 'esg', 'norma', 'satelite', 'benchmark'];
  
  for (const category of categories) {
    const categoryRules = applicableRules.filter(r => r.category === category);
    const categoryFailed = failedRules.filter(r => r.category === category);
    
    const catTotalWeight = categoryRules.reduce((sum, r) => sum + r.weight, 0);
    const catFailedWeight = categoryFailed.reduce((sum, r) => sum + r.weight, 0);
    
    categoryScores[category] = catTotalWeight > 0 
      ? Math.round(((catTotalWeight - catFailedWeight) / catTotalWeight) * 100)
      : 100;
  }
  
  // Generate recommendations
  const recommendations = failedRules
    .filter(r => r.severity === 'critical' || r.severity === 'high')
    .map(r => r.recommendation || r.message)
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .slice(0, 10); // top 10
  
  const executionTime = Date.now() - startTime;
  
  return {
    mode,
    score,
    totalRules: applicableRules.length,
    passedRules: applicableRules.length - failedRules.length,
    failedRules: failedRules.length,
    krcis: failedRules.map(r => ({
      code: r.code,
      category: r.category,
      section: r.section,
      message: r.message,
      severity: r.severity,
      weight: r.weight,
      recommendation: r.recommendation,
    })),
    categoryScores,
    recommendations,
    executionTime,
  };
}

/**
 * Get rule statistics
 */
export function getKRCIStats() {
  const total = KRCI_RULES.length;
  const byMode = {
    light: KRCI_RULES.filter(r => r.mode === 'light').length,
    full: KRCI_RULES.filter(r => r.mode === 'light' || r.mode === 'full').length,
    deep: total,
  };
  const byCategory = {
    tenure: KRCI_RULES.filter(r => r.category === 'tenure').length,
    geo: KRCI_RULES.filter(r => r.category === 'geo').length,
    esg: KRCI_RULES.filter(r => r.category === 'esg').length,
    norma: KRCI_RULES.filter(r => r.category === 'norma').length,
    satelite: KRCI_RULES.filter(r => r.category === 'satelite').length,
    benchmark: KRCI_RULES.filter(r => r.category === 'benchmark').length,
  };
  const bySeverity = {
    critical: KRCI_RULES.filter(r => r.severity === 'critical').length,
    high: KRCI_RULES.filter(r => r.severity === 'high').length,
    medium: KRCI_RULES.filter(r => r.severity === 'medium').length,
    low: KRCI_RULES.filter(r => r.severity === 'low').length,
  };
  
  return {
    total,
    byMode,
    byCategory,
    bySeverity,
  };
}

