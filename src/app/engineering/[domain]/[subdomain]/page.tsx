"use client";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, ExternalLink, TrendingUp, FileText, Database, ArrowRight, Sparkles, Star, Download, Filter } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import React, { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface SubdomainData {
  id: string;
  name: string;
  slug: string;
  description: string;
  domain_id: string;
  total_projects: number;
  total_research_papers: number;
  total_datasets: number;
}

interface DomainData {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  trending_score?: number;
  created_at: string;
}

interface ResearchPaper {
  id: string;
  title: string;
  slug: string;
  authors: string[];
  published_date: string;
  citations: number;
}

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  downloads: number;
  size: string;
}

export default function SubdomainPage({ params }: { params: Promise<{ domain: string; subdomain: string }> }) {
  const resolvedParams = use(params);
  const domainSlug = resolvedParams.domain;
  const subdomainSlug = resolvedParams.subdomain;

  return (
    <SubdomainPageContent domainSlug={domainSlug} subdomainSlug={subdomainSlug} />
  );
}

function SubdomainPageContent({ domainSlug, subdomainSlug }: { domainSlug: string; subdomainSlug: string }) {
  const [subdomainData, setSubdomainData] = useState<SubdomainData | null>(null);
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'trending' | 'latest' | 'stars'>('trending');
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchSubdomainData() {
      try {
        setLoading(true);

        // Fetch domain details
        const { data: domain, error: domainError } = await supabase
          .from('engineering_domains')
          .select('*')
          .eq('slug', domainSlug)
          .single();

        if (domainError) throw domainError;
        setDomainData(domain);

        // Fetch subdomain details
        const { data: subdomain, error: subdomainError } = await supabase
          .from('engineering_subdomains')
          .select('*')
          .eq('slug', subdomainSlug)
          .eq('domain_id', domain.id)
          .single();

        if (subdomainError) throw subdomainError;
        setSubdomainData(subdomain);

        // Fetch projects
        let projectsQuery = supabase
          .from('projects')
          .select('*')
          .eq('subdomain_id', subdomain.id);
        
        if (sortBy === 'trending') {
          projectsQuery = projectsQuery.order('trending_score', { ascending: false });
        } else if (sortBy === 'stars') {
          projectsQuery = projectsQuery.order('stars', { ascending: false });
        } else {
          projectsQuery = projectsQuery.order('created_at', { ascending: false });
        }
        
        const { data: projectsData, error: projectsError } = await projectsQuery.limit(20);

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // Fetch research papers
        const { data: papersData, error: papersError } = await supabase
          .from('research_papers')
          .select('*')
          .eq('subdomain_id', subdomain.id)
          .order('citations', { ascending: false })
          .limit(10);

        if (papersError) throw papersError;
        setResearchPapers(papersData || []);

        // Fetch datasets
        const { data: datasetsData, error: datasetsError } = await supabase
          .from('datasets')
          .select('*')
          .eq('subdomain_id', subdomain.id)
          .order('downloads', { ascending: false })
          .limit(10);

        if (datasetsError) throw datasetsError;
        setDatasets(datasetsData || []);

      } catch (err) {
        logger.error('Error fetching subdomain data:', err);
        setError('Failed to load subdomain data');
      } finally {
        setLoading(false);
      }
    }

    fetchSubdomainData();
  }, [domainSlug, subdomainSlug, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Container>
          <div className="py-20">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !subdomainData || !domainData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Container>
          <div className="py-20 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Subdomain Not Found</h1>
            <p className="text-red-400">{error || 'Subdomain not found'}</p>
            <Link href={`/engineering/${domainSlug}`}>
              <Button className="mt-6">Back to Domain</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Container>
        <div className="py-20">
          {/* Breadcrumb */}
          <AnimatedSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/engineering" className="hover:text-white transition-colors">
                  Engineering
                </Link>
                <span>/</span>
                <Link href={`/engineering/${domainData.slug}`} className="hover:text-white transition-colors">
                  {domainData.name}
                </Link>
                <span>/</span>
                <span className="text-white">{subdomainData.name}</span>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Subdomain Header */}
          <AnimatedSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold text-white mb-3">
                    {subdomainData.name}
                  </h1>
                  <p className="text-xl text-slate-300 max-w-2xl">
                    {subdomainData.description}
                  </p>
                </div>
              </div>

              {/* Subdomain Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Github className="w-4 h-4" />
                    <span>Projects</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{subdomainData.total_projects}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Research Papers</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{subdomainData.total_research_papers}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Database className="w-4 h-4" />
                    <span>Datasets</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{subdomainData.total_datasets}</p>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Projects Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Github className="w-6 h-6 text-blue-400" />
                Projects
              </h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant={sortBy === 'trending' ? 'primary' : 'outline'}
                  size="sm"
                  className={`${sortBy === 'trending' ? 'bg-green-600 text-white' : 'border-slate-600 text-slate-300'}`}
                  onClick={() => setSortBy('trending')}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending
                </Button>
                <Button 
                  variant={sortBy === 'latest' ? 'primary' : 'outline'}
                  size="sm"
                  className={`${sortBy === 'latest' ? 'bg-blue-600 text-white' : 'border-slate-600 text-slate-300'}`}
                  onClick={() => setSortBy('latest')}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Latest
                </Button>
                <Button 
                  variant={sortBy === 'stars' ? 'primary' : 'outline'}
                  size="sm"
                  className={`${sortBy === 'stars' ? 'bg-yellow-600 text-white' : 'border-slate-600 text-slate-300'}`}
                  onClick={() => setSortBy('stars')}
                >
                  <Star className="w-3 h-3 mr-1" />
                  Most Stars
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <Github className="w-8 h-8 text-slate-400" />
                    <Badge variant="secondary" className="bg-slate-700 text-slate-200">
                      {project.language}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{project.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      <span>{project.stars}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      <span>{project.forks}</span>
                    </div>
                    {project.trending_score && sortBy === 'trending' && (
                      <div className="flex items-center gap-1 text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>{project.trending_score}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Research Papers Section */}
          {researchPapers.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-400" />
                  Research Papers
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {researchPapers.map((paper) => (
                  <Card key={paper.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <FileText className="w-8 h-8 text-purple-400" />
                      <Badge variant="secondary" className="bg-purple-900/30 text-purple-400 border-purple-800">
                        Research
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{paper.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">
                      {paper.authors.join(', ')}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <span>{paper.citations} citations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{new Date(paper.published_date).getFullYear()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Datasets Section */}
          {datasets.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-orange-400" />
                  Datasets
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {datasets.map((dataset) => (
                  <Card key={dataset.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <Database className="w-8 h-8 text-orange-400" />
                      <Badge variant="secondary" className="bg-orange-900/30 text-orange-400 border-orange-800">
                        Dataset
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{dataset.title}</h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{dataset.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{dataset.downloads} downloads</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{dataset.size}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Back to Domain */}
          <div className="mt-12">
            <Link href={`/engineering/${domainData.slug}` as any}>
              <Button variant="outline" className="border-slate-600 text-slate-200">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to {domainData.name}
              </Button>
            </Link>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
}
