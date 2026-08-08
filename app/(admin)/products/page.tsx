import Link from "next/link";
import Image from "next/image";
import { supabase, hasDb } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { formatPrice } from "@/lib/format";
import type { AdminProduct } from "@/lib/products";
import DeleteProductButton from "@/components/DeleteProductButton";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  await requireSession();

  let products: AdminProduct[] = [];
  if (hasDb && supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("featured", { ascending: false })
      .order("name", { ascending: true });
    if (!error && data) products = data as AdminProduct[];
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-1">
            {products.length} product{products.length === 1 ? "" : "s"} — changes appear on the store instantly
          </p>
        </div>
        <Link
          href="/products/new"
          className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors shrink-0"
        >
          + Add Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl px-5 py-16 text-center text-sm text-slate-400">
          No products yet — click “Add Product” to create your first one.
        </div>
      ) : (
        <div className="mt-8 bg-white border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium">Stock</th>
                <th className="px-5 py-3 font-medium">Badges</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-14 bg-slate-100 rounded-md overflow-hidden shrink-0">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate max-w-[260px]">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-400">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600 capitalize">
                    {p.category.replace("-", " ")}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-900">{formatPrice(p.price)}</p>
                    {p.original_price && (
                      <p className="text-xs text-slate-400 line-through">
                        {formatPrice(p.original_price)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        p.stock < 10
                          ? "text-amber-600 font-medium"
                          : "text-slate-600"
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {p.featured && (
                        <span className="rounded-full bg-slate-900 text-white text-[11px] px-2 py-0.5">
                          Featured
                        </span>
                      )}
                      {p.is_new && (
                        <span className="rounded-full bg-blue-100 text-blue-700 text-[11px] px-2 py-0.5">
                          New
                        </span>
                      )}
                      {p.original_price && (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 text-[11px] px-2 py-0.5">
                          On Sale
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/products/${p.id}/edit`}
                        className="text-sm text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
