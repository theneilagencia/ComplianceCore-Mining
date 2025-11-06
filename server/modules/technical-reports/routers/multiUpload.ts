import { z } from "zod";
import { randomUUID } from "crypto";
import { router, protectedProcedure } from "../../../_core/trpc";
import { uploads, reports } from "../../../../drizzle/schema";
import { storagePut } from "../../../storage-hybrid";
import { parsingQueue } from "../services/parsing-queue";
import { emitUploadCompleted } from "../services/event-emitter";

/**
 * Multi-Upload Router: Upload de múltiplos arquivos para um único relatório
 * 
 * Permite que o cliente faça upload de vários arquivos (PDFs, planilhas, docs)
 * que serão processados e combinados em um único relatório técnico.
 */
export const multiUploadRouter = router({
  /**
   * Endpoint para upload de múltiplos arquivos para um único relatório.
   * 
   * Fluxo:
   * 1. Cria um único relatório
   * 2. Faz upload de todos os arquivos
   * 3. Associa todos os uploads ao mesmo relatório
   * 4. Inicia parsing de todos os arquivos
   * 5. Combina informações extraídas em um único relatório
   */
  uploadMultipleFiles: protectedProcedure
    .input(
      z.object({
        files: z.array(
          z.object({
            fileName: z.string(),
            fileSize: z.number(),
            fileType: z.string(),
            fileData: z.string(), // Base64
          })
        ).min(1).max(10), // Mínimo 1, máximo 10 arquivos
        reportTitle: z.string().optional(), // Título customizado do relatório
        standard: z.string().optional(), // Padrão do relatório (JORC, NI 43-101, etc)
        language: z.enum(['pt-BR', 'en-US', 'es-ES', 'fr-FR']).optional().default('pt-BR'), // Idioma do relatório
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await import("../../../db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");

        if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
          throw new Error(`Invalid user context`);
        }

        console.log('✅ Multi-upload context validated:', {
          userId: ctx.user.id,
          tenantId: ctx.user.tenantId,
          filesCount: input.files.length,
          totalSize: input.files.reduce((sum, f) => sum + f.fileSize, 0),
        });

        // Validar MIME types
        const allowedMimeTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/msword',
          'application/vnd.ms-excel',
          'application/zip',
          'application/x-zip-compressed',
          'text/plain',
          'text/csv',
        ];

        for (const file of input.files) {
          if (!allowedMimeTypes.includes(file.fileType)) {
            throw new Error(`Tipo de arquivo não permitido: ${file.fileType}`);
          }
        }

        // Validar tamanho total
        const totalSize = input.files.reduce((sum, f) => sum + f.fileSize, 0);
        const maxTotalSize = 100 * 1024 * 1024; // 100 MB total
        if (totalSize > maxTotalSize) {
          throw new Error(`Tamanho total dos arquivos excede 100MB: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        }

        // Criar ID único para o relatório
        const reportId = `rpt_${randomUUID()}`;
        const reportTitle = input.reportTitle || `Relatório Multi-Arquivo - ${new Date().toLocaleDateString()}`;

        // Fazer upload de todos os arquivos
        const uploadResults: Array<{
          uploadId: string;
          fileName: string;
          s3Url: string;
          buffer: Buffer;
        }> = [];

        for (const file of input.files) {
          const uploadId = `upl_${randomUUID()}`;
          const s3Key = `tenants/${ctx.user.tenantId}/uploads/${reportId}/${uploadId}/${file.fileName}`;

          // Converter base64 para buffer
          const buffer = Buffer.from(file.fileData, "base64");

          // Upload para storage
          const storageResult = await storagePut(s3Key, buffer, file.fileType);

          uploadResults.push({
            uploadId,
            fileName: file.fileName,
            s3Url: storageResult.url,
            buffer,
          });

          console.log(`✅ Uploaded file ${file.fileName} to ${storageResult.url}`);
        }

        // Inserir tudo no banco em uma transação
        await db.transaction(async (tx) => {
          // 1. Criar relatório
          await tx.insert(reports).values({
            id: reportId,
            tenantId: ctx.user.tenantId,
            userId: ctx.user.id,
            sourceType: "external",
            standard: input.standard || "JORC_2012",
            title: reportTitle,
            status: "parsing",
            s3OriginalUrl: uploadResults[0].s3Url, // URL do primeiro arquivo
          });

          // 2. Criar registros de upload para cada arquivo
          for (let i = 0; i < uploadResults.length; i++) {
            const result = uploadResults[i];
            const file = input.files[i];

            await tx.insert(uploads).values({
              id: result.uploadId,
              tenantId: ctx.user.tenantId,
              userId: ctx.user.id,
              reportId,
              fileName: result.fileName,
              fileSize: file.fileSize,
              mimeType: file.fileType,
              s3Url: result.s3Url,
              status: "completed",
              createdAt: new Date(),
              completedAt: new Date(),
            });
          }
        });

        // 3. Emitir eventos de upload completo
        for (const result of uploadResults) {
          emitUploadCompleted(reportId, result.uploadId, result.fileName);
        }

        // 4. Enfileirar parsing de todos os arquivos
        for (let i = 0; i < uploadResults.length; i++) {
          const result = uploadResults[i];
          const file = input.files[i];

          await parsingQueue.enqueue(
            reportId,
            ctx.user.tenantId,
            result.fileName,
            result.buffer,
            file.fileType
          );
        }

        console.log(`✅ Multi-upload completed: ${uploadResults.length} files for report ${reportId}`);

        return {
          reportId,
          filesCount: uploadResults.length,
          uploads: uploadResults.map(r => ({
            uploadId: r.uploadId,
            fileName: r.fileName,
            s3Url: r.s3Url,
          })),
        };
      } catch (error: any) {
        console.error('[Multi-Upload] Upload failed:', error.message);
        throw error;
      }
    }),
});
