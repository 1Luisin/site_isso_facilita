import "server-only";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { PublicCatalogSnapshot } from "./types.ts";

export async function validateSnapshot(snapshot: PublicCatalogSnapshot) {
  const fail = (message: string): never => { throw new Error(`Catálogo público inválido: ${message}.`); };
  const unique = (values: string[], label: string) => {
    if (new Set(values).size !== values.length) fail(`${label} duplicados`);
  };
  unique(snapshot.products.map(p => p.slug), "slugs de produtos");
  unique(snapshot.categories.map(c => c.slug), "slugs de categorias");
  unique(snapshot.collections.map(c => c.slug), "slugs de coleções");
  unique(snapshot.contents.map(c => c.code), "códigos de conteúdos");
  const files = new Set<string>(["/social/isso-facilita.jpg"]);
  const url = (value: string) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol === "https:" && !parsed.username && !parsed.password) return;
    } catch {}
    fail("link público deve ser uma URL HTTPS válida");
  };
  for (const p of snapshot.products) {
    if (!snapshot.categories.some(c => c.slug === p.category)) fail(`produto ${p.slug} sem categoria`);
    if (!p.name || !p.affiliateUrl || !p.image) fail(`produto ${p.slug} sem nome, link primário ou imagem principal`);
    url(p.affiliateUrl);
    if (new URL(p.affiliateUrl).hostname === "shopee.com.br" && new URL(p.affiliateUrl).pathname === "/") fail(`produto ${p.slug} com link placeholder`);
    if (p.collections.some(name => !snapshot.collections.some(c => c.name === name && c.slugs.includes(p.slug)))) fail(`coleções inconsistentes em ${p.slug}`);
    files.add(p.image);
    if (p.mobileImage) files.add(p.mobileImage);
    files.add(`/social/produto-${p.slug}.jpg`);
  }
  for (const c of [...snapshot.collections, ...snapshot.contents]) {
    unique(c.slugs, "produtos associados");
    if (c.slugs.some(slug => !snapshot.products.some(p => p.slug === slug))) fail("relação com produto indisponível");
  }
  for (const c of snapshot.contents) {
    if (!c.slugs.length) fail(`conteúdo #${c.code} sem produtos`);
    if (!["carousel","video","post","short"].includes(c.contentType)) fail(`tipo de conteúdo inválido: #${c.code}`);
    if (c.cover) { files.add(c.cover); files.add(`/social/carrossel-${c.code}.jpg`); }
    if (c.mobileCover) files.add(c.mobileCover);
    Object.values(c.links).forEach(url);
  }
  Object.values(snapshot.settings.links).forEach(url);
  if (!snapshot.contents.some(c => c.code === snapshot.settings.featuredContentCode)) fail("conteúdo destacado ausente ou inacessível");
  const root = path.resolve(process.cwd(), "public");
  await Promise.all([...files].map(async file => {
    if (!/^\/(products|videos|social)\/[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/.test(file)) fail("caminho de imagem local inválido");
    try {
      if (!(await stat(path.join(root, file.slice(1)))).isFile()) fail(`asset não é arquivo: ${file}`);
    } catch { fail(`asset local ausente: ${file}; revise imagens e geração social antes de publicar`); }
  }));
  return snapshot;
}
