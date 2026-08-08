import { supabase, hasDb } from "./supabase";

export const CATEGORIES = ["two-piece", "three-piece"] as const;
export type CategorySlug = (typeof CATEGORIES)[number];

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  original_price: number | null;
  image: string;
  images: string[];
  sizes: string[];
  description: string;
  fabric: string;
  care: string;
  featured: boolean;
  is_new: boolean;
  stock: number;
  aspect: number | null;
}

export interface ProductInput {
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number | null;
  images: string[];
  description: string;
  fabric: string;
  care: string;
  featured: boolean;
  isNew: boolean;
  stock: number;
  aspect: number | null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function publicUrlToPath(url: string): string | null {
  const marker = "/object/public/products/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

export async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  if (!hasDb || !supabase) return base || "product";
  let candidate = base || "product";
  let n = 2;
  for (;;) {
    const query = supabase.from("products").select("id").eq("slug", candidate).maybeSingle();
    const { data } = await query;
    if (!data || (excludeId && data.id === excludeId)) return candidate;
    candidate = `${base || "product"}-${n}`;
    n++;
  }
}

export function validateProductInput(input: ProductInput): string | null {
  if (!input.name.trim()) return "Product name is required.";
  if (!input.brand.trim()) return "Brand is required.";
  if (!CATEGORIES.includes(input.category as CategorySlug))
    return "Please choose a valid category.";
  if (!Number.isFinite(input.price) || input.price <= 0)
    return "Price must be a positive number.";
  if (input.originalPrice !== null) {
    if (!Number.isFinite(input.originalPrice) || input.originalPrice <= 0)
      return "Original price must be a positive number.";
    if (input.originalPrice <= input.price)
      return "Original price must be higher than the sale price.";
  }
  if (input.images.length === 0) return "Please upload at least one image.";
  if (!Number.isInteger(input.stock) || input.stock < 0)
    return "Stock must be a whole number (0 or more).";
  return null;
}

export async function deleteProductImages(urls: string[]): Promise<void> {
  if (!hasDb || !supabase) return;
  const paths = urls.map(publicUrlToPath).filter((p): p is string => Boolean(p));
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from("products").remove(paths);
  if (error) console.error("[admin] image cleanup error:", error.message);
}
