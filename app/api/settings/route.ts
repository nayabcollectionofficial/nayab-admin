import { NextResponse } from "next/server";
import { supabase, hasDb } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/session";

interface PaymentMethodInput {
  id?: unknown;
  label?: unknown;
  mobileAccount?: unknown;
  accountTitle?: unknown;
  note?: unknown;
}

interface BrandGroupInput {
  id?: unknown;
  label?: unknown;
  brands?: unknown;
}

function cleanBrandGroup(g: BrandGroupInput, index: number, usedIds: Set<string>): { id: string; label: string; brands: string[] } | null {
  const label = typeof g.label === "string" ? g.label.trim() : "";
  if (!label) return null;
  const rawBrands = Array.isArray(g.brands)
    ? g.brands.filter((b): b is string => typeof b === "string").map((b) => b.trim()).filter(Boolean)
    : [];
  const base = typeof g.id === "string" && /^[a-z0-9-]+$/.test(g.id) ? g.id : "";
  let id = base || slugifyLabel(label);
  let n = 1;
  while (usedIds.has(id)) id = `${slugifyLabel(label)}-${n++}`;
  usedIds.add(id);
  return { id, label, brands: [...new Set(rawBrands)] };
}

function slugifyLabel(label: string): string {
  return label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `group-${Date.now()}`;
}

function cleanPaymentMethod(m: PaymentMethodInput) {
  return {
    id: typeof m.id === "string" ? m.id : "",
    label: typeof m.label === "string" ? m.label.trim() : "",
    mobileAccount: typeof m.mobileAccount === "string" ? m.mobileAccount.trim() : "",
    accountTitle: typeof m.accountTitle === "string" ? m.accountTitle.trim() : "",
    note: typeof m.note === "string" ? m.note.trim() : "",
  };
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasDb || !supabase) {
    return NextResponse.json({ error: "Database not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));

  const methods = Array.isArray(body.paymentMethods)
    ? (body.paymentMethods as PaymentMethodInput[]).map(cleanPaymentMethod)
    : null;
  const deliveryRaw = body.delivery as { fee?: unknown; freeThreshold?: unknown } | null;
  const supportPhone = typeof body.supportPhone === "string" ? body.supportPhone.trim() : null;
  const adminEmail = typeof body.adminEmail === "string" ? body.adminEmail.trim() : null;

  if (!methods || methods.length !== 2) {
    return NextResponse.json({ error: "Both EasyPaisa and JazzCash details are required." }, { status: 400 });
  }
  if (methods.some((m) => !m.id || !m.label || !m.mobileAccount || !m.accountTitle)) {
    return NextResponse.json({ error: "Payment accounts need a name, number and account title." }, { status: 400 });
  }

  const fee = Number(deliveryRaw?.fee);
  const freeThreshold = Number(deliveryRaw?.freeThreshold);
  if (!Number.isFinite(fee) || fee < 0) {
    return NextResponse.json({ error: "Delivery fee must be a positive number." }, { status: 400 });
  }
  if (!Number.isFinite(freeThreshold) || freeThreshold <= 0) {
    return NextResponse.json({ error: "Free delivery threshold must be a positive number." }, { status: 400 });
  }

  if (supportPhone === null) {
    return NextResponse.json({ error: "Support phone is required." }, { status: 400 });
  }
  if (adminEmail === null) {
    return NextResponse.json({ error: "Order email is required (empty allowed for none)." }, { status: 400 });
  }

  let brandGroups: { id: string; label: string; brands: string[] }[] | null = null;
  if (Array.isArray(body.brandGroups)) {
    const usedIds = new Set<string>();
    brandGroups = (body.brandGroups as BrandGroupInput[])
      .map((g, i) => cleanBrandGroup(g, i, usedIds))
      .filter((g): g is { id: string; label: string; brands: string[] } => g !== null);
    if (brandGroups.length === 0) {
      return NextResponse.json({ error: "At least one brand filter is required." }, { status: 400 });
    }
  }

  const entries: { key: string; value: unknown }[] = [
    { key: "paymentMethods", value: methods },
    { key: "delivery", value: { fee: Math.round(fee), freeThreshold: Math.round(freeThreshold) } },
    { key: "supportPhone", value: supportPhone },
    { key: "adminEmail", value: adminEmail },
  ];
  if (brandGroups) entries.push({ key: "brandGroups", value: brandGroups });
  entries.push({
    key: "spotlightProductSlug",
    value: typeof body.spotlightProductSlug === "string" && body.spotlightProductSlug.trim()
      ? body.spotlightProductSlug.trim()
      : null,
  });

  for (const entry of entries) {
    const { error } = await supabase.from("settings").upsert(
      { key: entry.key, value: entry.value },
      { onConflict: "key" }
    );
    if (error) {
      return NextResponse.json({ error: `Failed to save "${entry.key}": ${error.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
