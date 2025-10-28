import type { ValuationInput, ValuationResult } from '../types';
import { commodityPriceService } from './commodityPriceService';

/**
 * DCF (Discounted Cash Flow) Valuation Service
 * Calculates NPV, IRR, and payback period for mining projects
 */

export class DCFService {
  /**
   * Calculate NPV (Net Present Value)
   */
  private calculateNPV(
    cashFlows: number[],
    discountRate: number
  ): number {
    let npv = 0;
    for (let year = 0; year < cashFlows.length; year++) {
      npv += cashFlows[year] / Math.pow(1 + discountRate, year);
    }
    return Math.round(npv);
  }

  /**
   * Calculate IRR (Internal Rate of Return) using Newton-Raphson method
   */
  private calculateIRR(cashFlows: number[]): number {
    let irr = 0.1; // Initial guess: 10%
    const maxIterations = 100;
    const tolerance = 0.0001;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let derivative = 0;

      for (let year = 0; year < cashFlows.length; year++) {
        npv += cashFlows[year] / Math.pow(1 + irr, year);
        derivative -= (year * cashFlows[year]) / Math.pow(1 + irr, year + 1);
      }

      const newIrr = irr - npv / derivative;

      if (Math.abs(newIrr - irr) < tolerance) {
        return Math.round(newIrr * 10000) / 100; // Convert to percentage
      }

      irr = newIrr;
    }

    return Math.round(irr * 10000) / 100;
  }

  /**
   * Calculate payback period
   */
  private calculatePaybackPeriod(cashFlows: number[]): number {
    let cumulative = 0;
    for (let year = 0; year < cashFlows.length; year++) {
      cumulative += cashFlows[year];
      if (cumulative >= 0) {
        // Linear interpolation for fractional year
        const previousCumulative = cumulative - cashFlows[year];
        const fraction = -previousCumulative / cashFlows[year];
        return Math.round((year + fraction) * 10) / 10;
      }
    }
    return cashFlows.length; // Payback not achieved
  }

  /**
   * Perform DCF valuation
   */
  async calculate(input: ValuationInput): Promise<Omit<ValuationResult, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> {
    const {
      projectName,
      commodity,
      method,
      resources,
      economics,
    } = input;

    // Get current commodity price if not provided
    let commodityPrice = economics.commodityPrice;
    if (!commodityPrice) {
      const priceData = await commodityPriceService.getPrice(commodity);
      commodityPrice = priceData.price;
    }

    // Default parameters
    const opex = economics.opex || 50; // USD per tonne
    const capex = economics.capex || 100000000; // 100M USD
    const recoveryRate = (economics.recoveryRate || 85) / 100;
    const discountRate = (economics.discountRate || 10) / 100;
    const mineLife = economics.mineLife || 10; // years
    const productionRate = economics.productionRate || 1000000; // 1M tonnes/year

    // Calculate total recoverable resources
    const totalResources = (resources.measured || 0) + (resources.indicated || 0) + (resources.inferred || 0) * 0.5;
    const recoverableResources = totalResources * recoveryRate;

    // Calculate annual production
    const annualProduction = Math.min(productionRate, recoverableResources / mineLife);

    // Calculate annual revenue
    const annualRevenue = annualProduction * resources.grade * commodityPrice;

    // Calculate annual operating cost
    const annualOpex = annualProduction * opex;

    // Calculate annual gross profit
    const annualGrossProfit = annualRevenue - annualOpex;

    // Generate cash flows
    const cashFlows: number[] = [];
    
    // Year 0: Initial CAPEX (negative)
    cashFlows.push(-capex);
    
    // Years 1 to mineLife: Annual cash flows
    for (let year = 1; year <= mineLife; year++) {
      cashFlows.push(annualGrossProfit);
    }

    // Calculate NPV
    const npv = this.calculateNPV(cashFlows, discountRate);

    // Calculate IRR
    const irr = this.calculateIRR(cashFlows);

    // Calculate payback period
    const paybackPeriod = this.calculatePaybackPeriod(cashFlows);

    // Calculate totals
    const totalRevenue = annualRevenue * mineLife;
    const totalOpex = annualOpex * mineLife;
    const totalCapex = capex;
    const grossProfit = totalRevenue - totalOpex;
    const netProfit = grossProfit - totalCapex;

    // Sensitivity analysis
    const sensitivity = {
      commodityPrice: {
        low: this.calculateNPV(
          cashFlows.map((cf, i) => i === 0 ? cf : cf * 0.9),
          discountRate
        ),
        base: npv,
        high: this.calculateNPV(
          cashFlows.map((cf, i) => i === 0 ? cf : cf * 1.1),
          discountRate
        ),
      },
      opex: {
        low: this.calculateNPV(
          cashFlows.map((cf, i) => i === 0 ? cf : cf + (annualOpex * 0.1)),
          discountRate
        ),
        base: npv,
        high: this.calculateNPV(
          cashFlows.map((cf, i) => i === 0 ? cf : cf - (annualOpex * 0.1)),
          discountRate
        ),
      },
      grade: {
        low: this.calculateNPV(
          cashFlows.map((cf, i) => i === 0 ? cf : cf * 0.9),
          discountRate
        ),
        base: npv,
        high: this.calculateNPV(
          cashFlows.map((cf, i) => i === 0 ? cf : cf * 1.1),
          discountRate
        ),
      },
    };

    return {
      projectName,
      commodity,
      method,
      input,
      npv,
      irr,
      paybackPeriod,
      breakdown: {
        totalRevenue,
        totalOpex,
        totalCapex,
        grossProfit,
        netProfit,
      },
      sensitivity,
    };
  }
}

export const dcfService = new DCFService();

