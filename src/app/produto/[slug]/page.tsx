import { AffiliateLink } from "@/components/affiliate-link";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCatalogSnapshot } from "@/lib/data-source";
import { ProductArt } from "@/components/art";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const snapshot = await getPublicCatalogSnapshot();
  const { products: publishedProducts } = snapshot;
  const { slug } = await params;
  const product = publishedProducts.find((product) => product.slug === slug);
  if (!product) notFound();
  return pageMetadata({
    title: product.name,
    description: product.description,
    path: `/produto/${product.slug}`,
    image: product.image ? `/social/produto-${product.slug}.jpg` : undefined,
    imageAlt: product.name,
  });
}
export const dynamicParams = false;
export async function generateStaticParams() {
  const { products: publishedProducts } = await getPublicCatalogSnapshot();
  return publishedProducts.map(item => ({ slug: item.slug }));
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const snapshot = await getPublicCatalogSnapshot();
  const { products: publishedProducts, categories } = snapshot;
  const { slug } = await params;
  const product = publishedProducts.find((p) => p.slug === slug);
  if (!product) notFound();
  const category = categories.find((c) => c.slug === product.category)!;
  return (
    <div className="page-wrap">
      <nav className="breadcrumbs" aria-label="Localização">
        <Link href="/">Início</Link>
        <span>/</span>
        <Link href={"/categoria/" + category.slug}>{category.name}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <section className="product-detail">
        <div className="detail-image">
          <ProductArt
            product={product}
            sizes="(max-width: 580px) calc(100vw - 62px), (max-width: 1200px) calc((100vw - 140px) / 2), 564px"
            eager
          />
          <span>Confira as opções disponíveis na loja.</span>
        </div>
        <div className="detail-copy">
          <span className="pill">
            {category.symbol} {category.name}
          </span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <AffiliateLink className="primary-button" product={{ slug: product.slug, name: product.name, affiliateUrl: product.affiliateUrl }} pageType="product">
            Ver preço na loja ↗
          </AffiliateLink>
          <p className="micro">
            Confira preço, opções e disponibilidade diretamente na loja.
          </p>
          <div className="detail-note">
            ♡ Um detalhe para deixar sua rotina mais bonita.
          </div>
        </div>
      </section>
      <section className="section">
        <h2>Você também pode gostar</h2>
        <ProductGrid pageType="product"
          items={publishedProducts.filter(
            (p) => p.slug !== slug && p.category === product.category,
          )}
        />
      </section>
    </div>
  );
}
