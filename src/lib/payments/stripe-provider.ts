import type { CheckoutSessionPayload, CheckoutSessionResult, PaymentProvider } from "@/lib/payments/payment-provider";

export const StripeProvider: PaymentProvider = {
  providerName: "stripe",
  async createCheckoutSession(payload: CheckoutSessionPayload): Promise<CheckoutSessionResult> {
    return {
      success: true,
      provider: "stripe",
      checkoutUrl: `${payload.returnUrl}/billing?provider=stripe&plan=${payload.planId}`,
      sessionId: `stripe_${payload.userId}_${payload.planId}_${Date.now()}`,
    };
  },
};
