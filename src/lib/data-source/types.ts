export type Category = { slug: string; name: string; symbol: string; description: string };
export type Product = {
  slug: string; name: string; description: string; category: string; categoryName: string;
  collections: string[]; affiliateUrl: string; image: string; mobileImage?: string;
  art: string; color: string;
};
export type Collection = { slug: string; name: string; description: string; styleIndex: number; slugs: string[] };
export type Content = {
  code: string; contentType: "carousel" | "video" | "post" | "short";
  title: string; description: string; cover?: string; mobileCover?: string;
  links: Record<string, string>; slugs: string[];
};
export type PublicCatalogSnapshot = {
  categories: Category[]; products: Product[]; collections: Collection[]; contents: Content[];
  settings: { name: string; tagline: string; footerText: string; links: Record<string, string>; featuredContentCode: string };
};
export function categoriesWithProducts(snapshot: PublicCatalogSnapshot) {
  return snapshot.categories.filter(c => snapshot.products.some(p => p.category === c.slug));
}
export function productsBySlugs(snapshot: PublicCatalogSnapshot, slugs: string[]) {
  return slugs.map(slug => {
    const product = snapshot.products.find(p => p.slug === slug);
    if (!product) throw new Error(`Catálogo: produto associado indisponível: ${slug}.`);
    return product;
  });
}
