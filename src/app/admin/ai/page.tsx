import React from 'react';
import { supabaseServer } from '@/lib/supabase/server';

export default async function AdminAIPage() {
  // Fetch basic stats
  const [embRes, kbRes, convRes] = await Promise.all([
    supabaseServer.from('content_embeddings').select('id', { count: 'exact' }),
    supabaseServer.from('ai_knowledge_base').select('id', { count: 'exact' }),
    supabaseServer.from('ai_conversations').select('id', { count: 'exact' }),
  ]);

  const embeddingCount = embRes.count ?? 0;
  const kbCount = kbRes.count ?? 0;
  const conversationCount = convRes.count ?? 0;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">AI Dashboard</h1>
      <div className="mt-4 space-y-2">
        <div><strong>Embedding count:</strong> {embeddingCount}</div>
        <div><strong>Indexed content:</strong> {kbCount}</div>
        <div><strong>Conversations:</strong> {conversationCount}</div>
      </div>
    </div>
  );
}
