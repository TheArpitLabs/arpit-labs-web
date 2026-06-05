import Image from "next/image";
import { coursesRepository, courseModulesRepository } from "@/lib/repositories/courses.repository";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, BarChart3, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await coursesRepository.getBySlug(slug);

  if (!course) {
    return { title: "Course Not Found" };
  }

  return {
    title: `${course.title} | Arpit Labs`,
    description: course.description,
  };
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const course = await coursesRepository.getBySlug(slug);

  if (!course || !course.published) {
    notFound();
  }

  const modules = await courseModulesRepository.getByCourseId(course.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      {/* Header */}
      <div className="border-b border-border/40">
        <div className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>

            {course.thumbnail && (
              <div className="mb-8 h-64 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 relative">
                <Image
                  src={course.thumbnail}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {course.title}
            </h1>

            <p className="mt-4 text-lg text-muted max-w-2xl">
              {course.description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Difficulty</p>
                  <p className="font-semibold text-foreground capitalize">{course.difficulty}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted uppercase">Duration</p>
                  <p className="font-semibold text-foreground">{course.duration} minutes</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-6 border-l border-border/40">
                <div className="h-3 w-3 rounded-full bg-primary/60" />
                <span className="text-muted">{course.category}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {course.content && (
                <div className="prose prose-invert max-w-none rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-8">
                  <ReactMarkdown>{course.content}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {modules.length > 0 && (
                <div className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-6 sticky top-4">
                  <h3 className="font-semibold text-foreground mb-4">Course Modules</h3>
                  <div className="space-y-2">
                    {modules.map((module) => (
                      <div
                        key={module.id}
                        className="p-3 rounded-lg bg-background/40 border border-border/20 hover:border-primary/30 transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">{module.title}</p>
                        <p className="text-xs text-muted mt-1">Module {module.order_index + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
