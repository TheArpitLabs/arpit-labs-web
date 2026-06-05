'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface RefreshPayload {
  success: boolean;
  count?: number;
  timestamp?: string;
  error?: string;
}

export default function AIRefreshPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [runResult, setRunResult] = useState<RefreshPayload | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api/ai/index/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = (await response.json()) as RefreshPayload;

      if (!response.ok || !data.success) {
        setStatus(data.error ?? 'Failed to rebuild knowledge base.');
        setRunResult(data);
      } else {
        setStatus(`Rebuild complete. Indexed ${data.count ?? 0} chunks.`);
        setRunResult(data);
      }
    } catch (error) {
      setStatus('Unable to rebuild knowledge base.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={handleRefresh} isLoading={isLoading} className="w-full sm:w-auto">
        Rebuild Knowledge Base
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {runResult?.timestamp ? (
        <p className="text-sm text-muted-foreground">Last run: {new Date(runResult.timestamp).toLocaleString()}</p>
      ) : null}
    </div>
  );
}
