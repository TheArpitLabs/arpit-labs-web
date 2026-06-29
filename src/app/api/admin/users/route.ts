import { NextRequest, NextResponse } from "next/server";
import { getAdminUserFromRequest } from "@/lib/auth/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { setUserRole, getUserRole } from "@/lib/auth/admin";

// GET /api/admin/users - Fetch all users with filtering
export async function GET(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const email = searchParams.get("email");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  try {
    let query = supabaseServer
      .from("profiles")
      .select("*", { count: "exact" })
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (role) {
      query = query.eq("role", role);
    }

    if (email) {
      query = query.eq("email", email);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
      meta: {
        page,
        limit,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: page < Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users - Update user role or status
export async function PUT(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { userId, action, role, verified, suspended } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    // Check if target user is admin (prevent demoting the last admin)
    const targetRole = await getUserRole(userId);
    if (targetRole === "admin" && action === "demote") {
      // Check if this is the last admin
      const { data: admins } = await supabaseServer
        .from("profiles")
        .select("id")
        .eq("role", "admin");
      
      if (admins && admins.length <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot demote the last admin" },
          { status: 400 }
        );
      }
    }

    let updateData: any = {};

    if (role) {
      updateData.role = role;
    }

    if (verified !== undefined) {
      updateData.verified = verified;
    }

    if (suspended !== undefined) {
      updateData.suspended = suspended;
    }

    const { error } = await supabaseServer
      .from("profiles")
      .update(updateData)
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(request: NextRequest) {
  const admin = await getAdminUserFromRequest(request);
  if (!admin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
  }

  try {
    // Check if target user is admin (prevent deleting the last admin)
    const targetRole = await getUserRole(userId);
    if (targetRole === "admin") {
      const { data: admins } = await supabaseServer
        .from("profiles")
        .select("id")
        .eq("role", "admin");
      
      if (admins && admins.length <= 1) {
        return NextResponse.json(
          { success: false, error: "Cannot delete the last admin" },
          { status: 400 }
        );
      }
    }

    const { error } = await supabaseServer
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
