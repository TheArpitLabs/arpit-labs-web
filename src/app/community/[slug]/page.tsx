import ReplyForm from '@/components/community/ReplyForm';
import Link from 'next/link';
import { headers } from 'next/headers';

async function getApiUrl(path: string) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configuredBaseUrl?.trim()) {
    return `${configuredBaseUrl.replace(/\/$/, '')}${path}`;
  }

  const headerStore = await headers();
  const protocol = headerStore.get('x-forwarded-proto') || 'http';
  const host = headerStore.get('x-forwarded-host') || headerStore.get('host') || 'localhost:3000';
  return `${protocol}://${host}${path}`;
}

export default async function PostPage({ params }: any) {
  const [res, repliesRes] = await Promise.all([
    fetch(await getApiUrl(`/api/community/${params.slug}`), { cache: 'no-store' }),
    fetch(await getApiUrl(`/api/community/${params.slug}/replies`), { cache: 'no-store' }),
  ]);
  const json = await res.json().catch(() => ({}));
  const repliesJson = await repliesRes.json().catch(() => ({ replies: [] }));
  const post = json?.post;
  const replies = repliesJson?.replies || [];

  if (!post) return <div>Post not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <p className="text-sm text-muted">
          {post.category} · {new Date(post.created_at).toLocaleString()}
        </p>
      </div>
      <div className="prose">
        <p>{post.content}</p>
      </div>

      <section>
        <h3 className="text-lg font-semibold">Replies</h3>
        <div className="space-y-3">
          {replies.length ? (
            replies.map((reply: any) => (
              <article key={reply.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 text-sm font-semibold text-foreground">
                  {reply.author?.full_name || reply.author?.username || 'Community member'}
                </div>
                <p className="text-sm text-muted">{reply.content}</p>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted">
              No replies yet.
            </p>
          )}
        </div>
        <div className="mt-4">
          <ReplyForm slug={post.slug} />
        </div>
      </section>
      <div>
        <Link href="/community" className="text-sm text-muted">
          Back to community
        </Link>
      </div>
    </div>
  );
}
