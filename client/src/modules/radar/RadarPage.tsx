import { useState, useEffect } from 'react';
import { Search, Filter, X, Loader2, Globe, Map as MapIcon } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

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

export default function RadarPage() {
  const [operations, setOperations] = useState<MiningOperation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<MiningOperation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<MiningOperation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [continentFilter, setContinentFilter] = useState('all');
  const [mineralFilter, setMineralFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchOperations();
  }, []);

  useEffect(() => {
    filterOperations();
  }, [operations, searchQuery, continentFilter, mineralFilter, statusFilter]);

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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterOperations = () => {
    let filtered = [...operations];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (op) =>
          op.name.toLowerCase().includes(query) ||
          op.country.toLowerCase().includes(query) ||
          op.mineral.toLowerCase().includes(query) ||
          op.operator.toLowerCase().includes(query)
      );
    }

    // Continent filter
    if (continentFilter !== 'all') {
      filtered = filtered.filter((op) => op.continent === continentFilter);
    }

    // Mineral filter
    if (mineralFilter !== 'all') {
      filtered = filtered.filter((op) => op.mineral === mineralFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((op) => op.status === statusFilter);
    }

    setFilteredOperations(filtered);
  };

  const continents = ['all', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
  const minerals = ['all', 'Gold', 'Iron', 'Copper', 'Coal', 'Lithium', 'Rare Earths'];
  const statuses = ['all', 'active', 'inactive', 'planned'];

  return (
    <DashboardLayout>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold">Radar Regulatória Global</h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Monitoramento de atividade minerária mundial
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {darkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
              </button>
            </div>

            {/* Search and Filters */}
            <div className="mt-4 flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar operações, países, minérios..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filtros
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className={`mt-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Continente</label>
                    <select
                      value={continentFilter}
                      onChange={(e) => setContinentFilter(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {continents.map((continent) => (
                        <option key={continent} value={continent}>
                          {continent === 'all' ? 'Todos' : continent}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Minério</label>
                    <select
                      value={mineralFilter}
                      onChange={(e) => setMineralFilter(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {minerals.map((mineral) => (
                        <option key={mineral} value={mineral}>
                          {mineral === 'all' ? 'Todos' : mineral}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status === 'all' ? 'Todos' : status === 'active' ? 'Ativo' : status === 'inactive' ? 'Inativo' : 'Planejado'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-200px)]">
          {/* Map Area */}
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Carregando dados de 12 fontes globais...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`max-w-md p-6 rounded-lg ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    Erro ao carregar dados
                  </p>
                  <p className={`text-sm mt-2 ${darkMode ? 'text-red-300' : 'text-red-600'}`}>
                    {error}
                  </p>
                </div>
              </div>
            ) : (
              <div className={`w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}>
                <div className="text-center">
                  <MapIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Mapa 3D Interativo
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                    {filteredOperations.length} operações encontradas
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    (Mapa Mapbox GL JS será integrado aqui)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          {selectedOperation && (
            <div className={`w-96 ${darkMode ? 'bg-gray-800 border-l border-gray-700' : 'bg-white border-l border-gray-200'} overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Detalhes da Operação</h2>
                  <button
                    onClick={() => setSelectedOperation(null)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Nome
                    </label>
                    <p className="text-lg font-semibold">{selectedOperation.name}</p>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      País
                    </label>
                    <p>{selectedOperation.country}</p>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Minério
                    </label>
                    <p>{selectedOperation.mineral}</p>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Status
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        selectedOperation.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : selectedOperation.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedOperation.status === 'active' ? 'Ativo' : selectedOperation.status === 'inactive' ? 'Inativo' : 'Planejado'}
                    </span>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Operador
                    </label>
                    <p>{selectedOperation.operator}</p>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Coordenadas
                    </label>
                    <p className="text-sm font-mono">
                      {selectedOperation.latitude.toFixed(6)}, {selectedOperation.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Fonte
                    </label>
                    <p className="text-sm">{selectedOperation.source}</p>
                  </div>

                  <div>
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Última Atualização
                    </label>
                    <p className="text-sm">{new Date(selectedOperation.lastUpdate).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className={`${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-200'} px-4 py-3`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Total: <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{operations.length}</strong> operações
              </span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Filtradas: <strong className={darkMode ? 'text-white' : 'text-gray-900'}>{filteredOperations.length}</strong>
              </span>
            </div>
            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Dados de 12 fontes globais
            </span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

