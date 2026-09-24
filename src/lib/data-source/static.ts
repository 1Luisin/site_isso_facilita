import "server-only";
import { categories, publishedProducts, publishedCollections, publishedVideos, currentVideoCode } from "../data.ts";
import { productPresentation } from "./presentation.ts";
import type { PublicCatalogSnapshot } from "./types.ts";
export function getStaticSnapshot(): PublicCatalogSnapshot {
  const products = publishedProducts.map(p => ({
    slug: p.slug, name: p.name, description: p.description,
    category: p.category, categoryName: categories.find(c => c.slug === p.category)?.name ?? "",
    collections: publishedCollections.filter(c => p.collections.includes(c.name)).map(c => c.name),
    affiliateUrl: p.affiliateUrl, image: p.image ?? "",
    mobileImage: p.image?.replace(".webp", "-480.webp"), ...productPresentation(p.slug),
  }));
  return {
    categories,
    products,
    collections: publishedCollections.map(c => ({
      ...c, description: "", slugs: products.filter(p => p.collections.includes(c.name)).map(p => p.slug),
    })),
    contents: publishedVideos.map(c => ({
      code: c.code, contentType: "carousel", title: c.title, description: c.description,
      cover: c.cover, mobileCover: c.cover?.replace(".webp", "-540.webp"),
      links: { ...(c.instagramUrl ? { instagram: c.instagramUrl } : {}), ...(c.tiktokUrl ? { tiktok: c.tiktokUrl } : {}) },
      slugs: c.slugs.filter(slug => products.some(p => p.slug === slug)),
    })),
    settings: {
      name: "Isso Facilita!", tagline: "achadinhos que abraçam a rotina",
      footerText: "Alguns links podem ser de afiliado e podemos receber comissão pela compra, sem custo adicional para você.",
      links: {}, featuredContentCode: currentVideoCode,
    },
  };
}
