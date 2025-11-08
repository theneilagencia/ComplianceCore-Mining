import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, DollarSign, Calculator } from "lucide-react";

// Updated: 2025-11-08 05:40 UTC - Currency changed to USD
// Force rebuild: 1762598400 - Google Cloud CDN cache bust
export default function ROICalculator() {
  const CACHE_VERSION = '2025-11-08-v2'; // Force new hash
  const [reportsPerYear, setReportsPerYear] = useState<number>(12);
  const [costPerReport, setCostPerReport] = useState<number>(5000);
  const [hoursPerReport, setHoursPerReport] = useState<number>(40);

  // Cálculos
  const currentAnnualCost = reportsPerYear * costPerReport;
  const qivoCostPerReport = 2500; // Média dos planos
  const qivoAnnualCost = reportsPerYear * qivoCostPerReport;
  const annualSavings = currentAnnualCost - qivoAnnualCost;
  const roi = ((annualSavings / qivoAnnualCost) * 100).toFixed(1);
  const timeReduction = 0.7; // 70% de redução de tempo
  const hoursSaved = reportsPerYear * hoursPerReport * timeReduction;
  const daysSaved = (hoursSaved / 8).toFixed(1);

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Calcule o ROI do QIVO
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Descubra quanto sua empresa pode economizar automatizando relatórios técnicos com o QIVO
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Inputs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Seus Dados Atuais
              </CardTitle>
              <CardDescription>
                Informe seus números para calcular o retorno
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reports">Relatórios por ano</Label>
                <Input
                  id="reports"
                  type="number"
                  min="1"
                  value={reportsPerYear}
                  onChange={(e) => setReportsPerYear(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">Custo atual por relatório (USD)</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="100"
                  value={costPerReport}
                  onChange={(e) => setCostPerReport(Number(e.target.value))}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Horas gastas por relatório</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  value={hoursPerReport}
                  onChange={(e) => setHoursPerReport(Number(e.target.value))}
                  className="text-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Seu ROI com QIVO</CardTitle>
              <CardDescription className="text-blue-700">
                Economia anual projetada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Economia Anual */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <DollarSign className="h-4 w-4" />
                  Economia Anual
                </div>
                <div className="text-3xl font-bold text-green-600">
                  $ {annualSavings.toLocaleString('en-US')}
                </div>
              </div>

              {/* ROI */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Retorno sobre Investimento
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {roi}%
                </div>
              </div>

              {/* Tempo Economizado */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                  <Clock className="h-4 w-4" />
                  Tempo Economizado
                </div>
                <div className="text-3xl font-bold text-indigo-600">
                  {daysSaved} dias/ano
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  ({hoursSaved.toFixed(0)} horas)
                </div>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                Começar Agora
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-sm text-slate-500 mt-8 max-w-3xl mx-auto">
          * Cálculos baseados em médias do setor de mineração. Resultados reais podem variar de acordo com a complexidade dos projetos e padrões utilizados.
        </p>
      </div>
    </section>
  );
}
