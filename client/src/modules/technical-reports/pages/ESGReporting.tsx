import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, TrendingUp, Users, Droplet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ESGReporting() {
  const [projectName, setProjectName] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");

  const handleGenerate = () => {
    if (!projectName || !reportingPeriod) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    toast.success("Relatório ESG em desenvolvimento", {
      description: "Esta funcionalidade será implementada em breve"
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ESG Reporting</h1>
              <p className="text-slate-600">Relatórios de sustentabilidade e impacto ambiental</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Novo Relatório ESG</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Nome do Projeto *</Label>
                  <Input
                    id="projectName"
                    placeholder="Ex: Projeto Mineração Sustentável 2025"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="period">Período de Reporte *</Label>
                  <Input
                    id="period"
                    placeholder="Ex: Q1 2025 ou Janeiro-Março 2025"
                    value={reportingPeriod}
                    onChange={(e) => setReportingPeriod(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleGenerate}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Gerar Relatório ESG →
                </Button>
              </div>
            </Card>
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold">Ambiental</h3>
              </div>
              <p className="text-sm text-slate-600">
                Emissões, consumo de recursos, biodiversidade
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Social</h3>
              </div>
              <p className="text-sm text-slate-600">
                Comunidades, segurança, direitos humanos
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold">Governança</h3>
              </div>
              <p className="text-sm text-slate-600">
                Ética, transparência, compliance
              </p>
            </Card>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mt-6 p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <Droplet className="w-5 h-5 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1">
                Relatórios ESG Completos
              </h3>
              <p className="text-sm text-emerald-700">
                Gere relatórios de sustentabilidade alinhados com GRI, SASB e TCFD. 
                Monitore KPIs ambientais, sociais e de governança em tempo real.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

