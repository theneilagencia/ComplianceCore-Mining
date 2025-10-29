import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";

interface AuditTrendsDashboardProps {
  reportId: string;
}

export function AuditTrendsDashboard({ reportId }: AuditTrendsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "categories">("overview");

  const { data: trends, isLoading, error } = trpc.audit.getTrends.useQuery({
    reportId,
  });

  const { data: statistics } = trpc.audit.getStatistics.useQuery({
    reportId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-qivo-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>Erro ao carregar tendências: {error.message}</span>
        </div>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-yellow-800">
          <Info className="w-5 h-5" />
          <span>Nenhuma tendência disponível ainda</span>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (trends.summary.trend === "improving") {
      return <TrendingUp className="w-6 h-6 text-green-600" />;
    } else if (trends.summary.trend === "declining") {
      return <TrendingDown className="w-6 h-6 text-red-600" />;
    }
    return <Activity className="w-6 h-6 text-gray-600" />;
  };

  const getTrendColor = () => {
    if (trends.summary.trend === "improving") return "text-green-600";
    if (trends.summary.trend === "declining") return "text-red-600";
    return "text-gray-600";
  };

  const getTrendLabel = () => {
    if (trends.summary.trend === "improving") return "Em Melhoria";
    if (trends.summary.trend === "declining") return "Em Declínio";
    return "Estável";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Dashboard de Tendências KRCI
        </h2>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">
              Total de Auditorias
            </div>
            <div className="text-3xl font-bold text-blue-900">
              {trends.totalAudits}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">
              Score Médio
            </div>
            <div className="text-3xl font-bold text-purple-900">
              {trends.summary.averageScore.toFixed(1)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">
              Melhor Score
            </div>
            <div className="text-3xl font-bold text-green-900">
              {trends.summary.bestScore.toFixed(1)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="text-sm text-orange-600 font-medium mb-1">
              Tendência
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-xl font-bold ${getTrendColor()}`}>
                {getTrendLabel()}
              </span>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <div className="text-sm text-gray-600">Issues Médias</div>
              <div className="text-lg font-semibold text-gray-900">
                {statistics.averageIssues}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Categoria Mais Comum</div>
              <div className="text-lg font-semibold text-gray-900">
                {statistics.mostCommonCategory}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Severidade Mais Comum</div>
              <div className="text-lg font-semibold text-gray-900">
                {statistics.mostCommonSeverity}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-qivo-primary text-qivo-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === "trends"
                  ? "border-qivo-primary text-qivo-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Evolução do Score
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-6 py-3 border-b-2 font-medium text-sm ${
                activeTab === "categories"
                  ? "border-qivo-primary text-qivo-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Categorias
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Improvements */}
              {trends.improvements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Melhorias Identificadas
                  </h3>
                  <div className="space-y-2">
                    {trends.improvements.map((improvement, idx) => (
                      <div
                        key={idx}
                        className="bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-green-900">
                            {improvement.category}
                          </span>
                          <span className="text-green-700 font-semibold">
                            -{improvement.improvement.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-sm text-green-700 mt-1">
                          {improvement.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regressions */}
              {trends.regressions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Áreas que Precisam Atenção
                  </h3>
                  <div className="space-y-2">
                    {trends.regressions.map((regression, idx) => (
                      <div
                        key={idx}
                        className="bg-red-50 border border-red-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-900">
                            {regression.category}
                          </span>
                          <span className="text-red-700 font-semibold">
                            +{regression.regression.toFixed(0)}%
                          </span>
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                          {regression.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {trends.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Recomendações
                  </h3>
                  <div className="space-y-2">
                    {trends.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900"
                      >
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === "trends" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Evolução do Score KRCI
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.scoreProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      name="Score (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Issues por Severidade
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.scoreProgression}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="criticalIssues" fill="#ef4444" name="Críticas" />
                    <Bar dataKey="highIssues" fill="#f97316" name="Altas" />
                    <Bar dataKey="mediumIssues" fill="#eab308" name="Médias" />
                    <Bar dataKey="lowIssues" fill="#3b82f6" name="Baixas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              {trends.categoryTrends.map((categoryTrend) => (
                <div key={categoryTrend.category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
                    {categoryTrend.category}
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={categoryTrend.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Issues"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

