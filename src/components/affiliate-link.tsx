"use client";

import type { ReactNode } from "react";
import type { Product } from "@/lib/data";
import { trackAffiliateClick, type AnalyticsContext } from "@/lib/analytics";

type AffiliateLinkProps = AnalyticsContext & {
  product: Pick<Product, "slug" | "name" | "affiliateUrl">;
  className?: string;
  children: ReactNode;
};

export function AffiliateLink({ product, pageType, contentCode, className, children }: AffiliateLinkProps) {
  const track = () => trackAffiliateClick({ product, pageType, contentCode });
  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      className={className}
      onClick={track}
      onAuxClick={(event) => { if (event.button === 1) track(); }}
    >
      {children}
    </a>
  );
}
