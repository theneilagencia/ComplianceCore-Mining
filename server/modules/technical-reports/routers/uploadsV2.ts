import { z } from "zod";
import { randomUUID } from "crypto";
import { router, protectedProcedure } from "../../../_core/trpc";
import { uploads, reports } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { storagePut } from "../../../storage-hybrid";
import { parseAndNormalize, saveNormalizedToS3 } from "../services/parsing";

/**
 * Upload V2: Sistema de upload atômico e unificado
 * Substitui o fluxo de 3 etapas por uma única transação
 */
export const uploadsV2Router = router({
  /**
   * Endpoint unificado para upload e processamento de relatórios.
   * Recebe o arquivo em base64, salva no storage, cria os registros no banco
   * em uma única transação e inicia o parsing de forma assíncrona.
   */
  uploadAndProcessReport: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
        fileData: z.string(), // Arquivo em base64
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await import("../../../db").then((m) => m.getDb());
      if (!db) throw new Error("Database not available");

      console.log('[Upload V2] Starting unified upload');
      console.log('[Upload V2] User:', ctx.user?.email);
      console.log('[Upload V2] File:', input.fileName, `(${input.fileSize} bytes)`);

      if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
        throw new Error(`Invalid user context`);
      }

      const uploadId = `upl_${randomUUID()}`;
      const reportId = `rpt_${randomUUID()}`;
      const s3Key = `tenants/${ctx.user.tenantId}/uploads/${uploadId}/${input.fileName}`;

      console.log('[Upload V2] Generated IDs:', { uploadId, reportId });

      // 1. Fazer upload do arquivo para o storage
      console.log('[Upload V2] Uploading to storage...');
      const buffer = Buffer.from(input.fileData, "base64");
      const storageResult = await storagePut(s3Key, buffer, input.fileType);
      console.log('[Upload V2] Storage URL:', storageResult.url);

      // 2. Executar inserções no banco de dados dentro de uma transação
      console.log('[Upload V2] Creating database records...');
      await db.transaction(async (tx) => {
        // 2a. Criar registro na tabela 'uploads'
        await tx.insert(uploads).values({
          id: uploadId,
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          reportId,
          fileName: input.fileName,
          fileSize: input.fileSize,
          mimeType: input.fileType,
          s3Url: storageResult.url, // URL final do arquivo
          status: "completed", // Já nasce completo
          createdAt: new Date(),
          completedAt: new Date(),
        });

        // 2b. Criar registro na tabela 'reports'
        await tx.insert(reports).values({
          id: reportId,
          tenantId: ctx.user.tenantId,
          userId: ctx.user.id,
          sourceType: "external",
          standard: "JORC_2012", // Placeholder, será detectado no parsing
          title: input.fileName,
          status: "parsing", // Inicia em modo de parsing
          s3OriginalUrl: storageResult.url,
        });
      });

      console.log('[Upload V2] Database records created successfully');

      // 3. Iniciar o parsing de forma assíncrona (não bloquear a resposta)
      (async () => {
        try {
          console.log('[Upload V2] Starting async parsing...');
          const parsingResult = await parseAndNormalize(
            buffer.toString(),
            input.fileType,
            reportId,
            ctx.user.tenantId
          );

          const normalizedUrl = await saveNormalizedToS3(
            parsingResult.normalized,
            ctx.user.tenantId,
            reportId
          );

          // Atualizar o report com o resultado do parsing
          await db.update(reports).set({
              detectedStandard: parsingResult.summary.detectedStandard as any,
              standard: parsingResult.summary.detectedStandard as any,
              status: (parsingResult.status === "needs_review" ? "needs_review" : "ready_for_audit") as any,
              s3NormalizedUrl: normalizedUrl,
              parsingSummary: parsingResult.summary,
            }).where(eq(reports.id, reportId));

          console.log('[Upload V2] Parsing completed successfully');
        } catch (error) {
          console.error(`[Upload V2] Parsing failed for report ${reportId}:`, error);
          // Atualizar status do report para 'failed'
          await db.update(reports).set({ status: "failed" }).where(eq(reports.id, reportId));
        }
      })();

      // 4. Retornar sucesso imediato para o frontend
      console.log('[Upload V2] Returning success response');
      return {
        uploadId,
        reportId,
        s3Url: storageResult.url,
      };
    }),
});
