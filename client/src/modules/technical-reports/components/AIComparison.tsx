import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  AlertTriangle,
  TrendingUp,
  FileText,
  Sparkles,
} from 'lucide-react';

interface Difference {
  type: 'addition' | 'deletion' | 'modification';
  description: string;
  impact: 'high' | 'medium' | 'low';
}

interface SectionComparison {
  sectionName: string;
  originalText: string;
  aiGeneratedText: string;
  similarityScore: number;
  differences: Difference[];
  improvements: string[];
  recommendation: 'keep_original' | 'use_ai' | 'merge';
}

interface AIComparisonData {
  reportId: string;
  overallSimilarity: number;
  sectionsCompared: number;
  sections: SectionComparison[];
  summary: string;
  recommendations: string[];
  createdAt: Date;
}

interface AIComparisonProps {
  comparison: AIComparisonData;
  onApply?: (sectionName: string, action: 'keep' | 'use_ai' | 'merge') => void;
}

export function AIComparison({ comparison, onApply }: AIComparisonProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecommendationBadge = (rec: SectionComparison['recommendation']) => {
    switch (rec) {
      case 'keep_original':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-400">Manter Original</Badge>;
      case 'use_ai':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-400">Usar IA</Badge>;
      case 'merge':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400">Mesclar</Badge>;
    }
  };

  const getImpactBadge = (impact: Difference['impact']) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">Alto Impacto</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400">Médio Impacto</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-400">Baixo Impacto</Badge>;
    }
  };

  const getDifferenceIcon = (type: Difference['type']) => {
    switch (type) {
      case 'addition':
        return <TrendingUp className="h-4 w-4 text-green-400" />;
      case 'deletion':
        return <X className="h-4 w-4 text-red-400" />;
      case 'modification':
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-400" />
            Comparativo IA × Original
          </h2>
          <p className="text-gray-400 mt-1">{comparison.summary}</p>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#171a4a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Similaridade Geral</p>
              <p className={`text-3xl font-bold ${getSimilarityColor(comparison.overallSimilarity)}`}>
                {comparison.overallSimilarity}%
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4 bg-[#171a4a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Seções Comparadas</p>
              <p className="text-3xl font-bold text-white">{comparison.sectionsCompared}</p>
            </div>
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
        </Card>

        <Card className="p-4 bg-[#171a4a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Recomendações</p>
              <p className="text-3xl font-bold text-white">{comparison.recommendations.length}</p>
            </div>
            <Sparkles className="h-8 w-8 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Overall Recommendations */}
      <Card className="p-6 bg-[#171a4a]">
        <h3 className="text-lg font-semibold mb-4">Recomendações Gerais</h3>
        <ul className="space-y-2">
          {comparison.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-gray-300">{rec}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Section Comparisons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comparação por Seção</h3>
        {comparison.sections.map((section) => {
          const isExpanded = expandedSections.has(section.sectionName);
          
          return (
            <Card key={section.sectionName} className="p-6 bg-[#171a4a]">
              {/* Section Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection(section.sectionName)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold">{section.sectionName}</h4>
                    {getRecommendationBadge(section.recommendation)}
                    <span className={`text-sm font-medium ${getSimilarityColor(section.similarityScore)}`}>
                      {section.similarityScore}% similar
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {section.differences.length} diferenças • {section.improvements.length} melhorias sugeridas
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="mt-6 space-y-6">
                  {/* Differences */}
                  {section.differences.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-300 mb-3">Diferenças Identificadas</h5>
                      <div className="space-y-2">
                        {section.differences.map((diff, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-3 rounded-lg bg-[#000020]/50"
                          >
                            {getDifferenceIcon(diff.type)}
                            <div className="flex-1">
                              <p className="text-sm text-gray-300">{diff.description}</p>
                            </div>
                            {getImpactBadge(diff.impact)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Improvements */}
                  {section.improvements.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-300 mb-3">Melhorias Sugeridas</h5>
                      <ul className="space-y-2">
                        {section.improvements.map((improvement, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-300">{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Text Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-300 mb-2">Original</h5>
                      <div className="p-4 rounded-lg bg-[#000020]/50 max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-400 whitespace-pre-wrap">
                          {section.originalText}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Versão IA
                      </h5>
                      <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20 max-h-64 overflow-y-auto">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {section.aiGeneratedText}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {onApply && (
                    <div className="flex gap-3 pt-4 border-t border-gray-700">
                      <Button
                        variant="outline"
                        onClick={() => onApply(section.sectionName, 'keep')}
                        className="flex-1"
                      >
                        Manter Original
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onApply(section.sectionName, 'merge')}
                        className="flex-1 bg-yellow-500/10 hover:bg-yellow-500/20"
                      >
                        Mesclar
                      </Button>
                      <Button
                        onClick={() => onApply(section.sectionName, 'use_ai')}
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Usar IA
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

