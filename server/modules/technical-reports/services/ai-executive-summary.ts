import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExecutiveSummary {
  overview: string;
  keyFindings: {
    category: string;
    finding: string;
    impact: 'critical' | 'high' | 'medium' | 'low';
    recommendation: string;
  }[];
  complianceStatus: {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  priorityActions: {
    action: string;
    rationale: string;
    estimatedTime: string;
    impact: string;
  }[];
  patterns: {
    pattern: string;
    occurrences: number;
    significance: string;
  }[];
  insights: string[];
  nextSteps: string[];
}

/**
 * Generate AI-powered executive summary from KRCI audit results
 */
export async function generateExecutiveSummary(
  reportId: string,
  auditScore: number,
  krcis: any[],
  reportData: any
): Promise<ExecutiveSummary> {
  try {
    // Prepare KRCI data for analysis
    const krcisByCategory = krcis.reduce((acc, krci) => {
      if (!acc[krci.category]) {
        acc[krci.category] = [];
      }
      acc[krci.category].push(krci);
      return acc;
    }, {} as Record<string, any[]>);

    const krciBySeverity = krcis.reduce((acc, krci) => {
      if (!acc[krci.severity]) {
        acc[krci.severity] = [];
      }
      acc[krci.severity].push(krci);
      return acc;
    }, {} as Record<string, any[]>);

    // Generate comprehensive analysis
    const prompt = `You are a senior CRIRSCO compliance auditor analyzing a technical mining report audit.

**Report Information**:
- Report ID: ${reportId}
- Standard: ${reportData.standard || 'JORC'}
- Project: ${reportData.title || 'Mining Project'}
- Overall KRCI Score: ${auditScore}%

**Audit Results**:
- Total Issues: ${krcis.length}
- Critical: ${krciBySeverity.critical?.length || 0}
- High: ${krciBySeverity.high?.length || 0}
- Medium: ${krciBySeverity.medium?.length || 0}
- Low: ${krciBySeverity.low?.length || 0}

**Issues by Category**:
${Object.entries(krcisByCategory)
  .map(([category, issues]) => `- ${category}: ${issues.length} issues`)
  .join('\n')}

**Sample Issues**:
${krcis.slice(0, 10).map(k => `- [${k.severity}] ${k.code}: ${k.message}`).join('\n')}

**Task**: Generate a comprehensive executive summary that includes:

1. **Overview**: 2-3 sentence high-level summary of the audit results
2. **Key Findings**: Top 5-7 most significant findings with impact assessment
3. **Compliance Status**: Overall assessment with strengths and weaknesses
4. **Priority Actions**: Top 3-5 actions needed with rationale and time estimates
5. **Patterns**: Identify recurring patterns or systemic issues
6. **Insights**: Strategic insights about the report quality and compliance
7. **Next Steps**: Recommended next steps for the report author

**Requirements**:
- Be specific and actionable
- Use professional technical language
- Prioritize by business impact, not just severity
- Identify root causes when possible
- Provide clear, measurable recommendations

Return a JSON object with this structure:
{
  "overview": "string",
  "keyFindings": [
    {
      "category": "string",
      "finding": "string",
      "impact": "critical|high|medium|low",
      "recommendation": "string"
    }
  ],
  "complianceStatus": {
    "overall": "excellent|good|fair|poor",
    "score": number,
    "strengths": ["string"],
    "weaknesses": ["string"]
  },
  "priorityActions": [
    {
      "action": "string",
      "rationale": "string",
      "estimatedTime": "string",
      "impact": "string"
    }
  ],
  "patterns": [
    {
      "pattern": "string",
      "occurrences": number,
      "significance": "string"
    }
  ],
  "insights": ["string"],
  "nextSteps": ["string"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a senior CRIRSCO compliance auditor with 20+ years of experience. You provide clear, actionable insights that help mining companies improve their technical reports.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const summary: ExecutiveSummary = JSON.parse(content);

    // Validate and ensure all fields are present
    return {
      overview: summary.overview || 'Resumo não disponível',
      keyFindings: summary.keyFindings || [],
      complianceStatus: summary.complianceStatus || {
        overall: getOverallStatus(auditScore),
        score: auditScore,
        strengths: [],
        weaknesses: [],
      },
      priorityActions: summary.priorityActions || [],
      patterns: summary.patterns || [],
      insights: summary.insights || [],
      nextSteps: summary.nextSteps || [],
    };
  } catch (error) {
    console.error('Error generating executive summary:', error);
    
    // Return fallback summary
    return generateFallbackSummary(reportId, auditScore, krcis);
  }
}

/**
 * Get overall compliance status based on score
 */
function getOverallStatus(score: number): ExecutiveSummary['complianceStatus']['overall'] {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}

/**
 * Generate fallback summary when AI fails
 */
function generateFallbackSummary(
  reportId: string,
  auditScore: number,
  krcis: any[]
): ExecutiveSummary {
  const krciBySeverity = krcis.reduce((acc, krci) => {
    if (!acc[krci.severity]) {
      acc[krci.severity] = [];
    }
    acc[krci.severity].push(krci);
    return acc;
  }, {} as Record<string, any[]>);

  const krcisByCategory = krcis.reduce((acc, krci) => {
    if (!acc[krci.category]) {
      acc[krci.category] = [];
    }
    acc[krci.category].push(krci);
    return acc;
  }, {} as Record<string, any[]>);

  const criticalCount = krciBySeverity.critical?.length || 0;
  const highCount = krciBySeverity.high?.length || 0;

  let overview = '';
  if (auditScore >= 90) {
    overview = `O relatório apresenta excelente conformidade com score KRCI de ${auditScore}%, com apenas ${krcis.length} não-conformidades menores identificadas.`;
  } else if (auditScore >= 75) {
    overview = `O relatório apresenta boa conformidade com score KRCI de ${auditScore}%. Foram identificadas ${krcis.length} não-conformidades, incluindo ${criticalCount} críticas e ${highCount} de alta prioridade.`;
  } else if (auditScore >= 60) {
    overview = `O relatório apresenta conformidade moderada com score KRCI de ${auditScore}%. Foram identificadas ${krcis.length} não-conformidades que requerem atenção, incluindo ${criticalCount} críticas.`;
  } else {
    overview = `O relatório apresenta baixa conformidade com score KRCI de ${auditScore}%. Foram identificadas ${krcis.length} não-conformidades significativas, incluindo ${criticalCount} críticas e ${highCount} de alta prioridade. Revisão substancial é necessária.`;
  }

  // Generate key findings from top issues
  const keyFindings = krcis
    .slice(0, 7)
    .map((krci) => ({
      category: krci.category,
      finding: krci.message,
      impact: krci.severity as any,
      recommendation: `Corrija ${krci.section || 'a seção correspondente'} conforme padrões CRIRSCO`,
    }));

  // Identify patterns
  const patterns = Object.entries(krcisByCategory)
    .map(([category, issues]) => ({
      pattern: `Múltiplas issues na categoria ${category}`,
      occurrences: issues.length,
      significance:
        issues.length > 5
          ? 'Alta - indica problema sistêmico nesta área'
          : 'Média - requer atenção',
    }))
    .filter((p) => p.occurrences > 2);

  return {
    overview,
    keyFindings,
    complianceStatus: {
      overall: getOverallStatus(auditScore),
      score: auditScore,
      strengths:
        auditScore >= 75
          ? ['Estrutura geral adequada', 'Dados técnicos presentes']
          : ['Estrutura básica presente'],
      weaknesses:
        criticalCount > 0
          ? [
              `${criticalCount} não-conformidades críticas`,
              `${highCount} issues de alta prioridade`,
              'Revisão necessária em múltiplas seções',
            ]
          : ['Pequenos ajustes de formatação necessários'],
    },
    priorityActions: [
      {
        action: 'Corrigir todas as não-conformidades críticas',
        rationale: `${criticalCount} issues críticas impedem aprovação do relatório`,
        estimatedTime: `${Math.ceil(criticalCount * 1.5)} horas`,
        impact: 'Essencial para conformidade',
      },
      {
        action: 'Revisar issues de alta prioridade',
        rationale: `${highCount} issues de alta prioridade afetam qualidade do relatório`,
        estimatedTime: `${Math.ceil(highCount * 1)} hora`,
        impact: 'Melhora significativa na conformidade',
      },
    ],
    patterns,
    insights: [
      `Score KRCI de ${auditScore}% indica ${getOverallStatus(auditScore) === 'excellent' ? 'excelente' : getOverallStatus(auditScore) === 'good' ? 'boa' : 'conformidade moderada'}`,
      `Categoria com mais issues: ${Object.entries(krcisByCategory).sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'}`,
    ],
    nextSteps: [
      'Revisar e corrigir todas as não-conformidades identificadas',
      'Executar nova auditoria KRCI após correções',
      'Validar conformidade com padrões CRIRSCO',
      'Preparar relatório para revisão por Qualified Person',
    ],
  };
}

/**
 * Generate insights from patterns
 */
export async function generateInsights(
  krcis: any[],
  reportData: any
): Promise<string[]> {
  try {
    const prompt = `Analyze these KRCI audit results and provide 5-7 strategic insights:

**Issues**:
${krcis.slice(0, 20).map(k => `- [${k.severity}] ${k.category}: ${k.message}`).join('\n')}

**Report**: ${reportData.standard} - ${reportData.title}

Provide insights about:
1. Root causes of non-compliance
2. Systemic issues vs isolated problems
3. Quality of technical data
4. Completeness of documentation
5. Adherence to best practices
6. Recommendations for process improvement

Return JSON: { "insights": ["insight 1", "insight 2", ...] }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.insights || [];
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
}

