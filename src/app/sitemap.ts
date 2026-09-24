import type { MetadataRoute } from "next";
import { getPublicCatalogSnapshot } from "@/lib/data-source";
import { categoriesWithProducts } from "@/lib/data-source/types";
import { absoluteUrl } from "@/lib/site";
export const dynamic = "force-static";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await getPublicCatalogSnapshot();
  const { products: publishedProducts, collections: publishedCollections, contents } = snapshot;
  const categoriesWithPublishedProducts = categoriesWithProducts(snapshot);
  const paths = [
    "/",
    "/privacidade",
    ...categoriesWithPublishedProducts.map(({ slug }) => `/categoria/${slug}`),
    ...publishedCollections.map(({ slug }) => `/colecao/${slug}`),
    ...publishedProducts.map(({ slug }) => `/produto/${slug}`),
    ...contents.map(({ code }) => `/v/${code}`),
  ];
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
