import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments/payment-provider";
import { membershipRepository } from "@/lib/repositories/membership.repository";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";

  if (!authorization) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: currentUser, error: userError } = await supabaseServer.auth.getUser(authorization);

  if (userError || !currentUser?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const planId = typeof body?.planId === "string" ? body.planId : undefined;
  const billingCycle = body?.billingCycle === "yearly" ? "yearly" : "monthly";
  const returnUrl = typeof body?.returnUrl === "string" ? body.returnUrl : "";
  const providerName = body?.provider === "razorpay" ? "razorpay" : "stripe";

  if (!planId || !returnUrl) {
    return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
  }

  const plan = (await membershipRepository.getPlanById(planId)) ?? (await membershipRepository.getPlanBySlug(planId));
  if (!plan) {
    return NextResponse.json({ success: false, error: "Membership plan not found" }, { status: 404 });
  }

  const provider = getPaymentProvider(providerName);
  const checkoutSession = await provider.createCheckoutSession({
    userId: currentUser.user.id,
    planId: plan.id,
    billingCycle,
    returnUrl,
  });

  const selectedPrice = billingCycle === "yearly" ? plan.yearly_price : plan.monthly_price;

  if (selectedPrice > 0) {
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.checkoutUrl,
      sessionId: checkoutSession.sessionId,
      subscription: null,
      paymentRequired: true,
    });
  }

  await supabaseServer
    .from("user_subscriptions")
    .update({ status: "canceled" })
    .eq("user_id", currentUser.user.id)
    .eq("status", "active");

  const now = new Date();
  const endDate = new Date(now.getTime() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000);

  const { data: insertedSubscription, error: insertError } = await supabaseServer
    .from("user_subscriptions")
    .insert([
      {
        user_id: currentUser.user.id,
        plan_id: plan.id,
        status: "active",
        billing_cycle: billingCycle,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
      },
    ])
    .select("*, membership_plans(*)")
    .single();

  if (insertError || !insertedSubscription) {
    console.error("Failed to create subscription:", insertError);
    return NextResponse.json({ success: false, error: "Unable to create subscription" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    checkoutUrl: checkoutSession.checkoutUrl,
    sessionId: checkoutSession.sessionId,
    subscription: insertedSubscription,
    paymentRequired: false,
  });
}
