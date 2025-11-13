import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as s3Service from "./s3Service";

export const storageRouter = router({
  // Get S3 status
  getStatus: protectedProcedure.query(() => {
    return s3Service.getS3Status();
  }),

  // Generate presigned upload URL
  generateUploadURL: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        folder: z.string().optional().default('uploads'),
        expiresIn: z.number().optional().default(3600),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await s3Service.generatePresignedUploadURL({
        tenantId: ctx.user.tenantId,
        fileName: input.fileName,
        fileType: input.fileType,
        folder: input.folder,
        expiresIn: input.expiresIn,
      });
      return result;
    }),

  // Generate presigned download URL
  generateDownloadURL: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        expiresIn: z.number().optional().default(3600),
      })
    )
    .query(async ({ input }) => {
      const result = await s3Service.generatePresignedDownloadURL({
        key: input.key,
        expiresIn: input.expiresIn,
      });
      return result;
    }),

  // List files in tenant folder
  listFiles: protectedProcedure
    .input(
      z.object({
        folder: z.string().optional().default('uploads'),
        maxKeys: z.number().optional().default(100),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await s3Service.listFiles({
        tenantId: ctx.user.tenantId,
        folder: input.folder,
        maxKeys: input.maxKeys,
      });
      return result;
    }),

  // Delete file
  deleteFile: protectedProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await s3Service.deleteFile(input.key);
      return result;
    }),
});

