import { TechnicalReportForm } from '../components/TechnicalReportForm';
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function ReportCreate() {
  const [, setLocation] = useLocation();

  const handleSave = () => {
    // Redirecionar para lista de relatórios após salvar
    setLocation('/reports');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/reports')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Criar Relatório Técnico
              </h1>
              <p className="text-sm text-gray-600">
                Preencha manualmente os dados do relatório
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="py-8">
        <TechnicalReportForm onSave={handleSave} />
      </div>
    </div>
  );
}

