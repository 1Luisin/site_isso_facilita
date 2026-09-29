"use client";
import { getBrowserSupabase } from "../supabase/browser";
import type { Tables } from "../supabase/database.types";
import { coverUrl } from "../product-media/paths";
export const adminCoverUrl=(c:Tables<"contents">)=>c.cover_path?coverUrl(process.env.NEXT_PUBLIC_SUPABASE_URL??"",c.cover_storage_bucket,c.cover_path):"";
export type AdminContentData={contents:Tables<"contents">[];products:Tables<"products">[];images:Tables<"product_images">[];memberships:Tables<"content_products">[];links:Tables<"content_links">[];featuredId:string};
export async function readAdminContents(signal:AbortSignal):Promise<AdminContentData>{
  const c=getBrowserSupabase();if(!c)throw new Error("Auth indisponível");
  const [contents,products,images,memberships,links,settings]=await Promise.all([
    c.from("contents").select("*").order("code").abortSignal(signal),c.from("products").select("*").order("name").abortSignal(signal),
    c.from("product_images").select("*").eq("is_primary",true).abortSignal(signal),c.from("content_products").select("*").order("sort_order").abortSignal(signal),
    c.from("content_links").select("*").abortSignal(signal),c.from("site_settings").select("featured_content_id").abortSignal(signal).single()]);
  if([contents,products,images,memberships,links,settings].some(r=>r.error))throw new Error("Leitura indisponível");
  return {contents:contents.data!,products:products.data!,images:images.data!,memberships:memberships.data!,links:links.data!,featuredId:settings.data!.featured_content_id??""};
}
