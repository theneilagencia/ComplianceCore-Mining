import { z } from "zod";
import { randomUUID } from "crypto";
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

      // Validação e logging detalhado
      console.log('[Upload] Starting upload initiation');
      console.log('[Upload] User context:', JSON.stringify({
        userId: ctx.user?.id,
        tenantId: ctx.user?.tenantId,
        email: ctx.user?.email,
        name: ctx.user?.name,
      }, null, 2));
      console.log('[Upload] Input:', JSON.stringify(input, null, 2));

      if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
        const errorMsg = `Invalid user context: user=${ctx.user?.id}, tenant=${ctx.user?.tenantId}`;
        console.error('[Upload] ERROR:', errorMsg);
        throw new Error(errorMsg);
      }

      const uploadId = `upl_${randomUUID()}`;
      const reportId = `rpt_${randomUUID()}`;
      
      console.log('[Upload] Generated IDs:', { uploadId, reportId });

      // Criar registro de upload
      const uploadData = {
        id: uploadId,
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        reportId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.fileType,
        status: "uploading" as const,
      };
      
      console.log('[Upload] Inserting upload record:', JSON.stringify(uploadData, null, 2));
      
      try {
        await db.insert(uploads).values(uploadData);
        console.log('[Upload] Upload record inserted successfully');
      } catch (error: any) {
        console.error('[Upload] Database insert failed:', error);
        console.error('[Upload] Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        throw new Error(`Failed to create upload record: ${error.message}`);
      }

      // Criar relatório com status parsing
      const reportData = {
        id: reportId,
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        sourceType: "external" as const,
        standard: "JORC_2012" as const, // Será detectado no parsing
        title: input.fileName,
        status: "parsing" as const,
      };
      
      console.log('[Upload] Inserting report record:', JSON.stringify(reportData, null, 2));
      
      try {
        await db.insert(reports).values(reportData);
        console.log('[Upload] Report record inserted successfully');
      } catch (error: any) {
        console.error('[Upload] Report insert failed:', error);
        throw new Error(`Failed to create report record: ${error.message}`);
      }

      return {
        uploadId,
        reportId,
        s3Key: `uploads/${uploadId}/original.${input.fileName.split(".").pop()}`,
      };
    }),

  /**
   * Upload direto do arquivo (novo endpoint)
   */
  uploadFile: protectedProcedure
    .input(
      z.object({
        uploadId: z.string(),
        fileData: z.string(), // Base64 encoded file
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Decodificar base64
      const buffer = Buffer.from(input.fileData, "base64");

      // Fazer upload real para S3
      const s3Key = `tenants/${ctx.user.tenantId}/uploads/${input.uploadId}/${input.fileName}`;
      const uploadResult = await storagePut(s3Key, buffer, input.contentType);

      return {
        s3Url: uploadResult.url,
        s3Key: uploadResult.key,
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
        upload.mimeType || "application/pdf",
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
          detectedStandard: parsingResult.summary.detectedStandard as any,
          standard: parsingResult.summary.detectedStandard as any,
          status: (parsingResult.status === "needs_review" ? "needs_review" : "ready_for_audit") as any,
          s3NormalizedUrl: normalizedUrl,
          s3OriginalUrl: input.s3Url,
          parsingSummary: parsingResult.summary,
        })
        .where(eq(reports.id, upload.reportId));

      // Atualizar status do upload
      await db
        .update(uploads)
        .set({
          status: "completed",
          completedAt: new Date(),
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
        const logId = `log_${randomUUID()}`;
        
        await db.insert(reviewLogs).values({
          id: logId,
          reportId: input.reportId,
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          fieldPath: update.path,
          oldValue: "N/A", // Poderia buscar o valor anterior
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

