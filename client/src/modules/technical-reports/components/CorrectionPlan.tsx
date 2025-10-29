import { useState } from 'react';
import { Download, Clock, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

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

interface CorrectionPlanProps {
  plan: {
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
  };
  onExport?: (format: 'json' | 'markdown' | 'csv') => void;
}

const severityColors = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const priorityColors = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-blue-400',
};

export function CorrectionPlan({ plan, onExport }: CorrectionPlanProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'mustFix' | 'quickWins' | 'canDefer'>('all');

  const hours = Math.floor(plan.estimatedTotalTime / 60);
  const minutes = plan.estimatedTotalTime % 60;

  const getItemsForTab = () => {
    switch (activeTab) {
      case 'mustFix':
        return plan.mustFix;
      case 'quickWins':
        return plan.quickWins;
      case 'canDefer':
        return plan.canDefer;
      default:
        return plan.corrections;
    }
  };

  const items = getItemsForTab();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#171a4a] rounded-lg p-6 border border-[#2f2c79]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Plano de Correção Automático</h2>
            <p className="text-gray-400">{plan.summary}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onExport?.('markdown')}
              className="px-4 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#8d4925] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Markdown
            </button>
            <button
              onClick={() => onExport?.('csv')}
              className="px-4 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#8d4925] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => onExport?.('json')}
              className="px-4 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#8d4925] transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#000020] rounded-lg p-4 border border-[#2f2c79]">
            <div className="text-gray-400 text-sm mb-1">Score KRCI</div>
            <div className="text-2xl font-bold text-white">{plan.auditScore}%</div>
          </div>
          <div className="bg-[#000020] rounded-lg p-4 border border-[#2f2c79]">
            <div className="text-gray-400 text-sm mb-1">Total de Issues</div>
            <div className="text-2xl font-bold text-white">{plan.totalIssues}</div>
          </div>
          <div className="bg-[#000020] rounded-lg p-4 border border-[#2f2c79]">
            <div className="text-gray-400 text-sm mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Tempo Estimado
            </div>
            <div className="text-2xl font-bold text-white">
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </div>
          </div>
          <div className="bg-[#000020] rounded-lg p-4 border border-[#2f2c79]">
            <div className="text-gray-400 text-sm mb-1">Prioridade</div>
            <div className={`text-2xl font-bold ${priorityColors[plan.priority]}`}>
              {plan.priority.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {plan.criticalIssues > 0 && (
            <div className="bg-red-500/10 rounded px-3 py-2 border border-red-500/20">
              <div className="text-red-400 text-xs">Críticas</div>
              <div className="text-red-400 font-bold">{plan.criticalIssues}</div>
            </div>
          )}
          {plan.highIssues > 0 && (
            <div className="bg-orange-500/10 rounded px-3 py-2 border border-orange-500/20">
              <div className="text-orange-400 text-xs">Altas</div>
              <div className="text-orange-400 font-bold">{plan.highIssues}</div>
            </div>
          )}
          {plan.mediumIssues > 0 && (
            <div className="bg-yellow-500/10 rounded px-3 py-2 border border-yellow-500/20">
              <div className="text-yellow-400 text-xs">Médias</div>
              <div className="text-yellow-400 font-bold">{plan.mediumIssues}</div>
            </div>
          )}
          {plan.lowIssues > 0 && (
            <div className="bg-blue-500/10 rounded px-3 py-2 border border-blue-500/20">
              <div className="text-blue-400 text-xs">Baixas</div>
              <div className="text-blue-400 font-bold">{plan.lowIssues}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2f2c79]">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'all'
              ? 'text-white border-b-2 border-[#8d4925]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Todas ({plan.corrections.length})
        </button>
        {plan.mustFix.length > 0 && (
          <button
            onClick={() => setActiveTab('mustFix')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'mustFix'
                ? 'text-white border-b-2 border-[#8d4925]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Obrigatórias ({plan.mustFix.length})
          </button>
        )}
        {plan.quickWins.length > 0 && (
          <button
            onClick={() => setActiveTab('quickWins')}
            className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'quickWins'
                ? 'text-white border-b-2 border-[#8d4925]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            Quick Wins ({plan.quickWins.length})
          </button>
        )}
        {plan.canDefer.length > 0 && (
          <button
            onClick={() => setActiveTab('canDefer')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'canDefer'
                ? 'text-white border-b-2 border-[#8d4925]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Podem Aguardar ({plan.canDefer.length})
          </button>
        )}
      </div>

      {/* Correction Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={`${item.ruleCode}-${index}`}
            className="bg-[#171a4a] rounded-lg border border-[#2f2c79] overflow-hidden"
          >
            <button
              onClick={() => setExpandedItem(expandedItem === item.ruleCode ? null : item.ruleCode)}
              className="w-full p-4 text-left hover:bg-[#2f2c79]/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-400">{item.ruleCode}</span>
                    <span className={`text-xs px-2 py-1 rounded border ${severityColors[item.severity]}`}>
                      {item.severity}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-[#2f2c79] text-gray-300">
                      {item.category}
                    </span>
                    {item.autoFixAvailable && (
                      <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Auto-fix
                      </span>
                    )}
                  </div>
                  <div className="text-white font-medium mb-1">{item.issue}</div>
                  <div className="text-sm text-gray-400">Seção: {item.section}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400 mb-1">Prioridade</div>
                  <div className="text-2xl font-bold text-white">{item.priority}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.estimatedTime} min
                  </div>
                </div>
              </div>
            </button>

            {expandedItem === item.ruleCode && (
              <div className="border-t border-[#2f2c79] p-4 bg-[#000020]">
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-400 mb-2">Sugestão de Correção:</div>
                  <div className="text-white bg-[#171a4a] p-3 rounded border border-[#2f2c79]">
                    {item.suggestedFix}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-400 mb-2">Passos para Correção:</div>
                  <ol className="space-y-2">
                    {item.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#2f2c79] text-white text-xs flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-gray-300 flex-1">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

