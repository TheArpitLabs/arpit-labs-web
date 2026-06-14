/**
 * Admin Dashboard for Trend Intelligence Engine (E8)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function TrendIntelligenceDashboard() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/intelligence/trends?limit=20');
      const data = await response.json();
      setTrends(data.data || []);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    try {
      const response = await fetch('/api/admin/intelligence/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_analysis',
          analysis_type: 'technology'
        })
      });
      const data = await response.json();
      alert('Analysis triggered successfully');
      fetchTrends();
    } catch (error) {
      console.error('Error triggering analysis:', error);
      alert('Failed to trigger analysis');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trend Intelligence Engine</h1>
          <p className="text-muted-foreground">Monitor and manage technology trends</p>
        </div>
        <Button onClick={triggerAnalysis}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Trigger Analysis
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trends.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Trend Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.length > 0 ? (trends.reduce((acc, t) => acc + (t.trend_score || 0), 0) / trends.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upward Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.filter(t => t.direction === 'up').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emerging Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Technology Trends</CardTitle>
          <CardDescription>Technology usage trends across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {trends.map((trend: any) => (
                  <div key={trend.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{trend.name}</div>
                      <div className="text-sm text-muted-foreground">{trend.category}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{trend.trend_score?.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <Badge variant={trend.direction === 'up' ? 'success' : 'secondary'}>
                        {trend.direction}
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
