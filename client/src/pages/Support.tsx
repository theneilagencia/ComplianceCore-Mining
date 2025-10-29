import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import DashboardLayout from '../components/DashboardLayout';

interface Manual {
 id: string;
 title: string;
 description: string;
 icon: string;
 category: string;
}

interface SearchResult {
 manual: Manual;
 matches: Array<{
 line: number;
 text: string;
 context: {
 before: string;
 match: string;
 after: string;
 };
 }>;
 totalMatches: number;
}

export default function Support() {
 const [, setLocation] = useLocation();
 const [manuals, setManuals] = useState<Manual[]>([]);
 const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
 const [manualContent, setManualContent] = useState<string>('');
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
 const [searching, setSearching] = useState(false);

 // Carregar lista de manuais
 useEffect(() => {
 fetchManuals();
 }, []);

 const fetchManuals = async () => {
 try {
 const response = await fetch('/api/support/manuals', {
 credentials: 'include',
 });

 if (!response.ok) {
 throw new Error('Failed to fetch manuals');
 }

 const data = await response.json();
 setManuals(data.manuals);
 
 // Seleciona o primeiro manual por padrão
 if (data.manuals.length > 0) {
 loadManual(data.manuals[0]);
 }
 } catch (error) {
 console.error('Error fetching manuals:', error);
 } finally {
 setLoading(false);
 }
 };

 const loadManual = async (manual: Manual) => {
 setSelectedManual(manual);
 setLoading(true);
 setSearchQuery('');
 setSearchResults([]);

 try {
 const response = await fetch(`/api/support/manual/${manual.id}?format=html`, {
 credentials: 'include',
 });

 if (!response.ok) {
 throw new Error('Failed to fetch manual content');
 }

 const data = await response.json();
 setManualContent(data.manual.content);
 } catch (error) {
 console.error('Error fetching manual content:', error);
 setManualContent('<p>Erro ao carregar o manual. Tente novamente.</p>');
 } finally {
 setLoading(false);
 }
 };

 const handleSearch = async (query: string) => {
 setSearchQuery(query);

 if (query.trim().length < 3) {
 setSearchResults([]);
 return;
 }

 setSearching(true);

 try {
 const response = await fetch(`/api/support/search?q=${encodeURIComponent(query)}`, {
 credentials: 'include',
 });

 if (!response.ok) {
 throw new Error('Failed to search');
 }

 const data = await response.json();
 setSearchResults(data.results);
 } catch (error) {
 console.error('Error searching:', error);
 setSearchResults([]);
 } finally {
 setSearching(false);
 }
 };

 const highlightText = (text: string, query: string) => {
 if (!query) return text;
 const regex = new RegExp(`(${query})`, 'gi');
 return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
 };

 if (loading && manuals.length === 0) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center min-h-screen">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 </DashboardLayout>
 );
 }

 return (
 <DashboardLayout>
 <div className="flex h-screen bg-[#000020]">
 {/* Sidebar - Menu Lateral */}
 <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
 {/* Header */}
 <div className="p-6 border-b border-slate-200">
 <div className="flex items-center gap-3 mb-4">
 <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
 <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
 </svg>
 </div>
 <div>
 <h1 className="text-xl font-bold text-slate-900">Central de Suporte</h1>
 <p className="text-sm text-slate-600">Manuais e Documentação</p>
 </div>
 </div>

 {/* Busca */}
 <div className="relative">
 <input
 type="text"
 placeholder="Buscar na documentação..."
 value={searchQuery}
 onChange={(e) => handleSearch(e.target.value)}
 className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
 />
 <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 {searching && (
 <div className="absolute right-3 top-2.5">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
 </div>
 )}
 </div>
 </div>

 {/* Resultados de Busca */}
 {searchQuery.length >= 3 && searchResults.length > 0 && (
 <div className="p-4 border-b border-slate-200 bg-yellow-50">
 <p className="text-sm font-semibold text-slate-900 mb-2">
 {searchResults.length} resultado{searchResults.length > 1 ? 's' : ''} encontrado{searchResults.length > 1 ? 's' : ''}
 </p>
 <div className="space-y-2">
 {searchResults.map((result, index) => (
 <button
 key={index}
 onClick={() => loadManual(result.manual)}
 className="w-full text-left p-2 bg-white rounded hover:bg-[#000020] transition-colors"
 >
 <div className="flex items-center gap-2 mb-1">
 <span className="text-lg">{result.manual.icon}</span>
 <span className="text-sm font-medium text-slate-900">{result.manual.title}</span>
 </div>
 <p className="text-xs text-slate-600 line-clamp-2">
 {result.totalMatches} ocorrência{result.totalMatches > 1 ? 's' : ''}
 </p>
 </button>
 ))}
 </div>
 </div>
 )}

 {searchQuery.length >= 3 && searchResults.length === 0 && !searching && (
 <div className="p-4 border-b border-slate-200 bg-[#000020]">
 <p className="text-sm text-slate-600 text-center">
 Nenhum resultado encontrado para "{searchQuery}"
 </p>
 </div>
 )}

 {/* Lista de Manuais */}
 {searchQuery.length < 3 && (
 <div className="p-4">
 <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase">Manuais</h2>
 <div className="space-y-2">
 {manuals.map((manual) => (
 <button
 key={manual.id}
 onClick={() => loadManual(manual)}
 className={`w-full text-left p-3 rounded-lg transition-colors ${
 selectedManual?.id === manual.id
 ? 'bg-blue-50 border-2 border-blue-500'
 : 'bg-white border-2 border-transparent hover:bg-[#000020]'
 }`}
 >
 <div className="flex items-center gap-3">
 <span className="text-2xl">{manual.icon}</span>
 <div className="flex-1">
 <h3 className="text-sm font-semibold text-slate-900">{manual.title}</h3>
 <p className="text-xs text-slate-600 line-clamp-2">{manual.description}</p>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Links Rápidos */}
 <div className="p-4 border-t border-slate-200">
 <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase">Links Rápidos</h2>
 <div className="space-y-2">
 <button
 onClick={() => setLocation('/help')}
 className="w-full text-left p-2 rounded hover:bg-[#000020] transition-colors"
 >
 <div className="flex items-center gap-2">
 <span className="text-lg"></span>
 <span className="text-sm text-slate-700">Ajuda & FAQs</span>
 </div>
 </button>
 <a
 href="mailto:suporte@qivo-mining.com"
 className="block w-full text-left p-2 rounded hover:bg-[#000020] transition-colors"
 >
 <div className="flex items-center gap-2">
 <span className="text-lg"></span>
 <span className="text-sm text-slate-700">Email Suporte</span>
 </div>
 </a>
 <button
 onClick={() => setLocation('/dashboard')}
 className="w-full text-left p-2 rounded hover:bg-[#000020] transition-colors"
 >
 <div className="flex items-center gap-2">
 <span className="text-lg"></span>
 <span className="text-sm text-slate-700">Voltar ao Dashboard</span>
 </div>
 </button>
 </div>
 </div>
 </div>

 {/* Conteúdo Principal */}
 <div className="flex-1 overflow-y-auto">
 <div className="max-w-4xl mx-auto p-8">
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
 </div>
 ) : (
 <div
 className="prose prose-slate max-w-none
 prose-headings:text-slate-900 prose-headings:font-bold
 prose-h1:text-3xl prose-h1:mb-4
 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
 prose-p:text-slate-700 prose-p:leading-relaxed
 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
 prose-strong:text-slate-900 prose-strong:font-semibold
 prose-ul:list-disc prose-ul:pl-6
 prose-ol:list-decimal prose-ol:pl-6
 prose-li:text-slate-700
 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
 prose-pre:bg-slate-900 prose-pre:text-slate-100
 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic
 prose-table:border prose-table:border-slate-300
 prose-th:bg-slate-100 prose-th:p-2 prose-th:border prose-th:border-slate-300
 prose-td:p-2 prose-td:border prose-td:border-slate-300"
 dangerouslySetInnerHTML={{ __html: manualContent }}
 />
 )}
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}

