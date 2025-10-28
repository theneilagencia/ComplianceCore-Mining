import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, BarChart3, Calculator } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type CommodityType = 'gold' | 'copper' | 'iron' | 'nickel' | 'lithium' | 'silver' | 'zinc' | 'lead';
type ValuationMethod = 'DCF' | 'COMPARABLE' | 'COST' | 'INCOME';

export default function ValuationCalculator() {
  const [projectName, setProjectName] = useState("");
  const [commodity, setCommodity] = useState<CommodityType>('gold');
  const [method, setMethod] = useState<ValuationMethod>('DCF');
  
  // Resources
  const [measured, setMeasured] = useState<number | undefined>();
  const [indicated, setIndicated] = useState<number | undefined>();
  const [inferred, setInferred] = useState<number | undefined>();
  const [grade, setGrade] = useState<number | undefined>();
  
  // Economics
  const [commodityPrice, setCommodityPrice] = useState<number | undefined>();
  const [opex, setOpex] = useState<number | undefined>();
  const [capex, setCapex] = useState<number | undefined>();
  const [recoveryRate, setRecoveryRate] = useState<number | undefined>();
  const [discountRate, setDiscountRate] = useState<number | undefined>();
  const [mineLife, setMineLife] = useState<number | undefined>();
  const [productionRate, setProductionRate] = useState<number | undefined>();

  const [result, setResult] = useState<any>(null);

  const calculateMutation = trpc.valuation.calculate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("Valuation calculado com sucesso!", {
        description: `NPV: $${(data.npv / 1000000).toFixed(1)}M | IRR: ${data.irr.toFixed(1)}%`,
      });
    },
    onError: (error) => {
      toast.error("Erro ao calcular valuation", {
        description: error.message,
      });
    },
  });

  const priceQuery = trpc.valuation.getCommodityPrice.useQuery(
    { commodity },
    { enabled: false }
  );

  const handleFetchPrice = async () => {
    const data = await priceQuery.refetch();
    if (data.data) {
      setCommodityPrice(data.data.price);
      toast.success(`Preço atualizado: $${data.data.price} ${data.data.unit}`);
    }
  };

  const handleCalculate = () => {
    if (!projectName || !grade) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    calculateMutation.mutate({
      projectName,
      commodity,
      method,
      resources: {
        measured,
        indicated,
        inferred,
        grade,
        unit: 'tonnes',
      },
      economics: {
        commodityPrice,
        opex,
        capex,
        recoveryRate,
        discountRate,
        mineLife,
        productionRate,
      },
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Valuation Automático</h1>
              <p className="text-slate-600">Cálculo de NPV, IRR e análise de sensibilidade</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-6">Parâmetros do Projeto</h2>
              
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <Label htmlFor="projectName">Nome do Projeto *</Label>
                  <Input
                    id="projectName"
                    placeholder="Ex: Projeto Ouro Verde"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="commodity">Commodity *</Label>
                  <Select value={commodity} onValueChange={(v) => setCommodity(v as CommodityType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gold">Ouro (Gold)</SelectItem>
                      <SelectItem value="copper">Cobre (Copper)</SelectItem>
                      <SelectItem value="iron">Ferro (Iron)</SelectItem>
                      <SelectItem value="nickel">Níquel (Nickel)</SelectItem>
                      <SelectItem value="lithium">Lítio (Lithium)</SelectItem>
                      <SelectItem value="silver">Prata (Silver)</SelectItem>
                      <SelectItem value="zinc">Zinco (Zinc)</SelectItem>
                      <SelectItem value="lead">Chumbo (Lead)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="method">Método de Valuation *</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as ValuationMethod)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DCF">DCF (Discounted Cash Flow)</SelectItem>
                      <SelectItem value="COMPARABLE">Comparable Transactions</SelectItem>
                      <SelectItem value="COST">Cost Approach</SelectItem>
                      <SelectItem value="INCOME">Income Approach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resources */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Recursos Minerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Measured Resources (tonnes)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={measured || ""}
                      onChange={(e) => setMeasured(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>Indicated Resources (tonnes)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={indicated || ""}
                      onChange={(e) => setIndicated(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>Inferred Resources (tonnes)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={inferred || ""}
                      onChange={(e) => setInferred(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>Grade (g/t or %) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={grade || ""}
                      onChange={(e) => setGrade(Number(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              </div>

              {/* Economics */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Parâmetros Econômicos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Commodity Price (USD)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Auto"
                        value={commodityPrice || ""}
                        onChange={(e) => setCommodityPrice(Number(e.target.value) || undefined)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFetchPrice}
                        disabled={priceQuery.isFetching}
                      >
                        {priceQuery.isFetching ? "..." : "Fetch"}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>OPEX (USD/tonne)</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={opex || ""}
                      onChange={(e) => setOpex(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>CAPEX (USD)</Label>
                    <Input
                      type="number"
                      placeholder="100000000"
                      value={capex || ""}
                      onChange={(e) => setCapex(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>Recovery Rate (%)</Label>
                    <Input
                      type="number"
                      placeholder="85"
                      value={recoveryRate || ""}
                      onChange={(e) => setRecoveryRate(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>Discount Rate (%)</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={discountRate || ""}
                      onChange={(e) => setDiscountRate(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>Mine Life (years)</Label>
                    <Input
                      type="number"
                      placeholder="10"
                      value={mineLife || ""}
                      onChange={(e) => setMineLife(Number(e.target.value) || undefined)}
                    />
                  </div>
                  <div>
                    <Label>Production Rate (tonnes/year)</Label>
                    <Input
                      type="number"
                      placeholder="1000000"
                      value={productionRate || ""}
                      onChange={(e) => setProductionRate(Number(e.target.value) || undefined)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <Button 
                onClick={handleCalculate}
                disabled={calculateMutation.isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {calculateMutation.isLoading ? "Calculando..." : "Calcular Valuation →"}
              </Button>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-1">
            {result ? (
              <div className="space-y-4">
                {/* NPV */}
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">NPV</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatCurrency(result.npv)}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">Net Present Value</p>
                </Card>

                {/* IRR */}
                <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-emerald-900">IRR</h3>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900">
                    {result.irr.toFixed(1)}%
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">Internal Rate of Return</p>
                </Card>

                {/* Payback */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Payback</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">
                    {result.paybackPeriod.toFixed(1)} anos
                  </p>
                  <p className="text-sm text-purple-700 mt-1">Período de Retorno</p>
                </Card>

                {/* Breakdown */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Breakdown Financeiro</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Revenue:</span>
                      <span className="font-semibold">{formatCurrency(result.breakdown.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total OPEX:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(result.breakdown.totalOpex)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total CAPEX:</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(result.breakdown.totalCapex)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="text-slate-900 font-semibold">Net Profit:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(result.breakdown.netProfit)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">
                  Preencha os parâmetros e clique em "Calcular Valuation" para ver os resultados
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

