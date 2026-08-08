import { requireSession } from "@/lib/session";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return (
    <div className="min-h-screen flex bg-slate-50">
      <Sidebar />
      <main className="flex-1 min-w-0 px-6 sm:px-10 py-8">{children}</main>
    </div>
  );
}
