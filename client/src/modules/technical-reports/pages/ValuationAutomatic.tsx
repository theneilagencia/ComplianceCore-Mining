import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, Calculator, BarChart3 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ValuationAutomatic() {
  const [assetName, setAssetName] = useState("");
  const [resourceTonnes, setResourceTonnes] = useState("");

  const handleCalculate = () => {
    if (!assetName || !resourceTonnes) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    toast.success("Avaliação em desenvolvimento", {
      description: "Esta funcionalidade será implementada em breve"
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Valuation Automático</h1>
              <p className="text-slate-600">Avaliação automatizada de ativos minerais</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Nova Avaliação</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="assetName">Nome do Ativo *</Label>
                  <Input
                    id="assetName"
                    placeholder="Ex: Depósito de Ouro - Mina Esperança"
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="resource">Recurso Total (toneladas) *</Label>
                  <Input
                    id="resource"
                    type="number"
                    placeholder="Ex: 1000000"
                    value={resourceTonnes}
                    onChange={(e) => setResourceTonnes(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="grade">Teor Médio (%)</Label>
                  <Input
                    id="grade"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 2.5"
                  />
                </div>

                <div>
                  <Label htmlFor="commodity">Commodity</Label>
                  <Input
                    id="commodity"
                    placeholder="Ex: Ouro, Ferro, Cobre"
                  />
                </div>

                <Button 
                  onClick={handleCalculate}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  Calcular Valuation →
                </Button>
              </div>
            </Card>
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calculator className="w-5 h-5 text-cyan-600" />
                <h3 className="font-semibold">DCF</h3>
              </div>
              <p className="text-sm text-slate-600">
                Fluxo de Caixa Descontado
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Comparáveis</h3>
              </div>
              <p className="text-sm text-slate-600">
                Análise de mercado
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">NPV</h3>
              </div>
              <p className="text-sm text-slate-600">
                Valor Presente Líquido
              </p>
            </Card>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="mt-6 p-6 bg-cyan-50 border-cyan-200">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-cyan-600 mt-1" />
            <div>
              <h3 className="font-semibold text-cyan-900 mb-1">
                Avaliação Profissional
              </h3>
              <p className="text-sm text-cyan-700">
                Utilize metodologias reconhecidas internacionalmente (DCF, Comparáveis, Opções Reais). 
                Análise de sensibilidade e cenários incluídos.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

