import type { MetadataRoute } from "next";
import { getPublicCatalogSnapshot } from "@/lib/data-source";
import { categoriesWithProducts } from "@/lib/data-source/types";
import { absoluteUrl } from "@/lib/site";
import { localizedPath } from "@/lib/i18n";
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
  return paths.flatMap((path) => [path, localizedPath(path,"en")].map(localPath => ({
    url: absoluteUrl(localPath),
    alternates: {languages: {"pt-BR":absoluteUrl(path),"en-US":absoluteUrl(localizedPath(path,"en"))}},
  })));
}
