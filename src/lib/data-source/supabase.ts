import "server-only";
import { createPublicBuildClient } from "../supabase/public.ts";
import { productPresentation } from "./presentation.ts";
import type { Tables } from "../supabase/database.types.ts";
import type { PublicCatalogSnapshot, Content } from "./types.ts";

export async function getSupabaseSnapshot(): Promise<PublicCatalogSnapshot> {
  const db = createPublicBuildClient();
  // Stable ordering and pagination avoid silently truncating the catalog at the API limit.
  async function read<T>(table: string, page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string } | null }>) {
    const rows: T[] = [];
    for (let from = 0; ; from += 500) {
      const { data, error } = await page(from, from + 499);
      if (error || !data) throw new Error(`Catálogo Supabase: leitura de ${table} falhou; verifique URL/key, grants e RLS. Sem fallback estático.`);
      rows.push(...data);
      if (data.length < 500) return rows;
    }
  }
  const [categories, products, affiliates, images, collections, collectionProducts, contents, contentProducts, contentLinks, settings] = await Promise.all([
    read("categories", (a,b) => db.from("categories").select("*").eq("active",true).order("sort_order").order("id").range(a,b)),
    read("products", (a,b) => db.from("products").select("*").eq("published",true).order("sort_order").order("id").range(a,b)),
    read("product_affiliate_links", (a,b) => db.from("product_affiliate_links").select("*").eq("active",true).order("id").range(a,b)),
    read("product_images", (a,b) => db.from("product_images").select("*").order("sort_order").order("id").range(a,b)),
    read("collections", (a,b) => db.from("collections").select("*").eq("published",true).order("sort_order").order("id").range(a,b)),
    read("collection_products", (a,b) => db.from("collection_products").select("*").order("collection_id").order("sort_order").range(a,b)),
    read("contents", (a,b) => db.from("contents").select("*").eq("published",true).order("code").range(a,b)),
    read("content_products", (a,b) => db.from("content_products").select("*").order("content_id").order("sort_order").range(a,b)),
    read("content_links", (a,b) => db.from("content_links").select("*").order("platform").order("id").range(a,b)),
    read("site_settings", (a,b) => db.from("site_settings").select("*").order("id").range(a,b)),
  ]);
  const requireRow = <T,>(row: T | undefined, message: string): T => {
    if (!row) throw new Error(`Catálogo Supabase: ${message}.`);
    return row;
  };
  const primary = <T,>(rows: T[], message: string): T => {
    if (rows.length !== 1) throw new Error(`Catálogo Supabase: ${message}; esperado exatamente um, encontrados ${rows.length}.`);
    return rows[0];
  };
  for (const r of collectionProducts) {
    requireRow(collections.find(c => c.id === r.collection_id), "relação com coleção indisponível");
    requireRow(products.find(p => p.id === r.product_id), "relação de coleção com produto indisponível");
  }
  for (const r of contentProducts) {
    requireRow(contents.find(c => c.id === r.content_id), "relação com conteúdo indisponível");
    requireRow(products.find(p => p.id === r.product_id), "relação de conteúdo com produto indisponível");
  }
  for (const r of [...affiliates, ...images]) requireRow(products.find(p => p.id === r.product_id), "imagem/link de produto indisponível");
  for (const r of contentLinks) requireRow(contents.find(c => c.id === r.content_id), "link de conteúdo indisponível");
  const slugFor = (id: string) => requireRow(products.find(p => p.id === id), "produto associado indisponível").slug;
  const config = primary(settings, "site_settings ausente ou duplicado");
  const featured = requireRow(contents.find(c => c.id === config.featured_content_id), "conteúdo destacado de site_settings inexistente ou inacessível");
  const linksFor = (row: Tables<"site_settings">) => Object.fromEntries(
    [["instagram",row.instagram_url],["tiktok",row.tiktok_url],["youtube",row.youtube_url]].filter((pair): pair is [string,string] => pair[1] !== null),
  );
  return {
    categories: categories.map(c => ({ slug:c.slug, name:c.name, symbol:c.symbol ?? "", description:c.description ?? "" })),
    products: products.map(p => {
      const category = requireRow(categories.find(c => c.id === p.category_id), `produto ${p.slug} sem categoria ativa`);
      const link = primary(affiliates.filter(l => l.product_id === p.id && l.is_primary), `produto ${p.slug} sem link primário ativo ou duplicado`);
      const image = primary(images.filter(i => i.product_id === p.id && i.is_primary), `produto ${p.slug} sem imagem principal ou duplicada`);
      return {
        slug:p.slug, name:p.name, description:p.description ?? "", category:category.slug, categoryName:category.name,
        affiliateUrl:link.url, image:image.storage_path, mobileImage:image.mobile_storage_path ?? undefined,
        collections:collections.filter(c => collectionProducts.some(r => r.collection_id === c.id && r.product_id === p.id)).map(c => c.name),
        ...productPresentation(p.slug),
      };
    }),
    collections: collections.map(c => ({
      slug:c.slug, name:c.name, description:c.description ?? "", styleIndex:c.style_index ?? 0,
      slugs:collectionProducts.filter(r => r.collection_id === c.id).sort((a,b) => a.sort_order-b.sort_order).map(r => slugFor(r.product_id)),
    })),
    contents: contents.map(c => ({
      code:c.code, contentType:c.content_type as Content["contentType"], title:c.title, description:c.description ?? "",
      cover:c.cover_path ?? undefined, mobileCover:c.mobile_cover_path ?? undefined,
      links:Object.fromEntries(contentLinks.filter(l => l.content_id === c.id).map(l => [l.platform,l.url])),
      slugs:contentProducts.filter(r => r.content_id === c.id).sort((a,b) => a.sort_order-b.sort_order).map(r => slugFor(r.product_id)),
    })),
    settings: { name:config.site_name, tagline:config.tagline ?? "", footerText:config.footer_text ?? "", links:linksFor(config), featuredContentCode:featured.code },
  };
}
