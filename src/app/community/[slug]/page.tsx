import ReplyForm from '@/components/community/ReplyForm';
import Link from 'next/link';

export default async function PostPage({ params }: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/${params.slug}`, { cache: 'no-store' });
  const json = await res.json().catch(() => ({}));
  const post = json?.post;

  if (!post) return <div>Post not found</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <p className="text-sm text-muted">{post.category} · {new Date(post.created_at).toLocaleString()}</p>
      </div>
      <div className="prose">
        <p>{post.content}</p>
      </div>

      <section>
        <h3 className="text-lg font-semibold">Replies</h3>
        <div className="space-y-3">
          {/* replies will be fetched client-side in future; show placeholder */}
        </div>
        <div className="mt-4">
          <ReplyForm slug={post.slug} />
        </div>
      </section>
      <div>
        <Link href="/community" className="text-sm text-muted">Back to community</Link>
      </div>
    </div>
  );
}
