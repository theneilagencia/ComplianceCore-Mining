/**
 * Unified Upload Modal with Real-Time Events
 * 
 * Revolutionary approach to file upload UX:
 * - Server-Sent Events (SSE) for real-time progress
 * - No polling, no race conditions
 * - Clear visual feedback at every stage
 * - Automatic redirection based on processing results
 * - Retry logic on failures
 * 
 * Flow:
 * 1. User selects file
 * 2. Upload starts → Subscribe to SSE
 * 3. Real-time events show progress:
 *    - upload.completed
 *    - parsing.started
 *    - parsing.progress (25%, 50%, 75%, 100%)
 *    - parsing.completed OR parsing.failed
 * 4. Auto-redirect:
 *    - needs_review → /reports/:id/review
 *    - ready_for_audit → /audits/create?reportId=:id
 *    - parsing_failed → Show error + retry option
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, AlertTriangle } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface UnifiedUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  skipAutoRedirect?: boolean;
  onUploadComplete?: (reportId: string, status: string) => void;
}

type ProcessingStage = 
  | "idle"
  | "uploading"
  | "upload_complete"
  | "parsing_started"
  | "parsing_progress"
  | "parsing_complete"
  | "parsing_failed";

interface ProcessingState {
  stage: ProcessingStage;
  progress: number;
  message: string;
  reportId: string | null;
  uploadId: string | null;
  fileName: string | null;
  finalStatus: "needs_review" | "ready_for_audit" | null;
  error: string | null;
  retryable: boolean;
}

export default function UnifiedUploadModal({ isOpen, onClose, skipAutoRedirect = false, onUploadComplete }: UnifiedUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<ProcessingState>({
    stage: "idle",
    progress: 0,
    message: "",
    reportId: null,
    uploadId: null,
    fileName: null,
    finalStatus: null,
    error: null,
    retryable: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const uploadMutation = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();

  // Cleanup SSE connection on unmount or close
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        console.log("[UnifiedUploadModal] Closing SSE connection");
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && state.stage === "idle") {
      setFile(droppedFile);
    }
  }, [state.stage]);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && state.stage === "idle") {
      setFile(selectedFile);
    }
  };

  // Subscribe to SSE for a report
  const subscribeToEvents = (reportId: string) => {
    console.log("[UnifiedUploadModal] Subscribing to SSE for report:", reportId);

    const eventSource = new EventSource(`/api/events/${reportId}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[UnifiedUploadModal] SSE connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[UnifiedUploadModal] SSE event received:", data);

        handleEvent(data);
      } catch (error) {
        console.error("[UnifiedUploadModal] Error parsing SSE event:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("[UnifiedUploadModal] SSE error:", error);
      
      // Reconnect automatically after 3 seconds
      setTimeout(() => {
        if (state.stage !== "parsing_complete" && state.stage !== "parsing_failed") {
          console.log("[UnifiedUploadModal] Reconnecting SSE...");
          subscribeToEvents(reportId);
        }
      }, 3000);
    };
  };

  // Handle incoming SSE events
  const handleEvent = (event: any) => {
    switch (event.type) {
      case "connected":
        console.log("[UnifiedUploadModal] Connected to event stream");
        break;

      case "upload.completed":
        setState(prev => ({
          ...prev,
          stage: "upload_complete",
          progress: 10,
          message: "Upload concluído! Iniciando processamento...",
          uploadId: event.data.uploadId,
        }));
        break;

      case "parsing.started":
        setState(prev => ({
          ...prev,
          stage: "parsing_started",
          progress: 15,
          message: "Analisando arquivo...",
          fileName: event.data.fileName,
        }));
        break;

      case "parsing.progress":
        setState(prev => ({
          ...prev,
          stage: "parsing_progress",
          progress: event.data.progress,
          message: event.data.stage,
        }));
        break;

      case "parsing.completed":
        setState(prev => ({
          ...prev,
          stage: "parsing_complete",
          progress: 100,
          message: "Processamento concluído!",
          finalStatus: event.data.status,
        }));

        // Close SSE connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Show success toast
        toast.success("Relatório processado!", {
          description: event.data.status === "needs_review" 
            ? "Revisão necessária. Redirecionando..." 
            : "Pronto para auditoria. Redirecionando...",
        });

        // Invalidate queries
        utils.technicalReports.generate.list.invalidate();

        // Auto-redirect after 1.5s (unless skipAutoRedirect is true)
        setTimeout(() => {
          onClose();
          
          if (skipAutoRedirect) {
            // Call callback instead of redirecting
            if (onUploadComplete && state.reportId) {
              onUploadComplete(state.reportId, event.data.status);
            }
          } else {
            // TEMPORARILY DISABLED: auto-redirect
            // Investigating redirect issue in audit module
            console.log('[UnifiedUploadModal] Auto-redirect DISABLED. Status:', event.data.status, 'ReportId:', state.reportId);
            // if (event.data.status === "needs_review") {
            //   setLocation(`/reports/${state.reportId}/review`);
            // } else {
            //   setLocation(`/audits/create?reportId=${state.reportId}`);
            // }
          }
        }, 1500);
        break;

      case "parsing.failed":
        setState(prev => ({
          ...prev,
          stage: "parsing_failed",
          progress: 0,
          message: "Falha no processamento",
          error: event.data.error,
          retryable: event.data.retryable,
        }));

        // Close SSE connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Show error toast
        toast.error("Erro no processamento", {
          description: event.data.error,
          duration: 7000,
        });
        break;

      case "review.required":
        // Additional notification
        toast.info("Revisão necessária", {
          description: `${event.data.uncertainFieldsCount} campos precisam de validação`,
        });
        break;

      case "audit.ready":
        // Additional notification
        toast.success("Pronto para auditoria", {
          description: `Padrão detectado: ${event.data.standard}`,
        });
        break;

      default:
        console.log("[UnifiedUploadModal] Unknown event type:", event.type);
    }
  };

  // Handle upload start
  const handleUpload = async () => {
    if (!file) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

    // Validation
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande", {
        description: `Tamanho máximo: 50MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    if (file.size < 1024) {
      toast.error("Arquivo muito pequeno ou vazio");
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'docx', 'xlsx', 'csv', 'zip'];
    
    if (!validExtensions.includes(fileExtension || '')) {
      toast.error("Extensão de arquivo não suportada", {
        description: `Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP`,
      });
      return;
    }

    try {
      // Stage 1: Upload file
      setState({
        stage: "uploading",
        progress: 5,
        message: "Enviando arquivo...",
        reportId: null,
        uploadId: null,
        fileName: file.name,
        finalStatus: null,
        error: null,
        retryable: false,
      });

      // Read file as base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = () => {
          try {
            const result = reader.result as string;
            if (!result || !result.includes(',')) {
              reject(new Error("Formato de arquivo inválido"));
              return;
            }
            const base64 = result.split(",")[1];
            if (!base64) {
              reject(new Error("Não foi possível converter o arquivo"));
              return;
            }
            resolve(base64);
          } catch (error) {
            reject(new Error(`Erro ao processar arquivo: ${error}`));
          }
        };
        
        reader.onerror = () => {
          reject(new Error(`Erro ao ler arquivo: ${reader.error?.message || 'desconhecido'}`));
        };
        
        reader.readAsDataURL(file);
      });

      // Call upload mutation
      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileData,
      });

      // Stage 2: Upload complete, subscribe to SSE
      setState(prev => ({
        ...prev,
        reportId: result.reportId,
        uploadId: result.uploadId,
      }));

      // Subscribe to real-time events
      subscribeToEvents(result.reportId);

    } catch (error: any) {
      console.error("[UnifiedUploadModal] Upload error:", error);
      
      setState({
        stage: "parsing_failed",
        progress: 0,
        message: "Erro no upload",
        reportId: null,
        uploadId: null,
        fileName: file.name,
        finalStatus: null,
        error: error.message || "Erro desconhecido",
        retryable: true,
      });

      toast.error("Erro no upload", {
        description: error.message || "Tente novamente",
        duration: 7000,
      });
    }
  };

  // Handle retry
  const handleRetry = () => {
    // Reset state
    setState({
      stage: "idle",
      progress: 0,
      message: "",
      reportId: null,
      uploadId: null,
      fileName: null,
      finalStatus: null,
      error: null,
      retryable: false,
    });

    // Retry upload
    handleUpload();
  };

  // Handle close
  const handleClose = () => {
    if (state.stage === "uploading" || state.stage === "parsing_progress") {
      toast.warning("Processamento em andamento", {
        description: "Aguarde a conclusão ou falha do processamento",
      });
      return;
    }

    // Close SSE connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Reset state
    setState({
      stage: "idle",
      progress: 0,
      message: "",
      reportId: null,
      uploadId: null,
      fileName: null,
      finalStatus: null,
      error: null,
      retryable: false,
    });

    setFile(null);
    onClose();
  };

  // Determine if upload is in progress
  const isProcessing = ["uploading", "upload_complete", "parsing_started", "parsing_progress"].includes(state.stage);
  const isComplete = state.stage === "parsing_complete";
  const isFailed = state.stage === "parsing_failed";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Upload de Relatório - Sistema Unificado</DialogTitle>
          <DialogDescription>
            Upload com processamento em tempo real e feedback instantâneo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Selection */}
          {state.stage === "idle" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 border-muted-foreground/25 hover:border-primary/50"
            >
              {!file ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Arraste um arquivo aqui ou
                    </p>
                    <label className="text-sm text-primary hover:underline cursor-pointer">
                      selecione do seu computador
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.xlsx,.csv,.zip"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP (máx. 50MB)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Card className="p-6 space-y-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    {state.message}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Arquivo: {state.fileName}
                  </p>
                </div>
              </div>
              <Progress value={state.progress} className="h-2" />
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                {state.progress}% - Não feche esta janela
              </p>
            </Card>
          )}

          {/* Success State */}
          {isComplete && (
            <Card className="p-6 space-y-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    {state.message}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {state.finalStatus === "needs_review" 
                      ? "Redirecionando para revisão..." 
                      : "Redirecionando para auditoria..."}
                  </p>
                </div>
              </div>
              <Progress value={100} className="h-2" />
            </Card>
          )}

          {/* Error State */}
          {isFailed && (
            <Card className="p-6 space-y-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 dark:text-red-100">
                    {state.message}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {state.error}
                  </p>
                  {state.retryable && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="mt-3"
                    >
                      Tentar Novamente
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium">Sistema Unificado - Novidades:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Progresso em tempo real via Server-Sent Events</li>
                  <li>Processamento assíncrono em fila com retry automático</li>
                  <li>Redirecionamento automático baseado no resultado</li>
                  <li>Sem polling HTTP - comunicação bidirecional eficiente</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              {isProcessing ? "Aguarde..." : "Fechar"}
            </Button>
            {state.stage === "idle" && (
              <Button
                onClick={handleUpload}
                disabled={!file || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Iniciar Upload"
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
