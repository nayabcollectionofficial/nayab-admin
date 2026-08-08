import { NextResponse } from "next/server";
import { setSessionCookie, isAuthenticated } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ authed: await isAuthenticated() });
}
