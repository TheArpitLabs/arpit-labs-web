import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseServer } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Log the event
  await supabaseServer.from("payment_events").insert({
    provider: "stripe",
    event_type: event.type,
    payload: event,
  });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;
        const metadata = session.metadata;

        if (userId && metadata?.planId) {
          // Handle subscription completion
          if (session.mode === "subscription") {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            await supabaseServer.from("subscriptions").insert({
              user_id: userId,
              plan_id: metadata.planId,
              provider: "stripe",
              provider_subscription_id: subscriptionId,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            });
          } else {
            // Handle one-time payment
            await supabaseServer.from("transactions").insert({
              user_id: userId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency?.toUpperCase() || "USD",
              provider: "stripe",
              provider_transaction_id: session.payment_intent as string,
              status: "succeeded",
              type: "one_time",
              metadata: metadata,
            });
          }
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        // Update subscription or create transaction record
        if (invoice.subscription) {
           await supabaseServer.from("subscriptions").update({
             status: "active",
             current_period_end: new Date(invoice.lines.data[0].period.end * 1000).toISOString(),
           }).eq("provider_subscription_id", invoice.subscription);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await supabaseServer.from("subscriptions").update({
          status: "canceled",
        }).eq("provider_subscription_id", subscription.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
