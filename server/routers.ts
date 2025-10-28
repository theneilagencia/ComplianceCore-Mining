import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { technicalReportsRouter } from "./modules/technical-reports/router";
import { esgRouter } from "./modules/esg/router";
import { valuationRouter } from "./modules/valuation/router";
import { billingRouter } from "./modules/billing/router";
import { integrationsRouter } from "./modules/integrations/router";
import { storageRouter } from "./modules/storage/router";

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
  esg: esgRouter,
  valuation: valuationRouter,
  billing: billingRouter,
  integrations: integrationsRouter,
  storage: storageRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
