/**
 * Type definitions for Technical Reports module
 * Provides type-safe interfaces for report generation, auditing, and management
 */

export type ReportStandard = 
  | "JORC_2012" 
  | "NI_43_101" 
  | "PERC" 
  | "SAMREC" 
  | "CRIRSCO" 
  | "SEC_SK_1300" 
  | "CBRR";

export type ReportStatus = 
  | "draft" 
  | "parsing" 
  | "parsing_failed"
  | "needs_review" 
  | "ready_for_audit" 
  | "audited" 
  | "certified" 
  | "exported";

export type ReportSourceType = "internal" | "external";

export interface ParsingSummary {
  language?: string;
  projectName?: string;
  location?: string;
  metadata?: Record<string, any>;
  detectedStandard?: ReportStandard;
  confidence?: number;
  warnings?: string[];
  totalFields?: number;
  uncertainFields?: number;
  error?: string;
  errorStack?: string;
  failedAt?: string;
  attemptCount?: number;
  parsedAt?: string;
  migrationNote?: string;
}

export interface Report {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  standard: ReportStandard;
  status: ReportStatus;
  sourceType: ReportSourceType | null;
  detectedStandard: ReportStandard | null;
  s3NormalizedUrl: string | null;
  s3OriginalUrl: string | null;
  parsingSummary: ParsingSummary | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ReportListResponse {
  items: Report[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CreateReportInput {
  standard: ReportStandard;
  title: string;
  projectName?: string;
  location?: string;
  language?: "pt-BR" | "en-US" | "es-ES" | "fr-FR";
  metadata?: Record<string, any>;
}

export interface CreateReportResponse {
  reportId: string;
  standard: ReportStandard;
  title: string;
  language: string;
  status: ReportStatus;
  message: string;
}

export interface QuotaInfo {
  plan: string;
  reportsUsed: number;
  reportsLimit: number;
  reportsRemaining: number;
  percentUsed: number;
  status: string;
  validUntil?: Date | null;
}

export interface UploadReportInput {
  fileName: string;
  fileSize: number;
  fileType: string;
  fileData: string; // base64
}

export interface UploadReportResponse {
  uploadId: string;
  reportId: string;
  s3Url: string;
}

export interface ListReportsInput {
  status?: ReportStatus;
  limit?: number;
  cursor?: string;
  orderBy?: "createdAt" | "title" | "status";
  orderDirection?: "asc" | "desc";
  search?: string;
}

/**
 * Helper type guards
 */
export function isReportStatus(status: string): status is ReportStatus {
  return [
    "draft",
    "parsing",
    "parsing_failed",
    "needs_review",
    "ready_for_audit",
    "audited",
    "certified",
    "exported",
  ].includes(status);
}

export function isReportStandard(standard: string): standard is ReportStandard {
  return [
    "JORC_2012",
    "NI_43_101",
    "PERC",
    "SAMREC",
    "CRIRSCO",
    "SEC_SK_1300",
    "CBRR",
  ].includes(standard);
}

/**
 * Status badge color mapping
 */
export const STATUS_COLORS: Record<ReportStatus, string> = {
  draft: "bg-gray-500",
  parsing: "bg-blue-500 animate-pulse",
  parsing_failed: "bg-red-500",
  needs_review: "bg-yellow-500",
  ready_for_audit: "bg-green-500",
  audited: "bg-purple-500",
  certified: "bg-indigo-500",
  exported: "bg-teal-500",
};

/**
 * Status labels (i18n ready)
 */
export const STATUS_LABELS: Record<ReportStatus, string> = {
  draft: "Rascunho",
  parsing: "Processando",
  parsing_failed: "Falha no Processamento",
  needs_review: "Requer Revisão",
  ready_for_audit: "Pronto para Auditoria",
  audited: "Auditado",
  certified: "Certificado",
  exported: "Exportado",
};

/**
 * Standard labels
 */
export const STANDARD_LABELS: Record<ReportStandard, string> = {
  JORC_2012: "JORC 2012",
  NI_43_101: "NI 43-101",
  PERC: "PERC",
  SAMREC: "SAMREC",
  CRIRSCO: "CRIRSCO",
  SEC_SK_1300: "SEC SK-1300",
  CBRR: "CBRR",
};
