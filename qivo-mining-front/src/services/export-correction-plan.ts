/**
 * Export Service para Planos de Correção
 * BUG-006 fix: Extrai lógica de export do componente
 */

interface CorrectionItem {
  ruleCode: string;
  category: string;
  section: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  weight: number;
  priority: number;
  estimatedTime: number;
  suggestedFix: string;
  autoFixAvailable: boolean;
  steps: string[];
}

interface CorrectionPlanData {
  reportId: string;
  auditScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  estimatedTotalTime: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  corrections: CorrectionItem[];
  quickWins: CorrectionItem[];
  mustFix: CorrectionItem[];
  canDefer: CorrectionItem[];
  summary: string;
  createdAt: Date;
}

type ExportFormat = 'json' | 'markdown' | 'csv';

/**
 * Exporta plano de correção em formato especificado
 */
export function exportCorrectionPlan(
  plan: CorrectionPlanData,
  format: ExportFormat
): void {
  let content = '';
  let mimeType = 'text/plain';
  let extension: string = format;

  if (format === 'json') {
    content = JSON.stringify(plan, null, 2);
    mimeType = 'application/json';
  } else if (format === 'markdown') {
    content = generateMarkdown(plan);
    mimeType = 'text/markdown';
    extension = 'md';
  } else if (format === 'csv') {
    content = generateCSV(plan);
    mimeType = 'text/csv';
  }

  // Create and download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `correction-plan-${plan.reportId}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Gera conteúdo Markdown
 */
function generateMarkdown(plan: CorrectionPlanData): string {
  let md = `# Plano de Correção - KRCI\n\n`;
  md += `${plan.summary}\n\n`;
  md += `## Resumo\n\n`;
  md += `- **Score KRCI**: ${plan.auditScore}%\n`;
  md += `- **Total de Issues**: ${plan.totalIssues}\n`;
  md += `- **Tempo Estimado**: ${Math.floor(plan.estimatedTotalTime / 60)}h ${plan.estimatedTotalTime % 60}m\n\n`;
  md += `## Correções\n\n`;

  plan.corrections.forEach((item, i) => {
    md += `### ${i + 1}. ${item.ruleCode} - ${item.issue}\n`;
    md += `- **Categoria**: ${item.category}\n`;
    md += `- **Severidade**: ${item.severity}\n`;
    md += `- **Prioridade**: ${item.priority}\n`;
    md += `- **Tempo Estimado**: ${item.estimatedTime} min\n`;
    md += `- **Sugestão**: ${item.suggestedFix}\n\n`;
  });

  return md;
}

/**
 * Gera conteúdo CSV
 */
function generateCSV(plan: CorrectionPlanData): string {
  let csv = 'Code,Category,Severity,Priority,Time,Issue,Suggestion\n';
  
  plan.corrections.forEach((item) => {
    csv += `"${item.ruleCode}",`;
    csv += `"${item.category}",`;
    csv += `"${item.severity}",`;
    csv += `${item.priority},`;
    csv += `${item.estimatedTime},`;
    csv += `"${item.issue.replace(/"/g, '""')}",`; // Escape quotes
    csv += `"${item.suggestedFix.replace(/"/g, '""')}"\n`;
  });

  return csv;
}
