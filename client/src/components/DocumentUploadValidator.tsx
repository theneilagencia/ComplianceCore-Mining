import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

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

      const response = await fetch('/api/validate/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao validar documento');
      }

      const result: ValidationResult = await response.json();
      setValidationResult(result);
      
      toast.success('Validação concluída!', {
        description: `Score: ${result.score}% - ${result.criteria.length} critérios verificados`
      });

      if (onValidationComplete) {
        onValidationComplete(result);
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
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
        {!file ? (
          <div>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Faça upload do documento para validação
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Formatos aceitos: PDF, XLSX, XLS, CSV (máx. 10MB)
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Selecionar Arquivo
              </span>
            </label>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!validationResult && (
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Validar
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleRemoveFile}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Validation Result */}
      {validationResult && (
        <div className="space-y-4">
          {/* Score Summary */}
          <div className={`border-2 rounded-lg p-6 ${getScoreBgColor(validationResult.score)}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Resultado da Validação
                </h3>
                <p className="text-sm text-gray-600">
                  Padrão: {validationResult.standard}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-4xl font-bold ${getScoreColor(validationResult.score)}`}>
                  {validationResult.score}%
                </div>
                <p className="text-sm text-gray-600">
                  {validationResult.valid ? 'Conforme' : 'Não Conforme'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700">{validationResult.summary}</p>
            </div>
          </div>

          {/* Criteria Details */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h4 className="font-semibold text-gray-900">
                Critérios Verificados ({validationResult.criteria.length})
              </h4>
            </div>
            <div className="divide-y">
              {validationResult.criteria.map((criterion, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    {criterion.met ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{criterion.name}</p>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            criterion.met
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {criterion.met ? 'Atende' : 'Não Atende'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{criterion.details}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          {validationResult.recommendations.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
                <h4 className="font-semibold text-blue-900">
                  Recomendações ({validationResult.recommendations.length})
                </h4>
              </div>
              <div className="divide-y">
                {validationResult.recommendations.map((recommendation, index) => (
                  <div key={index} className="px-6 py-3 bg-white">
                    <p className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

