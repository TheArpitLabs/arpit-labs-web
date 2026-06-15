import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { FeaturedProjects, TrendingProjects, LatestProjects, PopularProjects } from "@/components/projects/ProjectSection";
import { getProjects as getProjectsData } from "@/lib/data/projects";

interface SearchParams {
  search?: string;
  branch?: string;
  project_type?: string;
  sort?: string;
}

interface ProjectsPageProject {
  id: string;
  title: string;
  slug: string;
  description: string;
  project_type: string;
  branch?: string | null;
  category?: string | null;
  cover_image?: string | null;
  tech_stack?: string[];
  tags?: string[];
  views_count?: number;
  likes_count?: number;
  featured?: boolean;
  created_at: string;
  status?: string;
  owner_id?: string | null;
}

const fallbackProjects: ProjectsPageProject[] = [
  {
    id: "fallback-smart-traffic",
    title: "Smart Traffic Management System",
    slug: "smart-traffic-management-system",
    description: "Computer vision and IoT-based traffic signal optimization with live monitoring, adaptive timing, and congestion analytics.",
    project_type: "hybrid",
    branch: "IoT",
    category: "Smart City",
    cover_image: "/images/projects/traffic-management-cover.jpg",
    tech_stack: ["Python", "OpenCV", "TensorFlow", "Arduino", "React"],
    tags: ["IoT", "Computer Vision", "Machine Learning"],
    views_count: 1240,
    likes_count: 86,
    featured: true,
    created_at: "2026-06-01T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-hospital-attendance",
    title: "Hospital Attendance System",
    slug: "hospital-attendance-system",
    description: "Biometric staff attendance platform for healthcare teams using RFID, fingerprint authentication, reports, and admin dashboards.",
    project_type: "software",
    branch: "Computer Science",
    category: "Healthcare",
    cover_image: "/images/projects/hospital-attendance-cover.jpg",
    tech_stack: ["Java", "Spring Boot", "React", "MySQL"],
    tags: ["Healthcare", "Biometrics", "Enterprise Software"],
    views_count: 980,
    likes_count: 74,
    featured: true,
    created_at: "2026-05-20T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-ncc-buddy",
    title: "NCC Buddy",
    slug: "ncc-buddy",
    description: "Mobile learning and community companion for NCC cadets with schedules, attendance, study material, and offline-first access.",
    project_type: "software",
    branch: "Mobile",
    category: "Education",
    cover_image: "/images/projects/ncc-buddy-cover.jpg",
    tech_stack: ["React Native", "Node.js", "Firebase"],
    tags: ["Mobile App", "Education", "Community"],
    views_count: 760,
    likes_count: 58,
    featured: true,
    created_at: "2026-05-10T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-ship-collision",
    title: "Ship Bridge Collision Prevention",
    slug: "ship-bridge-collision-prevention",
    description: "Marine safety system using radar signals, AI object detection, and automated alerts for ship collision prevention.",
    project_type: "research",
    branch: "Robotics",
    category: "Maritime",
    cover_image: "/images/projects/ship-collision-cover.jpg",
    tech_stack: ["Python", "OpenCV", "ROS", "PostgreSQL"],
    tags: ["Maritime", "AI", "Safety Systems"],
    views_count: 690,
    likes_count: 49,
    featured: false,
    created_at: "2026-04-26T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-accident-detection",
    title: "Accident Detection System",
    slug: "accident-detection-system",
    description: "Vehicle accident detection and emergency response workflow using accelerometers, GPS, GSM modules, and severity scoring.",
    project_type: "hardware",
    branch: "IoT",
    category: "Safety",
    cover_image: "/images/projects/accident-detection-cover.jpg",
    tech_stack: ["Arduino", "ESP32", "Firebase", "React Native"],
    tags: ["IoT", "Emergency Response", "Sensors"],
    views_count: 840,
    likes_count: 63,
    featured: false,
    created_at: "2026-04-12T00:00:00.000Z",
    status: "published"
  },
  {
    id: "fallback-snake-robot",
    title: "Snake Robot",
    slug: "snake-robot",
    description: "Bio-inspired rescue robot using servo articulation, Arduino control, wireless telemetry, and camera-assisted navigation.",
    project_type: "hardware",
    branch: "Robotics",
    category: "Robotics",
    cover_image: "/images/projects/snake-robot-cover.jpg",
    tech_stack: ["Arduino", "Servo Motors", "Wireless Control"],
    tags: ["Robotics", "Search and Rescue", "Embedded"],
    views_count: 610,
    likes_count: 41,
    featured: false,
    created_at: "2026-03-30T00:00:00.000Z",
    status: "published"
  },
];

function ProjectsHeroBlock({ projects }: { projects: ProjectsPageProject[] }) {
  const publishedCount = projects.length;
  const featuredCount = projects.filter((project) => project.featured).length;
  const totalViews = projects.reduce((sum, project) => sum + (project.views_count || 0), 0);
  const engineeringAreas = new Set(
    projects
      .map((project) => project.branch || project.category)
      .filter(Boolean)
  ).size;

  return (
    <>
      <section className="border-b border-border/70 bg-gradient-to-b from-primary/5 to-background/75 py-20 dark:border-slate-800 dark:from-primary/10 dark:to-slate-950/70">
        <Container>
          <div className="max-w-3xl">
            <Badge variant="premium" className="mb-6 px-4 py-1.5 text-sm uppercase tracking-widest">
              Portfolio
            </Badge>
            <h1 className="text-hero text-gradient">
              Engineering Showcase
            </h1>
            <p className="mt-6 text-lg text-muted">
              A collection of systems, tools, and platforms built with a focus on performance, scalability, and clean engineering.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
            <p className="text-sm font-medium text-muted">Published Projects</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{publishedCount.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm font-medium text-muted">Featured Builds</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{featuredCount.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
            <p className="text-sm font-medium text-muted">Total Views</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <p className="text-sm font-medium text-muted">Engineering Areas</p>
            <p className="mt-2 text-3xl font-bold text-foreground">{engineeringAreas.toLocaleString()}</p>
          </div>
        </div>
      </Container>
    </>
  );
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const searchQuery = params.search || '';
  const branch = params.branch || '';
  const project_type = params.project_type || '';
  const sort = params.sort || '';

  // Load projects from data file directly
  const projectsData = getProjectsData();
  const allProjects: ProjectsPageProject[] = projectsData.length > 0 ? projectsData : fallbackProjects;
  const featuredProjects = allProjects.filter(p => p.featured).slice(0, 3);
  const trendingProjects = [...allProjects].sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0)).slice(0, 6);
  const latestProjects = [...allProjects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);
  const popularProjects = [...allProjects].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 6);
  const authors: any[] = [];
  const loading = false;

  const authorMap = new Map(authors?.map((a: any) => [a.id, a]) || []);

  if (loading) {
    return (
      <main className="bg-background text-foreground">
        <section className="border-b border-border/70 bg-background/75 py-20 dark:border-slate-800 dark:bg-slate-950/70">
          <Container>
            <div className="max-w-3xl">
              <Skeleton variant="text" className="mb-6 h-8 w-32" />
              <Skeleton variant="text" className="h-16 w-96" />
              <Skeleton variant="text" className="mt-6 h-6 w-full" />
            </div>
          </Container>
        </section>
        <Container className="py-20">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="card" className="h-80" />
            ))}
          </div>
        </Container>
        <Footer />
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground">
      <ProjectsHeroBlock projects={allProjects} />

      <Container className="py-20">
        <AnimatedSection>
          <ProjectFilters
            searchQuery={searchQuery}
            branch={branch}
            projectType={project_type}
            sort={sort}
          />
          <FeaturedProjects projects={featuredProjects} authorMap={authorMap} />
          <TrendingProjects projects={trendingProjects} authorMap={authorMap} />
          <LatestProjects projects={latestProjects} authorMap={authorMap} />
          <PopularProjects projects={popularProjects} authorMap={authorMap} />

          {allProjects && allProjects.length === 0 && (
            <EmptyState
              icon={Search}
              title="No projects found"
              description="Try adjusting your filters or search query to find what you're looking for."
              actionLabel="Clear Filters"
              actionHref="/projects"
              variant="minimal"
            />
          )}
        </AnimatedSection>
      </Container>

      <Footer />
    </main>
  );
}
