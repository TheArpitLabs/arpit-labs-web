import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseServer } from "@/lib/supabase/server";

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") as string;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.error("Razorpay webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  // Log the event
  await supabaseServer.from("payment_events").insert({
    provider: "razorpay",
    event_type: event.event,
    payload: event,
  });

  try {
    switch (event.event) {
      case "order.paid": {
        const payload = event.payload.order.entity;
        const notes = payload.notes;
        
        if (notes.userId && notes.planId) {
          // Record transaction
          await supabaseServer.from("transactions").insert({
            user_id: notes.userId,
            amount: payload.amount / 100,
            currency: payload.currency,
            provider: "razorpay",
            provider_transaction_id: payload.id,
            status: "succeeded",
            type: notes.billingCycle ? "subscription" : "one_time",
            metadata: notes,
          });

          // If subscription, update/create subscription record
          if (notes.billingCycle) {
            const now = new Date();
            const endDate = new Date(now);
            if (notes.billingCycle === "yearly") {
              endDate.setFullYear(now.getFullYear() + 1);
            } else {
              endDate.setMonth(now.getMonth() + 1);
            }

            await supabaseServer.from("subscriptions").insert({
              user_id: notes.userId,
              plan_id: notes.planId,
              provider: "razorpay",
              provider_subscription_id: payload.id, // Using order ID as subscription reference if not using RZP Subscriptions API
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: endDate.toISOString(),
            });
          }
        }
        break;
      }
      case "subscription.charged": {
        // Handle recurring subscription payments if using RZP Subscriptions
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
