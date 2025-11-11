/**
 * ============================================================================
 * QIVO Mining - Módulo de Auditoria KRCI
 * ============================================================================
 * 
 * VERSÃO: 3.0.0 - REESCRITA COMPLETA
 * DATA: 04/11/2025 - 14:10 BRT
 * 
 * ARQUITETURA SIMPLIFICADA:
 * - Upload direto via modal dedicado
 * - Execução automática da auditoria após upload
 * - Resultados exibidos na mesma página
 * - ZERO redirecionamentos externos
 * 
 * FLUXO:
 * 1. Usuário clica em "Fazer Upload"
 * 2. Modal abre para seleção de PDF
 * 3. Upload e parsing automático
 * 4. Modal fecha
 * 5. Auditoria executa automaticamente
 * 6. Resultados aparecem na tela
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  TrendingUp,
  FileCheck2,
  Clock,
  Award,
  BarChart3,
} from "lucide-react";

import DashboardLayout from "@/components/DashboardLayout";
import AuditUploadModal from "../components/AuditUploadModal";

// ============================================================================
// TIPOS
// ============================================================================

interface AuditResult {
  auditId: string;
  reportId: string;
  score: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  krcis: Array<{
    section: string;
    passed: boolean;
    score: number;
    keywords?: string[];
  }>;
  recommendations?: string[];
  createdAt: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AuditKRCIModule() {
  console.log("[AuditKRCI v3.0] Component mounted");

  // Estados
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "history">("upload");

  // Queries
  const auditsQuery = trpc.technicalReports.audit.list.useQuery(
    { limit: 20 },
    { 
      refetchOnWindowFocus: false,
      refetchInterval: false,
    }
  );

  // Mutations
  const runAuditMutation = trpc.technicalReports.audit.run.useMutation({
    onMutate: () => {
      console.log("[AuditKRCI v3.0] Starting audit...");
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      console.log("[AuditKRCI v3.0] Audit completed successfully:", data);
      setSelectedAudit(data as AuditResult);
      setIsProcessing(false);
      auditsQuery.refetch();

      toast.success("✅ Auditoria Concluída!", {
        description: `Score: ${data.score}% | ${data.passedRules}/${data.totalRules} critérios atendidos`,
        duration: 5000,
      });

      // Scroll automático para resultados
      setTimeout(() => {
        const resultsElement = document.getElementById("audit-results-section");
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    },
    onError: (error) => {
      console.error("[AuditKRCI v3.0] Audit failed:", error);
      setIsProcessing(false);

      toast.error("❌ Erro na Auditoria", {
        description: error.message || "Tente novamente em alguns instantes",
        duration: 5000,
      });
    },
  });

  // Handlers
  const handleUploadSuccess = (reportId: string) => {
    console.log("[AuditKRCI v3.0] Upload completed, reportId:", reportId);
    
    toast.info("📄 Upload Concluído!", {
      description: "Iniciando auditoria automática...",
      duration: 3000,
    });

    // Executar auditoria automaticamente
    setTimeout(() => {
      runAuditMutation.mutate({
        reportId,
        auditType: "full",
      });
    }, 500);
  };

  const handleSelectHistoryAudit = (audit: AuditResult) => {
    console.log("[AuditKRCI v3.0] Selected audit from history:", audit.auditId);
    setSelectedAudit(audit);
    setActiveTab("upload");

    // Scroll para resultados
    setTimeout(() => {
      const resultsElement = document.getElementById("audit-results-section");
      if (resultsElement) {
        resultsElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6 max-w-7xl">
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <FileCheck2 className="h-10 w-10 text-blue-600" />
              Auditoria & KRCI
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Verificação automática de conformidade com 22 regras de auditoria KRCI
            </p>
          </div>
          <Button 
            onClick={() => setUploadModalOpen(true)} 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="mr-2 h-5 w-5" />
            Fazer Upload
          </Button>
        </div>

        {/* ===== STATISTICS CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Auditorias Completas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
                <div className="text-3xl font-bold text-gray-900">
                  {auditsQuery.data?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Score Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-yellow-600" />
                <div className="text-3xl font-bold text-gray-900">
                  {auditsQuery.data && auditsQuery.data.length > 0
                    ? Math.round(
                        auditsQuery.data.reduce((acc, a) => acc + a.score, 0) /
                          auditsQuery.data.length
                      )
                    : 0}
                  %
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Relatórios Prontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="text-3xl font-bold text-gray-900">0</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== TABS ===== */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload de Documento</TabsTrigger>
            <TabsTrigger value="history">Auditorias Recentes</TabsTrigger>
          </TabsList>

          {/* ===== TAB: UPLOAD ===== */}
          <TabsContent value="upload" className="space-y-6 mt-6">
            {/* Upload Card */}
            {!selectedAudit && !isProcessing && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                      <Upload className="h-12 w-12 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      Faça Upload do Seu Relatório
                    </h3>
                    <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                      Selecione um arquivo PDF para iniciar a auditoria automática de conformidade KRCI
                    </p>
                    <Button 
                      onClick={() => setUploadModalOpen(true)} 
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      Selecionar Arquivo PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <Alert className="border-blue-200 bg-blue-50">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <AlertDescription className="ml-2">
                  <div className="space-y-3">
                    <div>
                      <strong className="text-blue-900">Processando Auditoria...</strong>
                      <p className="text-blue-700 mt-1">
                        Analisando documento e verificando conformidade com 22 critérios KRCI.
                        Isso pode levar alguns segundos.
                      </p>
                    </div>
                    <Progress value={66} className="h-2" />
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Results Section */}
            {selectedAudit && (
              <div id="audit-results-section" className="space-y-6">
                {/* Score Card */}
                <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-3xl font-bold text-green-900 mb-2">
                          Resultado da Auditoria
                        </CardTitle>
                        <CardDescription className="text-green-700 text-base">
                          {new Date(selectedAudit.createdAt).toLocaleString("pt-BR", {
                            dateStyle: "long",
                            timeStyle: "short",
                          })}
                        </CardDescription>
                      </div>
                      <div className="text-center bg-white rounded-xl p-6 shadow-lg">
                        <div className="text-6xl font-bold text-green-600 mb-2">
                          {selectedAudit.score}%
                        </div>
                        <Badge variant="default" className="bg-green-600 text-white">
                          Score Geral
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-5 text-center shadow-sm">
                        <FileCheck2 className="mx-auto h-10 w-10 text-blue-600 mb-3" />
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          {selectedAudit.totalRules}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Total de Critérios</p>
                      </div>
                      <div className="bg-white rounded-lg p-5 text-center shadow-sm">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 mb-3" />
                        <div className="text-3xl font-bold text-green-600 mb-1">
                          {selectedAudit.passedRules}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Atendidos</p>
                      </div>
                      <div className="bg-white rounded-lg p-5 text-center shadow-sm">
                        <XCircle className="mx-auto h-10 w-10 text-red-600 mb-3" />
                        <div className="text-3xl font-bold text-red-600 mb-1">
                          {selectedAudit.failedRules}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Não Atendidos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Criteria Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      Critérios Verificados ({selectedAudit.krcis?.length || 0})
                    </CardTitle>
                    <CardDescription className="text-base">
                      Detalhamento completo de cada critério KRCI analisado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedAudit.krcis?.map((krci, index) => (
                        <div
                          key={index}
                          className={`p-5 rounded-xl border-2 transition-all ${
                            krci.passed
                              ? "border-green-300 bg-green-50 hover:bg-green-100"
                              : "border-red-300 bg-red-50 hover:bg-red-100"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                {krci.passed ? (
                                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                                ) : (
                                  <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                                )}
                                <h4 className="font-bold text-lg text-gray-900">{krci.section}</h4>
                              </div>
                              <div className="ml-9">
                                <p className="text-sm text-gray-700 mb-3">
                                  <strong>Score:</strong> {krci.score}%
                                </p>
                                {krci.keywords && krci.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {krci.keywords.map((keyword, kidx) => (
                                      <Badge key={kidx} variant="secondary" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={krci.passed ? "default" : "destructive"}
                              className="ml-4 text-sm px-4 py-1"
                            >
                              {krci.passed ? "✓ Atende" : "✗ Não Atende"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {selectedAudit.recommendations && selectedAudit.recommendations.length > 0 && (
                  <Card className="border-yellow-300 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        Recomendações ({selectedAudit.recommendations.length})
                      </CardTitle>
                      <CardDescription className="text-base text-yellow-800">
                        Sugestões para melhorar a conformidade do relatório
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {selectedAudit.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="text-yellow-600 text-xl font-bold mt-1">•</span>
                            <span className="text-gray-800 text-base">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* New Audit Button */}
                <div className="text-center pt-6">
                  <Button
                    onClick={() => {
                      setSelectedAudit(null);
                      setUploadModalOpen(true);
                    }}
                    size="lg"
                    variant="outline"
                  >
                    <Upload className="mr-2 h-5 w-5" />
                    Nova Auditoria
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ===== TAB: HISTORY ===== */}
          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Auditorias Recentes</CardTitle>
                <CardDescription className="text-base">
                  Histórico completo de auditorias realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {auditsQuery.isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
                    <p className="text-gray-600">Carregando auditorias...</p>
                  </div>
                ) : !auditsQuery.data || auditsQuery.data.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 text-lg mb-4">Nenhuma auditoria realizada ainda</p>
                    <Button onClick={() => setUploadModalOpen(true)}>
                      <Upload className="mr-2 h-4 w-4" />
                      Fazer Primeira Auditoria
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditsQuery.data.map((audit) => (
                      <div
                        key={audit.auditId}
                        className="p-5 border-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-all hover:border-blue-300"
                        onClick={() => handleSelectHistoryAudit(audit as AuditResult)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <TrendingUp className="h-6 w-6 text-blue-600" />
                              <h4 className="font-bold text-lg text-gray-900">
                                Auditoria #{audit.auditId.slice(-8).toUpperCase()}
                              </h4>
                              <Badge
                                variant={audit.score >= 80 ? "default" : "secondary"}
                                className="text-sm"
                              >
                                {audit.score}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 ml-9">
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

      {/* ===== UPLOAD MODAL ===== */}
      <AuditUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadComplete={handleUploadSuccess}
      />
    </DashboardLayout>
  );
}
