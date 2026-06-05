import React from "react";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { ShoppingBag, Download, ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { purchaseItemAction, trackItemViewAction } from "@/lib/actions/marketplace-actions";

export default async function MarketplaceItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await marketplaceRepository.getBySlug(slug);

  if (!item || !item.published) {
    notFound();
  }

  // Track view
  await trackItemViewAction(item.id);

  return (
    <div className="py-20">
      <Container>
        <Link
          href="/marketplace"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>

        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="aspect-video overflow-hidden rounded-3xl bg-muted border">
              {item.preview_image ? (
                <img
                  src={item.preview_image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ShoppingBag className="h-24 w-24 text-muted/20" />
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full">
                  {item.category?.name}
                </Badge>
                {item.featured && (
                  <Badge className="rounded-full bg-primary text-primary-foreground">
                    Featured Asset
                  </Badge>
                )}
              </div>
              <h1 className="mt-4 text-4xl font-bold">{item.title}</h1>
              <div className="mt-6 prose prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-6 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground font-medium">Price</span>
                <span className="text-3xl font-bold">
                  {item.price === 0 ? "Free" : `$${item.price}`}
                </span>
              </div>

              <form action={purchaseItemAction.bind(null, item.id)}>
                <Button size="lg" className="w-full gap-2 rounded-xl text-lg font-bold">
                  {item.price === 0 ? (
                    <>
                      <Download className="h-5 w-5" />
                      Get for Free
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-5 w-5" />
                      Buy Now
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Secure payment & instant access</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span>Lifetime updates included</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold">Asset Details</h3>
              <dl className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{item.category?.name}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Released</dt>
                  <dd className="font-medium">
                    {new Date(item.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Sales</dt>
                  <dd className="font-medium">{item.sales_count}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-muted-foreground">Views</dt>
                  <dd className="font-medium">{item.views_count}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}
