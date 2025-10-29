import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';

export default function SuccessPage() {
 const [, setLocation] = useLocation();
 const search = useSearch();
 const [countdown, setCountdown] = useState(5);

 useEffect(() => {
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
 }, [navigate]);

 return (
 <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
 <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
 {/* Success Icon */}
 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
 <svg
 className="w-12 h-12 text-green-600"
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
 </div>

 <h1 className="text-3xl font-bold text-white mb-4">
 Pagamento Confirmado! 
 </h1>

 <p className="text-gray-600 mb-6">
 Sua assinatura foi ativada com sucesso. Você já pode começar a usar
 todos os recursos do seu plano.
 </p>

 <div className="bg-blue-50 rounded-lg p-4 mb-6">
 <p className="text-sm text-blue-800">
 Você receberá um email de confirmação com todos os detalhes da sua
 assinatura e nota fiscal.
 </p>
 </div>

 <div className="space-y-3">
 <button
 onClick={() => setLocation('/account')}
 className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
 >
 Ir para Dashboard
 </button>

 <button
 onClick={() => setLocation('/account')}
 className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
 >
 Ver Minha Conta
 </button>
 </div>

 <p className="text-sm text-gray-500 mt-6">
 Redirecionando automaticamente em {countdown} segundos...
 </p>
 </div>
 </div>
 );
}

