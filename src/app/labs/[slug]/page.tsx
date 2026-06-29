import { labsRepository } from '@/lib/repositories/labs.repository';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, ArrowLeft, Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LabDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: LabDetailPageProps) {
  const { slug } = await params;
  const lab = await labsRepository.getBySlug(slug);

  if (!lab) {
    return { title: 'Lab Not Found' };
  }

  return {
    title: `${lab.title} | Axiora`,
    description: lab.description,
  };
}

export default async function LabDetailPage({ params }: LabDetailPageProps) {
  const { slug } = await params;
  const lab = await labsRepository.getBySlug(slug);

  if (!lab || !lab.published) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/labs"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Labs
            </Link>

            <h1 className="text-4xl font-bold tracking-tight text-foreground">{lab.title}</h1>

            <p className="mt-4 text-lg text-muted max-w-2xl">{lab.description}</p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Difficulty</p>
                  <p className="font-semibold text-foreground capitalize">{lab.difficulty}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Code2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Category</p>
                  <p className="font-semibold text-foreground">{lab.category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-12">
            {/* Instructions */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">Instructions</h2>
              <div className="prose prose-invert max-w-none rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-8">
                <ReactMarkdown>{lab.instructions}</ReactMarkdown>
              </div>
            </div>

            {/* Call to Action */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Ready to Complete This Lab?
              </h3>
              <p className="text-muted mb-6">
                Start working on this hands-on project to solidify your skills.
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                <Code2 className="h-5 w-5" />
                Start Lab
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
