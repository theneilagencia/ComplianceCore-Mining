/**
 * Advanced export service for KRCI audit results
 * Supports Excel with charts, enhanced JSON, and improved Markdown
 */

interface ExportOptions {
  format: 'excel' | 'json' | 'markdown';
  includeCharts?: boolean;
  includeRawData?: boolean;
  includeRecommendations?: boolean;
}

interface AuditData {
  reportId: string;
  auditId: string;
  score: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  krcis: any[];
  createdAt: Date;
  reportData?: any;
}

/**
 * Export audit results to Excel with charts
 */
export async function exportToExcel(data: AuditData): Promise<Buffer> {
  // Note: This would require 'exceljs' package
  // For now, return CSV-like format that can be opened in Excel
  
  const csv = generateEnhancedCSV(data);
  return Buffer.from(csv, 'utf-8');
}

/**
 * Generate enhanced CSV for Excel
 */
function generateEnhancedCSV(data: AuditData): string {
  let csv = '';

  // Header section
  csv += 'KRCI Audit Report\n';
  csv += `Report ID,${data.reportId}\n`;
  csv += `Audit ID,${data.auditId}\n`;
  csv += `Score,${data.score}%\n`;
  csv += `Total Rules,${data.totalRules}\n`;
  csv += `Passed,${data.passedRules}\n`;
  csv += `Failed,${data.failedRules}\n`;
  csv += `Date,${data.createdAt.toISOString()}\n`;
  csv += '\n';

  // Summary by severity
  csv += 'Summary by Severity\n';
  csv += 'Severity,Count,Percentage\n';
  
  const bySeverity = data.krcis.reduce((acc, krci) => {
    acc[krci.severity] = (acc[krci.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(bySeverity).forEach(([severity, count]) => {
    const percentage = ((count / data.krcis.length) * 100).toFixed(1);
    csv += `${severity},${count},${percentage}%\n`;
  });
  csv += '\n';

  // Summary by category
  csv += 'Summary by Category\n';
  csv += 'Category,Count,Percentage\n';
  
  const byCategory = data.krcis.reduce((acc, krci) => {
    acc[krci.category] = (acc[krci.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(byCategory).forEach(([category, count]) => {
    const percentage = ((count / data.krcis.length) * 100).toFixed(1);
    csv += `${category},${count},${percentage}%\n`;
  });
  csv += '\n';

  // Detailed issues
  csv += 'Detailed Issues\n';
  csv += 'Code,Category,Severity,Section,Message,Weight\n';
  
  data.krcis.forEach(krci => {
    csv += `"${krci.code}","${krci.category}","${krci.severity}","${krci.section || 'N/A'}","${krci.message.replace(/"/g, '""')}",${krci.weight}\n`;
  });

  return csv;
}

/**
 * Export audit results to enhanced JSON
 */
export function exportToJSON(data: AuditData, options: ExportOptions): string {
  const json: any = {
    metadata: {
      reportId: data.reportId,
      auditId: data.auditId,
      exportDate: new Date().toISOString(),
      version: '1.0',
    },
    summary: {
      score: data.score,
      totalRules: data.totalRules,
      passedRules: data.passedRules,
      failedRules: data.failedRules,
      complianceLevel: getComplianceLevel(data.score),
    },
    statistics: {
      bySeverity: calculateBySeverity(data.krcis),
      byCategory: calculateByCategory(data.krcis),
      bySection: calculateBySection(data.krcis),
    },
    issues: data.krcis.map(krci => ({
      code: krci.code,
      category: krci.category,
      severity: krci.severity,
      section: krci.section,
      message: krci.message,
      weight: krci.weight,
      recommendation: krci.recommendation,
    })),
  };

  if (options.includeRawData) {
    json.rawData = data;
  }

  if (options.includeRecommendations) {
    json.recommendations = generateRecommendations(data);
  }

  return JSON.stringify(json, null, 2);
}

/**
 * Export audit results to enhanced Markdown
 */
export function exportToMarkdown(data: AuditData, options: ExportOptions): string {
  let md = '';

  // Header
  md += `# KRCI Audit Report\n\n`;
  md += `**Report ID**: ${data.reportId}  \n`;
  md += `**Audit ID**: ${data.auditId}  \n`;
  md += `**Date**: ${data.createdAt.toLocaleDateString('pt-BR')}  \n`;
  md += `**Score**: **${data.score}%** (${getComplianceLevel(data.score)})\n\n`;

  // Executive Summary
  md += `## Executive Summary\n\n`;
  md += `O relatório obteve um score KRCI de **${data.score}%**, `;
  md += `com ${data.passedRules} regras aprovadas e ${data.failedRules} não-conformidades identificadas.\n\n`;

  // Score visualization (ASCII bar)
  md += `### Score Visualization\n\n`;
  md += `\`\`\`\n`;
  md += `Score: ${data.score}%\n`;
  md += `[${'█'.repeat(Math.floor(data.score / 2))}${' '.repeat(50 - Math.floor(data.score / 2))}] ${data.score}%\n`;
  md += `\`\`\`\n\n`;

  // Summary by Severity
  md += `## Summary by Severity\n\n`;
  md += `| Severity | Count | Percentage |\n`;
  md += `|----------|-------|------------|\n`;
  
  const bySeverity = calculateBySeverity(data.krcis);
  Object.entries(bySeverity).forEach(([severity, count]) => {
    const percentage = ((count / data.krcis.length) * 100).toFixed(1);
    const emoji = getSeverityEmoji(severity);
    md += `| ${emoji} ${severity} | ${count} | ${percentage}% |\n`;
  });
  md += `\n`;

  // Summary by Category
  md += `## Summary by Category\n\n`;
  md += `| Category | Count | Percentage |\n`;
  md += `|----------|-------|------------|\n`;
  
  const byCategory = calculateByCategory(data.krcis);
  Object.entries(byCategory).forEach(([category, count]) => {
    const percentage = ((count / data.krcis.length) * 100).toFixed(1);
    md += `| ${category} | ${count} | ${percentage}% |\n`;
  });
  md += `\n`;

  // Detailed Issues
  md += `## Detailed Issues\n\n`;
  
  // Group by severity
  const groupedBySeverity = data.krcis.reduce((acc, krci) => {
    if (!acc[krci.severity]) {
      acc[krci.severity] = [];
    }
    acc[krci.severity].push(krci);
    return acc;
  }, {} as Record<string, any[]>);

  const severityOrder = ['critical', 'high', 'medium', 'low'];
  
  severityOrder.forEach(severity => {
    const issues = groupedBySeverity[severity];
    if (!issues || issues.length === 0) return;

    md += `### ${getSeverityEmoji(severity)} ${severity.toUpperCase()} (${issues.length})\n\n`;
    
    issues.forEach((krci, i) => {
      md += `#### ${i + 1}. ${krci.code} - ${krci.message}\n\n`;
      md += `- **Category**: ${krci.category}\n`;
      md += `- **Section**: ${krci.section || 'N/A'}\n`;
      md += `- **Weight**: ${krci.weight}\n`;
      if (krci.recommendation) {
        md += `- **Recommendation**: ${krci.recommendation}\n`;
      }
      md += `\n`;
    });
  });

  // Recommendations
  if (options.includeRecommendations) {
    md += `## Recommendations\n\n`;
    const recommendations = generateRecommendations(data);
    recommendations.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += `\n`;
  }

  // Next Steps
  md += `## Next Steps\n\n`;
  md += `1. Review and address all critical and high-severity issues\n`;
  md += `2. Update the report sections as recommended\n`;
  md += `3. Re-run KRCI audit to verify improvements\n`;
  md += `4. Prepare for Qualified Person review\n\n`;

  // Footer
  md += `---\n\n`;
  md += `*Generated by QIVO Mining - KRCI Audit System*  \n`;
  md += `*Export Date: ${new Date().toLocaleString('pt-BR')}*\n`;

  return md;
}

/**
 * Calculate statistics by severity
 */
function calculateBySeverity(krcis: any[]): Record<string, number> {
  return krcis.reduce((acc, krci) => {
    acc[krci.severity] = (acc[krci.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calculate statistics by category
 */
function calculateByCategory(krcis: any[]): Record<string, number> {
  return krcis.reduce((acc, krci) => {
    acc[krci.category] = (acc[krci.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Calculate statistics by section
 */
function calculateBySection(krcis: any[]): Record<string, number> {
  return krcis.reduce((acc, krci) => {
    const section = krci.section || 'Unknown';
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Get compliance level based on score
 */
function getComplianceLevel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Poor';
}

/**
 * Get emoji for severity
 */
function getSeverityEmoji(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔵';
    default:
      return '⚪';
  }
}

/**
 * Generate recommendations based on audit results
 */
function generateRecommendations(data: AuditData): string[] {
  const recommendations: string[] = [];
  
  const bySeverity = calculateBySeverity(data.krcis);
  const byCategory = calculateByCategory(data.krcis);

  // Critical issues
  if (bySeverity.critical > 0) {
    recommendations.push(
      `Address ${bySeverity.critical} critical issue(s) immediately - these prevent report approval`
    );
  }

  // High priority issues
  if (bySeverity.high > 0) {
    recommendations.push(
      `Resolve ${bySeverity.high} high-priority issue(s) to improve compliance significantly`
    );
  }

  // Category-specific recommendations
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[1] > 5) {
    recommendations.push(
      `Focus on ${topCategory[0]} category - ${topCategory[1]} issues identified, indicating systemic problems`
    );
  }

  // Score-based recommendations
  if (data.score < 60) {
    recommendations.push(
      'Consider comprehensive report revision - current score indicates substantial non-compliance'
    );
  } else if (data.score < 75) {
    recommendations.push(
      'Moderate improvements needed - focus on high-impact issues first'
    );
  } else if (data.score < 90) {
    recommendations.push(
      'Minor refinements needed - report is close to full compliance'
    );
  }

  return recommendations;
}

/**
 * Main export function
 */
export async function exportAuditResults(
  data: AuditData,
  options: ExportOptions
): Promise<{ content: string | Buffer; filename: string; mimeType: string }> {
  let content: string | Buffer;
  let filename: string;
  let mimeType: string;

  switch (options.format) {
    case 'excel':
      content = await exportToExcel(data);
      filename = `krci-audit-${data.reportId}.csv`;
      mimeType = 'text/csv';
      break;

    case 'json':
      content = exportToJSON(data, options);
      filename = `krci-audit-${data.reportId}.json`;
      mimeType = 'application/json';
      break;

    case 'markdown':
      content = exportToMarkdown(data, options);
      filename = `krci-audit-${data.reportId}.md`;
      mimeType = 'text/markdown';
      break;

    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }

  return { content, filename, mimeType };
}

