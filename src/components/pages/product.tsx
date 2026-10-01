import { translate, localizedPath, type Language } from "@/lib/i18n";
import { socialImage } from "@/lib/social-image";
import { AffiliateLink } from "@/components/affiliate-link";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocalizedCatalog } from "@/lib/localized-catalog";
import { ProductArt } from "@/components/art";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}, language: Language = "pt") {

  const snapshot = await getLocalizedCatalog(language);
  const { products: publishedProducts } = snapshot;
  const { slug } = await params;
  const product = publishedProducts.find((product) => product.slug === slug);
  if (!product) notFound();
  return pageMetadata({
    title: product.name,
    description: product.description,
    path: localizedPath(`/produto/${product.slug}`, language), language,
    image: socialImage(`/social/produto-${product.slug}.jpg`),
    imageAlt: product.name,
  });
}
export async function generateStaticParams() {
  const { products: publishedProducts } = await getLocalizedCatalog("pt");
  return publishedProducts.map(item => ({ slug: item.slug }));
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}, language: Language = "pt") {
 const t = (text:string) => translate(language,text);
  const snapshot = await getLocalizedCatalog(language);
  const { products: publishedProducts, categories } = snapshot;
  const { slug } = await params;
  const product = publishedProducts.find((p) => p.slug === slug);
  if (!product) notFound();
  const category = categories.find((c) => c.slug === product.category)!;
  return (
    <div className="page-wrap">
      <nav className="breadcrumbs" aria-label={t("Localização")}>
        <Link href={localizedPath("/", language)}>{t("Início")}</Link>
        <span>/</span>
        <Link href={localizedPath("/categoria/" + category.slug, language)}>{category.name}</Link>
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
          <span>{t("Confira as opções disponíveis na loja.")}</span>
        </div>
        <div className="detail-copy">
          <span className="pill">
            {category.symbol} {category.name}
          </span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <AffiliateLink className="primary-button" product={{ slug: product.slug, name: product.name, affiliateUrl: product.affiliateUrl }} pageType="product">
            {t("Ver preço na loja ↗")}{" "}</AffiliateLink>
          <p className="micro">
            {t("Confira preço, opções e disponibilidade diretamente na loja.")}{" "}</p>
          <div className="detail-note">
            {t("♡ Um detalhe para deixar sua rotina mais bonita.")}{" "}</div>
        </div>
      </section>
      <section className="section">
        <h2>{t("Você também pode gostar")}</h2>
        <ProductGrid language={language} pageType="product"
          items={publishedProducts.filter(
            (p) => p.slug !== slug && p.category === product.category,
          )}
        />
      </section>
    </div>
  );
}
