import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import DocumentUploadValidator from '@/components/DocumentUploadValidator';
import { Download, FileCheck, Loader2, CheckCircle2, Clock, AlertCircle, Award } from 'lucide-react';

export default function PreCertification() {
  const [selectedReportId, setSelectedReportId] = useState('');
  const [regulator, setRegulator] = useState<'ASX' | 'TSX' | 'JSE' | 'CRIRSCO'>('ASX');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'select' | 'upload'>('select');

  // Queries
  const reportsQuery = trpc.technicalReports.generate.list.useQuery();
  const certificationsQuery = trpc.technicalReports.precertification.list.useQuery({});

  // Mutations
  const submitMutation = trpc.technicalReports.precertification.submit.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Pré-certificação concluída! Score: ${data.score.toFixed(0)}%`);
      certificationsQuery.refetch();
      setSelectedReportId('');
      setNotes('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao solicitar pré-certificação');
    },
  });

  const handleSubmit = () => {
    if (!selectedReportId) {
      toast.error('Selecione um relatório');
      return;
    }

    submitMutation.mutate({
      reportId: selectedReportId,
      regulator,
      notes,
    });
  };

  const regulators = [
    { id: 'ASX', name: 'ASX', description: 'Australian Securities Exchange', icon: '🇦🇺', color: 'bg-blue-100 text-blue-700' },
    { id: 'TSX', name: 'TSX', description: 'Toronto Stock Exchange', icon: '🇨🇦', color: 'bg-red-100 text-red-700' },
    { id: 'JSE', name: 'JSE', description: 'Johannesburg Stock Exchange', icon: '🇿🇦', color: 'bg-green-100 text-green-700' },
    { id: 'CRIRSCO', name: 'CRIRSCO', description: 'International Template', icon: '🌍', color: 'bg-purple-100 text-purple-700' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado';
      case 'pending':
        return 'Pendente';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Em análise';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pré-Certificação</h1>
          <p className="text-gray-600">Valide a conformidade do relatório com reguladores internacionais</p>
        </div>

        {/* Regulators Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {regulators.map((reg) => (
            <div
              key={reg.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-3">{reg.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{reg.name}</h3>
              <p className="text-sm text-gray-600">{reg.description}</p>
            </div>
          ))}
        </div>

        {/* Submission Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Nova Solicitação</h2>
              <p className="text-sm text-gray-600">Submeta seu relatório ou faça upload de um documento para validação</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b">
            <button
              onClick={() => setActiveTab('select')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'select'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Selecionar Relatório
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload de Documento
            </button>
          </div>

          {activeTab === 'select' ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Report Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relatório
              </label>
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Selecione um relatório...</option>
                {reportsQuery.data?.map((report: any) => (
                  <option key={report.id} value={report.id}>
                    {report.title} ({report.standard}) - {report.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Regulator Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regulador
              </label>
              <select
                value={regulator}
                onChange={(e) => setRegulator(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {regulators.map((reg) => (
                  <option key={reg.id} value={reg.id}>
                    {reg.name} - {reg.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Informações Adicionais (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Adicione observações ou contexto adicional..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              ⏱️ <strong>Tempo estimado:</strong> 5-15 dias úteis para análise completa
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending || !selectedReportId}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                Enviar Solicitação
              </>
            )}
              </button>
            </div>
          ) : (
            <DocumentUploadValidator
              onValidationComplete={(result) => {
                toast.success('Validação concluída!', {
                  description: `Score: ${result.score}% - ${result.criteria.length} critérios verificados`
                });
              }}
            />
          )}
        </div>

        {/* Certifications History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Solicitações em Andamento</h2>
          
          {certificationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : certificationsQuery.data && certificationsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {certificationsQuery.data.map((cert: any) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      {getStatusIcon(cert.status)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {cert.regulator} - Score: {cert.complianceScore ? cert.complianceScore.toFixed(0) : 'N/A'}%
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(cert.submittedAt!).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(cert.status)}`}>
                      {getStatusText(cert.status)}
                    </span>
                    {cert.pdfUrl && (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Baixar PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma solicitação realizada ainda</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

