import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function RegulatoryRadar() {
  const updates = [
    {
      id: 1,
      title: "Nova Resolução ANM sobre Barragens",
      date: "2025-10-15",
      status: "novo",
      description: "Atualização dos requisitos de segurança para barragens de rejeitos"
    },
    {
      id: 2,
      title: "Alteração no Código de Mineração",
      date: "2025-09-28",
      status: "ativo",
      description: "Mudanças nos processos de licenciamento ambiental"
    },
    {
      id: 3,
      title: "Consulta Pública - Normas ESG",
      date: "2025-08-10",
      status: "consulta",
      description: "Abertura de consulta pública para novas normas ESG no setor mineral"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "novo": return "bg-red-100 text-red-700";
      case "ativo": return "bg-blue-100 text-blue-700";
      case "consulta": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "novo": return <AlertCircle className="w-4 h-4" />;
      case "ativo": return <CheckCircle className="w-4 h-4" />;
      case "consulta": return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Radar Regulatório</h1>
              <p className="text-slate-600">Monitoramento de mudanças regulatórias</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Novas Regulações</p>
                <p className="text-2xl font-bold text-slate-900">3</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Em Vigência</p>
                <p className="text-2xl font-bold text-slate-900">12</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Consultas Públicas</p>
                <p className="text-2xl font-bold text-slate-900">2</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Updates List */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Atualizações Recentes</h2>
          
          <div className="space-y-4">
            {updates.map((update) => (
              <div key={update.id} className="border-b border-slate-200 last:border-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(update.status)}
                    <h3 className="font-semibold text-slate-900">{update.title}</h3>
                  </div>
                  <Badge className={getStatusColor(update.status)}>
                    {update.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-2">{update.description}</p>
                <p className="text-xs text-slate-500">
                  Data: {new Date(update.date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Info Banner */}
        <Card className="mt-6 p-6 bg-rose-50 border-rose-200">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-rose-600 mt-1" />
            <div>
              <h3 className="font-semibold text-rose-900 mb-1">
                Mantenha-se Atualizado
              </h3>
              <p className="text-sm text-rose-700">
                Monitore mudanças em tempo real nas regulações da ANM, IBAMA, órgãos estaduais e legislação federal. 
                Receba alertas automáticos sobre novas normas que impactam sua operação.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

