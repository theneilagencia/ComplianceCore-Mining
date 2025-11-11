import { useState } from 'react';
import { Check, Zap, Building2, Sparkles } from 'lucide-react';
import { redirectToCheckout } from '../lib/stripe';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (plan: 'START' | 'PRO' | 'ENTERPRISE') => {
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
      price: billingPeriod === 'monthly' ? 2500 : 27000, // 10% desconto anual
      period: billingPeriod === 'monthly' ? '/mês' : '/ano',
      savings: billingPeriod === 'annual' ? 'Economize US$ 3.000/ano' : null,
      description: 'Para consultores e pequenas mineradoras',
      icon: Sparkles,
      features: [
        '1 relatório técnico/mês',
        '1 projeto ativo',
        'Geração de relatórios JORC',
        'Auditoria básica KRCI',
        'Exportação em PDF',
        'Radar Regulatória Local',
        'Suporte por email',
      ],
      cta: 'Assinar START',
      popular: false,
      action: () => handleCheckout('START'),
    },
    {
      name: 'PRO',
      price: billingPeriod === 'monthly' ? 12500 : 135000, // 10% desconto anual
      period: billingPeriod === 'monthly' ? '/mês' : '/ano',
      savings: billingPeriod === 'annual' ? 'Economize US$ 15.000/ano' : null,
      description: 'Para consultorias regionais',
      icon: Zap,
      features: [
        '5 relatórios técnicos/mês',
        '3 projetos ativos',
        'Todos os padrões (JORC, NI 43-101, PERC, SAMREC)',
        'Auditoria completa KRCI',
        'Pré-certificação (ASX, TSX, JSE)',
        'Exportação multi-formato (PDF, DOCX, XLSX)',
        'Radar Regulatória Global',
        'Conversão multinormativa',
        'Branding personalizado',
        'Suporte prioritário',
      ],
      cta: 'Assinar PRO',
      popular: true,
      action: () => handleCheckout('PRO'),
    },
    {
      name: 'ENTERPRISE',
      price: billingPeriod === 'monthly' ? 18900 : 170100, // 25% desconto anual
      period: billingPeriod === 'monthly' ? '/mês' : '/ano',
      savings: billingPeriod === 'annual' ? 'Economize US$ 56.700/ano' : null,
      description: 'Para mineradoras e órgãos reguladores',
      icon: Building2,
      features: [
        'Relatórios técnicos ilimitados',
        'Projetos ilimitados',
        'Todos os recursos PRO',
        'Auditoria profunda',
        'Integrações corporativas',
        'APIs de preços em tempo real',
        'Dados macroeconômicos',
        'REST API corporativa (50+ endpoints)',
        'Suporte dedicado 24/7',
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
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Planos e Preços
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Escolha o plano ideal para sua empresa
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#2f2c79] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === 'annual'
                  ? 'bg-[#2f2c79] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Economize até 25%
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
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-[#2f2c79] scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#2f2c79] to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Icon className="w-12 h-12 mx-auto mb-4 text-[#2f2c79]" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      US$ {plan.price.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  
                  {plan.savings && (
                    <p className="text-green-600 text-sm font-semibold">
                      {plan.savings}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={plan.action}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-[#2f2c79] text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Processando...' : plan.cta}
                </button>

                {plan.name !== 'START' && (
                  <p className="text-center text-xs text-gray-500 mt-4">
                    ✓ Garantia de 30 dias | ✓ Cancele quando quiser
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Perguntas Frequentes</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-2">Posso mudar de plano depois?</h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. O valor será ajustado proporcionalmente.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-2">O que acontece se eu exceder o limite de relatórios?</h3>
              <p className="text-gray-600">
                Você será notificado e poderá fazer upgrade para um plano superior ou aguardar a renovação mensal do seu limite.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-2">Há garantia de reembolso?</h3>
              <p className="text-gray-600">
                Sim! Oferecemos garantia de 30 dias. Se não ficar satisfeito, devolvemos seu dinheiro sem perguntas.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="font-semibold text-lg mb-2">Quais métodos de pagamento são aceitos?</h3>
              <p className="text-gray-600">
                Aceitamos cartões de crédito (Visa, Mastercard, Amex) e débito através do Stripe, nossa plataforma de pagamentos segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
