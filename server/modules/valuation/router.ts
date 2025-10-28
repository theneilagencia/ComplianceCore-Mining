import { router, protectedProcedure } from "../../_core/trpc";
import { ValuationInputSchema } from "./types";
import { dcfService } from "./services/dcfService";
import { commodityPriceService } from "./services/commodityPriceService";
import { z } from "zod";

export const valuationRouter = router({
  /**
   * Calculate valuation using specified method
   */
  calculate: protectedProcedure
    .input(ValuationInputSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await dcfService.calculate(input);
      
      // In production, save to database
      // const saved = await db.valuation.create({
      //   data: {
      //     ...result,
      //     userId: ctx.user.id,
      //   },
      // });
      
      return {
        ...result,
        id: `val_${Date.now()}`,
        userId: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }),

  /**
   * Get commodity price
   */
  getCommodityPrice: protectedProcedure
    .input(z.object({
      commodity: z.enum(['gold', 'copper', 'iron', 'nickel', 'lithium', 'silver', 'zinc', 'lead']),
    }))
    .query(async ({ input }) => {
      return await commodityPriceService.getPrice(input.commodity);
    }),

  /**
   * Get historical prices
   */
  getHistoricalPrices: protectedProcedure
    .input(z.object({
      commodity: z.enum(['gold', 'copper', 'iron', 'nickel', 'lithium', 'silver', 'zinc', 'lead']),
      days: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await commodityPriceService.getHistoricalPrices(
        input.commodity,
        input.days
      );
    }),

  /**
   * Get price forecast
   */
  getPriceForecast: protectedProcedure
    .input(z.object({
      commodity: z.enum(['gold', 'copper', 'iron', 'nickel', 'lithium', 'silver', 'zinc', 'lead']),
      days: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return await commodityPriceService.getForecast(
        input.commodity,
        input.days
      );
    }),

  /**
   * List all valuations for current user
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      // In production, fetch from database
      // return await db.valuation.findMany({
      //   where: { userId: ctx.user.id },
      //   orderBy: { createdAt: 'desc' },
      // });
      
      return [];
    }),

  /**
   * Get valuation by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // In production, fetch from database
      // return await db.valuation.findFirst({
      //   where: {
      //     id: input.id,
      //     userId: ctx.user.id,
      //   },
      // });
      
      return null;
    }),
});

