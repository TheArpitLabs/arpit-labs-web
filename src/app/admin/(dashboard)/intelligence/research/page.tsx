/**
 * Admin Dashboard for Research Intelligence Engine (E12)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function ResearchIntelligenceDashboard() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/intelligence/research?limit=20');
      const data = await response.json();
      setPapers(data.data || []);
    } catch (error) {
      console.error('Error fetching papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const indexPaper = async () => {
    try {
      const response = await fetch('/api/admin/intelligence/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'index_paper',
          external_id: 'arXiv:1234.5678',
          source: 'arxiv',
          title: 'Sample Paper'
        })
      });
      alert('Paper indexed successfully');
      fetchPapers();
    } catch (error) {
      console.error('Error indexing paper:', error);
      alert('Failed to index paper');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Research Intelligence Engine</h1>
          <p className="text-muted-foreground">Manage research papers and analysis</p>
        </div>
        <Button onClick={indexPaper}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Index Paper
        </Button>
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
            <CardTitle className="text-sm font-medium">Avg Citations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {papers.length > 0 ? (papers.reduce((acc, p) => acc + (p.citation_count || 0), 0) / papers.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {papers.filter(p => p.has_summary).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Research Papers</CardTitle>
          <CardDescription>Research papers from multiple sources</CardDescription>
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
                      <div className="text-sm text-muted-foreground">{paper.source} • {paper.year}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{paper.citation_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Citations</div>
                      </div>
                      <Badge variant={paper.processing_status === 'completed' ? 'success' : 'secondary'}>
                        {paper.processing_status}
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
