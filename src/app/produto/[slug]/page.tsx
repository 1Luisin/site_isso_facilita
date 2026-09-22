import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedProducts, categories } from "@/lib/data";
import { ProductArt } from "@/components/art";
import { ProductGrid } from "@/components/catalog";
export const dynamicParams = false;
export const generateStaticParams = () =>
  publishedProducts.map((p) => ({ slug: p.slug }));
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
          <ProductArt product={product} />
          <span>Confira as opções disponíveis na loja.</span>
        </div>
        <div className="detail-copy">
          <span className="pill">
            {category.symbol} {category.name}
          </span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <a
            className="primary-button"
            href={product.affiliateUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
          >
            Ver preço na loja ↗
          </a>
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
        <ProductGrid
          items={publishedProducts.filter(
            (p) => p.slug !== slug && p.category === product.category,
          )}
        />
      </section>
    </div>
  );
}
