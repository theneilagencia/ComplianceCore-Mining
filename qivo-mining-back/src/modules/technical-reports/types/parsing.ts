/**
 * Type definitions for parsing summary stored in reports.parsingSummary
 * This JSON field contains all extracted metadata from uploaded documents
 */

export interface Section {
  id: string;
  title: string;
  contentText?: string;
  _uncertain?: boolean;
  hint?: string;
}

export interface ResourceEstimate {
  category: string; // Measured, Indicated, Inferred
  tonnage?: number;
  grade?: number;
  cutoffGrade?: number;
  _uncertain?: boolean;
  hint?: string;
}

export interface CompetentPerson {
  name?: string;
  qualification?: string;
  organization?: string;
  _uncertain?: boolean;
  hint?: string;
}

export interface EconomicAssumption {
  parameter: string;
  value?: string | number;
  _uncertain?: boolean;
  hint?: string;
}

/**
 * Structure stored in reports.parsingSummary column
 * Populated by parseAndNormalize() service during document upload
 */
export interface ParsedReportSummary {
  // Detection metadata
  detectedStandard: string;
  confidence: number;
  warnings: string[];
  totalFields: number;
  uncertainFields: number;

  // Document metadata extracted during parsing
  location?: string;
  commodity?: string;
  miningTitleNumber?: string;
  geologicalFormation?: string;
  geologicalAge?: string;
  coordinates?: string;
  environmentalLicense?: string;
  licenseType?: string;
  hasEIA?: boolean;

  // Structured content
  sections?: Section[];
  resourceEstimates?: ResourceEstimate[];
  competentPersons?: CompetentPerson[];
  economicAssumptions?: EconomicAssumption[];

  // Error tracking (for failed parsing)
  error?: string;
  failedAt?: string;
}

/**
 * Type guard to check if parsingSummary is valid
 */
export function isValidParsingSummary(
  data: unknown
): data is ParsedReportSummary {
  if (!data || typeof data !== "object") return false;
  const summary = data as Partial<ParsedReportSummary>;
  return (
    typeof summary.detectedStandard === "string" &&
    typeof summary.confidence === "number" &&
    Array.isArray(summary.warnings)
  );
}

/**
 * Helper to safely access parsingSummary with defaults
 */
export function getParsingSummary(
  data: unknown
): ParsedReportSummary | null {
  return isValidParsingSummary(data) ? data : null;
}
