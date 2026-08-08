import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { setSessionCookie, isAuthenticated } from "@/lib/session";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

const attempts = new Map<string, { fails: number; lockUntil: number }>();

function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function sweep() {
  if (attempts.size < 500) return;
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (entry.lockUntil <= now && entry.fails === 0) attempts.delete(ip);
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const ha = Buffer.from(a);
  const hb = Buffer.from(b);
  if (ha.length !== hb.length) return false;
  return timingSafeEqual(ha, hb);
}

export async function POST(request: Request) {
  sweep();

  const ip = clientIp(request);
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry && entry.lockUntil > now) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 5 minutes." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const password = typeof body.password === "string" ? body.password : "";
  const expected = process.env.ADMIN_PASSWORD ?? "";

  if (expected && constantTimeEqual(password, expected)) {
    attempts.delete(ip);
    await setSessionCookie();
    return NextResponse.json({ ok: true });
  }

  const fails = (entry?.fails ?? 0) + 1;
  const lockUntil = fails >= MAX_ATTEMPTS ? now + WINDOW_MS : 0;
  attempts.set(ip, { fails, lockUntil });

  if (fails >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 5 minutes." },
      { status: 429 }
    );
  }

  return NextResponse.json({ error: "Invalid password." }, { status: 401 });
}

export async function GET() {
  return NextResponse.json({ authed: await isAuthenticated() });
}
