/**
 * Admin Dashboard for Collaboration Marketplace (E10)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function CollaborationMarketplaceDashboard() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/intelligence/collaboration?limit=20');
      const data = await response.json();
      setOpportunities(data.data || []);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOpportunity = async () => {
    try {
      const response = await fetch('/api/admin/intelligence/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_opportunity',
          title: 'New Collaboration Opportunity',
          type: 'team_formation',
          domain: 'artificial-intelligence'
        })
      });
      alert('Opportunity created successfully');
      fetchOpportunities();
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert('Failed to create opportunity');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collaboration Marketplace</h1>
          <p className="text-muted-foreground">Manage collaboration opportunities</p>
        </div>
        <Button onClick={createOpportunity}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Create Opportunity
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opportunities.filter(o => o.status === 'open').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opportunities.reduce((acc, o) => acc + (o.applications_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {opportunities.filter(o => o.matched_at).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collaboration Opportunities</CardTitle>
          <CardDescription>Team formation, mentor discovery, and collaboration opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {opportunities.map((opp: any) => (
                  <div key={opp.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{opp.title}</div>
                      <div className="text-sm text-muted-foreground">{opp.type} • {opp.domain}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{opp.applications_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Applications</div>
                      </div>
                      <Badge variant={opp.status === 'open' ? 'success' : 'secondary'}>
                        {opp.status}
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
