/**
 * Módulo de Auditoria KRCI - REESCRITO
 * 
 * Arquitetura limpa e simples:
 * 1. Upload de PDF via modal dedicado
 * 2. Execução automática da auditoria
 * 3. Exibição dos resultados na mesma página
 * 4. SEM redirecionamentos
 * 
 * Versão: 2.0.0
 * Data: 04/11/2025
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  FileCheck,
  Clock,
} from "lucide-react";

// Componentes
import DashboardLayout from "@/components/DashboardLayout";
import AuditUploadModal from "../components/AuditUploadModal";

export default function AuditKRCI() {
  // Estados
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentAuditResult, setCurrentAuditResult] = useState<any>(null);
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  // Queries
  const { data: auditsHistory, refetch: refetchAudits } = trpc.technicalReports.audit.list.useQuery(
    { limit: 10 },
    { refetchOnWindowFocus: false }
  );

  // Mutations
  const runAuditMutation = trpc.technicalReports.audit.run.useMutation({
    onSuccess: (data) => {
      console.log("[AuditKRCI] Audit completed successfully:", data);
      setCurrentAuditResult(data);
      setIsRunningAudit(false);
      refetchAudits();
      
      toast.success("Auditoria concluída!", {
        description: `Score: ${data.score}% - ${data.passedRules}/${data.totalRules} critérios atendidos`,
        duration: 5000,
      });

      // Scroll automático para resultados
      setTimeout(() => {
        document.getElementById("audit-results")?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    },
    onError: (error) => {
      console.error("[AuditKRCI] Audit failed:", error);
      setIsRunningAudit(false);
      
      toast.error("Erro na auditoria", {
        description: error.message || "Tente novamente",
        duration: 5000,
      });
    },
  });

  // Handlers
  const handleUploadComplete = (reportId: string) => {
    console.log("[AuditKRCI] Upload completed, starting audit for:", reportId);
    setIsRunningAudit(true);
    setCurrentAuditResult(null);

    // Executar auditoria automaticamente
    runAuditMutation.mutate({
      reportId,
      auditType: "full",
    });
  };

  const handleSelectAudit = (audit: any) => {
    console.log("[AuditKRCI] Selected audit:", audit.auditId);
    setCurrentAuditResult(audit);
    
    // Scroll para resultados
    setTimeout(() => {
      document.getElementById("audit-results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Auditoria & KRCI</h1>
            <p className="text-gray-600 mt-1">
              Análise de conformidade com critérios KRCI (Key Reporting Compliance Indicators)
            </p>
          </div>
          <Button onClick={() => setShowUploadModal(true)} size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Novo Upload
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload de Documento</TabsTrigger>
            <TabsTrigger value="history">Auditorias Recentes</TabsTrigger>
          </TabsList>

          {/* Tab: Upload */}
          <TabsContent value="upload" className="space-y-6">
            {/* Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle>Upload de Relatório</CardTitle>
                <CardDescription>
                  Faça upload de um relatório técnico em PDF para análise de conformidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Faça upload do seu relatório
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Apenas arquivos PDF são aceitos
                  </p>
                  <Button onClick={() => setShowUploadModal(true)} size="lg">
                    <FileText className="mr-2 h-5 w-5" />
                    Selecionar Arquivo
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing Status */}
            {isRunningAudit && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  <strong>Processando auditoria...</strong>
                  <br />
                  Analisando documento e verificando conformidade com critérios KRCI.
                  Isso pode levar alguns segundos.
                </AlertDescription>
              </Alert>
            )}

            {/* Results */}
            {currentAuditResult && (
              <div id="audit-results" className="space-y-6">
                {/* Score Card */}
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">Resultado da Auditoria</CardTitle>
                        <CardDescription>
                          {new Date(currentAuditResult.createdAt).toLocaleString("pt-BR")}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-bold text-green-600">
                          {currentAuditResult.score}%
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Score Geral</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg">
                        <FileCheck className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-gray-900">
                          {currentAuditResult.totalRules}
                        </div>
                        <p className="text-sm text-gray-600">Total de Critérios</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <CheckCircle className="mx-auto h-8 w-8 text-green-600 mb-2" />
                        <div className="text-2xl font-bold text-green-600">
                          {currentAuditResult.passedRules}
                        </div>
                        <p className="text-sm text-gray-600">Atendidos</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg">
                        <XCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
                        <div className="text-2xl font-bold text-red-600">
                          {currentAuditResult.failedRules}
                        </div>
                        <p className="text-sm text-gray-600">Não Atendidos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Criteria Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Critérios Verificados ({currentAuditResult.krcis?.length || 0})</CardTitle>
                    <CardDescription>
                      Detalhamento de cada critério KRCI analisado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentAuditResult.krcis?.map((krci: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${
                            krci.passed
                              ? "border-green-200 bg-green-50"
                              : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                {krci.passed ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600" />
                                )}
                                <h4 className="font-semibold text-gray-900">{krci.section}</h4>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">
                                Score: <strong>{krci.score}%</strong>
                              </p>
                              {krci.keywords && krci.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {krci.keywords.map((keyword: string, kidx: number) => (
                                    <Badge key={kidx} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Badge
                              variant={krci.passed ? "default" : "destructive"}
                              className="ml-4"
                            >
                              {krci.passed ? "Atende" : "Não Atende"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {currentAuditResult.recommendations && currentAuditResult.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
                        Recomendações ({currentAuditResult.recommendations.length})
                      </CardTitle>
                      <CardDescription>
                        Sugestões para melhorar a conformidade do relatório
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentAuditResult.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab: History */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Auditorias Recentes</CardTitle>
                <CardDescription>
                  Histórico de auditorias realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!auditsHistory || auditsHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhuma auditoria realizada ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditsHistory.map((audit: any) => (
                      <div
                        key={audit.auditId}
                        className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSelectAudit(audit)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <TrendingUp className="h-5 w-5 text-blue-600" />
                              <h4 className="font-semibold text-gray-900">
                                Auditoria #{audit.auditId.slice(-8)}
                              </h4>
                              <Badge
                                variant={audit.score >= 80 ? "default" : "secondary"}
                              >
                                {audit.score}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(audit.createdAt).toLocaleString("pt-BR")} •{" "}
                              {audit.passedRules}/{audit.totalRules} critérios atendidos
                            </p>
                          </div>
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Modal */}
      <AuditUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={handleUploadComplete}
      />
    </DashboardLayout>
  );
}
