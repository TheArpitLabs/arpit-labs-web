import Stripe from "stripe";
import type { CheckoutSessionPayload, CheckoutSessionResult, PaymentProvider } from "@/lib/payments/payment-provider";
import { logger } from '@/lib/logger';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16" as any,
    })
  : null;

export const StripeProvider: PaymentProvider = {
  providerName: "stripe",
  async createCheckoutSession(payload: CheckoutSessionPayload): Promise<CheckoutSessionResult> {
    if (!stripe) {
      logger.error("Stripe client is not configured. STRIPE_SECRET_KEY is missing.");
      return {
        success: false,
        provider: "stripe",
        checkoutUrl: "",
        sessionId: "",
      };
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Plan: ${payload.planId}`,
              },
              unit_amount: 0, // This should be fetched from the plan, but for now we pass it or fetch it
              // In a real scenario, we'd use price IDs
              recurring: {
                interval: payload.billingCycle === "yearly" ? "year" : "month",
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${payload.returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${payload.returnUrl}?canceled=true`,
        client_reference_id: payload.userId,
        metadata: {
          userId: payload.userId,
          planId: payload.planId,
          billingCycle: payload.billingCycle,
        },
      });

      return {
        success: true,
        provider: "stripe",
        checkoutUrl: session.url!,
        sessionId: session.id,
      };
    } catch (error) {
      logger.error("Stripe Checkout Error:", error);
      return {
        success: false,
        provider: "stripe",
        checkoutUrl: "",
        sessionId: "",
      };
    }
  },
};
