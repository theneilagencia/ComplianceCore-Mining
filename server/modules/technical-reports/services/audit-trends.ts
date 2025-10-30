/**
 * Audit Trends and Historical Comparison Service
 * Analyzes audit history to identify trends and improvements
 */

interface AuditHistoryItem {
  auditId: string;
  reportId: string;
  score: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  krcis: any[];
  createdAt: Date;
}

interface TrendData {
  period: string;
  score: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

interface CategoryTrend {
  category: string;
  data: {
    period: string;
    count: number;
  }[];
}

interface AuditTrendsResult {
  reportId: string;
  totalAudits: number;
  dateRange: {
    from: Date;
    to: Date;
  };
  scoreProgression: TrendData[];
  categoryTrends: CategoryTrend[];
  improvements: {
    category: string;
    improvement: number; // percentage
    message: string;
  }[];
  regressions: {
    category: string;
    regression: number; // percentage
    message: string;
  }[];
  summary: {
    averageScore: number;
    bestScore: number;
    worstScore: number;
    trend: 'improving' | 'stable' | 'declining';
    totalImprovement: number; // percentage
  };
  recommendations: string[];
}

interface HistoricalComparison {
  reportId: string;
  audits: {
    auditId: string;
    date: Date;
    score: number;
    totalIssues: number;
  }[];
  comparison: {
    previous: AuditHistoryItem;
    current: AuditHistoryItem;
    scoreDelta: number;
    issuesDelta: number;
    resolvedIssues: any[];
    newIssues: any[];
    persistentIssues: any[];
  };
  insights: string[];
}

/**
 * Calculate audit trends over time
 */
export async function calculateAuditTrends(
  reportId: string,
  audits: AuditHistoryItem[]
): Promise<AuditTrendsResult> {
  if (audits.length === 0) {
    throw new Error('No audits found for this report');
  }

  // Sort audits by date
  const sortedAudits = audits.sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  // Calculate score progression
  const scoreProgression: TrendData[] = sortedAudits.map((audit) => {
    const bySeverity = audit.krcis.reduce(
      (acc, krci) => {
        acc[krci.severity] = (acc[krci.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      period: audit.createdAt.toLocaleDateString('pt-BR'),
      score: audit.score,
      totalIssues: audit.krcis.length,
      criticalIssues: bySeverity.critical || 0,
      highIssues: bySeverity.high || 0,
      mediumIssues: bySeverity.medium || 0,
      lowIssues: bySeverity.low || 0,
    };
  });

  // Calculate category trends
  const categories = [
    'tenure',
    'geo',
    'esg',
    'norma',
    'satelite',
    'benchmark',
  ];
  const categoryTrends: CategoryTrend[] = categories.map((category) => ({
    category,
    data: sortedAudits.map((audit) => ({
      period: audit.createdAt.toLocaleDateString('pt-BR'),
      count: audit.krcis.filter((k) => k.category === category).length,
    })),
  }));

  // Calculate improvements and regressions
  const improvements: AuditTrendsResult['improvements'] = [];
  const regressions: AuditTrendsResult['regressions'] = [];

  if (sortedAudits.length >= 2) {
    const first = sortedAudits[0];
    const last = sortedAudits[sortedAudits.length - 1];

    categories.forEach((category) => {
      const firstCount = first.krcis.filter((k) => k.category === category)
        .length;
      const lastCount = last.krcis.filter((k) => k.category === category)
        .length;

      if (firstCount > 0) {
        const change = ((firstCount - lastCount) / firstCount) * 100;

        if (change > 10) {
          improvements.push({
            category,
            improvement: change,
            message: `Redução de ${change.toFixed(0)}% em issues de ${category}`,
          });
        } else if (change < -10) {
          regressions.push({
            category,
            regression: Math.abs(change),
            message: `Aumento de ${Math.abs(change).toFixed(0)}% em issues de ${category}`,
          });
        }
      }
    });
  }

  // Calculate summary
  const scores = sortedAudits.map((a) => a.score);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  let totalImprovement = 0;

  if (sortedAudits.length >= 2) {
    const firstScore = sortedAudits[0].score;
    const lastScore = sortedAudits[sortedAudits.length - 1].score;
    totalImprovement = lastScore - firstScore;

    if (totalImprovement > 5) {
      trend = 'improving';
    } else if (totalImprovement < -5) {
      trend = 'declining';
    }
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (trend === 'improving') {
    recommendations.push(
      `Excelente progresso! Score melhorou ${totalImprovement.toFixed(1)}% ao longo do tempo.`
    );
  } else if (trend === 'declining') {
    recommendations.push(
      `Atenção: Score caiu ${Math.abs(totalImprovement).toFixed(1)}%. Revisar processos de qualidade.`
    );
  }

  if (improvements.length > 0) {
    recommendations.push(
      `Categorias com melhoria: ${improvements.map((i) => i.category).join(', ')}`
    );
  }

  if (regressions.length > 0) {
    recommendations.push(
      `Categorias que precisam atenção: ${regressions.map((r) => r.category).join(', ')}`
    );
  }

  if (averageScore < 75) {
    recommendations.push(
      'Score médio abaixo de 75%. Considere revisão sistemática dos processos.'
    );
  }

  return {
    reportId,
    totalAudits: sortedAudits.length,
    dateRange: {
      from: sortedAudits[0].createdAt,
      to: sortedAudits[sortedAudits.length - 1].createdAt,
    },
    scoreProgression,
    categoryTrends,
    improvements,
    regressions,
    summary: {
      averageScore,
      bestScore,
      worstScore,
      trend,
      totalImprovement,
    },
    recommendations,
  };
}

/**
 * Compare two audits
 */
export function compareAudits(
  reportId: string,
  previous: AuditHistoryItem,
  current: AuditHistoryItem,
  allAudits: AuditHistoryItem[]
): HistoricalComparison {
  // Calculate deltas
  const scoreDelta = current.score - previous.score;
  const issuesDelta = current.krcis.length - previous.krcis.length;

  // Identify resolved issues (in previous but not in current)
  const resolvedIssues = previous.krcis.filter(
    (prevKrci) =>
      !current.krcis.some((currKrci) => currKrci.code === prevKrci.code)
  );

  // Identify new issues (in current but not in previous)
  const newIssues = current.krcis.filter(
    (currKrci) =>
      !previous.krcis.some((prevKrci) => prevKrci.code === currKrci.code)
  );

  // Identify persistent issues (in both)
  const persistentIssues = current.krcis.filter((currKrci) =>
    previous.krcis.some((prevKrci) => prevKrci.code === currKrci.code)
  );

  // Generate insights
  const insights: string[] = [];

  if (scoreDelta > 0) {
    insights.push(
      `Score melhorou ${scoreDelta.toFixed(1)} pontos (${previous.score}% → ${current.score}%)`
    );
  } else if (scoreDelta < 0) {
    insights.push(
      `Score caiu ${Math.abs(scoreDelta).toFixed(1)} pontos (${previous.score}% → ${current.score}%)`
    );
  } else {
    insights.push(`Score manteve-se estável em ${current.score}%`);
  }

  if (resolvedIssues.length > 0) {
    insights.push(`${resolvedIssues.length} issue(s) foram resolvidas`);
  }

  if (newIssues.length > 0) {
    insights.push(`${newIssues.length} nova(s) issue(s) identificada(s)`);
  }

  if (persistentIssues.length > 0) {
    insights.push(
      `${persistentIssues.length} issue(s) persistente(s) ainda não resolvida(s)`
    );
  }

  // Analyze category improvements
  const categories = ['tenure', 'geo', 'esg', 'norma', 'satelite', 'benchmark'];
  categories.forEach((category) => {
    const prevCount = previous.krcis.filter((k) => k.category === category)
      .length;
    const currCount = current.krcis.filter((k) => k.category === category)
      .length;

    if (prevCount > currCount) {
      insights.push(
        `Melhoria em ${category}: ${prevCount} → ${currCount} issues`
      );
    } else if (currCount > prevCount) {
      insights.push(
        `Regressão em ${category}: ${prevCount} → ${currCount} issues`
      );
    }
  });

  return {
    reportId,
    audits: allAudits.map((a) => ({
      auditId: a.auditId,
      date: a.createdAt,
      score: a.score,
      totalIssues: a.krcis.length,
    })),
    comparison: {
      previous,
      current,
      scoreDelta,
      issuesDelta,
      resolvedIssues,
      newIssues,
      persistentIssues,
    },
    insights,
  };
}

/**
 * Get audit statistics for dashboard
 */
export function getAuditStatistics(audits: AuditHistoryItem[]) {
  if (audits.length === 0) {
    return {
      totalAudits: 0,
      averageScore: 0,
      averageIssues: 0,
      mostCommonCategory: 'N/A',
      mostCommonSeverity: 'N/A',
    };
  }

  const totalAudits = audits.length;
  const averageScore =
    audits.reduce((sum, a) => sum + a.score, 0) / totalAudits;
  const averageIssues =
    audits.reduce((sum, a) => sum + a.krcis.length, 0) / totalAudits;

  // Find most common category
  const categoryCount: Record<string, number> = {};
  audits.forEach((audit) => {
    audit.krcis.forEach((krci) => {
      categoryCount[krci.category] = (categoryCount[krci.category] || 0) + 1;
    });
  });

  const mostCommonCategory =
    Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Find most common severity
  const severityCount: Record<string, number> = {};
  audits.forEach((audit) => {
    audit.krcis.forEach((krci) => {
      severityCount[krci.severity] = (severityCount[krci.severity] || 0) + 1;
    });
  });

  const mostCommonSeverity =
    Object.entries(severityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return {
    totalAudits,
    averageScore: Math.round(averageScore * 10) / 10,
    averageIssues: Math.round(averageIssues * 10) / 10,
    mostCommonCategory,
    mostCommonSeverity,
  };
}

