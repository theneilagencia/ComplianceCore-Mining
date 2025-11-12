import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { technicalReportsRouter } from "./modules/technical-reports/router";
// esgRouter removed (not in briefing)
// valuationRouter removed (not in briefing)
import { billingRouter } from "./modules/billing/router";
import { integrationsRouter } from "./modules/integrations/router";
import { storageRouter } from "./modules/storage/router";
// import { radarAdminRouter } from "./modules/radar/admin-router"; // Temporariamente desabilitado

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  technicalReports: technicalReportsRouter,
  // esg: esgRouter, // removed
  // valuation: valuationRouter, // removed
  billing: billingRouter,
  integrations: integrationsRouter,
  storage: storageRouter,
  // radarAdmin: radarAdminRouter, // Temporariamente desabilitado


});

export type AppRouter = typeof appRouter;

// Module load detection
console.log('MODULE LOAD: server/routers.ts loaded -', new Date().toISOString());
