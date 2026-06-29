/**
 * Admin Dashboard for Dataset Intelligence Engine (E13)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function DatasetIntelligenceDashboard() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/intelligence/datasets?limit=20');
      const data = await response.json();
      setDatasets(data.data || []);
    } catch (error) {
      logger.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const indexDataset = async () => {
    try {
      const external_id = prompt('Enter external ID (e.g., kaggle-12345):');
      const source = prompt('Enter source (e.g., kaggle):');
      const name = prompt('Enter dataset name:');
      
      if (!external_id || !source || !name) {
        alert('All fields are required');
        return;
      }

      const response = await fetch('/api/admin/intelligence/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'index_dataset',
          external_id,
          source,
          name
        })
      });
      alert('Dataset indexed successfully');
      fetchDatasets();
    } catch (error) {
      logger.error('Error indexing dataset:', error);
      alert('Failed to index dataset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dataset Intelligence Engine</h1>
          <p className="text-muted-foreground">Manage datasets and quality assessment</p>
        </div>
        <Button onClick={indexDataset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Index Dataset
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{datasets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {datasets.length > 0 ? (datasets.reduce((acc, d) => acc + (d.overall_quality_score || 0), 0) / datasets.length).toFixed(1) : '0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {datasets.filter(d => (d.overall_quality_score || 0) >= 75).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datasets</CardTitle>
          <CardDescription>Datasets from multiple sources with quality assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <div className="space-y-2">
                {datasets.map((dataset: any) => (
                  <div key={dataset.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{dataset.name}</div>
                      <div className="text-sm text-muted-foreground">{dataset.domain} • {dataset.source}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{dataset.overall_quality_score?.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Quality</div>
                      </div>
                      <Badge variant={dataset.processing_status === 'completed' ? 'success' : 'secondary'}>
                        {dataset.processing_status}
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
