import { NextResponse } from "next/server";

// PAYMENTS TEMPORARILY DISABLED
// Subscription management is temporarily unavailable during product validation phase.
// To re-enable: Uncomment the original implementation below and remove this 501 response.

export async function GET(request: Request) {
  return NextResponse.json(
    {
      success: false,
      message: "Subscription management is temporarily unavailable.",
    },
    { status: 501 }
  );
}

export async function POST(request: Request) {
  return NextResponse.json(
    {
      success: false,
      message: "Subscription management is temporarily unavailable.",
    },
    { status: 501 }
  );
}

/*
// ORIGINAL IMPLEMENTATION (Commented out - re-enable when payments are restored)
import { supabaseServer } from "@/lib/supabase/server";
import { paymentRepository } from "@/lib/repositories/payment.repository";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!authorization) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(authorization);
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const subscription = await paymentRepository.getUserSubscription(user.id);
    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!authorization) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(authorization);
  if (authError || !user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { action, planId } = await request.json();

  if (action === "cancel") {
    // Implement cancellation logic (e.g., talk to Stripe/Razorpay)
    // For now, update DB status
    const { error } = await supabaseServer
      .from("subscriptions")
      .update({ status: "canceled", cancel_at_period_end: true })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: "Subscription canceled" });
  }

  return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
}
*/
