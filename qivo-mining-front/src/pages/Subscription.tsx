import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Download,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface License {
  id: string;
  plan: string;
  status: string;
  billingPeriod: string;
  validFrom: string;
  validUntil: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
}

interface Stats {
  reportsUsed: number;
  reportsLimit: number;
  projectsActive: number;
  projectsLimit: number;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount: number;
  currency: string;
  created: string;
  pdfUrl: string;
  hostedUrl: string;
}

interface SubscriptionData {
  license: License;
  subscription: Subscription | null;
  stats: Stats;
}

const PLAN_NAMES: Record<string, string> = {
  START: 'Start (Gratuito)',
  PRO: 'PRO',
  ENTERPRISE: 'Enterprise',
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  PRO: { monthly: 899, annual: 9600 },
  ENTERPRISE: { monthly: 1990, annual: 21000 },
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  trialing: 'bg-blue-100 text-blue-800',
  past_due: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  unpaid: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Período de teste',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
};

export default function Subscription() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [changePlanLoading, setChangePlanLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
    fetchInvoices();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/subscription`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar dados da assinatura');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/invoices`, {
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        setInvoices(result.invoices || []);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso até o final do período atual.')) {
      return;
    }

    setCancelLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/cancel`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao cancelar assinatura');
      }

      alert('Assinatura cancelada com sucesso!');
      fetchSubscriptionData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  const handleChangePlan = async (newPlan: string, newPeriod: string) => {
    if (!confirm(`Deseja alterar para o plano ${PLAN_NAMES[newPlan]} ${newPeriod === 'monthly' ? 'Mensal' : 'Anual'}?`)) {
      return;
    }

    setChangePlanLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plan: newPlan,
          billingPeriod: newPeriod,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao alterar plano');
      }

      alert('Plano alterado com sucesso!');
      fetchSubscriptionData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setChangePlanLoading(false);
    }
  };

  const handleOpenPortal = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/license/portal`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Falha ao abrir portal');
      }

      const result = await response.json();
      window.location.href = result.url;
    } catch (err: any) {
      alert(err.message);
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-400">Carregando informações da assinatura...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="bg-white/5 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Erro ao Carregar</h2>
          <p className="text-gray-400 mb-6">{error || 'Não foi possível carregar os dados da assinatura'}</p>
          <button
            onClick={() => setLocation('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { license, subscription, stats } = data;
  const isFree = license.plan === 'START';
  const isActive = subscription?.status === 'active';
  const willCancel = subscription?.cancelAtPeriodEnd;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLocation('/dashboard')}
                className="p-2 hover:bg-[#171a4a] rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Gerenciar Assinatura</h1>
                <p className="text-gray-400 mt-1">Visualize e gerencie seu plano e faturas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan Card */}
          <div className="lg:col-span-2 bg-white/5 rounded-xl shadow-sm border border-white/20 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Plano {PLAN_NAMES[license.plan]}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      STATUS_COLORS[subscription?.status || 'active']
                    }`}
                  >
                    {STATUS_LABELS[subscription?.status || 'active']}
                  </span>
                  {willCancel && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      Cancela em {formatDate(subscription!.currentPeriodEnd)}
                    </span>
                  )}
                </div>
              </div>
              {!isFree && (
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {formatCurrency(
                      PLAN_PRICES[license.plan]?.[license.billingPeriod as 'monthly' | 'annual'] || 0,
                      'USD'
                    )}
                  </p>
                  <p className="text-sm text-gray-400">
                    /{license.billingPeriod === 'monthly' ? 'mês' : 'ano'}
                  </p>
                </div>
              )}
            </div>

            {/* Usage Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#000020] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">Relatórios</span>
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{stats.reportsUsed}</span>
                  <span className="text-sm text-gray-400">
                    / {stats.reportsLimit === -1 ? '∞' : stats.reportsLimit}
                  </span>
                </div>
                <div className="mt-2 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        stats.reportsLimit === -1
                          ? 0
                          : Math.min((stats.reportsUsed / stats.reportsLimit) * 100, 100)
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-[#000020] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-400">Projetos Ativos</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white">{stats.projectsActive}</span>
                  <span className="text-sm text-gray-400">
                    / {stats.projectsLimit === -1 ? '∞' : stats.projectsLimit}
                  </span>
                </div>
                <div className="mt-2 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        stats.projectsLimit === -1
                          ? 0
                          : Math.min((stats.projectsActive / stats.projectsLimit) * 100, 100)
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Subscription Details */}
            {subscription && (
              <div className="border-t border-white/20 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Detalhes da Assinatura</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Período atual</span>
                    <span className="font-medium text-white">
                      {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Próxima cobrança</span>
                    <span className="font-medium text-white">
                      {willCancel ? 'Não haverá' : formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID da Assinatura</span>
                    <span className="font-mono text-sm text-gray-400">{subscription.id}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-white/20 pt-6 mt-6">
              <div className="flex flex-wrap gap-3">
                {!isFree && (
                  <>
                    <button
                      onClick={handleOpenPortal}
                      disabled={portalLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {portalLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4" />
                      )}
                      Gerenciar Pagamento
                    </button>
                    {!willCancel && (
                      <button
                        onClick={handleCancelSubscription}
                        disabled={cancelLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                        Cancelar Assinatura
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setLocation('/pricing')}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-gray-300 rounded-lg hover:bg-[#000020] transition"
                >
                  <TrendingUp className="w-4 h-4" />
                  {isFree ? 'Fazer Upgrade' : 'Alterar Plano'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Upgrade Options */}
            {!isFree && license.plan === 'PRO' && (
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Upgrade para Enterprise</h3>
                <p className="text-purple-100 text-sm mb-4">
                  Projetos ilimitados, API completa e suporte 24/7
                </p>
                <button
                  onClick={() => handleChangePlan('ENTERPRISE', license.billingPeriod)}
                  disabled={changePlanLoading}
                  className="w-full px-4 py-2 bg-white/5 text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium disabled:opacity-50"
                >
                  {changePlanLoading ? 'Processando...' : 'Fazer Upgrade'}
                </button>
              </div>
            )}

            {/* Billing Period Toggle */}
            {!isFree && license.billingPeriod === 'monthly' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Economize 12%</h3>
                <p className="text-green-700 text-sm mb-4">Mude para cobrança anual e economize!</p>
                <button
                  onClick={() => handleChangePlan(license.plan, 'annual')}
                  disabled={changePlanLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                >
                  {changePlanLoading ? 'Processando...' : 'Mudar para Anual'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invoices Section */}
        {invoices.length > 0 && (
          <div className="mt-8 bg-white/5 rounded-xl shadow-sm border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Histórico de Faturas</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Data</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Número</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Valor</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-slate-100 hover:bg-[#000020]">
                      <td className="py-4 px-4 text-sm text-white">{formatDate(invoice.created)}</td>
                      <td className="py-4 px-4 text-sm font-mono text-gray-400">{invoice.number || '-'}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'open'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {invoice.status === 'paid' ? 'Paga' : invoice.status === 'open' ? 'Aberta' : 'Não paga'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-semibold text-white text-right">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.pdfUrl && (
                            <a
                              href={invoice.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-[#171a4a] rounded-lg transition"
                              title="Baixar PDF"
                            >
                              <Download className="w-4 h-4 text-gray-400" />
                            </a>
                          )}
                          {invoice.hostedUrl && (
                            <a
                              href={invoice.hostedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-[#171a4a] rounded-lg transition"
                              title="Ver fatura"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

