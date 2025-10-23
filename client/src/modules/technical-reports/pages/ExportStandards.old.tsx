import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import DashboardLayout from '@/components/DashboardLayout';
import { toast } from 'sonner';
import { Download, FileText, FileSpreadsheet, FileCode, Loader2, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function ExportStandards() {
  const [selectedReportId, setSelectedReportId] = useState('');
  const [toStandard, setToStandard] = useState<'JORC_2012' | 'NI_43_101' | 'PERC' | 'SAMREC' | 'CBRR'>('JORC_2012');
  const [format, setFormat] = useState<'PDF' | 'DOCX' | 'XLSX'>('PDF');

  // Queries (sem polling)
  const reportsQuery = trpc.technicalReports.generate.list.useQuery(
    undefined,
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );
  const exportsQuery = trpc.technicalReports.exports.list.useQuery(
    {},
    {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Mutations
  const exportMutation = trpc.technicalReports.exports.run.useMutation({
    onSuccess: (data: any) => {
      toast.success('Exportação concluída com sucesso!');
      exportsQuery.refetch();
      setSelectedReportId('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao exportar relatório');
    },
  });

  const handleExport = () => {
    if (!selectedReportId) {
      toast.error('Selecione um relatório');
      return;
    }

    exportMutation.mutate({
      reportId: selectedReportId,
      toStandard,
      format,
    });
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

        {/* Standards Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
              <select
                value={selectedReportId}
                onChange={(e) => setSelectedReportId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Selecione um relatório...</option>
                {reportsQuery.data?.map((report: any) => (
                  <option key={report.id} value={report.id}>
                    {report.title} ({report.standard}) - {report.status}
                  </option>
                ))}
              </select>
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
              >
                {formats.map((fmt) => (
                  <option key={fmt.id} value={fmt.id}>
                    {fmt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              ⏱️ <strong>Tempo estimado:</strong> 30-60 segundos para geração do arquivo
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exportMutation.isPending || !selectedReportId}
            className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exportando...
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exportações Recentes</h2>
          
          {exportsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : exportsQuery.data && exportsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {exportsQuery.data.map((exp: any) => {
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
                          {new Date(exp.createdAt!).toLocaleString('pt-BR')}
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
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

