import { z } from "zod";
import { protectedProcedure, router } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as stripeService from "./stripeService";

export const billingRouter = router({
  // Get Stripe status
  getStatus: protectedProcedure.query(() => {
    return stripeService.getStripeStatus();
  }),

  // Create customer portal session
  createPortalSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get user's Stripe customer ID from database
      const customerId = ctx.user.stripeCustomerId || `cus_mock_${ctx.user.id}`;
      
      const result = await stripeService.createCustomerPortalSession(
        customerId,
        input.returnUrl
      );
      
      return result;
    }),

  // Create checkout session
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
        discountCode: z.string().optional(),
        addOns: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await stripeService.createCheckoutSession({
        customerId: ctx.user.stripeCustomerId,
        customerEmail: ctx.user.email,
        priceId: input.priceId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        discountCode: input.discountCode,
        addOns: input.addOns,
      });
      
      return result;
    }),

  // Get subscription details
  getSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const result = await stripeService.getSubscription(input.subscriptionId);
      return result;
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        immediately: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const result = await stripeService.cancelSubscription(
        input.subscriptionId,
        input.immediately
      );
      return result;
    }),

  // Update subscription (change plan)
  updateSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        newPriceId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await stripeService.updateSubscription(
        input.subscriptionId,
        input.newPriceId
      );
      return result;
    }),

  // List invoices
  listInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const customerId = ctx.user.stripeCustomerId || `cus_mock_${ctx.user.id}`;
      const result = await stripeService.listInvoices(customerId, input.limit);
      return result;
    }),

  // Create discount coupon (admin only)
  createDiscountCoupon: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        percentOff: z.enum(['10', '25', '40']),
        duration: z.enum(['once', 'repeating', 'forever']),
        durationInMonths: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create discount coupons',
        });
      }

      const result = await stripeService.createDiscountCoupon({
        code: input.code,
        percentOff: parseInt(input.percentOff) as 10 | 25 | 40,
        duration: input.duration,
        durationInMonths: input.durationInMonths,
      });
      
      return result;
    }),
});

