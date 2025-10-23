import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface LicenseStats {
  plan: string;
  status: string;
  reportsUsed: number;
  reportsLimit: number;
  reportsRemaining: number;
  usagePercentage: number;
  projectsLimit: number;
  daysRemaining: number | null;
  validUntil: string | null;
  billingPeriod: string | null;
}

export default function AccountPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    try {
      const response = await fetch('/api/license/status', {
        credentials: 'include', // Send cookies for authentication
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch license status');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/payment/portal');
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert('Erro ao abrir portal de gerenciamento');
    }
  };

  const handleUpgrade = () => {
    setLocation('/pricing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Erro ao carregar dados'}</p>
          <button
            onClick={() => setLocation('/')}
            className="text-blue-600 hover:underline"
          >
            Voltar para Início
          </button>
        </div>
      </div>
    );
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'START': return 'bg-gray-100 text-gray-800';
      case 'PRO': return 'bg-blue-100 text-blue-800';
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-orange-100 text-orange-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              JI
            </div>
            <div>
              <div className="font-bold text-lg">Minha Conta</div>
              <div className="text-xs text-gray-500">QIVO Mining</div>
            </div>
          </div>
          <button
            onClick={() => setLocation('/account')}
            className="text-gray-600 hover:text-gray-900"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Plan Overview */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Plano Atual</h2>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPlanColor(stats.plan)}`}>
                  {stats.plan}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(stats.status)}`}>
                  {stats.status === 'active' ? 'Ativo' : stats.status}
                </span>
              </div>
            </div>
            
            {stats.plan !== 'ENTERPRISE' && (
              <button
                onClick={handleUpgrade}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
              >
                Fazer Upgrade
              </button>
            )}
          </div>

          {/* Usage Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Relatórios Este Mês
              </h3>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>{stats.reportsUsed} de {stats.reportsLimit} usados</span>
                  <span className="font-semibold">{stats.usagePercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stats.usagePercentage >= 90 ? 'bg-red-500' :
                      stats.usagePercentage >= 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${stats.usagePercentage}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {stats.reportsRemaining} relatórios restantes
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">
                Projetos Ativos
              </h3>
              <p className="text-3xl font-bold">
                {stats.projectsLimit === -1 ? '∞' : stats.projectsLimit}
              </p>
              <p className="text-sm text-gray-600">
                {stats.projectsLimit === -1 ? 'Ilimitados' : `Limite: ${stats.projectsLimit} projetos`}
              </p>
            </div>
          </div>
        </div>

        {/* Billing Info */}
        {stats.plan !== 'START' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Informações de Cobrança</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Período de Cobrança:</span>
                <span className="font-semibold">
                  {stats.billingPeriod === 'annual' ? 'Anual' : 'Mensal'}
                </span>
              </div>

              {stats.validUntil && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Próxima Renovação:</span>
                  <span className="font-semibold">
                    {new Date(stats.validUntil).toLocaleDateString('pt-BR')}
                    {stats.daysRemaining !== null && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({stats.daysRemaining} dias)
                      </span>
                    )}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t">
                <button
                  onClick={handleManageSubscription}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Gerenciar Assinatura
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Atualizar método de pagamento, ver faturas, cancelar
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Features */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Recursos do Seu Plano</h2>
          
          <ul className="space-y-2">
            {stats.plan === 'START' && (
              <>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>1 relatório por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>1 projeto ativo</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Geração de relatórios JORC</span>
                </li>
              </>
            )}

            {stats.plan === 'PRO' && (
              <>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>5 relatórios por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Até 3 projetos ativos</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Auditoria KRCI completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Pré-certificação e conversão de padrões</span>
                </li>
              </>
            )}

            {stats.plan === 'ENTERPRISE' && (
              <>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>15 relatórios por mês</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Projetos ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Todos os recursos PRO + API access</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Suporte dedicado 24/7</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

