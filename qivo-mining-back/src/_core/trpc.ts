import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

// Performance tracking middleware
const performanceMiddleware = t.middleware(async (opts) => {
  const { path, type, next } = opts;
  const start = Date.now();
  
  const result = await next();
  
  const duration = Date.now() - start;
  
  // Log slow requests (> 1s)
  if (duration > 1000) {
    console.warn(`[TRPC Performance] Slow ${type} request: ${path} took ${duration}ms`);
  }
  
  // Log in dev mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TRPC] ${type} ${path} - ${duration}ms`);
  }
  
  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(performanceMiddleware);


const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure
  .use(performanceMiddleware)
  .use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
