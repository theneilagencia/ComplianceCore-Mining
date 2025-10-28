import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf, TrendingUp, Users, Droplet, FileText, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ESGFramework = 'GRI' | 'SASB' | 'TCFD' | 'CDP';

export default function ESGReportingNew() {
  const [framework, setFramework] = useState<ESGFramework>('GRI');
  const [projectName, setProjectName] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [location, setLocation] = useState({ latitude: 0, longitude: 0, address: "" });
  
  // Environmental data
  const [scope1, setScope1] = useState<number | undefined>();
  const [scope2, setScope2] = useState<number | undefined>();
  const [scope3, setScope3] = useState<number | undefined>();
  const [waterWithdrawal, setWaterWithdrawal] = useState<number | undefined>();
  const [waterRecycled, setWaterRecycled] = useState<number | undefined>();
  const [wasteGenerated, setWasteGenerated] = useState<number | undefined>();
  const [wasteRecycled, setWasteRecycled] = useState<number | undefined>();
  const [energyConsumption, setEnergyConsumption] = useState<number | undefined>();
  const [renewableEnergy, setRenewableEnergy] = useState<number | undefined>();
  
  // Social data
  const [totalEmployees, setTotalEmployees] = useState<number | undefined>();
  const [femaleEmployees, setFemaleEmployees] = useState<number | undefined>();
  const [localEmployees, setLocalEmployees] = useState<number | undefined>();
  const [ltifr, setLtifr] = useState<number | undefined>();
  const [fatalityRate, setFatalityRate] = useState<number | undefined>();
  
  // Governance data
  const [boardMembers, setBoardMembers] = useState<number | undefined>();
  const [independentDirectors, setIndependentDirectors] = useState<number | undefined>();
  const [femaleDirectors, setFemaleDirectors] = useState<number | undefined>();
  const [corruptionIncidents, setCorruptionIncidents] = useState<number | undefined>();
  const [regulatoryViolations, setRegulatoryViolations] = useState<number | undefined>();

  const generateMutation = trpc.esg.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Relatório ESG gerado com sucesso!", {
        description: `Score: ${data.report.score?.overall}/100 (${data.rating.rating})`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao gerar relatório", {
        description: error.message,
      });
    },
  });

  const handleGenerate = () => {
    if (!projectName || !reportingPeriod) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    generateMutation.mutate({
      projectName,
      reportingPeriod,
      framework,
      location: location.address ? location : undefined,
      environmental: {
        scope1Emissions: scope1,
        scope2Emissions: scope2,
        scope3Emissions: scope3,
        waterWithdrawal,
        waterRecycled,
        wasteGenerated,
        wasteRecycled,
        energyConsumption,
        renewableEnergy,
      },
      social: {
        totalEmployees,
        femaleEmployees,
        localEmployees,
        lostTimeInjuryFrequency: ltifr,
        fatalityRate,
      },
      governance: {
        boardMembers,
        independentDirectors,
        femaleDirectors,
        corruptionIncidents,
        regulatoryViolations,
      },
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

        {/* Main Form */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Novo Relatório ESG</h2>
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

            <div>
              <Label htmlFor="framework">Framework ESG *</Label>
              <Select value={framework} onValueChange={(v) => setFramework(v as ESGFramework)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRI">GRI Standards 2021</SelectItem>
                  <SelectItem value="SASB">SASB Metals & Mining</SelectItem>
                  <SelectItem value="TCFD">TCFD Climate</SelectItem>
                  <SelectItem value="CDP">CDP Carbon & Water</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="address">Localização</Label>
              <Input
                id="address"
                placeholder="Ex: Pará, Brasil"
                value={location.address}
                onChange={(e) => setLocation({ ...location, address: e.target.value })}
              />
            </div>
          </div>

          {/* Environmental Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">Ambiental (E)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Scope 1 Emissions (tCO₂e)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={scope1 || ""}
                  onChange={(e) => setScope1(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Scope 2 Emissions (tCO₂e)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={scope2 || ""}
                  onChange={(e) => setScope2(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Scope 3 Emissions (tCO₂e)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={scope3 || ""}
                  onChange={(e) => setScope3(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Water Withdrawal (m³)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={waterWithdrawal || ""}
                  onChange={(e) => setWaterWithdrawal(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Water Recycled (m³)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={waterRecycled || ""}
                  onChange={(e) => setWaterRecycled(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Waste Generated (tonnes)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={wasteGenerated || ""}
                  onChange={(e) => setWasteGenerated(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Waste Recycled (tonnes)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={wasteRecycled || ""}
                  onChange={(e) => setWasteRecycled(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Energy Consumption (MWh)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={energyConsumption || ""}
                  onChange={(e) => setEnergyConsumption(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Renewable Energy (MWh)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={renewableEnergy || ""}
                  onChange={(e) => setRenewableEnergy(Number(e.target.value) || undefined)}
                />
              </div>
            </div>
          </div>

          {/* Social Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Social (S)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Total Employees</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={totalEmployees || ""}
                  onChange={(e) => setTotalEmployees(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Female Employees</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={femaleEmployees || ""}
                  onChange={(e) => setFemaleEmployees(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Local Employees</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localEmployees || ""}
                  onChange={(e) => setLocalEmployees(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>LTIFR (Lost Time Injury Frequency)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={ltifr || ""}
                  onChange={(e) => setLtifr(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Fatality Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={fatalityRate || ""}
                  onChange={(e) => setFatalityRate(Number(e.target.value) || undefined)}
                />
              </div>
            </div>
          </div>

          {/* Governance Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Governança (G)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Board Members</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={boardMembers || ""}
                  onChange={(e) => setBoardMembers(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Independent Directors</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={independentDirectors || ""}
                  onChange={(e) => setIndependentDirectors(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Female Directors</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={femaleDirectors || ""}
                  onChange={(e) => setFemaleDirectors(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Corruption Incidents</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={corruptionIncidents || ""}
                  onChange={(e) => setCorruptionIncidents(Number(e.target.value) || undefined)}
                />
              </div>
              <div>
                <Label>Regulatory Violations</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={regulatoryViolations || ""}
                  onChange={(e) => setRegulatoryViolations(Number(e.target.value) || undefined)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleGenerate}
              disabled={generateMutation.isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {generateMutation.isLoading ? (
                "Gerando..."
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Relatório ESG →
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Info Banner */}
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-start gap-3">
            <Droplet className="w-5 h-5 text-emerald-600 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1">
                Relatórios ESG Completos
              </h3>
              <p className="text-sm text-emerald-700">
                Gere relatórios de sustentabilidade alinhados com GRI, SASB, TCFD e CDP. 
                Integração automática com IBAMA e Copernicus para dados ambientais em tempo real.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

