import Razorpay from "razorpay";
import type { CheckoutSessionPayload, CheckoutSessionResult, PaymentProvider } from "@/lib/payments/payment-provider";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = razorpayKeyId && razorpayKeySecret
  ? new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    })
  : null;

export const RazorpayProvider: PaymentProvider = {
  providerName: "razorpay",
  async createCheckoutSession(payload: CheckoutSessionPayload): Promise<CheckoutSessionResult> {
    if (!razorpay) {
      console.error("Razorpay client is not configured. RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.");
      return {
        success: false,
        provider: "razorpay",
        checkoutUrl: "",
        sessionId: "",
      };
    }

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
