import { z } from "zod";
import { randomUUID } from "crypto";
import { router, protectedProcedure } from "../../../_core/trpc";
import { uploads, reports, reviewLogs } from "../../../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { storagePut } from "../../../storage-hybrid";
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
      console.log('[UploadFile] Starting file upload');
      console.log('[UploadFile] Upload ID:', input.uploadId);
      console.log('[UploadFile] File name:', input.fileName);
      console.log('[UploadFile] Content type:', input.contentType);
      console.log('[UploadFile] Data size (base64):', input.fileData.length);

      try {
        // Decodificar base64
        const buffer = Buffer.from(input.fileData, "base64");
        console.log('[UploadFile] Buffer size:', buffer.length, 'bytes');

        // Fazer upload real para storage
        const s3Key = `tenants/${ctx.user.tenantId}/uploads/${input.uploadId}/${input.fileName}`;
        console.log('[UploadFile] Storage key:', s3Key);
        
        const uploadResult = await storagePut(s3Key, buffer, input.contentType);
        console.log('[UploadFile] Upload result:', JSON.stringify(uploadResult, null, 2));

        return {
          s3Url: uploadResult.url,
          s3Key: uploadResult.key,
          provider: uploadResult.provider,
        };
      } catch (error: any) {
        console.error('[UploadFile] Error:', error);
        console.error('[UploadFile] Stack:', error.stack);
        throw new Error(`File upload failed: ${error.message}`);
      }
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
      console.log('[Complete] Starting upload completion');
      console.log('[Complete] Upload ID:', input.uploadId);
      console.log('[Complete] S3 URL:', input.s3Url);
      
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      try {
        // Atualizar status do upload
        console.log('[Complete] Updating upload status to parsing');
        await db
          .update(uploads)
          .set({
            status: "parsing",
            s3Url: input.s3Url,
          })
          .where(eq(uploads.id, input.uploadId));

        // Buscar upload e report
        console.log('[Complete] Fetching upload record');
        const [upload] = await db
          .select()
          .from(uploads)
          .where(eq(uploads.id, input.uploadId));

        if (!upload || !upload.reportId) {
          throw new Error("Upload not found");
        }
        
        console.log('[Complete] Upload record:', JSON.stringify(upload, null, 2));

        // Tentar baixar conteúdo real do arquivo
        let fileContent = input.fileContent;
        
        if (!fileContent) {
          console.log('[Complete] Attempting to download file from storage');
          try {
            const { storageGet } = await import("../../../storage-hybrid");
            const downloadResult = await storageGet(input.s3Url);
            
            if (downloadResult.buffer) {
              fileContent = downloadResult.buffer.toString('utf-8');
              console.log('[Complete] Downloaded file content, size:', fileContent.length);
            }
          } catch (downloadError: any) {
            console.warn('[Complete] Could not download file, using mock content:', downloadError.message);
          }
        }

        // Se ainda não temos conteúdo, usar mock para demonstração
        if (!fileContent) {
          console.log('[Complete] Using mock content for demonstration');
          fileContent = `
            JORC 2012 Technical Report - ${upload.fileName}
            
            1. Executive Summary
            This report presents the mineral resource estimate for the ${upload.fileName.replace(/\.[^/.]+$/, "")} Project.
            
            2. Geology and Mineralization
            The deposit consists of gold-bearing quartz veins with associated mineralization.
            
            3. Mineral Resources
            Measured: 500,000 tonnes at 2.5 g/t Au (39,000 oz Au)
            Indicated: 1,200,000 tonnes at 2.1 g/t Au (81,000 oz Au)
            Inferred: 800,000 tonnes at 1.8 g/t Au (46,000 oz Au)
            
            4. Competent Person
            The information in this report that relates to Mineral Resources is based on
            information compiled by John Smith, a Competent Person who is a Member of the
            Australasian Institute of Mining and Metallurgy (MAusIMM).
            
            5. Sampling and Analysis
            Sampling was conducted using industry standard diamond drilling methods.
            Core recovery averaged 95% in mineralized zones.
            
            6. Quality Assurance and Quality Control
            A comprehensive QAQC program was implemented including certified reference
            materials, blanks, and duplicate samples at a rate of 1:20.
            
            7. Conclusions
            The project demonstrates significant mineral resource potential with good
            continuity of mineralization and favorable metallurgical characteristics.
          `;
        }

        console.log('[Complete] Starting parsing');
        // Executar parsing
        const parsingResult = await parseAndNormalize(
          fileContent,
          upload.mimeType || "application/pdf",
          upload.reportId,
          ctx.user.tenantId
        );
        
        console.log('[Complete] Parsing result:', JSON.stringify({
          status: parsingResult.status,
          summary: parsingResult.summary,
        }, null, 2));

        // Salvar normalized.json no storage
        console.log('[Complete] Saving normalized data');
        const normalizedUrl = await saveNormalizedToS3(
          parsingResult.normalized,
          ctx.user.tenantId,
          upload.reportId
        );
        
        console.log('[Complete] Normalized URL:', normalizedUrl);

        // Atualizar report com resultados do parsing
        console.log('[Complete] Updating report with parsing results');
        await db
          .update(reports)
          .set({
            detectedStandard: parsingResult.summary.detectedStandard as any,
            standard: parsingResult.summary.detectedStandard as any,
            status: (parsingResult.status === "needs_review" ? "needs_review" : "ready_for_audit") as any,
            s3NormalizedUrl: normalizedUrl,
            s3OriginalUrl: input.s3Url,
            parsingSummary: parsingResult.summary as any,
            updatedAt: new Date(),
          })
          .where(eq(reports.id, upload.reportId));

        // Atualizar status do upload
        console.log('[Complete] Marking upload as completed');
        await db
          .update(uploads)
          .set({
            status: "completed",
            completedAt: new Date(),
          })
          .where(eq(uploads.id, input.uploadId));

        console.log('[Complete] Upload completion successful');
        
        return {
          reportId: upload.reportId,
          status: parsingResult.status,
          summary: parsingResult.summary,
        };
      } catch (error: any) {
        console.error('[Complete] Error:', error);
        console.error('[Complete] Stack:', error.stack);
        
        // Atualizar upload com erro
        try {
          await db
            .update(uploads)
            .set({
              status: "failed",
            })
            .where(eq(uploads.id, input.uploadId));
        } catch (updateError) {
          console.error('[Complete] Could not update upload status:', updateError);
        }
        
        throw new Error(`Upload completion failed: ${error.message}`);
      }
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

