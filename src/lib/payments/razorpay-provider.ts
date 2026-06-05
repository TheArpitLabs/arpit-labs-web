import Razorpay from "razorpay";
import type { CheckoutSessionPayload, CheckoutSessionResult, PaymentProvider } from "@/lib/payments/payment-provider";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const RazorpayProvider: PaymentProvider = {
  providerName: "razorpay",
  async createCheckoutSession(payload: CheckoutSessionPayload): Promise<CheckoutSessionResult> {
    try {
      // Razorpay uses "Orders" for one-time and "Subscriptions" for recurring
      // For simplicity in this implementation, we create an order
      // In a full implementation, we'd use razorpay.subscriptions.create
      
      const order = await razorpay.orders.create({
        amount: 0, // Should be fetched from plan
        currency: "INR",
        receipt: `receipt_${payload.userId}_${Date.now()}`,
        notes: {
          userId: payload.userId,
          planId: payload.planId,
          billingCycle: payload.billingCycle,
        },
      });

      return {
        success: true,
        provider: "razorpay",
        checkoutUrl: `${payload.returnUrl}?order_id=${order.id}&provider=razorpay`,
        sessionId: order.id as string,
      };
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      return {
        success: false,
        provider: "razorpay",
        checkoutUrl: "",
        sessionId: "",
      };
    }
  },
};
