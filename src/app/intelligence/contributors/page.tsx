/**
 * Public Dashboard for Contributor Intelligence Engine (E9)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Star, GitFork } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function PublicContributorDashboard() {
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributors();
  }, []);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/public/intelligence/contributors?limit=20');
      const data = await response.json();
      setContributors(data.data || []);
    } catch (error) {
      logger.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Top Contributors</h1>
        <p className="text-muted-foreground">Explore the most active contributors on the platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Expertise Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contributors.length > 0 ? (contributors.reduce((acc, c) => acc + (c.expertise_score || 0), 0) / contributors.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified Experts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contributors.filter(c => c.verified_expert).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(contributors.flatMap(c => c.domains || [])).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contributor Profiles</CardTitle>
          <CardDescription>Top contributors ranked by expertise and activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {contributors.map((contributor: any) => (
                  <div key={contributor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{contributor.name}</div>
                      <div className="text-sm text-muted-foreground">{contributor.primary_domain}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{contributor.expertise_score?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <GitFork className="h-4 w-4 text-blue-500" />
                        <span className="font-bold">{contributor.contribution_count}</span>
                      </div>
                      {contributor.verified_expert && (
                        <Badge variant="success">Verified</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
