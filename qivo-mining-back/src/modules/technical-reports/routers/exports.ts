/**
 * Exports Router
 * Handles report export to different standards and formats
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { router, protectedProcedure } from '../../../_core/trpc';
import { getDb } from '../../../db';
import { reports, exports } from '../../../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { exportReport } from '../services/export';

export const exportsRouter = router({
  // Run export
  run: protectedProcedure
    .input(z.object({
      reportId: z.string(),
      toStandard: z.enum(["JORC_2012", "NI_43_101", "PERC", "SAMREC", "CBRR"]),
      format: z.enum(["PDF", "DOCX", "XLSX"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const { reportId, toStandard, format } = input;
      const { user } = ctx;

      // 1) Get report
      const [report] = await db
        .select()
        .from(reports)
        .where(
          and(
            eq(reports.id, reportId),
            eq(reports.tenantId, user.tenantId)
          )
        )
        .limit(1);

      if (!report) {
        throw new Error('Report not found');
      }

      // 2) Guard-rail: check status
      const allowedStatuses = ['ready_for_audit', 'audited', 'certified', 'exported', 'completed'];
      if (!allowedStatuses.includes(report.status)) {
        throw new Error(`Relatório não está pronto para exportação. Status atual: ${report.status}. Finalize a revisão humana ou auditoria antes de exportar.`);
      }

      // 3) Mock normalized data (since we don't have actual uploads yet)
      const normalizedData = {
        metadata: {
          project_name: report.title || 'Projeto Sem Nome',
          company: 'Empresa Exemplo',
          effective_date: new Date().toLocaleDateString('pt-BR'),
          detected_standard: report.detectedStandard || report.standard,
        },
        sections: [
          { title: 'Section 1', content_text: 'Conteúdo da seção 1 - Técnicas de amostragem e dados' },
          { title: 'Section 2', content_text: 'Conteúdo da seção 2 - Relatório de resultados de exploração' },
          { title: 'Section 3', content_text: 'Conteúdo da seção 3 - Estimativa e relatório de recursos minerais' },
          { title: 'Section 4', content_text: 'Conteúdo da seção 4 - Estimativa e relatório de reservas de minério' },
        ],
        resource_estimates: [
          {
            category: 'Measured',
            tonnage: 1000000,
            grade: { Au: 2.5, Ag: 15.0 },
            cutoff_grade: { Au: 0.5 },
          },
          {
            category: 'Indicated',
            tonnage: 2500000,
            grade: { Au: 2.0, Ag: 12.0 },
            cutoff_grade: { Au: 0.5 },
          },
          {
            category: 'Inferred',
            tonnage: 1500000,
            grade: { Au: 1.5, Ag: 10.0 },
            cutoff_grade: { Au: 0.5 },
          },
        ],
        competent_persons: [
          {
            name: 'Dr. João Silva',
            qualification: 'MAusIMM CP(Geo)',
            organization: 'GeoConsult Brasil',
            role: 'Competent Person',
          },
        ],
        economic_assumptions: {
          recovery_rate: 92.5,
          mining_cost: 45.0,
          processing_cost: 25.0,
        },
        qa_qc: 'Programas de QA/QC implementados conforme melhores práticas internacionais.',
        geology: 'Depósito de ouro hospedado em veios de quartzo com alteração hidrotermal.',
        brand: {
          logo_s3: undefined,
          company_display: 'ComplianceCore Mining™',
        },
      };

      // 4) Export report
      const s3Url = await exportReport(
        user.tenantId,
        reportId,
        normalizedData,
        toStandard,
        format
      );

      // 5) Save export record
      const exportId = `exp_${randomUUID()}`;
      await db.insert(exports).values({
        id: exportId,
        reportId,
        tenantId: user.tenantId,
        userId: user.id,
        targetStandard: toStandard as any,
        format: format as any,
        status: 'completed' as any,
        fileUrl: s3Url,
      });

      return {
        exportId,
        reportId,
        fromStandard: report.standard,
        toStandard,
        format,
        url: s3Url,
      };
    }),

  // List exports for a report
  list: protectedProcedure
    .input(z.object({
      reportId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const { reportId } = input;
      const { user } = ctx;

      if (reportId) {
        const results = await db
          .select()
          .from(exports)
          .where(
            and(
              eq(exports.tenantId, user.tenantId),
              eq(exports.reportId, reportId)
            )
          )
          .orderBy(desc(exports.createdAt))
          .limit(50);
        return results;
      }

      const results = await db
        .select()
        .from(exports)
        .where(eq(exports.tenantId, user.tenantId))
        .orderBy(desc(exports.createdAt))
        .limit(50);
      return results;
    }),

  // Get single export
  get: protectedProcedure
    .input(z.object({
      exportId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const { exportId } = input;
      const { user } = ctx;

      const [result] = await db
        .select()
        .from(exports)
        .where(
          and(
            eq(exports.id, exportId),
            eq(exports.tenantId, user.tenantId)
          )
        )
        .limit(1);

      if (!result) {
        throw new Error('Export not found');
      }

      return result;
    }),
});

