/**
 * Public Dashboard for Autonomous Discovery Engine (E11)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Sparkles, CheckCircle } from 'lucide-react';

export default function PublicDiscoveryDashboard() {
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscoveries();
  }, []);

  const fetchDiscoveries = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/public/intelligence/discovery?limit=20');
      const data = await response.json();
      setDiscoveries(data.data || []);
    } catch (error) {
      console.error('Error fetching discoveries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discoveries</h1>
        <p className="text-muted-foreground">Explore autonomously discovered content from across the web</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Discoveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discoveries.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discoveries.length > 0 ? (discoveries.reduce((acc, d) => acc + (d.quality_score || 0), 0) / discoveries.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {discoveries.filter(d => d.published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(discoveries.map(d => d.source)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Discoveries</CardTitle>
          <CardDescription>Autonomously discovered content from external sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {discoveries.map((discovery: any) => (
                  <div key={discovery.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{discovery.title}</div>
                      <div className="text-sm text-muted-foreground">{discovery.source}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{discovery.quality_score?.toFixed(1)}</span>
                      </div>
                      {discovery.published && (
                        <Badge variant="success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Published
                        </Badge>
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
