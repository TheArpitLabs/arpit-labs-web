"use client";
import { useState } from 'react';

export default function CreatePostForm({ onCreated }: { onCreated?: (post: any) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('discussion');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: any) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (json.success) {
        setTitle(''); setContent(''); setTags('');
        onCreated?.(json.post);
      } else {
        alert(json.error || 'Failed to create');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 border rounded" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" className="w-full p-2 border rounded h-40" />
      <div className="flex gap-2">
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="p-2 border rounded" />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags (comma separated)" className="flex-1 p-2 border rounded" />
      </div>
      <button type="submit" disabled={loading} className="inline-block rounded bg-primary px-4 py-2 text-white">{loading ? 'Creating...' : 'Create Post'}</button>
    </form>
  );
}
