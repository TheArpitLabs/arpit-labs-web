import { requireAdmin } from "@/lib/auth/auth";
import { AdminChrome } from "@/components/admin/AdminChrome";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <AdminChrome>{children}</AdminChrome>
  );
}
