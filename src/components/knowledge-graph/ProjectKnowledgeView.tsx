"use client";

import { useState, useEffect, useCallback } from "react";
import { Network, Cpu, Users, Building2, FileText, Database, BookOpen, ChevronRight, Loader2 } from "lucide-react";

interface ProjectKnowledgeViewProps {
  projectId: string;
  projectSlug: string;
}

interface GraphEntity {
  id: string;
  type: string;
  entityId: string;
  title: string;
  slug?: string;
  metadata: any;
}

export function ProjectKnowledgeView({ projectId, projectSlug }: ProjectKnowledgeViewProps) {
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState<{
    technologies: GraphEntity[];
    domains: GraphEntity[];
    contributors: GraphEntity[];
    organizations: GraphEntity[];
    research: GraphEntity[];
    datasets: GraphEntity[];
  }>({
    technologies: [],
    domains: [],
    contributors: [],
    organizations: [],
    research: [],
    datasets: [],
  });

  const fetchRelatedEntities = useCallback(async (entityId: string, entityType: string, relationshipType: string) => {
    const response = await fetch(
      `/api/graph?action=related&entityId=${entityId}&entityType=${entityType}&relationshipType=${relationshipType}`
    );
    const data = await response.json();
    return data.success ? data.result : [];
  }, []);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    try {
      const [technologies, domains, contributors, organizations, research, datasets] = await Promise.all([
        fetchRelatedEntities(projectId, "project", "uses_technology"),
        fetchRelatedEntities(projectId, "project", "belongs_to_domain"),
        fetchRelatedEntities(projectId, "project", "built_by"),
        fetchRelatedEntities(projectId, "project", "affiliated_with"),
        fetchRelatedEntities(projectId, "project", "references"),
        fetchRelatedEntities(projectId, "project", "uses_dataset"),
      ]);

      setGraphData({ technologies, domains, contributors, organizations, research, datasets });
    } catch (error) {
      console.error("Failed to fetch graph data:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchRelatedEntities]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  const hasData = 
    graphData.technologies.length > 0 ||
    graphData.domains.length > 0 ||
    graphData.contributors.length > 0 ||
    graphData.organizations.length > 0 ||
    graphData.research.length > 0 ||
    graphData.datasets.length > 0;

  if (!hasData) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Network size={24} className="text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Knowledge Graph</h2>
      </div>

      {graphData.technologies.length > 0 && (
        <KnowledgeSection
          title="Related Technologies"
          icon={<Cpu size={18} />}
          items={graphData.technologies}
          getLink={(item) => `/technologies/${item.entityId}`}
        />
      )}

      {graphData.domains.length > 0 && (
        <KnowledgeSection
          title="Domains"
          icon={<Network size={18} />}
          items={graphData.domains}
          getLink={(item) => `/domains/${item.entityId}`}
        />
      )}

      {graphData.contributors.length > 0 && (
        <KnowledgeSection
          title="Contributors"
          icon={<Users size={18} />}
          items={graphData.contributors}
          getLink={(item) => `/contributors/${item.entityId}`}
        />
      )}

      {graphData.organizations.length > 0 && (
        <KnowledgeSection
          title="Organizations"
          icon={<Building2 size={18} />}
          items={graphData.organizations}
          getLink={(item) => `/organizations/${item.entityId}`}
        />
      )}

      {graphData.research.length > 0 && (
        <KnowledgeSection
          title="Related Research"
          icon={<FileText size={18} />}
          items={graphData.research}
          getLink={(item) => `/research/${item.slug}`}
        />
      )}

      {graphData.datasets.length > 0 && (
        <KnowledgeSection
          title="Datasets"
          icon={<Database size={18} />}
          items={graphData.datasets}
          getLink={(item) => `/datasets/${item.slug}`}
        />
      )}
    </div>
  );
}

function KnowledgeSection({ title, icon, items, getLink }: {
  title: string;
  icon: React.ReactNode;
  items: GraphEntity[];
  getLink: (item: GraphEntity) => string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mb-4 flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className="text-sm text-muted">({items.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={getLink(item)}
            className="group flex items-center gap-2 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <span>{item.title}</span>
            <ChevronRight size={14} className="text-muted group-hover:text-primary transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
