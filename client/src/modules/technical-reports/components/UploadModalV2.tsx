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

interface UploadModalV2Props {
  open: boolean;
  onClose: () => void;
}

export default function UploadModalV2({ open, onClose }: UploadModalV2Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

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

  const handleUpload = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    try {
      setUploading(true);

      // Converter arquivo para base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      toast.info("Enviando e processando arquivo...", {
        description: file.name,
      });

      // Chamada única ao backend
      const result = await uploadAndProcess.mutateAsync({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || "application/pdf",
        fileData,
      });

      setUploading(false);
      setReportId(result.reportId);

      // Invalidar queries
      utils.technicalReports.generate.list.invalidate();
      utils.technicalReports.uploads.list.invalidate();

      toast.success("Processamento iniciado!", {
        description: `O relatório ${file.name} está sendo analisado. Você será notificado quando estiver pronto.`,
      });

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
        setFile(null);
        setReportId(null);
      }, 2000);
    } catch (error: any) {
      setUploading(false);
      toast.error("Erro no upload", {
        description: error.message || "Tente novamente",
      });
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Relatório Externo (V2)</DialogTitle>
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
                id="file-upload-v2"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.csv,.zip"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload-v2" className="cursor-pointer">
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
                {!uploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#2f2c79] h-2 rounded-full transition-all duration-300 animate-pulse"
                        style={{ width: "75%" }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">Processando...</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Enviando e analisando arquivo...
                  </p>
                </div>
              )}

              {reportId && !uploading && (
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
                <p className="font-medium mb-1">Upload V2 - Melhorias:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Upload atômico em uma única requisição</li>
                  <li>Processamento assíncrono mais rápido</li>
                  <li>Menos pontos de falha</li>
                  <li>Melhor tratamento de erros</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
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
              {uploading ? "Processando..." : "Iniciar Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
