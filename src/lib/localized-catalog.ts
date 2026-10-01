import "server-only";
import { getPublicCatalogSnapshot } from "./data-source";
import { translate, type Language } from "./i18n";
export async function getLocalizedCatalog(language: Language) {
  const snapshot = await getPublicCatalogSnapshot();
  if (language === "pt") return snapshot;
  const t = (text: string) => translate(language, text);
  return {
    ...snapshot,
    categories: snapshot.categories.map(c => ({...c, name:t(c.name), description:t(c.description)})),
    collections: snapshot.collections.map(c => ({...c, name:t(c.name), description:t(c.description)})),
    products: snapshot.products.map(p => ({...p, name:t(p.name), description:t(p.description), categoryName:t(p.categoryName), collections:p.collections.map(t), imageAlt:t(p.imageAlt || p.name)})),
    contents: snapshot.contents.map(c => ({...c, title:t(c.title), description:t(c.description)})),
    settings: {...snapshot.settings, tagline:t(snapshot.settings.tagline), footerText:t(snapshot.settings.footerText)},
  };
}
