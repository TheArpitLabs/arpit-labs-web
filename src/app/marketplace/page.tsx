"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Search, Filter, ShoppingBag, Package, TrendingUp, Clock, Sparkles, Star, ArrowRight, BookOpen, Layout, Zap, Layers, Code2, Database } from "lucide-react";


export default function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const [resolvedSearchParams, setResolvedSearchParams] = React.useState<{ category?: string; q?: string; type?: string; sort?: string; price?: string }>({});
  const [categories, setCategories] = React.useState<any[]>([]);
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState("newest");
  const [priceFilter, setPriceFilter] = React.useState<string>("all");

  const resourceTypes = [
    { name: "Learning Resources", icon: BookOpen, slug: "learning", color: "from-purple-500/10 to-pink-500/10", iconColor: "from-purple-500 to-pink-500" },
    { name: "Templates", icon: Layout, slug: "templates", color: "from-blue-500/10 to-cyan-500/10", iconColor: "from-blue-500 to-cyan-500" },
    { name: "Starter Kits", icon: Zap, slug: "starter-kits", color: "from-green-500/10 to-emerald-500/10", iconColor: "from-green-500 to-emerald-500" },
    { name: "Design Assets", icon: Layers, slug: "design-assets", color: "from-orange-500/10 to-red-500/10", iconColor: "from-orange-500 to-red-500" },
    { name: "Documentation", icon: Code2, slug: "documentation", color: "from-indigo-500/10 to-violet-500/10", iconColor: "from-indigo-500 to-violet-500" },
  ];

  // Calculate dynamic counts for resource types
  const getResourceTypeCount = (slug: string) => {
    return items.filter((item: any) => {
      const categoryName = item.category?.name?.toLowerCase() || "";
      if (slug === "learning") return categoryName.includes("learning") || categoryName.includes("course") || categoryName.includes("tutorial");
      if (slug === "templates") return categoryName.includes("template") || categoryName.includes("boilerplate");
      if (slug === "starter-kits") return categoryName.includes("starter") || categoryName.includes("kit");
      if (slug === "design-assets") return categoryName.includes("design") || categoryName.includes("ui") || categoryName.includes("asset");
      if (slug === "documentation") return categoryName.includes("documentation") || categoryName.includes("docs");
      return false;
    }).length;
  };

  React.useEffect(() => {
    async function loadData() {
      const params = await searchParams;
      setResolvedSearchParams(params);
      
      const [catsRes, itemsRes] = await Promise.all([
        fetch("/api/marketplace/categories"),
        fetch(`/api/marketplace/items?category=${params.category || ""}&published=true`),
      ]);
      
      const cats = await catsRes.json();
      const allItems = await itemsRes.json();
      
      setCategories(cats);
      setItems(allItems);
      setLoading(false);
    }
    loadData();
  }, [searchParams]);

  const filteredItems = items
    .filter((item: any) => {
      // Search filter
      if (resolvedSearchParams.q) {
        const searchLower = resolvedSearchParams.q.toLowerCase();
        if (!item.title.toLowerCase().includes(searchLower) && 
            !item.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Category filter
      if (resolvedSearchParams.category && item.category?.slug !== resolvedSearchParams.category) {
        return false;
      }
      
      // Price filter
      if (priceFilter === "free" && item.price !== 0) {
        return false;
      }
      if (priceFilter === "paid" && item.price === 0) {
        return false;
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      // Sorting
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "popular":
          return b.sales_count - a.sales_count;
        case "rating":
          return (b.rating || 4.5) - (a.rating || 4.5);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Separate items into sections
  const featuredItems = filteredItems.filter((item: any) => item.featured);
  const trendingItems = filteredItems.slice(0, 4);
  const recentlyAdded = [...filteredItems].reverse().slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen">
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
      <div className="py-20">
        <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h1 className="text-hero text-gradient">Engineering Resource Hub</h1>
          <p className="mt-4 text-lg text-muted">
            Access premium learning resources, templates, starter kits, design assets, and documentation to accelerate your engineering projects.
          </p>
        </motion.div>

        {/* Resource Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {resourceTypes.map((type) => {
              const count = getResourceTypeCount(type.slug);
              return (
                <Link key={type.slug} href={`/marketplace?type=${type.slug}`}>
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:shadow-2xl"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${type.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                    <div className="relative">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                        className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${type.iconColor} text-white shadow-lg`}
                      >
                        <type.icon size={24} />
                      </motion.div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                        {type.name}
                      </h3>
                      <p className="text-sm text-muted">{count} resources</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
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

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
          </div>
        </motion.div>

        {/* Advanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8 flex flex-wrap gap-4 items-center justify-between p-4 rounded-2xl glass"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted" />
              <span className="text-sm font-medium">Sort by:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("newest")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === "newest" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === "popular" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSortBy("price-low")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === "price-low" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => setSortBy("price-high")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === "price-high" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                Price: High to Low
              </button>
              <button
                onClick={() => setSortBy("rating")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  sortBy === "rating" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                Top Rated
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Price:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPriceFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  priceFilter === "all" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPriceFilter("free")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  priceFilter === "free" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                Free
              </button>
              <button
                onClick={() => setPriceFilter("paid")}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  priceFilter === "paid" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                Paid
              </button>
            </div>
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
                    <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50">
                      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                        {item.preview_image ? (
                          <Image
                            src={item.preview_image}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                            <ShoppingBag className="h-12 w-12 text-primary/40 mb-2" />
                            <span className="text-xs text-muted text-center">No preview available</span>
                          </div>
                        )}
                        <Badge className="absolute left-3 top-3 bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                        {item.price === 0 && (
                          <Badge className="absolute right-3 top-3 bg-green-500 text-white shadow-lg">
                            Free
                          </Badge>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">
                            {item.category?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
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
                            {item.sales_count || 0} sales
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
                    <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50">
                      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                        {item.preview_image ? (
                          <Image
                            src={item.preview_image}
                            alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                            <ShoppingBag className="h-12 w-12 text-primary/40 mb-2" />
                            <span className="text-xs text-muted text-center">No preview available</span>
                          </div>
                        )}
                        {item.price === 0 && (
                          <Badge className="absolute right-3 top-3 bg-green-500 text-white shadow-lg">
                            Free
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">
                            {item.category?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-semibold">{(item as any).rating || '4.5'}</span>
                          </div>
                        </div>
                        <h3 className="line-clamp-1 font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">
                            {item.price === 0 ? "Free" : `$${item.price}`}
                          </span>
                          <span className="text-xs text-muted">
                            {item.sales_count || 0} sales
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
                    <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50">
                      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                        {item.preview_image ? (
                          <Image
                            src={item.preview_image}
                            alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                            <ShoppingBag className="h-12 w-12 text-primary/40 mb-2" />
                            <span className="text-xs text-muted text-center">No preview available</span>
                          </div>
                        )}
                        {item.price === 0 && (
                          <Badge className="absolute right-3 top-3 bg-green-500 text-white shadow-lg">
                            Free
                          </Badge>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">
                            {item.category?.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-semibold">{(item as any).rating || '4.5'}</span>
                          </div>
                        </div>
                        <h3 className="line-clamp-1 font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</h3>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground">
                            {item.price === 0 ? "Free" : `$${item.price}`}
                          </span>
                          <span className="text-xs text-muted">
                            {item.sales_count || 0} sales
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
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              {resolvedSearchParams.q ? "Search Results" : resolvedSearchParams.category ? "Category Results" : "All Products"}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredItems.length} items)
              </span>
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item: any, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.5) }}
              >
                <Link href={`/marketplace/${item.slug}`} className="group block">
                  <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50">
                    <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                      {item.preview_image ? (
                        <Image
                          src={item.preview_image}
                          alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
                          <ShoppingBag className="h-12 w-12 text-primary/40 mb-2" />
                          <span className="text-xs text-muted text-center">No preview available</span>
                        </div>
                      )}
                      {item.featured && (
                        <Badge className="absolute left-3 top-3 bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}
                      {item.price === 0 && (
                        <Badge className="absolute right-3 top-3 bg-green-500 text-white shadow-lg">
                          Free
                        </Badge>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {item.category?.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
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
                          {item.sales_count || 0} sales
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
