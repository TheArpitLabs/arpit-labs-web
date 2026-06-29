"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, FileText, BookOpen, Users, Database, Building2, Loader2, ChevronRight } from "lucide-react";
import { logger } from '@/lib/logger';

interface ProjectRecommendationsProps {
  projectId: string;
}

interface RecommendationItem {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  description: string;
  url: string;
  relevanceScore: number;
  factors?: {
    semanticSimilarity: number;
    sharedTechnologies: number;
    sharedDomains: number;
    sharedContributors: number;
    sharedDatasets: number;
  };
}

export function ProjectRecommendations({ projectId }: ProjectRecommendationsProps) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<{
    projects: RecommendationItem[];
    research: RecommendationItem[];
    resources: RecommendationItem[];
    contributors: RecommendationItem[];
    datasets: RecommendationItem[];
    organizations: RecommendationItem[];
  }>({
    projects: [],
    research: [],
    resources: [],
    contributors: [],
    datasets: [],
    organizations: [],
  });

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendations?projectId=${projectId}&type=all&limit=5&includeFactors=true`);
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.result);
      }
    } catch (error) {
      logger.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const hasRecommendations = 
    recommendations.projects.length > 0 ||
    recommendations.research.length > 0 ||
    recommendations.resources.length > 0 ||
    recommendations.contributors.length > 0 ||
    recommendations.datasets.length > 0 ||
    recommendations.organizations.length > 0;

  if (!hasRecommendations) {
    return null;
  }

  return (
    <div className="space-y-6">
      {recommendations.projects.length > 0 && (
        <RecommendationSection
          title="Related Projects"
          icon={<Link2 size={18} />}
          items={recommendations.projects}
        />
      )}
      
      {recommendations.research.length > 0 && (
        <RecommendationSection
          title="Related Research"
          icon={<FileText size={18} />}
          items={recommendations.research}
        />
      )}
      
      {recommendations.resources.length > 0 && (
        <RecommendationSection
          title="Recommended Resources"
          icon={<BookOpen size={18} />}
          items={recommendations.resources}
        />
      )}
      
      {recommendations.contributors.length > 0 && (
        <RecommendationSection
          title="People You Should Follow"
          icon={<Users size={18} />}
          items={recommendations.contributors}
        />
      )}
      
      {recommendations.datasets.length > 0 && (
        <RecommendationSection
          title="Recommended Datasets"
          icon={<Database size={18} />}
          items={recommendations.datasets}
        />
      )}
      
      {recommendations.organizations.length > 0 && (
        <RecommendationSection
          title="Related Organizations"
          icon={<Building2 size={18} />}
          items={recommendations.organizations}
        />
      )}
    </div>
  );
}

function RecommendationSection({ title, icon, items }: {
  title: string;
  icon: React.ReactNode;
  items: RecommendationItem[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  return (
    <a
      href={item.url}
      className="group flex items-start gap-4 rounded-lg border border-border/70 bg-muted/30 p-4 transition-colors hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </h4>
        <p className="mt-1 text-sm text-muted line-clamp-2">{item.description}</p>
        {item.factors && (
          <div className="mt-2 flex flex-wrap gap-2">
            <ScoreBadge label="Match" value={item.relevanceScore} />
          </div>
        )}
      </div>
      <ChevronRight size={16} className="text-muted mt-1 group-hover:text-primary transition-colors flex-shrink-0" />
    </a>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
    if (score >= 60) return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    if (score >= 40) return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
    return "bg-gray-500/10 text-gray-700 dark:text-gray-300";
  };

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getColor(value)}`}>
      {label}: {value}%
    </span>
  );
}
