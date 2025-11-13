import { useState } from 'react';
import { CreditCard, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { openCustomerPortal } from '../lib/stripe';

interface SubscriptionManagerProps {
  plan: 'START' | 'PRO' | 'ENTERPRISE';
  status?: 'active' | 'suspended' | 'cancelled';
  billingPeriod?: 'monthly' | 'annual';
  nextBillingDate?: Date;
}

export default function SubscriptionManager({
  plan,
  status = 'active',
  billingPeriod,
  nextBillingDate,
}: SubscriptionManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      await openCustomerPortal();
    } catch (err: any) {
      setError(err.message || 'Falha ao abrir portal de gerenciamento');
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = () => {
    switch (plan) {
      case 'START':
        return 'from-gray-500 to-gray-600';
      case 'PRO':
        return 'from-blue-500 to-indigo-600';
      case 'ENTERPRISE':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            Ativo
          </span>
        );
      case 'suspended':
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
            Suspenso
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
            Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  const getPlanPrice = () => {
    if (plan === 'START') return 'Gratuito';
    if (plan === 'PRO') {
      return billingPeriod === 'annual' ? 'US$ 9.600/ano' : 'US$ 899/mês';
    }
    if (plan === 'ENTERPRISE') {
      return billingPeriod === 'annual' ? 'US$ 21.000/ano' : 'US$ 1.990/mês';
    }
    return '';
  };

  return (
    <div className="bg-white/5 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            Assinatura Atual
          </h3>
          <p className="text-gray-400 text-sm">
            Gerencie sua assinatura e método de pagamento
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Plan Card */}
      <div className={`bg-gradient-to-r ${getPlanColor()} rounded-lg p-6 text-white mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-2xl font-bold">{plan}</h4>
            <p className="text-white/80 text-sm">{getPlanPrice()}</p>
          </div>
          <CreditCard className="w-8 h-8 opacity-80" />
        </div>

        {nextBillingDate && status === 'active' && (
          <div className="text-sm text-white/90">
            Próxima cobrança: {new Date(nextBillingDate).toLocaleDateString('pt-BR')}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {plan !== 'START' && (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 bg-[#2f2c79] text-white font-semibold rounded-lg hover:bg-[#b96e48] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Gerenciar Assinatura
              </>
            )}
          </button>
        )}

        {plan === 'START' && (
          <a
            href="/pricing"
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            Fazer Upgrade
            <ExternalLink className="w-5 h-5 ml-2" />
          </a>
        )}

        {plan === 'PRO' && (
          <a
            href="/pricing"
            className="w-full flex items-center justify-center px-4 py-3 bg-[#171a4a] text-gray-300 font-semibold rounded-lg hover:bg-gray-200 transition-all"
          >
            Upgrade para ENTERPRISE
          </a>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 pt-6 border-t border-white/20">
        <p className="text-sm text-gray-400">
          No portal de gerenciamento você pode:
        </p>
        <ul className="mt-2 space-y-1 text-sm text-gray-400">
          <li>• Atualizar método de pagamento</li>
          <li>• Ver histórico de faturas</li>
          <li>• Fazer upgrade ou downgrade</li>
          <li>• Cancelar assinatura</li>
        </ul>
      </div>
    </div>
  );
}

