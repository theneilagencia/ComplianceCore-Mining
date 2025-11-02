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

export default function UploadModal({ open, onClose }: UploadModalProps) {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const initiateUpload = trpc.technicalReports.uploads.initiate.useMutation();
  const uploadFile = trpc.technicalReports.uploads.uploadFile.useMutation();
  const completeUpload = trpc.technicalReports.uploads.complete.useMutation();

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
      console.log('[Upload] Starting upload process');
      console.log('[Upload] File:', file.name, file.size, file.type);

      // Passo 1: Iniciar upload
      toast.loading("Iniciando upload...", { id: 'upload-process' });
      
      const initResult = await initiateUpload.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
      });

      setUploadId(initResult.uploadId);
      setReportId(initResult.reportId);
      
      console.log('[Upload] Upload initiated:', initResult);

      toast.loading("Enviando arquivo...", { id: 'upload-process' });

      // Passo 2: Converter arquivo para base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
        reader.readAsDataURL(file);
      });
      
      console.log('[Upload] File converted to base64, size:', fileData.length);

      // Passo 3: Upload real para storage
      const uploadResult = await uploadFile.mutateAsync({
        uploadId: initResult.uploadId,
        fileData,
        fileName: file.name,
        contentType: file.type || "application/pdf",
      });

      console.log('[Upload] File uploaded:', uploadResult);
      
      const s3Url = uploadResult.s3Url;
      const s3Key = uploadResult.s3Key;

      // Passo 4: Completar upload e iniciar parsing
      setParsing(true);
      setUploading(false);

      toast.loading("Analisando conteúdo...", { id: 'upload-process' });

      const completeResult = await completeUpload.mutateAsync({
        uploadId: initResult.uploadId,
        s3Url: s3Url,
        s3Key: s3Key, // Adicionar s3Key
        fileContent: undefined, // Backend vai processar
      });

      setParsing(false);
      
      console.log('[Upload] Upload completed:', completeResult);

      // Invalidar queries
      utils.technicalReports.generate.list.invalidate();
      utils.technicalReports.uploads.list.invalidate();

      // Exibir resultado
      toast.dismiss('upload-process');
      
      if (completeResult.status === "needs_review") {
        toast.warning("Revisão necessária", {
          description: `${completeResult.summary.uncertainFields} campos precisam de validação`,
          duration: 5000,
          action: {
            label: "Revisar agora",
            onClick: () => {
              onClose();
              setLocation(`/reports/${completeResult.reportId}/review`);
            },
          },
        });
      } else {
        toast.success("Relatório processado com sucesso!", {
          description: `Padrão detectado: ${completeResult.summary.detectedStandard}`,
          duration: 3000,
        });
      }

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
        setFile(null);
        setUploadId(null);
        setReportId(null);
      }, 2000);
    } catch (error: any) {
      console.error('[Upload] Error:', error);
      
      setUploading(false);
      setParsing(false);
      
      toast.dismiss('upload-process');
      toast.error("Erro no upload", {
        description: error.message || "Tente novamente ou entre em contato com o suporte",
        duration: 5000,
      });
    }
  };

  const handleClose = () => {
    if (!uploading && !parsing) {
      setFile(null);
      setUploadId(null);
      setReportId(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Relatório Externo</DialogTitle>
          <DialogDescription>
            Faça upload de relatórios em PDF, DOCX, XLSX, CSV ou ZIP para análise automática
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!file ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.csv,.zip"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos aceitos: PDF, DOCX, XLSX, CSV, ZIP
                </p>
                <p className="text-xs text-gray-400 mt-2">Tamanho máximo: 50MB</p>
              </label>
            </div>
          ) : (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && !parsing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {(uploading || parsing) && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#2f2c79] h-2 rounded-full transition-all duration-300"
                        style={{
                          width: uploading ? "50%" : parsing ? "75%" : "100%",
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">
                      {uploading ? "50%" : parsing ? "75%" : "100%"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {uploading
                      ? "Enviando arquivo..."
                      : parsing
                      ? "Analisando conteúdo..."
                      : "Concluído"}
                  </p>
                </div>
              )}

              {reportId && !uploading && !parsing && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">
                        Upload concluído
                      </p>
                      <p className="text-xs text-green-700">ID: {reportId}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">O que acontece após o upload:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Detecção automática do padrão (JORC, NI 43-101, etc.)</li>
                  <li>Extração de seções, recursos e pessoas competentes</li>
                  <li>Campos incertos serão marcados para revisão humana</li>
                  <li>Você será notificado quando a análise estiver completa</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading || parsing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading || parsing}
            >
              {uploading ? "Enviando..." : parsing ? "Analisando..." : "Iniciar Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

