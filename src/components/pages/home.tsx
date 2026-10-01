import { translate, localizedPath, contentLabel, findsLabel, type Language } from "@/lib/i18n";

import Link from "next/link";
import Image from "next/image";
import { site, pageMetadata } from "@/lib/site";
export function localizedMetadata(language: Language = "pt") { const t = (text:string) => translate(language,text); return pageMetadata({
  title: t(site.title),
  description: t(site.description),
  path: localizedPath("/", language), language,
}); }
import { Catalog, ProductGrid } from "@/components/catalog";
import { ProductArt } from "@/components/art";
import { getLocalizedCatalog } from "@/lib/localized-catalog";
import { categoriesWithProducts, productsBySlugs } from "@/lib/data-source/types";
export default async function Home({language = "pt"}: {language?: Language} = {}) {
 const t = (text:string) => translate(language,text);
  const snapshot = await getLocalizedCatalog(language);
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
          <span className="pill">{t("✧ SEU CANTINHO DE BOAS DESCOBERTAS")}</span>
          <h1>
            {t("A vida fica mais leve")}{" "}<br />
            {t("com")}{" "}<em>{t("pequenos achados.")}</em>
          </h1>
          <p>
            {t("Coisas úteis, bonitas e com aquele toque de carinho.")}{" "}<br className="desktop-break" /> {t("Encontre aqui os favoritos que você viu nas nossas publicações.")}{" "}</p>
          <Link className="primary-button" href="#catalogo">
            {t("Explorar os achadinhos")}{" "}<span>↗</span>
          </Link>
          <span className="hand-note">{t("escolhidos a dedo, para você ♡")}</span>
        </div>
        <div className="hero-scrapbook">
          <span className="scribble">{t("seu setup merece um mimo!")}</span>
          <div className="paper-photo">
            <div className="tape" />
            {lamp && <ProductArt product={lamp} sizes="246px" eager />}
            <span>{t("luz boa + cantinho favorito ♡")}</span>
          </div>
          <div className="mini-photo">
            {figurine && <ProductArt product={figurine} sizes="137px" eager />}
            <span>{t("fofura do dia ✿")}</span>
          </div>
          <span className="sticker">
            {t("útil &")}<br />
            {t("fofo!")}{" "}</span>
          <span className="hero-star">✧</span>
        </div>
      </section>
      <div className="category-strip">
        {categoriesWithPublishedProducts.map((c) => (
            <Link href={localizedPath("/categoria/" + c.slug, language)} key={c.slug}>
              <span>{c.symbol}</span>
              <div>
                <strong>{c.name}</strong>
                <small>{t("explorar achadinhos ↗")}</small>
              </div>
            </Link>
          ))}
      </div>
      <section className="section latest">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("VIU NO FEED? TÁ AQUI!")}</span>
            <h2>
              {t("Achadinhos do conteúdo em destaque")}{" "}<span>✿</span>
            </h2>
          </div>
          <Link className="text-link" href={localizedPath("/v/" + featuredContent.code, language)}>
            {language === "en" ? "View" : "Ver"} {contentLabel(featuredContent.contentType, language)} #{featuredContent.code} ↗
          </Link>
        </div>
        <div className="video-caption">
          <span className="video-code">▶ #{featuredContent.code}</span>
          <p>{featuredContent.title}</p>
          <span className="muted">{t("uma seleção para salvar ♡")}</span>
        </div>
        <ProductGrid language={language} pageType="home" contentCode={featuredContent.code} items={productsBySlugs(snapshot, featuredContent.slugs)} />
      </section>
      <section id="colecoes" className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("QUAL É A SUA VIBE?")}</span>
            <h2>{t("Um achadinho para cada cantinho")}</h2>
          </div>
        </div>
        <div className="collections">
          {publishedCollections.map((c, i) => (
            <Link
              href={localizedPath("/colecao/" + c.slug, language)}
              className={"collection collection-" + c.styleIndex}
              key={c.slug}
            >
              <span>{["♡", "☼", "✧", "✿"][c.styleIndex]}</span>
              <small>{t("COLEÇÃO")}{" "}{String(i + 1).padStart(2, "0")}</small>
              <h3>{c.name}</h3>
              <span className="collection-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <Catalog language={language} categories={categories} collections={publishedCollections} pageType="home" items={publishedProducts} />
      <section id="videos" className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t("DO FEED PARA O SEU CANTINHO")}</span>
            <h2>{t("Encontre pela publicação")}</h2>
          </div>
        </div>
        <div className="video-features">
          {contents.map((v) => (
            <article className="video-feature" key={v.code}>
              {v.cover && (
                <Link
                  className="video-cover"
                  href={localizedPath("/v/" + v.code, language)}
                  aria-label={`${language === "en" ? "View products from" : "Ver produtos do"} ${contentLabel(v.contentType, language)} #${v.code}`}
                >
                  <picture>
                    <source
                      type="image/webp"
                      srcSet={`${v.mobileCover ?? v.cover} 540w, ${v.cover} 1080w`}
                      sizes="(max-width: 580px) calc(100vw - 38px), 280px"
                    />
                    <Image
                      src={v.cover}
                      alt={`${v.title} — ${language === "en" ? "cover of" : "capa do"} ${contentLabel(v.contentType, language)} #${v.code}`}
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
                  {findsLabel(productsBySlugs(snapshot, v.slugs).length, language)} {language === "en" ? "in this" : "neste"} {contentLabel(v.contentType, language)}
                </p>
                <Link className="primary-button" href={localizedPath("/v/" + v.code, language)}>
                  {language === "en" ? "View products from this" : "Ver produtos do"} {contentLabel(v.contentType, language)} ↗
                </Link>
                <div
                  className="video-social-links"
                  aria-label={t("Ver publicação original")}
                >
                  {v.links.instagram && (
                    <a
                      href={v.links.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("Ver no Instagram ↗")}{" "}</a>
                  )}
                  {v.links.youtube && <a href={v.links.youtube} target="_blank" rel="noopener noreferrer">{t("Ver no YouTube ↗")}</a>}
                  {v.links.tiktok && (
                    <a
                      href={v.links.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("Ver no TikTok ↗")}{" "}</a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
      <aside className="closing-note">
        <span>♡</span>
        <h2>{t("O simples também pode ser especial.")}</h2>
        <p>
          {t("Uma curadoria de pequenos detalhes que facilitam — e deixam tudo mais bonito.")}{" "}</p>
      </aside>
    </>
  );
}
