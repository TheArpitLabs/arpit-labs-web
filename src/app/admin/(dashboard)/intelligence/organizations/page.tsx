/**
 * Admin Dashboard for Organization Intelligence Engine (E14)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function OrganizationIntelligenceDashboard() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/intelligence/organizations?limit=20');
      const data = await response.json();
      setOrganizations(data.data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const indexOrganization = async () => {
    try {
      const response = await fetch('/api/admin/intelligence/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'index_organization',
          external_id: 'crunchbase-12345',
          source: 'crunchbase',
          name: 'Sample Organization'
        })
      });
      alert('Organization indexed successfully');
      fetchOrganizations();
    } catch (error) {
      console.error('Error indexing organization:', error);
      alert('Failed to index organization');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organization Intelligence Engine</h1>
          <p className="text-muted-foreground">Manage organization profiles and rankings</p>
        </div>
        <Button onClick={indexOrganization}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Index Organization
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.length > 0 ? (organizations.reduce((acc, o) => acc + (o.overall_score || 0), 0) / organizations.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(o => o.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>Organization profiles with intelligence scores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {organizations.map((org: any) => (
                  <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{org.name}</div>
                      <div className="text-sm text-muted-foreground">{org.organization_type} • {org.industry}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{org.overall_score?.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <Badge variant={org.status === 'active' ? 'success' : 'secondary'}>
                        {org.status}
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
