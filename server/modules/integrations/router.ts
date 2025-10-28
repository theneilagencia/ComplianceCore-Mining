import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as realAPIs from "./realAPIs";

export const integrationsRouter = router({
  // Get APIs status
  getStatus: protectedProcedure.query(() => {
    return realAPIs.getAPIsStatus();
  }),

  // IBAMA: Get environmental licenses
  ibama: router({
    getLicenses: protectedProcedure
      .input(
        z.object({
          cnpj: z.string().optional(),
          projectName: z.string().optional(),
          state: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        return await realAPIs.getIBAMALicenses(input);
      }),
  }),

  // Copernicus: Get satellite data
  copernicus: router({
    getData: protectedProcedure
      .input(
        z.object({
          latitude: z.number(),
          longitude: z.number(),
          startDate: z.string(),
          endDate: z.string(),
          dataType: z.enum(['ndvi', 'deforestation', 'land_cover']),
        })
      )
      .query(async ({ input }) => {
        return await realAPIs.getCopernicusData(input);
      }),
  }),

  // LME: Get metal prices
  lme: router({
    getPrices: protectedProcedure
      .input(
        z.object({
          metals: z.array(z.string()),
        })
      )
      .query(async ({ input }) => {
        return await realAPIs.getLMEPrices(input.metals);
      }),
  }),

  // COMEX: Get commodity prices
  comex: router({
    getPrices: protectedProcedure
      .input(
        z.object({
          commodities: z.array(z.string()),
        })
      )
      .query(async ({ input }) => {
        return await realAPIs.getCOMEXPrices(input.commodities);
      }),
  }),
});

