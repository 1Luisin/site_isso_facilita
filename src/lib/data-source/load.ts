import "server-only";
import { getStaticSnapshot } from "./static.ts";
import { getSupabaseSnapshot } from "./supabase.ts";
import { validateSnapshot } from "./validate.ts";
import type { PublicCatalogSnapshot } from "./types.ts";

export function resolveDataSource(): "static" | "supabase" {
  const source = process.env.SITE_DATA_SOURCE ?? "static";
  if (source !== "static" && source !== "supabase")
    throw new Error("SITE_DATA_SOURCE inválida: utilize static ou supabase.");
  return source;
}
export async function loadPublicCatalogSnapshot(): Promise<PublicCatalogSnapshot> {
  const source = resolveDataSource();
  return validateSnapshot(source === "static" ? getStaticSnapshot() : await getSupabaseSnapshot());
}
