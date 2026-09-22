export const categories = [
  {
    slug: "setup",
    name: "Setup",
    symbol: "⌘",
    description: "Um cantinho com a sua personalidade.",
  },
  {
    slug: "eletronicos",
    name: "Eletrônicos",
    symbol: "ϟ",
    description: "Pequenas tecnologias, grandes facilidades.",
  },
  {
    slug: "decoracao",
    name: "Decoração",
    symbol: "✿",
    description: "Detalhes que fazem a casa sorrir.",
  },
  {
    slug: "utilidades",
    name: "Utilidades",
    symbol: "◇",
    description: "Mais praticidade para os seus dias.",
  },
];
export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  art: string;
  color: string;
  description: string;
  collections: string[];
  image?: string;
  affiliateUrl: string;
};
export const collections = [
  "Setup rosa",
  "Setup minimalista",
  "Achadinhos até R$30",
  "Home office feminino",
];
export const products: Product[] = [
  {
    slug: "luminaria-de-mesa",
    name: "Luminária de mesa candy",
    category: "decoracao",
    price: 39.9,
    art: "lamp",
    color: "pink",
    description:
      "Uma luz aconchegante para acompanhar suas leituras e deixar a mesa ainda mais charmosa.",
    collections: ["Setup rosa", "Home office feminino"],
  },
  {
    slug: "mousepad",
    name: "Mousepad nuvem rosa",
    category: "setup",
    price: 24.9,
    art: "mat",
    color: "peach",
    description:
      "Um toque macio e delicado para o seu cantinho de trabalho ou estudo.",
    collections: ["Setup rosa", "Achadinhos até R$30", "Home office feminino"],
  },
  {
    slug: "fita-led",
    name: "Fita LED para o seu setup",
    category: "eletronicos",
    price: 19.9,
    art: "led",
    color: "lilac",
    description:
      "Ilumine os detalhes da sua mesa com uma atmosfera colorida e acolhedora.",
    collections: ["Setup rosa", "Achadinhos até R$30"],
  },
  {
    slug: "bonequinho-decorativo",
    name: "Coelhinho de companhia",
    category: "decoracao",
    price: 16.9,
    art: "bunny",
    color: "cream",
    description:
      "Um pequeno companheiro de mesa para dar uma dose extra de fofura à rotina.",
    collections: ["Setup rosa", "Achadinhos até R$30"],
  },
  {
    slug: "suporte-de-fone",
    name: "Suporte para fone",
    category: "setup",
    price: 29.9,
    art: "headphone",
    color: "pink",
    description:
      "Seu fone sempre à mão, com mais espaço livre e organização na mesa.",
    collections: ["Setup minimalista", "Achadinhos até R$30"],
  },
  {
    slug: "organizador-de-cabos",
    name: "Organizador de cabos",
    category: "utilidades",
    price: 12.9,
    art: "cables",
    color: "cream",
    description:
      "Pequenos organizadores para manter cada cabo no seu lugar e simplificar o dia.",
    collections: [
      "Setup minimalista",
      "Achadinhos até R$30",
      "Home office feminino",
    ],
  },
  {
    slug: "suporte-para-notebook",
    name: "Suporte para notebook",
    category: "setup",
    price: 49.9,
    art: "laptop",
    color: "sage",
    description:
      "Eleve seu notebook e organize o espaço de trabalho com um apoio discreto.",
    collections: ["Setup minimalista", "Home office feminino"],
  },
  {
    slug: "hub-usb",
    name: "Hub USB compacto",
    category: "eletronicos",
    price: 27.9,
    art: "hub",
    color: "lilac",
    description:
      "Mais conexões em um acessório compacto para acompanhar sua rotina.",
    collections: ["Setup minimalista", "Achadinhos até R$30"],
  },
].map((p) => ({ ...p, affiliateUrl: "https://shopee.com.br/" }));
export const videos = [
  {
    code: "001",
    title: "Um setup rosa para chamar de seu",
    description:
      "Os detalhes fofos do nosso primeiro carrossel, reunidos em um só lugar.",
    slugs: [
      "luminaria-de-mesa",
      "mousepad",
      "fita-led",
      "bonequinho-decorativo",
      "suporte-de-fone",
    ],
  },
  {
    code: "002",
    title: "Mesa organizada, mente leve",
    description: "Pequenas facilidades para um home office mais gostoso.",
    slugs: ["organizador-de-cabos", "suporte-para-notebook", "hub-usb"],
  },
  {
    code: "003",
    title: "Pequenos mimos até R$30",
    description: "Uma seleção de achadinhos para renovar os detalhes.",
    slugs: [
      "mousepad",
      "bonequinho-decorativo",
      "organizador-de-cabos",
      "fita-led",
    ],
  },
];
export const latestVideo = videos[2];
export const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const videoProducts = (slugs: string[]) =>
  slugs.map((slug) => products.find((p) => p.slug === slug)!).filter(Boolean);
