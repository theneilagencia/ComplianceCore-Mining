/**
 * DOU (Diário Oficial da União) Scraper
 * 
 * Scraper para extrair publicações relacionadas à mineração do DOU
 * através do portal oficial e feed RSS.
 * 
 * Termos Monitorados:
 * - mineração
 * - licença
 * - CFEM
 * - ANM
 * - DNPM (legado)
 * - jazida
 * - lavra
 * - pesquisa mineral
 * - concessão de lavra
 * - autorização de pesquisa
 */

import axios, { AxiosError } from 'axios';
import { parseStringPromise } from 'xml2js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DOUDocument {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
  section: 1 | 2 | 3; // DOU sections
  url: string;
  terms: string[]; // Matched terms
  entities: string[]; // Extracted entities (company names, process numbers)
  category: 'ANM' | 'CFEM' | 'LICENCA' | 'CONCESSAO' | 'PESQUISA' | 'OUTROS';
  relevance: 'high' | 'medium' | 'low';
}

export interface ScraperConfig {
  baseUrl: string;
  rssUrl: string;
  searchTerms: string[];
  maxResults: number;
  cacheTTL: number; // milliseconds
  rateLimitDelay: number; // milliseconds between requests
}

export interface ScraperStats {
  totalFetched: number;
  totalMatched: number;
  lastRun: Date;
  errors: number;
  avgResponseTime: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: ScraperConfig = {
  baseUrl: 'https://www.in.gov.br/consulta',
  rssUrl: 'https://www.in.gov.br/rss',
  searchTerms: [
    'mineração',
    'mineracao',
    'licença minerária',
    'licenca mineraria',
    'CFEM',
    'ANM',
    'DNPM',
    'jazida',
    'lavra',
    'pesquisa mineral',
    'concessão de lavra',
    'concessao de lavra',
    'autorização de pesquisa',
    'autorizacao de pesquisa',
    'alvará de pesquisa',
    'alvara de pesquisa',
    'direito minerário',
    'direito minerario',
  ],
  maxResults: 100,
  cacheTTL: 1000 * 60 * 60, // 1 hour
  rateLimitDelay: 2000, // 2 seconds
};

// Regex patterns for entity extraction
const PATTERNS = {
  processNumber: /\d{5,}\.\d{3,}\.\d{3,}\/\d{4}/g,
  cnpj: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
  cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
  anmProcess: /\d{3,}\.?\d{3}\/\d{4}/g,
};

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry {
  data: DOUDocument[];
  timestamp: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: DOUDocument[], ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  get(key: string): DOUDocument[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// DOU SCRAPER CLASS
// ============================================================================

export class DOUScraper {
  private config: ScraperConfig;
  private cache: SimpleCache;
  private stats: ScraperStats;

  constructor(config?: Partial<ScraperConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new SimpleCache();
    this.stats = {
      totalFetched: 0,
      totalMatched: 0,
      lastRun: new Date(),
      errors: 0,
      avgResponseTime: 0,
    };
  }

  /**
   * Main entry point - fetch and parse DOU documents
   */
  async scrape(date?: Date): Promise<DOUDocument[]> {
    console.log('[DOUScraper] Starting scrape...');
    const startTime = Date.now();

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(date);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`[DOUScraper] Cache hit: ${cached.length} documents`);
        return cached;
      }

      // Fetch from RSS feed
      const documents = await this.fetchFromRSS(date);

      // Filter by search terms
      const filtered = this.filterByTerms(documents);

      // Categorize and score relevance
      const processed = filtered.map(doc => this.processDocument(doc));

      // Sort by relevance
      const sorted = processed.sort((a, b) => {
        const scoreMap = { high: 3, medium: 2, low: 1 };
        return scoreMap[b.relevance] - scoreMap[a.relevance];
      });

      // Update cache
      this.cache.set(cacheKey, sorted, this.config.cacheTTL);

      // Update stats
      this.stats.totalFetched += documents.length;
      this.stats.totalMatched += sorted.length;
      this.stats.lastRun = new Date();
      this.stats.avgResponseTime = Date.now() - startTime;

      console.log(`[DOUScraper] Complete: ${sorted.length} relevant documents found`);
      return sorted;

    } catch (error) {
      this.stats.errors++;
      console.error('[DOUScraper] Error during scrape:', error);
      throw error;
    }
  }

  /**
   * Fetch documents from DOU RSS feed
   */
  private async fetchFromRSS(date?: Date): Promise<Partial<DOUDocument>[]> {
    console.log('[DOUScraper] Fetching RSS feed...');

    try {
      // Add rate limiting delay
      await this.delay(this.config.rateLimitDelay);

      const targetDate = date || new Date();
      const dateStr = this.formatDate(targetDate);

      const response = await axios.get(this.config.rssUrl, {
        params: {
          data: dateStr,
          secao: 'todas', // All sections
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'QIVO-Mining-Radar/1.0',
        },
      });

      // Parse XML
      const parsed = await parseStringPromise(response.data);

      if (!parsed.rss || !parsed.rss.channel || !parsed.rss.channel[0].item) {
        console.log('[DOUScraper] No items found in RSS feed');
        return [];
      }

      const items = parsed.rss.channel[0].item;

      const documents: Partial<DOUDocument>[] = items.map((item: any) => ({
        id: this.generateId(item.link?.[0] || ''),
        title: item.title?.[0] || '',
        content: item.description?.[0] || '',
        publishedAt: new Date(item.pubDate?.[0] || new Date()),
        url: item.link?.[0] || '',
        section: this.extractSection(item.title?.[0] || ''),
      }));

      console.log(`[DOUScraper] Fetched ${documents.length} documents from RSS`);
      return documents;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        console.error('[DOUScraper] RSS fetch error:', axiosError.message);
        if (axiosError.response) {
          console.error('[DOUScraper] Response status:', axiosError.response.status);
        }
      }
      throw error;
    }
  }

  /**
   * Filter documents by search terms
   */
  private filterByTerms(documents: Partial<DOUDocument>[]): Partial<DOUDocument>[] {
    return documents.filter(doc => {
      const searchText = `${doc.title} ${doc.content}`.toLowerCase();
      const matchedTerms = this.config.searchTerms.filter(term =>
        searchText.includes(term.toLowerCase())
      );

      if (matchedTerms.length > 0) {
        doc.terms = matchedTerms;
        return true;
      }
      return false;
    });
  }

  /**
   * Process document: extract entities, categorize, score relevance
   */
  private processDocument(doc: Partial<DOUDocument>): DOUDocument {
    const fullText = `${doc.title} ${doc.content}`;

    // Extract entities
    const entities = this.extractEntities(fullText);

    // Categorize
    const category = this.categorizeDocument(doc.terms || [], fullText);

    // Score relevance
    const relevance = this.scoreRelevance(doc.terms || [], entities, category);

    return {
      id: doc.id!,
      title: doc.title!,
      content: doc.content!,
      publishedAt: doc.publishedAt!,
      section: doc.section!,
      url: doc.url!,
      terms: doc.terms!,
      entities,
      category,
      relevance,
    };
  }

  /**
   * Extract entities from text (process numbers, CNPJ, etc)
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];

    // Extract process numbers
    const processes = text.match(PATTERNS.processNumber) || [];
    entities.push(...processes);

    // Extract ANM process numbers
    const anmProcesses = text.match(PATTERNS.anmProcess) || [];
    entities.push(...anmProcesses);

    // Extract CNPJ
    const cnpjs = text.match(PATTERNS.cnpj) || [];
    entities.push(...cnpjs);

    // Remove duplicates
    return Array.from(new Set(entities));
  }

  /**
   * Categorize document based on content
   */
  private categorizeDocument(terms: string[], text: string): DOUDocument['category'] {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('anm') || lowerText.includes('agência nacional de mineração')) {
      return 'ANM';
    }
    if (lowerText.includes('cfem')) {
      return 'CFEM';
    }
    if (lowerText.includes('licença') || lowerText.includes('licenca')) {
      return 'LICENCA';
    }
    if (lowerText.includes('concessão de lavra') || lowerText.includes('concessao de lavra')) {
      return 'CONCESSAO';
    }
    if (lowerText.includes('pesquisa mineral') || lowerText.includes('autorização de pesquisa')) {
      return 'PESQUISA';
    }

    return 'OUTROS';
  }

  /**
   * Score document relevance
   */
  private scoreRelevance(
    terms: string[],
    entities: string[],
    category: DOUDocument['category']
  ): DOUDocument['relevance'] {
    let score = 0;

    // More matched terms = higher relevance
    score += terms.length * 2;

    // Entities (process numbers, CNPJ) increase relevance
    score += entities.length * 3;

    // Category weight
    const categoryWeight = {
      ANM: 5,
      CFEM: 4,
      CONCESSAO: 4,
      LICENCA: 3,
      PESQUISA: 3,
      OUTROS: 1,
    };
    score += categoryWeight[category];

    // Classify based on score
    if (score >= 10) return 'high';
    if (score >= 5) return 'medium';
    return 'low';
  }

  /**
   * Extract section number from title
   */
  private extractSection(title: string): 1 | 2 | 3 {
    if (title.includes('Seção 1')) return 1;
    if (title.includes('Seção 2')) return 2;
    if (title.includes('Seção 3')) return 3;
    return 1; // Default
  }

  /**
   * Generate unique ID from URL
   */
  private generateId(url: string): string {
    // Extract ID from URL or generate from hash
    const match = url.match(/id=(\d+)/);
    if (match) return `dou-${match[1]}`;

    // Fallback: use timestamp
    return `dou-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format date for API (DD-MM-YYYY)
   */
  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  /**
   * Get cache key for date
   */
  private getCacheKey(date?: Date): string {
    const d = date || new Date();
    return `dou-${this.formatDate(d)}`;
  }

  /**
   * Rate limiting delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get scraper statistics
   */
  getStats(): ScraperStats {
    return { ...this.stats };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[DOUScraper] Cache cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ScraperConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[DOUScraper] Configuration updated');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let scraperInstance: DOUScraper | null = null;

export function getDOUScraper(config?: Partial<ScraperConfig>): DOUScraper {
  if (!scraperInstance) {
    scraperInstance = new DOUScraper(config);
  }
  return scraperInstance;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Quick search for specific terms in recent DOU publications
 */
export async function searchDOU(
  terms: string[],
  days: number = 7
): Promise<DOUDocument[]> {
  const scraper = getDOUScraper({ searchTerms: terms });
  const results: DOUDocument[] = [];

  // Search last N days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    try {
      const docs = await scraper.scrape(date);
      results.push(...docs);
    } catch (error) {
      console.error(`[searchDOU] Error fetching date ${date.toISOString()}:`, error);
    }

    // Rate limiting between days
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

/**
 * Get today's mining-related DOU publications
 */
export async function getTodayMiningNews(): Promise<DOUDocument[]> {
  const scraper = getDOUScraper();
  return scraper.scrape(new Date());
}

export default {
  DOUScraper,
  getDOUScraper,
  searchDOU,
  getTodayMiningNews,
};
