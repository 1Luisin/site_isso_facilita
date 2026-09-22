import { notFound } from "next/navigation";
import Link from "next/link";
import { categories, products } from "@/lib/data";
import { Catalog } from "@/components/catalog";
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
      <Catalog items={products.filter((p) => p.category === slug)} />
    </div>
  );
}
