import { useState } from 'react';
import { useLocation } from 'wouter';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  price: number;
  priceAnnual?: number;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    name: 'START',
    price: 0,
    description: 'Ideal para geólogos e consultores independentes',
    features: [
      { text: '1 relatório por mês', included: true },
      { text: '1 projeto ativo', included: true },
      { text: 'Geração de relatórios JORC/CBRR', included: true },
      { text: 'Exportação PDF', included: true },
      { text: 'Auditoria KRCI básica', included: true },
      { text: 'Suporte por email', included: true },
      { text: 'Pré-certificação', included: false },
      { text: 'Conversão de padrões', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
    cta: 'Começar Grátis',
  },
  {
    name: 'PRO',
    price: 899,
    priceAnnual: 9600,
    description: 'Para consultorias e mineradoras de porte médio',
    features: [
      { text: '5 relatórios por mês', included: true },
      { text: 'Até 3 projetos ativos', included: true },
      { text: 'Todos os padrões (JORC, NI43, CBRR, PERC, SAMREC)', included: true },
      { text: 'Auditoria KRCI completa (20 regras)', included: true },
      { text: 'Pré-certificação ASX, TSX, JSE', included: true },
      { text: 'Conversão entre padrões', included: true },
      { text: 'Exportação DOCX, XLSX', included: true },
      { text: 'Suporte prioritário', included: true },
      { text: 'API access', included: false },
    ],
    popular: true,
    cta: 'Assinar PRO',
  },
  {
    name: 'ENTERPRISE',
    price: 1990,
    priceAnnual: 21000,
    description: 'Para grandes mineradoras e holdings',
    features: [
      { text: '15 relatórios por mês', included: true },
      { text: 'Projetos ilimitados', included: true },
      { text: 'Todos os recursos PRO', included: true },
      { text: 'Certificação CRIRSCO completa', included: true },
      { text: 'Gestão multi-tenant', included: true },
      { text: 'API access completo', included: true },
      { text: 'White-label disponível', included: true },
      { text: 'Suporte dedicado 24/7', included: true },
      { text: 'SLA garantido', included: true },
    ],
    cta: 'Assinar ENTERPRISE',
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleSubscribe = async (planName: string) => {
    if (planName === 'START') {
      // Free plan - just redirect to signup
      setLocation('/register');
      return;
    }

    setLoading(planName);

    try {
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for authentication
        body: JSON.stringify({
          plan: planName,
          billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao processar pagamento');
      setLoading(null);
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Gratuito';
    
    const price = billingPeriod === 'annual' && plan.priceAnnual 
      ? plan.priceAnnual 
      : plan.price;
    
    const period = billingPeriod === 'annual' ? '/ano' : '/mês';
    
    return `US$ ${price.toLocaleString()}${period}`;
  };

  const getSavings = (plan: Plan) => {
    if (!plan.priceAnnual || billingPeriod !== 'annual') return null;
    
    const monthlyCost = plan.price * 12;
    const savings = monthlyCost - plan.priceAnnual;
    const percentage = Math.round((savings / monthlyCost) * 100);
    
    return `Economize ${percentage}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/5/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/qivo-logo.png" alt="QIVO Mining" className="w-10 h-10 rounded-lg" />
            <div>
              <div className="font-bold text-lg">QIVO Mining</div>
              <div className="text-xs text-gray-500">Infraestrutura de Governança Minerária Digital</div>
            </div>
          </div>
          <button
            onClick={() => setLocation('/')}
            className="text-gray-400 hover:text-white"
          >
            Voltar
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Escolha o Plano Ideal para Seu Negócio
        </h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
          Relatórios técnicos de mineração conformes aos padrões internacionais.
          Comece grátis ou escolha um plano profissional.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-4 bg-white/5 rounded-full p-2 shadow-lg mb-12">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-[#2f2c79] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-6 py-2 rounded-full transition-all ${
              billingPeriod === 'annual'
                ? 'bg-[#2f2c79] text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anual
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Economize até 20%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-white/5 rounded-2xl shadow-xl p-8 ${
                plan.popular ? 'ring-4 ring-blue-600 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2f2c79] text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-bold">{getPrice(plan)}</span>
                </div>
                
                {getSavings(plan) && (
                  <div className="text-green-600 text-sm font-semibold">
                    {getSavings(plan)}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={loading === plan.name}
                className={`w-full py-3 rounded-lg font-semibold mb-2 transition-all ${
                  plan.popular
                    ? 'bg-[#2f2c79] text-white hover:bg-[#b96e48]'
                    : 'bg-[#171a4a] text-white hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {loading === plan.name ? 'Processando...' : plan.cta}
              </button>
              {plan.price > 0 && (
                <p className="text-xs text-gray-500 mb-4">
                  ✓ Garantia de 30 dias | ✓ Cancele quando quiser
                </p>
              )}

              <ul className="space-y-3 text-left">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    {feature.included ? (
                      <svg
                        className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-300 mt-0.5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span
                      className={
                        feature.included ? 'text-gray-300' : 'text-gray-400'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-24 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Comparação Detalhada de Planos
          </h2>
          
          <div className="bg-white/5/5 rounded-2xl shadow-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Recursos</th>
                  <th className="px-6 py-4 text-center">START</th>
                  <th className="px-6 py-4 text-center bg-blue-700">PRO</th>
                  <th className="px-6 py-4 text-center">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Relatórios por mês</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-center bg-blue-50 font-semibold">5</td>
                  <td className="px-6 py-4 text-center">15</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Projetos ativos</td>
                  <td className="px-6 py-4 text-center">1</td>
                  <td className="px-6 py-4 text-center bg-blue-50 font-semibold">3</td>
                  <td className="px-6 py-4 text-center">Ilimitados</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Padrões suportados</td>
                  <td className="px-6 py-4 text-center">JORC, CBRR</td>
                  <td className="px-6 py-4 text-center bg-blue-50 font-semibold">Todos (6)</td>
                  <td className="px-6 py-4 text-center">Todos (6)</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Auditoria KRCI</td>
                  <td className="px-6 py-4 text-center">Básica</td>
                  <td className="px-6 py-4 text-center bg-blue-50 font-semibold">Completa (22 regras)</td>
                  <td className="px-6 py-4 text-center">Completa (22 regras)</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Pré-certificação</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center bg-blue-50 text-green-600">✓ ASX, TSX, JSE, ANM</td>
                  <td className="px-6 py-4 text-center text-green-600">✓ Todos + CRIRSCO</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Conversão de padrões</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center bg-blue-50 text-green-600">✓</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Exportação</td>
                  <td className="px-6 py-4 text-center">PDF</td>
                  <td className="px-6 py-4 text-center bg-blue-50 font-semibold">PDF, DOCX, XLSX</td>
                  <td className="px-6 py-4 text-center">PDF, DOCX, XLSX</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">API Access</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center bg-blue-50 text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-green-600">✓ Completo</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">White-label</td>
                  <td className="px-6 py-4 text-center text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center bg-blue-50 text-gray-400">✗</td>
                  <td className="px-6 py-4 text-center text-green-600">✓</td>
                </tr>
                <tr className="hover:bg-[#000020]">
                  <td className="px-6 py-4 font-medium">Suporte</td>
                  <td className="px-6 py-4 text-center">Email</td>
                  <td className="px-6 py-4 text-center bg-blue-50 font-semibold">Prioritário</td>
                  <td className="px-6 py-4 text-center">Dedicado 24/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto text-left">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white/5/5 rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-2">
                Posso mudar de plano depois?
              </h3>
              <p className="text-gray-400">
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento.
                O valor será ajustado proporcionalmente.
              </p>
            </div>

            <div className="bg-white/5/5 rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-2">
                O que acontece se eu exceder o limite de relatórios?
              </h3>
              <p className="text-gray-400">
                Você será notificado e poderá fazer upgrade para um plano superior
                ou aguardar a renovação mensal do seu limite.
              </p>
            </div>

            <div className="bg-white/5/5 rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-2">
                Há garantia de reembolso?
              </h3>
              <p className="text-gray-400">
                Sim! Oferecemos garantia de 30 dias. Se não ficar satisfeito,
                devolvemos seu dinheiro sem perguntas.
              </p>
            </div>

            <div className="bg-white/5/5 rounded-lg p-6 shadow">
              <h3 className="font-semibold mb-2">
                Quais métodos de pagamento são aceitos?
              </h3>
              <p className="text-gray-400">
                Aceitamos cartões de crédito (Visa, Mastercard, Amex) e débito
                através do Stripe, nossa plataforma de pagamentos segura.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/5 mt-24 py-8">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>© 2025 QIVO Mining</p>
          <p className="text-sm mt-2">
            Infraestrutura de Governança Minerária Digital
          </p>
        </div>
      </footer>
    </div>
  );
}

