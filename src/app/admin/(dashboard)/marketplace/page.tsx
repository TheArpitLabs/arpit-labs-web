import React from "react";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { Badge } from "@/components/ui/badge";
import { MarketplaceItemForm } from "@/components/admin/MarketplaceItemForm";
import { 
  Plus, 
  ShoppingBag, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Star 
} from "lucide-react";
import { 
  toggleItemStatusAction, 
  deleteMarketplaceItemAction 
} from "@/lib/actions/marketplace-actions";

export default async function AdminMarketplacePage() {
  const items = await marketplaceRepository.getAll();
  const categories = await marketplaceRepository.getCategories();

  return (
    <div className="space-y-8">
      <AdminSection
        title="Marketplace Management"
        description="Manage assets, templates, and digital products."
        icon={<ShoppingBag className="h-5 w-5" />}
        action={
          <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add New Item
          </button>
        }
      >
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Add / Edit Item</h3>
          <div className="rounded-2xl border border-border/50 bg-card p-6">
            <MarketplaceItemForm categories={categories} />
          </div>
        </div>

        <AdminTable
          headers={["Item", "Category", "Price", "Stats", "Status", "Actions"]}
        >
          {items.map((item) => (
            <tr key={item.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg border bg-muted">
                    {item.preview_image && (
                      <img
                        src={item.preview_image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm">{item.category?.name}</td>
              <td className="px-4 py-4 text-sm font-medium">
                {item.price === 0 ? "Free" : `$${item.price}`}
              </td>
              <td className="px-4 py-4 text-sm">
                <div className="flex flex-col gap-1">
                  <span>Views: {item.views_count}</span>
                  <span>Sales: {item.sales_count}</span>
                  <span className="text-primary font-medium">${item.revenue}</span>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={item.published ? "default" : "outline"}>
                    {item.published ? "Published" : "Draft"}
                  </Badge>
                  {item.featured && (
                    <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                      Featured
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <form action={toggleItemStatusAction.bind(null, item.id, "published", !item.published)}>
                    <button 
                      title={item.published ? "Unpublish" : "Publish"}
                      className="p-1 hover:text-primary transition-colors"
                    >
                      {item.published ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </button>
                  </form>
                  <form action={toggleItemStatusAction.bind(null, item.id, "featured", !item.featured)}>
                    <button 
                      title={item.featured ? "Unfeature" : "Feature"}
                      className={`p-1 transition-colors ${item.featured ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
                    >
                      <Star className="h-4 w-4" fill={item.featured ? "currentColor" : "none"} />
                    </button>
                  </form>
                  <a
                    href={`/marketplace/${item.slug}`}
                    target="_blank"
                    className="p-1 hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <form 
                    action={deleteMarketplaceItemAction.bind(null, item.id)}
                    onSubmit={(e) => {
                      if (!confirm("Are you sure you want to delete this item?")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <button className="p-1 hover:text-red-500">
                      <XCircle className="h-4 w-4 text-red-500/50 hover:text-red-500" />
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      </AdminSection>
    </div>
  );
}
