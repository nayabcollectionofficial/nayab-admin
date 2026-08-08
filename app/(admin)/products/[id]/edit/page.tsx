import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { supabase, hasDb } from "@/lib/supabase";
import type { AdminProduct } from "@/lib/products";
import ProductForm from "@/components/ProductForm";

export const metadata = { title: "Edit Product" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  await requireSession();
  const { id } = await params;

  let product: AdminProduct | null = null;
  let existingBrands: string[] = [];

  if (hasDb && supabase) {
    const [prodRes, brandRes] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase.from("products").select("brand"),
    ]);
    if (prodRes.data) product = prodRes.data as AdminProduct;
    existingBrands = [
      ...new Set((brandRes.data ?? []).map((r) => r.brand as string)),
    ].filter(Boolean);
  }

  if (!product) notFound();

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Edit Product</h1>
      <p className="text-sm text-slate-500 mt-1">
        /product/{product.slug}
      </p>
      <ProductForm initial={product} existingBrands={existingBrands} />
    </div>
  );
}
