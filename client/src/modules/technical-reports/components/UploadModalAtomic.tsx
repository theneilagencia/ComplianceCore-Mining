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
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: { uploadId: string; reportId: string }) => void;
}

/**
 * UploadModalAtomic - Upload Modal V2 (Radix UI Safe)
 * 
 * DESIGN PRINCIPLES:
 * 1. Controlled by parent via isOpen/onClose props
 * 2. No internal state conflicts with Dialog open state
 * 3. Clean close then callback then navigate flow
 * 4. No useEffect polling or intervals
 * 5. Radix Dialog fully respects onOpenChange
 * 
 * FLOW:
 * 1. User selects file
 * 2. Click Iniciar Upload
 * 3. Upload completes then onClose (modal closes)
 * 4. After 150ms then onSuccess(result) then parent navigates
 * 5. Modal unmounts cleanly from DOM
 */
export default function UploadModalAtomic({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const utils = trpc.useUtils();

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

  // Handle Dialog onOpenChange (from Radix)
  const handleDialogOpenChange = (open: boolean) => {
    if (import.meta.env.DEV) {
      console.log('[UploadModalAtomic] Dialog onOpenChange:', open);
    }
    // Only allow closing when not uploading
    if (!uploading && !open) {
      if (import.meta.env.DEV) {
        console.log('[UploadModalAtomic] Closing modal via onOpenChange');
      }
      setFile(null);
      onClose();
    }
  };

  // Handle Cancel button click
  const handleCancelClick = () => {
    if (!uploading) {
      if (import.meta.env.DEV) {
        console.log('[UploadModalAtomic] Cancel button clicked');
      }
      setFile(null);
      onClose();
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Nenhum arquivo selecionado");
      return;
    }

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
      setUploading(true);
      toast.loading("Enviando arquivo...", { id: 'upload-process' });

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

      const result = await uploadAndProcess.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileData,
      });

      // Dismiss loading toast
      toast.dismiss('upload-process');
      
      // Show success toast
      toast.success("Upload concluído!", {
        description: "Abrindo relatório...",
        duration: 2000,
      });

      // Reset component state
      setUploading(false);
      setFile(null);
      
      // Invalidate queries to refresh lists
      utils.technicalReports.generate.list.invalidate();
      utils.technicalReports.uploads.list.invalidate();
      
      // CRITICAL: Close modal first (this updates parent state)
      onClose();
      
      // CRITICAL: Wait for Dialog to unmount before navigation
      // This prevents race conditions with the closing animation
      if (onSuccess) {
        setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log('[UploadModalAtomic] Calling onSuccess with reportId:', result.reportId);
          }
          onSuccess({ uploadId: result.uploadId, reportId: result.reportId });
        }, 400);
      }

    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('[UploadModalAtomic] Upload error:', error);
      }
      
      toast.dismiss('upload-process');
      
      const errorMessage = error.message?.includes("ler arquivo")
        ? "Erro ao ler arquivo"
        : error.message?.includes("Tipo de arquivo")
        ? "Tipo de arquivo não suportado"
        : "Erro no upload";
      
      toast.error(errorMessage, {
        description: error.message || "Tente novamente",
        duration: 7000,
      });
      
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload de Relatório Externo (V2)</DialogTitle>
          <DialogDescription>
            Faça upload de relatórios em PDF, DOCX, XLSX, CSV ou ZIP para análise automática
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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

          {file && (
            <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <CheckCircle className="h-4 w-4" />
                <span>Tempo estimado: 5-10 minutos</span>
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleCancelClick}
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
