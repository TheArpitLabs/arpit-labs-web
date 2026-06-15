"use client";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Github, ExternalLink, TrendingUp, FileText, Database, GraduationCap, Trophy, Users, ArrowRight, Sparkles, Search, Filter } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Domain {
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
  total_content: number;
}

interface Subdomain {
  id: string;
  name: string;
  slug: string;
  description: string;
}

export default function EngineeringPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchDomains() {
      try {
        setLoading(true);
        
        // Fetch engineering domains
        const { data: domainsData, error: domainsError } = await supabase
          .from('engineering_domains')
          .select('*')
          .order('name');

        if (domainsError) throw domainsError;

        // Fetch category mappings for all domains
        const { data: categoryMappings, error: categoryError } = await supabase
          .from('category_domain_mapping')
          .select('domain_id, category');

        if (categoryError) throw categoryError;

        // Fetch all published projects with category
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, category')
          .eq('status', 'published');

        if (projectsError) throw projectsError;

        // Calculate live project counts for each domain
        const domainCounts = new Map<string, number>();
        
        (domainsData || []).forEach((domain: any) => {
          domainCounts.set(domain.id, 0);
        });

        // Group projects by category
        const projectsByCategory = new Map<string, number>();
        (projectsData || []).forEach((project: any) => {
          if (project.category) {
            projectsByCategory.set(project.category, (projectsByCategory.get(project.category) || 0) + 1);
          }
        });

        // Map categories to domains and sum counts
        (categoryMappings || []).forEach((mapping: any) => {
          const categoryCount = projectsByCategory.get(mapping.category) || 0;
          const currentCount = domainCounts.get(mapping.domain_id) || 0;
          domainCounts.set(mapping.domain_id, currentCount + categoryCount);
        });

        // Transform data to match Domain interface with live counts
        const transformedDomains: Domain[] = (domainsData || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          slug: d.slug,
          description: d.description,
          icon: d.icon,
          color: d.color,
          total_projects: domainCounts.get(d.id) || 0,
          total_research_papers: 0, // TODO: Implement when research papers are ready
          total_datasets: 0, // TODO: Implement when datasets are ready
          total_contributors: 0, // TODO: Implement when contributors are ready
          total_content: domainCounts.get(d.id) || 0,
        }));

        setDomains(transformedDomains);
        setFilteredDomains(transformedDomains);
      } catch (err) {
        console.error('Error fetching domains:', err);
        setError('Failed to load engineering domains');
      } finally {
        setLoading(false);
      }
    }

    fetchDomains();
  }, []);

  // Filter domains based on search and filter selection
  useEffect(() => {
    let filtered = domains;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(domain => 
        domain.name.toLowerCase().includes(query) ||
        domain.description.toLowerCase().includes(query) ||
        domain.slug.toLowerCase().includes(query)
      );
    }

    // Apply content type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(domain => {
        switch (selectedFilter) {
          case 'projects':
            return domain.total_projects > 0;
          case 'research':
            return domain.total_research_papers > 0;
          case 'datasets':
            return domain.total_datasets > 0;
          case 'contributors':
            return domain.total_contributors > 0;
          default:
            return true;
        }
      });
    }

    setFilteredDomains(filtered);
  }, [searchQuery, selectedFilter, domains]);

  const domainIcons: Record<string, any> = {
    'AI & Machine Learning': Sparkles,
    'Cybersecurity': TrendingUp,
    'IoT & Embedded Systems': Database,
    'Robotics': ExternalLink,
    'Software Development': Github,
    'Data Science': FileText,
  };

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Container>
          <div className="py-20 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Engineering Domains</h1>
            <p className="text-red-400">{error}</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Container>
        <div className="py-20">
          {/* Header */}
          <AnimatedSection>
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                  Engineering Domains
                </h1>
                <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                  Explore our comprehensive engineering ecosystem organized into specialized domains. 
                  Discover projects, research, datasets, and contributors across cutting-edge technologies.
                </p>
              </motion.div>

              {/* Search and Filter */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 flex flex-col md:flex-row gap-4 items-center justify-center"
              >
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search domains..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    variant={selectedFilter === 'all' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('all')}
                    className={selectedFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:text-white'}
                  >
                    All
                  </Button>
                  <Button
                    variant={selectedFilter === 'projects' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('projects')}
                    className={selectedFilter === 'projects' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:text-white'}
                  >
                    Projects
                  </Button>
                  <Button
                    variant={selectedFilter === 'research' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('research')}
                    className={selectedFilter === 'research' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:text-white'}
                  >
                    Research
                  </Button>
                  <Button
                    variant={selectedFilter === 'datasets' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('datasets')}
                    className={selectedFilter === 'datasets' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:text-white'}
                  >
                    Datasets
                  </Button>
                  <Button
                    variant={selectedFilter === 'contributors' ? 'primary' : 'outline'}
                    onClick={() => setSelectedFilter('contributors')}
                    className={selectedFilter === 'contributors' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-600 text-slate-300 hover:text-white'}
                  >
                    Contributors
                  </Button>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>

          {/* Domain Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDomains.map((domain, index) => {
              const IconComponent = domainIcons[domain.name] || Sparkles;
              
              return (
                <AnimatedSection key={domain.id} delay={index * 0.1}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link href={`/engineering/${domain.slug}` as any}>
                      <Card className="h-full p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50 group cursor-pointer">
                        {/* Domain Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                            style={{ backgroundColor: `${domain.color}20` }}
                          >
                            {domain.icon}
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="bg-slate-700 text-slate-200"
                          >
                            {domain.total_content || domain.total_projects + domain.total_research_papers + domain.total_datasets} items
                          </Badge>
                        </div>

                        {/* Domain Name */}
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                          {domain.name}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                          {domain.description}
                        </p>

                        {/* Statistics */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Github className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 text-sm">
                              {domain.total_projects} Projects
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 text-sm">
                              {domain.total_research_papers} Papers
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Database className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 text-sm">
                              {domain.total_datasets} Datasets
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-300 text-sm">
                              {domain.total_contributors} Contributors
                            </span>
                          </div>
                        </div>

                        {/* Explore Button */}
                        <div className="flex items-center text-blue-400 text-sm font-medium group-hover:gap-2 transition-all">
                          Explore Domain
                          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                </AnimatedSection>
              );
            })}
          </div>

          {/* Domain Statistics */}
          <AnimatedSection delay={0.8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-20"
            >
              <Card className="p-8 bg-slate-800/30 border-slate-700">
                <h2 className="text-3xl font-bold text-white mb-6">Domain Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Total Domains</p>
                    <p className="text-3xl font-bold text-white">{domains.length}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-white">{domains.reduce((sum, d) => sum + d.total_projects, 0)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Research Papers</p>
                    <p className="text-3xl font-bold text-white">{domains.reduce((sum, d) => sum + d.total_research_papers, 0)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-400 text-sm mb-1">Datasets</p>
                    <p className="text-3xl font-bold text-white">{domains.reduce((sum, d) => sum + d.total_datasets, 0)}</p>
                  </div>
                </div>
                <div className="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>Total Content:</strong> {domains.reduce((sum, d) => sum + d.total_content, 0)}+ items across all engineering domains
                  </p>
                </div>
              </Card>
            </motion.div>
          </AnimatedSection>
        </div>
      </Container>
      <Footer />
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
