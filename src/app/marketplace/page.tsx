import React from "react";
import Image from "next/image";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Search, Filter, ShoppingBag } from "lucide-react";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const categories = await marketplaceRepository.getCategories();
  const items = await marketplaceRepository.getAll({
    category: resolvedSearchParams.category,
    published: true,
  });

  const filteredItems = resolvedSearchParams.q
    ? items.filter((item) =>
        item.title.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase()) ||
        item.description?.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase())
      )
    : items;

  return (
    <div className="py-20">
      <Container>
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Marketplace</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Premium assets, templates, and tools to accelerate your development.
          </p>
        </div>

        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace">
              <Badge variant={!resolvedSearchParams.category ? "secondary" : "outline"} className="cursor-pointer">
                All
              </Badge>
            </Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/marketplace?category=${cat.slug}`}>
                <Badge
                  variant={resolvedSearchParams.category === cat.slug ? "secondary" : "outline"}
                  className="cursor-pointer"
                >
                  {cat.name}
                </Badge>
              </Link>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <form action="/marketplace" method="GET">
              {resolvedSearchParams.category && <input type="hidden" name="category" value={resolvedSearchParams.category} />}
              <input
                name="q"
                defaultValue={resolvedSearchParams.q}
                placeholder="Search assets..."
                className="w-full rounded-full border border-border/70 bg-background pl-10 pr-4 py-2 text-sm outline-none focus:border-primary"
              />
            </form>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <Link key={item.id} href={`/marketplace/${item.slug}`}>
              <Card className="group h-full overflow-hidden transition-all hover:border-primary/50">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {item.preview_image ? (
                    <Image
                      src={item.preview_image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ShoppingBag className="h-12 w-12 text-muted/20" />
                    </div>
                  )}
                  {item.featured && (
                    <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="p-5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">
                      {item.category?.name}
                    </span>
                    <span className="text-sm font-bold">
                      {item.price === 0 ? "Free" : `$${item.price}`}
                    </span>
                  </div>
                  <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="mb-4 h-12 w-12 text-muted/20" />
            <h3 className="text-xl font-semibold">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
          </div>
        )}
      </Container>
    </div>
  );
}
