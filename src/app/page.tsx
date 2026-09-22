import Link from "next/link";
import { Catalog, ProductGrid } from "@/components/catalog";
import { ProductArt } from "@/components/art";
import {
  products,
  categories,
  collections,
  videos,
  latestVideo,
  videoProducts,
} from "@/lib/data";
export default function Home() {
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
            <ProductArt product={products[0]} />
            <span>luz boa + cantinho favorito ♡</span>
          </div>
          <div className="mini-photo">
            <ProductArt product={products[3]} />
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
        {categories.map((c) => (
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
          <Link className="text-link" href={"/v/" + latestVideo.code}>
            Ver vídeo #{latestVideo.code} ↗
          </Link>
        </div>
        <div className="video-caption">
          <span className="video-code">▶ #{latestVideo.code}</span>
          <p>{latestVideo.title}</p>
          <span className="muted">uma seleção para salvar ♡</span>
        </div>
        <ProductGrid items={videoProducts(latestVideo.slugs)} />
      </section>
      <section id="colecoes" className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">QUAL É A SUA VIBE?</span>
            <h2>Um achadinho para cada cantinho</h2>
          </div>
        </div>
        <div className="collections">
          {collections.map((c, i) => (
            <Link
              href={
                "/colecao/" +
                [
                  "setup-rosa",
                  "setup-minimalista",
                  "ate-30",
                  "home-office-feminino",
                ][i]
              }
              className={"collection collection-" + i}
              key={c}
            >
              <span>{["♡", "☼", "✧", "✿"][i]}</span>
              <small>COLEÇÃO {String(i + 1).padStart(2, "0")}</small>
              <h3>{c}</h3>
              <span className="collection-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <Catalog items={products} />
      <section id="videos" className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DO FEED PARA O SEU CANTINHO</span>
            <h2>Encontre pelo vídeo</h2>
          </div>
        </div>
        <div className="video-list">
          {videos.map((v) => (
            <Link href={"/v/" + v.code} key={v.code}>
              <span className="video-code">▶ #{v.code}</span>
              <h3>{v.title}</h3>
              <p>
                {v.slugs.length} achadinhos <span>↗</span>
              </p>
            </Link>
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
