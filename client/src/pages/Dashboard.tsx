import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

export default function Dashboard() {
 const [, setLocation] = useLocation();
 const [license, setLicense] = useState<any>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 console.log('🎯 QIVO Dashboard v1.2.x - Design System Active');
 fetchLicense();
 }, []);

 const fetchLicense = async () => {
 try {
 const response = await fetch('/api/license/subscription', {
 credentials: 'include',
 });

 if (!response.ok) {
 if (response.status === 401) {
 setLocation('/login');
 return;
 }
 throw new Error('Failed to fetch license');
 }

 const data = await response.json();
 setLicense(data);
 } catch (error) {
 console.error('Error fetching license:', error);
 } finally {
 setLoading(false);
 }
 };

 if (loading) {
 return (
 <div className="min-h-screen bg-[#000020] flex items-center justify-center">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 );
 }

 const canCreateReport = license?.stats?.reportsUsed < license?.stats?.reportsLimit;
 const canCreateProject = license?.stats?.projectsActive < license?.stats?.projectsLimit;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000020] via-[#171a4a] to-[#2f2c79]">

 {/* Main Content */}
 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Welcome Section */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-lg p-8 mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Bem-vindo ao QIVO Mining
        </h2>
        <p className="text-gray-300 text-lg">
          Governança Técnica, Regulatória e Ambiental para Mineração
        </p>
 </div>

 {/* Plan Status */}
 <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-xl font-semibold mb-2">Seu Plano: {license?.license?.plan || 'START'}</h3>
 <p className="text-blue-100">
 {license?.stats?.reportsLimit - license?.stats?.reportsUsed} relatórios restantes este mês
 </p>
 </div>
 <button
 onClick={() => setLocation('/pricing')}
 className="px-6 py-3 bg-white/5 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
 >
 Fazer Upgrade
 </button>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
 {/* Generate Report */}
 <button
 onClick={() => {
 if (canCreateReport) {
 setLocation('/reports/generate');
 } else {
 alert('Você atingiu o limite de relatórios do seu plano. Faça upgrade para continuar!');
 }
 }}
 disabled={!canCreateReport}
        className={`p-6 rounded-xl shadow-lg text-left transition-all ${
          canCreateReport
            ? 'backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
            : 'backdrop-blur-md bg-white/5 border border-white/10 cursor-not-allowed opacity-60'
        }`}
 >
 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
 <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
 </svg>
 </div>
 <h3 className="text-lg font-semibold text-white mb-2">Gerar Relatório</h3>
 <p className="text-gray-400 text-sm">
          Crie relatórios técnicos de mineração com IA
 </p>
 {!canCreateReport && (
 <p className="text-red-600 text-xs mt-2 font-semibold">
 Limite atingido - Faça upgrade
 </p>
 )}
 </button>

 {/* Audit KRCI */}
 <button
 onClick={() => setLocation('/reports/audit')}
        className="p-6 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl shadow-lg hover:bg-white/10 hover:shadow-xl hover:-translate-y-1 transition-all text-left"
 >
 <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
 <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
 </svg>
 </div>
 <h3 className="text-lg font-semibold text-white mb-2">Auditoria KRCI</h3>
 <p className="text-gray-400 text-sm">
 Audite critérios de Key Risk and Critical Information
 </p>
 </button>

 {/* Pre-Certification removed - replaced by KRCI */}

 {/* Export Standards */}
 <button
 onClick={() => setLocation('/reports/export')}
 className="p-6 bg-white/5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-left"
 >
 <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
 <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
 </svg>
 </div>
 <h3 className="text-lg font-semibold text-white mb-2">Exportar Padrões</h3>
 <p className="text-gray-400 text-sm">
 Exporte relatórios em diferentes formatos
 </p>
 </button>

 {/* ESG Reporting removed - not in briefing */}

 {/* Valuation Automático removed - not in briefing */}

 {/* Radar Regulatório */}
 <button
  onClick={() => setLocation('/radar')}
 className="p-6 bg-white/5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-left"
 >
 <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
 <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <h3 className="text-lg font-semibold text-white mb-2">Radar Regulatório</h3>
 <p className="text-gray-400 text-sm">
 Monitoramento de mudanças regulatórias
 </p>
 </button>

 {/* Governança & Segurança removed - not in briefing */}

 {/* Subscription */}
 <button
 onClick={() => setLocation('/subscription')}
 className="p-6 bg-white/5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-left"
 >
 <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
 <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
 </svg>
 </div>
 <h3 className="text-lg font-semibold text-white mb-2">Gerenciar Assinatura</h3>
 <p className="text-gray-400 text-sm">
 Veja seu plano, faturas e configurações
 </p>
 </button>

 {/* Help/Support */}
 <button
 onClick={() => setLocation('/help')}
 className="p-6 bg-white/5 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all text-left"
 >
 <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
 <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <h3 className="text-lg font-semibold text-white mb-2">Ajuda & Suporte</h3>
 <p className="text-gray-400 text-sm">
 Documentação e suporte técnico
 </p>
 </button>
 </div>

 {/* Usage Stats */}
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl shadow-lg p-8">
 <h3 className="text-xl font-bold text-white mb-6">Uso do Plano</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Reports Usage */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-gray-300 font-medium">Relatórios Este Mês</span>
 <span className="text-white font-bold">
 {license?.stats?.reportsUsed || 0} / {license?.stats?.reportsLimit || 1}
 </span>
 </div>
 <div className="w-full bg-slate-200 rounded-full h-3">
 <div
 className="bg-[#2f2c79] h-3 rounded-full transition-all"
 style={{
 width: `${((license?.stats?.reportsUsed || 0) / (license?.stats?.reportsLimit || 1)) * 100}%`,
 }}
 />
 </div>
 </div>

 {/* Projects Usage */}
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-gray-300 font-medium">Projetos Ativos</span>
 <span className="text-white font-bold">
 {license?.stats?.projectsActive || 0} / {license?.stats?.projectsLimit === 999999 || license?.stats?.projectsLimit === -1 ? 'Ilimitado' : license?.stats?.projectsLimit || 1}
 </span>
 </div>
 <div className="w-full bg-slate-200 rounded-full h-3">
 <div
 className="bg-green-600 h-3 rounded-full transition-all"
 style={{
 width: `${((license?.stats?.projectsActive || 0) / (license?.stats?.projectsLimit || 1)) * 100}%`,
 }}
 />
 </div>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
}

