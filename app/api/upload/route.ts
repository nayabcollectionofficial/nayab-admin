import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { supabase, hasDb, storagePublicUrl } from "@/lib/supabase";
import { isAuthenticated } from "@/lib/session";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!hasDb || !supabase) {
    return NextResponse.json({ error: "Storage not configured." }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const dataUrl = typeof body.dataUrl === "string" ? body.dataUrl : "";
  const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return NextResponse.json({ error: "Invalid image. Use PNG, JPG or WEBP." }, { status: 400 });
  }

  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 });
  }

  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const looksLike =
    (mime === "image/png" &&
      buffer.length >= pngMagic.length &&
      buffer.subarray(0, pngMagic.length).equals(pngMagic)) ||
    ((mime === "image/jpeg" || mime === "image/jpg") &&
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff) ||
    (mime === "image/webp" &&
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP");

  if (!looksLike) {
    return NextResponse.json({ error: "File does not look like a valid image." }, { status: 400 });
  }

  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("products")
    .upload(name, new Uint8Array(buffer), { contentType: mime, upsert: false });

  if (error) {
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: storagePublicUrl("products", name) });
}
