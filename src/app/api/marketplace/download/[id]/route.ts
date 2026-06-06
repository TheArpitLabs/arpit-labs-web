import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createAuthenticatedSupabaseClient, getUserTokenFromRequest, getUserFromRequest, getUserRefreshTokenFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: any
) {
  const { id } = params;
  const token = getUserTokenFromRequest(request);
  const refreshToken = getUserRefreshTokenFromRequest(request);
  const user = await getUserFromRequest(request);

  if (!token || !user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = await createAuthenticatedSupabaseClient(token, refreshToken || undefined);
  if (!supabase) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Check if user has purchased the item
  const { data: order, error: orderError } = await supabase
    .from("marketplace_orders")
    .select("status")
    .eq("user_id", user.id)
    .eq("item_id", id)
    .eq("status", "completed")
    .single();

  if (orderError || !order) {
    return new NextResponse("Forbidden: Purchase required", { status: 403 });
  }

  // Get download URL and current count
  const { data: item, error: itemError } = await supabase
    .from("marketplace_items")
    .select("download_url, title, downloads_count")
    .eq("id", id)
    .single();

  if (itemError || !item || !item.download_url) {
    return new NextResponse("File not found", { status: 404 });
  }

  await supabaseServer
    .from("marketplace_items")
    .update({ downloads_count: (item.downloads_count ?? 0) + 1 })
    .eq("id", id);

  return NextResponse.redirect(item.download_url);
}
