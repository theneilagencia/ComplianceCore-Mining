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
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
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
 */
export default function UploadModalAtomic({ open, onClose }: UploadModalProps) {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Usar o endpoint atômico V2
  const uploadAndProcess = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();

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
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    // Validar se o arquivo existe e não está vazio
    if (file.size === 0) {
      toast.error("Arquivo vazio", {
        description: "O arquivo selecionado está vazio. Selecione um arquivo válido.",
      });
      return;
    }

    // Validar tamanho do arquivo (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
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
      toast.error("Extensão de arquivo não suportada", {
        description: `Extensão "${fileExtension}" não é aceita. Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP`,
      });
      return;
    }
    
    if (file.type && !allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|xlsx|csv|zip)$/i)) {
      toast.error("Tipo de arquivo não suportado", {
        description: "Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP",
      });
      return;
    }

    try {
      setUploading(true);
      console.log('[Upload Atomic] Starting atomic upload');
      console.log('[Upload Atomic] File:', file.name, file.size, file.type);

      toast.loading("Enviando arquivo...", { id: 'upload-process' });

      // Converter arquivo para base64
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
        reader.onerror = (error) => {
          console.error('[Upload Atomic] FileReader error:', error);
          reject(new Error(`Erro ao ler arquivo: ${file.name}. Verifique se o arquivo não está corrompido.`));
        };
        reader.onabort = () => {
          reject(new Error("Leitura do arquivo foi cancelada"));
        };
        reader.readAsDataURL(file);
      });
      
      console.log('[Upload Atomic] File converted to base64, size:', fileData.length);

      // ÚNICA CHAMADA: Upload + Storage + Banco (Parsing é assíncrono)
      const result = await uploadAndProcess.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileData,
      });

      console.log('[Upload Atomic] Upload completed:', result);
      setReportId(result.reportId);

      // Invalidar queries
      utils.technicalReports.generate.list.invalidate();
      utils.technicalReports.uploads.list.invalidate();

      // Exibir resultado
      toast.dismiss('upload-process');
      
      toast.success("Upload concluído com sucesso!", {
        description: "Seu relatório está sendo processado em segundo plano. Você será notificado quando estiver pronto.",
        duration: 5000,
      });

      // Fechar modal e redirecionar para lista de relatórios
      setTimeout(() => {
        onClose();
        setLocation(`/reports/generate`); // Redireciona para lista
      }, 2000);

    } catch (error: any) {
      console.error('[Upload Atomic] Error:', error);
      console.error('[Upload Atomic] Error stack:', error?.stack);
      console.error('[Upload Atomic] File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      
      toast.dismiss('upload-process');
      
      // Mensagens de erro mais específicas
      let errorMessage = "Erro desconhecido";
      let errorDescription = "Tente novamente ou entre em contato com o suporte";
      
      if (error.message?.includes("ler arquivo")) {
        errorMessage = "Erro ao ler arquivo";
        errorDescription = "O arquivo pode estar corrompido ou em uso por outro programa. Feche o arquivo e tente novamente.";
      } else if (error.message?.includes("Tipo de arquivo")) {
        errorMessage = "Tipo de arquivo não suportado";
        errorDescription = error.message;
      } else if (error.message?.includes("muito grande")) {
        errorMessage = "Arquivo muito grande";
        errorDescription = error.message;
      } else if (error.message?.includes("Database")) {
        errorMessage = "Erro de banco de dados";
        errorDescription = "Houve um problema ao salvar o relatório. Tente novamente.";
      } else if (error.message) {
        errorMessage = "Erro no upload";
        errorDescription = error.message;
      }
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 7000,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFile(null);
      setReportId(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload de Relatório Externo</DialogTitle>
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
                <p className="font-medium">O que acontece após o upload:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Detecção automática do padrão (JORC, NI 43-101, etc.)</li>
                  <li>Extração de seções, recursos e pessoas competentes</li>
                  <li>Campos incertos serão marcados para revisão humana</li>
                  <li>Você será notificado quando a análise estiver completa</li>
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
              {uploading ? "Enviando..." : "Iniciar Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

