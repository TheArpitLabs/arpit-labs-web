import { NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth";
import { membershipRepository } from "@/lib/repositories/membership.repository";

export async function PATCH(request: Request) {
  const adminUser = await getAdminUserFromRequest(request);

  if (!adminUser) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const planId = body?.id;
  const updates = body?.updates;

  if (!planId || !updates || typeof updates !== "object") {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  try {
    const plan = await membershipRepository.updatePlan(planId, {
      name: updates.name,
      description: updates.description,
      monthly_price: updates.monthly_price,
      yearly_price: updates.yearly_price,
      active: updates.active,
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Failed to update membership plan:", error);
    return NextResponse.json({ success: false, error: "Unable to update plan" }, { status: 500 });
  }
}
