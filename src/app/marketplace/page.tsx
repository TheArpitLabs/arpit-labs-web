"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Filter, ShoppingBag, Package, TrendingUp, Clock, Sparkles, Star, ArrowRight } from "lucide-react";


export default function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const [resolvedSearchParams, setResolvedSearchParams] = React.useState<{ category?: string; q?: string }>({});
  const [categories, setCategories] = React.useState<any[]>([]);
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      const params = await searchParams;
      setResolvedSearchParams(params);
      
      const [cats, allItems] = await Promise.all([
        marketplaceRepository.getCategories(),
        marketplaceRepository.getAll({
          category: params.category,
          published: true,
        }),
      ]);
      
      setCategories(cats);
      setItems(allItems);
      setLoading(false);
    }
    loadData();
  }, [searchParams]);

  const filteredItems = resolvedSearchParams.q
    ? items.filter((item: any) =>
        item.title.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase()) ||
        item.description?.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase())
      )
    : items;

  // Separate items into sections
  const featuredItems = filteredItems.filter((item: any) => item.featured);
  const trendingItems = filteredItems.slice(0, 4);
  const recentlyAdded = [...filteredItems].reverse().slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="py-20">
          <Container>
            <div className="mb-12 text-center">
              <Skeleton variant="text" className="mx-auto h-16 w-64" />
              <Skeleton variant="text" className="mx-auto mt-4 h-6 w-96" />
            </div>
            <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} variant="card" className="h-64" />
              ))}
            </div>
          </Container>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="py-20">
        <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-hero text-gradient">Marketplace</h1>
          <p className="mt-4 text-lg text-muted">
            Premium assets, templates, and tools to accelerate your development.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
        >
          <div className="flex flex-wrap gap-2">
            <Link href="/marketplace">
              <Badge variant={!resolvedSearchParams.category ? "premium" : "outline"} className="cursor-pointer">
                All
              </Badge>
            </Link>
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
              >
                <Link href={`/marketplace?category=${cat.slug}`}>
                  <Badge
                    variant={resolvedSearchParams.category === cat.slug ? "premium" : "outline"}
                    className="cursor-pointer"
                  >
                    {cat.name}
                  </Badge>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <form action="/marketplace" method="GET">
              {resolvedSearchParams.category && <input type="hidden" name="category" value={resolvedSearchParams.category} />}
              <input
                name="q"
                defaultValue={resolvedSearchParams.q}
                placeholder="Search assets..."
                className="w-full rounded-2xl glass pl-12 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </form>
          </div>
        </motion.div>

        {/* Featured Products Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && featuredItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-16"
          >
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Featured Products</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredItems.map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                >
                  <Link href={`/marketplace/${item.slug}`} className="group block">
                    <Card variant="elevated" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl">
                      <div className="aspect-video relative overflow-hidden bg-surface">
                        {item.preview_image ? (
                          <Image
                            src={item.preview_image}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <ShoppingBag className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                        <Badge variant="glow" className="absolute left-3 top-3 bg-primary text-primary-foreground">
                          Featured
                        </Badge>
                      </div>
                      <div className="p-5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">
                            {item.category?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                            <span className="text-xs font-semibold">{(item as any).rating || '4.5'}</span>
                          </div>
                        </div>
                        <h3 className="line-clamp-1 font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted">
                          {item.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">
                            {item.price === 0 ? "Free" : `$${item.price}`}
                          </span>
                          <span className="text-xs text-muted">
                            {(item as any).downloads || '0'} downloads
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Popular Categories Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && categories.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-16"
          >
            <div className="mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Popular Categories</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 8).map((cat: any, index: number) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.05 }}
                >
                  <Link href={`/marketplace?category=${cat.slug}`}>
                    <Badge variant="outline" className="cursor-pointer px-4 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-all">
                      {cat.name}
                    </Badge>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Trending Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Trending</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trendingItems.map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                >
                  <Link href={`/marketplace/${item.slug}`} className="group block">
                    <Card variant="glass" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
                      <div className="aspect-video relative overflow-hidden bg-surface">
                        {item.preview_image ? (
                          <Image
                            src={item.preview_image}
                            alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <ShoppingBag className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">
                            {item.category?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                            <span className="text-xs font-semibold">{(item as any).rating || '4.5'}</span>
                          </div>
                        </div>
                        <h3 className="line-clamp-1 font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">
                            {item.price === 0 ? "Free" : `$${item.price}`}
                          </span>
                          <span className="text-xs text-muted">
                            {(item as any).downloads || '0'} downloads
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recently Added Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-16"
          >
            <div className="mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Recently Added</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyAdded.map((item: any, index: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                >
                  <Link href={`/marketplace/${item.slug}`} className="group block">
                    <Card variant="glass" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg">
                      <div className="aspect-video relative overflow-hidden bg-surface">
                        {item.preview_image ? (
                          <Image
                            src={item.preview_image}
                            alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                            <ShoppingBag className="h-12 w-12 text-primary/40" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">
                            {item.category?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                            <span className="text-xs font-semibold">{(item as any).rating || '4.5'}</span>
                          </div>
                        </div>
                        <h3 className="line-clamp-1 font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">
                            {item.price === 0 ? "Free" : `$${item.price}`}
                          </span>
                          <span className="text-xs text-muted">
                            {(item as any).downloads || '0'} downloads
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* All Products Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <h2 className="mb-6 text-2xl font-semibold text-foreground">
            {resolvedSearchParams.q ? "Search Results" : resolvedSearchParams.category ? "Category Results" : "All Products"}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item: any, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.05 }}
              >
                <Link href={`/marketplace/${item.slug}`} className="group block">
                  <Card variant="elevated" className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl">
                    <div className="aspect-video relative overflow-hidden bg-surface">
                      {item.preview_image ? (
                        <Image
                          src={item.preview_image}
                          alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                          <ShoppingBag className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                      {item.featured && (
                        <Badge variant="glow" className="absolute left-3 top-3 bg-primary text-primary-foreground">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {item.category?.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          <span className="text-xs font-semibold">{(item as any).rating || '4.5'}</span>
                        </div>
                      </div>
                      <h3 className="line-clamp-1 font-semibold text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">
                          {item.price === 0 ? "Free" : `$${item.price}`}
                        </span>
                        <span className="text-xs text-muted">
                          {(item as any).downloads || '0'} downloads
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <EmptyState
              icon={ShoppingBag}
              title="No items found"
              description="Try adjusting your filters or search query to find what you're looking for."
              actionLabel="Clear Filters"
              actionHref="/marketplace"
              variant="minimal"
            />
          </motion.div>
        )}
      </Container>
      </div>
      <Footer />
    </div>
  );
}
