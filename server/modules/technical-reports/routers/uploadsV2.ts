import { z } from "zod";
import { randomUUID } from "crypto";
import { router, protectedProcedure } from "../../../_core/trpc";
import { uploads, reports } from "../../../../drizzle/schema";
import { storagePut } from "../../../storage-hybrid";
import { parsingQueue } from "../services/parsing-queue";
import { emitUploadCompleted } from "../services/event-emitter";

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
      try {
        const db = await import("../../../db").then((m) => m.getDb());
        if (!db) throw new Error("Database not available");

      if (!ctx.user || !ctx.user.id || !ctx.user.tenantId) {
        console.error('❌ Invalid user context:', {
          hasUser: !!ctx.user,
          userId: ctx.user?.id,
          tenantId: ctx.user?.tenantId,
          userObject: JSON.stringify(ctx.user, null, 2)
        });
        throw new Error(`Invalid user context - userId: ${ctx.user?.id}, tenantId: ${ctx.user?.tenantId}`);
      }

      console.log('✅ Upload context validated:', {
        userId: ctx.user.id,
        tenantId: ctx.user.tenantId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.fileType
      });

      // Validação de MIME type permitidos
      const allowedMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/msword', // .doc
        'application/vnd.ms-excel', // .xls
        'application/zip',
        'application/x-zip-compressed',
        'text/plain',
        'text/csv',
      ];

      if (!allowedMimeTypes.includes(input.fileType)) {
        throw new Error(`Tipo de arquivo não permitido: ${input.fileType}. Tipos aceitos: PDF, DOCX, XLSX, DOC, XLS, ZIP, TXT, CSV`);
      }

      // Validação de tamanho máximo (50MB já configurado no Express, mas validamos aqui também)
      const maxSizeBytes = 50 * 1024 * 1024; // 50 MB
      if (input.fileSize > maxSizeBytes) {
        throw new Error(`Arquivo muito grande: ${(input.fileSize / 1024 / 1024).toFixed(2)}MB. Tamanho máximo: 50MB`);
      }

      const uploadId = `upl_${randomUUID()}`;
      const reportId = `rpt_${randomUUID()}`;
      const s3Key = `tenants/${ctx.user.tenantId}/uploads/${uploadId}/${input.fileName}`;

      // 1. Fazer upload do arquivo para o storage
      if (!input.fileData || input.fileData.length === 0) {
        throw new Error('Dados do arquivo estão vazios. O arquivo pode não ter sido lido corretamente.');
      }
      
      let buffer: Buffer;
      try {
        buffer = Buffer.from(input.fileData, "base64");
      } catch (error: any) {
        console.error('[Upload V2] Erro ao criar buffer:', error);
        throw new Error(`Erro ao processar dados do arquivo: ${error.message}`);
      }
      
      const storageResult = await storagePut(s3Key, buffer, input.fileType);

      // 2. Executar inserções no banco de dados dentro de uma transação
      const uploadData = {
        id: uploadId,
        tenantId: ctx.user.tenantId,
        userId: ctx.user.id,
        reportId,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.fileType,
        s3Url: storageResult.url,
        status: "completed" as const,
        createdAt: new Date(),
        completedAt: new Date(),
      };

      console.log('📦 Upload data to insert:', {
        ...uploadData,
        fileSize: `${input.fileSize} bytes (${(input.fileSize / 1024 / 1024).toFixed(2)} MB)`
      });

      await db.transaction(async (tx) => {
        // 2a. Criar registro na tabela 'uploads'
        await tx.insert(uploads).values(uploadData);

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

      // 3. Emit upload completed event
      emitUploadCompleted(reportId, uploadId, input.fileName);

      // 4. Enqueue parsing job (non-blocking, processed in background)
      // The parsing queue will:
      // - Process the file asynchronously
      // - Emit real-time progress events via SSE
      // - Retry on failure with exponential backoff
      // - Update database with results
      await parsingQueue.enqueue(
        reportId,
        ctx.user.tenantId,
        input.fileName,
        buffer,
        input.fileType
      );

      // 4. Retornar sucesso imediato para o frontend
      return {
        uploadId,
        reportId,
        s3Url: storageResult.url,
      };
    } catch (error: any) {
      console.error('[Upload V2] Upload failed:', error.message);
      throw error;
    }
    }),
});
