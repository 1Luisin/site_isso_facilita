import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicCatalogSnapshot } from "@/lib/data-source";
import { productsBySlugs } from "@/lib/data-source/types";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const snapshot = await getPublicCatalogSnapshot();
  const { collections: publishedCollections } = snapshot;
  const { slug } = await params;
  const collection = publishedCollections.find(
    (collection) => collection.slug === slug,
  );
  if (!collection) notFound();
  return pageMetadata({
    title: collection.name,
    description: collection.description || `Explore os achadinhos da coleção ${collection.name} no Isso Facilita!`,
    path: `/colecao/${collection.slug}`,
  });
}
export const dynamicParams = false;
export async function generateStaticParams() {
  const { collections: publishedCollections } = await getPublicCatalogSnapshot();
  return publishedCollections.map(item => ({ slug: item.slug }));
}
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const snapshot = await getPublicCatalogSnapshot();
  const { collections: publishedCollections } = snapshot;
  const { slug } = await params;
  const collection = publishedCollections.find(
    (collection) => collection.slug === slug,
  );
  if (!collection) notFound();
  const title = collection.name;
  return (
    <div className="page-wrap">
      <Link className="back-link" href="/#colecoes">
        ← Todas as coleções
      </Link>
      <div className="page-heading">
        <span>♡</span>
        <h1>{title}</h1>
        <p>Pequenas descobertas que combinam entre si — e com você.</p>
      </div>
      <ProductGrid pageType="collection"
        items={productsBySlugs(snapshot, collection.slugs)}
      />
    </div>
  );
}
