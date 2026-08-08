import { requireSession } from "@/lib/session";
import AdminShell from "@/components/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();

  return <AdminShell>{children}</AdminShell>;
}
