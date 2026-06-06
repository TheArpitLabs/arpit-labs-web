import Link from 'next/link';
import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";

export default async function CommunityPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community`, { cache: 'no-store' });
  const json = await res.json().catch(() => ({ posts: [] }));
  const posts = json?.posts || [];

  return (
    <main className="min-h-screen bg-background">
      <Container className="py-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Community</h1>
            <Link href="/community/new" className="rounded bg-primary px-4 py-2 text-white">New Post</Link>
          </div>
          <div className="space-y-4">
            {posts.map((p: any) => (
              <article key={p.id} className="rounded border p-4">
                <h2 className="text-lg font-semibold"><Link href={`/community/${p.slug}`}>{p.title}</Link></h2>
                <p className="text-sm text-muted">{p.category} · {new Date(p.created_at).toLocaleString()}</p>
                <p className="mt-2 text-sm line-clamp-3">{p.content}</p>
              </article>
            ))}
          </div>
        </div>
      </Container>
      <Footer />
    </main>
  );
}
