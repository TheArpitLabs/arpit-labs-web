"use client";

import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { AnimatedSection } from "@/components/animations/AnimatedSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Github, Trophy, Star, ArrowRight, MapPin, Link as LinkIcon, TrendingUp } from "lucide-react";
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

interface Contributor {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  bio: string;
  location: string;
  website: string;
  total_contributions: number;
  domain_rank: number;
  total_stars: number;
  total_forks: number;
  top_languages: string[];
  joined_date: string;
  expertise_areas: string[];
}

export default async function DomainContributorsPage({ params }: { params: Promise<{ domain: string }> }) {
  const resolvedParams = await params;
  const domainSlug = resolvedParams.domain;

  return (
    <DomainContributorsPageContent domainSlug={domainSlug} />
  );
}

function DomainContributorsPageContent({ domainSlug }: { domainSlug: string }) {
  const [domainData, setDomainData] = useState<DomainData | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rank' | 'contributions' | 'stars'>('rank');

  useEffect(() => {
    async function fetchContributors() {
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

        // Fetch contributors with domain rankings
        const { data: contributorsData, error: contributorsError } = await supabase
          .from('contributor_domain_rankings')
          .select(`
            rank_position,
            total_contributions,
            profiles!inner (
              id,
              name,
              username,
              avatar_url,
              bio,
              location,
              website,
              created_at
            ),
            contributor_stats (
              total_stars,
              total_forks,
              top_languages,
              expertise_areas
            )
          `)
          .eq('domain_id', domain.id)
          .order(sortBy === 'rank' ? 'rank_position' : sortBy === 'contributions' ? 'total_contributions' : 'total_stars', { 
            ascending: sortBy === 'rank' 
          })
          .limit(50);

        if (contributorsError) throw contributorsError;

        const transformedContributors: Contributor[] = (contributorsData || []).map((c: any) => ({
          id: c.profiles.id,
          name: c.profiles.name,
          username: c.profiles.username,
          avatar_url: c.profiles.avatar_url,
          bio: c.profiles.bio || '',
          location: c.profiles.location || '',
          website: c.profiles.website || '',
          total_contributions: c.total_contributions,
          domain_rank: c.rank_position,
          total_stars: c.contributor_stats?.total_stars || 0,
          total_forks: c.contributor_stats?.total_forks || 0,
          top_languages: c.contributor_stats?.top_languages || [],
          joined_date: c.profiles.created_at,
          expertise_areas: c.contributor_stats?.expertise_areas || []
        }));

        setContributors(transformedContributors);

      } catch (err) {
        console.error('Error fetching contributors:', err);
        setError('Failed to load contributors');
      } finally {
        setLoading(false);
      }
    }

    fetchContributors();
  }, [domainSlug, sortBy]);

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
            <h1 className="text-4xl font-bold text-white mb-4">Contributors Not Found</h1>
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
                <span className="text-white">Contributors</span>
              </div>

              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-5xl font-bold text-white mb-3">
                    {domainData.name} Contributors
                  </h1>
                  <p className="text-xl text-slate-300 max-w-2xl">
                    Discover the top contributors building the future of {domainData.name}. 
                    Explore their profiles, projects, and expertise.
                  </p>
                </div>
                <div className="text-4xl">{domainData.icon}</div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">{contributors.length}</p>
                  <p className="text-slate-400 text-sm">Active Contributors</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">
                    {contributors.reduce((sum, c) => sum + c.total_contributions, 0)}
                  </p>
                  <p className="text-slate-400 text-sm">Total Contributions</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-3xl font-bold text-white">
                    {contributors.reduce((sum, c) => sum + c.total_stars, 0)}
                  </p>
                  <p className="text-slate-400 text-sm">Total Stars Earned</p>
                </div>
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Button 
                  variant={sortBy === 'rank' ? 'primary' : 'outline'}
                  size="sm"
                  className={sortBy === 'rank' ? 'bg-yellow-600 text-white' : 'border-slate-600 text-slate-300'}
                  onClick={() => setSortBy('rank')}
                >
                  <Trophy className="w-3 h-3 mr-1" />
                  By Rank
                </Button>
                <Button 
                  variant={sortBy === 'contributions' ? 'primary' : 'outline'}
                  size="sm"
                  className={sortBy === 'contributions' ? 'bg-blue-600 text-white' : 'border-slate-600 text-slate-300'}
                  onClick={() => setSortBy('contributions')}
                >
                  <Github className="w-3 h-3 mr-1" />
                  By Contributions
                </Button>
                <Button 
                  variant={sortBy === 'stars' ? 'primary' : 'outline'}
                  size="sm"
                  className={sortBy === 'stars' ? 'bg-green-600 text-white' : 'border-slate-600 text-slate-300'}
                  onClick={() => setSortBy('stars')}
                >
                  <Star className="w-3 h-3 mr-1" />
                  By Stars
                </Button>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Top Contributors */}
          <AnimatedSection delay={0.2}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-400" />
                Top Contributors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contributors.slice(0, 3).map((contributor, index) => (
                  <Card key={contributor.id} className="p-6 bg-gradient-to-br from-yellow-900/20 to-slate-800/50 border-yellow-700/50 hover:border-yellow-500 transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-slate-700 overflow-hidden">
                          {contributor.avatar_url ? (
                            <img src={contributor.avatar_url} alt={contributor.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-8 h-8 text-slate-400 m-4" />
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{contributor.name}</h3>
                        <p className="text-slate-400 text-sm">@{contributor.username}</p>
                        {contributor.location && (
                          <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{contributor.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center">
                        <p className="text-white font-bold">#{contributor.domain_rank}</p>
                        <p className="text-slate-400 text-xs">Domain Rank</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold">{contributor.total_contributions}</p>
                        <p className="text-slate-400 text-xs">Contributions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold">{contributor.total_stars}</p>
                        <p className="text-slate-400 text-xs">Stars</p>
                      </div>
                    </div>

                    {contributor.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {contributor.expertise_areas.slice(0, 3).map((area) => (
                          <Badge key={area} variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/contributors/${contributor.username}` as any}>
                        <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-200">
                          View Profile
                        </Button>
                      </Link>
                      {contributor.website && (
                        <a href={contributor.website} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="border-slate-600 text-slate-400">
                            <LinkIcon className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          </AnimatedSection>

          {/* All Contributors */}
          <AnimatedSection delay={0.4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-400" />
                All Contributors
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {contributors.slice(3).map((contributor, index) => (
                  <Card key={contributor.id} className="p-6 bg-slate-800/50 border-slate-700 hover:border-slate-500 transition-all text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-700 mx-auto mb-4 overflow-hidden">
                      {contributor.avatar_url ? (
                        <img src={contributor.avatar_url} alt={contributor.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-slate-400 m-4" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{contributor.name}</h3>
                    <p className="text-slate-400 text-sm mb-3">@{contributor.username}</p>
                    <div className="flex items-center justify-center gap-4 text-sm mb-4">
                      <div className="text-center">
                        <p className="text-yellow-400 font-bold">#{contributor.domain_rank}</p>
                        <p className="text-slate-400 text-xs">Rank</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold">{contributor.total_contributions}</p>
                        <p className="text-slate-400 text-xs">Contributions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-white font-bold">{contributor.total_stars}</p>
                        <p className="text-slate-400 text-xs">Stars</p>
                      </div>
                    </div>
                    {contributor.top_languages.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1 mb-4">
                        {contributor.top_languages.slice(0, 2).map((lang) => (
                          <Badge key={lang} variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Link href={`/contributors/${contributor.username}` as any}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        View Profile <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </Card>
                ))}
              </div>
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
