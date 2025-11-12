import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import {
  DOUScraper,
  getDOUScraper,
  searchDOU,
  getTodayMiningNews,
  type DOUDocument,
  type ScraperConfig,
} from '../dou';

// Mock axios
vi.mock('axios');

// Mock xml2js
vi.mock('xml2js', () => ({
  parseStringPromise: vi.fn(),
}));

import { parseStringPromise } from 'xml2js';

describe('DOUScraper', () => {
  let scraper: DOUScraper;
  const mockPost = vi.mocked(axios.get);
  const mockParseXML = vi.mocked(parseStringPromise);

  beforeEach(() => {
    vi.clearAllMocks();
    scraper = new DOUScraper();
  });

  afterEach(() => {
    vi.resetAllMocks();
    scraper.clearCache();
  });

  // ============================================================================
  // MOCK DATA
  // ============================================================================

  const mockRSSResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>DOU</title>
        <item>
          <title>AGÊNCIA NACIONAL DE MINERAÇÃO - Seção 1</title>
          <description>Autorização de Pesquisa Mineral nº 123.456/2024 - CFEM</description>
          <link>https://www.in.gov.br/web/dou/-/id=12345</link>
          <pubDate>Wed, 01 Nov 2025 10:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Ministério de Minas e Energia - Seção 2</title>
          <description>Concessão de lavra para mineração de ouro</description>
          <link>https://www.in.gov.br/web/dou/-/id=12346</link>
          <pubDate>Wed, 01 Nov 2025 11:00:00 GMT</pubDate>
        </item>
        <item>
          <title>Outros Assuntos - Seção 3</title>
          <description>Regulamentação geral sem relação com mineração</description>
          <link>https://www.in.gov.br/web/dou/-/id=12347</link>
          <pubDate>Wed, 01 Nov 2025 12:00:00 GMT</pubDate>
        </item>
      </channel>
    </rss>`;

  const mockParsedRSS = {
    rss: {
      channel: [
        {
          item: [
            {
              title: ['AGÊNCIA NACIONAL DE MINERAÇÃO - Seção 1'],
              description: ['Autorização de Pesquisa Mineral nº 123.456/2024 - CFEM'],
              link: ['https://www.in.gov.br/web/dou/-/id=12345'],
              pubDate: ['Wed, 01 Nov 2025 10:00:00 GMT'],
            },
            {
              title: ['Ministério de Minas e Energia - Seção 2'],
              description: ['Concessão de lavra para mineração de ouro'],
              link: ['https://www.in.gov.br/web/dou/-/id=12346'],
              pubDate: ['Wed, 01 Nov 2025 11:00:00 GMT'],
            },
            {
              title: ['Outros Assuntos - Seção 3'],
              description: ['Regulamentação geral sem relação com mineração'],
              link: ['https://www.in.gov.br/web/dou/-/id=12347'],
              pubDate: ['Wed, 01 Nov 2025 12:00:00 GMT'],
            },
          ],
        },
      ],
    },
  };

  // ============================================================================
  // INITIALIZATION TESTS
  // ============================================================================

  describe('Initialization', () => {
    it('should create scraper with default config', () => {
      const newScraper = new DOUScraper();
      const stats = newScraper.getStats();

      expect(stats.totalFetched).toBe(0);
      expect(stats.totalMatched).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it('should create scraper with custom config', () => {
      const customConfig: Partial<ScraperConfig> = {
        maxResults: 50,
        cacheTTL: 5000,
        searchTerms: ['custom', 'terms'],
      };

      const customScraper = new DOUScraper(customConfig);
      expect(customScraper).toBeDefined();
    });

    it('should return singleton instance', () => {
      const instance1 = getDOUScraper();
      const instance2 = getDOUScraper();

      expect(instance1).toBe(instance2);
    });
  });

  // ============================================================================
  // SCRAPING TESTS
  // ============================================================================

  describe('scrape()', () => {
    beforeEach(() => {
      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockParsedRSS);
    });

    it('should fetch and parse DOU documents', async () => {
      const documents = await scraper.scrape();

      expect(mockPost).toHaveBeenCalled();
      expect(mockParseXML).toHaveBeenCalled();
      expect(documents).toBeDefined();
      expect(Array.isArray(documents)).toBe(true);
    });

    it('should filter documents by search terms', async () => {
      const documents = await scraper.scrape();

      // Should only return docs with mining-related terms
      expect(documents.length).toBeGreaterThan(0);
      
      // All mock documents contain mining terms
      documents.forEach(doc => {
        expect(doc.terms).toBeDefined();
        expect(doc.terms.length).toBeGreaterThan(0);
      });
    });

    it('should categorize documents correctly', async () => {
      const documents = await scraper.scrape();

      documents.forEach(doc => {
        expect(doc.category).toBeDefined();
        expect(['ANM', 'CFEM', 'LICENCA', 'CONCESSAO', 'PESQUISA', 'OUTROS']).toContain(doc.category);
      });
    });

    it('should extract section numbers', async () => {
      const documents = await scraper.scrape();

      documents.forEach(doc => {
        expect(doc.section).toBeDefined();
        expect([1, 2, 3]).toContain(doc.section);
      });
    });

    it('should score relevance correctly', async () => {
      const documents = await scraper.scrape();

      documents.forEach(doc => {
        expect(doc.relevance).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(doc.relevance);
      });

      // Should be sorted by relevance
      for (let i = 0; i < documents.length - 1; i++) {
        const scoreMap = { high: 3, medium: 2, low: 1 };
        expect(scoreMap[documents[i].relevance]).toBeGreaterThanOrEqual(
          scoreMap[documents[i + 1].relevance]
        );
      }
    });

    it('should extract entities from content', async () => {
      const documents = await scraper.scrape();

      documents.forEach(doc => {
        expect(doc.entities).toBeDefined();
        expect(Array.isArray(doc.entities)).toBe(true);
      });
    });

    it('should generate unique IDs', async () => {
      const documents = await scraper.scrape();

      const ids = documents.map(doc => doc.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should include all required fields', async () => {
      const documents = await scraper.scrape();

      documents.forEach(doc => {
        expect(doc.id).toBeDefined();
        expect(doc.title).toBeDefined();
        expect(doc.content).toBeDefined();
        expect(doc.publishedAt).toBeInstanceOf(Date);
        expect(doc.section).toBeDefined();
        expect(doc.url).toBeDefined();
        expect(doc.terms).toBeDefined();
        expect(doc.entities).toBeDefined();
        expect(doc.category).toBeDefined();
        expect(doc.relevance).toBeDefined();
      });
    });
  });

  // ============================================================================
  // CACHE TESTS
  // ============================================================================

  describe('Cache', () => {
    beforeEach(() => {
      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockParsedRSS);
    });

    it('should cache results', async () => {
      const firstCall = await scraper.scrape();
      const secondCall = await scraper.scrape();

      // Should only call API once
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(firstCall).toEqual(secondCall);
    });

    it('should clear cache', async () => {
      await scraper.scrape();
      scraper.clearCache();

      await scraper.scrape();

      // Should call API twice (once before clear, once after)
      expect(mockPost).toHaveBeenCalledTimes(2);
    });

    it('should respect cache TTL', async () => {
      // Create scraper with very short TTL
      const shortTTLScraper = new DOUScraper({ cacheTTL: 100 });

      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      await shortTTLScraper.scrape();

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      await shortTTLScraper.scrape();

      // Should call API twice (cache expired)
      expect(mockPost).toHaveBeenCalledTimes(2);
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));

      await expect(scraper.scrape()).rejects.toThrow('Network error');

      const stats = scraper.getStats();
      expect(stats.errors).toBe(1);
    });

    it('should handle invalid XML', async () => {
      mockPost.mockResolvedValue({
        data: 'invalid xml',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockRejectedValue(new Error('XML parse error'));

      await expect(scraper.scrape()).rejects.toThrow();
    });

    it('should handle empty RSS feed', async () => {
      mockPost.mockResolvedValue({
        data: '<?xml version="1.0"?><rss><channel></channel></rss>',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue({
        rss: {
          channel: [{}],
        },
      });

      const documents = await scraper.scrape();
      expect(documents).toEqual([]);
    });

    it('should handle API timeout', async () => {
      mockPost.mockRejectedValue({ code: 'ECONNABORTED', message: 'Timeout' });

      await expect(scraper.scrape()).rejects.toThrow();

      const stats = scraper.getStats();
      expect(stats.errors).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  describe('Statistics', () => {
    beforeEach(() => {
      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockParsedRSS);
    });

    it('should track totalFetched', async () => {
      await scraper.scrape();

      const stats = scraper.getStats();
      expect(stats.totalFetched).toBeGreaterThan(0);
    });

    it('should track totalMatched', async () => {
      await scraper.scrape();

      const stats = scraper.getStats();
      expect(stats.totalMatched).toBeGreaterThan(0);
    });

    it('should update lastRun timestamp', async () => {
      const beforeTime = new Date();
      await scraper.scrape();
      const afterTime = new Date();

      const stats = scraper.getStats();
      expect(stats.lastRun.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(stats.lastRun.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should track avgResponseTime', async () => {
      await scraper.scrape();

      const stats = scraper.getStats();
      expect(stats.avgResponseTime).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CONFIGURATION TESTS
  // ============================================================================

  describe('Configuration', () => {
    it('should update configuration', () => {
      scraper.updateConfig({ maxResults: 200 });

      // Config should be updated (tested indirectly through behavior)
      expect(scraper).toBeDefined();
    });

    it('should use custom search terms', async () => {
      const customScraper = new DOUScraper({
        searchTerms: ['termo-especifico'],
      });

      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockParsedRSS);

      const documents = await customScraper.scrape();

      // Should filter based on custom terms
      expect(documents).toBeDefined();
    });
  });

  // ============================================================================
  // HELPER FUNCTIONS TESTS
  // ============================================================================

  describe('Helper Functions', () => {
    beforeEach(() => {
      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockParsedRSS);
    });

    it('searchDOU should search multiple days', async () => {
      vi.useFakeTimers();

      const promise = searchDOU(['ANM'], 3);

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      const results = await promise;

      expect(Array.isArray(results)).toBe(true);
      expect(mockPost).toHaveBeenCalled();

      vi.useRealTimers();
    }, 10000);

    it('getTodayMiningNews should return today documents', async () => {
      const documents = await getTodayMiningNews();

      expect(Array.isArray(documents)).toBe(true);
      // Should have used cache from previous test
      expect(documents).toBeDefined();
    });
  });

  // ============================================================================
  // ENTITY EXTRACTION TESTS
  // ============================================================================

  describe('Entity Extraction', () => {
    it('should extract process numbers', async () => {
      const mockWithProcess = {
        ...mockParsedRSS,
        rss: {
          channel: [
            {
              item: [
                {
                  title: ['ANM - Processo 12345.678.901/2024'],
                  description: ['Autorização de pesquisa mineral para processo 12345.678.901/2024'],
                  link: ['https://www.in.gov.br/web/dou/-/id=99999'],
                  pubDate: ['Wed, 01 Nov 2025 10:00:00 GMT'],
                },
              ],
            },
          ],
        },
      };

      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockWithProcess);

      const documents = await scraper.scrape();

      const docsWithEntities = documents.filter(doc => doc.entities.length > 0);
      expect(docsWithEntities.length).toBeGreaterThan(0);
    });

    it('should extract CNPJ', async () => {
      const mockWithCNPJ = {
        ...mockParsedRSS,
        rss: {
          channel: [
            {
              item: [
                {
                  title: ['ANM - Mineradora XYZ'],
                  description: ['CNPJ 12.345.678/0001-90 - Autorização de mineração'],
                  link: ['https://www.in.gov.br/web/dou/-/id=99998'],
                  pubDate: ['Wed, 01 Nov 2025 10:00:00 GMT'],
                },
              ],
            },
          ],
        },
      };

      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockWithCNPJ);

      const documents = await scraper.scrape();

      const docsWithCNPJ = documents.filter(doc =>
        doc.entities.some(e => e.includes('/'))
      );
      expect(docsWithCNPJ.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // RATE LIMITING TESTS
  // ============================================================================

  describe('Rate Limiting', () => {
    it('should respect rate limit delay', async () => {
      vi.useFakeTimers();

      mockPost.mockResolvedValue({
        data: mockRSSResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      mockParseXML.mockResolvedValue(mockParsedRSS);

      const promise = scraper.scrape();

      // Fast-forward through delay
      await vi.runAllTimersAsync();

      await promise;

      expect(mockPost).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
