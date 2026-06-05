import type { CheckoutSessionPayload, CheckoutSessionResult, PaymentProvider } from "@/lib/payments/payment-provider";

export const RazorpayProvider: PaymentProvider = {
  providerName: "razorpay",
  async createCheckoutSession(payload: CheckoutSessionPayload): Promise<CheckoutSessionResult> {
    return {
      success: true,
      provider: "razorpay",
      checkoutUrl: `${payload.returnUrl}/billing?provider=razorpay&plan=${payload.planId}`,
      sessionId: `razorpay_${payload.userId}_${payload.planId}_${Date.now()}`,
    };
  },
};
