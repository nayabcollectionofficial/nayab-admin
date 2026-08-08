import { NextResponse } from "next/server";
import { supabase, hasDb } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/session";
import {
  ensureUniqueSlug,
  slugify,
  validateProductInput,
  deleteProductImages,
  type ProductInput,
} from "@/lib/products";

interface Params {
  params: Promise<{ id: string }>;
}

function parseInput(body: Record<string, unknown>): ProductInput | null {
  return {
    name: typeof body.name === "string" ? body.name.trim() : "",
    brand: typeof body.brand === "string" ? body.brand.trim() : "",
    category: typeof body.category === "string" ? body.category : "",
    price: Math.round(Number(body.price) || 0),
    originalPrice:
      body.originalPrice === null || body.originalPrice === undefined || body.originalPrice === ""
        ? null
        : Math.round(Number(body.originalPrice) || 0),
    images: Array.isArray(body.images)
      ? body.images.filter((i): i is string => typeof i === "string")
      : [],
    description: typeof body.description === "string" ? body.description.trim() : "",
    fabric: typeof body.fabric === "string" ? body.fabric.trim() : "",
    care: typeof body.care === "string" ? body.care.trim() : "",
    featured: Boolean(body.featured),
    isNew: Boolean(body.isNew),
    stock: Number.isInteger(body.stock) ? (body.stock as number) : 0,
    aspect:
      typeof body.aspect === "number" && Number.isFinite(body.aspect) && body.aspect > 0
        ? body.aspect
        : null,
  };
}

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasDb || !supabase) {
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const input = parseInput(body);
  if (!input) return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
  const invalid = validateProductInput(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const { data: existing, error: findError } = await supabase
    .from("products")
    .select("id,slug,images")
    .eq("id", id)
    .maybeSingle();
  if (findError || !existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const slug = await ensureUniqueSlug(slugify(input.name), id);

  const { error } = await supabase
    .from("products")
    .update({
      slug,
      name: input.name,
      brand: input.brand,
      category: input.category,
      price: input.price,
      original_price: input.originalPrice,
      image: input.images[0],
      images: input.images,
      description: input.description,
      fabric: input.fabric,
      care: input.care,
      featured: input.featured,
      is_new: input.isNew,
      stock: input.stock,
      aspect: input.aspect,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: `Failed to update product: ${error.message}` }, { status: 500 });
  }

  const removed = (existing.images as string[] | null ?? []).filter(
    (u) => !input.images.includes(u)
  );
  if (removed.length > 0) void deleteProductImages(removed);

  return NextResponse.json({ ok: true, id, slug });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasDb || !supabase) {
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const { id } = await params;
  const { data: existing, error: findError } = await supabase
    .from("products")
    .select("id,images")
    .eq("id", id)
    .maybeSingle();
  if (findError || !existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: `Failed to delete product: ${error.message}` }, { status: 500 });
  }

  const urls = (existing.images as string[] | null ?? []);
  if (urls.length > 0) void deleteProductImages(urls);

  return NextResponse.json({ ok: true });
}
