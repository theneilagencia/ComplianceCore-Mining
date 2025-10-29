import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ComparisonResult {
  sectionName: string;
  originalText: string;
  aiGeneratedText: string;
  similarityScore: number;
  differences: {
    type: 'addition' | 'deletion' | 'modification';
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  improvements: string[];
  recommendation: 'keep_original' | 'use_ai' | 'merge';
}

interface AIComparisonReport {
  reportId: string;
  overallSimilarity: number;
  sectionsCompared: number;
  sections: ComparisonResult[];
  summary: string;
  recommendations: string[];
  createdAt: Date;
}

/**
 * Generate AI version of a report section
 */
export async function generateAISection(
  sectionName: string,
  originalText: string,
  standard: string,
  context: any
): Promise<string> {
  try {
    const prompt = `You are a CRIRSCO-compliant technical report writer specializing in ${standard} standard.

**Section**: ${sectionName}
**Standard**: ${standard}
**Original Text**: 
${originalText}

**Context**:
- Project: ${context.projectName || 'Mining Project'}
- Location: ${context.location || 'Not specified'}
- Commodity: ${context.commodity || 'Not specified'}

**Task**: Rewrite this section to be fully compliant with ${standard} standards, improving:
1. Technical accuracy and precision
2. Compliance with CRIRSCO requirements
3. Clarity and professional language
4. Completeness of required information

**Requirements**:
- Maintain all factual data from original
- Use proper technical terminology
- Follow ${standard} section structure
- Add missing required elements if any
- Keep similar length (±20%)

Generate the improved section:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert CRIRSCO technical report writer with deep knowledge of ${standard} standards. Your writing is precise, compliant, and professional.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || originalText;
  } catch (error) {
    console.error('Error generating AI section:', error);
    return originalText;
  }
}

/**
 * Calculate similarity score between two texts
 */
function calculateSimilarity(text1: string, text2: string): number {
  // Simple word-based similarity (Jaccard similarity)
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return Math.round((intersection.size / union.size) * 100);
}

/**
 * Identify differences between original and AI text
 */
async function identifyDifferences(
  original: string,
  aiGenerated: string
): Promise<ComparisonResult['differences']> {
  try {
    const prompt = `Compare these two versions of a technical report section and identify key differences:

**Original**:
${original}

**AI-Generated**:
${aiGenerated}

Identify differences in these categories:
1. **Additions**: New information or details added
2. **Deletions**: Information removed or omitted
3. **Modifications**: Changes to existing content

For each difference, assess impact (high/medium/low) based on:
- Compliance with standards
- Technical accuracy
- Completeness

Return a JSON array of differences:
[
  {
    "type": "addition|deletion|modification",
    "description": "Brief description of the change",
    "impact": "high|medium|low"
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.differences || [];
  } catch (error) {
    console.error('Error identifying differences:', error);
    return [];
  }
}

/**
 * Generate improvement recommendations
 */
async function generateImprovements(
  sectionName: string,
  original: string,
  aiGenerated: string,
  differences: ComparisonResult['differences']
): Promise<string[]> {
  try {
    const prompt = `Based on the comparison between original and AI-generated versions of "${sectionName}", provide 3-5 specific improvement recommendations.

**Differences identified**:
${JSON.stringify(differences, null, 2)}

Focus on:
1. Compliance improvements
2. Technical accuracy enhancements
3. Clarity and readability
4. Completeness of required information

Return a JSON array of recommendations:
{
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return parsed.recommendations || [];
  } catch (error) {
    console.error('Error generating improvements:', error);
    return [];
  }
}

/**
 * Determine recommendation for section
 */
function determineRecommendation(
  similarityScore: number,
  differences: ComparisonResult['differences']
): ComparisonResult['recommendation'] {
  const highImpactChanges = differences.filter(d => d.impact === 'high').length;
  const mediumImpactChanges = differences.filter(d => d.impact === 'medium').length;

  // If very similar (>90%) and no high-impact changes, keep original
  if (similarityScore > 90 && highImpactChanges === 0) {
    return 'keep_original';
  }

  // If many high-impact improvements, use AI version
  if (highImpactChanges >= 3) {
    return 'use_ai';
  }

  // If moderate similarity (70-90%) with some improvements, merge
  if (similarityScore >= 70 && (highImpactChanges > 0 || mediumImpactChanges > 2)) {
    return 'merge';
  }

  // If low similarity (<70%), likely AI added too much or changed too much
  if (similarityScore < 70) {
    return 'keep_original';
  }

  // Default: merge
  return 'merge';
}

/**
 * Compare original report with AI-generated version
 */
export async function compareWithAI(
  reportId: string,
  reportData: any,
  standard: string
): Promise<AIComparisonReport> {
  const sections: ComparisonResult[] = [];
  
  // Define key sections to compare based on standard
  const sectionsToCompare = [
    'Executive Summary',
    'Property Description',
    'Geology and Mineralization',
    'Mineral Resources',
    'Mineral Reserves',
    'Mining Methods',
    'Environmental and Social',
    'Conclusions and Recommendations',
  ];

  for (const sectionName of sectionsToCompare) {
    const originalText = reportData.sections?.[sectionName] || '';
    
    if (!originalText || originalText.length < 50) {
      continue; // Skip empty or very short sections
    }

    // Generate AI version
    const aiGeneratedText = await generateAISection(
      sectionName,
      originalText,
      standard,
      {
        projectName: reportData.title,
        location: reportData.location,
        commodity: reportData.commodity,
      }
    );

    // Calculate similarity
    const similarityScore = calculateSimilarity(originalText, aiGeneratedText);

    // Identify differences
    const differences = await identifyDifferences(originalText, aiGeneratedText);

    // Generate improvements
    const improvements = await generateImprovements(
      sectionName,
      originalText,
      aiGeneratedText,
      differences
    );

    // Determine recommendation
    const recommendation = determineRecommendation(similarityScore, differences);

    sections.push({
      sectionName,
      originalText,
      aiGeneratedText,
      similarityScore,
      differences,
      improvements,
      recommendation,
    });
  }

  // Calculate overall similarity
  const overallSimilarity = Math.round(
    sections.reduce((sum, s) => sum + s.similarityScore, 0) / sections.length
  );

  // Generate summary
  const summary = await generateComparisonSummary(sections, overallSimilarity);

  // Generate overall recommendations
  const recommendations = await generateOverallRecommendations(sections);

  return {
    reportId,
    overallSimilarity,
    sectionsCompared: sections.length,
    sections,
    summary,
    recommendations,
    createdAt: new Date(),
  };
}

/**
 * Generate comparison summary
 */
async function generateComparisonSummary(
  sections: ComparisonResult[],
  overallSimilarity: number
): Promise<string> {
  const highImpactCount = sections.reduce(
    (sum, s) => sum + s.differences.filter(d => d.impact === 'high').length,
    0
  );

  const useAICount = sections.filter(s => s.recommendation === 'use_ai').length;
  const mergeCount = sections.filter(s => s.recommendation === 'merge').length;

  if (overallSimilarity > 85 && highImpactCount < 5) {
    return `O relatório original está em excelente conformidade com os padrões CRIRSCO. A versão IA apresenta ${overallSimilarity}% de similaridade, com apenas ${highImpactCount} mudanças de alto impacto identificadas. Recomenda-se manter o original com pequenos ajustes.`;
  } else if (overallSimilarity > 70) {
    return `O relatório original apresenta boa qualidade, mas a versão IA identificou ${highImpactCount} oportunidades de melhoria significativas. Recomenda-se ${useAICount > 0 ? `substituir ${useAICount} seções` : 'mesclar'} para aumentar a conformidade.`;
  } else {
    return `A versão IA apresenta diferenças substanciais (${overallSimilarity}% de similaridade). Foram identificadas ${highImpactCount} mudanças de alto impacto. Recomenda-se revisão cuidadosa antes de aplicar as sugestões da IA.`;
  }
}

/**
 * Generate overall recommendations
 */
async function generateOverallRecommendations(
  sections: ComparisonResult[]
): Promise<string[]> {
  const recommendations: string[] = [];

  const useAISections = sections.filter(s => s.recommendation === 'use_ai');
  const mergeSections = sections.filter(s => s.recommendation === 'merge');

  if (useAISections.length > 0) {
    recommendations.push(
      `Substituir completamente ${useAISections.length} seções pela versão IA: ${useAISections.map(s => s.sectionName).join(', ')}`
    );
  }

  if (mergeSections.length > 0) {
    recommendations.push(
      `Mesclar melhorias da IA em ${mergeSections.length} seções: ${mergeSections.map(s => s.sectionName).join(', ')}`
    );
  }

  // Add specific high-impact improvements
  sections.forEach(section => {
    const highImpactDiffs = section.differences.filter(d => d.impact === 'high');
    if (highImpactDiffs.length > 0) {
      recommendations.push(
        `${section.sectionName}: ${highImpactDiffs[0].description}`
      );
    }
  });

  return recommendations.slice(0, 10); // Limit to top 10
}

