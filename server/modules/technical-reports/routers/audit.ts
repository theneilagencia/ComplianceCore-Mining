import { z } from "zod";
import { protectedProcedure, router } from "../../../_core/trpc";
import { TRPCError } from "@trpc/server";
import { runAudit } from "../services/audit";
import { runKRCIScan, getKRCIStats, ScanMode } from "../services/krci-extended";
import { generateCorrectionPlan, exportCorrectionPlan } from "../services/correction-plan";
import { generateAuditPDF } from "../services/pdf-generator";
import { eq } from "drizzle-orm";

export const auditRouter = router({
  // Executar auditoria KRCI em um relatório
  run: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        auditType: z.enum(["full", "partial"]).optional().default("full"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { reports, audits } = await import("../../../../drizzle/schema");

      // Buscar relatório
      const [report] = await db.select().from(reports).where(eq(reports.id, input.reportId)).limit(1);

      /* const report = await db.query.reports.findFirst({
        where: eq(reports.id, input.reportId),
      }); */

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Relatório não encontrado",
        });
      }

      // GUARD-RAIL: Verificar se relatório está pronto para auditoria
      if (report.status !== "ready_for_audit") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Relatório não está pronto para auditoria. Status atual: ${report.status}`,
        });
      }

      // Buscar normalized.json do S3 (simulado por enquanto)
      // Em produção, fazer download real do S3
      const normalizedReport = {
        metadata: {
          title: report.title,
          projectName: undefined,
          effectiveDate: report.createdAt?.toISOString(),
          standard: report.standard,
        },
        sections: [
          { title: "Executive Summary", content: "..." },
          { title: "Introduction", content: "..." },
          { title: "Geology", content: "..." },
          { title: "Sampling and Analysis", content: "..." },
          { title: "Resource Estimate", content: "..." },
        ],
        resourceEstimates: [
          {
            category: "Measured",
            tonnage: 1000000,
            grade: 2.5,
            cutoffGrade: 0.5,
          },
        ],
        competentPersons: [
          {
            name: "John Doe",
            qualification: "MAusIMM",
            organization: "Mining Consultants Inc.",
          },
        ],
        economicAssumptions: {
          capex: 50000000,
          opex: 25,
          recoveryRate: 85,
        },
        qaQc: {
          samplingMethod: "Diamond drilling with HQ core",
          qualityControl: "Certified reference materials and blanks",
        },
      };

      // Executar auditoria
      const auditResult = runAudit(normalizedReport, input.auditType);

      // Gerar PDF
      const pdfUrl = await generateAuditPDF(
        {
          reportId: report.id,
          reportTitle: report.title,
          projectName: undefined,
          effectiveDate: report.createdAt?.toISOString(),
          standard: report.standard,
          score: auditResult.score,
          totalRules: auditResult.totalRules,
          passedRules: auditResult.passedRules,
          failedRules: auditResult.failedRules,
          krcis: auditResult.krcis,
          recommendations: auditResult.recommendations,
          auditDate: new Date().toISOString(),
          auditorName: ctx.user.name || undefined,
        },
        report.tenantId
      );

      // Salvar auditoria no banco
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(audits).values({
        id: auditId,
        reportId: report.id,
        tenantId: report.tenantId,
        userId: ctx.user.id,
        auditType: input.auditType,
        score: auditResult.score,
        totalRules: auditResult.totalRules,
        passedRules: auditResult.passedRules,
        failedRules: auditResult.failedRules,
        krcisJson: auditResult.krcis,
        recommendationsJson: auditResult.recommendations,
        pdfUrl,
        createdAt: new Date(),
      });

      // Atualizar status do relatório para "audited"
      await db
        .update(reports)
        .set({ status: "audited" })
        .where(eq(reports.id, report.id));

      return {
        auditId,
        reportId: report.id,
        score: auditResult.score,
        totalRules: auditResult.totalRules,
        passedRules: auditResult.passedRules,
        failedRules: auditResult.failedRules,
        krcis: auditResult.krcis,
        recommendations: auditResult.recommendations,
        pdfUrl,
        timestamp: new Date().toISOString(),
      };
    }),

  // Listar auditorias
  list: protectedProcedure
    .input(
      z.object({
        reportId: z.string().optional(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { audits } = await import("../../../../drizzle/schema");

      const conditions = [eq(audits.tenantId, ctx.user.tenantId)];

      if (input.reportId) {
        conditions.push(eq(audits.reportId, input.reportId));
      }

      const auditsList = await db.select().from(audits).where(conditions.length > 1 ? conditions[0] : conditions[0]).limit(input.limit);

      /* const auditsList = await db.query.audits.findMany({
        where: conditions.length > 1 ? conditions : conditions[0],
        limit: input.limit,
        orderBy: (audits, { desc }) => [desc(audits.createdAt)],
      }); */

      return auditsList;
    }),

  // Obter detalhes de uma auditoria
  get: protectedProcedure
    .input(
      z.object({
        auditId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { audits } = await import("../../../../drizzle/schema");

      const [audit] = await db.select().from(audits).where(eq(audits.id, input.auditId)).limit(1);

      /* const audit = await db.query.audits.findFirst({
        where: eq(audits.id, input.auditId),
      }); */

      if (!audit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auditoria não encontrada",
        });
      }

      if (audit.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      return audit;
    }),

  // KRCI Extended Scan (100+ rules)
  scanExtended: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        mode: z.enum(["light", "full", "deep"]).optional().default("full"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { reports, audits } = await import("../../../../drizzle/schema");

      // Buscar relatório
      const [report] = await db.select().from(reports).where(eq(reports.id, input.reportId)).limit(1);

      if (!report) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Relatório não encontrado",
        });
      }

      // Mock normalized report (em produção, buscar do S3)
      const normalizedReport = {
        metadata: {
          title: report.title,
          projectName: undefined,
          effectiveDate: report.createdAt?.toISOString(),
          standard: report.standard,
        },
        sections: [
          { title: "Executive Summary", content: "..." },
          { title: "Introduction", content: "..." },
          { title: "Geology", content: "..." },
          { title: "Sampling and Analysis", content: "..." },
          { title: "Resource Estimate", content: "..." },
        ],
        resourceEstimates: [
          {
            category: "Measured",
            tonnage: 1000000,
            grade: 2.5,
            cutoffGrade: 0.5,
          },
        ],
        competentPersons: [
          {
            name: "John Doe",
            qualification: "MAusIMM",
            organization: "Mining Consultants Inc.",
          },
        ],
        economicAssumptions: {
          capex: 50000000,
          opex: 25,
          recoveryRate: 85,
        },
        qaQc: {
          samplingMethod: "Diamond drilling with HQ core",
          qualityControl: "Certified reference materials and blanks",
        },
      };

      // Run KRCI Extended Scan
      const scanResult = runKRCIScan(normalizedReport, input.mode as ScanMode);

      // Save audit to database
      const auditId = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.insert(audits).values({
        id: auditId,
        reportId: report.id,
        tenantId: report.tenantId,
        userId: ctx.user.id,
        auditType: input.mode === "light" ? "partial" : "full",
        score: scanResult.score,
        totalRules: scanResult.totalRules,
        passedRules: scanResult.passedRules,
        failedRules: scanResult.failedRules,
        krcisJson: scanResult.krcis,
        recommendationsJson: scanResult.recommendations,
        pdfUrl: null, // Generate PDF separately if needed
        createdAt: new Date(),
      });

      return {
        auditId,
        ...scanResult,
      };
    }),

  // Get KRCI Statistics
  getStats: protectedProcedure
    .query(() => {
      return getKRCIStats();
    }),

  // Generate correction plan from audit
  correctionPlan: protectedProcedure
    .input(
      z.object({
        auditId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { audits } = await import("../../../../drizzle/schema");

      const [audit] = await db
        .select()
        .from(audits)
        .where(eq(audits.id, input.auditId))
        .limit(1);

      if (!audit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auditoria não encontrada",
        });
      }

      if (audit.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const scanResult = {
        mode: (audit.auditType === "partial" ? "light" : "full") as ScanMode,
        score: audit.score,
        totalRules: audit.totalRules,
        passedRules: audit.passedRules,
        failedRules: audit.failedRules,
        krcis: audit.krcisJson as any[],
        categoryScores: {},
        recommendations: audit.recommendationsJson as string[],
        executionTime: 0,
      };

      const plan = generateCorrectionPlan(audit.reportId, scanResult);

      return plan;
    }),

  // Export correction plan
  exportPlan: protectedProcedure
    .input(
      z.object({
        auditId: z.string(),
        format: z.enum(["json", "markdown", "csv"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const { audits } = await import("../../../../drizzle/schema");

      const [audit] = await db
        .select()
        .from(audits)
        .where(eq(audits.id, input.auditId))
        .limit(1);

      if (!audit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Auditoria não encontrada",
        });
      }

      if (audit.tenantId !== ctx.user.tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Acesso negado",
        });
      }

      const scanResult = {
        mode: (audit.auditType === "partial" ? "light" : "full") as ScanMode,
        score: audit.score,
        totalRules: audit.totalRules,
        passedRules: audit.passedRules,
        failedRules: audit.failedRules,
        krcis: audit.krcisJson as any[],
        categoryScores: {},
        recommendations: audit.recommendationsJson as string[],
        executionTime: 0,
      };

      const plan = generateCorrectionPlan(audit.reportId, scanResult);
      const exported = exportCorrectionPlan(plan, input.format);

      return {
        format: input.format,
        content: exported,
        filename: `correction-plan-${audit.reportId}.${input.format}`,
      };
    }),
});

