import { NextResponse } from "next/server";
import { supabase, hasDb } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/session";

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["dispatched", "cancelled"],
  dispatched: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

interface Params {
  params: Promise<{ ref: string }>;
}

async function adjustStock(
  items: { slug?: string; quantity?: number }[],
  direction: "deduct" | "restore"
): Promise<void> {
  if (!supabase) return;
  for (const item of items) {
    const slug = item.slug;
    const qty = Math.max(0, Math.round(Number(item.quantity) || 0));
    if (!slug || qty === 0) continue;

    const { data, error } = await supabase
      .from("products")
      .select("stock")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) continue;

    const current = Number(data.stock) || 0;
    const next =
      direction === "deduct"
        ? Math.max(0, current - qty)
        : current + qty;

    await supabase.from("products").update({ stock: next }).eq("slug", slug);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasDb || !supabase) {
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const { ref: orderRef } = await params;
  const body = await request.json().catch(() => ({}));
  const status = typeof body.status === "string" ? body.status : "";

  const { data: existing, error: findError } = await supabase
    .from("orders")
    .select("ref,status,items")
    .eq("ref", orderRef)
    .maybeSingle();
  if (findError || !existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (existing.status === status) {
    return NextResponse.json({ ok: true, status });
  }

  const allowed = TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot move an order from "${existing.status}" to "${status}".` },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("ref", orderRef);
  if (error) {
    return NextResponse.json({ error: `Failed to update order: ${error.message}` }, { status: 500 });
  }

  const items = Array.isArray(existing.items)
    ? (existing.items as { slug?: string; quantity?: number }[])
    : [];

  if (status === "confirmed") await adjustStock(items, "deduct");
  if (status === "cancelled" && ["confirmed", "dispatched"].includes(existing.status)) {
    await adjustStock(items, "restore");
  }

  return NextResponse.json({ ok: true, status });
}
