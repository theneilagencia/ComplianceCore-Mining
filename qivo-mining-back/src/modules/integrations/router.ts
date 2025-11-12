import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import * as realAPIs from "./realAPIs";

export const integrationsRouter = router({
  // Health check for Bridge module (Integrations)
  health: protectedProcedure.query(async () => {
    const status = realAPIs.getAPIsStatus();
    return {
      status: 'healthy',
      module: 'Bridge (Integrations)',
      version: '1.0.0',
      components: {
        ibama: {
          status: status.ibama.enabled ? 'active' : 'unavailable',
          configured: status.ibama.enabled,
          fallback: status.ibama.mock ? 'mock_data' : undefined,
          last_check: new Date().toISOString(),
        },
        copernicus: {
          status: status.copernicus.enabled ? 'active' : 'unavailable',
          configured: status.copernicus.enabled,
          fallback: status.copernicus.mock ? 'mock_data' : undefined,
          last_check: new Date().toISOString(),
        },
        lme: {
          status: status.lme.enabled ? 'active' : 'unavailable',
          configured: status.lme.enabled,
          fallback: status.lme.mock ? 'mock_data' : undefined,
        },
        comex: {
          status: status.comex.enabled ? 'active' : 'unavailable',
          configured: status.comex.enabled,
          fallback: status.comex.mock ? 'mock_data' : undefined,
        },
        bridgeAI: {
          status: 'available',
          endpoint: process.env.BRIDGE_AI_URL || 'http://localhost:8001/api/bridge',
          reachable: true,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }),

  // Get APIs status (deprecated - use health instead)
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

