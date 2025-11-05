import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, Clock, DollarSign, CheckCircle2 } from 'lucide-react';

export default function ROICalculator() {
  const [inputs, setInputs] = useState({
    reportsPerMonth: 2,
    hoursPerReport: 40,
    hourlyRate: 150,
    complianceIssuesPerYear: 3,
    costPerIssue: 50000,
    auditCostPerYear: 100000,
  });

  const [selectedPlan, setSelectedPlan] = useState<'START' | 'PRO' | 'ENTERPRISE'>('PRO');

  const PLAN_PRICES = {
    START: 2500,
    PRO: 12500,
    ENTERPRISE: 18900,
  };

  const PLAN_EFFICIENCY = {
    START: {
      timeReduction: 0.50, // 50% redução de tempo
      complianceReduction: 0.60, // 60% redução de problemas
      auditReduction: 0.30, // 30% redução de custo de auditoria
    },
    PRO: {
      timeReduction: 0.70, // 70% redução de tempo
      complianceReduction: 0.80, // 80% redução de problemas
      auditReduction: 0.50, // 50% redução de custo de auditoria
    },
    ENTERPRISE: {
      timeReduction: 0.85, // 85% redução de tempo
      complianceReduction: 0.90, // 90% redução de problemas
      auditReduction: 0.70, // 70% redução de custo de auditoria
    },
  };

  const calculateROI = () => {
    const planPrice = PLAN_PRICES[selectedPlan];
    const efficiency = PLAN_EFFICIENCY[selectedPlan];

    // Custo atual sem QIVO (mensal)
    const currentMonthlyCost = {
      reportProduction: inputs.reportsPerMonth * inputs.hoursPerReport * inputs.hourlyRate,
      compliance: (inputs.complianceIssuesPerYear * inputs.costPerIssue) / 12,
      audit: inputs.auditCostPerYear / 12,
    };

    const totalCurrentMonthlyCost = 
      currentMonthlyCost.reportProduction + 
      currentMonthlyCost.compliance + 
      currentMonthlyCost.audit;

    // Economia com QIVO (mensal)
    const monthlySavings = {
      reportProduction: currentMonthlyCost.reportProduction * efficiency.timeReduction,
      compliance: currentMonthlyCost.compliance * efficiency.complianceReduction,
      audit: currentMonthlyCost.audit * efficiency.auditReduction,
    };

    const totalMonthlySavings = 
      monthlySavings.reportProduction + 
      monthlySavings.compliance + 
      monthlySavings.audit;

    // ROI
    const netMonthlySavings = totalMonthlySavings - planPrice;
    const annualSavings = netMonthlySavings * 12;
    const roiPercentage = ((totalMonthlySavings - planPrice) / planPrice) * 100;
    const paybackMonths = planPrice / totalMonthlySavings;

    return {
      currentMonthlyCost: totalCurrentMonthlyCost,
      totalMonthlySavings,
      netMonthlySavings,
      annualSavings,
      roiPercentage,
      paybackMonths,
      breakdown: {
        current: currentMonthlyCost,
        savings: monthlySavings,
      },
    };
  };

  const roi = calculateROI();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(0)}%`;
  };

  return (
    <section className="bg-gradient-to-br from-[#0f1135] to-[#171a4a] py-20 border-y border-white/10">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Título */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#b96e48]/20 px-4 py-2 rounded-full mb-4">
              <Calculator className="h-5 w-5 text-[#b96e48]" />
              <span className="text-[#b96e48] font-semibold">Calculadora de ROI</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Calcule o Retorno sobre Investimento
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Descubra quanto sua operação pode economizar com a automação e conformidade da QIVO
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inputs */}
            <div className="space-y-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-6">Seus Dados Atuais</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reportsPerMonth" className="text-gray-300">
                      Relatórios técnicos gerados por mês
                    </Label>
                    <Input
                      id="reportsPerMonth"
                      type="number"
                      min="1"
                      value={inputs.reportsPerMonth}
                      onChange={(e) =>
                        setInputs({ ...inputs, reportsPerMonth: parseInt(e.target.value) || 1 })
                      }
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hoursPerReport" className="text-gray-300">
                      Horas gastas por relatório (manual)
                    </Label>
                    <Input
                      id="hoursPerReport"
                      type="number"
                      min="1"
                      value={inputs.hoursPerReport}
                      onChange={(e) =>
                        setInputs({ ...inputs, hoursPerReport: parseInt(e.target.value) || 1 })
                      }
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="hourlyRate" className="text-gray-300">
                      Custo por hora (equipe técnica) - USD
                    </Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min="1"
                      value={inputs.hourlyRate}
                      onChange={(e) =>
                        setInputs({ ...inputs, hourlyRate: parseInt(e.target.value) || 1 })
                      }
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="complianceIssuesPerYear" className="text-gray-300">
                      Problemas de conformidade por ano
                    </Label>
                    <Input
                      id="complianceIssuesPerYear"
                      type="number"
                      min="0"
                      value={inputs.complianceIssuesPerYear}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          complianceIssuesPerYear: parseInt(e.target.value) || 0,
                        })
                      }
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="costPerIssue" className="text-gray-300">
                      Custo médio por problema de conformidade - USD
                    </Label>
                    <Input
                      id="costPerIssue"
                      type="number"
                      min="0"
                      value={inputs.costPerIssue}
                      onChange={(e) =>
                        setInputs({ ...inputs, costPerIssue: parseInt(e.target.value) || 0 })
                      }
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="auditCostPerYear" className="text-gray-300">
                      Custo anual de auditorias externas - USD
                    </Label>
                    <Input
                      id="auditCostPerYear"
                      type="number"
                      min="0"
                      value={inputs.auditCostPerYear}
                      onChange={(e) =>
                        setInputs({ ...inputs, auditCostPerYear: parseInt(e.target.value) || 0 })
                      }
                      className="mt-2 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Selecione o Plano</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['START', 'PRO', 'ENTERPRISE'] as const).map((plan) => (
                    <button
                      key={plan}
                      onClick={() => setSelectedPlan(plan)}
                      className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                        selectedPlan === plan
                          ? 'bg-[#b96e48] text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <div className="text-3xl font-bold text-[#b96e48]">
                    {formatCurrency(PLAN_PRICES[selectedPlan])}
                  </div>
                  <div className="text-sm text-gray-400">por mês</div>
                </div>
              </Card>
            </div>

            {/* Resultados */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-[#b96e48]/20 to-[#2f2c79]/20 border-[#b96e48]">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="h-6 w-6 text-[#b96e48]" />
                  <h3 className="text-xl font-bold text-white">Retorno sobre Investimento</h3>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-300 mb-1">ROI Mensal</div>
                    <div className="text-4xl font-bold text-white">
                      {formatPercentage(roi.roiPercentage)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-300 mb-1">Economia Mensal</div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(roi.netMonthlySavings)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300 mb-1">Economia Anual</div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(roi.annualSavings)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-gray-300 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Payback</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {roi.paybackMonths < 1 ? '< 1' : roi.paybackMonths.toFixed(1)} meses
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Detalhamento de Economia</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#b96e48]" />
                      <span className="text-gray-300">Produção de Relatórios</span>
                    </div>
                    <span className="text-white font-semibold">
                      {formatCurrency(roi.breakdown.savings.reportProduction)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#b96e48]" />
                      <span className="text-gray-300">Problemas de Conformidade</span>
                    </div>
                    <span className="text-white font-semibold">
                      {formatCurrency(roi.breakdown.savings.compliance)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-[#b96e48]" />
                      <span className="text-gray-300">Auditorias Externas</span>
                    </div>
                    <span className="text-white font-semibold">
                      {formatCurrency(roi.breakdown.savings.audit)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-gray-300 font-semibold">Economia Total Mensal</span>
                    <span className="text-2xl font-bold text-green-400">
                      {formatCurrency(roi.totalMonthlySavings)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Comparação Antes vs Depois</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Custo Atual (sem QIVO)</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(roi.currentMonthlyCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Custo com QIVO {selectedPlan}</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(roi.currentMonthlyCost - roi.netMonthlySavings)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-lg">
                      <span className="text-gray-300 font-semibold">Redução de Custos</span>
                      <span className="text-2xl font-bold text-green-400">
                        {formatPercentage((roi.netMonthlySavings / roi.currentMonthlyCost) * 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Button
                size="lg"
                className="w-full bg-[#b96e48] hover:bg-[#8d4925] text-white"
                onClick={() => (window.location.href = '/#pricing')}
              >
                Assinar Plano {selectedPlan}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
