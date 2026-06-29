import { roadmapsRepository } from '@/lib/repositories/roadmaps.repository';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Map } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RoadmapDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RoadmapDetailPageProps) {
  const { slug } = await params;
  const roadmap = await roadmapsRepository.getBySlug(slug);

  if (!roadmap) {
    return { title: 'Roadmap Not Found' };
  }

  return {
    title: `${roadmap.title} | Axiora`,
    description: roadmap.description,
  };
}

export default async function RoadmapDetailPage({ params }: RoadmapDetailPageProps) {
  const { slug } = await params;
  const roadmap = await roadmapsRepository.getBySlug(slug);

  if (!roadmap || !roadmap.published) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/roadmaps"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Roadmaps
            </Link>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-primary/10">
                  <Map className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight text-foreground">
                  {roadmap.title}
                </h1>
                <p className="mt-4 text-lg text-muted max-w-2xl">{roadmap.description}</p>
                <div className="mt-6 flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-primary/60" />
                  <span className="text-muted">{roadmap.category}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="prose prose-invert max-w-none rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-8">
            <ReactMarkdown>{roadmap.content}</ReactMarkdown>
          </div>

          {/* Navigation */}
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/courses"
              className="flex-1 text-center px-6 py-3 rounded-xl border border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              Explore Related Courses
            </Link>
            <Link
              href="/labs"
              className="flex-1 text-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Start Hands-On Labs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
