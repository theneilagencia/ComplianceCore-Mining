/**
 * Correction Plan Service
 * 
 * Generates automatic correction plans based on KRCI audit results.
 * Prioritizes issues, estimates time, and provides actionable suggestions.
 */

import type { KRCIScanResult, RuleSeverity, RuleCategory } from './krci-extended';

export interface CorrectionItem {
  ruleCode: string;
  category: RuleCategory;
  section: string;
  issue: string;
  severity: RuleSeverity;
  weight: number;
  priority: number; // 1-100, higher = more urgent
  estimatedTime: number; // minutes
  suggestedFix: string;
  autoFixAvailable: boolean;
  steps: string[];
}

export interface CorrectionPlan {
  reportId: string;
  auditScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  estimatedTotalTime: number; // minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  corrections: CorrectionItem[];
  quickWins: CorrectionItem[]; // Low effort, high impact
  mustFix: CorrectionItem[]; // Critical issues
  canDefer: CorrectionItem[]; // Low priority
  summary: string;
  createdAt: Date;
}

/**
 * Calculate priority score for a correction item
 * Priority = (weight * severityMultiplier) / estimatedTime
 */
function calculatePriority(
  weight: number,
  severity: RuleSeverity,
  estimatedTime: number
): number {
  const severityMultipliers = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const multiplier = severityMultipliers[severity];
  const rawPriority = (weight * multiplier) / Math.max(estimatedTime, 1);

  // Normalize to 1-100 scale
  return Math.min(100, Math.max(1, Math.round(rawPriority * 10)));
}

/**
 * Estimate time to fix based on rule category and severity
 */
function estimateFixTime(
  category: RuleCategory,
  severity: RuleSeverity
): number {
  // Base times in minutes
  const baseTimes: Record<RuleCategory, number> = {
    tenure: 30, // Requires document lookup
    geo: 45, // Requires technical analysis
    esg: 60, // Requires external validation
    norma: 20, // Mostly formatting
    satelite: 40, // Requires image analysis
    benchmark: 35, // Requires research
  };

  const severityMultipliers: Record<RuleSeverity, number> = {
    critical: 1.5,
    high: 1.2,
    medium: 1.0,
    low: 0.7,
  };

  const baseTime = baseTimes[category] || 30;
  const multiplier = severityMultipliers[severity];

  return Math.round(baseTime * multiplier);
}

/**
 * Generate suggested fix text based on rule code and recommendation
 */
function generateSuggestedFix(
  ruleCode: string,
  recommendation: string | undefined,
  category: RuleCategory
): string {
  if (recommendation) {
    return recommendation;
  }

  // Fallback suggestions by category
  const fallbacks: Record<RuleCategory, string> = {
    tenure: 'Consulte a documentação do processo minerário e inclua as informações faltantes na seção de Tenure.',
    geo: 'Revise os dados geológicos e inclua descrições técnicas detalhadas conforme padrão CRIRSCO.',
    esg: 'Obtenha as licenças ambientais necessárias e inclua cópias digitalizadas no relatório.',
    norma: 'Revise o relatório para garantir conformidade com todas as seções obrigatórias do padrão.',
    satelite: 'Adicione imagens de satélite recentes e análise de mudanças temporais.',
    benchmark: 'Identifique depósitos análogos na literatura técnica e inclua comparações.',
  };

  return fallbacks[category] || 'Revise e corrija conforme recomendações do padrão CRIRSCO.';
}

/**
 * Generate step-by-step instructions for fixing an issue
 */
function generateSteps(
  ruleCode: string,
  category: RuleCategory,
  issue: string
): string[] {
  const commonSteps: Record<RuleCategory, string[]> = {
    tenure: [
      'Acesse o sistema SIGMINE da ANM',
      'Localize o processo minerário pelo número',
      'Extraia as informações necessárias',
      'Atualize a seção de Tenure no relatório',
      'Verifique se todas as informações estão corretas',
    ],
    geo: [
      'Revise os dados de sondagem e amostragem',
      'Consulte mapas geológicos regionais',
      'Atualize descrições técnicas',
      'Inclua referências bibliográficas',
      'Valide com o geólogo responsável',
    ],
    esg: [
      'Identifique licenças ambientais necessárias',
      'Consulte órgãos ambientais (IBAMA, órgãos estaduais)',
      'Obtenha cópias das licenças',
      'Verifique validade e condicionantes',
      'Anexe documentos ao relatório',
    ],
    norma: [
      'Identifique seções faltantes do padrão',
      'Revise checklist de conformidade',
      'Adicione conteúdo necessário',
      'Formate conforme template',
      'Execute auditoria novamente',
    ],
    satelite: [
      'Acesse plataformas de imagens (Copernicus, NASA)',
      'Baixe imagens recentes da área',
      'Realize análise de mudanças temporais',
      'Calcule índices (NDVI, etc.)',
      'Inclua imagens e análises no relatório',
    ],
    benchmark: [
      'Pesquise depósitos análogos na literatura',
      'Identifique parâmetros comparáveis',
      'Compile dados de referência',
      'Crie tabelas comparativas',
      'Adicione referências técnicas',
    ],
  };

  return commonSteps[category] || [
    'Identifique a causa raiz do problema',
    'Consulte documentação técnica',
    'Corrija o conteúdo',
    'Valide a correção',
    'Execute auditoria novamente',
  ];
}

/**
 * Determine if an issue can be auto-fixed
 */
function canAutoFix(ruleCode: string, category: RuleCategory): boolean {
  // Only formatting and simple data issues can be auto-fixed
  const autoFixableCategories: RuleCategory[] = ['norma'];
  
  // Specific rules that can be auto-fixed
  const autoFixableRules = [
    'KRCI-N001', // Missing sections (can add template)
    'KRCI-N002', // Date format
    'KRCI-N015', // Table formatting
  ];

  return (
    autoFixableCategories.includes(category) ||
    autoFixableRules.includes(ruleCode)
  );
}

/**
 * Generate overall plan priority
 */
function determinePlanPriority(corrections: CorrectionItem[]): 'critical' | 'high' | 'medium' | 'low' {
  const criticalCount = corrections.filter(c => c.severity === 'critical').length;
  const highCount = corrections.filter(c => c.severity === 'high').length;

  if (criticalCount >= 5) return 'critical';
  if (criticalCount >= 2 || highCount >= 10) return 'high';
  if (highCount >= 5) return 'medium';
  return 'low';
}

/**
 * Generate executive summary of the correction plan
 */
function generateSummary(plan: Omit<CorrectionPlan, 'summary'>): string {
  const { auditScore, totalIssues, criticalIssues, estimatedTotalTime, priority } = plan;

  const hours = Math.floor(estimatedTotalTime / 60);
  const minutes = estimatedTotalTime % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

  let summary = `O relatório obteve score KRCI de ${auditScore}% e apresenta ${totalIssues} não-conformidades. `;

  if (criticalIssues > 0) {
    summary += `Há ${criticalIssues} issues críticas que devem ser corrigidas imediatamente. `;
  }

  summary += `O tempo estimado para correção completa é de ${timeStr}. `;

  if (priority === 'critical') {
    summary += 'Ação urgente necessária para atingir conformidade mínima.';
  } else if (priority === 'high') {
    summary += 'Recomenda-se iniciar correções o mais breve possível.';
  } else if (priority === 'medium') {
    summary += 'Correções podem ser agendadas conforme disponibilidade.';
  } else {
    summary += 'Issues de baixa prioridade, podem ser tratadas gradualmente.';
  }

  return summary;
}

/**
 * Main function to generate correction plan from KRCI audit result
 */
export function generateCorrectionPlan(
  reportId: string,
  auditResult: KRCIScanResult
): CorrectionPlan {
  // Convert KRCI issues to correction items
  const corrections: CorrectionItem[] = auditResult.krcis.map((krci) => {
    const estimatedTime = estimateFixTime(krci.category, krci.severity);
    const priority = calculatePriority(krci.weight, krci.severity, estimatedTime);

    return {
      ruleCode: krci.code,
      category: krci.category,
      section: krci.section,
      issue: krci.message,
      severity: krci.severity,
      weight: krci.weight,
      priority,
      estimatedTime,
      suggestedFix: generateSuggestedFix(krci.code, krci.recommendation, krci.category),
      autoFixAvailable: canAutoFix(krci.code, krci.category),
      steps: generateSteps(krci.code, krci.category, krci.message),
    };
  });

  // Sort by priority (highest first)
  corrections.sort((a, b) => b.priority - a.priority);

  // Categorize corrections
  const mustFix = corrections.filter(c => c.severity === 'critical');
  const quickWins = corrections.filter(
    c => c.estimatedTime <= 30 && c.priority >= 50
  );
  const canDefer = corrections.filter(
    c => c.severity === 'low' && c.priority < 30
  );

  // Count by severity
  const criticalIssues = corrections.filter(c => c.severity === 'critical').length;
  const highIssues = corrections.filter(c => c.severity === 'high').length;
  const mediumIssues = corrections.filter(c => c.severity === 'medium').length;
  const lowIssues = corrections.filter(c => c.severity === 'low').length;

  // Calculate total estimated time
  const estimatedTotalTime = corrections.reduce((sum, c) => sum + c.estimatedTime, 0);

  // Build plan
  const planWithoutSummary = {
    reportId,
    auditScore: auditResult.score,
    totalIssues: corrections.length,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    estimatedTotalTime,
    priority: determinePlanPriority(corrections),
    corrections,
    quickWins,
    mustFix,
    canDefer,
    createdAt: new Date(),
  };

  const summary = generateSummary(planWithoutSummary);

  return {
    ...planWithoutSummary,
    summary,
  };
}

/**
 * Export correction plan to different formats
 */
export function exportCorrectionPlan(
  plan: CorrectionPlan,
  format: 'json' | 'markdown' | 'csv'
): string {
  if (format === 'json') {
    return JSON.stringify(plan, null, 2);
  }

  if (format === 'markdown') {
    let md = `# Plano de Correção - KRCI\n\n`;
    md += `**Report ID**: ${plan.reportId}\n`;
    md += `**Score KRCI**: ${plan.auditScore}%\n`;
    md += `**Total de Issues**: ${plan.totalIssues}\n`;
    md += `**Tempo Estimado**: ${Math.floor(plan.estimatedTotalTime / 60)}h ${plan.estimatedTotalTime % 60}min\n`;
    md += `**Prioridade**: ${plan.priority.toUpperCase()}\n\n`;
    md += `## Resumo\n\n${plan.summary}\n\n`;

    if (plan.mustFix.length > 0) {
      md += `## ⚠️ Correções Obrigatórias (${plan.mustFix.length})\n\n`;
      plan.mustFix.forEach((item, i) => {
        md += `### ${i + 1}. ${item.ruleCode} - ${item.issue}\n`;
        md += `- **Categoria**: ${item.category}\n`;
        md += `- **Seção**: ${item.section}\n`;
        md += `- **Tempo Estimado**: ${item.estimatedTime} min\n`;
        md += `- **Sugestão**: ${item.suggestedFix}\n\n`;
      });
    }

    if (plan.quickWins.length > 0) {
      md += `## ✅ Quick Wins (${plan.quickWins.length})\n\n`;
      plan.quickWins.forEach((item, i) => {
        md += `${i + 1}. **${item.ruleCode}**: ${item.issue} (${item.estimatedTime} min)\n`;
      });
      md += `\n`;
    }

    md += `## 📋 Todas as Correções\n\n`;
    md += `| # | Código | Issue | Severidade | Tempo | Prioridade |\n`;
    md += `|---|--------|-------|------------|-------|------------|\n`;
    plan.corrections.forEach((item, i) => {
      md += `| ${i + 1} | ${item.ruleCode} | ${item.issue} | ${item.severity} | ${item.estimatedTime}min | ${item.priority} |\n`;
    });

    return md;
  }

  if (format === 'csv') {
    let csv = 'Código,Categoria,Seção,Issue,Severidade,Peso,Prioridade,Tempo (min),Auto-Fix,Sugestão\n';
    plan.corrections.forEach((item) => {
      csv += `"${item.ruleCode}","${item.category}","${item.section}","${item.issue}","${item.severity}",${item.weight},${item.priority},${item.estimatedTime},${item.autoFixAvailable},"${item.suggestedFix}"\n`;
    });
    return csv;
  }

  return '';
}

