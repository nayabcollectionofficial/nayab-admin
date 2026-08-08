import { requireSession } from "@/lib/session";
import { supabase, hasDb } from "@/lib/supabase";
import ProductForm from "@/components/ProductForm";

export const metadata = { title: "Add Product" };

export default async function NewProductPage() {
  await requireSession();

  let existingBrands: string[] = [];
  if (hasDb && supabase) {
    const { data } = await supabase.from("products").select("brand");
    existingBrands = [...new Set((data ?? []).map((r) => r.brand as string))].filter(Boolean);
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Add Product</h1>
      <p className="text-sm text-slate-500 mt-1">
        Save karte hi product store pe live ho jayega
      </p>
      <ProductForm existingBrands={existingBrands} />
    </div>
  );
}
