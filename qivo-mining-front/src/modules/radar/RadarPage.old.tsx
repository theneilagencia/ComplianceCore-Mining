import { useState, useEffect } from 'react';
import { Search, Filter, X, Loader2, Globe, Map as MapIcon, List } from 'lucide-react';
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
  
  // View mode
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
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

  // Placeholder function for future Mapbox integration
  const initMapbox = () => {
    // Future implementation:
    // const map = new mapboxgl.Map({
    //   container: 'mapbox-container',
    //   style: 'mapbox://styles/mapbox/dark-v10',
    //   center: [0, 20],
    //   zoom: 2
    // });
    console.log('Mapbox initialization placeholder');
  };

  const continents = ['all', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
  const minerals = ['all', 'Gold', 'Iron', 'Copper', 'Coal', 'Lithium', 'Rare Earths'];
  const statuses = ['all', 'active', 'inactive', 'planned'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-[#171a4a] text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
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
                    Monitoramento de atividade minerária mundial - 12 fontes integradas
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                    darkMode ? 'bg-[#2f2c79] hover:bg-[#b96e48]' : 'bg-[#2f2c79] hover:bg-[#2f2c79]'
                  } text-white`}
                >
                  {viewMode === 'map' ? (
                    <>
                      <List className="w-5 h-5" />
                      Modo Lista
                    </>
                  ) : (
                    <>
                      <MapIcon className="w-5 h-5" />
                      Modo Mapa
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-[#171a4a] hover:bg-gray-200'}`}
                >
                  {darkMode ? 'Modo Claro' : 'Modo Escuro'}
                </button>
              </div>
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
                      : 'bg-white/5 border-white/20 text-white placeholder-gray-500'
                  } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white/5 border border-white/20 hover:bg-[#000020]'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filtros
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className={`mt-3 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-[#171a4a]'}`}>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Continente</label>
                    <select
                      value={continentFilter}
                      onChange={(e) => setContinentFilter(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white/5 border-white/20 text-white'
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
                          : 'bg-white/5 border-white/20 text-white'
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
                          : 'bg-white/5 border-white/20 text-white'
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
          {/* Map or List View */}
          <div className="flex-1 relative overflow-y-auto">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
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
            ) : viewMode === 'map' ? (
              // Map View
              <div 
                id="mapbox-placeholder" 
                className={`w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} flex items-center justify-center`}
              >
                <div className="text-center">
                  <MapIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-300'}`}>
                    Mapa 3D Interativo
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'} mt-2`}>
                    {filteredOperations.length} operações encontradas
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    Mapa 3D em breve...
                  </p>
                  <button
                    onClick={initMapbox}
                    className="mt-4 px-4 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#b96e48]"
                  >
                    Preparar Mapbox (placeholder)
                  </button>
                </div>
              </div>
            ) : (
              // List View
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">
                    {filteredOperations.length} Operações Encontradas
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    Dados de 12 fontes globais
                  </p>
                </div>

                <div className="grid gap-4">
                  {filteredOperations.map((operation) => (
                    <div
                      key={operation.id}
                      onClick={() => setSelectedOperation(operation)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700 hover:border-blue-500'
                          : 'bg-white/5 border-white/20 hover:border-blue-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{operation.name}</h3>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'} mb-2`}>
                            {operation.country} • {operation.continent}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(operation.status)}`}>
                              {operation.status === 'active' ? 'Ativo' : operation.status === 'inactive' ? 'Inativo' : 'Planejado'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700' : 'bg-[#171a4a]'}`}>
                              {operation.mineral}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-gray-700' : 'bg-[#171a4a]'}`}>
                              {operation.operator}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            Fonte: {operation.source}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'} mt-1`}>
                            {new Date(operation.lastUpdate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredOperations.length === 0 && (
                    <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      <p>Nenhuma operação encontrada com os filtros selecionados.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Side Panel */}
          {selectedOperation && (
            <div className={`w-96 ${darkMode ? 'bg-gray-800 border-l border-gray-700' : 'bg-white/5 border-l border-white/20'} overflow-y-auto`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Detalhes da Operação</h2>
                  <button
                    onClick={() => setSelectedOperation(null)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-[#171a4a]'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{selectedOperation.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedOperation.status)}`}>
                      {selectedOperation.status === 'active' ? 'Ativo' : selectedOperation.status === 'inactive' ? 'Inativo' : 'Planejado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>País</p>
                      <p className="font-medium">{selectedOperation.country}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Continente</p>
                      <p className="font-medium">{selectedOperation.continent}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Minério</p>
                      <p className="font-medium">{selectedOperation.mineral}</p>
                    </div>
                    <div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>Operador</p>
                      <p className="font-medium">{selectedOperation.operator}</p>
                    </div>
                  </div>

                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'} mb-1`}>Coordenadas</p>
                    <p className="font-mono text-sm">
                      {selectedOperation.latitude.toFixed(6)}, {selectedOperation.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'} mb-1`}>Fonte de Dados</p>
                    <p className="text-sm">{selectedOperation.source}</p>
                  </div>

                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'} mb-1`}>Última Atualização</p>
                    <p className="text-sm">{new Date(selectedOperation.lastUpdate).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-white/5 border-t border-white/20'} px-4 py-3`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
              Total: {operations.length} operações | Filtradas: {filteredOperations.length}
            </div>
            <div className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
              Dados de 12 fontes globais
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

