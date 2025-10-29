import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';

interface Report {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function Reports() {
  const [, setLocation] = useLocation();
  const { apiFetch } = useApi();
  const { logout, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiFetch('/api/reports');
      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setError(err.message || 'Não foi possível carregar os relatórios. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const createNewReport = () => {
    setLocation('/reports/create');
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-[#171a4a] text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      published: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-[#171a4a] text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      in_progress: 'Em Progresso',
      completed: 'Concluído',
      published: 'Publicado',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-300">Carregando relatórios...</p>
          <p className="mt-2 text-sm text-gray-500">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/5 shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                JI
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Relatórios Técnicos</h1>
                <p className="text-sm text-gray-400">Gerencie seus relatórios JORC e NI 43-101</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLocation('/dashboard')}
                className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors border border-white/20 rounded-lg hover:bg-[#000020]"
              >
                Voltar ao Dashboard
              </button>
              <button
                onClick={() => {
                  logout();
                  setLocation('/login');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-medium">{error}</p>
              <button
                onClick={fetchReports}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">Meus Relatórios</h2>
            <p className="text-sm text-gray-400 mt-1">{reports.length} relatórios encontrados</p>
          </div>
          <button
            onClick={createNewReport}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
          >
            + Novo Relatório
          </button>
        </div>

        {/* Reports Grid */}
        {reports.length === 0 ? (
          <div className="bg-white/5 rounded-xl shadow-sm border border-white/20 p-12 text-center">
            <div className="w-16 h-16 bg-[#171a4a] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum relatório encontrado</h3>
            <p className="text-gray-400 mb-6">Comece criando seu primeiro relatório técnico</p>
            <button
              onClick={createNewReport}
              className="px-6 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#b96e48] transition-colors"
            >
              Criar Primeiro Relatório
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white/5 rounded-xl shadow-sm border border-white/20 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/reports/${report.id}/edit`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(report.status)}`}>
                    {getStatusLabel(report.status)}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{report.title}</h3>
                <p className="text-sm text-gray-400 mb-4">Tipo: {report.type}</p>
                <div className="text-xs text-gray-500">
                  <p>Criado: {new Date(report.createdAt).toLocaleDateString('pt-BR')}</p>
                  <p>Atualizado: {new Date(report.updatedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

