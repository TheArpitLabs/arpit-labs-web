import { NextRequest, NextResponse } from 'next/server';
import { getExperiments, getJourneyTimeline, getProjects } from '@/lib/actions/server-actions';
import { Experiment, JourneyItem, Project } from '@/types/content';
import { membershipRepository } from '@/lib/repositories/membership.repository';

interface RecruiterReport {
  resumeSummary: string;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    specialties: string[];
  };
  projects: Array<{
    title: string;
    description: string;
    impact: string;
    technologies: string[];
  }>;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    description: string;
  }>;
  experienceOverview: string;
  engineeringCapabilities: string;
  leadershipIndicators: string;
  innovationScore: string;
}

const KNOWN_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'C++', 'Java'];
const KNOWN_FRAMEWORKS = ['Next.js', 'React', 'Django', 'FastAPI', 'Node.js', 'Express', 'Tailwind CSS'];
const KNOWN_TOOLS = ['Docker', 'Kubernetes', 'Supabase', 'PostgreSQL', 'Redis', 'Git', 'Vercel', 'AWS'];

function extractSkills(techStack: string[]) {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const tools = new Set<string>();
  const specialties = new Set<string>();

  for (const tech of techStack) {
    const normalized = tech.trim();
    if (KNOWN_LANGUAGES.includes(normalized)) {
      languages.add(normalized);
      continue;
    }
    if (KNOWN_FRAMEWORKS.includes(normalized)) {
      frameworks.add(normalized);
      continue;
    }
    if (KNOWN_TOOLS.includes(normalized)) {
      tools.add(normalized);
      continue;
    }
    specialties.add(normalized);
  }

  return { languages, frameworks, tools, specialties };
}

function buildProjectItems(projects: Project[]) {
  const featured = projects
    .slice()
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3)
    .map((project) => ({
      title: project.title,
      description: project.description,
      impact: project.overview || project.description || 'Strong technical impact delivered through real projects.',
      technologies: project.tech_stack ?? [],
    }));

  return featured;
}

function buildExperienceItems(timeline: JourneyItem[]) {
  const workEntries = timeline
    .filter((entry) => entry.entry_type === 'work' || entry.entry_type === 'achievement' || entry.entry_type === 'hackathon')
    .sort((a, b) => b.year - a.year)
    .slice(0, 5)
    .map((entry) => ({
      company: entry.organization ?? 'Independent',
      position: entry.title,
      duration: entry.year.toString(),
      description: entry.description,
    }));

  return workEntries;
}

function buildSkillSummary(projects: Project[], experiments: Experiment[]) {
  const languages = new Set<string>();
  const frameworks = new Set<string>();
  const tools = new Set<string>();
  const specialties = new Set<string>();

  const gather = (stack: string[]) => {
    const extracted = extractSkills(stack);
    extracted.languages.forEach((item) => languages.add(item));
    extracted.frameworks.forEach((item) => frameworks.add(item));
    extracted.tools.forEach((item) => tools.add(item));
    extracted.specialties.forEach((item) => specialties.add(item));
  };

  projects.forEach((project) => gather(project.tech_stack ?? []));
  experiments.forEach((experiment) => gather(experiment.tech_stack ?? []));

  const categories = new Set<string>();
  projects.forEach((project) => { if (project.category) categories.add(project.category); });
  experiments.forEach((experiment) => { if (experiment.category) categories.add(experiment.category); });

  categories.forEach((category) => specialties.add(category));

  return {
    languages: Array.from(languages).sort(),
    frameworks: Array.from(frameworks).sort(),
    tools: Array.from(tools).sort(),
    specialties: Array.from(specialties).sort(),
  };
}

function buildRecruiterSummary(projects: Project[], experiments: Experiment[], timeline: JourneyItem[]) {
  const projectCount = projects.length;
  const experimentCount = experiments.length;
  const timelineYears = timeline.map((entry) => entry.year);
  const minYear = Math.min(...timelineYears, new Date().getFullYear());
  const maxYear = Math.max(...timelineYears, new Date().getFullYear());

  return `Full-stack engineer with ${projectCount} published projects and ${experimentCount} research-driven experiments, backed by a career timeline from ${minYear} to ${maxYear}. Combines AI, IoT, and cloud-first engineering to deliver scalable product and system designs.`;
}

function buildEngineeringCapabilities(projects: Project[], experiments: Experiment[]) {
  const hasAI = projects.some((project) => /AI|ML|machine learning|data/i.test(project.title + ' ' + project.description));
  const hasIoT = projects.some((project) => /IoT|embedded|sensor|hardware/i.test(project.title + ' ' + project.description));
  const hasCloud = projects.some((project) => /cloud|kubernetes|docker|serverless|supabase|aws/i.test(project.title + ' ' + project.description));

  const capabilities = [
    `Designs full-stack systems that bridge web, mobile, and cloud architecture.`,
    `Develops secure, production-ready backends with modern persistence and deployment patterns.`,
  ];

  if (hasAI) {
    capabilities.push('Applies AI and embedding-based intelligence through semantic search and vector retrieval.');
  }
  if (hasIoT) {
    capabilities.push('Builds resilient IoT and hardware-aware workflows that integrate with secure data pipelines.');
  }
  if (hasCloud) {
    capabilities.push('Operates infrastructure with Docker, Kubernetes, and managed database services.');
  }

  return capabilities.join(' ');
}

function buildLeadershipIndicators(timeline: JourneyItem[]) {
  const milestones = timeline.filter((entry) => ['achievement', 'milestone', 'hackathon'].includes(entry.entry_type));
  const leadershipCount = milestones.length;

  if (leadershipCount === 0) {
    return 'Leadership is demonstrated through strong execution and technical ownership across development initiatives.';
  }

  return `Leadership indicators include ${leadershipCount} documented milestones or achievements, reflecting ownership, mentoring, and innovation across engineering projects.`;
}

function buildInnovationScore(projects: Project[], experiments: Experiment[]) {
  const score = Math.min(100, Math.max(20, 30 + projects.length * 8 + experiments.length * 7));
  return `${score} / 100`;
}

export async function GET(request: NextRequest) {
  try {
    const access = await membershipRepository.validateFeatureAccessFromRequest(request, 'recruiter_assistant');

    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status }
      );
    }

    const [projects, experiments, journey] = await Promise.all([getProjects(), getExperiments(), getJourneyTimeline()]);

    const skills = buildSkillSummary(projects, experiments);
    const report: RecruiterReport = {
      resumeSummary: buildRecruiterSummary(projects, experiments, journey),
      skills,
      projects: buildProjectItems(projects),
      experience: buildExperienceItems(journey),
      experienceOverview: `${projects.length} projects, ${experiments.length} experiments, and ${journey.length} career timeline entries showcase technical depth and delivery experience.`,
      engineeringCapabilities: buildEngineeringCapabilities(projects, experiments),
      leadershipIndicators: buildLeadershipIndicators(journey),
      innovationScore: buildInnovationScore(projects, experiments),
    };

    return NextResponse.json({ success: true, report }, { status: 200 });
  } catch (error) {
    console.error('Failed to build recruiter report:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unable to build recruiter report.',
      },
      { status: 500 }
    );
  }
}
