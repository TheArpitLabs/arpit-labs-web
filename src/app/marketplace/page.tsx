import React from "react";
import Image from "next/image";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import Link from "next/link";
import { Search, Filter, ShoppingBag, Package, TrendingUp, Clock, Sparkles, Star } from "lucide-react";

// Placeholder products for when database is empty
const placeholderProducts = [
  {
    id: "placeholder-1",
    title: "AI Starter Kit",
    description: "Complete toolkit for building AI-powered applications with pre-trained models and templates. Includes TensorFlow, PyTorch integrations.",
    price: 0,
    category: { name: "AI Tools", slug: "ai-tools" },
    preview_image: null,
    featured: true,
    slug: "ai-starter-kit",
    downloads: 1240,
    rating: 4.8,
  },
  {
    id: "placeholder-2",
    title: "IoT Dashboard Template",
    description: "Modern dashboard template for IoT device monitoring and management. Real-time data visualization and alert system.",
    price: 29,
    category: { name: "IoT Systems", slug: "iot-systems" },
    preview_image: null,
    featured: true,
    slug: "iot-dashboard-template",
    downloads: 856,
    rating: 4.6,
  },
  {
    id: "placeholder-3",
    title: "API Integration Kit",
    description: "Streamlined API integration components and utilities for rapid development. REST, GraphQL, and WebSocket support.",
    price: 0,
    category: { name: "Software", slug: "software" },
    preview_image: null,
    featured: false,
    slug: "api-integration-kit",
    downloads: 2103,
    rating: 4.9,
  },
  {
    id: "placeholder-4",
    title: "Hardware Design Library",
    description: "Collection of hardware design patterns and schematics for common projects. PCB layouts and circuit diagrams included.",
    price: 49,
    category: { name: "Hardware", slug: "hardware" },
    preview_image: null,
    featured: false,
    slug: "hardware-design-library",
    downloads: 432,
    rating: 4.5,
  },
  {
    id: "placeholder-5",
    title: "Security Audit Checklist",
    description: "Comprehensive security audit checklist for web applications and APIs. OWASP compliance and best practices.",
    price: 0,
    category: { name: "Security", slug: "security" },
    preview_image: null,
    featured: false,
    slug: "security-audit-checklist",
    downloads: 1876,
    rating: 4.7,
  },
  {
    id: "placeholder-6",
    title: "Performance Optimization Guide",
    description: "In-depth guide for optimizing application performance and scalability. Database queries, caching strategies, and more.",
    price: 19,
    category: { name: "Software", slug: "software" },
    preview_image: null,
    featured: false,
    slug: "performance-optimization-guide",
    downloads: 921,
    rating: 4.4,
  },
  {
    id: "placeholder-7",
    title: "Machine Learning Pipeline",
    description: "End-to-end ML pipeline template with data preprocessing, model training, and deployment automation.",
    price: 39,
    category: { name: "AI Tools", slug: "ai-tools" },
    preview_image: null,
    featured: false,
    slug: "ml-pipeline",
    downloads: 654,
    rating: 4.8,
  },
  {
    id: "placeholder-8",
    title: "Smart Home Controller",
    description: "IoT controller firmware for smart home devices. Supports MQTT, Home Assistant, and custom integrations.",
    price: 0,
    category: { name: "IoT Systems", slug: "iot-systems" },
    preview_image: null,
    featured: false,
    slug: "smart-home-controller",
    downloads: 1432,
    rating: 4.9,
  },
];

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

  // Use placeholder products if database is empty
  const displayItems = items.length === 0 ? placeholderProducts : items;

  const filteredItems = resolvedSearchParams.q
    ? displayItems.filter((item) =>
        item.title.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase()) ||
        item.description?.toLowerCase().includes(resolvedSearchParams.q!.toLowerCase())
      )
    : displayItems;

  // Separate items into sections
  const featuredItems = filteredItems.filter((item) => item.featured);
  const trendingItems = filteredItems.slice(0, 4);
  const recentlyAdded = [...filteredItems].reverse().slice(0, 4);
  const comingSoon = placeholderProducts.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Navbar />
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

        {/* Featured Products Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && featuredItems.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Featured Products</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredItems.map((item) => (
                <Link key={item.id} href={`/marketplace/${item.slug}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
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
                      <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
                        Featured
                      </Badge>
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {item.category?.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-xs font-medium">{(item as any).rating || '4.5'}</span>
                        </div>
                      </div>
                      <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {item.price === 0 ? "Free" : `$${item.price}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(item as any).downloads || '0'} downloads
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Popular Categories Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && categories.length > 0 && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Popular Categories</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/marketplace?category=${cat.slug}`}>
                  <Badge variant="outline" className="cursor-pointer px-4 py-2 text-sm hover:border-primary hover:bg-primary/5">
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Trending</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {trendingItems.map((item) => (
                <Link key={item.id} href={`/marketplace/${item.slug}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {item.preview_image ? (
                        <Image
                          src={item.preview_image}
                          alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
                          <ShoppingBag className="h-12 w-12 text-muted/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {item.category?.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-xs font-medium">{(item as any).rating || '4.5'}</span>
                        </div>
                      </div>
                      <h3 className="line-clamp-1 font-semibold text-sm">{item.title}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {item.price === 0 ? "Free" : `$${item.price}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(item as any).downloads || '0'} downloads
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recently Added Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Recently Added</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recentlyAdded.map((item) => (
                <Link key={item.id} href={`/marketplace/${item.slug}`}>
                  <Card className="group h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      {item.preview_image ? (
                        <Image
                          src={item.preview_image}
                          alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
                          <ShoppingBag className="h-12 w-12 text-muted/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">
                          {item.category?.name}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-xs font-medium">{(item as any).rating || '4.5'}</span>
                        </div>
                      </div>
                      <h3 className="line-clamp-1 font-semibold text-sm">{item.title}</h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {item.price === 0 ? "Free" : `$${item.price}`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {(item as any).downloads || '0'} downloads
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon Section */}
        {!resolvedSearchParams.q && !resolvedSearchParams.category && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-semibold">Coming Soon</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((item) => (
                <Card key={item.id} className="border-dashed border-border/70 bg-muted/30 p-6">
                  <div className="mb-4 flex h-32 items-center justify-center rounded-lg bg-muted/50">
                    <Package className="h-12 w-12 text-muted/30" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  <Badge variant="outline" className="mt-4 w-fit">
                    Coming Soon
                  </Badge>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Products Grid */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold">
            {resolvedSearchParams.q ? "Search Results" : resolvedSearchParams.category ? "Category Results" : "All Products"}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <Link key={item.id} href={`/marketplace/${item.slug}`}>
                <Card className="group h-full overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    {item.preview_image ? (
                      <Image
                        src={item.preview_image}
                        alt={`${item.title} - ${item.category?.name || 'Product'} preview`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted/20 to-muted/5">
                        <ShoppingBag className="h-12 w-12 text-muted/30" />
                      </div>
                    )}
                    {item.featured && (
                      <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
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
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs font-medium">{(item as any).rating || '4.5'}</span>
                      </div>
                    </div>
                    <h3 className="line-clamp-1 font-semibold">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-bold">
                        {item.price === 0 ? "Free" : `$${item.price}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(item as any).downloads || '0'} downloads
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {filteredItems.length === 0 && (
          <EmptyState
            icon={ShoppingBag}
            title="No items found"
            description="Try adjusting your filters or search query to find what you're looking for."
            actionLabel="Clear Filters"
            actionHref="/marketplace"
          />
        )}
      </Container>
      </div>
      <Footer />
    </div>
  );
}
