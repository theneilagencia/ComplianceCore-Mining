/**
 * Pre-Certification Service
 * Validates compliance with international regulators (ASX, TSX, JSE, CRIRSCO)
 */

type Regulator = 'ASX' | 'TSX' | 'JSE' | 'CRIRSCO' | 'ANM';

interface ChecklistItem {
  id: string;
  requirement: string;
  category: string;
  mandatory: boolean;
  status: 'pass' | 'fail' | 'pending';
  notes?: string;
}

interface NormalizedData {
  metadata: any;
  sections: any[];
  resource_estimates: any[];
  competent_persons: any[];
  economic_assumptions: any;
  qa_qc?: string;
  geology?: string;
  environmental?: {
    license?: string;
    licenseNumber?: string;
    issuingAgency?: string;
  };
}

interface ComplianceResult {
  regulator: Regulator;
  score: number;
  totalItems: number;
  passedItems: number;
  failedItems: number;
  pendingItems: number;
  checklist: ChecklistItem[];
  pendingRequirements: string[];
  recommendations: string[];
}

/**
 * ASX Checklist (Australasian Code - JORC 2012)
 */
function getASXChecklist(data: NormalizedData): ChecklistItem[] {
  return [
    {
      id: 'ASX-001',
      requirement: 'Competent Person declaration present',
      category: 'Competent Person',
      mandatory: true,
      status: data.competent_persons && data.competent_persons.length > 0 ? 'pass' : 'fail',
    },
    {
      id: 'ASX-002',
      requirement: 'Competent Person qualifications (MAusIMM, FAusIMM)',
      category: 'Competent Person',
      mandatory: true,
      status: data.competent_persons?.some(cp => 
        cp.qualification?.includes('MAusIMM') || cp.qualification?.includes('FAusIMM')
      ) ? 'pass' : 'fail',
    },
    {
      id: 'ASX-003',
      requirement: 'Resource estimation methodology documented',
      category: 'Resources',
      mandatory: true,
      status: data.sections?.some(s => 
        s.title?.toLowerCase().includes('resource') || 
        s.title?.toLowerCase().includes('estimation')
      ) ? 'pass' : 'fail',
    },
    {
      id: 'ASX-004',
      requirement: 'Sampling and sub-sampling techniques described',
      category: 'Sampling',
      mandatory: true,
      status: data.sections?.some(s => 
        s.content_text?.toLowerCase().includes('sampling') ||
        s.content_text?.toLowerCase().includes('sub-sampling')
      ) ? 'pass' : 'pending',
    },
    {
      id: 'ASX-005',
      requirement: 'QA/QC procedures documented',
      category: 'Quality Assurance',
      mandatory: true,
      status: data.qa_qc ? 'pass' : 'fail',
    },
    {
      id: 'ASX-006',
      requirement: 'Geological interpretation and confidence',
      category: 'Geology',
      mandatory: true,
      status: data.geology ? 'pass' : 'pending',
    },
    {
      id: 'ASX-007',
      requirement: 'Cut-off grade criteria stated',
      category: 'Resources',
      mandatory: true,
      status: data.resource_estimates?.some(r => r.cutoff_grade) ? 'pass' : 'fail',
    },
    {
      id: 'ASX-008',
      requirement: 'Resource classification (Measured, Indicated, Inferred)',
      category: 'Resources',
      mandatory: true,
      status: data.resource_estimates?.length >= 2 ? 'pass' : 'fail',
    },
    {
      id: 'ASX-009',
      requirement: 'Effective date of report stated',
      category: 'Metadata',
      mandatory: true,
      status: data.metadata?.effective_date ? 'pass' : 'fail',
    },
    {
      id: 'ASX-010',
      requirement: 'Material assumptions and risks disclosed',
      category: 'Economic',
      mandatory: false,
      status: data.economic_assumptions ? 'pass' : 'pending',
    },
  ];
}

/**
 * TSX Checklist (Canadian Standard - NI 43-101)
 */
function getTSXChecklist(data: NormalizedData): ChecklistItem[] {
  return [
    {
      id: 'TSX-001',
      requirement: 'Qualified Person (QP) declaration',
      category: 'Qualified Person',
      mandatory: true,
      status: data.competent_persons && data.competent_persons.length > 0 ? 'pass' : 'fail',
    },
    {
      id: 'TSX-002',
      requirement: 'QP professional designation (P.Eng, P.Geo)',
      category: 'Qualified Person',
      mandatory: true,
      status: data.competent_persons?.some(cp => 
        cp.qualification?.includes('P.Eng') || cp.qualification?.includes('P.Geo')
      ) ? 'pass' : 'fail',
    },
    {
      id: 'TSX-003',
      requirement: 'Technical report format compliance (NI 43-101)',
      category: 'Format',
      mandatory: true,
      status: data.sections?.length >= 4 ? 'pass' : 'fail',
    },
    {
      id: 'TSX-004',
      requirement: 'Property description and location',
      category: 'Property',
      mandatory: true,
      status: data.metadata?.project_name ? 'pass' : 'fail',
    },
    {
      id: 'TSX-005',
      requirement: 'Mineral resource estimates with categories',
      category: 'Resources',
      mandatory: true,
      status: data.resource_estimates?.length >= 2 ? 'pass' : 'fail',
    },
    {
      id: 'TSX-006',
      requirement: 'Data verification procedures',
      category: 'Quality Assurance',
      mandatory: true,
      status: data.qa_qc ? 'pass' : 'fail',
    },
    {
      id: 'TSX-007',
      requirement: 'Adjacent properties disclosure',
      category: 'Property',
      mandatory: false,
      status: 'pending',
    },
    {
      id: 'TSX-008',
      requirement: 'Environmental and permitting considerations',
      category: 'Environmental',
      mandatory: false,
      status: 'pending',
    },
    {
      id: 'TSX-009',
      requirement: 'Economic analysis (if applicable)',
      category: 'Economic',
      mandatory: false,
      status: data.economic_assumptions ? 'pass' : 'pending',
    },
    {
      id: 'TSX-010',
      requirement: 'Recommendations and conclusions',
      category: 'Conclusions',
      mandatory: true,
      status: data.sections?.some(s => 
        s.title?.toLowerCase().includes('recommendation') ||
        s.title?.toLowerCase().includes('conclusion')
      ) ? 'pass' : 'pending',
    },
  ];
}

/**
 * JSE Checklist (South African Code - SAMREC)
 */
function getJSEChecklist(data: NormalizedData): ChecklistItem[] {
  return [
    {
      id: 'JSE-001',
      requirement: 'Competent Person (CP) declaration',
      category: 'Competent Person',
      mandatory: true,
      status: data.competent_persons && data.competent_persons.length > 0 ? 'pass' : 'fail',
    },
    {
      id: 'JSE-002',
      requirement: 'CP registration with SACNASP or ECSA',
      category: 'Competent Person',
      mandatory: true,
      status: data.competent_persons?.some(cp => 
        cp.qualification?.includes('SACNASP') || cp.qualification?.includes('ECSA')
      ) ? 'pass' : 'fail',
    },
    {
      id: 'JSE-003',
      requirement: 'SAMREC Code compliance statement',
      category: 'Compliance',
      mandatory: true,
      status: data.metadata?.detected_standard === 'SAMREC' ? 'pass' : 'pending',
    },
    {
      id: 'JSE-004',
      requirement: 'Mineral Resource classification',
      category: 'Resources',
      mandatory: true,
      status: data.resource_estimates?.length >= 2 ? 'pass' : 'fail',
    },
    {
      id: 'JSE-005',
      requirement: 'Mineral Reserve estimation (if applicable)',
      category: 'Reserves',
      mandatory: false,
      status: 'pending',
    },
    {
      id: 'JSE-006',
      requirement: 'QA/QC protocols documented',
      category: 'Quality Assurance',
      mandatory: true,
      status: data.qa_qc ? 'pass' : 'fail',
    },
    {
      id: 'JSE-007',
      requirement: 'Geological model and interpretation',
      category: 'Geology',
      mandatory: true,
      status: data.geology ? 'pass' : 'pending',
    },
    {
      id: 'JSE-008',
      requirement: 'Mining and metallurgical factors',
      category: 'Mining',
      mandatory: false,
      status: 'pending',
    },
    {
      id: 'JSE-009',
      requirement: 'Environmental and social considerations',
      category: 'Environmental',
      mandatory: false,
      status: 'pending',
    },
    {
      id: 'JSE-010',
      requirement: 'Effective date and currency of report',
      category: 'Metadata',
      mandatory: true,
      status: data.metadata?.effective_date ? 'pass' : 'fail',
    },
  ];
}

/**
 * CRIRSCO Checklist (International Template)
 */
function getCRIRSCOChecklist(data: NormalizedData): ChecklistItem[] {
  return [
    {
      id: 'CRIRSCO-001',
      requirement: 'Competent/Qualified Person declaration',
      category: 'Competent Person',
      mandatory: true,
      status: data.competent_persons && data.competent_persons.length > 0 ? 'pass' : 'fail',
    },
    {
      id: 'CRIRSCO-002',
      requirement: 'Professional membership and experience',
      category: 'Competent Person',
      mandatory: true,
      status: data.competent_persons?.some(cp => cp.qualification) ? 'pass' : 'fail',
    },
    {
      id: 'CRIRSCO-003',
      requirement: 'Public reporting compliance',
      category: 'Compliance',
      mandatory: true,
      status: 'pass',
    },
    {
      id: 'CRIRSCO-004',
      requirement: 'Transparency in reporting',
      category: 'Transparency',
      mandatory: true,
      status: data.sections?.length >= 3 ? 'pass' : 'fail',
    },
    {
      id: 'CRIRSCO-005',
      requirement: 'Materiality principle applied',
      category: 'Materiality',
      mandatory: true,
      status: 'pass',
    },
    {
      id: 'CRIRSCO-006',
      requirement: 'Competence verification',
      category: 'Competent Person',
      mandatory: true,
      status: data.competent_persons?.some(cp => cp.organization) ? 'pass' : 'pending',
    },
    {
      id: 'CRIRSCO-007',
      requirement: 'Resource/Reserve classification',
      category: 'Resources',
      mandatory: true,
      status: data.resource_estimates?.length >= 2 ? 'pass' : 'fail',
    },
    {
      id: 'CRIRSCO-008',
      requirement: 'Data quality and verification',
      category: 'Quality Assurance',
      mandatory: true,
      status: data.qa_qc ? 'pass' : 'fail',
    },
    {
      id: 'CRIRSCO-009',
      requirement: 'Reasonable prospects for eventual economic extraction',
      category: 'Economic',
      mandatory: true,
      status: data.economic_assumptions ? 'pass' : 'pending',
    },
    {
      id: 'CRIRSCO-010',
      requirement: 'Annual review and update',
      category: 'Maintenance',
      mandatory: false,
      status: 'pending',
    },
  ];
}

/**
 * ANM Checklist (Agência Nacional de Mineração - Brasil)
 * Baseado em CBRR e NRM-01
 */
function getANMChecklist(data: NormalizedData): ChecklistItem[] {
  return [
    {
      id: 'ANM-001',
      requirement: 'Pessoa Qualificada (PQ) declarada com registro CREA',
      category: 'Pessoa Qualificada',
      mandatory: true,
      status: data.competent_persons && data.competent_persons.length > 0 && 
              data.competent_persons[0].creaNumber ? 'pass' : 'fail',
    },
    {
      id: 'ANM-002',
      requirement: 'CPF da Pessoa Qualificada informado',
      category: 'Pessoa Qualificada',
      mandatory: true,
      status: data.competent_persons?.[0]?.cpf ? 'pass' : 'fail',
    },
    {
      id: 'ANM-003',
      requirement: 'Número do processo ANM informado',
      category: 'Conformidade Regulatória',
      mandatory: true,
      status: data.metadata?.anmProcess ? 'pass' : 'fail',
    },
    {
      id: 'ANM-004',
      requirement: 'Licença ambiental válida (LP, LI ou LO)',
      category: 'Licenciamento Ambiental',
      mandatory: true,
      status: data.environmental?.license && data.environmental?.licenseNumber ? 'pass' : 'fail',
    },
    {
      id: 'ANM-005',
      requirement: 'Órgão emissor da licença ambiental especificado',
      category: 'Licenciamento Ambiental',
      mandatory: true,
      status: data.environmental?.issuingAgency ? 'pass' : 'fail',
    },
    {
      id: 'ANM-006',
      requirement: 'Classificação de recursos conforme CBRR (Medido, Indicado, Inferido)',
      category: 'Recursos Minerais',
      mandatory: true,
      status: data.resource_estimates && data.resource_estimates.length > 0 ? 'pass' : 'fail',
    },
    {
      id: 'ANM-007',
      requirement: 'Taxa CFEM (Compensação Financeira) especificada',
      category: 'Premissas Econômicas',
      mandatory: true,
      status: data.economic_assumptions?.royalties || data.economic_assumptions?.cfemRate ? 'pass' : 'fail',
    },
    {
      id: 'ANM-008',
      requirement: 'Metodologia de estimação de recursos documentada',
      category: 'Recursos Minerais',
      mandatory: true,
      status: data.sections?.some(s => 
        s.title?.toLowerCase().includes('metodologia') || 
        s.title?.toLowerCase().includes('methodology')
      ) ? 'pass' : 'pending',
    },
    {
      id: 'ANM-009',
      requirement: 'Procedimentos de QA/QC documentados',
      category: 'Controle de Qualidade',
      mandatory: true,
      status: data.qa_qc ? 'pass' : 'fail',
    },
    {
      id: 'ANM-010',
      requirement: 'Interpretação geológica documentada',
      category: 'Geologia',
      mandatory: true,
      status: data.geology ? 'pass' : 'pending',
    },
  ];
}

/**
 * Run pre-certification check
 */
export function runPreCertification(
  regulator: Regulator,
  normalizedData: NormalizedData
): ComplianceResult {
  let checklist: ChecklistItem[];

  switch (regulator) {
    case 'ASX':
      checklist = getASXChecklist(normalizedData);
      break;
    case 'TSX':
      checklist = getTSXChecklist(normalizedData);
      break;
    case 'JSE':
      checklist = getJSEChecklist(normalizedData);
      break;
    case 'CRIRSCO':
      checklist = getCRIRSCOChecklist(normalizedData);
      break;
    case 'ANM':
      checklist = getANMChecklist(normalizedData);
      break;
    default:
      throw new Error(`Unknown regulator: ${regulator}`);
  }

  const totalItems = checklist.length;
  const passedItems = checklist.filter(item => item.status === 'pass').length;
  const failedItems = checklist.filter(item => item.status === 'fail').length;
  const pendingItems = checklist.filter(item => item.status === 'pending').length;

  const score = (passedItems / totalItems) * 100;

  const pendingRequirements = checklist
    .filter(item => item.status === 'fail' || item.status === 'pending')
    .map(item => `[${item.id}] ${item.requirement}`);

  const recommendations: string[] = [];
  if (failedItems > 0) {
    recommendations.push(`${failedItems} mandatory requirements failed. Address these before submission.`);
  }
  if (pendingItems > 0) {
    recommendations.push(`${pendingItems} requirements pending review. Complete documentation.`);
  }
  if (score >= 90) {
    recommendations.push('Report is in excellent compliance. Ready for submission.');
  } else if (score >= 70) {
    recommendations.push('Report meets minimum requirements. Consider addressing pending items.');
  } else {
    recommendations.push('Report requires significant improvements before submission.');
  }

  return {
    regulator,
    score,
    totalItems,
    passedItems,
    failedItems,
    pendingItems,
    checklist,
    pendingRequirements,
    recommendations,
  };
}

