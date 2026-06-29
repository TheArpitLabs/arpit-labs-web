import { BookOpen, Target, TrendingUp, Award, Clock, ChevronRight, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { logger } from "@/lib/logger";

// Type definitions for API responses
interface UserProgressItem {
  progress_type: string;
  progress_value: number;
}

interface RecommendationItem {
  recommendation_type: string;
  recommended_entity_id: string;
  reason?: string;
  metadata?: {
    level?: string;
    difficulty?: string;
  };
  score?: number;
}

interface CareerTrackItem {
  id: string;
}

interface CareerTrackProgressData {
  track_name?: string;
  progress?: number;
  completed_skills?: string[];
  missing_skills?: string[];
}

// Type definitions for component props
interface LearningStep {
  name: string;
  completed: boolean;
}

interface LearningPath {
  name: string;
  currentStep: string;
  progress: number;
  totalSteps: number;
  steps: LearningStep[];
}

interface LearningProgress {
  projectsCompleted: number;
  skillsLearned: number;
  learningHours: number;
}

interface RecommendedSkill {
  name: string;
  reason: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface RecommendedProject {
  name: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  match: number;
}

interface CareerProgress {
  trackName: string;
  progress: number;
  completedSkills: string[];
  missingSkills: string[];
}

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
  try {
    const response = await fetch('/api/learning?action=user-progress&userId=default', {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.success && data.result && data.result.length > 0) {
      const progress = data.result.find((p: UserProgressItem) => p.progress_type === 'path_completed');
      if (progress) {
        return {
          name: "Full-Stack Development",
          currentStep: "React Advanced Patterns",
          progress: progress.progress_value,
          totalSteps: 8,
          steps: [
            { name: "HTML & CSS Fundamentals", completed: true },
            { name: "JavaScript ES6+", completed: true },
            { name: "React Basics", completed: true },
            { name: "State Management", completed: true },
            { name: "React Advanced Patterns", completed: false },
            { name: "Backend Development", completed: false },
            { name: "Database Design", completed: false },
            { name: "Deployment & DevOps", completed: false },
          ],
        };
      }
    }
    
    // Fallback to default if no data found
    return {
      name: "Full-Stack Development",
      currentStep: "React Advanced Patterns",
      progress: 0,
      totalSteps: 8,
      steps: [
        { name: "HTML & CSS Fundamentals", completed: false },
        { name: "JavaScript ES6+", completed: false },
        { name: "React Basics", completed: false },
        { name: "State Management", completed: false },
        { name: "React Advanced Patterns", completed: false },
        { name: "Backend Development", completed: false },
        { name: "Database Design", completed: false },
        { name: "Deployment & DevOps", completed: false },
      ],
    };
  } catch (error) {
    logger.error('Error fetching current path', error);
    return {
      name: "Full-Stack Development",
      currentStep: "Getting Started",
      progress: 0,
      totalSteps: 8,
      steps: [
        { name: "HTML & CSS Fundamentals", completed: false },
        { name: "JavaScript ES6+", completed: false },
        { name: "React Basics", completed: false },
        { name: "State Management", completed: false },
        { name: "React Advanced Patterns", completed: false },
        { name: "Backend Development", completed: false },
        { name: "Database Design", completed: false },
        { name: "Deployment & DevOps", completed: false },
      ],
    };
  }
}

async function fetchProgress() {
  try {
    const response = await fetch('/api/learning?action=user-progress&userId=default', {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.success && data.result) {
      const projectsCompleted = data.result.filter((p: UserProgressItem) => p.progress_type === 'project_completed').length;
      const skillsLearned = data.result.filter((p: UserProgressItem) => p.progress_type === 'skill_learned' && p.progress_value === 100).length;
      const learningHours = Math.floor(skillsLearned * 6.5); // Estimate: ~6.5 hours per skill
      
      return {
        projectsCompleted,
        skillsLearned,
        learningHours,
      };
    }
    
    // Fallback to default if no data found
    return {
      projectsCompleted: 0,
      skillsLearned: 0,
      learningHours: 0,
    };
  } catch (error) {
    logger.error('Error fetching progress', error);
    return {
      projectsCompleted: 0,
      skillsLearned: 0,
      learningHours: 0,
    };
  }
}

async function fetchRecommendedSkills() {
  try {
    const response = await fetch('/api/learning?action=recommendations&userId=default&limit=10', {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.success && data.result && data.result.length > 0) {
      const skillRecommendations = data.result
        .filter((r: RecommendationItem) => r.recommendation_type === 'skill')
        .map((r: RecommendationItem): RecommendedSkill => ({
          name: r.recommended_entity_id,
          reason: r.reason || 'Recommended based on your learning path',
          level: (r.metadata?.level as 'beginner' | 'intermediate' | 'advanced') || 'intermediate'
        }));
      
      if (skillRecommendations.length > 0) {
        return skillRecommendations;
      }
    }
    
    // Fallback to default if no data found
    return [
      { name: "TypeScript", reason: "Essential for large-scale applications", level: "intermediate" },
      { name: "Next.js", reason: "Complement your React skills", level: "beginner" },
      { name: "PostgreSQL", reason: "Database management for full-stack apps", level: "intermediate" },
      { name: "Docker", reason: "Containerization for deployment", level: "advanced" },
    ];
  } catch (error) {
    logger.error('Error fetching recommended skills', error);
    return [
      { name: "TypeScript", reason: "Essential for large-scale applications", level: "intermediate" },
      { name: "Next.js", reason: "Complement your React skills", level: "beginner" },
      { name: "PostgreSQL", reason: "Database management for full-stack apps", level: "intermediate" },
      { name: "Docker", reason: "Containerization for deployment", level: "advanced" },
    ];
  }
}

async function fetchRecommendedProjects() {
  try {
    const response = await fetch('/api/learning?action=recommendations&userId=default&limit=10', {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.success && data.result && data.result.length > 0) {
      const projectRecommendations = data.result
        .filter((r: RecommendationItem) => r.recommendation_type === 'project')
        .map((r: RecommendationItem): RecommendedProject => ({
          name: r.recommended_entity_id,
          difficulty: (r.metadata?.difficulty as 'Beginner' | 'Intermediate' | 'Advanced') || 'Intermediate',
          match: Math.round((r.score || 0.85) * 100) || 85
        }));
      
      if (projectRecommendations.length > 0) {
        return projectRecommendations;
      }
    }
    
    // Fallback to default if no data found
    return [
      { name: "E-Commerce Platform", difficulty: "Advanced", match: 92 },
      { name: "Task Management App", difficulty: "Intermediate", match: 88 },
      { name: "Weather Dashboard", difficulty: "Beginner", match: 85 },
    ];
  } catch (error) {
    logger.error('Error fetching recommended projects', error);
    return [
      { name: "E-Commerce Platform", difficulty: "Advanced", match: 92 },
      { name: "Task Management App", difficulty: "Intermediate", match: 88 },
      { name: "Weather Dashboard", difficulty: "Beginner", match: 85 },
    ];
  }
}

async function fetchCareerProgress() {
  try {
    // First get career tracks to find a default one
    const tracksResponse = await fetch('/api/learning?action=career-tracks', {
      cache: 'no-store'
    });
    const tracksData = await tracksResponse.json();
    
    let defaultTrackId = 'default';
    if (tracksData.success && tracksData.result && tracksData.result.length > 0) {
      defaultTrackId = tracksData.result[0].id;
    }
    
    // Get career track progress
    const response = await fetch(`/api/learning?action=track-progress&userId=default&trackId=${defaultTrackId}`, {
      cache: 'no-store'
    });
    const data = await response.json();
    
    if (data.success && data.result) {
      return {
        trackName: data.result.track_name || "Full-Stack Developer",
        progress: Math.round(data.result.progress || 0),
        completedSkills: data.result.completed_skills || [],
        missingSkills: data.result.missing_skills || [],
      };
    }
    
    // Fallback to default if no data found
    return {
      trackName: "Full-Stack Developer",
      progress: 0,
      completedSkills: [],
      missingSkills: ["React", "JavaScript", "HTML/CSS", "Git", "REST APIs"],
    };
  } catch (error) {
    logger.error('Error fetching career progress', error);
    return {
      trackName: "Full-Stack Developer",
      progress: 0,
      completedSkills: [],
      missingSkills: ["React", "JavaScript", "HTML/CSS", "Git", "REST APIs"],
    };
  }
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

function CurrentPathSection({ path }: { path: LearningPath }) {
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
        {path.steps.map((step: LearningStep, index: number) => (
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

function RecommendedSkillsSection({ skills }: { skills: RecommendedSkill[] }) {
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

function RecommendedProjectsSection({ projects }: { projects: RecommendedProject[] }) {
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

function CareerProgressSection({ progress }: { progress: CareerProgress }) {
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
