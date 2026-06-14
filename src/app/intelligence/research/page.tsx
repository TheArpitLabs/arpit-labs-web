/**
 * Public Dashboard for Research Intelligence Engine (E12)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star, Quote } from 'lucide-react';

export default function PublicResearchDashboard() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/public/intelligence/research?limit=20');
      const data = await response.json();
      setPapers(data.data || []);
    } catch (error) {
      console.error('Error fetching research papers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Research Papers</h1>
        <p className="text-muted-foreground">Explore research papers indexed by the intelligence engine</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{papers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Impact Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {papers.length > 0 ? (papers.reduce((acc, p) => acc + (p.impact_score || 0), 0) / papers.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {papers.filter(p => p.impact_score > 80).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(papers.map(p => p.venue)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research Papers</CardTitle>
          <CardDescription>Research papers ranked by impact and relevance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {papers.map((paper: any) => (
                  <div key={paper.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{paper.title}</div>
                      <div className="text-sm text-muted-foreground">{paper.venue}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-bold">{paper.impact_score?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Quote className="h-4 w-4 text-blue-500" />
                        <span className="font-bold">{paper.citation_count}</span>
                      </div>
                      {paper.open_access && (
                        <Badge variant="success">Open Access</Badge>
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
