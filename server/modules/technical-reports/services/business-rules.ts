/**
 * Business Rules Validation Service
 * Validates tenant quotas, limits, and business constraints
 */

import { TRPCError } from "@trpc/server";
import { eq, and, count } from "drizzle-orm";

interface QuotaValidationResult {
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
  plan: string;
}

interface TenantPlanInfo {
  plan: string;
  status: string;
  reportsLimit: number;
  reportsUsed: number;
  projectsLimit: number;
  validUntil: Date | null;
}

/**
 * Plan quotas configuration
 */
const PLAN_QUOTAS = {
  START: {
    reportsLimit: 1,
    projectsLimit: 1,
    auditsPerReport: 3,
    exportsPerMonth: 10,
  },
  PRO: {
    reportsLimit: 5,
    projectsLimit: 3,
    auditsPerReport: 10,
    exportsPerMonth: 50,
  },
  ENTERPRISE: {
    reportsLimit: 15,
    projectsLimit: -1, // unlimited
    auditsPerReport: -1, // unlimited
    exportsPerMonth: -1, // unlimited
  },
} as const;

/**
 * Get tenant plan information including quotas
 */
export async function getTenantPlan(tenantId: string): Promise<TenantPlanInfo | null> {
  const db = await import("../../db").then((m) => m.getDb());
  if (!db) return null;

  const { licenses } = await import("../../../drizzle/schema");

  // Get most recent active license for tenant
  const license = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.tenantId, tenantId),
        eq(licenses.status, "active")
      )
    )
    .orderBy(licenses.createdAt)
    .limit(1);

  if (!license || license.length === 0) {
    return null;
  }

  const tenantLicense = license[0];
  
  return {
    plan: tenantLicense.plan,
    status: tenantLicense.status,
    reportsLimit: tenantLicense.reportsLimit,
    reportsUsed: tenantLicense.reportsUsed,
    projectsLimit: tenantLicense.projectsLimit,
    validUntil: tenantLicense.validUntil,
  };
}

/**
 * Validate if tenant can create a new report
 */
export async function validateReportCreation(
  tenantId: string
): Promise<QuotaValidationResult> {
  const planInfo = await getTenantPlan(tenantId);

  if (!planInfo) {
    return {
      allowed: false,
      reason: "Nenhum plano ativo encontrado. Por favor, ative uma licença.",
      current: 0,
      limit: 0,
      plan: "NONE",
    };
  }

  // Check if license is expired
  if (planInfo.status !== "active") {
    return {
      allowed: false,
      reason: `Licença ${planInfo.status}. Por favor, renove sua assinatura.`,
      current: planInfo.reportsUsed,
      limit: planInfo.reportsLimit,
      plan: planInfo.plan,
    };
  }

  // Check if validUntil has passed
  if (planInfo.validUntil && new Date() > planInfo.validUntil) {
    return {
      allowed: false,
      reason: "Licença expirada. Por favor, renove sua assinatura.",
      current: planInfo.reportsUsed,
      limit: planInfo.reportsLimit,
      plan: planInfo.plan,
    };
  }

  // Check report quota
  if (planInfo.reportsUsed >= planInfo.reportsLimit) {
    return {
      allowed: false,
      reason: `Limite de relatórios atingido (${planInfo.reportsUsed}/${planInfo.reportsLimit}). Faça upgrade do plano ${planInfo.plan} para criar mais relatórios.`,
      current: planInfo.reportsUsed,
      limit: planInfo.reportsLimit,
      plan: planInfo.plan,
    };
  }

  return {
    allowed: true,
    current: planInfo.reportsUsed,
    limit: planInfo.reportsLimit,
    plan: planInfo.plan,
  };
}

/**
 * Increment report usage counter for tenant
 */
export async function incrementReportUsage(tenantId: string): Promise<void> {
  const db = await import("../../db").then((m) => m.getDb());
  if (!db) throw new Error("Database not available");

  const { licenses } = await import("../../../drizzle/schema");
  const { sql } = await import("drizzle-orm");

  // Increment reportsUsed atomically
  await db
    .update(licenses)
    .set({
      reportsUsed: sql`${licenses.reportsUsed} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(licenses.tenantId, tenantId),
        eq(licenses.status, "active")
      )
    );
}

/**
 * Check for duplicate report titles within tenant
 */
export async function checkDuplicateReport(
  tenantId: string,
  title: string,
  excludeReportId?: string
): Promise<boolean> {
  const db = await import("../../db").then((m) => m.getDb());
  if (!db) return false;

  const { reports } = await import("../../../drizzle/schema");
  const { ne } = await import("drizzle-orm");

  const conditions = [
    eq(reports.tenantId, tenantId),
    eq(reports.title, title),
  ];

  // Exclude specific report ID if provided (for updates)
  if (excludeReportId) {
    conditions.push(ne(reports.id, excludeReportId));
  }

  const existing = await db
    .select({ count: count() })
    .from(reports)
    .where(and(...conditions));

  return existing[0]?.count > 0;
}

/**
 * Validate business rules before report creation
 * Throws TRPCError if validation fails
 */
export async function validateBusinessRules(
  tenantId: string,
  title: string
): Promise<void> {
  // 1. Check quota limits
  const quotaResult = await validateReportCreation(tenantId);
  
  if (!quotaResult.allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: quotaResult.reason,
      cause: {
        type: "QUOTA_EXCEEDED",
        current: quotaResult.current,
        limit: quotaResult.limit,
        plan: quotaResult.plan,
      },
    });
  }

  // 2. Check for duplicate titles
  const isDuplicate = await checkDuplicateReport(tenantId, title);
  
  if (isDuplicate) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Já existe um relatório com o título "${title}". Por favor, escolha um título diferente.`,
      cause: {
        type: "DUPLICATE_TITLE",
        title,
      },
    });
  }
}

/**
 * Get quota information for UI display
 */
export async function getQuotaInfo(tenantId: string) {
  const planInfo = await getTenantPlan(tenantId);
  
  if (!planInfo) {
    return {
      plan: "NONE",
      reportsUsed: 0,
      reportsLimit: 0,
      reportsRemaining: 0,
      percentUsed: 0,
      status: "inactive",
    };
  }

  const reportsRemaining = Math.max(0, planInfo.reportsLimit - planInfo.reportsUsed);
  const percentUsed = planInfo.reportsLimit > 0 
    ? (planInfo.reportsUsed / planInfo.reportsLimit) * 100 
    : 0;

  return {
    plan: planInfo.plan,
    reportsUsed: planInfo.reportsUsed,
    reportsLimit: planInfo.reportsLimit,
    reportsRemaining,
    percentUsed: Math.round(percentUsed),
    status: planInfo.status,
    validUntil: planInfo.validUntil,
  };
}
