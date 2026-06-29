import React from "react";
import Image from "next/image";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";
import { requireUser } from "@/lib/auth/auth";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketplaceItemForm } from "@/components/admin/MarketplaceItemForm";
import { 
  ShoppingBag, 
  Download, 
  Clock, 
  ExternalLink, 
  Store, 
  TrendingUp, 
  Plus 
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MarketplaceDashboard({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();

  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || "purchases";
  const categories = await marketplaceRepository.getCategories();
  const orders = await marketplaceRepository.getOrders(user.id);
  const myItems = await marketplaceRepository.getBySeller(user.id);

  const totalEarnings = myItems.reduce((acc, item) => acc + Number(item.revenue), 0);
  const totalSales = myItems.reduce((acc, item) => acc + item.sales_count, 0);

  return (
    <div className="py-12">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Marketplace Dashboard</h1>
          <p className="text-muted-foreground">Manage your purchases and sales.</p>
        </div>

        <div className="mb-8 flex border-b border-border/50">
          <Link
            href="/dashboard/marketplace?tab=purchases"
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "purchases"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            My Purchases
          </Link>
          <Link
            href="/dashboard/marketplace?tab=seller"
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "seller"
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Store className="h-4 w-4" />
            Seller Dashboard
          </Link>
        </div>

        {activeTab === "purchases" && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingBag className="mb-4 h-12 w-12 text-muted/20" />
                <h3 className="text-xl font-semibold">No purchases yet</h3>
                <Link href="/marketplace" className="mt-4">
                  <Button>Browse Marketplace</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid gap-6">
                {orders.map((order: any) => (
                  <Card key={order.id} className="p-6">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-muted">
                        {order.item.preview_image && (
                          <Image
                            src={order.item.preview_image}
                            alt={order.item.title || "Purchased marketplace item"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{order.item.title}</h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Purchased on {new Date(order.created_at).toLocaleDateString()}</span>
                          <span className="font-semibold text-foreground">${order.amount}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`/api/marketplace/download/${order.item_id}`} target="_blank">
                          <Button className="gap-2">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "seller" && (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold">${totalEarnings.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Total Sales</p>
                    <p className="text-2xl font-bold">{totalSales}</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Active Items</p>
                    <p className="text-2xl font-bold">{myItems.length}</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">List New Item</h3>
              </div>
              <MarketplaceItemForm categories={categories} />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">My Items</h3>
              {myItems.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">You haven&apos;t listed any items yet.</p>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {myItems.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative h-12 w-12 overflow-hidden rounded-lg border bg-muted">
                            {item.preview_image && (
                              <Image
                                src={item.preview_image}
                                alt={item.title || "Marketplace item preview"}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant={item.published ? "secondary" : "outline"} className="h-5 px-1.5">
                                {item.published ? "Live" : "Draft"}
                              </Badge>
                              <span>${item.price}</span>
                              <span>•</span>
                              <span>{item.sales_count} sales</span>
                            </div>
                          </div>
                        </div>
                        <Link href={`/marketplace/${item.slug}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
