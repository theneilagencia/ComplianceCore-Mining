import { useState } from 'react';
import { Check, Zap, Building2, Sparkles } from 'lucide-react';
import { redirectToCheckout } from '../lib/stripe';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: 'PRO' | 'ENTERPRISE') => {
    setLoading(plan);
    setError(null);
    
    try {
      await redirectToCheckout({ plan, billingPeriod });
    } catch (err: any) {
      setError(err.message || 'Falha ao iniciar checkout');
      setLoading(null);
    }
  };

  const plans = [
    {
      name: 'START',
      price: billingPeriod === 'monthly' ? 0 : 0,
      period: 'Gratuito',
      description: 'Para começar e testar a plataforma',
      icon: Sparkles,
      features: [
        '1 relatório técnico/mês',
        '1 projeto ativo',
        'Geração de relatórios JORC',
        'Auditoria básica KRCI',
        'Exportação em PDF',
        'Radar Regulatória Brasil',
        'Watermark nos PDFs',
      ],
      cta: 'Começar Grátis',
      popular: false,
      action: () => window.location.href = '/register',
    },
    {
      name: 'PRO',
      price: billingPeriod === 'monthly' ? 899 : 9600,
      period: billingPeriod === 'monthly' ? '/mês' : '/ano',
      savings: billingPeriod === 'annual' ? 'Economize US$ 1.188/ano' : null,
      description: 'Para empresas que precisam de compliance completo',
      icon: Zap,
      features: [
        '5 relatórios técnicos/mês',
        '3 projetos ativos',
        'Todos os padrões (JORC, NI 43-101, PERC, SAMREC)',
        'Auditoria completa KRCI (22 regras)',
        'Pré-certificação (ASX, TSX, JSE, CRIRSCO)',
        'Exportação multi-formato (PDF, DOCX, XLSX)',
        '**Módulo ESG completo** (GRI, SASB, IFC, IRMA)',
        'Dashboard ESG com métricas',
        'Gestão de compensações ambientais',
        'Radar Regulatória Internacional',
        'Branding completo (logo, cores)',
        'Sem watermark',
        'Suporte por email',
      ],
      cta: 'Assinar PRO',
      popular: true,
      action: () => handleCheckout('PRO'),
    },
    {
      name: 'ENTERPRISE',
      price: billingPeriod === 'monthly' ? 1990 : 21000,
      period: billingPeriod === 'monthly' ? '/mês' : '/ano',
      savings: billingPeriod === 'annual' ? 'Economize US$ 2.880/ano' : null,
      description: 'Para grandes empresas com múltiplos projetos',
      icon: Building2,
      features: [
        '15 relatórios técnicos/mês',
        'Projetos ilimitados',
        'Todos os recursos PRO',

        '**APIs de preços em tempo real** (8 APIs integradas)',
        'Dados macroeconômicos (câmbio, inflação, juros)',
        'Extração automática de dados de PDFs',
        'Análise de comparáveis de mercado',
        'REST API corporativa (50+ endpoints)',
        'Suporte prioritário',
        'SLA 99.9%',
        'Onboarding dedicado',
      ],
      cta: 'Assinar ENTERPRISE',
      popular: false,
      action: () => handleCheckout('ENTERPRISE'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Planos e Preços
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Escolha o plano ideal para sua empresa
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/5 rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#2f2c79] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-[#2f2c79] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Economize até 12%
              </span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loading === plan.name;
            
            return (
              <div
                key={plan.name}
                className={`relative bg-white/5 rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-[#2f2c79] text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    MAIS POPULAR
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-5xl font-bold text-white">
                        {plan.price === 0 ? 'Grátis' : `$${plan.price.toLocaleString()}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-400 ml-2">{plan.period}</span>
                      )}
                    </div>
                    {plan.savings && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        {plan.savings}
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={plan.action}
                    disabled={isLoading}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-[#2f2c79] text-white hover:bg-[#b96e48]'
                        : 'bg-[#171a4a] text-white hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? 'Processando...' : plan.cta}
                  </button>

                  {/* Features */}
                  <ul className="mt-8 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            <div className="bg-white/5/5 rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-lg text-white mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-400">
                Sim! Você pode cancelar sua assinatura a qualquer momento através do portal de gerenciamento. Não há taxas de cancelamento.
              </p>
            </div>
            <div className="bg-white/5/5 rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-lg text-white mb-2">
                Como funciona o período de teste?
              </h3>
              <p className="text-gray-400">
                O plano START é completamente gratuito e não requer cartão de crédito. Você pode testar a plataforma sem compromisso.
              </p>
            </div>
            <div className="bg-white/5/5 rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-lg text-white mb-2">
                Posso fazer upgrade ou downgrade?
              </h3>
              <p className="text-gray-400">
                Sim! Você pode alterar seu plano a qualquer momento. O valor será ajustado proporcionalmente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

