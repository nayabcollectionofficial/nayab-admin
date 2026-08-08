import { NextResponse } from "next/server";
import { supabase, hasDb } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/session";
import { publicUrlToPath } from "@/lib/products";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasDb || !supabase) {
    return NextResponse.json({ error: "Storage not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const urls = Array.isArray(body.urls)
    ? (body.urls as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  if (urls.length === 0) {
    return NextResponse.json({ ok: true, removed: 0 });
  }

  const paths = urls.map(publicUrlToPath).filter((p): p is string => Boolean(p));
  if (paths.length === 0) {
    return NextResponse.json({ ok: true, removed: 0 });
  }

  const { error } = await supabase.storage.from("products").remove(paths);
  if (error) {
    return NextResponse.json({ error: `Cleanup failed: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, removed: paths.length });
}
