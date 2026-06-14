import { BookOpen, Target, TrendingUp, Award, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function LearningPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Learning Hub</h1>
        </div>
        <p className="text-muted">Personalized learning paths and career progression</p>
      </div>

      <Suspense fallback={<LearningDashboardLoading />}>
        <LearningDashboard />
      </Suspense>
    </div>
  );
}

function LearningDashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );
}

async function LearningDashboard() {
  const [currentPath, progress, recommendedSkills, recommendedProjects, careerProgress] = await Promise.all([
    fetchCurrentPath(),
    fetchProgress(),
    fetchRecommendedSkills(),
    fetchRecommendedProjects(),
    fetchCareerProgress(),
  ]);

  return (
    <div className="space-y-8">
      {/* Current Learning Path */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Target size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Current Learning Path</h2>
        </div>
        <CurrentPathSection path={currentPath} />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard
          title="Projects Completed"
          value={progress.projectsCompleted}
          icon={<BookOpen size={20} />}
        />
        <ProgressCard
          title="Skills Learned"
          value={progress.skillsLearned}
          icon={<Award size={20} />}
        />
        <ProgressCard
          title="Learning Hours"
          value={progress.learningHours}
          icon={<Clock size={20} />}
        />
      </div>

      {/* Recommended Skills */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Recommended Skills</h2>
        </div>
        <RecommendedSkillsSection skills={recommendedSkills} />
      </div>

      {/* Recommended Projects */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Recommended Projects</h2>
        </div>
        <RecommendedProjectsSection projects={recommendedProjects} />
      </div>

      {/* Career Track Progress */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Award size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Career Track Progress</h2>
        </div>
        <CareerProgressSection progress={careerProgress} />
      </div>
    </div>
  );
}

async function fetchCurrentPath() {
  // Mock data - would fetch from API
  return {
    name: "AI Engineer Path",
    currentStep: "Deep Learning",
    progress: 65,
    totalSteps: 8,
    steps: [
      { name: "Python Fundamentals", completed: true },
      { name: "Machine Learning Basics", completed: true },
      { name: "TensorFlow", completed: true },
      { name: "Computer Vision", completed: true },
      { name: "Deep Learning", completed: false },
      { name: "NLP", completed: false },
      { name: "MLOps", completed: false },
      { name: "Advanced AI", completed: false },
    ],
  };
}

async function fetchProgress() {
  // Mock data - would fetch from API
  return {
    projectsCompleted: 12,
    skillsLearned: 24,
    learningHours: 48,
  };
}

async function fetchRecommendedSkills() {
  // Mock data - would fetch from API
  return [
    { name: "PyTorch", level: "intermediate", reason: "Builds on your TensorFlow knowledge" },
    { name: "MLOps", level: "advanced", reason: "Essential for production AI systems" },
    { name: "NLP", level: "advanced", reason: "Complements your Computer Vision skills" },
    { name: "Reinforcement Learning", level: "expert", reason: "Next step in AI journey" },
  ];
}

async function fetchRecommendedProjects() {
  // Mock data - would fetch from API
  return [
    { name: "YOLO Object Detection", difficulty: "intermediate", match: 95 },
    { name: "Smart Traffic System", difficulty: "advanced", match: 88 },
    { name: "Face Recognition System", difficulty: "intermediate", match: 82 },
  ];
}

async function fetchCareerProgress() {
  // Mock data - would fetch from API
  return {
    trackName: "AI Engineer",
    progress: 65,
    completedSkills: ["Python", "Machine Learning", "TensorFlow", "Computer Vision"],
    missingSkills: ["PyTorch", "MLOps", "NLP"],
  };
}

function ProgressCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-medium text-muted">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
    </div>
  );
}

function CurrentPathSection({ path }: { path: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-foreground">{path.name}</div>
          <div className="text-sm text-muted">Step {path.currentStep} of {path.totalSteps}</div>
        </div>
        <div className="text-2xl font-bold text-primary">{path.progress}%</div>
      </div>
      <div className="space-y-2">
        {path.steps.map((step: any, index: number) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg p-3 ${
              step.completed ? "bg-primary/10 border-primary/30" : "bg-muted/30 border-border/70"
            } border`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.completed ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {step.completed ? "✓" : index + 1}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{step.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendedSkillsSection({ skills }: { skills: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {skills.map((skill) => (
        <div
          key={skill.name}
          className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div>
            <div className="font-medium text-foreground">{skill.name}</div>
            <div className="text-sm text-muted">{skill.reason}</div>
          </div>
          <div className="text-xs text-muted capitalize">{skill.level}</div>
        </div>
      ))}
    </div>
  );
}

function RecommendedProjectsSection({ projects }: { projects: any[] }) {
  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <a
          key={project.name}
          href={`/projects/${project.name.toLowerCase().replace(/\s+/g, "-")}`}
          className="group flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-4 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div>
            <div className="font-medium text-foreground group-hover:text-primary transition-colors">{project.name}</div>
            <div className="text-sm text-muted capitalize">{project.difficulty}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-primary">{project.match}%</div>
            <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors" />
          </div>
        </a>
      ))}
    </div>
  );
}

function CareerProgressSection({ progress }: { progress: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-foreground">{progress.trackName}</div>
        <div className="text-2xl font-bold text-primary">{progress.progress}%</div>
      </div>
      <div className="space-y-2">
        <div>
          <div className="text-sm text-muted mb-1">Completed Skills</div>
          <div className="flex flex-wrap gap-2">
            {progress.completedSkills.map((skill: string) => (
              <span
                key={skill}
                className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm text-muted mb-1">Missing Skills</div>
          <div className="flex flex-wrap gap-2">
            {progress.missingSkills.map((skill: string) => (
              <span
                key={skill}
                className="rounded-full bg-muted/30 text-muted px-3 py-1 text-xs font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
