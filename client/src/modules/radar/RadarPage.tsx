import { useState, useEffect } from 'react';
import { Search, Filter, X, Loader2, Globe, Map as MapIcon, List, FileText, ExternalLink, Calendar, MapPin } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

type ViewMode = 'map' | 'list' | 'regulatory';

// Custom marker icons based on status
const createCustomIcon = (status: string) => {
  const color = status === 'active' ? '#22c55e' : status === 'inactive' ? '#ef4444' : '#eab308';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${color};
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to fit map bounds
function FitBounds({ operations }: { operations: MiningOperation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (operations.length > 0) {
      const bounds = L.latLngBounds(
        operations.map(op => [op.latitude, op.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [operations, map]);
  
  return null;
}

export default function RadarPage() {
  const [operations, setOperations] = useState<MiningOperation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<MiningOperation[]>([]);
  const [regulatoryChanges, setRegulatoryChanges] = useState<RegulatoryChange[]>([]);
  const [filteredChanges, setFilteredChanges] = useState<RegulatoryChange[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<MiningOperation | null>(null);
  const [selectedChange, setSelectedChange] = useState<RegulatoryChange | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [continentFilter, setContinentFilter] = useState('all');
  const [mineralFilter, setMineralFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  
  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetchOperations();
    fetchRegulatoryChanges();
  }, []);

  useEffect(() => {
    filterOperations();
  }, [operations, searchQuery, continentFilter, mineralFilter, statusFilter]);

  useEffect(() => {
    filterRegulatoryChanges();
  }, [regulatoryChanges, searchQuery, countryFilter, categoryFilter]);

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

  const filterOperations = () => {
    let filtered = [...operations];

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

    if (continentFilter !== 'all') {
      filtered = filtered.filter((op) => op.continent === continentFilter);
    }

    if (mineralFilter !== 'all') {
      filtered = filtered.filter((op) => op.mineral === mineralFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((op) => op.status === statusFilter);
    }

    setFilteredOperations(filtered);
  };

  const filterRegulatoryChanges = () => {
    let filtered = [...regulatoryChanges];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (change) =>
          change.country.toLowerCase().includes(query) ||
          change.summary.toLowerCase().includes(query) ||
          change.fullText.toLowerCase().includes(query)
      );
    }

    if (countryFilter !== 'all') {
      filtered = filtered.filter((change) => change.country === countryFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((change) => change.category === categoryFilter);
    }

    setFilteredChanges(filtered);
  };

  const continents = ['all', 'Americas', 'Europe', 'Asia', 'Africa', 'Oceania'];
  const minerals = ['all', 'Gold', 'Iron', 'Copper', 'Coal', 'Lithium', 'Rare Earths'];
  const statuses = ['all', 'active', 'inactive', 'planned'];
  const categories = ['all', 'environmental', 'taxation', 'licensing', 'safety', 'other'];
  const countries = ['all', ...Array.from(new Set(regulatoryChanges.map(c => c.country)))];

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental':
        return 'bg-green-100 text-green-800';
      case 'taxation':
        return 'bg-blue-100 text-blue-800';
      case 'licensing':
        return 'bg-purple-100 text-purple-800';
      case 'safety':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-[#171a4a] text-gray-800';
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
                    Monitoramento de atividade minerária e mudanças regulatórias - 12 fontes integradas
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {getViewModeButton('map', MapIcon, 'Mapa')}
                {getViewModeButton('list', List, 'Operações')}
                {getViewModeButton('regulatory', FileText, 'Mudanças')}
                
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
                  placeholder={
                    viewMode === 'regulatory'
                      ? 'Buscar mudanças regulatórias, países...'
                      : 'Buscar operações, países, minérios...'
                  }
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
                {viewMode === 'regulatory' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">País</label>
                      <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white/5 border-white/20 text-white'
                        }`}
                      >
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country === 'all' ? 'Todos' : country}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Categoria</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white/5 border-white/20 text-white'
                        }`}
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category === 'all' ? 'Todas' : category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(100vh-200px)]">
          {/* Content Area */}
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
              // Map View with Leaflet
              <div className="w-full h-full">
                <MapContainer
                  center={[20, 0]}
                  zoom={2}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FitBounds operations={filteredOperations} />
                  {filteredOperations.map((operation) => (
                    <Marker
                      key={operation.id}
                      position={[operation.latitude, operation.longitude]}
                      icon={createCustomIcon(operation.status)}
                      eventHandlers={{
                        click: () => setSelectedOperation(operation),
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-bold mb-1">{operation.name}</h3>
                          <p className="text-sm text-gray-400 mb-1">{operation.country}</p>
                          <p className="text-sm"><strong>Minério:</strong> {operation.mineral}</p>
                          <p className="text-sm"><strong>Operador:</strong> {operation.operator}</p>
                          <p className="text-xs text-gray-500 mt-1">Fonte: {operation.source}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            ) : viewMode === 'regulatory' ? (
              // Regulatory Changes View
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold mb-2">
                    {filteredChanges.length} Mudanças Regulatórias Encontradas
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                    Monitoramento contínuo de legislação minerária global
                  </p>
                </div>

                <div className="grid gap-4">
                  {filteredChanges.map((change) => (
                    <div
                      key={change.id}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white/5 border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          <h3 className="font-semibold text-lg">{change.country}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                            {new Date(change.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <p className="mb-3">{change.summary}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(change.category)}`}>
                            {change.category}
                          </span>
                          <span className={`text-sm ${getImpactColor(change.impact)}`}>
                            Impacto: {change.impact === 'high' ? 'Alto' : change.impact === 'medium' ? 'Médio' : 'Baixo'}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            console.log('Abrindo modal para:', change.id);
                            setSelectedChange(change);
                          }}
                          className="px-4 py-2 bg-[#2f2c79] text-white rounded-lg hover:bg-[#b96e48] flex items-center gap-2 text-sm"
                        >
                          Ver mais
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>

                      <div className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Fonte: {change.source}
                      </div>
                    </div>
                  ))}

                  {filteredChanges.length === 0 && (
                    <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                      <p>Nenhuma mudança regulatória encontrada com os filtros selecionados.</p>
                    </div>
                  )}
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

          {/* Side Panel - Operation Details */}
          {selectedOperation && viewMode !== 'regulatory' && (
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

        {/* Modal - Regulatory Change Details */}
        {selectedChange && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedChange(null)}
          >
            <div 
              className={`max-w-2xl w-full ${darkMode ? 'bg-gray-800' : 'bg-white/5'} rounded-lg shadow-xl max-h-[80vh] overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Detalhes da Mudança Regulatória</h2>
                  <button
                    onClick={() => setSelectedChange(null)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-[#171a4a]'}`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-lg">{selectedChange.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(selectedChange.date).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getCategoryColor(selectedChange.category)}`}>
                      {selectedChange.category}
                    </span>
                    <span className={`text-sm ${getImpactColor(selectedChange.impact)}`}>
                      Impacto: {selectedChange.impact === 'high' ? 'Alto' : selectedChange.impact === 'medium' ? 'Médio' : 'Baixo'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Resumo</h3>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-300'}>
                      {selectedChange.summary}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Detalhes Completos</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-300'} whitespace-pre-wrap`}>
                      {selectedChange.fullText}
                    </p>
                  </div>

                  <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-white/20'}`}>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-400'} mb-2`}>
                      Fonte: {selectedChange.source}
                    </p>
                    {selectedChange.url && (
                      <a
                        href={selectedChange.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Ver fonte original
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-white/5 border-t border-white/20'} px-4 py-3`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className={darkMode ? 'text-gray-400' : 'text-gray-400'}>
              {viewMode === 'regulatory' ? (
                <>Total: {regulatoryChanges.length} mudanças | Filtradas: {filteredChanges.length}</>
              ) : (
                <>Total: {operations.length} operações | Filtradas: {filteredOperations.length}</>
              )}
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

