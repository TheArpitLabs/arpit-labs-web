import { Container } from "@/components/layout/Container";
import { Footer } from "@/components/layout/Footer";
import { Globe, Users, MessageSquare, MapPin, Search } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GlobalCommunityPage() {
  let chapters: any[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/community/chapters`, { cache: 'no-store' });
    const json = await res.json().catch(() => ({ data: [] }));
    chapters = json?.data || [];
  } catch (error) {
    console.error("Failed to load community chapters:", error);
  }

  return (
    <main className="min-h-screen bg-background">
      
      <div className="relative border-b border-border bg-surface py-24 text-foreground">
        <div className="absolute inset-0 z-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <Container className="relative z-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl font-heading font-extrabold tracking-tight sm:text-7xl">
              A Global Network of <span className="text-primary">Innovators.</span>
            </h1>
            <p className="text-xl text-muted">
              Join engineers, researchers, and creators in building the future of AI and IoT. Connect, collaborate, and grow together.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 rounded-2xl bg-surface-elevated px-4 py-2 backdrop-blur-md">
                <Users size={20} className="text-primary" />
                <span className="font-heading font-bold">Growing Community</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-surface-elevated px-4 py-2 backdrop-blur-md">
                <Globe size={20} className="text-accent" />
                <span className="font-heading font-bold">Global Network</span>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-20">
        <div className="grid gap-16 lg:grid-cols-[1fr_350px]">
          <div className="space-y-12">
            <section>
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-3xl font-heading font-bold text-foreground">Regional Chapters</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input 
                    placeholder="Search by country..." 
                    className="rounded-xl border border-border bg-surface pl-10 pr-4 py-2 text-sm focus:border-primary outline-none text-foreground"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="group rounded-3xl border border-border bg-surface p-6 transition hover:border-primary">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <MapPin size={20} />
                      </div>
                      <span className="text-xs font-heading font-bold text-muted">{chapter.member_count || 0} Members</span>
                    </div>
                    <h3 className="text-xl font-heading font-bold text-foreground">{chapter.name}</h3>
                    <p className="text-sm text-muted">{chapter.city ? `${chapter.city}, ` : ''}{chapter.country_name || chapter.country}</p>
                    <button className="mt-6 w-full rounded-xl border border-border py-2 text-sm font-heading font-bold transition group-hover:bg-primary group-hover:text-foreground group-hover:border-primary">
                      Join Chapter
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[3rem] bg-surface p-12">
              <div className="max-w-2xl space-y-6">
                <h2 className="text-3xl font-heading font-bold text-foreground">Become an Ambassador</h2>
                <p className="text-muted">
                  Lead the movement in your region. Arpit Labs Ambassadors are the pillars of our global community, organizing meetups and driving local innovation.
                </p>
                <button className="rounded-2xl bg-foreground px-8 py-4 font-heading font-bold text-background transition hover:scale-105">
                  Apply Now
                </button>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <div className="rounded-3xl border border-border bg-surface p-6">
              <h3 className="mb-4 font-heading font-bold text-foreground">Community Features</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Regional Chapters</span>
                  <span className="font-heading font-bold text-foreground">Coming Soon</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Local Events</span>
                  <span className="font-heading font-bold text-foreground">Coming Soon</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Project Collaboration</span>
                  <span className="font-heading font-bold text-foreground">Available</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-primary/5 p-6">
              <div className="mb-4 text-primary"><MessageSquare size={24} /></div>
              <h3 className="mb-2 font-heading font-bold text-foreground">Join the Discord</h3>
              <p className="mb-4 text-sm text-muted">Real-time collaboration with the global team.</p>
              <button className="w-full rounded-xl bg-primary py-2 text-sm font-heading font-bold text-foreground shadow-lg shadow-primary/20">
                Connect
              </button>
            </div>
          </aside>
        </div>
      </Container>
      
      <Footer />
    </main>
  );
}
