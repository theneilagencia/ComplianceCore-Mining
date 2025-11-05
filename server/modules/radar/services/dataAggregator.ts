/**
 * Data Aggregator Service
 * Integrates real mining data from global and Brazilian sources
 */

import axios from 'axios';

export interface MiningOperation {
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

export interface DataSource {
  id: string;
  name: string;
  region: string;
  status: 'active' | 'error' | 'unavailable';
  lastSync: string;
  entriesCount: number;
  url?: string;
}

export interface RegulatoryChange {
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

/**
 * Fetch data from USGS Mineral Resources Data System
 * https://mrdata.usgs.gov/
 */
async function fetchUSGSData(): Promise<MiningOperation[]> {
  try {
    // USGS Mineral Resources Online Spatial Data
    // https://mrdata.usgs.gov/general/map-global.html
    const response = await axios.get('https://mrdata.usgs.gov/services/wfs/mrds', {
      params: {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'mrds:mrds',
        outputFormat: 'json',
        maxFeatures: 100,
      },
      timeout: 10000,
    });

    const features = response.data.features || [];
    return features.map((feature: any, index: number) => ({
      id: `usgs-${feature.id || index}`,
      name: feature.properties.site_name || 'Unknown Site',
      country: feature.properties.country || 'Unknown',
      continent: getContinent(feature.properties.country),
      mineral: feature.properties.commod1 || 'Unknown',
      status: feature.properties.dev_stat === 'Producer' ? 'active' : 'inactive',
      operator: feature.properties.oper || 'Unknown',
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      source: 'USGS Mineral Resources Data System',
      lastUpdate: new Date().toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('[DataAggregator] Error fetching USGS data:', error);
    return [];
  }
}

/**
 * Fetch data from Brazil SIGMINE/ANM
 * https://dados.gov.br/dados/conjuntos-dados/sistema-de-informacoes-geograficas-da-mineracao-sigmine
 */
async function fetchSIGMINEData(): Promise<MiningOperation[]> {
  try {
    const { getSIGMINEClient } = await import('../clients/sigmine');
    const client = getSIGMINEClient();

    if (!client.isEnabled()) {
      console.log('[DataAggregator] SIGMINE client is disabled');
      return [];
    }

    // Busca processos minerários ativos
    const response = await client.searchProcesses({
      situacao: 'ATIVO',
      pageSize: 100,
    });

    if (!response.success) {
      console.error('[DataAggregator] SIGMINE API error:', response.error);
      return [];
    }

    // Converte para formato MiningOperation
    return response.data.map((processo) => ({
      id: `sigmine-${processo.numero}-${processo.ano}`,
      name: `Processo ${processo.numero}/${processo.ano}`,
      country: 'Brazil',
      continent: 'Americas',
      mineral: processo.substancia || 'Unknown',
      status: processo.situacao === 'ATIVO' ? 'active' : 'inactive',
      operator: processo.titular || 'Unknown',
      latitude: processo.latitude || 0,
      longitude: processo.longitude || 0,
      source: 'SIGMINE/ANM',
      lastUpdate: new Date().toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('[DataAggregator] Error fetching SIGMINE data:', error);
    return [];
  }
}

/**
 * Fetch data from Global Forest Watch Mining Concessions
 * https://data.globalforestwatch.org/
 */
async function fetchGFWData(): Promise<MiningOperation[]> {
  try {
    // GFW Mining Concessions dataset
    // Using their API v2
    const response = await axios.get('https://data-api.globalforestwatch.org/dataset/gfw_mining_concessions/latest/query', {
      params: {
        sql: 'SELECT * FROM data LIMIT 100',
      },
      timeout: 10000,
    });

    const data = response.data.data || [];
    return data.map((item: any, index: number) => ({
      id: `gfw-${index}`,
      name: item.name || 'Mining Concession',
      country: item.country || 'Unknown',
      continent: getContinent(item.country),
      mineral: item.commodity || 'Unknown',
      status: 'active',
      operator: item.company || 'Unknown',
      latitude: item.latitude || 0,
      longitude: item.longitude || 0,
      source: 'Global Forest Watch - Mining Concessions',
      lastUpdate: new Date().toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('[DataAggregator] Error fetching GFW data:', error);
    return [];
  }
}

/**
 * Fetch data from Resource Watch
 * https://resourcewatch.org/data/explore
 */
async function fetchResourceWatchData(): Promise<MiningOperation[]> {
  try {
    // Resource Watch API
    const response = await axios.get('https://api.resourcewatch.org/v1/dataset', {
      params: {
        application: 'rw',
        includes: 'layer',
        'page[size]': 50,
        search: 'mining',
      },
      timeout: 10000,
    });

    // Parse and convert data
    // This is a placeholder - actual implementation depends on specific datasets
    return [];
  } catch (error) {
    console.error('[DataAggregator] Error fetching Resource Watch data:', error);
    return [];
  }
}

/**
 * Fetch data from MapBiomas Mining Infrastructure
 * https://mapbiomas.org/
 */
async function fetchMapBiomasData(): Promise<MiningOperation[]> {
  try {
    const { getMapBiomasClient } = await import('../clients/mapbiomas');
    const client = getMapBiomasClient();

    if (!client.isEnabled()) {
      console.log('[DataAggregator] MapBiomas client is disabled');
      return [];
    }

    // Busca áreas de mineração do ano atual
    const response = await client.searchMiningAreas({
      year: new Date().getFullYear(),
    });

    if (!response.success) {
      console.error('[DataAggregator] MapBiomas API error:', response.error);
      return [];
    }

    // Converte para formato MiningOperation
    return response.data.map((area, index) => ({
      id: `mapbiomas-${area.id}`,
      name: area.properties.name || `Mining Area ${index + 1}`,
      country: 'Brazil',
      continent: 'Americas',
      mineral: area.properties.mineral || 'Unknown',
      status: 'active',
      operator: 'Unknown',
      latitude: area.geometry.coordinates[0][1] || 0,
      longitude: area.geometry.coordinates[0][0] || 0,
      source: 'MapBiomas',
      lastUpdate: area.properties.last_update || new Date().toISOString().split('T')[0],
    }));
  } catch (error) {
    console.error('[DataAggregator] Error fetching MapBiomas data:', error);
    return [];
  }
}

/**
 * Fetch regulatory changes from multiple sources
 */
async function fetchRegulatoryChanges(): Promise<RegulatoryChange[]> {
  const changes: RegulatoryChange[] = [];

  // Brazil - Diário Oficial da União
  try {
    // DOU API (if available)
    // This would require web scraping or RSS feed parsing
    // Placeholder for now
  } catch (error) {
    console.error('[DataAggregator] Error fetching DOU data:', error);
  }

  // International Mining Associations
  // - ICMM (International Council on Mining and Metals)
  // - World Bank Mining Data
  // - EITI (Extractive Industries Transparency Initiative)

  return changes;
}

/**
 * Helper function to determine continent from country
 */
function getContinent(country: string): string {
  const continentMap: { [key: string]: string } = {
    // Americas
    'Brazil': 'Americas',
    'Chile': 'Americas',
    'Peru': 'Americas',
    'Canada': 'Americas',
    'United States': 'Americas',
    'Mexico': 'Americas',
    'Argentina': 'Americas',
    'Colombia': 'Americas',
    
    // Europe
    'Sweden': 'Europe',
    'Finland': 'Europe',
    'Poland': 'Europe',
    'Spain': 'Europe',
    'Germany': 'Europe',
    'United Kingdom': 'Europe',
    
    // Asia
    'China': 'Asia',
    'India': 'Asia',
    'Indonesia': 'Asia',
    'Philippines': 'Asia',
    'Kazakhstan': 'Asia',
    'Mongolia': 'Asia',
    
    // Africa
    'South Africa': 'Africa',
    'DRC': 'Africa',
    'Ghana': 'Africa',
    'Botswana': 'Africa',
    'Zambia': 'Africa',
    'Tanzania': 'Africa',
    
    // Oceania
    'Australia': 'Oceania',
    'Papua New Guinea': 'Oceania',
    'New Zealand': 'Oceania',
  };

  return continentMap[country] || 'Unknown';
}

/**
 * Aggregate data from all sources
 */
export async function aggregateAllData(): Promise<{
  operations: MiningOperation[];
  sources: DataSource[];
}> {
  const startTime = Date.now();
  console.log('[DataAggregator] Starting data aggregation...');

  const sources: DataSource[] = [
    { id: 'usgs', name: 'USGS Mineral Resources', region: 'Global', status: 'active', lastSync: '', entriesCount: 0 },
    { id: 'gfw', name: 'Global Forest Watch', region: 'Global', status: 'active', lastSync: '', entriesCount: 0 },
    { id: 'sigmine', name: 'SIGMINE/ANM Brazil', region: 'Americas', status: 'active', lastSync: '', entriesCount: 0 },
    { id: 'mapbiomas', name: 'MapBiomas', region: 'Americas', status: 'active', lastSync: '', entriesCount: 0 },
    { id: 'resourcewatch', name: 'Resource Watch', region: 'Global', status: 'active', lastSync: '', entriesCount: 0 },
  ];

  const operations: MiningOperation[] = [];

  // Fetch USGS data
  try {
    const usgsData = await fetchUSGSData();
    operations.push(...usgsData);
    const usgsSource = sources.find(s => s.id === 'usgs');
    if (usgsSource) {
      usgsSource.status = usgsData.length > 0 ? 'active' : 'unavailable';
      usgsSource.entriesCount = usgsData.length;
      usgsSource.lastSync = new Date().toISOString();
    }
    console.log(`[DataAggregator] USGS: ${usgsData.length} operations fetched`);
  } catch (error) {
    const usgsSource = sources.find(s => s.id === 'usgs');
    if (usgsSource) usgsSource.status = 'error';
  }

  // Fetch GFW data
  try {
    const gfwData = await fetchGFWData();
    operations.push(...gfwData);
    const gfwSource = sources.find(s => s.id === 'gfw');
    if (gfwSource) {
      gfwSource.status = gfwData.length > 0 ? 'active' : 'unavailable';
      gfwSource.entriesCount = gfwData.length;
      gfwSource.lastSync = new Date().toISOString();
    }
    console.log(`[DataAggregator] GFW: ${gfwData.length} operations fetched`);
  } catch (error) {
    const gfwSource = sources.find(s => s.id === 'gfw');
    if (gfwSource) gfwSource.status = 'error';
  }

  // Fetch SIGMINE data
  try {
    const sigmineData = await fetchSIGMINEData();
    operations.push(...sigmineData);
    const sigmineSource = sources.find(s => s.id === 'sigmine');
    if (sigmineSource) {
      sigmineSource.status = sigmineData.length > 0 ? 'active' : 'unavailable';
      sigmineSource.entriesCount = sigmineData.length;
      sigmineSource.lastSync = new Date().toISOString();
    }
    console.log(`[DataAggregator] SIGMINE: ${sigmineData.length} operations fetched`);
  } catch (error) {
    const sigmineSource = sources.find(s => s.id === 'sigmine');
    if (sigmineSource) sigmineSource.status = 'error';
  }

  // Fetch MapBiomas data
  try {
    const mapbiomasData = await fetchMapBiomasData();
    operations.push(...mapbiomasData);
    const mapbiomasSource = sources.find(s => s.id === 'mapbiomas');
    if (mapbiomasSource) {
      mapbiomasSource.status = mapbiomasData.length > 0 ? 'active' : 'unavailable';
      mapbiomasSource.entriesCount = mapbiomasData.length;
      mapbiomasSource.lastSync = new Date().toISOString();
    }
    console.log(`[DataAggregator] MapBiomas: ${mapbiomasData.length} operations fetched`);
  } catch (error) {
    const mapbiomasSource = sources.find(s => s.id === 'mapbiomas');
    if (mapbiomasSource) mapbiomasSource.status = 'error';
  }

  // Se nenhuma fonte retornou dados, adiciona dados de exemplo para demonstração
  if (operations.length === 0) {
    console.log('[DataAggregator] No data from external sources, using example data');
    operations.push(...getExampleOperations());
  }

  const duration = Date.now() - startTime;
  console.log(`[DataAggregator] Aggregation completed in ${duration}ms. Total operations: ${operations.length}`);

  return { operations, sources };
}

/**
 * Get diagnostic information about all data sources
 */
export async function getDiagnostic(): Promise<DataSource[]> {
  const { sources } = await aggregateAllData();
  return sources;
}

/**
 * Get example mining operations for demonstration
 * Used when external APIs are not available or configured
 */
function getExampleOperations(): MiningOperation[] {
  return [
    // Brasil
    {
      id: 'example-br-1',
      name: 'Mina Carajás',
      country: 'Brazil',
      continent: 'Americas',
      mineral: 'Iron Ore',
      status: 'active',
      operator: 'Vale S.A.',
      latitude: -6.0626,
      longitude: -50.2108,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    {
      id: 'example-br-2',
      name: 'Mina de Sossego',
      country: 'Brazil',
      continent: 'Americas',
      mineral: 'Copper',
      status: 'active',
      operator: 'Vale S.A.',
      latitude: -6.4833,
      longitude: -49.9833,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    {
      id: 'example-br-3',
      name: 'Mina de Brucutu',
      country: 'Brazil',
      continent: 'Americas',
      mineral: 'Iron Ore',
      status: 'active',
      operator: 'Vale S.A.',
      latitude: -19.8833,
      longitude: -43.6167,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    // Chile
    {
      id: 'example-cl-1',
      name: 'Chuquicamata',
      country: 'Chile',
      continent: 'Americas',
      mineral: 'Copper',
      status: 'active',
      operator: 'Codelco',
      latitude: -22.3167,
      longitude: -68.9000,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    {
      id: 'example-cl-2',
      name: 'Escondida',
      country: 'Chile',
      continent: 'Americas',
      mineral: 'Copper',
      status: 'active',
      operator: 'BHP',
      latitude: -24.2333,
      longitude: -69.0667,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    // Peru
    {
      id: 'example-pe-1',
      name: 'Cerro Verde',
      country: 'Peru',
      continent: 'Americas',
      mineral: 'Copper',
      status: 'active',
      operator: 'Freeport-McMoRan',
      latitude: -16.5167,
      longitude: -71.5833,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    // Austrália
    {
      id: 'example-au-1',
      name: 'Mount Whaleback',
      country: 'Australia',
      continent: 'Oceania',
      mineral: 'Iron Ore',
      status: 'active',
      operator: 'BHP',
      latitude: -23.3667,
      longitude: 119.6500,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    {
      id: 'example-au-2',
      name: 'Olympic Dam',
      country: 'Australia',
      continent: 'Oceania',
      mineral: 'Copper, Uranium, Gold',
      status: 'active',
      operator: 'BHP',
      latitude: -30.4333,
      longitude: 136.8833,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    // África do Sul
    {
      id: 'example-za-1',
      name: 'Venetia',
      country: 'South Africa',
      continent: 'Africa',
      mineral: 'Diamonds',
      status: 'active',
      operator: 'De Beers',
      latitude: -22.4167,
      longitude: 29.3333,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    // Canadá
    {
      id: 'example-ca-1',
      name: 'Highland Valley Copper',
      country: 'Canada',
      continent: 'Americas',
      mineral: 'Copper, Molybdenum',
      status: 'active',
      operator: 'Teck Resources',
      latitude: 50.4667,
      longitude: -121.0167,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    // Indonésia
    {
      id: 'example-id-1',
      name: 'Grasberg',
      country: 'Indonesia',
      continent: 'Asia',
      mineral: 'Copper, Gold',
      status: 'active',
      operator: 'Freeport-McMoRan',
      latitude: -4.0500,
      longitude: 137.1167,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
    // China
    {
      id: 'example-cn-1',
      name: 'Dexing Copper Mine',
      country: 'China',
      continent: 'Asia',
      mineral: 'Copper',
      status: 'active',
      operator: 'Jiangxi Copper',
      latitude: 28.9667,
      longitude: 117.7000,
      source: 'Example Data',
      lastUpdate: new Date().toISOString().split('T')[0],
    },
  ];
}

export default {
  aggregateAllData,
  getDiagnostic,
  fetchRegulatoryChanges,
};

