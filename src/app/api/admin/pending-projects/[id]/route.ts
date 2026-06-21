import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "approve") {
      const { error } = await supabaseServer
        .from("projects")
        .update({
          status: "approved",
          published: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Project approved and published"
      });
    }

    if (action === "reject") {
      const { error } = await supabaseServer
        .from("projects")
        .update({
          status: "rejected",
          published: false,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Project rejected"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use 'approve' or 'reject'" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const { id } = await params;
    const { error } = await supabaseServer
      .from("projects")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted"
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
