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
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
        reader.readAsDataURL(file);
      });
      
      console.log('[Upload Atomic] File converted to base64, size:', fileData.length);

      // ÚNICA CHAMADA: Upload + Storage + Banco + Parsing
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
      
      if (result.status === "needs_review") {
        toast.warning("Revisão necessária", {
          description: `${result.summary.uncertainFields} campos precisam de validação`,
          duration: 5000,
          action: {
            label: "Revisar agora",
            onClick: () => {
              onClose();
              setLocation(`/reports/${result.reportId}/review`);
            },
          },
        });
      } else {
        toast.success("Relatório processado com sucesso!", {
          description: `Padrão detectado: ${result.summary.detectedStandard}`,
          duration: 3000,
        });
      }

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
        setLocation(`/reports/${result.reportId}`);
      }, 2000);

    } catch (error: any) {
      console.error('[Upload Atomic] Error:', error);
      toast.dismiss('upload-process');
      toast.error("Erro no upload", {
        description: error.message || "Erro desconhecido",
        duration: 5000,
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

