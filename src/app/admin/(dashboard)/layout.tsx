import { requireAdmin } from "@/lib/auth";
import { AdminChrome } from "@/components/admin/AdminChrome";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminChrome>{children}</AdminChrome>
      </div>
    </main>
  );
}
