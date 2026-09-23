import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, publishedProducts } from "@/lib/data";
import { Catalog } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((category) => category.slug === slug);
  if (!category) notFound();
  return pageMetadata({
    title: `${category.name} · Achadinhos`,
    description: category.description,
    path: `/categoria/${category.slug}`,
  });
}
export const dynamicParams = false;
export const generateStaticParams = () =>
  categories.map((c) => ({ slug: c.slug }));
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  return (
    <div className="page-wrap">
      <Link className="back-link" href="/">
        ← Todos os achadinhos
      </Link>
      <div className="page-heading">
        <span>{category.symbol}</span>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
      </div>
      <Catalog pageType="category" items={publishedProducts.filter((p) => p.category === slug)} />
    </div>
  );
}
