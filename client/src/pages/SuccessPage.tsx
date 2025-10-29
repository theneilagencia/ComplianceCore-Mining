import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function SuccessPage() {
  const [, setLocation] = useLocation();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Countdown para redirecionamento
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLocation('/account');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-12 text-center">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-4">
          Pagamento Confirmado!
        </h1>

        {/* Description */}
        <p className="text-xl text-gray-600 mb-8">
          Sua assinatura foi ativada com sucesso. Bem-vindo ao ComplianceCore Mining!
        </p>

        {/* Features Unlocked */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">
            ✨ Recursos Desbloqueados
          </h2>
          <ul className="text-left space-y-2 text-gray-700">
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Relatórios técnicos ilimitados
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Auditoria KRCI completa (22 regras)
            </li>
            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Módulo ESG com 4 frameworks
            </li>

            <li className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Branding personalizado
            </li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Você receberá um email de confirmação em instantes.
          </p>
          <p className="text-sm text-gray-500">
            Redirecionando para o dashboard em <span className="font-bold text-blue-600">{countdown}</span> segundos...
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setLocation('/account')}
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          Ir para o Dashboard
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>

        {/* Support Link */}
        <p className="mt-8 text-sm text-gray-500">
          Precisa de ajuda?{' '}
          <a href="/contact" className="text-blue-600 hover:underline">
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
}

