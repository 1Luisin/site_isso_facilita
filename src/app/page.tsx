import Link from "next/link";
import Image from "next/image";
import { site, pageMetadata } from "@/lib/site";
export const metadata = pageMetadata({
  title: site.title,
  description: site.description,
  path: "/",
});
import { Catalog, ProductGrid } from "@/components/catalog";
import { ProductArt } from "@/components/art";
import { getPublicCatalogSnapshot } from "@/lib/data-source";
import { categoriesWithProducts, productsBySlugs } from "@/lib/data-source/types";
export default async function Home() {
  const snapshot = await getPublicCatalogSnapshot();
  const { products: publishedProducts, collections: publishedCollections, contents, categories } = snapshot;
  const categoriesWithPublishedProducts = categoriesWithProducts(snapshot);
  const featuredContent = contents.find(c => c.code === snapshot.settings.featuredContentCode)!;
  const lamp = publishedProducts.find(
    (product) => product.slug === "luminaria-de-mesa",
  );
  const figurine = publishedProducts.find(
    (product) => product.slug === "bonequinho-decorativo",
  );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="pill">✧ SEU CANTINHO DE BOAS DESCOBERTAS</span>
          <h1>
            A vida fica mais leve
            <br />
            com <em>pequenos achados.</em>
          </h1>
          <p>
            Coisas úteis, bonitas e com aquele toque de carinho.
            <br className="desktop-break" /> Encontre aqui os favoritos que você
            viu nos nossos vídeos.
          </p>
          <Link className="primary-button" href="#catalogo">
            Explorar os achadinhos <span>↗</span>
          </Link>
          <span className="hand-note">escolhidos a dedo, para você ♡</span>
        </div>
        <div className="hero-scrapbook">
          <span className="scribble">seu setup merece um mimo!</span>
          <div className="paper-photo">
            <div className="tape" />
            {lamp && <ProductArt product={lamp} sizes="246px" eager />}
            <span>luz boa + cantinho favorito ♡</span>
          </div>
          <div className="mini-photo">
            {figurine && <ProductArt product={figurine} sizes="137px" eager />}
            <span>fofura do dia ✿</span>
          </div>
          <span className="sticker">
            útil &<br />
            fofo!
          </span>
          <span className="hero-star">✧</span>
        </div>
      </section>
      <div className="category-strip">
        {categoriesWithPublishedProducts.map((c) => (
            <Link href={"/categoria/" + c.slug} key={c.slug}>
              <span>{c.symbol}</span>
              <div>
                <strong>{c.name}</strong>
                <small>explorar achadinhos ↗</small>
              </div>
            </Link>
          ))}
      </div>
      <section className="section latest">
        <div className="section-heading">
          <div>
            <span className="eyebrow">VIU NO FEED? TÁ AQUI!</span>
            <h2>
              Achadinhos do último vídeo <span>✿</span>
            </h2>
          </div>
          <Link className="text-link" href={"/v/" + featuredContent.code}>
            Ver vídeo #{featuredContent.code} ↗
          </Link>
        </div>
        <div className="video-caption">
          <span className="video-code">▶ #{featuredContent.code}</span>
          <p>{featuredContent.title}</p>
          <span className="muted">uma seleção para salvar ♡</span>
        </div>
        <ProductGrid pageType="home" contentCode={featuredContent.code} items={productsBySlugs(snapshot, featuredContent.slugs)} />
      </section>
      <section id="colecoes" className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">QUAL É A SUA VIBE?</span>
            <h2>Um achadinho para cada cantinho</h2>
          </div>
        </div>
        <div className="collections">
          {publishedCollections.map((c, i) => (
            <Link
              href={"/colecao/" + c.slug}
              className={"collection collection-" + c.styleIndex}
              key={c.slug}
            >
              <span>{["♡", "☼", "✧", "✿"][c.styleIndex]}</span>
              <small>COLEÇÃO {String(i + 1).padStart(2, "0")}</small>
              <h3>{c.name}</h3>
              <span className="collection-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <Catalog categories={categories} collections={publishedCollections} pageType="home" items={publishedProducts} />
      <section id="videos" className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DO FEED PARA O SEU CANTINHO</span>
            <h2>Encontre pelo vídeo</h2>
          </div>
        </div>
        <div className="video-features">
          {contents.map((v) => (
            <article className="video-feature" key={v.code}>
              {v.cover && (
                <Link
                  className="video-cover"
                  href={"/v/" + v.code}
                  aria-label={"Ver produtos do carrossel #" + v.code}
                >
                  <picture>
                    <source
                      type="image/webp"
                      srcSet={`${v.mobileCover ?? v.cover} 540w, ${v.cover} 1080w`}
                      sizes="(max-width: 580px) calc(100vw - 38px), 280px"
                    />
                    <Image
                      src={v.cover}
                      alt="Setup bonito do zero sem gastar uma fortuna — capa do carrossel #001"
                      width={1080}
                      height={1350}
                      sizes="(max-width: 580px) calc(100vw - 38px), 280px"
                    />
                  </picture>
                </Link>
              )}
              <div className="video-feature-copy">
                <span className="video-code">▶ #{v.code}</span>
                <h3>{v.title}</h3>
                <p>{v.description}</p>
                <p className="muted">
                  {productsBySlugs(snapshot, v.slugs).length} achadinhos neste carrossel
                </p>
                <Link className="primary-button" href={"/v/" + v.code}>
                  Ver produtos do carrossel ↗
                </Link>
                <div
                  className="video-social-links"
                  aria-label="Ver publicação original"
                >
                  {v.links.instagram && (
                    <a
                      href={v.links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver no Instagram ↗
                    </a>
                  )}
                  {v.links.tiktok && (
                    <a
                      href={v.links.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver no TikTok ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="closing-note">
        <span>♡</span>
        <h2>O simples também pode ser especial.</h2>
        <p>
          Uma curadoria de pequenos detalhes que facilitam — e deixam tudo mais
          bonito.
        </p>
      </aside>
    </>
  );
}
