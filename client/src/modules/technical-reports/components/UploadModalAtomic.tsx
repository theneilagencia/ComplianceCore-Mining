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

  const utils = trpc.useUtils();

  // Reset estados quando o modal abre
  useEffect(() => {
    if (open) {
      console.log('[UploadModalAtomic] Modal aberto - resetando estados');
      setFile(null);
      setUploading(false);
    }
  }, [open]);

  // Usar o endpoint atômico V2
  const uploadAndProcess = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();

  // REMOVIDO: Polling complexo - Agora redirecionamento é imediato após upload

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
      
      toast.dismiss('upload-process');
      toast.success("Upload concluído!", {
        description: "Redirecionando para visualização...",
        duration: 2000,
      });

      // SIMPLIFICADO: Fechar modal imediatamente e chamar onSuccess
      setUploading(false);
      
      // Fechar modal
      console.log('[UploadModalAtomic] Fechando modal após upload');
      onClose();
      
      // Chamar onSuccess se disponível
      if (onSuccess) {
        console.log('[UploadModalAtomic] Chamando onSuccess com reportId:', result.reportId);
        setTimeout(() => {
          onSuccess({ uploadId: result.uploadId, reportId: result.reportId });
        }, 100);
      } else {
        // Fallback: redirecionar para lista
        console.log('[UploadModalAtomic] Sem callback, redirecionando para lista');
        setTimeout(() => {
          setLocation(`/reports/generate`);
        }, 100);
      }

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
    }
  };

  const handleClose = () => {
    if (!uploading) {
      console.log('[UploadModalAtomic] Fechando modal e limpando estados');
      setFile(null);
      setUploading(false);
      toast.dismiss('processing-toast');
      toast.dismiss('upload-process');
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

          {/* Área de drop */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
              transition-colors duration-200
              ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
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
                      disabled={uploading}
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
                  {!uploading && (
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

          {/* Estimativa de tempo */}
          {file && (
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
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
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
