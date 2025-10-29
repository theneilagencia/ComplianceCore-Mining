import { TechnicalReportForm, ReportData } from '../components/TechnicalReportForm';
import { useLocation, useRoute } from 'wouter';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { toast } from 'sonner';

export default function ReportEdit() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/reports/:id/edit');
  const { apiFetch } = useApi();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<Partial<ReportData> | null>(null);
  const [error, setError] = useState('');

  const reportId = params?.id;

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiFetch(`/api/reports/${reportId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar relatório');
      }

      const report = await response.json();
      
      // Se os dados estão no campo 'data', extrair de lá
      const data = report.data || report;
      
      setReportData(data);
    } catch (err: any) {
      console.error('Erro ao carregar relatório:', err);
      setError(err.message || 'Erro ao carregar relatório');
      toast.error('Erro ao carregar relatório', {
        description: 'Não foi possível carregar os dados do relatório',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    toast.success('Relatório atualizado!', {
      description: 'As alterações foram salvas com sucesso',
    });
    setLocation('/reports');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto" />
          <p className="mt-6 text-lg font-medium text-gray-300">
            Carregando relatório...
          </p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Erro ao carregar relatório
          </h2>
          <p className="text-gray-400 mb-6">{error || 'Relatório não encontrado'}</p>
          <button
            onClick={() => setLocation('/reports')}
            className="px-6 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#b96e48] transition-colors"
          >
            Voltar para Relatórios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/5/5 shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/reports')}
              className="p-2 hover:bg-[#171a4a] rounded-lg transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Editar Relatório
              </h1>
              <p className="text-sm text-gray-400">
                ID: {reportId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="py-8">
        <TechnicalReportForm
          reportId={reportId}
          initialData={reportData}
          onSave={handleSave}
        />
      </div>
    </div>
  );
}

