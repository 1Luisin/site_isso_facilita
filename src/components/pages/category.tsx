import { translate, localizedPath, type Language } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocalizedCatalog } from "@/lib/localized-catalog";
import { Catalog } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}, language: Language = "pt") {

  const snapshot = await getLocalizedCatalog(language);
  const { categories } = snapshot;
  const { slug } = await params;
  const category = categories.find((category) => category.slug === slug);
  if (!category) notFound();
  return pageMetadata({
    title: `${category.name} · ${language === "en" ? "Finds" : "Achadinhos"}`,
    description: category.description,
    path: localizedPath(`/categoria/${category.slug}`, language), language,
  });
}
export async function generateStaticParams() {
  const { categories } = await getLocalizedCatalog("pt");
  return categories.map(item => ({ slug: item.slug }));
}
export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}, language: Language = "pt") {
 const t = (text:string) => translate(language,text);
  const snapshot = await getLocalizedCatalog(language);
  const { categories, products: publishedProducts, collections } = snapshot;
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();
  return (
    <div className="page-wrap">
      <Link className="back-link" href={localizedPath("/", language)}>
        {t("← Todos os achadinhos")}{" "}</Link>
      <div className="page-heading">
        <span>{category.symbol}</span>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
      </div>
      <Catalog language={language} categories={categories} collections={collections} pageType="category" items={publishedProducts.filter((p) => p.category === slug)} />
    </div>
  );
}
