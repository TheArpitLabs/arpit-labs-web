import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { RazorpayProvider } from "@/lib/payments/razorpay-provider";
import { paymentRepository } from "@/lib/repositories/payment.repository";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!authorization) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(authorization);
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { planSlug, billingCycle, returnUrl } = body;

  if (!planSlug || !returnUrl) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    const plan = await paymentRepository.getPlanBySlug(planSlug);
    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
    }

    const session = await RazorpayProvider.createCheckoutSession({
      userId: user.id,
      planId: plan.id,
      billingCycle: billingCycle || "monthly",
      returnUrl: returnUrl,
    });

    if (!session.success) {
      return NextResponse.json({ success: false, error: "Failed to create Razorpay order" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
