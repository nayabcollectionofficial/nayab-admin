import { NextResponse } from "next/server";
import { supabase, hasDb } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/session";
import {
  ensureUniqueSlug,
  slugify,
  validateProductInput,
  type ProductInput,
} from "@/lib/products";

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

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasDb || !supabase) {
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const input = parseInput(body);
  if (!input) return NextResponse.json({ error: "Invalid product data." }, { status: 400 });
  const invalid = validateProductInput(input);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const slug = await ensureUniqueSlug(slugify(input.name));
  const id = crypto.randomUUID();
  const sizes = ["One Size"];

  const { error } = await supabase.from("products").insert({
    id,
    slug,
    name: input.name,
    brand: input.brand,
    category: input.category,
    price: input.price,
    original_price: input.originalPrice,
    image: input.images[0],
    images: input.images,
    sizes,
    description: input.description,
    fabric: input.fabric,
    care: input.care,
    featured: input.featured,
    is_new: input.isNew,
    stock: input.stock,
    aspect: input.aspect,
  });

  if (error) {
    return NextResponse.json({ error: `Failed to create product: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id, slug });
}
