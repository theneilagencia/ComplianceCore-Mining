/**
 * Adapter para mapear formato parsed (NormalizedReport do parsing.ts)
 * para formato esperado pelo audit service
 */

import type { NormalizedReport as ParsedReport } from "./parsing";

interface AuditNormalizedReport {
  metadata?: {
    title?: string;
    projectName?: string;
    effectiveDate?: string;
    standard?: string;
    anmProcess?: string;
    dnpmCode?: string;
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
    creaNumber?: string;
    cpf?: string;
  }>;
  economicAssumptions?: {
    capex?: number;
    opex?: number;
    recoveryRate?: number;
    royalties?: number;
    cfemRate?: number;
  };
  qaQc?: {
    samplingMethod?: string;
    qualityControl?: string;
  };
  environmental?: {
    license?: string;
    licenseNumber?: string;
    issuingAgency?: string;
  };
}

/**
 * Converte NormalizedReport do parsing para formato do audit
 */
export function adaptParsedReportForAudit(
  parsedReport: ParsedReport,
  reportTitle?: string,
  reportCreatedAt?: Date | null
): AuditNormalizedReport {
  return {
    metadata: {
      title: reportTitle,
      projectName: undefined,
      effectiveDate: reportCreatedAt?.toISOString(),
      standard: parsedReport.metadata.detectedStandard,
      anmProcess: undefined,
      dnpmCode: undefined,
    },
    sections: parsedReport.sections.map(s => ({
      title: s.title,
      content: s.contentText || "",
    })),
    resourceEstimates: parsedReport.resourceEstimates.map(r => ({
      category: r.category,
      tonnage: r.tonnage,
      grade: r.grade,
      cutoffGrade: r.cutoffGrade,
    })),
    competentPersons: parsedReport.competentPersons.map(cp => ({
      name: cp.name,
      qualification: cp.qualification,
      organization: cp.organization,
      creaNumber: undefined,
      cpf: undefined,
    })),
    economicAssumptions: {
      capex: parsedReport.economicAssumptions.find(e => 
        e.parameter.toLowerCase().includes('capex')
      )?.value as number | undefined,
      opex: parsedReport.economicAssumptions.find(e => 
        e.parameter.toLowerCase().includes('opex')
      )?.value as number | undefined,
      recoveryRate: parsedReport.economicAssumptions.find(e => 
        e.parameter.toLowerCase().includes('recovery')
      )?.value as number | undefined,
      royalties: parsedReport.economicAssumptions.find(e => 
        e.parameter.toLowerCase().includes('royalt') || 
        e.parameter.toLowerCase().includes('cfem')
      )?.value as number | undefined,
      cfemRate: undefined,
    },
    qaQc: {
      samplingMethod: parsedReport.sections.find(s => 
        s.title.toLowerCase().includes('sampling') || 
        s.title.toLowerCase().includes('qa')
      )?.contentText || undefined,
      qualityControl: parsedReport.sections.find(s => 
        s.title.toLowerCase().includes('qc') || 
        s.title.toLowerCase().includes('quality')
      )?.contentText || undefined,
    },
    environmental: {
      license: undefined,
      licenseNumber: undefined,
      issuingAgency: undefined,
    },
  };
}
