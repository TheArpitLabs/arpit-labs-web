import { roadmapsRepository } from "@/lib/repositories/roadmaps.repository";
import Link from "next/link";
import { Map } from "lucide-react";

export const metadata = {
  title: "Learning Roadmaps | Arpit Labs",
  description: "Structured learning paths for IoT, AI, Cybersecurity, and Web Development",
};

export default async function RoadmapsPage() {
  let roadmaps: any[] = [];
  try {
    roadmaps = await roadmapsRepository.getAll(true);
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    roadmaps = [];
  }

  const categories = Array.from(new Set(roadmaps.map(r => r.category)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Learning Roadmaps
          </h1>
          <p className="mt-4 text-lg text-muted">
            Follow curated learning paths designed to take you from beginner to expert in your chosen field.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {roadmaps.length > 0 ? (
            <>
              {/* Category Sections */}
              {categories.map((category) => {
                const categoryRoadmaps = roadmaps.filter(r => r.category === category);
                return (
                  <div key={category} className="mb-16">
                    <h2 className="text-2xl font-bold text-foreground mb-8">{category}</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {categoryRoadmaps.map((roadmap) => (
                        <Link
                          key={roadmap.id}
                          href={`/roadmaps/${roadmap.slug}`}
                          className="group relative rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10">
                                <Map className="h-6 w-6 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {roadmap.title}
                              </h3>
                              <p className="mt-2 text-sm text-muted line-clamp-2">
                                {roadmap.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted text-lg">No roadmaps available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
