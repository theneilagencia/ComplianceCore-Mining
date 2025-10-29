import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';

export default function HelpSupport() {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedCategory, setSelectedCategory] = useState('all');

 const categories = [
 { id: 'all', name: 'Todas', icon: '' },
 { id: 'getting-started', name: 'Primeiros Passos', icon: '' },
 { id: 'reports', name: 'Relatórios', icon: '' },
 { id: 'compliance', name: 'Compliance', icon: '' },
 { id: 'billing', name: 'Faturamento', icon: '' },
 { id: 'technical', name: 'Técnico', icon: '' },
 ];

 const faqs = [
 {
 category: 'getting-started',
 question: 'Como criar meu primeiro relatório técnico?',
 answer: 'Acesse o módulo "Gerar Relatório" no dashboard, escolha entre preencher manualmente ou fazer upload de uma planilha. Selecione o padrão internacional (JORC, NI 43-101, etc.) e preencha os dados do projeto. O sistema gerará automaticamente um relatório completo em PDF.',
 },
 {
 category: 'getting-started',
 question: 'Quais padrões internacionais são suportados?',
 answer: 'Suportamos JORC 2012 (Austrália), NI 43-101 (Canadá), PERC (Europa), SAMREC (África do Sul), CRIRSCO (Internacional) e CBRR (Brasil). Cada padrão possui templates específicos e validações automáticas.',
 },
 {
 category: 'reports',
 question: 'Posso fazer upload de planilhas Excel?',
 answer: 'Sim! Na aba "Upload de Arquivo" você pode fazer upload de planilhas Excel (.xlsx, .xls) ou CSV. Baixe nossos templates pré-formatados para garantir compatibilidade.',
 },
 {
 category: 'reports',
 question: 'Como baixar templates de relatórios?',
 answer: 'Na página "Gerar Relatório", clique na aba "Upload de Arquivo" e você verá os botões de download para Template Excel, Template CSV e Exemplo PDF.',
 },
 {
 category: 'compliance',
 question: 'O que é auditoria KRCI?',
 answer: 'KRCI (Key Risk and Critical Information) é uma auditoria de critérios críticos de risco. Nosso sistema analisa automaticamente seu relatório e identifica pontos de atenção conforme padrões internacionais.',
 },
 {
 category: 'compliance',
 question: 'Como funciona a pré-certificação?',
 answer: 'A pré-certificação valida seu relatório antes da certificação oficial. Verificamos conformidade com normas, completude de dados e identificamos possíveis problemas que poderiam causar rejeição.',
 },
 {
 category: 'billing',
 question: 'Quantos relatórios posso gerar por mês?',
 answer: 'Depende do seu plano: START (1 relatório/mês), PROFESSIONAL (10 relatórios/mês), ENTERPRISE (ilimitado). Veja detalhes em "Gerenciar Assinatura".',
 },
 {
 category: 'billing',
 question: 'Como fazer upgrade do meu plano?',
 answer: 'Clique em "Fazer Upgrade" no dashboard ou acesse "Gerenciar Assinatura". Você pode escolher entre os planos START, PROFESSIONAL ou ENTERPRISE.',
 },
 {
 category: 'technical',
 question: 'Meus dados estão seguros?',
 answer: 'Sim! Utilizamos criptografia end-to-end, cookies HttpOnly seguros, autenticação multi-fator e conformidade com LGPD. Todos os dados são criptografados em trânsito e em repouso.',
 },
 {
 category: 'technical',
 question: 'Como funciona a autenticação?',
 answer: 'Utilizamos cookies HttpOnly seguros com flags Secure e SameSite para máxima segurança. Você pode fazer login com email/senha ou Google OAuth.',
 },
 ];

 const tutorials = [
 {
 title: 'Criando seu Primeiro Relatório JORC',
 duration: '5 min',
 thumbnail: '',
 url: '#',
 },
 {
 title: 'Upload de Planilhas Excel',
 duration: '3 min',
 thumbnail: '',
 url: '#',
 },
 {
 title: 'Auditoria KRCI Passo a Passo',
 duration: '7 min',
 thumbnail: '',
 url: '#',
 },

 ];

 const filteredFaqs = faqs.filter(faq => {
 const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
 const matchesSearch = searchQuery === '' || 
 faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
 faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
 return matchesCategory && matchesSearch;
 });

 return (
 <DashboardLayout>
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 {/* Header */}
 <div className="mb-8">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
 <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 </div>
 <div>
 <h1 className="text-3xl font-bold text-white">Ajuda & Suporte</h1>
 <p className="text-gray-400">Documentação, tutoriais e suporte técnico</p>
 </div>
 </div>

 {/* Search Bar */}
 <div className="relative">
 <input
 type="text"
 placeholder="Pesquisar na base de conhecimento..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
 />
 <svg className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
 <button className="p-6 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
 <div className="text-3xl mb-2"></div>
 <h3 className="font-semibold text-white mb-1">Email Suporte</h3>
 <p className="text-sm text-gray-400">suporte@qivo-mining.com</p>
 </button>

 <button className="p-6 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-left">
 <div className="text-3xl mb-2"></div>
 <h3 className="font-semibold text-white mb-1">Chat ao Vivo</h3>
 <p className="text-sm text-gray-400">Seg-Sex, 9h-18h BRT</p>
 </button>

 <button className="p-6 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-left">
 <div className="text-3xl mb-2"></div>
 <h3 className="font-semibold text-white mb-1">Telefone</h3>
 <p className="text-sm text-gray-400">+55 11 1234-5678</p>
 </button>
 </div>

 {/* Tutorials */}
 <div className="mb-8">
 <h2 className="text-2xl font-bold text-white mb-4"> Tutoriais em Vídeo</h2>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {tutorials.map((tutorial, index) => (
 <a
 key={index}
 href={tutorial.url}
 className="block p-4 bg-white/5 rounded-lg shadow hover:shadow-lg transition-shadow"
 >
 <div className="text-5xl mb-3 text-center">{tutorial.thumbnail}</div>
 <h3 className="font-semibold text-white mb-1 text-sm">{tutorial.title}</h3>
 <p className="text-xs text-gray-400">{tutorial.duration}</p>
 </a>
 ))}
 </div>
 </div>

 {/* Categories */}
 <div className="mb-6">
 <div className="flex flex-wrap gap-2">
 {categories.map((category) => (
 <button
 key={category.id}
 onClick={() => setSelectedCategory(category.id)}
 className={`px-4 py-2 rounded-lg font-medium transition-colors ${
 selectedCategory === category.id
 ? 'bg-yellow-500 text-white'
 : 'bg-white/5 text-gray-300 hover:bg-[#171a4a]'
 }`}
 >
 <span className="mr-2">{category.icon}</span>
 {category.name}
 </button>
 ))}
 </div>
 </div>

 {/* FAQs */}
 <div className="bg-white/5 rounded-xl shadow-lg p-6">
 <h2 className="text-2xl font-bold text-white mb-6"> Perguntas Frequentes</h2>
 
 {filteredFaqs.length === 0 ? (
 <div className="text-center py-12">
 <div className="text-5xl mb-4"></div>
 <p className="text-gray-400">Nenhum resultado encontrado para "{searchQuery}"</p>
 </div>
 ) : (
 <div className="space-y-4">
 {filteredFaqs.map((faq, index) => (
 <details key={index} className="group">
 <summary className="flex items-center justify-between cursor-pointer p-4 bg-[#000020] rounded-lg hover:bg-[#171a4a] transition-colors">
 <span className="font-semibold text-white">{faq.question}</span>
 <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
 </svg>
 </summary>
 <div className="p-4 text-gray-400 leading-relaxed">
 {faq.answer}
 </div>
 </details>
 ))}
 </div>
 )}
 </div>

 {/* Documentation Links */}
 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
 <h3 className="text-xl font-bold text-white mb-2"> Documentação Completa</h3>
 <p className="text-gray-400 mb-4">Guias detalhados sobre todas as funcionalidades da plataforma</p>
 <button className="px-4 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#b96e48] transition-colors">
 Acessar Docs
 </button>
 </div>

 <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
 <h3 className="text-xl font-bold text-white mb-2"> Status do Sistema</h3>
 <p className="text-gray-400 mb-4">Verifique o status operacional de todos os serviços</p>
 <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
 Ver Status
 </button>
 </div>
 </div>

 {/* Contact Form */}
 <div className="mt-8 bg-white/5 rounded-xl shadow-lg p-6">
 <h2 className="text-2xl font-bold text-white mb-4"> Ainda precisa de ajuda?</h2>
 <p className="text-gray-400 mb-6">Envie uma mensagem para nossa equipe de suporte</p>
 
 <form className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-gray-300 mb-2">Assunto</label>
 <input
 type="text"
 placeholder="Ex: Dúvida sobre relatório JORC"
 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-gray-300 mb-2">Mensagem</label>
 <textarea
 rows={5}
 placeholder="Descreva sua dúvida ou problema..."
 className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
 />
 </div>

 <button
 type="submit"
 className="w-full px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
 >
 Enviar Mensagem →
 </button>
 </form>
 </div>
 </div>
 </DashboardLayout>
 );
}

