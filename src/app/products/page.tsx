import { productsRepository } from "@/lib/repositories/products.repository";
import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/types/content";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Products | Arpit Labs",
  description: "Discover AI and automation products built by Arpit Labs for modern engineering workflows.",
};

export default async function ProductsPage() {
  let products: Product[] = [];

  try {
    products = await productsRepository.getProducts({ published: true });
  } catch (error) {
    console.error("Error fetching products:", error);
    products = [];
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="border-b border-border/70 bg-background/75 py-16 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-muted">Product Hub</p>
            <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">Arpit Labs Products</h1>
            <p className="mx-auto max-w-2xl text-lg text-muted">
              AI-first solutions built for practical automation, intelligent workflows, and next-generational system design.
            </p>
          </div>
        </Container>
      </section>

      <Container>
        <section className="py-20">
          {products.length === 0 ? (
            <div className="rounded-[2rem] border border-border/70 bg-card/90 p-12 text-center text-muted">No products are published yet.</div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 transition hover:border-primary/70 hover:shadow-lg"
                >
                  <div className="relative aspect-[16/9] w-full bg-surface/50">
                    {product.cover_image ? (
                      <Image
                        src={product.cover_image}
                        alt={product.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted/40">No cover image</div>
                    )}
                  </div>

                  <div className="space-y-4 p-8">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted">
                        {product.category}
                      </Badge>
                      <Badge className="px-3 py-1 text-xs uppercase tracking-[0.24em]">
                        {product.pricing_type}
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground">{product.title}</h2>
                    <p className="text-sm leading-relaxed text-muted line-clamp-2">{product.description}</p>
                    <div className="pt-4 flex items-center text-primary font-medium text-sm">
                      View Details →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </Container>

      <Footer />
    </main>
  );
}
