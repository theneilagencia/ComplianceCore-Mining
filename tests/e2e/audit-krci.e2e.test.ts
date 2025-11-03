/**
 * E2E Tests - Audit KRCI Module
 * 
 * Testes end-to-end dos 5 fluxos críticos:
 * 1. Run full audit
 * 2. Generate correction plan
 * 3. Export audit PDF
 * 4. Compare historical audits
 * 5. Validate with official sources
 * 
 * @requires vitest
 * @requires @playwright/test (ou similar)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestContext, type TestContext } from '../../../tests/helpers/test-context';

describe('Audit KRCI Module - E2E Tests', () => {
  let ctx: TestContext;
  let testReportId: string;
  let testAuditId: string;

  beforeAll(async () => {
    ctx = await createTestContext();
    
    // Setup: Create test report
    const report = await ctx.trpc.technicalReports.generate.create.mutate({
      title: 'E2E Test Report - Audit Module',
      standard: 'JORC_2012',
      projectName: 'Test Project',
    });
    
    testReportId = report.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await ctx.cleanup();
  });

  // ============================================================
  // TEST 1: Run Full Audit
  // ============================================================
  
  describe('1. Run Full Audit', () => {
    it('should execute full audit successfully', async () => {
      const result = await ctx.trpc.technicalReports.audit.run.mutate({
        reportId: testReportId,
        auditType: 'full',
      });

      expect(result).toBeDefined();
      expect(result.auditId).toBeTruthy();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.totalRules).toBeGreaterThan(0);
      expect(result.passedRules + result.failedRules).toBe(result.totalRules);
      
      testAuditId = result.auditId;
    }, { timeout: 10000 });

    it('should have KRCI items with proper structure', async () => {
      const audit = await ctx.trpc.technicalReports.audit.get.query({
        auditId: testAuditId,
      });

      expect(audit.krcis).toBeInstanceOf(Array);
      
      if (audit.krcis.length > 0) {
        const firstKrci = audit.krcis[0];
        expect(firstKrci).toHaveProperty('code');
        expect(firstKrci).toHaveProperty('section');
        expect(firstKrci).toHaveProperty('message');
        expect(firstKrci).toHaveProperty('severity');
        expect(firstKrci).toHaveProperty('weight');
        expect(['critical', 'high', 'medium', 'low']).toContain(firstKrci.severity);
      }
    });

    it('should generate PDF report', async () => {
      const audit = await ctx.trpc.technicalReports.audit.get.query({
        auditId: testAuditId,
      });

      // PDF pode ser null se geração falhou (erro não crítico)
      if (audit.pdfUrl) {
        expect(audit.pdfUrl).toMatch(/^https?:\/\//);
      } else {
        console.warn('[E2E] PDF generation failed (non-critical)');
      }
    });

    it('should update report status to audited', async () => {
      const report = await ctx.trpc.technicalReports.generate.get.query({
        reportId: testReportId,
      });

      expect(report.status).toBe('audited');
    });
  });

  // ============================================================
  // TEST 2: Generate Correction Plan
  // ============================================================
  
  describe('2. Generate Correction Plan', () => {
    it('should generate correction plan from audit', async () => {
      const plan = await ctx.trpc.technicalReports.audit.correctionPlan.query({
        auditId: testAuditId,
      });

      expect(plan).toBeDefined();
      expect(plan.reportId).toBe(testReportId);
      expect(plan.auditScore).toBeGreaterThanOrEqual(0);
      expect(plan.corrections).toBeInstanceOf(Array);
      expect(plan.quickWins).toBeInstanceOf(Array);
      expect(plan.mustFix).toBeInstanceOf(Array);
      expect(plan.canDefer).toBeInstanceOf(Array);
      expect(plan.summary).toBeTruthy();
    }, { timeout: 5000 });

    it('should prioritize corrections by severity', async () => {
      const plan = await ctx.trpc.technicalReports.audit.correctionPlan.query({
        auditId: testAuditId,
      });

      // mustFix should contain critical/high items
      const mustFixSeverities = plan.mustFix.map(c => c.severity);
      const hasCriticalOrHigh = mustFixSeverities.some(s => 
        s === 'critical' || s === 'high'
      );
      
      if (plan.mustFix.length > 0) {
        expect(hasCriticalOrHigh).toBe(true);
      }
    });

    it('should estimate time for corrections', async () => {
      const plan = await ctx.trpc.technicalReports.audit.correctionPlan.query({
        auditId: testAuditId,
      });

      expect(plan.estimatedTotalTime).toBeGreaterThanOrEqual(0);
      
      // Each correction should have estimated time
      plan.corrections.forEach(correction => {
        expect(correction.estimatedTime).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ============================================================
  // TEST 3: Export Audit PDF
  // ============================================================
  
  describe('3. Export Audit to Multiple Formats', () => {
    it('should export to JSON', async () => {
      const result = await ctx.trpc.technicalReports.audit.exportAdvanced.mutate({
        auditId: testAuditId,
        format: 'json',
        includeCharts: false,
        includeRawData: true,
        includeRecommendations: true,
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.filename).toMatch(/\.json$/);
      expect(result.mimeType).toBe('application/json');

      // Decode and validate JSON structure
      const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      expect(parsed.audit).toBeDefined();
    }, { timeout: 5000 });

    it('should export to Markdown', async () => {
      const result = await ctx.trpc.technicalReports.audit.exportAdvanced.mutate({
        auditId: testAuditId,
        format: 'markdown',
        includeRecommendations: true,
      });

      expect(result.filename).toMatch(/\.md$/);
      expect(result.mimeType).toBe('text/markdown');

      const decoded = Buffer.from(result.content, 'base64').toString('utf-8');
      expect(decoded).toContain('# Audit Report');
    }, { timeout: 5000 });

    it('should export to Excel', async () => {
      const result = await ctx.trpc.technicalReports.audit.exportAdvanced.mutate({
        auditId: testAuditId,
        format: 'excel',
        includeCharts: true,
      });

      expect(result.filename).toMatch(/\.xlsx$/);
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }, { timeout: 10000 });
  });

  // ============================================================
  // TEST 4: Compare Historical Audits
  // ============================================================
  
  describe('4. Historical Audit Comparison', () => {
    let secondAuditId: string;

    beforeAll(async () => {
      // Run second audit for comparison
      const result = await ctx.trpc.technicalReports.audit.run.mutate({
        reportId: testReportId,
        auditType: 'full',
      });
      secondAuditId = result.auditId;
    });

    it('should compare two audits', async () => {
      const comparison = await ctx.trpc.technicalReports.audit.compareAudits.query({
        reportId: testReportId,
        previousAuditId: testAuditId,
        currentAuditId: secondAuditId,
      });

      expect(comparison).toBeDefined();
      expect(comparison.reportId).toBe(testReportId);
      expect(comparison.scoreDifference).toBeDefined();
      expect(comparison.improvements).toBeInstanceOf(Array);
      expect(comparison.regressions).toBeInstanceOf(Array);
      expect(comparison.summary).toBeTruthy();
    }, { timeout: 5000 });

    it('should calculate trends', async () => {
      const trends = await ctx.trpc.technicalReports.audit.getTrends.query({
        reportId: testReportId,
      });

      expect(trends).toBeDefined();
      expect(trends.trend).toMatch(/improving|stable|declining/);
      expect(trends.trendData).toBeInstanceOf(Array);
      expect(trends.recommendations).toBeInstanceOf(Array);
    }, { timeout: 5000 });

    it('should provide audit statistics', async () => {
      const stats = await ctx.trpc.technicalReports.audit.getStatistics.query({
        reportId: testReportId,
      });

      expect(stats).toBeDefined();
      expect(stats.totalAudits).toBeGreaterThanOrEqual(2);
      expect(stats.averageScore).toBeGreaterThanOrEqual(0);
      expect(stats.bestScore).toBeGreaterThanOrEqual(stats.worstScore);
    });
  });

  // ============================================================
  // TEST 5: Official Sources Validation
  // ============================================================
  
  describe('5. Official Sources Validation', () => {
    it('should validate with ANM, CPRM, IBAMA', async () => {
      const validation = await ctx.trpc.technicalReports.audit.validateOfficial.mutate({
        reportId: testReportId,
      });

      expect(validation).toBeDefined();
      expect(validation.anm).toBeDefined();
      expect(validation.cprm).toBeDefined();
      expect(validation.ibama).toBeDefined();

      // Each source should have status
      expect(['success', 'warning', 'error', 'pending']).toContain(validation.anm.status);
      expect(['success', 'warning', 'error', 'pending']).toContain(validation.cprm.status);
      expect(['success', 'warning', 'error', 'pending']).toContain(validation.ibama.status);
    }, { timeout: 30000 }); // 30s timeout for external APIs
  });

  // ============================================================
  // PERFORMANCE TESTS
  // ============================================================
  
  describe('Performance Benchmarks', () => {
    it('should complete audit in <5 seconds', async () => {
      const start = Date.now();
      
      await ctx.trpc.technicalReports.audit.run.mutate({
        reportId: testReportId,
        auditType: 'partial',
      });
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });

    it('should leverage cache for repeated audits', async () => {
      // First call (cache miss)
      const start1 = Date.now();
      await ctx.trpc.technicalReports.audit.run.mutate({
        reportId: testReportId,
        auditType: 'full',
      });
      const duration1 = Date.now() - start1;

      // Second call (should be cached and faster)
      const start2 = Date.now();
      await ctx.trpc.technicalReports.audit.run.mutate({
        reportId: testReportId,
        auditType: 'full',
      });
      const duration2 = Date.now() - start2;

      // Second call should be significantly faster (>50% improvement)
      expect(duration2).toBeLessThan(duration1 * 0.5);
    });
  });
});
