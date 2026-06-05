import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import HackathonSubmissionsClient from "@/components/hackathons/HackathonSubmissionsClient";
import { getHackathonBySlug } from "@/lib/actions/server-actions";
import { createPageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import Link from "next/link";

interface HackathonSubmissionsPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: HackathonSubmissionsPageProps) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) return { title: "Hackathon Submission" };

  return createPageMetadata({
    title: `${hackathon.title} Submissions | Hackathon Hub`,
    description: `Submit your project for ${hackathon.title}.`,
    path: `/hackathons/${slug}/submissions`,
    keywords: ["Hackathon Submission", hackathon.title, "Project Submission"],
  });
}

export default async function HackathonSubmissionsPage({ params }: HackathonSubmissionsPageProps) {
  const { slug } = await params;
  const hackathon = await getHackathonBySlug(slug);
  if (!hackathon) {
    notFound();
  }

  return (
    <main className="bg-background text-foreground">
      <Navbar />
      <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Link href={`/hackathons/${hackathon.slug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-primary">
              Back to event
            </Link>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">{hackathon.title} Submissions</h1>
            <p className="mt-4 text-lg text-muted">Upload your project details, GitHub repository, demo link, and documentation.</p>
          </div>
        </Container>
      </section>

      <Container className="py-20">
        <HackathonSubmissionsClient hackathonId={hackathon.id} />
      </Container>

      <Footer />
    </main>
  );
}
