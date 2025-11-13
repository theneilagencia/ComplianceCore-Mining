/**
 * Modal de Upload Dedicado para Auditoria KRCI
 * 
 * Fluxo simplificado:
 * 1. Usuário seleciona PDF
 * 2. Upload para S3
 * 3. Parsing automático
 * 4. Callback com reportId
 * 5. Componente pai executa auditoria
 * 
 * SEM redirecionamentos, SEM navegação
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Upload, FileText, Loader2, CheckCircle } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface AuditUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (reportId: string) => void;
}

export default function AuditUploadModal({ isOpen, onClose, onUploadComplete }: AuditUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        toast.error("Tipo de arquivo inválido", {
          description: "Por favor, selecione um arquivo PDF",
        });
        return;
      }
      setFile(selectedFile);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);

    try {
      console.log("[AuditUploadModal] Starting upload...");
      
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
        
        reader.onerror = () => {
          reject(new Error(`Erro ao ler arquivo: ${reader.error?.message || 'desconhecido'}`));
        };
        
        reader.readAsDataURL(file);
      });
      
      const result = await uploadMutation.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileData,
      });

      console.log("[AuditUploadModal] Upload completed:", result.reportId);

      toast.success("Upload concluído!", {
        description: "Iniciando auditoria...",
        duration: 2000,
      });

      // Fechar modal
      setFile(null);
      setUploading(false);
      onClose();

      // Callback para o componente pai executar auditoria
      setTimeout(() => {
        onUploadComplete(result.reportId);
      }, 300);

    } catch (error: any) {
      console.error("[AuditUploadModal] Upload failed:", error);
      
      setUploading(false);
      
      toast.error("Erro no upload", {
        description: error.message || "Tente novamente",
        duration: 5000,
      });
    }
  }, [file, uploadMutation, onClose, onUploadComplete]);

  const handleClose = useCallback(() => {
    if (!uploading) {
      setFile(null);
      onClose();
    }
  }, [uploading, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Relatório para Auditoria</DialogTitle>
          <DialogDescription>
            Selecione um arquivo PDF para análise de conformidade KRCI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-700 font-medium">
                  Selecione um arquivo PDF
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Apenas arquivos PDF são aceitos
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {uploading && (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                )}
                {!uploading && (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
            </div>
          )}

          {uploading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Processando...
                  </p>
                  <p className="text-xs text-blue-700">
                    Fazendo upload e análise do documento
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
