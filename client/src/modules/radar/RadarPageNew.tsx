/**
 * Radar Regulatória Global - New Version
 * Dual visualization: Mapbox 3D + Regulatory Grid
 */

import { useState, useEffect } from 'react';
import { Search, Filter, Loader2, Globe, Map as MapIcon, FileText, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import MapboxRadar from './components/MapboxRadar';
import RegulatoryGrid from './components/RegulatoryGrid';

interface MiningOperation {
  id: string;
  name: string;
  country: string;
  continent: string;
  mineral: string;
  status: 'active' | 'inactive' | 'planned';
  operator: string;
  latitude: number;
  longitude: number;
  source: string;
  lastUpdate: string;
}

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

interface DataSource {
  source: string;
  status: string;
  last_sync: string;
  entries_count: number;
}

type ViewMode = 'map' | 'regulatory';

export default function RadarPageNew() {
  const [operations, setOperations] = useState<MiningOperation[]>([]);
  const [regulatoryChanges, setRegulatoryChanges] = useState<RegulatoryChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [darkMode, setDarkMode] = useState(false);
  const [dataSource, setDataSource] = useState<'real' | 'mock'>('mock');
  const [sourceDetails, setSourceDetails] = useState<DataSource[]>([]);
  const [diagnosticStatus, setDiagnosticStatus] = useState<any>(null);

  useEffect(() => {
    fetchOperations();
    fetchRegulatoryChanges();
    fetchDiagnostic();
  }, []);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/radar/operations', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch operations');
      }

      const data = await response.json();
      setOperations(data.operations || []);
      setDataSource(data.dataSource || 'mock');
      setSourceDetails(data.sourceDetails || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegulatoryChanges = async () => {
    try {
      const response = await fetch('/api/radar/regulatory-changes', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch regulatory changes');
      }

      const data = await response.json();
      setRegulatoryChanges(data.changes || []);
    } catch (err: any) {
      console.error('Error fetching regulatory changes:', err);
    }
  };

  const fetchDiagnostic = async () => {
    try {
      const response = await fetch('/api/radar/diagnostic', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic');
      }

      const data = await response.json();
      setDiagnosticStatus(data);
    } catch (err: any) {
      console.error('Error fetching diagnostic:', err);
    }
  };

  const getViewModeButton = (mode: ViewMode, icon: any, label: string) => {
    const Icon = icon;
    const isActive = viewMode === mode;
    
    return (
      <button
        onClick={() => setViewMode(mode)}
        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
          isActive
            ? darkMode
              ? 'bg-[#2f2c79] text-white'
              : 'bg-[#2f2c79] text-white'
            : darkMode
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            : 'bg-[#171a4a] hover:bg-gray-200 text-gray-300'
        }`}
      >
        <Icon className="w-5 h-5" />
        {label}
      </button>
    );
  };

  return (
    <DashboardLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#000020] text-white'}`}>
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white/5'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-white/20'}`}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">Radar Regulatória Global</h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    Monitoramento de atividade minerária e mudanças regulatórias
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {getViewModeButton('map', MapIcon, 'Mapa 3D')}
                {getViewModeButton('regulatory', FileText, 'Mudanças Regulatórias')}
                
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-[#171a4a] hover:bg-gray-200'}`}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dataSource === 'real' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
                  Fonte de dados: {dataSource === 'real' ? 'APIs reais' : 'Dados mock'}
                </span>
              </div>
              
              {diagnosticStatus && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    diagnosticStatus.overall_status === 'healthy' ? 'bg-green-500' :
                    diagnosticStatus.overall_status === 'degraded' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
                    Status: {diagnosticStatus.overall_status} ({diagnosticStatus.summary?.active || 0}/{diagnosticStatus.summary?.total_sources || 0} fontes ativas)
                  </span>
                </div>
              )}

              {sourceDetails.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
                    {sourceDetails.reduce((sum, s) => sum + s.entries_count, 0)} operações carregadas
                  </span>
                </div>
              )}
            </div>

            {/* Warning if using mock data */}
            {dataSource === 'mock' && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                    ⚠️ Fontes temporariamente indisponíveis
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    Exibindo dados de exemplo. As APIs reais estão sendo consultadas em background.
                    Última atualização: {new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="h-[calc(100vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-lg font-semibold">Erro ao carregar dados</p>
                <p className="text-sm text-gray-400 dark:text-gray-400 mt-2">{error}</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'map' && (
                <MapboxRadar
                  operations={operations}
                  darkMode={darkMode}
                />
              )}
              
              {viewMode === 'regulatory' && (
                <RegulatoryGrid
                  changes={regulatoryChanges}
                  darkMode={darkMode}
                />
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

