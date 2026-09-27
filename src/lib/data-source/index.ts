import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { loadPublicCatalogSnapshot } from "./load";
import { PUBLIC_CATALOG_TAG } from "./cache-policy";

export async function getPublicCatalogSnapshot() {
  "use cache";
  cacheLife("catalog");
  cacheTag(PUBLIC_CATALOG_TAG);
  return loadPublicCatalogSnapshot();
}
