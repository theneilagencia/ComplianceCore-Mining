import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { Download, FileText, FileSpreadsheet, FileCode, Loader2, CheckCircle2, Clock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface Report {
  id: string;
  title: string;
  standard: string;
  status: string;
}

interface Export {
  id: string;
  fromStandard: string;
  toStandard: string;
  format: string;
  createdAt: string;
  s3Url: string;
  status: 'completed' | 'processing' | 'failed';
}

// Utility: Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.error(`Tentativa ${i + 1}/${maxRetries} falhou:`, error);
      
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Todas as tentativas falharam');
}

// Utility: Clear cache
function clearExportCache() {
  try {
    // Clear localStorage cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('export') || key.includes('trpc')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage cache
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('export') || key.includes('trpc')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('✅ Cache limpo com sucesso');
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
}

export default function ExportStandards() {
  const { apiFetch } = useApi();
  const [selectedReportId, setSelectedReportId] = useState('');
  const [toStandard, setToStandard] = useState<'JORC_2012' | 'NI_43_101' | 'PERC' | 'SAMREC' | 'CBRR'>('JORC_2012');
  const [format, setFormat] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');
  
  const [reports, setReports] = useState<Report[]>([]);
  const [exports, setExports] = useState<Export[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingExports, setLoadingExports] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadReports();
    loadExports();
  }, []);

  const loadReports = async () => {
    try {
      setLoadingReports(true);
      setError('');
      
      const response = await retryWithBackoff(async () => {
        return await apiFetch('/api/technical-reports/list');
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar relatórios');
      }
      
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      console.error('Erro ao carregar relatórios:', err);
      setError('Não foi possível carregar a lista de relatórios. Tente novamente.');
      toast.error('Erro ao carregar relatórios', {
        description: 'Clique em "Tentar Novamente" para recarregar',
      });
    } finally {
      setLoadingReports(false);
    }
  };

  const loadExports = async () => {
    try {
      setLoadingExports(true);
      
      const response = await retryWithBackoff(async () => {
        return await apiFetch('/api/technical-reports/exports/list');
      });
      
      if (!response.ok) {
        throw new Error('Erro ao carregar exportações');
      }
      
      const data = await response.json();
      setExports(data.exports || []);
    } catch (err: any) {
      console.error('Erro ao carregar exportações:', err);
      // Não mostrar erro para exports, apenas log
    } finally {
      setLoadingExports(false);
    }
  };

  const handleExport = async () => {
    if (!selectedReportId) {
      toast.error('Selecione um relatório', {
        description: 'Você precisa selecionar um relatório antes de exportar',
      });
      return;
    }

    try {
      setExporting(true);
      setExportProgress(0);
      setError('');
      setRetryCount(0);

      // Simular progresso
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await retryWithBackoff(async () => {
        setRetryCount(prev => prev + 1);
        return await apiFetch('/api/technical-reports/exports/run', {
          method: 'POST',
          body: JSON.stringify({
            reportId: selectedReportId,
            toStandard,
            format,
          }),
        });
      }, 3, 2000);

      clearInterval(progressInterval);
      setExportProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao exportar relatório');
      }

      const data = await response.json();
      
      toast.success('Exportação concluída com sucesso!', {
        description: 'O arquivo está pronto para download',
      });
      
      // Recarregar lista de exportações
      await loadExports();
      
      // Limpar seleção
      setSelectedReportId('');
      setExportProgress(0);
      
    } catch (err: any) {
      console.error('Erro ao exportar:', err);
      
      // Mensagens de erro amigáveis
      let errorMessage = 'Não foi possível exportar o relatório';
      let errorDescription = '';
      
      if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Erro de conexão';
        errorDescription = 'Verifique sua conexão com a internet e tente novamente';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Tempo esgotado';
        errorDescription = 'O servidor demorou muito para responder. Tente novamente';
      } else if (err.message.includes('401') || err.message.includes('unauthorized')) {
        errorMessage = 'Sessão expirada';
        errorDescription = 'Faça login novamente para continuar';
      } else if (err.message.includes('500')) {
        errorMessage = 'Erro no servidor';
        errorDescription = 'Ocorreu um erro interno. Nossa equipe foi notificada';
      } else {
        errorDescription = err.message || 'Tente novamente ou entre em contato com o suporte';
      }
      
      setError(`${errorMessage}: ${errorDescription}`);
      
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
      
      // Limpar cache em caso de erro
      clearExportCache();
      
    } finally {
      setExporting(false);
    }
  };

  const handleRetry = () => {
    clearExportCache();
    setError('');
    loadReports();
    loadExports();
  };

  const standards = [
    { id: 'JORC_2012', name: 'JORC 2012', description: 'Australasian Code', icon: '🇦🇺' },
    { id: 'NI_43_101', name: 'NI 43-101', description: 'Canadian Standard', icon: '🇨🇦' },
    { id: 'PERC', name: 'PERC', description: 'Pan-European Code', icon: '🇪🇺' },
    { id: 'SAMREC', name: 'SAMREC', description: 'South African Code', icon: '🇿🇦' },
    { id: 'CBRR', name: 'CBRR', description: 'Brazilian Standard', icon: '🇧🇷' },
  ];

  const formats = [
    { id: 'PDF', name: 'PDF', icon: FileText, color: 'text-red-600' },
    { id: 'DOCX', name: 'DOCX', icon: FileCode, color: 'text-blue-600' },
    { id: 'XLSX', name: 'XLSX', icon: FileSpreadsheet, color: 'text-green-600' },
  ];

  const getFormatIcon = (fmt: string) => {
    const format = formats.find(f => f.id === fmt);
    if (!format) return FileText;
    return format.icon;
  };

  const getFormatColor = (fmt: string) => {
    const format = formats.find(f => f.id === fmt);
    return format?.color || 'text-gray-600';
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exportar Padrões</h1>
          <p className="text-gray-600">Converta relatórios entre padrões internacionais em múltiplos formatos</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium mb-1">Erro ao processar solicitação</p>
              <p className="text-sm text-red-700">{error}</p>
              {retryCount > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Tentativas realizadas: {retryCount}/3
                </p>
              )}
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Standards Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {standards.map((std) => (
            <div
              key={std.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-3">{std.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{std.name}</h3>
              <p className="text-sm text-gray-600">{std.description}</p>
            </div>
          ))}
        </div>

        {/* Export Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ArrowRight className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nova Exportação</h2>
              <p className="text-sm text-gray-600">Selecione o relatório e configure a exportação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Report Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relatório de Origem
              </label>
              {loadingReports ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                </div>
              ) : (
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={exporting}
                >
                  <option value="">Selecione um relatório...</option>
                  {reports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.title} ({report.standard}) - {report.status}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Target Standard */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Padrão de Destino
              </label>
              <select
                value={toStandard}
                onChange={(e) => setToStandard(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={exporting}
              >
                {standards.map((std) => (
                  <option key={std.id} value={std.id}>
                    {std.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato de Exportação
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={exporting}
              >
                {formats.map((fmt) => (
                  <option key={fmt.id} value={fmt.id}>
                    {fmt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          {exporting && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progresso da exportação</span>
                <span className="text-sm text-gray-600">{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              {retryCount > 1 && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Tentativa {retryCount}/3 - Aguarde...
                </p>
              )}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              ⏱️ <strong>Tempo estimado:</strong> 30-60 segundos para geração do arquivo
            </p>
            <p className="text-xs text-amber-700 mt-1">
              💡 Em caso de erro, o sistema tentará automaticamente até 3 vezes
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || !selectedReportId || loadingReports}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {exporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exportando... ({exportProgress}%)
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Iniciar Exportação
              </>
            )}
          </button>
        </div>

        {/* Exports History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Exportações Recentes</h2>
            <button
              onClick={loadExports}
              disabled={loadingExports}
              className="px-3 py-1 text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <RefreshCw className={`w-4 h-4 ${loadingExports ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
          
          {loadingExports ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : exports && exports.length > 0 ? (
            <div className="space-y-3">
              {exports.map((exp) => {
                const FormatIcon = getFormatIcon(exp.format);
                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 bg-gray-100 rounded-lg ${getFormatColor(exp.format)}`}>
                        <FormatIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {exp.fromStandard} → {exp.toStandard}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(exp.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Concluído
                      </span>
                      <a
                        href={exp.s3Url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Baixar {exp.format}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma exportação realizada ainda</p>
              <p className="text-sm text-gray-500 mt-1">
                Selecione um relatório acima para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

