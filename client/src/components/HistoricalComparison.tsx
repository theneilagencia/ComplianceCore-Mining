import { useState } from "react";
import { trpc } from "../lib/trpc";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface HistoricalComparisonProps {
  reportId: string;
}

export function HistoricalComparison({ reportId }: HistoricalComparisonProps) {
  const [previousAuditId, setPreviousAuditId] = useState<string>("");
  const [currentAuditId, setCurrentAuditId] = useState<string>("");

  // Get all audits for the report
  const { data: trends } = trpc.audit.getTrends.useQuery({
    reportId,
  });

  const { data: comparison, isLoading } = trpc.audit.compareAudits.useQuery(
    {
      reportId,
      previousAuditId,
      currentAuditId,
    },
    {
      enabled: !!previousAuditId && !!currentAuditId,
    }
  );

  const audits = trends?.scoreProgression || [];

  const getScoreDeltaIcon = (delta: number) => {
    if (delta > 0) return <ArrowUp className="w-5 h-5 text-green-600" />;
    if (delta < 0) return <ArrowDown className="w-5 h-5 text-red-600" />;
    return <Minus className="w-5 h-5 text-gray-600" />;
  };

  const getScoreDeltaColor = (delta: number) => {
    if (delta > 0) return "text-green-600";
    if (delta < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-qivo-primary" />
          Comparativo Histórico
        </h2>
        <p className="text-gray-600">
          Compare duas auditorias para identificar melhorias e regressões
        </p>
      </div>

      {/* Audit Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auditoria Anterior
            </label>
            <select
              value={previousAuditId}
              onChange={(e) => setPreviousAuditId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qivo-primary focus:border-transparent"
            >
              <option value="">Selecione uma auditoria</option>
              {audits.map((audit, idx) => (
                <option key={idx} value={audit.period}>
                  {audit.period} - Score: {audit.score.toFixed(1)}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Auditoria Atual
            </label>
            <select
              value={currentAuditId}
              onChange={(e) => setCurrentAuditId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-qivo-primary focus:border-transparent"
            >
              <option value="">Selecione uma auditoria</option>
              {audits.map((audit, idx) => (
                <option key={idx} value={audit.period}>
                  {audit.period} - Score: {audit.score.toFixed(1)}%
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qivo-primary"></div>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumo da Comparação
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium mb-1">
                  Variação de Score
                </div>
                <div className="flex items-center gap-2">
                  {getScoreDeltaIcon(comparison.comparison.scoreDelta)}
                  <span
                    className={`text-2xl font-bold ${getScoreDeltaColor(
                      comparison.comparison.scoreDelta
                    )}`}
                  >
                    {comparison.comparison.scoreDelta > 0 ? "+" : ""}
                    {comparison.comparison.scoreDelta.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  Variação de Issues
                </div>
                <div className="flex items-center gap-2">
                  {getScoreDeltaIcon(-comparison.comparison.issuesDelta)}
                  <span
                    className={`text-2xl font-bold ${getScoreDeltaColor(
                      -comparison.comparison.issuesDelta
                    )}`}
                  >
                    {comparison.comparison.issuesDelta > 0 ? "+" : ""}
                    {comparison.comparison.issuesDelta}
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">
                  Issues Resolvidas
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {comparison.comparison.resolvedIssues.length}
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Insights
            </h3>
            <div className="space-y-2">
              {comparison.insights.map((insight, idx) => (
                <div
                  key={idx}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900"
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>

          {/* Resolved Issues */}
          {comparison.comparison.resolvedIssues.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Issues Resolvidas ({comparison.comparison.resolvedIssues.length})
              </h3>
              <div className="space-y-2">
                {comparison.comparison.resolvedIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="bg-green-50 border border-green-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-green-900">
                          {issue.code}
                        </div>
                        <div className="text-sm text-green-700 mt-1">
                          {issue.message}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Issues */}
          {comparison.comparison.newIssues.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Novas Issues ({comparison.comparison.newIssues.length})
              </h3>
              <div className="space-y-2">
                {comparison.comparison.newIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="bg-red-50 border border-red-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-red-900">
                          {issue.code}
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          {issue.message}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Persistent Issues */}
          {comparison.comparison.persistentIssues.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Issues Persistentes ({comparison.comparison.persistentIssues.length})
              </h3>
              <div className="space-y-2">
                {comparison.comparison.persistentIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-yellow-900">
                          {issue.code}
                        </div>
                        <div className="text-sm text-yellow-700 mt-1">
                          {issue.message}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(
                          issue.severity
                        )}`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-600" />
              Histórico de Auditorias
            </h3>
            <div className="space-y-2">
              {comparison.audits.map((audit, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(audit.date).toLocaleDateString("pt-BR")}
                    </div>
                    <div className="text-sm text-gray-600">
                      {audit.totalIssues} issues
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {audit.score.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!previousAuditId || !currentAuditId ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            Selecione duas auditorias para comparar
          </p>
        </div>
      ) : null}
    </div>
  );
}

