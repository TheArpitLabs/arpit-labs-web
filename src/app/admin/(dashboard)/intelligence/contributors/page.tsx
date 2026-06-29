/**
 * Admin Dashboard for Contributor Intelligence Engine (E9)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function ContributorIntelligenceDashboard() {
  const [contributors, setContributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContributors();
  }, []);

  const fetchContributors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/intelligence/contributors?limit=20');
      const data = await response.json();
      setContributors(data.data || []);
    } catch (error) {
      logger.error('Error fetching contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async () => {
    try {
      const response = await fetch('/api/admin/intelligence/contributors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_profile',
          platform: 'github'
        })
      });
      alert('Sync triggered successfully');
      fetchContributors();
    } catch (error) {
      logger.error('Error triggering sync:', error);
      alert('Failed to trigger sync');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contributor Intelligence Engine</h1>
          <p className="text-muted-foreground">Manage unified contributor profiles</p>
        </div>
        <Button onClick={triggerSync}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Profiles
        </Button>
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
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contributors.length > 0 ? (contributors.reduce((acc, c) => acc + (c.contributor_score || 0), 0) / contributors.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Contributors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contributors.filter(c => c.activity_level === 'high' || c.activity_level === 'very_high').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contributor Profiles</CardTitle>
          <CardDescription>Unified contributor profiles from multiple platforms</CardDescription>
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
                      <div className="font-semibold">{contributor.display_name}</div>
                      <div className="text-sm text-muted-foreground">{contributor.primary_domains?.join(', ')}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{contributor.contributor_score?.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <Badge variant={contributor.activity_level === 'high' || contributor.activity_level === 'very_high' ? 'success' : 'secondary'}>
                        {contributor.activity_level}
                      </Badge>
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
