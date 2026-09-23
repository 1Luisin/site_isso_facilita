"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { gaMeasurementId } from "./analytics-config";

export type PageType = "home" | "product" | "content" | "category" | "collection";
export type AnalyticsContext = {
  pageType: PageType;
  contentCode?: string;
};

type AffiliateClick = AnalyticsContext & {
  product: { slug: string; name: string };
};

export function trackAffiliateClick({ product, pageType, contentCode }: AffiliateClick) {
  if (!gaMeasurementId || typeof window === "undefined") return;
  try {
    // Explicit allowlist: never forward the product object, price or affiliate URL.
    sendGAEvent("event", "affiliate_click", {
      product_slug: product.slug,
      product_name: product.name,
      affiliate_network: "shopee",
      page_type: pageType,
      ...(contentCode ? { content_code: contentCode } : {}),
    });
  } catch {
    // Best effort: analytics must never interrupt the native link navigation.
  }
}
