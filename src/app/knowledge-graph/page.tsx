"use client";

import { Network, Search, Filter, BarChart3, Loader2 } from "lucide-react";
import { Suspense, useState } from "react";
import { logger } from '@/lib/logger';

export default function KnowledgeGraphPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Network size={32} className="text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Knowledge Graph</h1>
        </div>
        <p className="text-muted">Explore the connected engineering knowledge ecosystem</p>
      </div>

      <Suspense fallback={<GraphExplorerLoading />}>
        <GraphExplorer />
      </Suspense>
    </div>
  );
}

function GraphExplorerLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );
}

async function GraphExplorer() {
  const [stats, technologies, contributors, organizations] = await Promise.all([
    fetchGraphStats(),
    fetchMostConnected("technology", 10),
    fetchMostConnected("contributor", 10),
    fetchMostConnected("organization", 10),
  ]);

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Entities" value={stats.totalEntities} icon={<Network size={20} />} />
        <StatCard title="Total Relationships" value={stats.totalRelationships} icon={<BarChart3 size={20} />} />
        <StatCard title="Entity Types" value={Object.keys(stats.entitiesByType).length} icon={<Filter size={20} />} />
        <StatCard title="Relationship Types" value={Object.keys(stats.relationshipsByType).length} icon={<Network size={20} />} />
      </div>

      {/* Search Section */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Search size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Search the Knowledge Graph</h2>
        </div>
        <GraphSearch />
      </div>

      {/* Most Connected Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MostConnectedSection
          title="Most Connected Technologies"
          icon={<Network size={18} />}
          items={technologies}
          type="technology"
        />
        <MostConnectedSection
          title="Most Connected Contributors"
          icon={<Network size={18} />}
          items={contributors}
          type="contributor"
        />
        <MostConnectedSection
          title="Most Connected Organizations"
          icon={<Network size={18} />}
          items={organizations}
          type="organization"
        />
      </div>

      {/* Entity Type Breakdown */}
      <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-3 mb-4">
          <Filter size={20} className="text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Entity Type Breakdown</h2>
        </div>
        <EntityTypeBreakdown stats={stats} />
      </div>
    </div>
  );
}

async function fetchGraphStats() {
  const response = await fetch("/api/graph?action=stats");
  const data = await response.json();
  return data.success ? data.result : { totalEntities: 0, totalRelationships: 0, entitiesByType: {}, relationshipsByType: {} };
}

async function fetchMostConnected(type: string, limit: number) {
  const response = await fetch(`/api/graph?action=most-connected&entityType=${type}&limit=${limit}`);
  const data = await response.json();
  return data.success ? data.result : [];
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-medium text-muted">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-foreground">{value.toLocaleString()}</div>
    </div>
  );
}

function GraphSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/graph?action=search&query=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();
      setResults(data.success ? data.result : []);
    } catch (error) {
      logger.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search for projects, technologies, contributors, organizations..."
          className="flex-1 rounded-full border border-border/70 bg-muted/30 px-4 py-2 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950/90"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="rounded-full bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result: any) => (
            <div
              key={result.id}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-3 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <div>
                <div className="font-medium text-foreground">{result.title}</div>
                <div className="text-sm text-muted">{result.type}</div>
              </div>
              <div className="text-xs text-muted">{result.entityId}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MostConnectedSection({ title, icon, items, type }: {
  title: string;
  icon: React.ReactNode;
  items: any[];
  type: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-primary">{icon}</div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.entity.id}
            className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 p-3 hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <div>
              <div className="font-medium text-foreground">{item.entity.title}</div>
              <div className="text-xs text-muted">{item.entity.entityId}</div>
            </div>
            <div className="text-sm font-semibold text-primary">{item.connectionCount}</div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-center py-4 text-sm text-muted">No data available</div>
        )}
      </div>
    </div>
  );
}

function EntityTypeBreakdown({ stats }: { stats: any }) {
  const entityTypes = Object.entries(stats.entitiesByType || {}).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {entityTypes.map(([type, count]: [string, any]) => (
        <div
          key={type}
          className="rounded-lg border border-border/70 bg-muted/30 p-4 text-center hover:border-primary/50 hover:bg-muted/50 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          <div className="text-2xl font-bold text-foreground">{count}</div>
          <div className="text-sm text-muted capitalize">{type}</div>
        </div>
      ))}
    </div>
  );
}
