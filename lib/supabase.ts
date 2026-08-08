import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const hasDb = Boolean(url && key);

export const supabase: SupabaseClient | null =
  hasDb ? createClient(url, key) : null;

export function storagePublicUrl(bucket: string, path: string): string {
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}

export async function storageSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
