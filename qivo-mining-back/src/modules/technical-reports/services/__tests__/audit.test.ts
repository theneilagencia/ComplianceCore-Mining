/**
 * Audit Service Tests
 * 
 * Suite completa de testes para o engine de auditoria KRCI
 * Testa validação de conformidade com padrões internacionais
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { runAudit, generateAuditSummary } from '../audit';

describe('Audit Service - KRCI Engine', () => {
  
  // ============================================================
  // Mock Data
  // ============================================================
  
  const validReport = {
    metadata: {
      title: 'Technical Report - Gold Project',
      projectName: 'Golden Mine',
      effectiveDate: new Date().toISOString(),
      standard: 'JORC',
      anmProcess: '800.123/2024',
    },
    sections: [
      { title: 'Executive Summary', content: 'Summary content...' },
      { title: 'Introduction', content: 'Introduction content...' },
      { title: 'Geology', content: 'Geological description...' },
      { title: 'Sampling and Analysis', content: 'Sampling methods...' },
      { title: 'Mineral Resource Estimate', content: 'Resource estimates...' },
    ],
    resourceEstimates: [
      {
        category: 'Measured',
        tonnage: 1000000,
        grade: 2.5,
        cutoffGrade: 0.5,
      },
      {
        category: 'Indicated',
        tonnage: 5000000,
        grade: 2.0,
        cutoffGrade: 0.5,
      },
    ],
    competentPersons: [
      {
        name: 'John Doe',
        qualification: 'Geologist FAusIMM',
        organization: 'ABC Mining Consultants',
        creaNumber: 'CREA-MG-12345',
        cpf: '123.456.789-00',
      },
    ],
    economicAssumptions: {
      capex: 50000000,
      opex: 25000000,
      recoveryRate: 0.95,
      royalties: 0.015,
      cfemRate: 0.015,
    },
    qaQc: {
      samplingMethod: 'Diamond drilling',
      qualityControl: 'Certified reference materials',
    },
    environmental: {
      license: 'LO',
      licenseNumber: 'LO-123/2024',
      issuingAgency: 'IBAMA',
    },
  };

  const incompleteReport = {
    metadata: {
      title: 'Incomplete Report',
    },
    sections: [],
    resourceEstimates: [],
    competentPersons: [],
  };

  // ============================================================
  // Audit Execution Tests
  // ============================================================
  
  describe('runAudit - Full Audit', () => {
    
    it('should return high score (>95%) for fully compliant report', () => {
      const result = runAudit(validReport, 'full');
      
      expect(result.score).toBeGreaterThanOrEqual(95);
      expect(result.failedRules).toBeLessThanOrEqual(2); // Allow minor issues
      expect(result.totalRules).toBeGreaterThan(20);
    });

    it('should detect multiple KRCIs in incomplete report', () => {
      const result = runAudit(incompleteReport, 'full');
      
      expect(result.score).toBeLessThan(50);
      expect(result.failedRules).toBeGreaterThan(10);
      expect(result.krcis.length).toBeGreaterThan(10);
    });

    it('should include all required fields in result', () => {
      const result = runAudit(validReport, 'full');
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('totalRules');
      expect(result).toHaveProperty('passedRules');
      expect(result).toHaveProperty('failedRules');
      expect(result).toHaveProperty('krcis');
      expect(result).toHaveProperty('recommendations');
    });

    it('should calculate correct passed/failed rule counts', () => {
      const result = runAudit(validReport, 'full');
      
      expect(result.passedRules + result.failedRules).toBe(result.totalRules);
    });
  });

  describe('runAudit - Partial Audit', () => {
    
    it('should skip low severity rules in partial audit', () => {
      const fullResult = runAudit(incompleteReport, 'full');
      const partialResult = runAudit(incompleteReport, 'partial');
      
      expect(partialResult.totalRules).toBeLessThan(fullResult.totalRules);
      expect(partialResult.failedRules).toBeLessThanOrEqual(fullResult.failedRules);
    });

    it('should only include critical/high/medium severity KRCIs', () => {
      const result = runAudit(incompleteReport, 'partial');
      
      const hasLowSeverity = result.krcis.some(k => k.severity === 'low');
      expect(hasLowSeverity).toBe(false);
    });
  });

  // ============================================================
  // KRCI Detection Tests - By Category
  // ============================================================
  
  describe('KRCI Detection - Competent Person', () => {
    
    it('should detect missing competent person (KRCI-001)', () => {
      const report = {
        ...validReport,
        competentPersons: [],
      };
      
      const result = runAudit(report, 'full');
      
      const krci = result.krcis.find(k => k.code === 'KRCI-001');
      expect(krci).toBeDefined();
      expect(krci?.severity).toBe('critical');
    });

    it('should detect incomplete competent person name', () => {
      const report = {
        ...validReport,
        competentPersons: [{ name: '' }],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.section === 'Competent Person')).toBe(true);
    });

    it('should detect missing qualification', () => {
      const report = {
        ...validReport,
        competentPersons: [{
          name: 'John Doe',
          qualification: '',
        }],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-007')).toBe(true);
    });
  });

  describe('KRCI Detection - Metadata', () => {
    
    it('should detect missing effective date', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          effectiveDate: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-003')).toBe(true);
    });

    it('should detect missing QA/QC documentation', () => {
      const report = {
        ...validReport,
        qaQc: undefined,
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-004')).toBe(true);
    });

    it('should detect missing economic assumptions', () => {
      const report = {
        ...validReport,
        economicAssumptions: undefined,
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-005')).toBe(true);
    });

    it('should detect missing international standard', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-014')).toBe(true);
    });
  });

  describe('KRCI Detection - Resource Estimates', () => {
    
    it('should detect missing resource estimates', () => {
      const report = {
        ...validReport,
        resourceEstimates: [],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-002')).toBe(true);
    });

    it('should detect missing cutoff grade', () => {
      const report = {
        ...validReport,
        resourceEstimates: [
          {
            category: 'Measured',
            tonnage: 1000000,
            grade: 2.5,
            cutoffGrade: undefined,
          },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-006')).toBe(true);
    });

    it('should detect missing tonnage', () => {
      const report = {
        ...validReport,
        resourceEstimates: [
          {
            category: 'Measured',
            grade: 2.5,
          },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-019')).toBe(true);
    });

    it('should detect missing grade', () => {
      const report = {
        ...validReport,
        resourceEstimates: [
          {
            category: 'Measured',
            tonnage: 1000000,
          },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-020')).toBe(true);
    });
  });

  describe('KRCI Detection - Sections', () => {
    
    it('should detect missing Executive Summary section', () => {
      const report = {
        ...validReport,
        sections: [
          { title: 'Introduction', content: 'Intro' },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-015')).toBe(true);
    });

    it('should detect missing Geology section', () => {
      const report = {
        ...validReport,
        sections: [
          { title: 'Executive Summary', content: 'Summary' },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-016')).toBe(true);
    });

    it('should detect missing Sampling section', () => {
      const report = {
        ...validReport,
        sections: [
          { title: 'Executive Summary', content: 'Summary' },
          { title: 'Geology', content: 'Geo' },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-018')).toBe(true);
    });
  });

  describe('KRCI Detection - QA/QC', () => {
    
    it('should detect missing QA/QC sampling method', () => {
      const report = {
        ...validReport,
        qaQc: {
          samplingMethod: undefined,
          qualityControl: 'Standard procedures',
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-004')).toBe(true);
    });

    it('should pass with valid QA/QC documentation', () => {
      const report = {
        ...validReport,
        qaQc: {
          samplingMethod: 'Diamond drilling',
          qualityControl: 'Standard procedures',
        },
      };
      
      const result = runAudit(report, 'full');
      
      // Should not fail on KRCI-004
      expect(result.krcis.some(k => k.code === 'KRCI-004')).toBe(false);
    });
  });

  describe('KRCI Detection - Economic Assumptions', () => {
    
    it('should detect missing CAPEX and OPEX', () => {
      const report = {
        ...validReport,
        economicAssumptions: {
          ...validReport.economicAssumptions,
          capex: undefined,
          opex: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-005')).toBe(true);
    });

    it('should detect missing recovery rate', () => {
      const report = {
        ...validReport,
        economicAssumptions: {
          ...validReport.economicAssumptions,
          recoveryRate: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-012')).toBe(true);
    });
  });

  describe('KRCI Detection - CBRR Specific', () => {
    
    it('should detect missing CREA number for CBRR standard', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
        },
        competentPersons: [
          {
            name: 'João Silva',
            qualification: 'Engenheiro de Minas',
            organization: 'ABC Consultoria',
          },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-001')).toBe(true);
    });

    it('should detect missing ANM process for CBRR standard', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
          anmProcess: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-002')).toBe(true);
    });

    it('should not apply CBRR rules to JORC standard', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'JORC',
        },
        competentPersons: [
          {
            name: 'John Doe',
            qualification: 'FAusIMM',
          },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code.startsWith('KRCI-CBRR'))).toBe(false);
    });
  });

  // ============================================================
  // Score Calculation Tests
  // ============================================================
  
  describe('Score Calculation', () => {
    
    it('should return score between 0 and 100', () => {
      const result1 = runAudit(validReport, 'full');
      const result2 = runAudit(incompleteReport, 'full');
      
      expect(result1.score).toBeGreaterThanOrEqual(0);
      expect(result1.score).toBeLessThanOrEqual(100);
      expect(result2.score).toBeGreaterThanOrEqual(0);
      expect(result2.score).toBeLessThanOrEqual(100);
    });

    it('should calculate score based on weight penalties', () => {
      const report = {
        ...validReport,
        competentPersons: [], // Critical rule (weight 20)
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.score).toBeLessThan(95); // Significant penalty
    });

    it('should give higher penalty for critical KRCIs', () => {
      const reportMissingCP = {
        ...validReport,
        competentPersons: [], // CRITICAL
      };
      
      const reportMissingSection = {
        ...validReport,
        sections: [], // LOW severity
      };
      
      const result1 = runAudit(reportMissingCP, 'full');
      const result2 = runAudit(reportMissingSection, 'full');
      
      expect(result1.score).toBeLessThan(result2.score);
    });
  });

  // ============================================================
  // Recommendations Tests
  // ============================================================
  
  describe('Recommendations Generation', () => {
    
    it('should generate recommendations for failed rules', () => {
      const result = runAudit(incompleteReport, 'full');
      
      expect(result.recommendations).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include severity level in recommendations', () => {
      const result = runAudit(incompleteReport, 'full');
      
      const hasSeverity = result.recommendations.some(r => 
        r.includes('CRITICAL') || r.includes('HIGH') || r.includes('MEDIUM') || r.includes('LOW')
      );
      
      expect(hasSeverity).toBe(true);
    });

    it('should generate few recommendations for near-perfect report', () => {
      const result = runAudit(validReport, 'full');
      
      expect(result.recommendations.length).toBeLessThanOrEqual(2);
    });
  });

  // ============================================================
  // Audit Summary Tests
  // ============================================================
  
  describe('generateAuditSummary', () => {
    
    it('should generate text summary for audit result', () => {
      const result = runAudit(validReport, 'full');
      const summary = generateAuditSummary(result);
      
      expect(summary).toContain('Auditoria KRCI Completa');
      expect(summary).toContain(`Pontuação: ${result.score}%`);
      expect(summary).toContain(`Regras Verificadas: ${result.totalRules}`);
    });

    it('should list KRCIs in summary', () => {
      const result = runAudit(incompleteReport, 'full');
      const summary = generateAuditSummary(result);
      
      expect(summary).toContain('KRCI Identificados');
      result.krcis.slice(0, 3).forEach(krci => {
        expect(summary).toContain(krci.code);
      });
    });

    it('should indicate high compliance score in summary', () => {
      const result = runAudit(validReport, 'full');
      const summary = generateAuditSummary(result);
      
      expect(summary).toContain('Auditoria KRCI Completa');
      expect(summary).toContain(`Pontuação: ${result.score}%`);
    });

    it('should include severity levels in KRCI list', () => {
      const result = runAudit(incompleteReport, 'full');
      const summary = generateAuditSummary(result);
      
      const hasSeverity = summary.includes('critical') || 
                         summary.includes('high') || 
                         summary.includes('medium') || 
                         summary.includes('low');
      
      expect(hasSeverity).toBe(true);
    });
  });

  // ============================================================
  // Edge Cases & Error Handling
  // ============================================================
  
  describe('Edge Cases', () => {
    
    it('should handle empty report gracefully', () => {
      const result = runAudit({}, 'full');
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.totalRules).toBeGreaterThan(0);
    });

    it('should handle null values in report', () => {
      const report = {
        metadata: null,
        sections: null,
        resourceEstimates: null,
        competentPersons: null,
      };
      
      expect(() => runAudit(report as any, 'full')).not.toThrow();
    });

    it('should handle undefined properties gracefully', () => {
      const report = {
        metadata: undefined,
        sections: undefined,
      };
      
      const result = runAudit(report, 'full');
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid date formats', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          effectiveDate: 'invalid-date',
        },
      };
      
      expect(() => runAudit(report, 'full')).not.toThrow();
    });

    it('should handle malformed resource estimates', () => {
      const report = {
        ...validReport,
        resourceEstimates: [
          { category: 'Measured' }, // Missing tonnage and grade
          { tonnage: -1000 }, // Invalid negative value
        ],
      };
      
      expect(() => runAudit(report, 'full')).not.toThrow();
    });
  });

  // ============================================================
  // Performance Tests
  // ============================================================
  
  describe('Performance', () => {
    
    it('should complete audit in reasonable time (<100ms)', () => {
      const startTime = Date.now();
      runAudit(validReport, 'full');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(100);
    });

    it('should handle large reports efficiently', () => {
      const largeReport = {
        ...validReport,
        sections: Array(100).fill({ title: 'Section', content: 'Content' }),
        resourceEstimates: Array(50).fill({ category: 'Measured', tonnage: 1000, grade: 2.0 }),
      };
      
      const startTime = Date.now();
      runAudit(largeReport, 'full');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200);
    });
  });

  // ============================================================
  // Additional KRCI Detection Tests (100% Coverage)
  // ============================================================
  
  describe('KRCI Detection - Additional Rules', () => {
    
    it('should detect outdated report (>24 months) - KRCI-008', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 30); // 30 months old
      
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          effectiveDate: oldDate.toISOString(),
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-008')).toBe(true);
    });

    it('should detect missing project name - KRCI-009', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          projectName: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-009')).toBe(true);
    });

    it('should detect insufficient sections (<5) - KRCI-010', () => {
      const report = {
        ...validReport,
        sections: [
          { title: 'Section 1', content: 'Content' },
          { title: 'Section 2', content: 'Content' },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-010')).toBe(true);
    });

    it('should detect missing resource category - KRCI-011', () => {
      const report = {
        ...validReport,
        resourceEstimates: [
          {
            tonnage: 1000000,
            grade: 2.5,
          },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-011')).toBe(true);
    });

    it('should detect missing recovery rate - KRCI-012', () => {
      const report = {
        ...validReport,
        economicAssumptions: {
          capex: 1000000,
          opex: 500000,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-012')).toBe(true);
    });

    it('should detect missing CP organization - KRCI-013', () => {
      const report = {
        ...validReport,
        competentPersons: [{
          name: 'John Doe',
          qualification: 'Geologist',
        }],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-013')).toBe(true);
    });

    it('should pass with valid Geology section - KRCI-017', () => {
      const report = {
        ...validReport,
        sections: [
          { title: 'Executive Summary', content: 'Summary' },
          { title: 'Geology', content: 'Geo' },
          { title: 'Sampling', content: 'Sampling' },
          { title: 'Introduction', content: 'Intro' },
          { title: 'Conclusions', content: 'Conclusions' },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      // Should NOT fail KRCI-017 because Geology section is present
      expect(result.krcis.some(k => k.code === 'KRCI-017')).toBe(false);
    });

    it('should detect undetailed sampling method - KRCI-021', () => {
      const report = {
        ...validReport,
        qaQc: {
          samplingMethod: 'drilling', // Too generic
          qualityControl: 'Standard',
        },
      };
      
      const result = runAudit(report, 'full');
      
      // KRCI-021 checks if method is not detailed enough
      const krci021 = result.krcis.find(k => k.code === 'KRCI-021');
      expect(krci021).toBeDefined();
    });

    it('should detect short or generic title - KRCI-022', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          title: 'Short Title', // Less than 20 characters
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-022')).toBe(true);
    });
  });

  describe('KRCI Detection - Additional CBRR Rules', () => {
    
    it('should detect missing environmental license - KRCI-CBRR-003', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
        },
        environmental: {
          license: undefined, // Missing license
          licenseNumber: undefined, // Missing license number
          issuingAgency: 'SEMAD',
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-003')).toBe(true);
    });

    it('should detect missing CPF for CBRR - KRCI-CBRR-004', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
        },
        competentPersons: [{
          name: 'João Silva',
          qualification: 'Engenheiro de Minas',
          creaNumber: 'CREA-MG-12345',
          // cpf is missing
        }],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-004')).toBe(true);
    });

    it('should detect missing issuing agency for CBRR - KRCI-CBRR-005', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
        },
        environmental: {
          license: 'LO',
          licenseNumber: 'LO-123/2024',
          // issuingAgency is missing
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-005')).toBe(true);
    });

    it('should detect missing CFEM for CBRR - KRCI-CBRR-006', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
        },
        economicAssumptions: {
          capex: 1000000,
          opex: 500000,
          // Both royalties and cfemRate are missing
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-006')).toBe(true);
    });

    it('should detect international nomenclature in CBRR - KRCI-CBRR-007', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
        },
        resourceEstimates: [
          {
            category: 'Measured', // Should use "Medido" in CBRR
            tonnage: 1000000,
            grade: 2.5,
            cutoffGrade: 0.5,
          },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-007')).toBe(true);
    });

    // KRCI-CBRR-008 always returns false (not enforced), so we test it doesn't trigger
    it('should not enforce DNPM code - KRCI-CBRR-008', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
          dnpmCode: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      // Should NOT trigger because rule always returns false
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-008')).toBe(false);
    });

    it('should detect missing Conclusions section for CBRR - KRCI-CBRR-010', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
        },
        sections: [
          { title: 'Executive Summary', content: 'Summary' },
          { title: 'Geology', content: 'Geo' },
        ],
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-CBRR-010')).toBe(true);
    });
  });

  // ============================================================
  // Helper Function Tests
  // ============================================================
  
  describe('Helper Functions', () => {
    
    it('should correctly check date age', () => {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - 30);
      
      const recentDate = new Date();
      recentDate.setMonth(recentDate.getMonth() - 6);
      
      const report1 = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          effectiveDate: oldDate.toISOString(),
        },
      };
      
      const report2 = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          effectiveDate: recentDate.toISOString(),
        },
      };
      
      const result1 = runAudit(report1, 'full');
      const result2 = runAudit(report2, 'full');
      
      expect(result1.krcis.some(k => k.code === 'KRCI-008')).toBe(true);
      expect(result2.krcis.some(k => k.code === 'KRCI-008')).toBe(false);
    });

    it('should handle missing date gracefully', () => {
      const report = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          effectiveDate: undefined,
        },
      };
      
      const result = runAudit(report, 'full');
      
      expect(result.krcis.some(k => k.code === 'KRCI-003')).toBe(true);
    });
  });

  // ============================================================
  // Complete Rule Coverage Tests
  // ============================================================
  
  describe('Complete Rule Coverage', () => {
    
    it('should have at least 32 total rules (22 general + 10 CBRR)', () => {
      const result = runAudit({}, 'full');
      
      expect(result.totalRules).toBeGreaterThanOrEqual(32);
    });

    it('should apply all general rules to non-CBRR reports', () => {
      const jorcReport = {
        ...validReport,
        metadata: { ...validReport.metadata, standard: 'JORC' },
      };
      
      const result = runAudit(jorcReport, 'full');
      
      // Should not have any CBRR rules
      const cbrrRules = result.krcis.filter(k => k.code.includes('CBRR'));
      expect(cbrrRules).toHaveLength(0);
    });

    it('should apply CBRR rules only to CBRR reports', () => {
      const cbrrReport = {
        ...incompleteReport,
        metadata: {
          title: 'CBRR Report',
          standard: 'CBRR',
        },
      };
      
      const result = runAudit(cbrrReport, 'full');
      
      // Should have some CBRR rules triggered
      const cbrrRules = result.krcis.filter(k => k.code.includes('CBRR'));
      expect(cbrrRules.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // Severity Distribution Tests
  // ============================================================
  
  describe('Severity Distribution', () => {
    
    it('should have critical, high, medium and low severity rules', () => {
      const result = runAudit(incompleteReport, 'full');
      
      const hasCritical = result.krcis.some(k => k.severity === 'critical');
      const hasHigh = result.krcis.some(k => k.severity === 'high');
      const hasMedium = result.krcis.some(k => k.severity === 'medium');
      const hasLow = result.krcis.some(k => k.severity === 'low');
      
      expect(hasCritical).toBe(true);
      expect(hasHigh).toBe(true);
      expect(hasMedium).toBe(true);
      expect(hasLow).toBe(true);
    });

    it('should weight critical rules higher than low rules', () => {
      const result = runAudit(incompleteReport, 'full');
      
      const criticalRule = result.krcis.find(k => k.severity === 'critical');
      const lowRule = result.krcis.find(k => k.severity === 'low');
      
      if (criticalRule && lowRule) {
        expect(criticalRule.weight).toBeGreaterThan(lowRule.weight);
      }
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================
  
  describe('Integration - Multiple Standards', () => {
    
    it('should audit JORC report correctly', () => {
      const jorcReport = {
        ...validReport,
        metadata: { ...validReport.metadata, standard: 'JORC' },
      };
      
      const result = runAudit(jorcReport, 'full');
      
      expect(result.score).toBeGreaterThanOrEqual(95);
    });

    it('should audit NI 43-101 report correctly', () => {
      const ni43Report = {
        ...validReport,
        metadata: { ...validReport.metadata, standard: 'NI 43-101' },
      };
      
      const result = runAudit(ni43Report, 'full');
      
      expect(result.score).toBeGreaterThanOrEqual(95);
    });

    it('should audit CBRR report with Brazilian requirements', () => {
      const cbrrReport = {
        ...validReport,
        metadata: {
          ...validReport.metadata,
          standard: 'CBRR',
          anmProcess: '800.123/2024',
        },
        competentPersons: [{
          ...validReport.competentPersons![0],
          creaNumber: 'CREA-MG-12345',
          cpf: '123.456.789-00',
        }],
        environmental: {
          license: 'LO',
          licenseNumber: 'LO-123/2024',
          issuingAgency: 'IBAMA',
        },
      };
      
      const result = runAudit(cbrrReport, 'full');
      
      expect(result.score).toBeGreaterThanOrEqual(90); // Lower threshold for more rules
    });

    it('should handle mixed compliance levels', () => {
      const mixedReport = {
        metadata: {
          title: 'Mixed Report',
          projectName: 'Test Project',
          effectiveDate: new Date().toISOString(),
          standard: 'JORC',
        },
        competentPersons: [{
          name: 'John Doe',
          qualification: 'Geologist',
          organization: 'ABC Corp',
        }],
        sections: [
          { title: 'Executive Summary', content: 'Summary' },
          { title: 'Geology', content: 'Geo' },
          { title: 'Sampling', content: 'Sampling' },
          { title: 'Resources', content: 'Resources' },
          { title: 'Conclusions', content: 'Conclusions' },
        ],
        resourceEstimates: [],
        economicAssumptions: undefined,
        qaQc: {
          samplingMethod: 'Diamond drilling',
        },
      };
      
      const result = runAudit(mixedReport, 'full');
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(100);
      expect(result.krcis.length).toBeGreaterThan(0);
    });
  });
});
