import "server-only";
import { cache } from "react";
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
// One shared promise per worker/process, including concurrent metadata/params calls.
// Never persisted between builds; React cache also deduplicates the render context.
let snapshotPromise: Promise<PublicCatalogSnapshot> | undefined;
export const getPublicCatalogSnapshot = cache(() => {
  snapshotPromise ??= Promise.resolve().then(async () => {
    const source = resolveDataSource();
    return validateSnapshot(source === "static" ? getStaticSnapshot() : await getSupabaseSnapshot());
  });
  return snapshotPromise;
});
