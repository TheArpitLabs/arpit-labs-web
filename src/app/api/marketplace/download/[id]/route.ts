import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: any
) {
  const { id } = params;
  const supabase = supabaseServer;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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

  // Get download URL
  const { data: item, error: itemError } = await supabase
    .from("marketplace_items")
    .select("download_url, title")
    .eq("id", id)
    .single();

  if (itemError || !item || !item.download_url) {
    return new NextResponse("File not found", { status: 404 });
  }

  // Increment download count
  await supabase
    .from("marketplace_items")
    .update({ downloads_count: (item as any).downloads_count + 1 })
    .eq("id", id);

  return NextResponse.redirect(item.download_url);
}
