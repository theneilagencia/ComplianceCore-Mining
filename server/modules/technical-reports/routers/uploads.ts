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

// Indicate module load to detect which code is executed at runtime
console.log('MODULE LOAD: server/modules/technical-reports/routers/uploads.ts (source) -', new Date().toISOString());

export const uploadsRouter = router({
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


