"use client";
import { translate, localizedPath, findsLabel, type Language } from "@/lib/i18n";
import { useState } from "react";
import Link from "next/link";
import type { Category, Collection, Product } from "@/lib/data-source/types";
import { ProductArt } from "./art";
import { AffiliateLink } from "./affiliate-link";
import type { AnalyticsContext } from "@/lib/analytics";
export function ProductCard({ product, pageType, contentCode, language = "pt" }: { product: Product; language?: Language } & AnalyticsContext) {
 const t = (text:string) => translate(language,text);
  const [favorite, setFavorite] = useState(false);
  return (
    <article className="product-card">
      <div className="card-image">
        <Link
          href={localizedPath("/produto/" + product.slug, language)}
          aria-label={(language === "en" ? "View " : "Conhecer ") + product.name}
        >
          <ProductArt product={product} />
        </Link>
        <button
          className={"favorite " + (favorite ? "selected" : "")}
          aria-label={
            (language === "en" ? (favorite ? "Remove from favorites: " : "Add to favorites: ") : (favorite ? "Remover dos favoritos: " : "Adicionar aos favoritos: ")) +
            product.name
          }
          aria-pressed={favorite}
          onClick={() => setFavorite(!favorite)}
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="card-body">
        <span className="eyebrow">
          {product.categoryName}
        </span>
        <h3>
          <Link href={localizedPath("/produto/" + product.slug, language)}>{product.name}</Link>
        </h3>
        <AffiliateLink className="shop-button" product={product} pageType={pageType} contentCode={contentCode}>
          {t("Ver preço na loja")}{" "}<span>↗</span>
        </AffiliateLink>
      </div>
    </article>
  );
}
export function ProductGrid({ items, pageType, contentCode, language = "pt" }: { items: Product[]; language?: Language } & AnalyticsContext) {
 const t = (text:string) => translate(language,text);
  if (!items.length) {
    return (
      <div className="empty">
        <span>✿</span>
        <h3>{t("Novos achadinhos em breve")}</h3>
        <p>{t("Enquanto isso, explore as outras seleções.")}</p>
        <Link href={localizedPath("/#catalogo", language)} className="text-link">
          {t("Ver todos os achadinhos ↗")}{" "}</Link>
      </div>
    );
  }
  return (
    <div className="product-grid">
      {items.map((p) => (
        <ProductCard language={language} product={p} key={p.slug} pageType={pageType} contentCode={contentCode} />
      ))}
    </div>
  );
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function Catalog({ items, categories, collections, pageType, contentCode, language = "pt" }: { items: Product[]; categories: Category[]; collections: Collection[]; language?: Language } & AnalyticsContext) {
 const t = (text:string) => translate(language,text);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [collection, setCollection] = useState("");
  const filtered = items.filter(
    (p) =>
      (!category || p.category === category) &&
      (!collection || p.collections.includes(collection)) &&
      normalize(p.name + " " + p.description).includes(normalize(query)),
  );
  return (
    <section id="catalogo" className="section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t("ESCOLHIDOS COM CARINHO")}</span>
          <h2>
            {t("Encontre seu próximo favorito")}{" "}<span>♡</span>
          </h2>
        </div>
        <span className="muted">{findsLabel(filtered.length, language)}</span>
      </div>
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("O que facilitaria o seu dia?")}
          aria-label={t("Buscar produtos")}
        />
        <span className="search-hint">{t("um mimo, uma ideia...")}</span>
      </label>
      <div className="filter-row" aria-label={t("Filtrar por categoria")}>
        <button
          className={!category ? "active" : ""}
          onClick={() => setCategory("")}
        >
          {t("Todos os achadinhos")}{" "}</button>
        {categories
          .filter((c) => items.some((p) => p.category === c.slug))
          .map((c) => (
            <button
              key={c.slug}
              className={category === c.slug ? "active" : ""}
              onClick={() => setCategory(c.slug)}
            >
              {c.symbol} {c.name}
            </button>
          ))}
      </div>
      <div className="collection-filter">
        <label htmlFor="collection">{t("Sua coleção:")}</label>
        <select
          id="collection"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="">{t("Todas as coleções")}</option>
          {collections
            .filter((c) => items.some((p) => p.collections.includes(c.name)))
            .map((c) => (
              <option key={c.slug} value={c.name}>
                {c.name}
              </option>
            ))}
        </select>
        {(query || category || collection) && (
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setCollection("");
            }}
          >
            {t("Limpar filtros ×")}{" "}</button>
        )}
      </div>
      {filtered.length ? (
        <ProductGrid language={language} items={filtered} pageType={pageType} contentCode={contentCode} />
      ) : (
        <div className="empty">
          <span>✿</span>
          <h3>{t("Nenhum achadinho por aqui ainda")}</h3>
          <p>
            {items.length
              ? t("Tente outra palavra ou limpe os filtros.")
              : t("Novos achadinhos chegam em breve. Explore as outras seleções.")}
          </p>
          {!items.length && (
            <Link href={localizedPath("/#catalogo", language)} className="text-link">
              {t("Ver todos os achadinhos ↗")}{" "}</Link>
          )}
        </div>
      )}
    </section>
  );
}
