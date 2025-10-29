import { useLocation } from 'wouter';

export default function CancelPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-orange-600"
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
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">
          Pagamento Cancelado
        </h1>

        <p className="text-gray-600 mb-6">
          Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            Ainda tem dúvidas? Entre em contato com nosso suporte ou experimente
            o plano START gratuito.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setLocation('/pricing')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
          >
            Ver Planos Novamente
          </button>

          <button
            onClick={() => setLocation('/')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
          >
            Voltar para Início
          </button>

          <button
            onClick={() => setLocation('/register')}
            className="w-full text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all"
          >
            Começar com Plano Gratuito
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Precisa de ajuda? <a href="mailto:support@jorcintelligence.com" className="text-blue-600 hover:underline">Fale conosco</a>
        </p>
      </div>
    </div>
  );
}

