"use client";
import { useState } from 'react';

export default function ReplyForm({ slug, onReply }: { slug: string; onReply?: (r: any) => void }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/community/${slug}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.success) {
        setContent('');
        onReply?.(json.reply);
      } else {
        alert(json.error || 'Failed to reply');
      }
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a reply..." className="w-full p-2 border rounded h-24" />
      <button type="submit" disabled={loading} className="inline-block rounded bg-primary px-4 py-2 text-white">{loading ? 'Posting...' : 'Post Reply'}</button>
    </form>
  );
}
