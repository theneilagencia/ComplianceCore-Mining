import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (result: { uploadId: string; reportId: string }) => void;
}

/**
 * UploadModalAtomic - Versão atômica do modal de upload
 * 
 * Usa o endpoint uploadsV2.uploadAndProcessReport que faz tudo em uma única transação:
 * - Upload para storage
 * - Criação de registros no banco
 * - Parsing assíncrono
 * 
 * Elimina condições de corrida e garante consistência total.
 * 
 * CORREÇÕES APLICADAS:
 * 1. Substituído mutate() por mutateAsync() e aguardando Promise
 * 2. Adicionado estado "processing" após upload
 * 3. Implementado polling para status do parsing
 * 4. Modal fecha automaticamente quando parsing completa
 * 5. Logs de debug sem dados sensíveis
 */
export default function UploadModalAtomic({ open, onClose, onSuccess }: UploadModalProps) {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // NOVO: Estado para controlar o processamento após upload
  const [processing, setProcessing] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Reset estados quando o modal abre
  useEffect(() => {
    if (open) {
      console.log('[UploadModalAtomic] Modal aberto - resetando estados');
      setFile(null);
      setUploading(false);
      setProcessing(false);
      setReportId(null);
      setUploadId(null);
    }
  }, [open]);

  // Usar o endpoint atômico V2
  const uploadAndProcess = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();

  // NOVO: Polling para verificar status do parsing
  useEffect(() => {
    if (!processing || !reportId) return;

    console.log('[UploadModalAtomic] Iniciando polling para reportId:', reportId);

    let pollCount = 0;
    const maxPolls = 60; // 3 minutos (60 * 3s)
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;
    
    // Aguardar 2 segundos antes de iniciar polling (dar tempo pro backend processar)
    const initialDelay = setTimeout(() => {
      const pollInterval = setInterval(async () => {
        pollCount++;
        console.log(`[UploadModalAtomic] Poll #${pollCount}/${maxPolls} para reportId:`, reportId);

        try {
          // CORREÇÃO: Usar utils.fetch em vez de utils.client.query
          const data = await utils.technicalReports.generate.getStatus.fetch({ reportId });
          console.log('[UploadModalAtomic] Status do report:', data);
          
          // Reset contador de erros em caso de sucesso
          consecutiveErrors = 0;

        // Verificar se o parsing foi concluído
        // Aceitar qualquer status que não seja "draft" ou "parsing" como concluído
        const completedStatuses = ['ready_for_audit', 'completed', 'needs_review', 'audited', 'certified', 'exported'];
        const isCompleted = completedStatuses.includes(data.status);
        
        if (isCompleted) {
          console.log('[UploadModalAtomic] ✅ Parsing concluído! Status:', data.status);
          
          // Limpar intervalo
          clearInterval(pollInterval);
          
          // Atualizar estado para "done"
          setProcessing(false);
          
          // Invalidar queries para atualizar listas
          utils.technicalReports.generate.list.invalidate();
          utils.technicalReports.uploads.list.invalidate();
          
          // Mostrar toast apropriado
          if (data.status === 'needs_review') {
            toast.warning("Relatório processado com avisos", {
              description: "Alguns campos precisam de revisão manual.",
            });
          } else {
            toast.success("Relatório processado com sucesso!", {
              description: "Seu relatório está pronto para auditoria.",
            });
          }
          
          // Chamar onSuccess callback se fornecido
          if (onSuccess && uploadId) {
            console.log('[UploadModalAtomic] Chamando onSuccess callback');
            onSuccess({ uploadId, reportId });
          } else {
            // Se não há callback, redirecionar para a lista
            console.log('[UploadModalAtomic] Sem callback, redirecionando para lista');
            setTimeout(() => {
              onClose();
              setLocation(`/reports/generate`);
            }, 1500);
          }
        }
      } catch (error: any) {
        console.error('[UploadModalAtomic] Erro no polling:', error);
        consecutiveErrors++;
        
        // Se houver muitos erros consecutivos, parar o polling
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('[UploadModalAtomic] Muitos erros consecutivos, parando polling');
          clearInterval(pollInterval);
          setProcessing(false);
          
          toast.error("Erro ao verificar status do relatório", {
            description: "Tente recarregar a página ou entre em contato com o suporte.",
            duration: 7000,
          });
          return;
        }
      }

      // Timeout após maxPolls tentativas
      if (pollCount >= maxPolls) {
        console.warn('[UploadModalAtomic] Timeout do polling após', maxPolls, 'tentativas');
        clearInterval(pollInterval);
        setProcessing(false);
        
        toast.warning("Processamento está demorando", {
          description: "O relatório está sendo processado. Você pode fechar esta janela.",
        });
      }
      }, 3000); // Poll a cada 3 segundos
    }, 2000); // Aguardar 2 segundos antes de iniciar polling

    // Cleanup ao desmontar
    return () => {
      console.log('[UploadModalAtomic] Limpando timeouts e intervalos');
      clearTimeout(initialDelay);
    };
  }, [processing, reportId, uploadId, onSuccess, onClose, setLocation, utils]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    console.log('[UploadModalAtomic] ========== INÍCIO DO UPLOAD ==========');
    
    if (!file) {
      console.error('[UploadModalAtomic] ERRO: Nenhum arquivo selecionado');
      toast.error("Selecione um arquivo");
      return;
    }

    console.log('[UploadModalAtomic] Arquivo:', file.name, `(${file.size} bytes)`);

    // Validar se o arquivo existe e não está vazio
    if (file.size === 0) {
      console.error('[UploadModalAtomic] ERRO: Arquivo vazio');
      toast.error("Arquivo vazio", {
        description: "O arquivo selecionado está vazio. Selecione um arquivo válido.",
      });
      return;
    }

    // Validar tamanho do arquivo (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error('[UploadModalAtomic] ERRO: Arquivo muito grande:', file.size);
      toast.error("Arquivo muito grande", {
        description: `Tamanho máximo: 50MB. Seu arquivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      });
      return;
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/zip',
      'application/x-zip-compressed',
    ];
    
    // Validar por extensão e MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'docx', 'xlsx', 'csv', 'zip'];
    
    if (!validExtensions.includes(fileExtension || '')) {
      console.error('[UploadModalAtomic] ERRO: Extensão inválida:', fileExtension);
      toast.error("Extensão de arquivo não suportada", {
        description: `Extensão "${fileExtension}" não é aceita. Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP`,
      });
      return;
    }
    
    if (file.type && !allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|xlsx|csv|zip)$/i)) {
      console.error('[UploadModalAtomic] ERRO: MIME type inválido:', file.type);
      toast.error("Tipo de arquivo não suportado", {
        description: "Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP",
      });
      return;
    }

    console.log('[UploadModalAtomic] ✅ Validações passaram');

    try {
      setUploading(true);
      console.log('[UploadModalAtomic] Estado uploading=true');

      toast.loading("Enviando arquivo...", { id: 'upload-process' });

      // Converter arquivo para base64
      console.log('[UploadModalAtomic] Convertendo para base64...');
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
            
            console.log('[UploadModalAtomic] ✅ Conversão para base64 concluída');
            resolve(base64);
          } catch (error) {
            reject(new Error(`Erro ao processar arquivo: ${error}`));
          }
        };
        
        reader.onerror = () => {
          const errorMsg = reader.error?.message || 'desconhecido';
          reject(new Error(`Erro ao ler arquivo: ${errorMsg}`));
        };
        
        reader.readAsDataURL(file);
      });
      
      console.log('[UploadModalAtomic] Base64 size:', fileData.length, 'chars');

      // CORREÇÃO: Aguardar a Promise do mutateAsync()
      console.log('[UploadModalAtomic] Chamando uploadAndProcess.mutateAsync...');
      const result = await uploadAndProcess.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileData,
      });

      console.log('[UploadModalAtomic] ✅ Upload concluído!');
      console.log('[UploadModalAtomic] Result:', { uploadId: result.uploadId, reportId: result.reportId });
      
      // Atualizar estados
      setReportId(result.reportId);
      setUploadId(result.uploadId);
      setUploading(false);
      
      // NOVO: Ativar estado de processamento
      setProcessing(true);

      toast.dismiss('upload-process');
      toast.info("Processando relatório...", {
        description: "Aguarde enquanto analisamos o documento.",
        duration: Infinity, // Não fecha automaticamente
        id: 'processing-toast',
      });

    } catch (error: any) {
      console.error('[UploadModalAtomic] ❌ Erro:', error);
      
      toast.dismiss('upload-process');
      
      // Mensagens de erro mais específicas
      let errorMessage = "Erro no upload";
      let errorDescription = "Tente novamente ou entre em contato com o suporte";
      
      if (error.message?.includes("ler arquivo")) {
        errorMessage = "Erro ao ler arquivo";
        errorDescription = "O arquivo pode estar corrompido ou em uso.";
      } else if (error.message?.includes("Tipo de arquivo")) {
        errorMessage = "Tipo de arquivo não suportado";
        errorDescription = error.message;
      } else if (error.message?.includes("muito grande")) {
        errorMessage = "Arquivo muito grande";
        errorDescription = error.message;
      } else if (error.message) {
        errorMessage = "Erro no upload";
        errorDescription = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 7000,
      });
      
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (!uploading && !processing) {
      setFile(null);
      setReportId(null);
      setUploadId(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload de Relatório Externo (V2)</DialogTitle>
          <DialogDescription>
            Faça upload de relatórios em PDF, DOCX, XLSX, CSV ou ZIP para análise automática
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* NOVO: Indicador de processamento */}
          {processing && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Processando relatório...
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Aguarde enquanto analisamos o documento. Isso pode levar alguns minutos.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Área de drop */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${uploading || processing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
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
                      disabled={uploading || processing}
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
                  {!uploading && !processing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFile(null)}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Informações sobre o processo */}
          {!processing && (
            <Card className="p-4 bg-muted/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Upload V2 - Melhorias:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Upload atômico em uma única requisição</li>
                    <li>Processamento assíncrono mais rápido</li>
                    <li>Menos pontos de falha</li>
                    <li>Melhor tratamento de erros</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}

          {/* Estimativa de tempo */}
          {file && !processing && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>Tempo estimado: 5-10 minutos</span>
              </div>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading || processing}
            >
              {processing ? "Processando..." : "Cancelar"}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || processing}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                "Iniciar Upload"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
