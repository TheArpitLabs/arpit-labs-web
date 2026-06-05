import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { productsRepository } from "@/lib/repositories/products.repository";
import { createArticleMetadata } from "@/lib/seo";
import { Product } from "@/types/content";
import { ProductTracker } from "@/components/analytics/ProductTracker";

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await productsRepository.getProductBySlug(slug);

  if (!product || !product.published) {
    return { title: "Product Not Found" };
  }

  return createArticleMetadata({
    title: `${product.title} | Arpit Labs`,
    description: product.description,
    path: `/products/${slug}`,
    keywords: [product.category],
  });
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const slug = (await params).slug;
  let product: Product | null = null;

  try {
    product = await productsRepository.getProductBySlug(slug);
    if (!product || !product.published) {
      notFound();
    }
  } catch (error) {
    console.error("Error fetching product detail:", error);
    notFound();
  }

  const features = product.features || [];
  const screenshots = product.screenshots || [];

  return (
    <main className="bg-background text-foreground">
      <Navbar />
      <ProductTracker slug={product.slug} />

      <section className="border-b border-border/70 bg-background/80 py-12 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition mb-8"
          >
            <ArrowLeft size={16} />
            Back to Product Hub
          </Link>

          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-[0.22em] text-muted">
                    {product.category}
                  </Badge>
                  <Badge className="px-3 py-1 text-xs uppercase tracking-[0.22em]">
                    {product.pricing_type}
                  </Badge>
                </div>
                <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">{product.title}</h1>
                <p className="max-w-3xl text-xl leading-relaxed text-muted">{product.description}</p>
              </div>

              <div className="grid gap-6">
                <Card className="overflow-hidden rounded-[2.5rem] border border-border/70 p-0">
                  {product.cover_image ? (
                    <div className="relative aspect-[16/9] w-full">
                      <Image
                        src={product.cover_image}
                        alt={product.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="flex h-72 items-center justify-center bg-surface text-muted">No cover image available</div>
                  )}
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="p-8">
                    <h2 className="text-2xl font-bold text-foreground">Overview</h2>
                    <p className="mt-4 text-bodied leading-relaxed text-muted whitespace-pre-wrap">{product.overview || product.description}</p>
                  </Card>

                  <Card className="p-8">
                    <h2 className="text-2xl font-bold text-foreground">Pricing</h2>
                    <p className="mt-4 text-body text-muted whitespace-pre-wrap">{product.pricing_details || "Transparent and tailored pricing for every team."}</p>
                  </Card>
                </div>

                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-foreground">Features</h2>
                  <div className="mt-6 space-y-4">
                    {features.length > 0 ? (
                      features.map((feature) => (
                        <div key={feature.id} className="rounded-3xl border border-border/70 bg-background/80 p-5">
                          <h3 className="font-semibold text-foreground">{feature.title}</h3>
                          <p className="mt-2 text-muted">{feature.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">Product features are being prepared.</p>
                    )}
                  </div>
                </Card>

                {screenshots.length > 0 && (
                  <Card className="p-8">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-foreground">Screenshots</h2>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      {screenshots.sort((a, b) => a.sort_order - b.sort_order).map((screen) => (
                        <div key={screen.id} className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-border/70 bg-surface">
                          <Image
                            src={screen.image_url}
                            alt={`${product?.title} screenshot`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="p-8">
                  <h2 className="text-2xl font-bold text-foreground">Resources</h2>
                  <div className="mt-6 space-y-3">
                    {product.documentation_url ? (
                      <a
                        href={product.documentation_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex w-full items-center justify-between rounded-2xl border border-border/70 bg-surface px-5 py-4 text-sm font-semibold text-foreground transition hover:border-primary/70"
                      >
                        <span>Documentation</span>
                        <BookOpen size={18} />
                      </a>
                    ) : (
                      <p className="text-muted">Documentation will be available soon.</p>
                    )}

                    {product.demo_url && (
                      <a
                        href={product.demo_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex w-full items-center justify-between rounded-2xl border border-border/70 bg-surface px-5 py-4 text-sm font-semibold text-foreground transition hover:border-primary/70"
                      >
                        <span>Try Demo</span>
                        <ExternalLink size={18} />
                      </a>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            <aside className="space-y-6">
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-foreground">Quick links</h2>
                <div className="mt-6 grid gap-3">
                  <Link
                    href="/products"
                    className="rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/70 text-center"
                  >
                    Back to product catalog
                  </Link>
                  <Link
                    href="/contact"
                    className="rounded-2xl border border-border/70 bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 text-center"
                  >
                    Contact sales
                  </Link>
                </div>
              </Card>
            </aside>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
