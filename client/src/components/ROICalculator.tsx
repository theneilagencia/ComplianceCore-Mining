import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TrendingUp, Clock, DollarSign, Calculator, Building2, Users } from "lucide-react";

type ProfileType = "mining" | "consulting" | null;

// Build timestamp: 2025-11-11T15:50:00Z

export default function ROICalculator() {
  const [profile, setProfile] = useState<ProfileType>(null);
  
  // Inputs para Mineradora
  const [techReportsPerYear, setTechReportsPerYear] = useState<number>(12);
  const [avgCostPerReport, setAvgCostPerReport] = useState<number>(5000);
  const [internalHoursPerReport, setInternalHoursPerReport] = useState<number>(40);
  const [regulatoryComplexity, setRegulatoryComplexity] = useState<string>("basic");
  
  // Inputs para Consultoria
  const [reportsPerClient, setReportsPerClient] = useState<number>(4);
  const [activeClients, setActiveClients] = useState<number>(10);
  const [teamHoursPerReport, setTeamHoursPerReport] = useState<number>(50);

  // Lógica de cálculo por perfil
  const calculations = profile === "mining" ? {
    // Mineradora
    totalReports: techReportsPerYear,
    currentAnnualCost: techReportsPerYear * avgCostPerReport,
    qivoCostPerReport: regulatoryComplexity === "basic" ? 2000 : 
                       regulatoryComplexity === "intermediate" ? 3000 : 4000,
    hoursSavedPerReport: internalHoursPerReport * 0.7,
  } : profile === "consulting" ? {
    // Consultoria
    totalReports: reportsPerClient * activeClients,
    currentAnnualCost: (reportsPerClient * activeClients) * avgCostPerReport,
    qivoCostPerReport: 2500,
    hoursSavedPerReport: teamHoursPerReport * 0.6,
  } : null;

  if (!calculations) {
    // Tela de seleção de perfil
    return (
      <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Calcule o ROI do QIVO
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Descubra quanto sua empresa pode economizar automatizando relatórios técnicos
            </p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Você está usando o QIVO como:</CardTitle>
              <CardDescription>
                A seleção define quais campos serão exibidos e qual lógica de cálculo será usada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup onValueChange={(value) => setProfile(value as ProfileType)} className="space-y-4">
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="mining" id="mining" />
                  <div className="flex-1">
                    <Label htmlFor="mining" className="flex items-center gap-2 font-semibold cursor-pointer">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      Mineradora
                    </Label>
                    <p className="text-sm text-slate-600 mt-1">
                      Empresa de mineração que gera relatórios técnicos/regulatórios internamente
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value="consulting" id="consulting" />
                  <div className="flex-1">
                    <Label htmlFor="consulting" className="flex items-center gap-2 font-semibold cursor-pointer">
                      <Users className="h-5 w-5 text-indigo-600" />
                      Consultoria especializada
                    </Label>
                    <p className="text-sm text-slate-600 mt-1">
                      Consultoria que entrega relatórios técnicos para múltiplos clientes
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Cálculos finais
  const qivoAnnualCost = calculations.totalReports * calculations.qivoCostPerReport;
  const annualSavings = calculations.currentAnnualCost - qivoAnnualCost;
  const roi = ((annualSavings / qivoAnnualCost) * 100).toFixed(1);
  const hoursSaved = calculations.totalReports * calculations.hoursSavedPerReport;
  const daysSaved = (hoursSaved / 8).toFixed(1);

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Calcule o ROI do QIVO
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-4">
            {profile === "mining" 
              ? "Veja quanto sua mineradora pode economizar automatizando relatórios técnicos"
              : "Veja quanto sua consultoria pode economizar e escalar com automação"}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setProfile(null)}
            className="text-sm"
          >
            ← Mudar perfil
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Inputs - Mineradora */}
          {profile === "mining" && (
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
                  <Label htmlFor="tech-reports">Quantos relatórios técnicos/regulatórios você gera por ano?</Label>
                  <Input
                    id="tech-reports"
                    type="number"
                    min="1"
                    value={techReportsPerYear}
                    onChange={(e) => setTechReportsPerYear(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Qual o custo médio atual por relatório (USD)?</Label>
                  <p className="text-xs text-slate-500">Incluindo consultorias + equipe interna</p>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="100"
                    value={avgCostPerReport}
                    onChange={(e) => setAvgCostPerReport(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours">Quantas horas internas sua equipe técnica gasta por relatório?</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="1"
                    value={internalHoursPerReport}
                    onChange={(e) => setInternalHoursPerReport(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Qual o nível de complexidade regulatória dos seus relatórios?</Label>
                  <RadioGroup value={regulatoryComplexity} onValueChange={setRegulatoryComplexity} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="basic" id="basic" />
                      <Label htmlFor="basic" className="font-normal cursor-pointer">
                        Básico (ex: 1 país, ESG simples)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="intermediate" id="intermediate" />
                      <Label htmlFor="intermediate" className="font-normal cursor-pointer">
                        Intermediário (2+ países, ESG + técnico)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="multinational" id="multinational" />
                      <Label htmlFor="multinational" className="font-normal cursor-pointer">
                        Multinacional (3+ países, JORC/NI 43-101/SGS, etc.)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inputs - Consultoria */}
          {profile === "consulting" && (
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
                  <Label htmlFor="reports-client">Quantos relatórios você entrega por cliente, por ano?</Label>
                  <Input
                    id="reports-client"
                    type="number"
                    min="1"
                    value={reportsPerClient}
                    onChange={(e) => setReportsPerClient(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clients">Quantos clientes ativos recebem relatórios técnicos?</Label>
                  <Input
                    id="clients"
                    type="number"
                    min="1"
                    value={activeClients}
                    onChange={(e) => setActiveClients(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team-hours">Quantas horas sua equipe gasta por relatório atualmente?</Label>
                  <Input
                    id="team-hours"
                    type="number"
                    min="1"
                    value={teamHoursPerReport}
                    onChange={(e) => setTeamHoursPerReport(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost-consulting">Qual o custo médio atual por relatório (USD)?</Label>
                  <p className="text-xs text-slate-500">Incluindo equipe + ferramentas + overhead</p>
                  <Input
                    id="cost-consulting"
                    type="number"
                    min="0"
                    step="100"
                    value={avgCostPerReport}
                    onChange={(e) => setAvgCostPerReport(Number(e.target.value))}
                    className="text-lg"
                  />
                </div>
              </CardContent>
            </Card>
          )}

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
