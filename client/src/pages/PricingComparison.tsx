import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface PlanFeature {
  category: string;
  feature: string;
  start: string | boolean | number;
  pro: string | boolean | number;
  enterprise: string | boolean | number;
}

const PLAN_FEATURES: PlanFeature[] = [
  // Relatórios
  { category: 'Relatórios', feature: 'Relatórios/Mês', start: 1, pro: 5, enterprise: 'Ilimitados' },
  { category: 'Relatórios', feature: 'Padrões Internacionais', start: 3, pro: 6, enterprise: 11 },
  { category: 'Relatórios', feature: 'Exportação PDF/DOCX', start: true, pro: true, enterprise: true },
  { category: 'Relatórios', feature: 'Exportação XLSX', start: false, pro: true, enterprise: true },
  { category: 'Relatórios', feature: 'Desconto em Relatórios Avulsos', start: '10%', pro: '10%', enterprise: '10%' },
  
  // KRCI e Auditoria
  { category: 'KRCI e Auditoria', feature: 'Regras KRCI', start: 30, pro: 70, enterprise: 130 },
  { category: 'KRCI e Auditoria', feature: 'Score de Conformidade', start: true, pro: true, enterprise: true },
  { category: 'KRCI e Auditoria', feature: 'Modo de Scan', start: 'Light', pro: 'Full', enterprise: 'Deep' },
  { category: 'KRCI e Auditoria', feature: 'Recomendações Automáticas', start: 'Básicas', pro: 'Detalhadas', enterprise: 'Completas' },
  
  // Radar Regulatório
  { category: 'Radar Regulatório', feature: 'Tipo de Radar', start: 'Local', pro: 'Global', enterprise: 'Global + Satélite' },
  { category: 'Radar Regulatório', feature: 'Fontes de Dados', start: 4, pro: 12, enterprise: 18 },
  { category: 'Radar Regulatório', feature: 'Alertas Automáticos', start: true, pro: true, enterprise: true },
  { category: 'Radar Regulatório', feature: 'Dados Satelitais', start: false, pro: false, enterprise: true },
  
  // Bridge Regulatória
  { category: 'Bridge Regulatória', feature: 'Conversão entre Padrões', start: true, pro: true, enterprise: true },
  { category: 'Bridge Regulatória', feature: 'Conversão Multinormativa', start: false, pro: true, enterprise: true },
  { category: 'Bridge Regulatória', feature: 'Idiomas Disponíveis', start: 2, pro: 4, enterprise: 4 },
  
  // Customização
  { category: 'Customização', feature: 'Customização de Marca', start: false, pro: 'Relatórios', enterprise: 'Relatórios + Dashboards' },
  { category: 'Customização', feature: 'Logo Personalizado', start: false, pro: true, enterprise: true },
  { category: 'Customização', feature: 'Cores Personalizadas', start: false, pro: true, enterprise: true },
  { category: 'Customização', feature: 'Cabeçalho/Rodapé', start: false, pro: true, enterprise: true },
  
  // IA e Análises
  { category: 'IA e Análises', feature: 'Análises Avançadas', start: false, pro: 'Básica', enterprise: 'Completa' },
  { category: 'IA e Análises', feature: 'Conversão com IA', start: false, pro: true, enterprise: true },
  { category: 'IA e Análises', feature: 'Insights Automáticos', start: false, pro: 'Parcial', enterprise: 'Completo' },
  
  // Suporte
  { category: 'Suporte', feature: 'Canal de Suporte', start: 'Email', pro: 'Email + Chat', enterprise: 'Dedicado' },
  { category: 'Suporte', feature: 'Tempo de Resposta', start: '48h', pro: '24h', enterprise: '4h' },
  { category: 'Suporte', feature: 'Treinamento', start: false, pro: 'Online', enterprise: 'Presencial' },
  
  // Financeiro
  { category: 'Financeiro', feature: 'Painel Financeiro', start: 'Básico', pro: 'Avançado', enterprise: 'Completo' },
  { category: 'Financeiro', feature: 'Monitoramento de Custos', start: true, pro: true, enterprise: true },
  { category: 'Financeiro', feature: 'Previsão de Gastos', start: false, pro: false, enterprise: true },
];

const PLAN_PRICES = {
  START: { monthly: 2500, annual: 27000 },
  PRO: { monthly: 12500, annual: 135000 },
  ENTERPRISE: { monthly: 18900, annual: 204000 },
};

export default function PricingComparison() {
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = ['Todos', ...Array.from(new Set(PLAN_FEATURES.map(f => f.category)))];
  
  const filteredFeatures = selectedCategory === 'Todos' 
    ? PLAN_FEATURES 
    : PLAN_FEATURES.filter(f => f.category === selectedCategory);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderValue = (value: string | boolean | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-green-500 mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-400 mx-auto" />
      );
    }
    
    if (typeof value === 'number') {
      return <span className="font-semibold text-white">{value}</span>;
    }
    
    return <span className="text-gray-300">{value}</span>;
  };

  const handleSelectPlan = (plan: string) => {
    setLocation('/#pricing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#000020]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/logo-Qivo.png" alt="Qivo Mining" className="h-8 w-auto" />
          </div>
          <nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setLocation('/')}>
                Voltar
              </Button>
            </div>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Título */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Comparação de Planos
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Compare todos os recursos e escolha o plano ideal para sua operação
          </p>
        </div>

        {/* Toggle Mensal/Anual */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 rounded-lg p-1 inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#2f2c79] text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-[#2f2c79] text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Anual <span className="text-[#b96e48] text-sm ml-1">(10% off)</span>
            </button>
          </div>
        </div>

        {/* Filtro de Categoria */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-[#b96e48] text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Tabela de Comparação - Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full bg-white/5 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/10">
                <th className="py-4 px-6 text-left text-white font-semibold">Recurso</th>
                <th className="py-4 px-6 text-center">
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-white">Start</div>
                    <div className="text-2xl font-bold text-[#b96e48]">
                      {formatPrice(PLAN_PRICES.START[billingPeriod])}
                    </div>
                    <div className="text-sm text-gray-400">
                      {billingPeriod === 'monthly' ? '/mês' : '/ano'}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-[#2f2c79] hover:bg-[#b96e48]"
                      onClick={() => handleSelectPlan('START')}
                    >
                      Selecionar
                    </Button>
                  </div>
                </th>
                <th className="py-4 px-6 text-center bg-[#b96e48]/10">
                  <div className="space-y-2">
                    <div className="inline-block bg-[#b96e48] text-white px-3 py-1 rounded-full text-xs font-bold mb-2">
                      POPULAR
                    </div>
                    <div className="text-xl font-bold text-white">Pro</div>
                    <div className="text-2xl font-bold text-[#b96e48]">
                      {formatPrice(PLAN_PRICES.PRO[billingPeriod])}
                    </div>
                    <div className="text-sm text-gray-400">
                      {billingPeriod === 'monthly' ? '/mês' : '/ano'}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-[#b96e48] hover:bg-[#8d4925]"
                      onClick={() => handleSelectPlan('PRO')}
                    >
                      Selecionar
                    </Button>
                  </div>
                </th>
                <th className="py-4 px-6 text-center">
                  <div className="space-y-2">
                    <div className="text-xl font-bold text-white">Enterprise</div>
                    <div className="text-2xl font-bold text-[#b96e48]">
                      {formatPrice(PLAN_PRICES.ENTERPRISE[billingPeriod])}
                    </div>
                    <div className="text-sm text-gray-400">
                      {billingPeriod === 'monthly' ? '/mês' : '/ano'}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-[#2f2c79] hover:bg-[#b96e48]"
                      onClick={() => handleSelectPlan('ENTERPRISE')}
                    >
                      Selecionar
                    </Button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.map((item, index) => (
                <tr
                  key={index}
                  className={`border-t border-white/10 ${
                    index % 2 === 0 ? 'bg-white/5' : ''
                  }`}
                >
                  <td className="py-4 px-6">
                    <div className="text-sm text-gray-400">{item.category}</div>
                    <div className="text-white font-medium">{item.feature}</div>
                  </td>
                  <td className="py-4 px-6 text-center">{renderValue(item.start)}</td>
                  <td className="py-4 px-6 text-center bg-[#b96e48]/5">{renderValue(item.pro)}</td>
                  <td className="py-4 px-6 text-center">{renderValue(item.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards - Mobile */}
        <div className="lg:hidden space-y-6">
          {['START', 'PRO', 'ENTERPRISE'].map((plan) => (
            <Card key={plan} className={`p-6 ${plan === 'PRO' ? 'border-[#b96e48] border-2' : 'border-white/10'}`}>
              {plan === 'PRO' && (
                <div className="inline-block bg-[#b96e48] text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
                  POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>
              <div className="text-3xl font-bold text-[#b96e48] mb-4">
                {formatPrice(PLAN_PRICES[plan as keyof typeof PLAN_PRICES][billingPeriod])}
                <span className="text-sm text-gray-400 ml-2">
                  {billingPeriod === 'monthly' ? '/mês' : '/ano'}
                </span>
              </div>
              <Button
                className={`w-full mb-6 ${
                  plan === 'PRO'
                    ? 'bg-[#b96e48] hover:bg-[#8d4925]'
                    : 'bg-[#2f2c79] hover:bg-[#b96e48]'
                }`}
                onClick={() => handleSelectPlan(plan)}
              >
                Selecionar {plan}
              </Button>
              <div className="space-y-3">
                {filteredFeatures.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-white/10">
                    <div>
                      <div className="text-xs text-gray-400">{item.category}</div>
                      <div className="text-sm text-white">{item.feature}</div>
                    </div>
                    <div className="text-right">
                      {renderValue(item[plan.toLowerCase() as keyof typeof item])}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* CTA Final */}
        <div className="text-center mt-12">
          <p className="text-gray-300 mb-4">
            Ainda tem dúvidas? Entre em contato conosco
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => setLocation('/#contact')}
          >
            Falar com Especialista <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
