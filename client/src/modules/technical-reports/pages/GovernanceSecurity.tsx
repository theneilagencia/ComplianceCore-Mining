import DashboardLayout from "@/components/DashboardLayout";
import GovernanceWizard from "@/components/wizards/GovernanceWizard";

export default function GovernanceSecurity() {
  return <GovernanceWizard />;
}

// Old static page (commented out)
/*
import { Card } from "@/components/ui/card";
import { Shield, Lock, FileCheck, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

function GovernanceSecurityOld() {
  const complianceItems = [
    { name: "LGPD - Lei Geral de Proteção de Dados", status: "compliant", score: 95 },
    { name: "ISO 27001 - Segurança da Informação", status: "compliant", score: 88 },
    { name: "SOC 2 Type II", status: "in-progress", score: 72 },
    { name: "Código de Mineração Brasileiro", status: "compliant", score: 100 }
  ];

  const securityMetrics = [
    { label: "Auditorias Realizadas", value: "24", trend: "+12%" },
    { label: "Incidentes Resolvidos", value: "100%", trend: "0 pendentes" },
    { label: "Certificações Ativas", value: "8", trend: "+2 este ano" },
    { label: "Treinamentos Compliance", value: "156", trend: "+45%" }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Governança & Segurança</h1>
              <p className="text-slate-600">Gestão de compliance e segurança de dados</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {securityMetrics.map((metric, index) => (
            <Card key={index} className="p-4">
              <p className="text-sm text-slate-600 mb-1">{metric.label}</p>
              <p className="text-2xl font-bold text-slate-900 mb-1">{metric.value}</p>
              <p className="text-xs text-green-600">{metric.trend}</p>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Compliance Status */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <FileCheck className="w-5 h-5 text-violet-600" />
              <h2 className="text-xl font-semibold">Status de Compliance</h2>
            </div>
            
            <div className="space-y-4">
              {complianceItems.map((item, index) => (
                <div key={index} className="border-b border-slate-200 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.status === "compliant" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="font-medium text-slate-900">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{item.score}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.status === "compliant" ? "bg-green-600" : "bg-yellow-600"
                      }`}
                      style={{ width: `${item.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Security Features */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-violet-600" />
              <h2 className="text-xl font-semibold">Recursos de Segurança</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Criptografia End-to-End</h3>
                  <p className="text-sm text-slate-600">
                    Todos os dados são criptografados em trânsito e em repouso
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Autenticação Multi-Fator</h3>
                  <p className="text-sm text-slate-600">
                    Proteção adicional com MFA obrigatório para acessos críticos
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Controle de Acesso</h3>
                  <p className="text-sm text-slate-600">
                    Permissões granulares baseadas em funções (RBAC)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileCheck className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Auditoria Completa</h3>
                  <p className="text-sm text-slate-600">
                    Logs detalhados de todas as ações e acessos ao sistema
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Info Banner */}
        <Card className="p-6 bg-violet-50 border-violet-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-violet-600 mt-1" />
            <div>
              <h3 className="font-semibold text-violet-900 mb-1">
                Segurança e Compliance de Classe Mundial
              </h3>
              <p className="text-sm text-violet-700">
                Mantenha sua operação em conformidade com as principais regulações nacionais e internacionais. 
                Monitoramento contínuo, auditorias automatizadas e relatórios de compliance em tempo real.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
*/
