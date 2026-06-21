"use client";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, ExternalLink, TrendingUp, FileText, Database, GraduationCap, Trophy, Users, ArrowRight, Sparkles, Star, Eye, Download } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface DomainData {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  total_projects: number;
  total_research_papers: number;
  total_datasets: number;
  total_contributors: number;
}

interface Subdomain {
  id: string;
  name: string;
  slug: string;
  description: string;
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

interface LearningResource {
  id: string;
  title: string;
  slug: string;
  type: string;
  difficulty: string;
  rating: number;
}

interface Contributor {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  contributions: number;
  domain_rank?: number;
}

export default function DomainLandingPageContent({ domainSlug }: { domainSlug: string }) {
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [trendingProjects, setTrendingProjects] = useState<Project[]>([]);
  const [latestProjects, setLatestProjects] = useState<Project[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDomainData() {
      try {
        setLoading(true);

        // Fetch domain details
        const { data: domain, error: domainError } = await supabase
          .from('engineering_domains')
          .select('*')
          .eq('slug', domainSlug)
          .single();

        if (domainError) throw domainError;
        
        // Fetch subdomains
        const { data: subdomainsData, error: subdomainsError } = await supabase
          .from('engineering_subdomains')
          .select('*')
          .eq('domain_id', domain.id)
          .order('name');

        if (subdomainsError) throw subdomainsError;
        setSubdomains(subdomainsData || []);

        logger.debug('Domain landing page', { slug: domainSlug, domainId: domain.id, domainName: domain.name });

        // Fetch projects using projects.category → category_domain_mapping.category → engineering_domains.slug
        const { data: categoryMappings, error: categoryError } = await supabase
          .from('category_domain_mapping')
          .select('category')
          .eq('domain_id', domain.id);

        if (categoryError) {
          logger.error('Category mappings error', { error: categoryError });
        }
        logger.debug('Category mappings fetched', { count: categoryMappings?.length || 0 });

        if (categoryError) throw categoryError;

        const categories = (categoryMappings || []).map((m: any) => m.category);
        logger.debug('Categories extracted', { categories, count: categories.length });

        // Fetch projects filtered by category
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, slug, description, stars, forks, language, trending_score, created_at, featured, github_stars, category')
          .eq('status', 'published')
          .in('category', categories.length > 0 ? categories : [''])
          .order('github_stars', { ascending: false })
          .limit(50);

        if (projectsError) {
          logger.error('Projects fetch error', { error: projectsError });
        }
        logger.debug('Projects fetched', { count: projectsData?.length || 0 });

        if (projectsError) throw projectsError;

        // Process and categorize projects
        const projects: Project[] = [];
        const trending: Project[] = [];
        const latest: Project[] = [];

        for (const projectData of (projectsData || [])) {
          const project = {
            id: projectData.id,
            title: projectData.title,
            slug: projectData.slug,
            description: projectData.description,
            stars: projectData.github_stars || projectData.stars || 0,
            forks: projectData.forks || 0,
            language: projectData.language || 'Unknown',
            trending_score: projectData.trending_score
          };

          if (projectData.featured && projects.length < 6) {
            projects.push(project);
          }
          if (projectData.trending_score && trending.length < 6) {
            trending.push(project);
          }
          if (latest.length < 6) {
            latest.push(project);
          }
        }

        setFeaturedProjects(projects);
        setTrendingProjects(trending.sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0)));
        setLatestProjects(latest.sort((a, b) => b.stars - a.stars));

        // Calculate dynamic counts
        const totalProjects = (projectsData || []).length;
        
        // Update domain data with dynamic counts
        setDomainData({
          ...domain,
          total_projects: totalProjects,
          total_research_papers: 0, // Research papers feature not yet implemented
          total_datasets: 0, // Datasets feature not yet implemented
          total_contributors: 0 // Contributors feature not yet implemented
        });

        setResearchPapers([]);
        setDatasets([]);
        setLearningResources([]);
        setTopContributors([]);

      } catch (err) {
        console.error('Error fetching domain data:', err);
        setError('Failed to load domain data');
      } finally {
        setLoading(false);
      }
    }

    fetchDomainData();
  }, [domainSlug]);

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

  if (error || !domainData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Container>
          <div className="py-20 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Domain Not Found</h1>
            <p className="text-red-400">{error || 'Domain not found'}</p>
            <Link href="/engineering">
              <Button className="mt-6">Back to Engineering Domains</Button>
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
          {/* Domain Header */}
          <AnimatedSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div 
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl"
                    style={{ backgroundColor: `${domainData.color}20` }}
                  >
                    {domainData.icon}
                  </div>
                  <div>
                    <h1 className="text-5xl font-bold text-white mb-3">
                      {domainData.name}
                    </h1>
                    <p className="text-xl text-slate-300 max-w-2xl">
                      {domainData.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Domain Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Github className="w-4 h-4" />
                    <span>Projects</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{domainData.total_projects}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    <span>Research Papers</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{domainData.total_research_papers}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Database className="w-4 h-4" />
                    <span>Datasets</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{domainData.total_datasets}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Users className="w-4 h-4" />
                    <span>Contributors</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{domainData.total_contributors}</p>
                </div>
              </div>

              {/* Subdomains */}
              <div className="flex flex-wrap gap-3">
                {subdomains.map((subdomain) => (
                  <Link key={subdomain.id} href={`/engineering/${domainData.slug}/${subdomain.slug}` as any}>
                    <Badge 
                      variant="outline" 
                      className="border-slate-600 text-slate-200 hover:border-slate-400 hover:text-white transition-colors cursor-pointer px-4 py-2"
                    >
                      {subdomain.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Featured Projects Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-400" />
                  Featured Projects
                </h2>
                <Link href={`/engineering/${domainData.slug}/projects?sort=featured` as any}>
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProjects.map((project) => (
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
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Trending Projects Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  Trending Projects
                </h2>
                <Link href={`/engineering/${domainData.slug}/projects?sort=trending` as any}>
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingProjects.map((project) => (
                  <Card key={project.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <Github className="w-8 h-8 text-slate-400" />
                      <Badge variant="secondary" className="bg-green-900/30 text-green-400 border-green-800">
                        Trending
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{project.title}</h3>
                    <p className="text-slate-400 text-sm mb-4 line-clamp-2">{project.description}</p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        <span>{project.stars}</span>
                      </div>
                      {project.trending_score && (
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

            {/* Latest Projects Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  Latest Projects
                </h2>
                <Link href={`/engineering/${domainData.slug}/projects?sort=latest` as any}>
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestProjects.map((project) => (
                  <Card key={project.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <Github className="w-8 h-8 text-slate-400" />
                      <Badge variant="secondary" className="bg-blue-900/30 text-blue-400 border-blue-800">
                        New
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
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Research Papers Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-400" />
                  Research Papers
                </h2>
                <Link href={`/engineering/${domainData.slug}/research` as any}>
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
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
                        <Eye className="w-4 h-4" />
                        <span>{paper.citations} citations</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{new Date(paper.published_date).getFullYear()}</span>
                      </div>
                    </div>
                    <Link href={`/research/${paper.slug}`}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mt-4">
                        View Paper <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>

            {/* Datasets Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Database className="w-6 h-6 text-orange-400" />
                  Datasets
                </h2>
                <Link href={`/engineering/${domainData.slug}/datasets` as any}>
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
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
                    <Link href={`/datasets/${dataset.slug}` as any}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mt-4">
                        View Dataset <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>

            {/* Learning Resources Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-cyan-400" />
                  Learning Resources
                </h2>
                <Link href={`/engineering/${domainData.slug}/learning` as any}>
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {learningResources.map((resource) => (
                  <Card key={resource.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <GraduationCap className="w-8 h-8 text-cyan-400" />
                      <Badge variant="secondary" className="bg-cyan-900/30 text-cyan-400 border-cyan-800">
                        {resource.type}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{resource.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {resource.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{resource.rating}</span>
                      </div>
                    </div>
                    <Link href={`/learning/${resource.slug}` as any}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        Start Learning <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>

            {/* Contributors Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6 text-pink-400" />
                  Top Contributors
                </h2>
                <Link href={`/engineering/${domainData.slug}/contributors` as any}>
                  <Button variant="ghost" className="text-slate-400 hover:text-white">
                    View All <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {topContributors.map((contributor) => (
                  <Card key={contributor.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700 mx-auto mb-4 flex items-center justify-center overflow-hidden">
                      {contributor.avatar_url ? (
                        <Image 
                          src={contributor.avatar_url} 
                          alt={contributor.name} 
                          width={64}
                          height={64}
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Users className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{contributor.name}</h3>
                    <p className="text-slate-400 text-sm mb-3">@{contributor.username}</p>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-white font-bold">{contributor.contributions}</p>
                        <p className="text-slate-400 text-xs">Contributions</p>
                      </div>
                      {contributor.domain_rank && (
                        <div className="text-center">
                          <p className="text-yellow-400 font-bold">#{contributor.domain_rank}</p>
                          <p className="text-slate-400 text-xs">Rank</p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Quick Links */}
            <section>
              <Card className="p-8 bg-slate-800/30 border-slate-700">
                <h2 className="text-2xl font-bold text-white mb-6">Explore More</h2>
                <div className="flex flex-wrap gap-4">
                  <Link href={`/engineering/${domainData.slug}/contributors` as any}>
                    <Button variant="outline" className="border-slate-600 text-slate-200">
                      <Users className="w-4 h-4 mr-2" />
                      Contributors
                    </Button>
                  </Link>
                  <Link href={`/engineering/${domainData.slug}/research` as any}>
                    <Button variant="outline" className="border-slate-600 text-slate-200">
                      <FileText className="w-4 h-4 mr-2" />
                      Research Papers
                    </Button>
                  </Link>
                  <Link href={`/engineering/${domainData.slug}/datasets` as any}>
                    <Button variant="outline" className="border-slate-600 text-slate-200">
                      <Database className="w-4 h-4 mr-2" />
                      Datasets
                    </Button>
                  </Link>
                  <Link href={`/engineering/${domainData.slug}/learning` as any}>
                    <Button variant="outline" className="border-slate-600 text-slate-200">
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Learning Resources
                    </Button>
                  </Link>
                </div>
              </Card>
            </section>
          </div>
        </div>
      </Container>
      <Footer />
    </div>
  );
}
