"use server";

import { createClient } from "@/lib/supabase/server";
import { marketplaceItemSchema } from "@/lib/validation/marketplace.schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveMarketplaceItemAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const rawData = {
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category_id: formData.get("category_id"),
    price: formData.get("price"),
    currency: formData.get("currency") || "USD",
    featured: formData.get("featured") === "on" || formData.get("featured") === "true",
    published: formData.get("published") === "on" || formData.get("published") === "true",
    preview_image: formData.get("preview_image"),
    download_url: formData.get("download_url"),
  };

  const validated = marketplaceItemSchema.parse(rawData);
  const id = formData.get("id") as string;

  if (id) {
    const { error } = await supabase
      .from("marketplace_items")
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("marketplace_items")
      .insert({
        ...validated,
        seller_id: user.id,
      });

    if (error) throw error;
  }

  revalidatePath("/marketplace");
  revalidatePath("/admin/marketplace");
  revalidatePath("/dashboard/marketplace");
}

export async function toggleItemStatusAction(id: string, field: "published" | "featured", value: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketplace_items")
    .update({ [field]: value })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/marketplace");
}

export async function deleteMarketplaceItemAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("marketplace_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/marketplace");
}

export async function purchaseItemAction(itemId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: item, error: itemError } = await supabase
    .from("marketplace_items")
    .select("price, currency")
    .eq("id", itemId)
    .single();

  if (itemError || !item) throw new Error("Item not found");

  const { error: orderError } = await supabase
    .from("marketplace_orders")
    .insert({
      user_id: user.id,
      item_id: itemId,
      amount: item.price,
      currency: item.currency,
      status: "completed"
    });

  if (orderError) throw orderError;

  // Update sales count and revenue
  await supabase.rpc('increment_marketplace_sales', { 
    item_id: itemId, 
    amount: item.price 
  });

  revalidatePath("/dashboard/marketplace");
  redirect("/dashboard/marketplace");
}

export async function trackItemViewAction(itemId: string) {
  const supabase = await createClient();
  await supabase.rpc('increment_marketplace_views', { item_id: itemId });
}

export async function saveCategoryAction(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const id = formData.get("id") as string;

  if (id) {
    await supabase.from("marketplace_categories").update({ name, slug }).eq("id", id);
  } else {
    await supabase.from("marketplace_categories").insert({ name, slug });
  }

  revalidatePath("/admin/marketplace");
}

export async function deleteCategoryAction(id: string) {
  const supabase = await createClient();
  await supabase.from("marketplace_categories").delete().eq("id", id);
  revalidatePath("/admin/marketplace");
}
