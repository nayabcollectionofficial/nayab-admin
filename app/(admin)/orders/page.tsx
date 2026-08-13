import Link from "next/link";
import { supabase, hasDb } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { formatPrice, formatDateTime } from "@/lib/format";

export const metadata = { title: "Orders" };

export const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  dispatched: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

interface OrdersPageProps {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}

interface OrderRow {
  ref: string;
  method: string;
  customer_name: string;
  customer_city: string;
  total: number;
  status: string;
  created_at: string;
}

const PER_PAGE = 50;

const METHODS: Record<string, string> = {
  easypaisa: "EasyPaisa",
  jazzcash: "JazzCash",
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  await requireSession();
  const sp = await searchParams;
  const status = sp.status;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Math.min(1000, Number(sp.page) || 1));
  const offset = (page - 1) * PER_PAGE;

  let orders: OrderRow[] = [];
  let total = 0;
  const counts = { pending: 0, confirmed: 0, dispatched: 0, delivered: 0, cancelled: 0 };

  if (hasDb && supabase) {
    let query = supabase
      .from("orders")
      .select("ref,method,customer_name,customer_city,total,status,created_at")
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (q) {
      const needle = `%${q.toLowerCase()}%`;
      query = query.or(
        `ref.ilike.${needle},customer_name.ilike.${needle},customer_phone.ilike.${needle}`
      );
    }
    const { data } = await query.range(offset, offset + PER_PAGE - 1);
    if (data) orders = data as OrderRow[];

    const [{ count: all }, ...statusCounts] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "dispatched"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    ]);
    total = all ?? 0;
    counts.pending = statusCounts[0].count ?? 0;
    counts.confirmed = statusCounts[1].count ?? 0;
    counts.dispatched = statusCounts[2].count ?? 0;
    counts.delivered = statusCounts[3].count ?? 0;
    counts.cancelled = statusCounts[4].count ?? 0;
  }

  const tabs = [
    { key: undefined, label: `All (${total})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "confirmed", label: `Confirmed (${counts.confirmed})` },
    { key: "dispatched", label: `Dispatched (${counts.dispatched})` },
    { key: "delivered", label: `Delivered (${counts.delivered})` },
    { key: "cancelled", label: `Cancelled (${counts.cancelled})` },
  ];

  const hasMore = orders.length === PER_PAGE;
  const pageParams = (p: number) => {
    const sp2 = new URLSearchParams();
    if (status) sp2.set("status", status);
    if (q) sp2.set("q", q);
    sp2.set("page", String(p));
    return `/orders?${sp2.toString()}`;
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Orders</h1>
      <p className="text-sm text-slate-500 mt-1">
        {total} order{total === 1 ? "" : "s"} — review payment proofs and
        update status
      </p>

      <form method="get" className="mt-6 max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by ref, name or phone…"
          className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
        />
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = (status ?? undefined) === t.key;
          return (
            <Link
              key={t.label}
              href={t.key ? `/orders?status=${t.key}` : "/orders"}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                active
                  ? "bg-slate-900 text-white font-medium"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-400"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl px-5 py-16 text-center text-sm text-slate-400">
          {status
            ? `No ${status} orders right now.`
            : "No orders yet — they will appear here as soon as customers place them."}
        </div>
      ) : (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Ref</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Paid Upfront</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.ref} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/orders/${encodeURIComponent(o.ref)}`}
                      className="font-medium text-slate-900 hover:text-slate-600"
                    >
                      {o.ref}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {formatDateTime(o.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {o.customer_name}
                    <span className="text-slate-400"> · {o.customer_city}</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {METHODS[o.method] ?? o.method}
                  </td>
                  <td className="px-5 py-3.5 text-slate-900 font-medium">
                    {formatPrice(o.total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadge[o.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(hasMore || page > 1) && (
        <div className="mt-6 flex items-center gap-4">
          {page > 1 && (
            <Link
              href={pageParams(page - 1)}
              className="text-sm text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:bg-white transition-colors"
            >
              ← Newer
            </Link>
          )}
          <span className="text-sm text-slate-400">
            Page {page}
            {hasMore ? " — older orders neeche" : ""}
          </span>
          {hasMore && (
            <Link
              href={pageParams(page + 1)}
              className="text-sm bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 transition-colors"
            >
              Older orders →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
