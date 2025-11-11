import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

// Get API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ValidationResult {
  valid: boolean;
  score: number;
  standard: string;
  criteria: {
    name: string;
    met: boolean;
    details: string;
  }[];
  recommendations: string[];
  summary: string;
}

interface DocumentUploadValidatorProps {
  onValidationComplete?: (result: ValidationResult) => void;
}

export default function DocumentUploadValidator({ onValidationComplete }: DocumentUploadValidatorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Tipo de arquivo inválido', {
          description: 'Apenas PDF, XLSX, XLS e CSV são aceitos'
        });
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande', {
          description: 'O tamanho máximo é 10MB'
        });
        return;
      }

      setFile(selectedFile);
      setValidationResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('document', file);

      // Create AbortController with 5 minute timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 minutes

      try {
        const response = await fetch(`${API_BASE_URL}/api/validate/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = await response.json();
          
          // Handle specific error types with better messages
          if (error.error && error.suggestion) {
            toast.error(error.error, {
              description: error.message,
              duration: 8000,
            });
            
            // Show suggestion in a separate toast
            setTimeout(() => {
              toast.info('Sugestão', {
                description: error.suggestion,
                duration: 10000,
              });
            }, 500);
            
            setUploading(false);
            return;
          }
          
          throw new Error(error.message || 'Erro ao validar documento');
        }

        const backendResult = await response.json();
        
        // Transform backend response to frontend format
        const result: ValidationResult = {
          valid: backendResult.compliance.score >= 70,
          score: backendResult.compliance.score,
          standard: backendResult.standard,
          criteria: backendResult.results.map((r: any) => ({
            name: r.criterion,
            met: r.found,
            details: `${r.section} - Score: ${r.score}% (${r.matchedKeywords.length} palavras-chave encontradas)`
          })),
          recommendations: backendResult.recommendations,
          summary: `Documento ${backendResult.compliance.level} - ${backendResult.statistics.requiredFound} de ${backendResult.statistics.required} critérios obrigatórios atendidos.`
        };
        
        setValidationResult(result);
        
        toast.success('Validação concluída!', {
          description: `Score: ${result.score}% - ${result.criteria.length} critérios verificados`
        });

        if (onValidationComplete) {
          onValidationComplete(result);
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Upload cancelado: tempo limite excedido (5 minutos)');
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao validar documento', {
        description: error.message || 'Tente novamente mais tarde'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setValidationResult(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!file ? (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">Arraste um arquivo ou clique para selecionar</p>
            <p className="text-sm text-gray-400">
              Formatos aceitos: PDF, XLSX, XLS, CSV (máx. 10MB)
            </p>
          </label>
        </div>
      ) : (
        <div className="border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              disabled={uploading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!validationResult && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Validar
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Validation Result */}
      {validationResult && (
        <div className={`border rounded-lg p-6 ${getScoreBgColor(validationResult.score)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {validationResult.valid ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold">
                  {validationResult.valid ? 'Documento Válido' : 'Atenção Necessária'}
                </h3>
                <p className="text-sm text-gray-600">{validationResult.summary}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(validationResult.score)}`}>
                {validationResult.score}%
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Padrão Detectado</h4>
              <p className="text-sm text-gray-600">{validationResult.standard}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Critérios Verificados</h4>
              <div className="space-y-2">
                {validationResult.criteria.map((criterion, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    {criterion.met ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{criterion.name}</p>
                      <p className="text-gray-600">{criterion.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {validationResult.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recomendações</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {validationResult.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

