import { useState } from "react";
import { trpc } from "../lib/trpc";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Database,
  Loader2,
} from "lucide-react";

interface OfficialSourcesValidationProps {
  reportId: string;
}

export function OfficialSourcesValidation({
  reportId,
}: OfficialSourcesValidationProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const validateMutation = trpc.audit.validateOfficial.useMutation({
    onSuccess: (data) => {
      setValidationResult(data);
      setIsValidating(false);
    },
    onError: (error) => {
      console.error("Validation error:", error);
      setIsValidating(false);
    },
  });

  const handleValidate = () => {
    setIsValidating(true);
    validateMutation.mutate({ reportId });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "invalid":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "bg-green-50 border-green-200 text-green-900";
      case "invalid":
        return "bg-red-50 border-red-200 text-red-900";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const getSourceIcon = (source: string) => {
    return <Database className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-6 h-6 text-qivo-primary" />
              Validação com Fontes Oficiais
            </h2>
            <p className="text-gray-600">
              Valide dados do relatório com ANM, CPRM e IBAMA
            </p>
          </div>
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className="px-6 py-3 bg-qivo-primary text-white rounded-lg hover:bg-qivo-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Validar Agora
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumo da Validação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">
                  Total de Verificações
                </div>
                <div className="text-3xl font-bold text-blue-900">
                  {validationResult.summary?.totalChecks || 0}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">
                  Válidas
                </div>
                <div className="text-3xl font-bold text-green-900">
                  {validationResult.summary?.validCount || 0}
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                <div className="text-sm text-yellow-600 font-medium mb-1">
                  Avisos
                </div>
                <div className="text-3xl font-bold text-yellow-900">
                  {validationResult.summary?.warningCount || 0}
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                <div className="text-sm text-red-600 font-medium mb-1">
                  Inválidas
                </div>
                <div className="text-3xl font-bold text-red-900">
                  {validationResult.summary?.invalidCount || 0}
                </div>
              </div>
            </div>
          </div>

          {/* ANM Validation */}
          {validationResult.anm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  ANM - Agência Nacional de Mineração
                </h3>
              </div>

              <div className="space-y-3">
                {validationResult.anm.checks?.map((check: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${getStatusColor(
                      check.status
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-medium">{check.field}</div>
                        <div className="text-sm mt-1">{check.message}</div>
                        {check.details && (
                          <div className="text-xs mt-2 opacity-75">
                            {check.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {validationResult.anm.sourceUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={validationResult.anm.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Ver fonte oficial
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* CPRM Validation */}
          {validationResult.cprm && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  CPRM - Serviço Geológico do Brasil
                </h3>
              </div>

              <div className="space-y-3">
                {validationResult.cprm.checks?.map((check: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${getStatusColor(
                      check.status
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-medium">{check.field}</div>
                        <div className="text-sm mt-1">{check.message}</div>
                        {check.details && (
                          <div className="text-xs mt-2 opacity-75">
                            {check.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {validationResult.cprm.sourceUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={validationResult.cprm.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    Ver fonte oficial
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* IBAMA Validation */}
          {validationResult.ibama && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  IBAMA - Instituto Brasileiro do Meio Ambiente
                </h3>
              </div>

              <div className="space-y-3">
                {validationResult.ibama.checks?.map((check: any, idx: number) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${getStatusColor(
                      check.status
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(check.status)}
                      <div className="flex-1">
                        <div className="font-medium">{check.field}</div>
                        <div className="text-sm mt-1">{check.message}</div>
                        {check.details && (
                          <div className="text-xs mt-2 opacity-75">
                            {check.details}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {validationResult.ibama.sourceUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a
                    href={validationResult.ibama.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                  >
                    Ver fonte oficial
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {validationResult.recommendations &&
            validationResult.recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recomendações
                </h3>
                <div className="space-y-2">
                  {validationResult.recommendations.map(
                    (rec: string, idx: number) => (
                      <div
                        key={idx}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-900"
                      >
                        {rec}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Empty State */}
      {!validationResult && !isValidating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">
            Nenhuma validação realizada ainda
          </p>
          <p className="text-sm text-gray-500">
            Clique em "Validar Agora" para verificar os dados do relatório com
            fontes oficiais brasileiras
          </p>
        </div>
      )}
    </div>
  );
}

