import Link from "next/link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTable } from "@/components/admin/AdminTable";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ProductForm } from "@/components/admin/ProductForm";
import { deleteProductAction } from "@/lib/actions/admin-actions";
import { productsRepository } from "@/lib/repositories/products.repository";
import { Search } from "lucide-react";
import { Product } from "@/types/content";

interface AdminProductsPageProps {
  searchParams?: Promise<{
    edit?: string;
    search?: string;
    category?: string;
    published?: string;
  }>;
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams;
  const filters = {
    search: params?.search,
    category: params?.category,
    published: params?.published === "true" ? true : params?.published === "false" ? false : undefined,
  };

  const products = await productsRepository.getProducts(filters);
  const editingProduct = params?.edit
    ? await productsRepository.getProductById(params.edit).catch(() => null) || 
      await productsRepository.getProductBySlug(params.edit).catch(() => null)
    : null;

  const categories = Array.from(new Set(products.map((product) => product.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      <AdminTopbar title="Products CMS" subtitle="Create, manage, and publish product offerings for the Arpit Labs suite." />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:w-2/5">
          <AdminSection
            title={editingProduct ? "Edit Product" : "Create Product"}
            description="Manage product metadata, media, pricing, and feature details."
          >
            <ProductForm product={editingProduct as Product} />
          </AdminSection>
        </div>

        <div className="w-full lg:w-3/5 space-y-4">
          <AdminSection title="Product Inventory" description="View published products, plan updates, and featured offerings.">
            <div className="mb-6 flex flex-wrap gap-4">
              <form className="flex flex-1 items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    name="search"
                    defaultValue={params?.search}
                    placeholder="Search products..."
                    className="h-10 w-full rounded-xl border border-border/70 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary"
                  />
                </div>
                <select
                  name="category"
                  defaultValue={params?.category}
                  className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <button type="submit" className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
                  Apply
                </button>
                {params && Object.keys(params).length > 0 && (
                  <Link href="/admin/products" className="flex h-10 items-center justify-center rounded-xl border border-border/70 px-4 text-sm font-medium">
                    Clear
                  </Link>
                )}
              </form>
            </div>

            {products.length > 0 ? (
              <AdminTable headers={["Product", "Status", "Featured", "Actions"]}>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{product.title}</p>
                        <p className="text-xs text-muted">{product.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${product.published ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                        {product.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {product.featured ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">★</span>
                      ) : (
                        <span className="text-muted/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/products?edit=${product.id}`} className="rounded-lg border border-border/70 p-2 text-foreground transition hover:border-primary hover:text-primary">
                          Edit
                        </Link>
                        <form action={deleteProductAction} onSubmit={(e) => !confirm("Delete this product?") && e.preventDefault()}>
                          <input type="hidden" name="id" value={product.id} />
                          <button type="submit" className="rounded-lg border border-red-500/30 p-2 text-red-500 transition hover:bg-red-500 hover:text-white">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            ) : (
              <AdminEmptyState title="No products found" description="Create a new product to publish it to the hub." />
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
