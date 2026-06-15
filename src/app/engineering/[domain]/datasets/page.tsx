"use client";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, Download, ExternalLink, TrendingUp, Star, ArrowRight, Calendar, HardDrive, Tag, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface DomainData {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Dataset {
  id: string;
  title: string;
  slug: string;
  description: string;
  downloads: number;
  size: string;
  format: string;
  license: string;
  created_at: string;
  updated_at: string;
  author: string;
  tags: string[];
  subdomain_name?: string;
}

export default async function DomainDatasetsPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = await params;
  const domainSlug = resolvedParams.domain;

  return (
    <DomainDatasetsPageContent domainSlug={domainSlug} />
  );
}

function DomainDatasetsPageContent({ domainSlug }: { domainSlug: string }) {
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'downloads' | 'latest' | 'size'>('downloads');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchDatasets() {
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

        // Fetch datasets
        let query = supabase
          .from('datasets')
          .select(`
            *,
            engineering_subdomains (name)
          `)
          .eq('domain_id', domain.id);

        // Apply sorting
        if (sortBy === 'downloads') {
          query = query.order('downloads', { ascending: false });
        } else if (sortBy === 'latest') {
          query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('size', { ascending: false });
        }

        const { data: datasetsData, error: datasetsError } = await query.limit(100);

        if (datasetsError) throw datasetsError;

        const transformedDatasets: Dataset[] = (datasetsData || []).map((dataset: any) => ({
          id: dataset.id,
          title: dataset.title,
          slug: dataset.slug,
          description: dataset.description || '',
          downloads: dataset.downloads || 0,
          size: dataset.size || 'Unknown',
          format: dataset.format || 'Unknown',
          license: dataset.license || 'Unknown',
          created_at: dataset.created_at,
          updated_at: dataset.updated_at,
          author: dataset.author || 'Unknown',
          tags: dataset.tags || [],
          subdomain_name: dataset.engineering_subdomains?.name
        }));

        setDatasets(transformedDatasets);

      } catch (err) {
        console.error('Error fetching datasets:', err);
        setError('Failed to load datasets');
      } finally {
        setLoading(false);
      }
    }

    fetchDatasets();
  }, [domainSlug, sortBy]);

  // Filter datasets based on search query
  const filteredDatasets = datasets.filter(dataset =>
    dataset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dataset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <h1 className="text-4xl font-bold text-white mb-4">Datasets Not Found</h1>
            <p className="text-red-400">{error || 'Domain not found'}</p>
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
          {/* Header */}
          <AnimatedSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Link href="/engineering" className="hover:text-white transition-colors">
                  Engineering
                </Link>
                <span>/</span>
                <Link href={`/engineering/${domainData.slug}`} className="hover:text-white transition-colors">
                  {domainData.name}
                </Link>
                <span>/</span>
                <span className="text-white">Datasets</span>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold text-white mb-3">
                    {domainData.name} Datasets
                  </h1>
                  <p className="text-xl text-slate-300 max-w-2xl">
                    Explore high-quality datasets for machine learning, research, and development in {domainData.name}. 
                    Download and use these datasets to power your projects.
                  </p>
                </div>
                <div className="text-4xl">{domainData.icon}</div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">{datasets.length}</p>
                  <p className="text-slate-400 text-sm">Datasets</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">
                    {datasets.reduce((sum, d) => sum + d.downloads, 0)}
                  </p>
                  <p className="text-slate-400 text-sm">Total Downloads</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">
                    {new Set(datasets.flatMap(d => d.tags)).size}
                  </p>
                  <p className="text-slate-400 text-sm">Unique Tags</p>
                </div>
              </div>

              {/* Search and Sort Controls */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search datasets by title, description, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={sortBy === 'downloads' ? 'primary' : 'outline'}
                    size="sm"
                    className={sortBy === 'downloads' ? 'bg-yellow-600 text-white' : 'border-slate-600 text-slate-300'}
                    onClick={() => setSortBy('downloads')}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Most Downloaded
                  </Button>
                  <Button 
                    variant={sortBy === 'latest' ? 'primary' : 'outline'}
                    size="sm"
                    className={sortBy === 'latest' ? 'bg-blue-600 text-white' : 'border-slate-600 text-slate-300'}
                    onClick={() => setSortBy('latest')}
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Latest
                  </Button>
                  <Button 
                    variant={sortBy === 'size' ? 'primary' : 'outline'}
                    size="sm"
                    className={sortBy === 'size' ? 'bg-green-600 text-white' : 'border-slate-600 text-slate-300'}
                    onClick={() => setSortBy('size')}
                  >
                    <HardDrive className="w-3 h-3 mr-1" />
                    By Size
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Datasets Grid */}
          <AnimatedSection delay={0.2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {filteredDatasets.length === 0 ? (
                <Card className="p-12 bg-slate-800/30 border-slate-700 text-center">
                  <Database className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Datasets Found</h3>
                  <p className="text-slate-400">
                    {searchQuery ? 'Try adjusting your search query' : 'No datasets available for this domain yet'}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredDatasets.map((dataset, index) => (
                    <Card key={dataset.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{dataset.title}</h3>
                          <p className="text-slate-400 text-sm mb-3 line-clamp-3">{dataset.description}</p>
                        </div>
                        <Badge variant="secondary" className="bg-orange-900/30 text-orange-400 border-orange-800 ml-4">
                          Dataset
                        </Badge>
                      </div>

                      {/* Author and License */}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span>{dataset.author}</span>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                          {dataset.license}
                        </Badge>
                      </div>

                      {/* Format and Size */}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        <div className="flex items-center gap-1">
                          <Database className="w-4 h-4" />
                          <span>{dataset.format}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-4 h-4" />
                          <span>{dataset.size}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      {dataset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {dataset.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            <span>{dataset.downloads}</span>
                          </div>
                          {dataset.subdomain_name && (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
                              {dataset.subdomain_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <a href={`/datasets/${dataset.slug}`}>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <Database className="w-4 h-4" />
                            </Button>
                          </a>
                          <a href={`/datasets/${dataset.slug}`}>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatedSection>

          {/* Back to Domain */}
          <div className="mt-12">
            <Link href={`/engineering/${domainData.slug}`}>
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
