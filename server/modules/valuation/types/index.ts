import { z } from "zod";

// Valuation Methods
export type ValuationMethod = 'DCF' | 'COMPARABLE' | 'COST' | 'INCOME';

// Commodity Types
export type CommodityType = 'gold' | 'copper' | 'iron' | 'nickel' | 'lithium' | 'silver' | 'zinc' | 'lead';

// Resource Classification (JORC/NI 43-101)
export type ResourceClassification = 'measured' | 'indicated' | 'inferred';

// Input Schema
export const ValuationInputSchema = z.object({
  projectName: z.string().min(1),
  commodity: z.enum(['gold', 'copper', 'iron', 'nickel', 'lithium', 'silver', 'zinc', 'lead']),
  method: z.enum(['DCF', 'COMPARABLE', 'COST', 'INCOME']),
  
  // Resource Data
  resources: z.object({
    measured: z.number().optional(),
    indicated: z.number().optional(),
    inferred: z.number().optional(),
    grade: z.number(), // % or g/t
    unit: z.enum(['tonnes', 'oz', 'g/t', '%']),
  }),
  
  // Economic Parameters
  economics: z.object({
    commodityPrice: z.number().optional(), // USD per unit
    opex: z.number().optional(), // Operating cost per tonne
    capex: z.number().optional(), // Capital expenditure
    recoveryRate: z.number().optional(), // % (0-100)
    discountRate: z.number().optional(), // % (0-100)
    mineLife: z.number().optional(), // years
    productionRate: z.number().optional(), // tonnes per year
  }),
  
  // Location (for comparable method)
  location: z.object({
    country: z.string().optional(),
    region: z.string().optional(),
  }).optional(),
});

export type ValuationInput = z.infer<typeof ValuationInputSchema>;

// Valuation Result
export interface ValuationResult {
  id: string;
  userId: string;
  projectName: string;
  commodity: CommodityType;
  method: ValuationMethod;
  
  // Input data
  input: ValuationInput;
  
  // Calculated values
  npv: number; // Net Present Value (USD)
  irr: number; // Internal Rate of Return (%)
  paybackPeriod: number; // years
  
  // Breakdown
  breakdown: {
    totalRevenue: number;
    totalOpex: number;
    totalCapex: number;
    grossProfit: number;
    netProfit: number;
  };
  
  // Sensitivity Analysis
  sensitivity?: {
    commodityPrice: { low: number; base: number; high: number };
    opex: { low: number; base: number; high: number };
    grade: { low: number; base: number; high: number };
  };
  
  // Comparable Projects (if method = COMPARABLE)
  comparables?: Array<{
    name: string;
    commodity: CommodityType;
    location: string;
    npv: number;
    resources: number;
    grade: number;
  }>;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Commodity Price Data (real-time from APIs)
export interface CommodityPrice {
  commodity: CommodityType;
  price: number; // USD per unit
  unit: string;
  source: 'LME' | 'COMEX' | 'KITCO' | 'MANUAL';
  timestamp: Date;
}

// Comparable Project Data
export interface ComparableProject {
  name: string;
  commodity: CommodityType;
  location: {
    country: string;
    region: string;
  };
  resources: {
    measured: number;
    indicated: number;
    inferred: number;
    grade: number;
  };
  valuation: {
    npv: number;
    irr: number;
    date: Date;
  };
  source: string;
}

