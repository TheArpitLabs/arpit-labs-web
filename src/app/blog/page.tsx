import { Container } from "@/components/layout/Container";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLabNotes } from "@/lib/actions/server-actions";
import Link from "next/link";
import { Clock, Calendar, ChevronRight } from "lucide-react";
import { LabNote } from "@/types/content";
import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Lab Notes",
  description: "Engineering insights, system design patterns, and lessons learned from the lab.",
  path: "/blog",
  keywords: ["Blog", "Lab Notes", "Technical Articles", "Engineering", "Systems Design"],
});

export default async function BlogPage() {
  const notes = await getLabNotes();
  const categories = Array.from(new Set(notes.map((note) => note.category).filter(Boolean))) as string[];
  const tags = Array.from(new Set(notes.flatMap((note) => note.tags ?? []))).slice(0, 8);

  return (
    <main className="bg-background text-foreground">
      <Navbar />

      <section id="hero" className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest text-primary">
              Engineering Journal
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Lab <span className="text-primary">Notes</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
              Documenting the process of building, learning, and iterating. Insights on software architecture, hardware integration, and everything in between.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <AnimatedSection>
              {notes.length > 0 ? (
                <div className="grid gap-8">
                  {notes.map((note: LabNote) => (
                    <Link key={note.id} href={`/blog/${note.slug}`}>
                      <Card className="group border-none bg-surface/30 p-8 transition hover:bg-surface/50 dark:bg-slate-900/30 dark:hover:bg-slate-900/50">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start">
                          <div className="flex-grow space-y-4">
                            <div className="flex items-center gap-4 text-xs font-medium text-muted">
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(note.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              {note.reading_time && (
                                <span className="flex items-center gap-1">
                                  <Clock size={14} />
                                  {note.reading_time} min read
                                </span>
                              )}
                            </div>
                            <h2 className="text-2xl font-bold text-foreground transition group-hover:text-primary">
                              {note.title}
                            </h2>
                            <p className="text-muted line-clamp-2">
                              {note.excerpt || (note.content ? note.content.substring(0, 160) : "")}...
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              {note.tags?.map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-[10px] uppercase">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background text-muted transition group-hover:border-primary group-hover:bg-primary group-hover:text-white md:self-center">
                            <ChevronRight size={20} />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <p className="text-muted italic">No lab notes have been published yet.</p>
                </div>
              )}
            </AnimatedSection>
          </div>

          <aside className="space-y-12">
            <AnimatedSection>
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-foreground">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge className="px-3 py-1">All Posts</Badge>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <Badge key={category} variant="outline" className="px-3 py-1">
                        {category}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="px-3 py-1">Engineering</Badge>
                  )}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-foreground">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-3 py-1">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted">Tags will appear here as lab notes are published.</p>
                  )}
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <NewsletterForm />
            </AnimatedSection>
          </aside>
        </div>
      </Container>

      <Footer />
    </main>
  );
}
