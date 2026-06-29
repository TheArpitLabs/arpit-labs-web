/**
 * Public Dashboard for Research Intelligence Engine (E12)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star, Quote } from 'lucide-react';
import { logger } from '@/lib/logger';

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
      logger.error('Error fetching research papers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Research Papers</h1>
        <p className="text-muted">Explore research papers indexed by the intelligence engine</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-medium text-foreground">Total Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-foreground">{papers.length}</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-medium text-foreground">Avg Impact Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-foreground">
              {papers.length > 0 ? (papers.reduce((acc, p) => acc + (p.impact_score || 0), 0) / papers.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-medium text-foreground">High Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-foreground">
              {papers.filter(p => p.impact_score > 80).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-heading font-medium text-foreground">Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-heading font-bold text-foreground">
              {new Set(papers.map(p => p.venue)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="font-heading text-foreground">Research Papers</CardTitle>
          <CardDescription className="text-muted">Research papers ranked by impact and relevance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted">Loading...</div>
            ) : (
              <div className="space-y-2">
                {papers.map((paper: any) => (
                  <div key={paper.id} className="flex items-center justify-between p-4 border border-border rounded-xl bg-surface-elevated hover:border-primary transition-colors">
                    <div className="flex-1">
                      <div className="font-heading font-semibold text-foreground">{paper.title}</div>
                      <div className="text-sm text-muted">{paper.venue}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="font-heading font-bold text-foreground">{paper.impact_score?.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Quote className="h-4 w-4 text-primary" />
                        <span className="font-heading font-bold text-foreground">{paper.citation_count}</span>
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
