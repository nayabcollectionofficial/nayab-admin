import { NextResponse } from "next/server";
import { supabase, hasDb } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/session";

const ALLOWED = ["pending", "confirmed", "dispatched", "delivered", "cancelled"];

interface Params {
  params: Promise<{ ref: string }>;
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

  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const { data: existing, error: findError } = await supabase
    .from("orders")
    .select("ref")
    .eq("ref", orderRef)
    .maybeSingle();
  if (findError || !existing) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("ref", orderRef);

  if (error) {
    return NextResponse.json({ error: `Failed to update order: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status });
}
