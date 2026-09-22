"use client";
import { useState } from "react";
import Link from "next/link";
import { categories, collections, money, type Product } from "@/lib/data";
import { ProductArt } from "./art";
export function ProductCard({ product }: { product: Product }) {
  const [favorite, setFavorite] = useState(false);
  return (
    <article className="product-card">
      <div className="card-image">
        <Link
          href={"/produto/" + product.slug}
          aria-label={"Conhecer " + product.name}
        >
          <ProductArt product={product} />
        </Link>
        <button
          className={"favorite " + (favorite ? "selected" : "")}
          aria-label={
            (favorite ? "Remover dos" : "Adicionar aos") +
            " favoritos: " +
            product.name +
            " (temporário)"
          }
          aria-pressed={favorite}
          onClick={() => setFavorite(!favorite)}
        >
          {favorite ? "♥" : "♡"}
        </button>
      </div>
      <div className="card-body">
        <span className="eyebrow">
          {categories.find((c) => c.slug === product.category)?.name}
        </span>
        <h3>
          <Link href={"/produto/" + product.slug}>{product.name}</Link>
        </h3>
        <p className="price">
          <span>a partir de </span>
          {money(product.price)}
        </p>
        <a
          className="shop-button"
          href={product.affiliateUrl}
          target="_blank"
          rel="sponsored noopener noreferrer"
        >
          Ver produto <span>↗</span>
        </a>
      </div>
    </article>
  );
}
export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="product-grid">
      {items.map((p) => (
        <ProductCard product={p} key={p.slug} />
      ))}
    </div>
  );
}
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function Catalog({ items }: { items: Product[] }) {
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
          <span className="eyebrow">ESCOLHIDOS COM CARINHO</span>
          <h2>
            Encontre seu próximo favorito <span>♡</span>
          </h2>
        </div>
        <span className="muted">{filtered.length} achadinhos</span>
      </div>
      <label className="search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="O que facilitaria o seu dia?"
          aria-label="Buscar produtos"
        />
        <span className="search-hint">um mimo, uma ideia...</span>
      </label>
      <div className="filter-row" aria-label="Filtrar por categoria">
        <button
          className={!category ? "active" : ""}
          onClick={() => setCategory("")}
        >
          Todos os achadinhos
        </button>
        {categories.map((c) => (
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
        <label htmlFor="collection">Sua coleção:</label>
        <select
          id="collection"
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
        >
          <option value="">Todas as coleções</option>
          {collections.map((c) => (
            <option key={c}>{c}</option>
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
            Limpar filtros ×
          </button>
        )}
      </div>
      {filtered.length ? (
        <ProductGrid items={filtered} />
      ) : (
        <div className="empty">
          <span>✿</span>
          <h3>Nenhum achadinho por aqui ainda</h3>
          <p>Tente outra palavra ou limpe os filtros.</p>
        </div>
      )}
      <p className="micro">
        Preços e ilustrações demonstrativos. Os cinco produtos do carrossel #001
        têm links de afiliado cadastrados; os demais ainda usam links de
        exemplo. Favoritos ficam apenas nesta sessão da página.
      </p>
    </section>
  );
}
