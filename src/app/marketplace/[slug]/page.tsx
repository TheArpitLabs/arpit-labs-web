import React from "react";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { ShoppingBag, Download, ArrowLeft, ShieldCheck, Zap, Star, Clock, Eye, Users, CheckCircle, TrendingUp, Heart, Share2 } from "lucide-react";
import Link from "next/link";
import { purchaseItemAction, trackItemViewAction } from "@/lib/actions/marketplace-actions";
import { marketplaceRepository } from "@/lib/repositories/marketplace.repository";

export default async function MarketplaceItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await marketplaceRepository.getBySlug(slug);

  if (!item || !item.published) {
    notFound();
  }

  // Track view
  await trackItemViewAction(item.id);

  // Get related items from the same category
  const allItems = await marketplaceRepository.getAll({ published: true });
  const relatedItems = allItems.filter((relatedItem: any) => 
    relatedItem.category_id === item.category_id && relatedItem.id !== item.id
  ).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      <div className="py-12">
        <Container>
          <Link
            href="/marketplace"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Preview Image */}
              <div className="relative aspect-video overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 to-secondary/5 border border-border/50 shadow-2xl">
                {item.preview_image ? (
                  <Image
                    src={item.preview_image}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ShoppingBag className="h-24 w-24 text-muted/20" />
                  </div>
                )}
                {item.featured && (
                  <Badge className="absolute left-4 top-4 bg-gradient-to-r from-primary to-secondary text-white shadow-lg">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                )}
              </div>

              {/* Title and Badges */}
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/5 text-primary">
                    {item.category?.name}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">4.5</span>
                    <span className="text-muted-foreground">(128 reviews)</span>
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {item.title}
                </h1>
              </div>

              {/* Description */}
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {item.description}
                </p>
              </div>

              {/* Features Section */}
              <Card className="p-6 border-border/50">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  What You&apos;ll Get
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Complete source code</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Documentation included</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Lifetime updates</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">Premium support</span>
                  </div>
                </div>
              </Card>

              {/* Reviews Section */}
              <Card className="p-6 border-border/50">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Reviews & Ratings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">John Developer</div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Excellent resource! Saved me hours of development time. Highly recommended for anyone starting a similar project.
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold">Sarah Engineer</div>
                        <div className="flex items-center gap-1">
                          {[...Array(4)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          ))}
                          <Star className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Great quality code and well-documented. The support team was very responsive to my questions.
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">1 week ago</span>
                  </div>
                </div>
              </Card>

              {/* Related Items */}
              {relatedItems.length > 0 && (
                <div>
                  <h3 className="text-2xl font-semibold mb-6">You Might Also Like</h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {relatedItems.map((relatedItem: any) => (
                      <Link key={relatedItem.id} href={`/marketplace/${relatedItem.slug}`} className="group">
                        <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50">
                          <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
                            {relatedItem.preview_image ? (
                              <Image
                                src={relatedItem.preview_image}
                                alt={relatedItem.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                unoptimized
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ShoppingBag className="h-12 w-12 text-muted/20" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                              {relatedItem.title}
                            </h4>
                            <div className="mt-2 flex items-center justify-between">
                              <span className="font-bold">
                                {relatedItem.price === 0 ? "Free" : `$${relatedItem.price}`}
                              </span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                <span>4.5</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Purchase Card */}
              <Card className="p-6 border-border/50 shadow-xl">
                <div className="mb-6">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm text-muted-foreground font-medium">Price</span>
                    <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      {item.price === 0 ? "Free" : `$${item.price}`}
                    </span>
                  </div>
                  {item.price > 0 && (
                    <p className="text-xs text-muted-foreground text-center">One-time payment</p>
                  )}
                </div>

                <form action={purchaseItemAction.bind(null, item.id)} className="space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full gap-2 rounded-xl text-lg font-bold bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
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
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    className="w-full gap-2 rounded-xl"
                  >
                    <Heart className="h-5 w-5" />
                    Add to Wishlist
                  </Button>
                </form>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span>Instant download</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span>Lifetime updates</span>
                  </div>
                </div>
              </Card>

              {/* Stats Card */}
              <Card className="p-6 border-border/50">
                <h3 className="font-semibold mb-4">Asset Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Sales</span>
                    </div>
                    <span className="font-semibold">{item.sales_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span>Views</span>
                    </div>
                    <span className="font-semibold">{item.views_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Downloads</span>
                    </div>
                    <span className="font-semibold">{item.sales_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Released</span>
                    </div>
                    <span className="font-semibold">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Share Card */}
              <Card className="p-6 border-border/50">
                <h3 className="font-semibold mb-4">Share this Asset</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
}
