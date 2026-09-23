import type { MetadataRoute } from "next";
import {
  categories,
  publishedCollections,
  publishedProducts,
  publishedVideos,
} from "@/lib/data";
import { absoluteUrl } from "@/lib/site";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    ...categories.map(({ slug }) => `/categoria/${slug}`),
    ...publishedCollections.map(({ slug }) => `/colecao/${slug}`),
    ...publishedProducts.map(({ slug }) => `/produto/${slug}`),
    ...publishedVideos.map(({ code }) => `/v/${code}`),
  ];
  return paths.map((path) => ({ url: absoluteUrl(path) }));
}
