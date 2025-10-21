import { z } from "zod";
import { router, protectedProcedure } from "../../../_core/trpc";
import { uploads, reports, reviewLogs } from "../../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "../../../storage";
import {
  parseAndNormalize,
  saveNormalizedToS3,
  loadNormalizedFromS3,
  applyReviewUpdates,
  extractFieldsToReview,
} from "../services/parsing";

/**
 * ETAPA 2: Router de Uploads e Revisão Humana
 */

export const uploadsRouter = router({
  /**
   * Iniciar upload de arquivo externo
   */
  initiate: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const reportId = `EXT-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;

      // Criar registro de upload
      await db.insert(uploads).values({
        id: uploadId,
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        reportId,
        fileName: input.fileName,
        fileSize: input.fileSize.toString(),
        fileType: input.fileType,
        s3Key: `uploads/${uploadId}/original.${input.fileName.split(".").pop()}`,
        status: "uploading",
      });

      // Criar relatório com status parsing
      await db.insert(reports).values({
        id: reportId,
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        sourceType: "external",
        standard: "UNKNOWN", // Será detectado no parsing
        title: input.fileName,
        status: "parsing",
      });

      return {
        uploadId,
        reportId,
        s3Key: `uploads/${uploadId}/original.${input.fileName.split(".").pop()}`,
      };
    }),

  /**
   * Finalizar upload e iniciar parsing
   */
  complete: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
        s3Url: z.string(),
        fileContent: z.string().optional(), // Para demonstração, em produção viria do S3
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      // Atualizar status do upload
      await db
        .update(uploads)
        .set({
          status: "parsing",
          s3Url: input.s3Url,
          updatedAt: new Date(),
        })
        .where(eq(uploads.id, input.uploadId));

      // Buscar upload e report
      const [upload] = await db
        .select()
        .from(uploads)
        .where(eq(uploads.id, input.uploadId));

      if (!upload || !upload.reportId) {
        throw new Error("Upload not found");
      }

      // Simular conteúdo do arquivo (em produção, baixar do S3)
      const mockContent = input.fileContent || `
        JORC 2012 Technical Report
        
        1. Executive Summary
        This report presents the mineral resource estimate for the Alpha Project.
        
        2. Geology and Mineralization
        The deposit consists of gold-bearing quartz veins.
        
        3. Mineral Resources
        Measured: 500,000 tonnes at 2.5 g/t Au
        Indicated: 1,200,000 tonnes at 2.1 g/t Au
        Inferred: 800,000 tonnes at 1.8 g/t Au
        
        4. Competent Person
        Competent Person: John Smith, MAusIMM
        
        5. Sampling and Analysis
        Sampling was conducted using industry standard methods.
      `;

      // Executar parsing
      const parsingResult = await parseAndNormalize(
        mockContent,
        upload.fileType || "pdf",
        upload.reportId,
        ctx.user.tenantId
      );

      // Salvar normalized.json no S3
      const normalizedUrl = await saveNormalizedToS3(
        parsingResult.normalized,
        ctx.user.tenantId,
        upload.reportId
      );

      // Atualizar report com resultados do parsing
      await db
        .update(reports)
        .set({
          detectedStandard: parsingResult.summary.detectedStandard,
          standard: parsingResult.summary.detectedStandard,
          status: parsingResult.status === "needs_review" ? "needs_review" : "ready_for_audit",
          s3NormalizedUrl: normalizedUrl,
          s3OriginalUrl: input.s3Url,
          parsingSummary: parsingResult.summary,
          updatedAt: new Date(),
        })
        .where(eq(reports.id, upload.reportId));

      // Atualizar status do upload
      await db
        .update(uploads)
        .set({
          status: "completed",
          updatedAt: new Date(),
        })
        .where(eq(uploads.id, input.uploadId));

      return {
        reportId: upload.reportId,
        status: parsingResult.status,
        summary: parsingResult.summary,
      };
    }),

  /**
   * Consultar status de um upload
   */
  status: protectedProcedure
    .input(z.object({ uploadId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      const [upload] = await db
        .select()
        .from(uploads)
        .where(
          and(
            eq(uploads.id, input.uploadId),
            eq(uploads.tenantId, ctx.user.tenantId)
          )
        );

      if (!upload) {
        throw new Error("Upload not found");
      }

      let report = null;
      if (upload.reportId) {
        [report] = await db
          .select()
          .from(reports)
          .where(eq(reports.id, upload.reportId));
      }

      return {
        upload,
        report,
      };
    }),

  /**
   * Listar uploads recentes
   */
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) return [];

      const uploadsList = await db
        .select()
        .from(uploads)
        .where(eq(uploads.tenantId, ctx.user.tenantId))
        .orderBy(desc(uploads.createdAt))
        .limit(input.limit);

      return uploadsList;
    }),

  /**
   * Obter campos que precisam de revisão
   */
  getReviewFields: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      // Buscar report
      const [report] = await db
        .select()
        .from(reports)
        .where(
          and(
            eq(reports.id, input.reportId),
            eq(reports.tenantId, ctx.user.tenantId)
          )
        );

      if (!report) {
        throw new Error("Report not found");
      }

      // Carregar normalized.json
      const normalized = await loadNormalizedFromS3(
        ctx.user.tenantId,
        input.reportId
      );

      if (!normalized) {
        throw new Error("Normalized data not found");
      }

      // Extrair campos pendentes
      const fieldsToReview = extractFieldsToReview(normalized);

      return {
        status: report.status,
        fieldsToReview,
        totalFields: fieldsToReview.length,
      };
    }),

  /**
   * Aplicar correções de revisão humana
   */
  applyReview: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        updates: z.array(
          z.object({
            path: z.string(),
            value: z.any(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      // Buscar report
      const [report] = await db
        .select()
        .from(reports)
        .where(
          and(
            eq(reports.id, input.reportId),
            eq(reports.tenantId, ctx.user.tenantId)
          )
        );

      if (!report) {
        throw new Error("Report not found");
      }

      // Carregar normalized.json
      const normalized = await loadNormalizedFromS3(
        ctx.user.tenantId,
        input.reportId
      );

      if (!normalized) {
        throw new Error("Normalized data not found");
      }

      // Aplicar atualizações
      const updated = applyReviewUpdates(normalized, input.updates);

      // Salvar novo normalized.json
      const normalizedUrl = await saveNormalizedToS3(
        updated,
        ctx.user.tenantId,
        input.reportId
      );

      // Registrar logs de revisão
      for (const update of input.updates) {
        const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        await db.insert(reviewLogs).values({
          id: logId,
          reportId: input.reportId,
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          fieldPath: update.path,
          previousValue: "N/A", // Poderia buscar o valor anterior
          newValue: JSON.stringify(update.value),
        });
      }

      // Verificar se ainda há campos incertos
      const newStatus = updated._hasUncertainFields ? "needs_review" : "ready_for_audit";

      // Atualizar status do report
      await db
        .update(reports)
        .set({
          status: newStatus,
          s3NormalizedUrl: normalizedUrl,
          updatedAt: new Date(),
        })
        .where(eq(reports.id, input.reportId));

      return {
        success: true,
        newStatus,
        remainingFields: updated._hasUncertainFields
          ? extractFieldsToReview(updated).length
          : 0,
      };
    }),

  /**
   * Obter logs de revisão
   */
  getReviewLogs: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) return [];

      const logs = await db
        .select()
        .from(reviewLogs)
        .where(
          and(
            eq(reviewLogs.reportId, input.reportId),
            eq(reviewLogs.tenantId, ctx.user.tenantId)
          )
        )
        .orderBy(desc(reviewLogs.createdAt));

      return logs;
    }),
});

