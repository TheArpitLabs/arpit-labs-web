import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLabNoteBySlug, getLabNotes } from "@/lib/actions/server-actions";
import { Clock, Calendar, ArrowLeft, Share2, Tag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LabNote } from "@/types/content";
import { createArticleMetadata } from "@/lib/seo";

interface BlogDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const note = await getLabNoteBySlug(slug) as LabNote | null;
  if (!note) return { title: "Note Not Found" };

  return createArticleMetadata({
    title: `${note.title} | Arpit Labs`,
    description: note.excerpt || "Lab notes and engineering insights from Arpit Labs.",
    path: `/blog/${slug}`,
    keywords: [note.category ?? "Engineering", ...note.tags],
  });
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const [note, allNotes] = await Promise.all([
    getLabNoteBySlug(slug) as Promise<LabNote | null>,
    getLabNotes(),
  ]);

  if (!note) {
    notFound();
  }

  const relatedNotes = allNotes
    .filter((item) => item.slug !== note.slug)
    .map((item) => {
      const sharedTags = item.tags.filter((tag) => note.tags.includes(tag)).length;
      const sameCategory = item.category && note.category && item.category === note.category ? 1 : 0;
      return { item, score: sharedTags + sameCategory };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ item }) => item);

  return (
    <main className="bg-background text-foreground">
      <Navbar />

      <article className="py-12 md:py-20">
        <Container>
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition mb-12"
          >
            <ArrowLeft size={16} />
            Back to Lab Notes
          </Link>

          <div className="mx-auto max-w-3xl">
            <header className="space-y-6 text-center">
              <div className="flex justify-center gap-4 text-sm font-medium text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-primary" />
                  {new Date(note.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {note.reading_time && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={16} className="text-secondary" />
                    {note.reading_time} min read
                  </span>
                )}
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                {note.title}
              </h1>

              {note.excerpt && (
                <p className="text-xl text-muted leading-relaxed italic">
                  &quot;{note.excerpt}&quot;
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {note.category ? (
                  <Badge variant="outline" className="px-3 py-1">
                    {note.category}
                  </Badge>
                ) : null}
                {note.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    <Tag size={12} className="mr-1.5" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            {note.cover_image && (
              <div className="mt-12 aspect-[21/9] overflow-hidden rounded-[2.5rem] border border-border/70 dark:border-slate-800">
                <img 
                  src={note.cover_image} 
                  alt={note.title} 
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mt-16">
              <AnimatedSection>
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-p:text-lg prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
                  {note.content ? (
                    <div className="whitespace-pre-wrap">
                      {note.content}
                    </div>
                  ) : (
                    <p className="text-center text-muted italic py-10">
                      Content is being prepared for publication.
                    </p>
                  )}
                </div>
              </AnimatedSection>
            </div>

            <footer className="mt-20 border-t border-border/70 pt-10 dark:border-slate-800">
              <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    AL
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Arpit Labs</p>
                    <p className="text-sm text-muted">Engineering Research & Design</p>
                  </div>
                </div>
                
                <button className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary/5 dark:border-slate-700 dark:bg-slate-900">
                  <Share2 size={18} />
                  Share Note
                </button>
              </div>
            </footer>

            <section className="mt-20 space-y-8 border-t border-border/70 pt-10 dark:border-slate-800">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Related Articles</h2>
                <p className="text-muted">More technical notes connected by category or tags.</p>
              </div>

              {relatedNotes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-3">
                  {relatedNotes.map((related) => (
                    <Link key={related.id} href={`/blog/${related.slug}`}>
                      <Card className="h-full p-6 transition hover:border-primary/50">
                        <div className="space-y-4">
                          {related.category ? (
                            <Badge variant="outline" className="px-3 py-1 text-[10px]">
                              {related.category}
                            </Badge>
                          ) : null}
                          <h3 className="text-lg font-semibold text-foreground">{related.title}</h3>
                          <p className="line-clamp-3 text-sm text-muted">
                            {related.excerpt || related.content || "Technical note in progress."}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-[2rem] border border-dashed border-border/60 py-12 text-center text-muted">
                  Related articles will appear here as more notes are published.
                </div>
              )}
            </section>
          </div>
        </Container>
      </article>

      <Footer />
    </main>
  );
}
