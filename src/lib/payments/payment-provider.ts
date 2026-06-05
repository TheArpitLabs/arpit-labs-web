import { RazorpayProvider } from "@/lib/payments/razorpay-provider";
import { StripeProvider } from "@/lib/payments/stripe-provider";

export type PaymentProviderName = "stripe" | "razorpay";

export interface CheckoutSessionPayload {
  userId: string;
  planId: string;
  billingCycle: "monthly" | "yearly";
  returnUrl: string;
}

export interface CheckoutSessionResult {
  success: boolean;
  provider: PaymentProviderName;
  checkoutUrl: string;
  sessionId: string;
}

export interface PaymentProvider {
  providerName: PaymentProviderName;
  createCheckoutSession(payload: CheckoutSessionPayload): Promise<CheckoutSessionResult>;
}

export function getPaymentProvider(name: PaymentProviderName): PaymentProvider {
  switch (name) {
    case "stripe":
      return StripeProvider;
    case "razorpay":
      return RazorpayProvider;
    default:
      throw new Error(`Unsupported payment provider: ${name}`);
  }
}
