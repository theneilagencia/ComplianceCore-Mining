import type { CommodityType, CommodityPrice } from '../types';

/**
 * Commodity Price Service
 * Fetches real-time commodity prices from various sources
 * 
 * Sources:
 * - LME (London Metal Exchange) - copper, nickel, zinc, lead
 * - COMEX - gold, silver
 * - KITCO - gold, silver
 * - Manual fallback prices
 */

// Fallback prices (USD) - updated periodically
const FALLBACK_PRICES: Record<CommodityType, { price: number; unit: string }> = {
  gold: { price: 2050, unit: 'USD/oz' },
  silver: { price: 24, unit: 'USD/oz' },
  copper: { price: 8500, unit: 'USD/tonne' },
  iron: { price: 120, unit: 'USD/tonne' },
  nickel: { price: 18000, unit: 'USD/tonne' },
  lithium: { price: 35000, unit: 'USD/tonne' },
  zinc: { price: 2500, unit: 'USD/tonne' },
  lead: { price: 2100, unit: 'USD/tonne' },
};

export class CommodityPriceService {
  /**
   * Get current price for a commodity
   * In production, this would call real APIs (LME, COMEX, etc.)
   */
  async getPrice(commodity: CommodityType): Promise<CommodityPrice> {
    // TODO: Implement real API calls
    // For now, return fallback prices with small random variation
    
    const base = FALLBACK_PRICES[commodity];
    const variation = 1 + (Math.random() - 0.5) * 0.05; // ±2.5% variation
    const price = Math.round(base.price * variation * 100) / 100;
    
    return {
      commodity,
      price,
      unit: base.unit,
      source: 'MANUAL',
      timestamp: new Date(),
    };
  }

  /**
   * Get historical prices (for trend analysis)
   */
  async getHistoricalPrices(
    commodity: CommodityType,
    days: number = 30
  ): Promise<Array<{ date: Date; price: number }>> {
    // Mock historical data
    const base = FALLBACK_PRICES[commodity].price;
    const history: Array<{ date: Date; price: number }> = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const trend = Math.sin(i / 10) * 0.1; // Simulate trend
      const noise = (Math.random() - 0.5) * 0.05; // Random noise
      const price = base * (1 + trend + noise);
      
      history.push({
        date,
        price: Math.round(price * 100) / 100,
      });
    }
    
    return history;
  }

  /**
   * Get price forecast (simple moving average)
   */
  async getForecast(
    commodity: CommodityType,
    days: number = 90
  ): Promise<{ low: number; base: number; high: number }> {
    const current = await this.getPrice(commodity);
    const base = current.price;
    
    // Simple forecast: ±10% range
    return {
      low: Math.round(base * 0.9 * 100) / 100,
      base: base,
      high: Math.round(base * 1.1 * 100) / 100,
    };
  }
}

export const commodityPriceService = new CommodityPriceService();

