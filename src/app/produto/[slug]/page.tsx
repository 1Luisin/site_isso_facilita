import Link from "next/link";
import { notFound } from "next/navigation";
import { products, categories, money } from "@/lib/data";
import { ProductArt } from "@/components/art";
import { ProductGrid } from "@/components/catalog";
export const dynamicParams = false;
export const generateStaticParams = () =>
  products.map((p) => ({ slug: p.slug }));
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
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
          <span>Ilustração demonstrativa · imagem real em breve</span>
        </div>
        <div className="detail-copy">
          <span className="pill">
            {category.symbol} {category.name}
          </span>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <p className="detail-price">
            <small>a partir de</small>
            {money(product.price)}
          </p>
          <a
            className="primary-button"
            href={product.affiliateUrl}
            target="_blank"
            rel="sponsored noopener noreferrer"
          >
            Ver produto ↗
          </a>
          <p className="micro">
            {product.affiliateUrl === "https://shopee.com.br/"
              ? "Preço fictício. Link demonstrativo: abre a página inicial da loja; o link específico será adicionado depois."
              : "Preço fictício. O botão abre o link de afiliado do produto. Confira preço, opções e disponibilidade na loja."}
          </p>
          <div className="detail-note">
            ♡ Um detalhe para deixar sua rotina mais bonita.
          </div>
        </div>
      </section>
      <section className="section">
        <h2>Você também pode gostar</h2>
        <ProductGrid
          items={products.filter(
            (p) => p.slug !== slug && p.category === product.category,
          )}
        />
      </section>
    </div>
  );
}
