import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Shield, CheckCircle, AlertTriangle, FileSearch, Download, ExternalLink } from "lucide-react";
import GuardRailModal from "../components/GuardRailModal";
import { CorrectionPlan } from "../components/CorrectionPlan";
import { useState } from "react";
import { toast } from "sonner";
import DocumentUploadValidator from "@/components/DocumentUploadValidator";

export default function AuditKRCI() {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [showGuardRail, setShowGuardRail] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [correctionPlan, setCorrectionPlan] = useState<any>(null);
  const [shouldGeneratePlan, setShouldGeneratePlan] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'select' | 'upload'>('select');

  // Query para listar relatórios (sem polling)
  const { data: reports } = trpc.technicalReports.generate.list.useQuery(
    { limit: 20 },
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Query para listar auditorias (sem polling)
  const { data: audits } = trpc.technicalReports.audit.list.useQuery(
    { limit: 10 },
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Query para gerar plano de correção
  const { data: planData } = trpc.technicalReports.audit.correctionPlan.useQuery(
    { auditId: auditResult?.auditId || '' },
    {
      enabled: shouldGeneratePlan && !!auditResult?.auditId,
      onSuccess: (data) => {
        setCorrectionPlan(data);
        setShouldGeneratePlan(false);
        toast.success('Plano de correção gerado!');
      },
      onError: (error) => {
        setShouldGeneratePlan(false);
        toast.error('Erro ao gerar plano', {
          description: error.message,
        });
      },
    }
  );

  // Mutation para executar auditoria
  const runAudit = trpc.technicalReports.audit.run.useMutation({
    onSuccess: (data) => {
      toast.success("Auditoria concluída!", {
        description: `Score: ${data.score}% - ${data.totalRules} regras verificadas`,
      });
      setAuditResult(data);
      setSelectedReport("");
    },
    onError: (error) => {
      toast.error("Erro ao executar auditoria", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReport) {
      toast.error("Selecione um relatório");
      return;
    }

    // GUARD-RAIL: Verificar se o relatório precisa de revisão
    const report = reports?.find((r) => r.id === selectedReport);
    if (report?.status === "needs_review") {
      setShowGuardRail(true);
      return;
    }

    if (report?.status !== "ready_for_audit") {
      toast.error("Relatório não está pronto para auditoria", {
        description: `Status atual: ${report?.status}`,
      });
      return;
    }

    runAudit.mutate({
      reportId: selectedReport,
      auditType: "full",
    });
  };

  // Função para determinar cor do score
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  // Função para determinar cor do badge de severidade
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-600";
      case "high":
        return "bg-orange-600";
      case "medium":
        return "bg-yellow-600";
      case "low":
        return "bg-[#2f2c79]";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Auditoria & KRCI</h1>
          <p className="text-gray-400 mt-2">
            Verifique a conformidade dos relatórios com 22 regras de auditoria KRCI
          </p>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Auditorias Completas</p>
                <p className="text-2xl font-bold">{audits?.length || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Score Médio</p>
                <p className="text-2xl font-bold">
                  {audits && audits.length > 0
                    ? Math.round(audits.reduce((sum, a) => sum + a.score, 0) / audits.length)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileSearch className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Relatórios Prontos</p>
                <p className="text-2xl font-bold">
                  {reports?.filter((r) => r.status === "ready_for_audit").length || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Formulário de Nova Auditoria */}
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Nova Auditoria</h2>
              <p className="text-sm text-gray-400">
                Selecione um relatório existente ou faça upload de um documento para validação
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('select')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'select'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Selecionar Relatório
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Upload de Documento
            </button>
          </div>

          {activeTab === 'select' ? (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Selecione um relatório para executar auditoria KRCI completa (22 regras)
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="report">Relatório</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger id="report">
                      <SelectValue placeholder="Selecione um relatório..." />
                    </SelectTrigger>
                    <SelectContent>
                      {reports?.map((report) => (
                        <SelectItem key={report.id} value={report.id}>
                          {report.title} ({report.standard}) - {report.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={runAudit.isPending}>
                    {runAudit.isPending ? "Executando auditoria..." : "Executar Auditoria"}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <DocumentUploadValidator
              onValidationComplete={(result) => {
                toast.success('Validação concluída!', {
                  description: `Score: ${result.score}% - ${result.criteria.length} critérios verificados`
                });
              }}
            />
          )}
        </Card>

        {/* Resultado da Auditoria */}
        {auditResult && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Resultado da Auditoria</h2>
              <Badge variant="secondary" className="text-xs">
                ID: {auditResult.auditId}
              </Badge>
            </div>

            {/* Score */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-center text-white mb-6">
              <div className={`text-6xl font-bold ${getScoreColor(auditResult.score)}`} style={{ color: 'white' }}>
                {auditResult.score}%
              </div>
              <p className="text-lg mt-2 opacity-90">Pontuação de Conformidade</p>
              <div className="flex justify-center gap-8 mt-6">
                <div>
                  <div className="text-3xl font-bold">{auditResult.totalRules}</div>
                  <div className="text-sm opacity-75">Regras Verificadas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{auditResult.passedRules}</div>
                  <div className="text-sm opacity-75">Aprovadas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{auditResult.failedRules}</div>
                  <div className="text-sm opacity-75">Reprovadas</div>
                </div>
              </div>
            </div>

            {/* Botão para Gerar Plano de Correção */}
            {auditResult.failedRules > 0 && !correctionPlan && (
              <div className="mb-6">
                <Button
                  onClick={() => setShouldGeneratePlan(true)}
                  className="w-full"
                  variant="default"
                >
                  <FileSearch className="h-4 w-4 mr-2" />
                  Gerar Plano de Correção Automático
                </Button>
              </div>
            )}

            {/* KRCI Identificados */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">KRCI Identificados</h3>
              {auditResult.krcis.length > 0 ? (
                <div className="space-y-3">
                  {auditResult.krcis.map((krci: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-[#000020]"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-bold">{krci.code}</span>
                          <Badge className={getSeverityColor(krci.severity)}>
                            {krci.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">
                          <strong>Seção:</strong> {krci.section}
                        </p>
                        <p className="text-sm">{krci.message}</p>
                      </div>
                      <div className="text-sm text-gray-500 ml-4">
                        Peso: {krci.weight}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                  <p className="text-green-900 font-semibold">
                    Nenhum KRCI identificado!
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Relatório em conformidade total com os padrões internacionais.
                  </p>
                </div>
              )}
            </div>

            {/* Recomendações */}
            {auditResult.recommendations.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Recomendações</h3>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <ul className="space-y-2">
                    {auditResult.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="text-sm text-blue-900">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Download PDF */}
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <a href={auditResult.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Relatório PDF
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={auditResult.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visualizar
                </a>
              </Button>
            </div>
          </Card>
        )}

        {/* Plano de Correção */}
        {correctionPlan && (
          <Card className="p-6">
            <CorrectionPlan
              plan={correctionPlan}
              onExport={(format) => {
                // Exportar plano de correção usando o próprio objeto
                let content = '';
                let mimeType = 'text/plain';
                
                if (format === 'json') {
                  content = JSON.stringify(correctionPlan, null, 2);
                  mimeType = 'application/json';
                } else if (format === 'markdown') {
                  content = `# Plano de Correção - KRCI\n\n${correctionPlan.summary}\n\n`;
                  content += `## Resumo\n\n`;
                  content += `- **Score KRCI**: ${correctionPlan.auditScore}%\n`;
                  content += `- **Total de Issues**: ${correctionPlan.totalIssues}\n`;
                  content += `- **Tempo Estimado**: ${Math.floor(correctionPlan.estimatedTotalTime / 60)}h ${correctionPlan.estimatedTotalTime % 60}m\n\n`;
                  content += `## Correções\n\n`;
                  correctionPlan.corrections.forEach((item: any, i: number) => {
                    content += `### ${i + 1}. ${item.ruleCode} - ${item.issue}\n`;
                    content += `- **Categoria**: ${item.category}\n`;
                    content += `- **Severidade**: ${item.severity}\n`;
                    content += `- **Tempo**: ${item.estimatedTime} min\n`;
                    content += `- **Sugestão**: ${item.suggestedFix}\n\n`;
                  });
                } else if (format === 'csv') {
                  content = 'Code,Category,Severity,Priority,Time,Issue,Suggestion\n';
                  correctionPlan.corrections.forEach((item: any) => {
                    content += `"${item.ruleCode}","${item.category}","${item.severity}",${item.priority},${item.estimatedTime},"${item.issue}","${item.suggestedFix}"\n`;
                  });
                  mimeType = 'text/csv';
                }
                
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `correction-plan-${correctionPlan.reportId}.${format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                toast.success(`Plano exportado em ${format.toUpperCase()}`);
              }}
            />
          </Card>
        )}

        {/* Auditorias Recentes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Auditorias Recentes</h3>
          {audits && audits.length > 0 ? (
            <div className="space-y-3">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-[#000020]"
                >
                  <div className="flex-1">
                    <p className="font-medium">Relatório ID: {audit.reportId}</p>
                    <p className="text-sm text-gray-400">
                      {audit.id} • {new Date(audit.createdAt || "").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getScoreColor(audit.score)}`}>
                        {audit.score}%
                      </p>
                      <p className="text-xs text-gray-400">
                        {audit.passedRules}/{audit.totalRules} aprovadas
                      </p>
                    </div>
                    {audit.pdfUrl && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={audit.pdfUrl} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Nenhuma auditoria realizada ainda
            </p>
          )}
        </Card>

        {/* Guard-Rail Modal */}
        <GuardRailModal
          open={showGuardRail}
          onClose={() => setShowGuardRail(false)}
          reportId={selectedReport}
          action="Auditoria"
        />
      </div>
    </DashboardLayout>
  );
}

