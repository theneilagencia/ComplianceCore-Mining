/**
 * Regulatory Grid Component
 * Displays regulatory changes in a responsive grid format
 */

import { useState } from 'react';
import { Calendar, MapPin, ExternalLink, AlertCircle, Filter, X } from 'lucide-react';

interface RegulatoryChange {
  id: string;
  country: string;
  date: string;
  summary: string;
  fullText: string;
  source: string;
  category: 'environmental' | 'taxation' | 'licensing' | 'safety' | 'other';
  impact: 'high' | 'medium' | 'low';
  url?: string;
}

interface RegulatoryGridProps {
  changes: RegulatoryChange[];
  darkMode?: boolean;
}

export default function RegulatoryGrid({ changes, darkMode = false }: RegulatoryGridProps) {
  const [selectedChange, setSelectedChange] = useState<RegulatoryChange | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredChanges = changes.filter((change) => {
    if (categoryFilter !== 'all' && change.category !== categoryFilter) return false;
    if (impactFilter !== 'all' && change.impact !== impactFilter) return false;
    return true;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'taxation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'licensing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'safety':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-[#171a4a] text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-red-600 font-bold';
      case 'medium':
        return 'text-yellow-600 font-medium';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-400';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      environmental: 'Ambiental',
      taxation: 'Tributação',
      licensing: 'Licenciamento',
      safety: 'Segurança',
      other: 'Outros',
    };
    return labels[category] || category;
  };

  const getImpactLabel = (impact: string) => {
    const labels: { [key: string]: string } = {
      high: 'Alto',
      medium: 'Médio',
      low: 'Baixo',
    };
    return labels[impact] || impact;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={`w-full h-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#000020] text-white'}`}>
      {/* Header with Filters */}
      <div className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-800' : 'bg-white/5'} border-b ${darkMode ? 'border-gray-700' : 'border-white/20'} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Mudanças Regulatórias</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
              {filteredChanges.length} mudanças encontradas
            </p>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-[#171a4a] hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filtros
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <option value="all">Todas</option>
                <option value="environmental">Ambiental</option>
                <option value="taxation">Tributação</option>
                <option value="licensing">Licenciamento</option>
                <option value="safety">Segurança</option>
                <option value="other">Outros</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Impacto</label>
              <select
                value={impactFilter}
                onChange={(e) => setImpactFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white/5 border-white/20'
                }`}
              >
                <option value="all">Todos</option>
                <option value="high">Alto</option>
                <option value="medium">Médio</option>
                <option value="low">Baixo</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Changes */}
      <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
        {filteredChanges.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
              Nenhuma mudança regulatória encontrada
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChanges.map((change) => (
              <div
                key={change.id}
                className={`${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white/5 hover:bg-[#000020]'
                } rounded-lg shadow-md p-4 cursor-pointer transition-all border ${
                  darkMode ? 'border-gray-700' : 'border-white/20'
                }`}
                onClick={() => setSelectedChange(change)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-sm">{change.country}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(change.category)}`}>
                    {getCategoryLabel(change.category)}
                  </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatDate(change.date)}</span>
                </div>

                {/* Summary */}
                <p className="text-sm mb-3 line-clamp-3">{change.summary}</p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${getImpactColor(change.impact)}`}>
                    Impacto: {getImpactLabel(change.impact)}
                  </span>
                  {change.url && (
                    <ExternalLink className="w-4 h-4 text-blue-500" />
                  )}
                </div>

                {/* Source */}
                <p className="text-xs text-gray-500 mt-2 truncate" title={change.source}>
                  Fonte: {change.source}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedChange && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedChange(null)}
        >
          <div
            className={`${
              darkMode ? 'bg-gray-800' : 'bg-white/5'
            } rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`sticky top-0 ${darkMode ? 'bg-gray-800' : 'bg-white/5'} border-b ${darkMode ? 'border-gray-700' : 'border-white/20'} p-6`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <h3 className="text-xl font-bold">{selectedChange.country}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(selectedChange.category)}`}>
                      {getCategoryLabel(selectedChange.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{formatDate(selectedChange.date)}</span>
                    <span className={getImpactColor(selectedChange.impact)}>
                      Impacto: {getImpactLabel(selectedChange.impact)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChange(null)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-[#171a4a]'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h4 className="font-semibold mb-2">Resumo</h4>
              <p className="text-sm mb-4">{selectedChange.summary}</p>

              <h4 className="font-semibold mb-2">Detalhes</h4>
              <p className="text-sm mb-4 whitespace-pre-wrap">{selectedChange.fullText}</p>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-[#000020]'} mb-4`}>
                <p className="text-xs text-gray-500 mb-1">Fonte</p>
                <p className="text-sm">{selectedChange.source}</p>
              </div>

              {selectedChange.url && (
                <a
                  href={selectedChange.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#b96e48] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver documento oficial
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

