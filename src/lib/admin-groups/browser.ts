"use client";
import {getBrowserSupabase} from "../supabase/browser";
import type {Tables} from "../supabase/database.types";
export type GroupData={categories:Tables<"categories">[];collections:Tables<"collections">[];products:Tables<"products">[];images:Tables<"product_images">[];memberships:Tables<"collection_products">[]};
export async function readGroups(signal:AbortSignal):Promise<GroupData>{
 const c=getBrowserSupabase();if(!c)throw new Error("Auth indisponível");
 const [categories,collections,products,images,memberships]=await Promise.all([c.from("categories").select("*").order("sort_order").order("id").abortSignal(signal),c.from("collections").select("*").order("sort_order").order("id").abortSignal(signal),c.from("products").select("*").order("name").abortSignal(signal),c.from("product_images").select("*").eq("is_primary",true).abortSignal(signal),c.from("collection_products").select("*").order("sort_order").abortSignal(signal)]);
 if([categories,collections,products,images,memberships].some(r=>r.error))throw new Error("Leitura indisponível");
 return {categories:categories.data!,collections:collections.data!,products:products.data!,images:images.data!,memberships:memberships.data!};
}
