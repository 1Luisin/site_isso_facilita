import { notFound } from "next/navigation";
import Link from "next/link";
import { publishedCollections, publishedProducts } from "@/lib/data";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = publishedCollections.find(
    (collection) => collection.slug === slug,
  );
  if (!collection) notFound();
  return pageMetadata({
    title: collection.name,
    description: `Explore os achadinhos da coleção ${collection.name} no Isso Facilita!`,
    path: `/colecao/${collection.slug}`,
  });
}
export const dynamicParams = false;
export const generateStaticParams = () =>
  publishedCollections.map(({ slug }) => ({ slug }));
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
        items={publishedProducts.filter((p) => p.collections.includes(title))}
      />
    </div>
  );
}
