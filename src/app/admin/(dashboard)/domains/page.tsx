import Link from "next/link";
import { AdminSection } from "@/components/admin/AdminSection";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, FileText, Database, Users, ArrowRight, Sparkles, BarChart3, RefreshCw } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface DomainStats {
  domain_id: string;
  domain_name: string;
  domain_slug: string;
  domain_icon: string;
  domain_color: string;
  domain_description: string;
  total_projects: number;
  total_research_papers: number;
  total_datasets: number;
  total_learning_resources: number;
  total_hackathons: number;
  total_contributors: number;
  total_content: number;
  avg_confidence_score: number;
}

interface SubdomainStats {
  subdomain_id: string;
  subdomain_name: string;
  subdomain_slug: string;
  subdomain_description: string;
  domain_id: string;
  domain_name: string;
  domain_slug: string;
  domain_icon: string;
  domain_color: string;
  total_content: number;
  avg_confidence_score: number;
}

async function getDomainStats(): Promise<DomainStats[]> {
  const { data, error } = await supabase
    .from('domain_content_statistics')
    .select('*')
    .order('total_content', { ascending: false });

  if (error) {
    console.error('Error fetching domain stats:', error);
    return [];
  }

  return data || [];
}

async function getSubdomainStats(): Promise<SubdomainStats[]> {
  const { data, error } = await supabase
    .from('subdomain_content_statistics')
    .select('*')
    .order('total_content', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching subdomain stats:', error);
    return [];
  }

  return data || [];
}

async function getRecentClassifications() {
  const { data, error } = await supabase
    .from('content_domain_mapping')
    .select(`
      *,
      engineering_domains (name, slug, icon, color),
      engineering_subdomains (name, slug)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching recent classifications:', error);
    return [];
  }

  return data || [];
}

export default async function AdminDomainsPage() {
  const [domainStats, subdomainStats, recentClassifications] = await Promise.all([
    getDomainStats(),
    getSubdomainStats(),
    getRecentClassifications()
  ]);

  const totalContent = domainStats.reduce((sum, d) => sum + (d.total_content || 0), 0);
  const avgConfidence = domainStats.length > 0 
    ? domainStats.reduce((sum, d) => sum + (d.avg_confidence_score || 0), 0) / domainStats.length 
    : 0;

  return (
    <div className="space-y-6">
      <AdminTopbar 
        title="Domain Analytics" 
        subtitle="Monitor engineering domain performance, content distribution, and AI classification accuracy."
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Domains</span>
            <Sparkles className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{domainStats.length}</div>
          <div className="text-slate-400 text-sm mt-1">Active engineering branches</div>
        </Card>

        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Total Content</span>
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{totalContent.toLocaleString()}</div>
          <div className="text-slate-400 text-sm mt-1">Classified items</div>
        </Card>

        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Avg Confidence</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{(avgConfidence * 100).toFixed(1)}%</div>
          <div className="text-slate-400 text-sm mt-1">AI classification accuracy</div>
        </Card>

        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-sm">Subdomains</span>
            <Database className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">{subdomainStats.length}</div>
          <div className="text-slate-400 text-sm mt-1">Specialized areas</div>
        </Card>
      </div>

      {/* Domain Performance */}
      <AdminSection 
        title="Domain Performance" 
        description="Content distribution and growth metrics per engineering domain."
      >
        <div className="space-y-4">
          {domainStats.map((domain) => (
            <Card key={domain.domain_id} className="p-6 bg-slate-800/50 border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${domain.domain_color}20` }}
                  >
                    {domain.domain_icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{domain.domain_name}</h3>
                    <p className="text-slate-400 text-sm mt-1">{domain.domain_description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{domain.total_projects} Projects</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{domain.total_research_papers} Papers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{domain.total_datasets} Datasets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{domain.total_contributors} Contributors</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">{domain.total_content}</div>
                  <div className="text-slate-400 text-sm">Total items</div>
                  <Badge variant="outline" className="mt-2 border-slate-600 text-slate-300">
                    {(domain.avg_confidence_score * 100).toFixed(0)}% confidence
                  </Badge>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Progress to target</span>
                  <span>{domain.total_projects} / {getTargetForDomain(domain.domain_slug)}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((domain.total_projects / getTargetForDomain(domain.domain_slug)) * 100, 100)}%`,
                      backgroundColor: domain.domain_color 
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </AdminSection>

      {/* Top Subdomains */}
      <AdminSection 
        title="Top Subdomains" 
        description="Most active specialized areas within engineering domains."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subdomainStats.slice(0, 10).map((subdomain) => (
            <Card key={subdomain.subdomain_id} className="p-4 bg-slate-800/50 border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{subdomain.domain_icon}</span>
                    <h4 className="font-semibold text-white">{subdomain.subdomain_name}</h4>
                  </div>
                  <p className="text-slate-400 text-sm">{subdomain.domain_name}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-white">{subdomain.total_content}</div>
                  <div className="text-slate-400 text-xs">items</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </AdminSection>

      {/* Recent Classifications */}
      <AdminSection 
        title="Recent AI Classifications" 
        description="Latest content automatically classified by the AI domain classifier."
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-4 text-slate-400 font-medium">Content ID</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Type</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Domain</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Subdomain</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Confidence</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Classified</th>
                </tr>
              </thead>
              <tbody>
                {recentClassifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No recent classifications found
                    </td>
                  </tr>
                ) : (
                  recentClassifications.map((classification: any) => (
                    <tr key={classification.id} className="border-b border-slate-700/50">
                      <td className="p-4 text-slate-300 text-sm font-mono">
                        {classification.content_id.slice(0, 8)}...
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                          {classification.content_type}
                        </Badge>
                      </td>
                      <td className="p-4 text-white">
                        <div className="flex items-center gap-2">
                          <span>{classification.engineering_domains?.icon}</span>
                          <span>{classification.engineering_domains?.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">
                        {classification.engineering_subdomains?.name || 'N/A'}
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant="outline" 
                          className={
                            classification.confidence_score > 0.8 
                              ? "border-green-600 text-green-400" 
                              : classification.confidence_score > 0.5
                              ? "border-yellow-600 text-yellow-400"
                              : "border-red-600 text-red-400"
                          }
                        >
                          {(classification.confidence_score * 100).toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="p-4 text-slate-400 text-sm">
                        {new Date(classification.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </AdminSection>

      {/* Actions */}
      <AdminSection 
        title="Quick Actions" 
        description="Common domain management tasks."
      >
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-classify Content
          </Button>
          <Button variant="outline" className="border-slate-600 text-slate-200">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Analytics
          </Button>
          <Button variant="outline" className="border-slate-600 text-slate-200">
            <Sparkles className="w-4 h-4 mr-2" />
            Train Classifier
          </Button>
        </div>
      </AdminSection>
    </div>
  );
}

function getTargetForDomain(slug: string): number {
  const targets: Record<string, number> = {
    'ai-machine-learning': 3000,
    'software-development': 2500,
    'cybersecurity': 1500,
    'iot-embedded-systems': 1500,
    'data-science': 1000,
    'robotics': 500,
  };
  return targets[slug] || 1000;
}
