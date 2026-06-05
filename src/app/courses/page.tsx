import { coursesRepository } from "@/lib/repositories/courses.repository";
import Link from "next/link";
import { Clock, BarChart3 } from "lucide-react";

export const metadata = {
  title: "Courses | Arpit Labs",
  description: "Learn cutting-edge skills in IoT, AI, Cybersecurity, and Web Development",
};

export default async function CoursesPage() {
  let courses: any[] = [];
  try {
    courses = await coursesRepository.getAll(true);
  } catch (error) {
    console.error("Error fetching courses:", error);
    courses = [];
  }

  const categories = Array.from(new Set(courses.map(c => c.category)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Learning Courses
          </h1>
          <p className="mt-4 text-lg text-muted">
            Master new technologies with comprehensive, hands-on courses designed for developers at every level.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {courses.length > 0 ? (
            <>
              {/* Category Sections */}
              {categories.map((category) => {
                const categoryCourses = courses.filter(c => c.category === category);
                return (
                  <div key={category} className="mb-16">
                    <h2 className="text-2xl font-bold text-foreground mb-8">{category}</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {categoryCourses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/courses/${course.slug}`}
                          className="group relative rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
                        >
                          {course.thumbnail && (
                            <div className="mb-4 h-40 w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {course.title}
                              </h3>
                              <p className="mt-2 text-sm text-muted line-clamp-2">
                                {course.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-muted pt-2 border-t border-border/20">
                              <div className="flex items-center gap-1">
                                <BarChart3 className="h-3.5 w-3.5" />
                                <span className="capitalize">{course.difficulty}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{course.duration} mins</span>
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
              <p className="text-muted text-lg">No courses available yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
