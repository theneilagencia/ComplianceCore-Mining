/**
 * CBRR (Código Brasileiro de Recursos e Reservas Minerais) Mapper
 * Maps normalized.json to CBRR standard structure
 * 
 * CBRR é o padrão brasileiro de classificação de recursos e reservas minerais,
 * alinhado com os padrões internacionais CRIRSCO mas adaptado à legislação brasileira (ANM).
 * 
 * Principais diferenças do CBRR:
 * - Categorias: Medido, Indicado, Inferido (similar a JORC: Measured, Indicated, Inferred)
 * - Reservas: Provada, Provável (similar a JORC: Proved, Probable)
 * - Requer registro na ANM (Agência Nacional de Mineração)
 * - Exige Pessoa Qualificada (PQ) registrada no CREA/CONFEA
 * - Conformidade com NRM-01 (Norma Reguladora de Mineração)
 */

interface NormalizedData {
  metadata?: {
    project_name?: string;
    company?: string;
    effective_date?: string;
    detected_standard?: string;
    anm_process?: string; // Número do processo ANM
    dnpm_code?: string; // Código DNPM (antigo)
  };
  sections?: Array<{
    title?: string;
    content_text?: string;
  }>;
  resource_estimates?: Array<{
    category?: string;
    tonnage?: number;
    grade?: Record<string, number>;
    cutoff_grade?: Record<string, number>;
  }>;
  competent_persons?: Array<{
    name?: string;
    qualification?: string;
    organization?: string;
    role?: string;
    crea_number?: string; // Registro CREA (obrigatório no Brasil)
    cpf?: string; // CPF da Pessoa Qualificada
  }>;
  economic_assumptions?: {
    recovery_rate?: number;
    mining_cost?: number;
    processing_cost?: number;
    royalties?: number; // CFEM (Compensação Financeira pela Exploração Mineral)
  };
  qa_qc?: string;
  geology?: string;
  environmental?: {
    license?: string; // Licença ambiental (LP, LI, LO)
    license_number?: string;
    issuing_agency?: string; // Órgão emissor (IBAMA, órgão estadual)
  };
  brand?: {
    logo_s3?: string;
    company_display?: string;
  };
}

/**
 * Mapeia categorias internacionais para CBRR
 */
function mapCategoryToCBRR(category: string): string {
  const cat = category.toLowerCase();
  
  // Measured → Medido
  if (cat.includes('measured') || cat.includes('medido')) return 'Medido';
  
  // Indicated → Indicado
  if (cat.includes('indicated') || cat.includes('indicado')) return 'Indicado';
  
  // Inferred → Inferido
  if (cat.includes('inferred') || cat.includes('inferido')) return 'Inferido';
  
  // Proved Reserve → Reserva Provada
  if (cat.includes('proved') || cat.includes('provada')) return 'Reserva Provada';
  
  // Probable Reserve → Reserva Provável
  if (cat.includes('probable') || cat.includes('provável')) return 'Reserva Provável';
  
  return category; // Retorna original se não reconhecido
}

export function toStandard(n: NormalizedData) {
  const sections = n.sections || [];
  
  function findSection(titleSubstring: string) {
    for (const s of sections) {
      const title = (s.title || "").toLowerCase();
      if (title.includes(titleSubstring.toLowerCase())) {
        return s;
      }
    }
    return { title: "", content_text: "" };
  }

  const resources = n.resource_estimates || [];
  const tableRows = resources.map(r => ({
    category: mapCategoryToCBRR(r.category || "-"),
    tonnage: r.tonnage || 0,
    grades: r.grade || {},
    cutoff: r.cutoff_grade || {},
  }));

  // Estrutura específica CBRR
  return {
    standard: "CBRR",
    standard_full_name: "Código Brasileiro de Recursos e Reservas Minerais",
    regulatory_body: "ANM - Agência Nacional de Mineração",
    
    // Metadados do projeto
    project_name: n.metadata?.project_name || "-",
    company: n.metadata?.company || "-",
    effective_date: n.metadata?.effective_date || "-",
    anm_process: n.metadata?.anm_process || "Não informado",
    dnpm_code: n.metadata?.dnpm_code || "Não informado",
    
    // Pessoa Qualificada (PQ) - equivalente a Competent Person
    qualified_persons: (n.competent_persons || []).map(p => ({
      name: p.name || "-",
      qualification: p.qualification || "-",
      organization: p.organization || "-",
      role: p.role || "Pessoa Qualificada (PQ)",
      crea_number: p.crea_number || "Não informado",
      cpf: p.cpf || "Não informado",
    })),
    
    // QA/QC e Geologia
    qa_qc: n.qa_qc || "Não especificado",
    geology: n.geology || "Não especificado",
    
    // Premissas Econômicas (incluindo CFEM)
    economic_assumptions: {
      ...(n.economic_assumptions || {}),
      cfem_rate: n.economic_assumptions?.royalties || 0, // CFEM (1% a 4% dependendo da substância)
    },
    
    // Licenciamento Ambiental (obrigatório no Brasil)
    environmental_licensing: {
      license_type: n.environmental?.license || "Não informado",
      license_number: n.environmental?.license_number || "Não informado",
      issuing_agency: n.environmental?.issuing_agency || "Não informado",
    },
    
    // Seções do relatório (adaptadas para CBRR)
    sections: {
      introducao: findSection("introdução") || findSection("introduction"),
      localizacao: findSection("localização") || findSection("location"),
      geologia: findSection("geologia") || findSection("geology"),
      recursos_minerais: findSection("recursos") || findSection("resources"),
      reservas_minerais: findSection("reservas") || findSection("reserves"),
      metodologia: findSection("metodologia") || findSection("methodology"),
      qa_qc: findSection("qa/qc") || findSection("quality"),
      conclusoes: findSection("conclusões") || findSection("conclusions"),
    },
    
    // Tabela de Recursos e Reservas (classificação CBRR)
    resources_table: tableRows,
    
    // Conformidade ANM
    anm_compliance: {
      norm: "NRM-01 - Norma Reguladora de Mineração",
      classification_system: "CBRR (alinhado com CRIRSCO)",
      requires_registration: true,
      registration_body: "ANM - Agência Nacional de Mineração",
    },
    
    // Branding
    _brand: {
      logo_s3: n.brand?.logo_s3,
      company_display: n.brand?.company_display || n.metadata?.company || "-",
    },
  };
}

/**
 * Converte de JORC para CBRR
 */
export function fromJORC(jorcData: any) {
  return {
    ...jorcData,
    standard: "CBRR",
    standard_full_name: "Código Brasileiro de Recursos e Reservas Minerais",
    regulatory_body: "ANM - Agência Nacional de Mineração",
    
    // Mapeia Competent Person → Pessoa Qualificada
    qualified_persons: (jorcData.competent_persons || []).map((p: any) => ({
      ...p,
      role: "Pessoa Qualificada (PQ)",
      crea_number: "A ser informado",
      cpf: "A ser informado",
    })),
    
    // Mapeia categorias
    resources_table: (jorcData.resources_table || []).map((r: any) => ({
      ...r,
      category: mapCategoryToCBRR(r.category),
    })),
    
    // Adiciona campos obrigatórios brasileiros
    anm_process: "A ser informado",
    environmental_licensing: {
      license_type: "A ser informado",
      license_number: "A ser informado",
      issuing_agency: "A ser informado",
    },
    anm_compliance: {
      norm: "NRM-01 - Norma Reguladora de Mineração",
      classification_system: "CBRR (alinhado com CRIRSCO)",
      requires_registration: true,
      registration_body: "ANM - Agência Nacional de Mineração",
    },
  };
}

/**
 * Converte de NI 43-101 para CBRR
 */
export function fromNI43(ni43Data: any) {
  return {
    ...ni43Data,
    standard: "CBRR",
    standard_full_name: "Código Brasileiro de Recursos e Reservas Minerais",
    regulatory_body: "ANM - Agência Nacional de Mineração",
    
    // Mapeia Qualified Person → Pessoa Qualificada
    qualified_persons: (ni43Data.qualified_persons || []).map((p: any) => ({
      ...p,
      role: "Pessoa Qualificada (PQ)",
      crea_number: "A ser informado",
      cpf: "A ser informado",
    })),
    
    // Mapeia categorias
    resources_table: (ni43Data.resources_table || []).map((r: any) => ({
      ...r,
      category: mapCategoryToCBRR(r.category),
    })),
    
    // Adiciona campos obrigatórios brasileiros
    anm_process: "A ser informado",
    environmental_licensing: {
      license_type: "A ser informado",
      license_number: "A ser informado",
      issuing_agency: "A ser informado",
    },
    anm_compliance: {
      norm: "NRM-01 - Norma Reguladora de Mineração",
      classification_system: "CBRR (alinhado com CRIRSCO)",
      requires_registration: true,
      registration_body: "ANM - Agência Nacional de Mineração",
    },
  };
}

