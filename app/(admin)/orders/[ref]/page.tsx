import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase, hasDb, storageSignedUrl } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import { statusBadge } from "@/app/(admin)/orders/page";
import StatusButtons from "@/components/StatusButtons";

export const metadata = { title: "Order" };

interface Props {
  params: Promise<{ ref: string }>;
}

interface OrderItem {
  name: string;
  brand: string;
  size: string;
  quantity: number;
  price: number;
}

interface OrderRow {
  ref: string;
  method: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_city: string;
  customer_address: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  total: number;
  screenshot_url: string;
  created_at: string;
}

const METHODS: Record<string, string> = {
  easypaisa: "EasyPaisa",
  jazzcash: "JazzCash",
};

export default async function OrderDetailPage({ params }: Props) {
  await requireSession();
  const { ref: orderRef } = await params;

  let order: OrderRow | null = null;
  if (hasDb && supabase) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("ref", orderRef)
      .maybeSingle();
    if (data) order = data as OrderRow;
  }

  if (!order) notFound();

  const screenshotUrl = order.screenshot_url
    ? await storageSignedUrl("order-proofs", order.screenshot_url, 3600)
    : null;

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Order {orderRef}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString()}{" "}
            {new Date(order.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1.5 text-sm font-medium capitalize ${statusBadge[order.status] ?? "bg-slate-100 text-slate-600"}`}
        >
          {order.status}
        </span>
      </div>

      <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
        <StatusButtons orderRef={orderRef} current={order.status} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-medium text-slate-900">Customer</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-slate-400 shrink-0">Name</dt>
                <dd className="text-right">{order.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-slate-400 shrink-0">Phone</dt>
                <dd className="text-right">{order.customer_phone}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-slate-400 shrink-0">Email</dt>
                <dd className="text-right break-all">{order.customer_email}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-slate-400 shrink-0">City</dt>
                <dd className="text-right">{order.customer_city}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-slate-400 shrink-0">Address</dt>
                <dd className="text-right">{order.customer_address}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-slate-400 shrink-0">Payment via</dt>
                <dd className="text-right">
                  {METHODS[order.method] ?? order.method}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="font-medium text-slate-900">Items</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {(order.items ?? []).map((item, i) => (
                <li key={i} className="py-3 flex justify-between gap-4 text-sm">
                  <div>
                    <p className="text-slate-900 font-medium">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.brand} · Size {item.size} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-slate-900 shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Delivery</dt>
                <dd>
                  {order.delivery === 0 ? "Free" : formatPrice(order.delivery)}
                </dd>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <dt>Total Paid</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-medium text-slate-900">Payment Proof</h2>
          <p className="text-xs text-slate-400 mt-1">
            Screenshot private storage me hai — sirf aap ye dekh sakte hain
          </p>
          {screenshotUrl ? (
            <div className="mt-4 bg-slate-100 rounded-lg overflow-hidden">
              <Image
                src={screenshotUrl}
                alt={`Payment proof for ${orderRef}`}
                width={800}
                height={1200}
                className="w-full h-auto object-contain"
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">
              Screenshot unavailable.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
