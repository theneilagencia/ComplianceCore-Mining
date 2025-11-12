/**
 * Audit Service - KRCI (Key Risk Compliance Indicators)
 * 
 * Engine rule-based para auditoria de relatórios técnicos minerais
 * conforme padrões internacionais (JORC, NI 43-101, PERC, SAMREC, CRIRSCO)
 */

export interface NormalizedReport {
  metadata?: {
    title?: string;
    projectName?: string;
    effectiveDate?: string;
    standard?: string;
    anmProcess?: string; // Número do processo ANM (CBRR)
    dnpmCode?: string; // Código DNPM antigo (CBRR)
  };
  sections?: Array<{
    title: string;
    content: string;
  }>;
  resourceEstimates?: Array<{
    category?: string;
    tonnage?: number;
    grade?: number;
    cutoffGrade?: number;
  }>;
  competentPersons?: Array<{
    name?: string;
    qualification?: string;
    organization?: string;
    creaNumber?: string; // Registro CREA (CBRR)
    cpf?: string; // CPF da Pessoa Qualificada (CBRR)
  }>;
  economicAssumptions?: {
    capex?: number;
    opex?: number;
    recoveryRate?: number;
    royalties?: number; // CFEM (CBRR)
    cfemRate?: number; // Taxa CFEM (CBRR)
  };
  qaQc?: {
    samplingMethod?: string;
    qualityControl?: string;
  };
  environmental?: {
    license?: string; // Tipo de licença ambiental (LP, LI, LO) (CBRR)
    licenseNumber?: string; // Número da licença (CBRR)
    issuingAgency?: string; // Órgão emissor (IBAMA, estadual) (CBRR)
  };
}

interface AuditRule {
  code: string;
  section: string;
  message: string;
  weight: number;
  severity: "critical" | "high" | "medium" | "low";
  check: (report: NormalizedReport) => boolean;
}

export interface KRCI {
  code: string;
  section: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  weight: number;
}

export interface AuditResult {
  score: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  krcis: KRCI[];
  recommendations: string[];
}

/**
 * Helper: Verifica se a data é mais antiga que X meses
 */
function isOlderThan(dateStr: string | undefined, months: number): boolean {
  if (!dateStr) return true;
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMonths = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return diffMonths > months;
  } catch {
    return true;
  }
}

/**
 * 20+ Regras KRCI para auditoria
 */
const AUDIT_RULES: AuditRule[] = [
  // CRITICAL RULES (weight >= 15)
  {
    code: "KRCI-001",
    section: "Competent Person",
    message: "Pessoa Competente não declarada ou incompleta",
    weight: 20,
    severity: "critical",
    check: (r) => !r.competentPersons || r.competentPersons.length === 0 || !r.competentPersons[0]?.name,
  },
  {
    code: "KRCI-002",
    section: "Resource Estimate",
    message: "Estimativa de recursos ausente ou sem dados",
    weight: 18,
    severity: "critical",
    check: (r) => !r.resourceEstimates || r.resourceEstimates.length === 0,
  },
  {
    code: "KRCI-003",
    section: "Metadata",
    message: "Data efetiva do relatório ausente",
    weight: 15,
    severity: "critical",
    check: (r) => !r.metadata?.effectiveDate,
  },

  // HIGH SEVERITY RULES (weight 10-14)
  {
    code: "KRCI-004",
    section: "QA/QC",
    message: "Controle de qualidade (QA/QC) não documentado",
    weight: 12,
    severity: "high",
    check: (r) => !r.qaQc || !r.qaQc.samplingMethod,
  },
  {
    code: "KRCI-005",
    section: "Economic Assumptions",
    message: "Premissas econômicas ausentes (CAPEX/OPEX)",
    weight: 12,
    severity: "high",
    check: (r) => !r.economicAssumptions || (!r.economicAssumptions.capex && !r.economicAssumptions.opex),
  },
  {
    code: "KRCI-006",
    section: "Resource Estimate",
    message: "Cutoff grade não especificado",
    weight: 10,
    severity: "high",
    check: (r) => {
      if (!r.resourceEstimates) return true;
      return r.resourceEstimates.every(re => !re.cutoffGrade);
    },
  },
  {
    code: "KRCI-007",
    section: "Competent Person",
    message: "Qualificação da Pessoa Competente não especificada",
    weight: 10,
    severity: "high",
    check: (r) => {
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.qualification;
    },
  },
  {
    code: "KRCI-008",
    section: "Metadata",
    message: "Relatório com data superior a 24 meses (desatualizado)",
    weight: 10,
    severity: "high",
    check: (r) => isOlderThan(r.metadata?.effectiveDate, 24),
  },

  // MEDIUM SEVERITY RULES (weight 5-9)
  {
    code: "KRCI-009",
    section: "Metadata",
    message: "Nome do projeto ausente",
    weight: 8,
    severity: "medium",
    check: (r) => !r.metadata?.projectName,
  },
  {
    code: "KRCI-010",
    section: "Sections",
    message: "Relatório possui menos de 5 seções principais",
    weight: 7,
    severity: "medium",
    check: (r) => !r.sections || r.sections.length < 5,
  },
  {
    code: "KRCI-011",
    section: "Resource Estimate",
    message: "Categoria de recurso não especificada (Measured/Indicated/Inferred)",
    weight: 8,
    severity: "medium",
    check: (r) => {
      if (!r.resourceEstimates) return true;
      return r.resourceEstimates.every(re => !re.category);
    },
  },
  {
    code: "KRCI-012",
    section: "Economic Assumptions",
    message: "Taxa de recuperação não especificada",
    weight: 6,
    severity: "medium",
    check: (r) => !r.economicAssumptions?.recoveryRate,
  },
  {
    code: "KRCI-013",
    section: "Competent Person",
    message: "Organização da Pessoa Competente não especificada",
    weight: 5,
    severity: "medium",
    check: (r) => {
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.organization;
    },
  },
  {
    code: "KRCI-014",
    section: "Metadata",
    message: "Padrão internacional não identificado",
    weight: 7,
    severity: "medium",
    check: (r) => !r.metadata?.standard,
  },

  // LOW SEVERITY RULES (weight < 5)
  {
    code: "KRCI-015",
    section: "Sections",
    message: "Seção 'Executive Summary' ausente",
    weight: 4,
    severity: "low",
    check: (r) => {
      if (!r.sections) return true;
      return !r.sections.some(s => s.title.toLowerCase().includes("executive summary"));
    },
  },
  {
    code: "KRCI-016",
    section: "Sections",
    message: "Seção 'Introduction' ausente",
    weight: 3,
    severity: "low",
    check: (r) => {
      if (!r.sections) return true;
      return !r.sections.some(s => s.title.toLowerCase().includes("introduction"));
    },
  },
  {
    code: "KRCI-017",
    section: "Sections",
    message: "Seção 'Geology' ausente",
    weight: 4,
    severity: "low",
    check: (r) => {
      if (!r.sections) return true;
      return !r.sections.some(s => s.title.toLowerCase().includes("geology") || s.title.toLowerCase().includes("geological"));
    },
  },
  {
    code: "KRCI-018",
    section: "Sections",
    message: "Seção 'Sampling and Analysis' ausente",
    weight: 4,
    severity: "low",
    check: (r) => {
      if (!r.sections) return true;
      return !r.sections.some(s => s.title.toLowerCase().includes("sampling") || s.title.toLowerCase().includes("analysis"));
    },
  },
  {
    code: "KRCI-019",
    section: "Resource Estimate",
    message: "Tonnage não especificado em uma ou mais categorias",
    weight: 3,
    severity: "low",
    check: (r) => {
      if (!r.resourceEstimates) return true;
      return r.resourceEstimates.some(re => !re.tonnage);
    },
  },
  {
    code: "KRCI-020",
    section: "Resource Estimate",
    message: "Grade não especificado em uma ou mais categorias",
    weight: 3,
    severity: "low",
    check: (r) => {
      if (!r.resourceEstimates) return true;
      return r.resourceEstimates.some(re => !re.grade);
    },
  },
  {
    code: "KRCI-021",
    section: "QA/QC",
    message: "Método de amostragem não detalhado",
    weight: 4,
    severity: "low",
    check: (r) => {
      if (!r.qaQc) return true;
      return !r.qaQc.samplingMethod || r.qaQc.samplingMethod.length < 20;
    },
  },
  {
    code: "KRCI-022",
    section: "Metadata",
    message: "Título do relatório muito curto ou genérico",
    weight: 2,
    severity: "low",
    check: (r) => !r.metadata?.title || r.metadata.title.length < 20,
  },

  // ========================================
  // REGRAS ESPECÍFICAS CBRR/ANM (BRASIL)
  // ========================================
  
  // CRITICAL RULES - CBRR/ANM
  {
    code: "KRCI-CBRR-001",
    section: "Pessoa Qualificada (PQ)",
    message: "CBRR: Registro CREA da Pessoa Qualificada não informado (obrigatório pela ANM)",
    weight: 20,
    severity: "critical",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false; // Só aplica para CBRR
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.creaNumber;
    },
  },
  {
    code: "KRCI-CBRR-002",
    section: "Conformidade ANM",
    message: "CBRR: Número do processo ANM não informado (obrigatório para registro)",
    weight: 18,
    severity: "critical",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      return !r.metadata?.anmProcess;
    },
  },
  {
    code: "KRCI-CBRR-003",
    section: "Licenciamento Ambiental",
    message: "CBRR: Licença ambiental não informada (obrigatória pela legislação brasileira)",
    weight: 16,
    severity: "critical",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      return !r.environmental?.license || !r.environmental?.licenseNumber;
    },
  },

  // HIGH SEVERITY RULES - CBRR/ANM
  {
    code: "KRCI-CBRR-004",
    section: "Pessoa Qualificada (PQ)",
    message: "CBRR: CPF da Pessoa Qualificada não informado",
    weight: 12,
    severity: "high",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      if (!r.competentPersons || r.competentPersons.length === 0) return true;
      return !r.competentPersons[0]?.cpf;
    },
  },
  {
    code: "KRCI-CBRR-005",
    section: "Licenciamento Ambiental",
    message: "CBRR: Órgão emissor da licença ambiental não especificado (IBAMA, órgão estadual)",
    weight: 10,
    severity: "high",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      return !r.environmental?.issuingAgency;
    },
  },
  {
    code: "KRCI-CBRR-006",
    section: "Premissas Econômicas",
    message: "CBRR: Taxa CFEM (Compensação Financeira pela Exploração Mineral) não especificada",
    weight: 10,
    severity: "high",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      return !r.economicAssumptions?.royalties && !r.economicAssumptions?.cfemRate;
    },
  },

  // MEDIUM SEVERITY RULES - CBRR/ANM
  {
    code: "KRCI-CBRR-007",
    section: "Classificação de Recursos",
    message: "CBRR: Categorias devem usar nomenclatura brasileira (Medido, Indicado, Inferido)",
    weight: 8,
    severity: "medium",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      if (!r.resourceEstimates) return true;
      return r.resourceEstimates.some(re => {
        const cat = (re.category || '').toLowerCase();
        return cat.includes('measured') || cat.includes('indicated') || cat.includes('inferred');
      });
    },
  },
  {
    code: "KRCI-CBRR-008",
    section: "Conformidade ANM",
    message: "CBRR: Código DNPM (antigo) não informado, se aplicável",
    weight: 5,
    severity: "medium",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      // Apenas warning se não informado
      return false; // Não obrigatório, apenas recomendado
    },
  },

  // LOW SEVERITY RULES - CBRR/ANM
  {
    code: "KRCI-CBRR-009",
    section: "Seções do Relatório",
    message: "CBRR: Seção 'Localização' ausente (recomendada pela NRM-01)",
    weight: 4,
    severity: "low",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      if (!r.sections) return true;
      return !r.sections.some(s => s.title.toLowerCase().includes("localização") || s.title.toLowerCase().includes("location"));
    },
  },
  {
    code: "KRCI-CBRR-010",
    section: "Seções do Relatório",
    message: "CBRR: Seção 'Conclusões' ausente (recomendada pela NRM-01)",
    weight: 3,
    severity: "low",
    check: (r) => {
      if (r.metadata?.standard !== 'CBRR') return false;
      if (!r.sections) return true;
      return !r.sections.some(s => s.title.toLowerCase().includes("conclusões") || s.title.toLowerCase().includes("conclusions"));
    },
  },
];

/**
 * Executa auditoria completa ou parcial
 */
export function runAudit(
  normalizedReport: NormalizedReport,
  auditType: "full" | "partial" = "full"
): AuditResult {
  const krcis: KRCI[] = [];
  const totalWeight = AUDIT_RULES.reduce((sum, rule) => sum + rule.weight, 0);
  let penalty = 0;

  for (const rule of AUDIT_RULES) {
    // Se auditoria parcial, pular regras de severidade "low"
    if (auditType === "partial" && rule.severity === "low") {
      continue;
    }

    // Executar check da regra
    const failed = rule.check(normalizedReport);

    if (failed) {
      penalty += rule.weight;
      krcis.push({
        code: rule.code,
        section: rule.section,
        message: rule.message,
        severity: rule.severity,
        weight: rule.weight,
      });
    }
  }

  // Calcular score (0-100)
  const score = Math.max(0, Math.round(100 - (penalty / totalWeight) * 100));

  // Gerar recomendações
  const recommendations = krcis.map(
    (k) => `[${k.severity.toUpperCase()}] ${k.section}: ${k.message}`
  );

  return {
    score,
    totalRules: auditType === "full" ? AUDIT_RULES.length : AUDIT_RULES.filter(r => r.severity !== "low").length,
    passedRules: (auditType === "full" ? AUDIT_RULES.length : AUDIT_RULES.filter(r => r.severity !== "low").length) - krcis.length,
    failedRules: krcis.length,
    krcis,
    recommendations,
  };
}

/**
 * Gera sumário textual da auditoria
 */
export function generateAuditSummary(result: AuditResult): string {
  const { score, totalRules, passedRules, failedRules, krcis } = result;

  let summary = `Auditoria KRCI Completa\n\n`;
  summary += `Pontuação: ${score}%\n`;
  summary += `Regras Verificadas: ${totalRules}\n`;
  summary += `Aprovadas: ${passedRules}\n`;
  summary += `Reprovadas: ${failedRules}\n\n`;

  if (krcis.length > 0) {
    summary += `KRCI Identificados:\n`;
    krcis.forEach((k, i) => {
      summary += `${i + 1}. [${k.code}] ${k.section}: ${k.message} (${k.severity})\n`;
    });
  } else {
    summary += `Nenhum KRCI identificado. Relatório em conformidade total.\n`;
  }

  return summary;
}

