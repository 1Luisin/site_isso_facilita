import { translate, localizedPath, type Language } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocalizedCatalog } from "@/lib/localized-catalog";
import { productsBySlugs } from "@/lib/data-source/types";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}, language: Language = "pt") {

  const snapshot = await getLocalizedCatalog(language);
  const { collections: publishedCollections } = snapshot;
  const { slug } = await params;
  const collection = publishedCollections.find(
    (collection) => collection.slug === slug,
  );
  if (!collection) notFound();
  return pageMetadata({
    title: collection.name,
    description: collection.description || (language === "en" ? `Explore the finds in the ${collection.name} collection at Isso Facilita!` : `Explore os achadinhos da coleção ${collection.name} no Isso Facilita!`),
    path: localizedPath(`/colecao/${collection.slug}`, language), language,
  });
}
export async function generateStaticParams() {
  const { collections: publishedCollections } = await getLocalizedCatalog("pt");
  return publishedCollections.map(item => ({ slug: item.slug }));
}
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}, language: Language = "pt") {
 const t = (text:string) => translate(language,text);
  const snapshot = await getLocalizedCatalog(language);
  const { collections: publishedCollections } = snapshot;
  const { slug } = await params;
  const collection = publishedCollections.find(
    (collection) => collection.slug === slug,
  );
  if (!collection) notFound();
  const title = collection.name;
  return (
    <div className="page-wrap">
      <Link className="back-link" href={localizedPath("/#colecoes", language)}>
        {t("← Todas as coleções")}{" "}</Link>
      <div className="page-heading">
        <span>♡</span>
        <h1>{title}</h1>
        <p>{collection.description || t("Pequenas descobertas que combinam entre si — e com você.")}</p>
      </div>
      <ProductGrid language={language} pageType="collection"
        items={productsBySlugs(snapshot, collection.slugs)}
      />
    </div>
  );
}
