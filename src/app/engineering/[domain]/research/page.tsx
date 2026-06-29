"use client";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ExternalLink, TrendingUp, Star, ArrowRight, Calendar, Users, Quote, Search } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';

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

interface ResearchPaper {
  id: string;
  title: string;
  slug: string;
  abstract: string;
  authors: string[];
  published_date: string;
  citations: number;
  doi: string;
  pdf_url: string;
  venue: string;
  keywords: string[];
  subdomain_name?: string;
}

export default function DomainResearchPage({ params }: { params: Promise<{ domain: string }> }) {
  const [domainSlug, setDomainSlug] = useState<string>('');
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'citations' | 'latest' | 'title'>('citations');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchParams() {
      const resolvedParams = await params;
      setDomainSlug(resolvedParams.domain);
    }
    fetchParams();
  }, [params]);

  useEffect(() => {
    async function fetchResearchPapers() {
      if (!domainSlug) return;
      
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

        // Fetch research papers
        let query = supabase
          .from('research_papers')
          .select(`
            *,
            engineering_subdomains (name)
          `)
          .eq('domain_id', domain.id);

        // Apply sorting
        if (sortBy === 'citations') {
          query = query.order('citations', { ascending: false });
        } else if (sortBy === 'latest') {
          query = query.order('published_date', { ascending: false });
        } else {
          query = query.order('title', { ascending: true });
        }

        const { data: papersData, error: papersError } = await query.limit(100);

        if (papersError) throw papersError;

        const transformedPapers: ResearchPaper[] = (papersData || []).map((paper: any) => ({
          id: paper.id,
          title: paper.title,
          slug: paper.slug,
          abstract: paper.abstract || '',
          authors: paper.authors || [],
          published_date: paper.published_date,
          citations: paper.citations || 0,
          doi: paper.doi || '',
          pdf_url: paper.pdf_url || '',
          venue: paper.venue || '',
          keywords: paper.keywords || [],
          subdomain_name: paper.engineering_subdomains?.name
        }));

        setResearchPapers(transformedPapers);

      } catch (err) {
        logger.error('Error fetching research papers:', err);
        setError('Failed to load research papers');
      } finally {
        setLoading(false);
      }
    }

    fetchResearchPapers();
  }, [domainSlug, sortBy]);

  // Filter papers based on search query
  const filteredPapers = researchPapers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase())) ||
    paper.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Container>
          <div className="py-20">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <h1 className="text-4xl font-bold text-white mb-4">Research Papers Not Found</h1>
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
                <span className="text-white">Research</span>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold text-white mb-3">
                    {domainData.name} Research
                  </h1>
                  <p className="text-xl text-slate-300 max-w-2xl">
                    Explore cutting-edge research papers and publications in {domainData.name}. 
                    Stay updated with the latest scientific discoveries and innovations.
                  </p>
                </div>
                <div className="text-4xl">{domainData.icon}</div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">{researchPapers.length}</p>
                  <p className="text-slate-400 text-sm">Research Papers</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">
                    {researchPapers.reduce((sum, p) => sum + p.citations, 0)}
                  </p>
                  <p className="text-slate-400 text-sm">Total Citations</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">
                    {new Set(researchPapers.flatMap(p => p.authors)).size}
                  </p>
                  <p className="text-slate-400 text-sm">Unique Authors</p>
                </div>
              </div>

              {/* Search and Sort Controls */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search papers, authors, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-slate-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={sortBy === 'citations' ? 'primary' : 'outline'}
                    size="sm"
                    className={sortBy === 'citations' ? 'bg-yellow-600 text-white' : 'border-slate-600 text-slate-300'}
                    onClick={() => setSortBy('citations')}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Most Cited
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
                    variant={sortBy === 'title' ? 'primary' : 'outline'}
                    size="sm"
                    className={sortBy === 'title' ? 'bg-green-600 text-white' : 'border-slate-600 text-slate-300'}
                    onClick={() => setSortBy('title')}
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    A-Z
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Research Papers Grid */}
          <AnimatedSection delay={0.2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {filteredPapers.length === 0 ? (
                <Card className="p-12 bg-slate-800/30 border-slate-700 text-center">
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No Research Papers Found</h3>
                  <p className="text-slate-400">
                    {searchQuery ? 'Try adjusting your search query' : 'No research papers available for this domain yet'}
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPapers.map((paper, index) => (
                    <Card key={paper.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{paper.title}</h3>
                          <p className="text-slate-400 text-sm mb-3 line-clamp-3">{paper.abstract}</p>
                        </div>
                        <Badge variant="secondary" className="bg-purple-900/30 text-purple-400 border-purple-800 ml-4">
                          Research
                        </Badge>
                      </div>

                      {/* Authors */}
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                        <Users className="w-4 h-4" />
                        <span className="line-clamp-1">{paper.authors.join(', ')}</span>
                      </div>

                      {/* Venue and Date */}
                      <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                        {paper.venue && (
                          <div className="flex items-center gap-1">
                            <Quote className="w-4 h-4" />
                            <span>{paper.venue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(paper.published_date).getFullYear()}</span>
                        </div>
                      </div>

                      {/* Keywords */}
                      {paper.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {paper.keywords.slice(0, 3).map((keyword) => (
                            <Badge key={keyword} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stats and Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>{paper.citations} citations</span>
                          </div>
                          {paper.subdomain_name && (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
                              {paper.subdomain_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {paper.pdf_url && (
                            <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                <FileText className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          {paper.doi && (
                            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </a>
                          )}
                          <Link href={`/research/${paper.slug}` as any}>
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
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
