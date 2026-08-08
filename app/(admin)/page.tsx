import { supabase, hasDb } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { requireSession } from "@/lib/session";

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  dispatched: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireSession();

  const stats = { products: 0, onSale: 0, lowStock: 0, orders: 0, pending: 0 };
  let recent: {
    ref: string;
    customer_name: string;
    customer_city: string;
    total: number;
    status: string;
    created_at: string;
  }[] = [];

  if (hasDb && supabase) {
    const [products, sale, low, orders, pending, recentRes] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .not("original_price", "is", null),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .lt("stock", 10),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("orders")
        .select("ref,customer_name,customer_city,total,status,created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    stats.products = products.count ?? 0;
    stats.onSale = sale.count ?? 0;
    stats.lowStock = low.count ?? 0;
    stats.orders = orders.count ?? 0;
    stats.pending = pending.count ?? 0;
    recent = (recentRes.data ?? []) as typeof recent;
  }

  const cards = [
    { label: "Products", value: stats.products, hint: "Total in catalog" },
    { label: "On Sale", value: stats.onSale, hint: "Discounted items" },
    { label: "Low Stock", value: stats.lowStock, hint: "Fewer than 10 left" },
    { label: "Orders", value: stats.orders, hint: "All time" },
    { label: "Pending", value: stats.pending, hint: "Awaiting review" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="text-sm text-slate-500 mt-1">
        Your store at a glance
      </p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-slate-200 rounded-xl p-5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {c.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white border border-slate-200 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Recent Orders</h2>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">
            No orders yet — they will appear here as soon as customers place
            them.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Ref</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.map((o) => (
                  <tr key={o.ref}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">
                      {o.ref}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {o.customer_name}
                      <span className="text-slate-400"> · {o.customer_city}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-900">
                      {formatPrice(o.total)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusBadge[o.status] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
