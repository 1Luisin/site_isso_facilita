"use client";
import { getBrowserSupabase } from "../supabase/browser";
import type { Tables } from "../supabase/database.types";
import { mediaUrl } from "../product-media/paths";
export function adminImageUrl(image: Tables<"product_images">) {
  return mediaUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",image.storage_bucket,image.storage_path);
}
export type AdminProductData = {
  products: Tables<"products">[]; categories: Tables<"categories">[]; collections: Tables<"collections">[];
  links: Tables<"product_affiliate_links">[]; images: Tables<"product_images">[]; memberships: Tables<"collection_products">[];
};
export async function readAdminProducts(signal: AbortSignal): Promise<AdminProductData> {
  const client=getBrowserSupabase();
  if(!client)throw new Error("Auth indisponível");
  const [products,categories,collections,links,images,memberships]=await Promise.all([
    client.from("products").select("*").order("name").abortSignal(signal),
    client.from("categories").select("*").order("sort_order").abortSignal(signal),
    client.from("collections").select("*").order("sort_order").abortSignal(signal),
    client.from("product_affiliate_links").select("*").eq("active",true).eq("is_primary",true).abortSignal(signal),
    client.from("product_images").select("*").eq("is_primary",true).abortSignal(signal),
    client.from("collection_products").select("*").abortSignal(signal),
  ]);
  if([products,categories,collections,links,images,memberships].some(r=>r.error))throw new Error("Leitura indisponível");
  return {products:products.data!,categories:categories.data!,collections:collections.data!,links:links.data!,images:images.data!,memberships:memberships.data!};
}
export async function mutationToken() {
  const client=getBrowserSupabase();
  if(!client)throw new Error("Entre novamente para continuar.");
  const {data,error}=await client.auth.getSession();
  if(error || !data.session)throw new Error("Entre novamente para continuar.");
  return data.session.access_token;
}
