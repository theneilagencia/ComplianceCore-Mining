/**
 * Pre-Certification Router
 * Handles pre-certification requests for international regulators
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';
import { router, protectedProcedure } from '../../../_core/trpc';
import { getDb } from '../../../db';
import { reports, certifications } from '../../../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { runPreCertification } from '../services/precertification';
import { generateCompliancePDF } from '../services/compliance-pdf';
import { storagePut } from '../../../storage';

export const precertificationRouter = router({
  // Submit pre-certification request
  submit: protectedProcedure
    .input(z.object({
      reportId: z.string(),
      regulator: z.enum(["ASX", "TSX", "JSE", "CRIRSCO"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const { reportId, regulator, notes } = input;
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

      // 2) Guard-rail: check status (must be audited or higher)
      const allowedStatuses = ['audited', 'certified', 'exported', 'completed'];
      if (!allowedStatuses.includes(report.status)) {
        throw new Error(`Relatório não está pronto para pré-certificação. Status atual: ${report.status}. Complete a auditoria antes de solicitar pré-certificação.`);
      }

      // 3) Mock normalized data (in real scenario, load from S3)
      const normalizedData = {
        metadata: {
          project_name: report.title || 'Projeto Sem Nome',
          company: 'Empresa Exemplo',
          effective_date: new Date().toLocaleDateString('pt-BR'),
          detected_standard: report.detectedStandard || report.standard,
        },
        sections: [
          { title: 'Section 1', content_text: 'Técnicas de amostragem e dados' },
          { title: 'Section 2', content_text: 'Relatório de resultados de exploração' },
          { title: 'Section 3', content_text: 'Estimativa e relatório de recursos minerais' },
          { title: 'Section 4', content_text: 'Estimativa e relatório de reservas de minério' },
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
      };

      // 4) Run pre-certification check
      const complianceResult = runPreCertification(regulator, normalizedData);

      // 5) Generate PDF
      const pdfBuffer = await generateCompliancePDF(complianceResult, {
        title: report.title,
        projectName: report.title,
        company: 'Empresa Exemplo',
        effectiveDate: new Date().toLocaleDateString('pt-BR'),
      });

      // 6) Upload PDF to S3
      const pdfKey = `tenants/${user.tenantId}/certifications/${reportId}_${regulator}_${Date.now()}.pdf`;
      const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, 'application/pdf');

      // 7) Save certification record
      const certificationId = `cert_${randomUUID()}`;
      await db.insert(certifications).values({
        id: certificationId,
        reportId,
        tenantId: user.tenantId,
        userId: user.id,
        regulator,
        status: (complianceResult.score >= 90 ? 'approved' : complianceResult.score >= 70 ? 'pending' : 'rejected') as any,
        checklistJson: complianceResult.checklist,
        pendingCount: complianceResult.pendingRequirements.length,
        pdfUrl,
        notes,
      });

      return {
        certificationId,
        reportId,
        regulator,
        score: complianceResult.score,
        status: complianceResult.score >= 90 ? 'approved' : complianceResult.score >= 70 ? 'pending' : 'rejected',
        totalItems: complianceResult.totalItems,
        passedItems: complianceResult.passedItems,
        failedItems: complianceResult.failedItems,
        pendingItems: complianceResult.pendingItems,
        pdfUrl,
        pendingRequirements: complianceResult.pendingRequirements,
        recommendations: complianceResult.recommendations,
      };
    }),

  // List certifications
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
          .from(certifications)
          .where(
            and(
              eq(certifications.tenantId, user.tenantId),
              eq(certifications.reportId, reportId)
            )
          )
          .orderBy(desc(certifications.createdAt))
          .limit(50);
        return results;
      }

      const results = await db
        .select()
        .from(certifications)
        .where(eq(certifications.tenantId, user.tenantId))
        .orderBy(desc(certifications.createdAt))
        .limit(50);
      return results;
    }),

  // Get single certification
  get: protectedProcedure
    .input(z.object({
      certificationId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database connection failed');
      
      const { certificationId } = input;
      const { user } = ctx;

      const [result] = await db
        .select()
        .from(certifications)
        .where(
          and(
            eq(certifications.id, certificationId),
            eq(certifications.tenantId, user.tenantId)
          )
        )
        .limit(1);

      if (!result) {
        throw new Error('Certification not found');
      }

      return result;
    }),
});

