import { labsRepository } from "@/lib/repositories/labs.repository";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Labs | Arpit Labs",
  description: "Hands-on practical labs to apply your skills in IoT, AI, Cybersecurity, and Web Development",
};

export default async function LabsPage() {
  let labs: any[] = [];
  try {
    labs = await labsRepository.getAll(true);
  } catch (error) {
    console.error("Error fetching labs:", error);
    labs = [];
  }

  const categories = Array.from(new Set(labs.map(l => l.category)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Hands-On Labs
          </h1>
          <p className="mt-4 text-lg text-muted">
            Get practical experience with real-world projects and challenges across multiple domains.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {labs.length > 0 ? (
            <>
              {/* Category Sections */}
              {categories.map((category) => {
                const categoryLabs = labs.filter(l => l.category === category);
                return (
                  <div key={category} className="mb-16">
                    <h2 className="text-2xl font-bold text-foreground mb-8">{category}</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {categoryLabs.map((lab) => (
                        <Link
                          key={lab.id}
                          href={`/labs/${lab.slug}`}
                          className="group relative rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                        >
                          <div className="space-y-3">
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {lab.title}
                            </h3>
                            <p className="text-sm text-muted line-clamp-3">
                              {lab.description}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-border/20">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3.5 w-3.5" />
                                <span className="capitalize">{lab.difficulty}</span>
                              </div>
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
              <p className="text-muted text-lg">No labs available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
