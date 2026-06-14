/**
 * Public Dashboard for Trend Intelligence Engine (E8)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PublicTrendDashboard() {
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/public/intelligence/trends?limit=20');
      const data = await response.json();
      setTrends(data.data || []);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Technology Trends</h1>
        <p className="text-muted-foreground">Explore the latest technology trends across the platform</p>
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
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(trends.map(t => t.category)).size}
            </div>
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
                        <div className="flex items-center gap-1">
                          {getTrendIcon(trend.direction)}
                          {trend.direction}
                        </div>
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
