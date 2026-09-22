import { notFound } from "next/navigation";
import Link from "next/link";
import { collections, products } from "@/lib/data";
import { ProductGrid } from "@/components/catalog";
const slugs = [
  "setup-rosa",
  "setup-minimalista",
  "ate-30",
  "home-office-feminino",
];
export const dynamicParams = false;
export const generateStaticParams = () => slugs.map((slug) => ({ slug }));
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const title = collections[slugs.indexOf(slug)];
  if (!title) notFound();
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
      <ProductGrid
        items={products.filter((p) => p.collections.includes(title))}
      />
    </div>
  );
}
