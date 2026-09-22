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
  published: boolean;
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
// Coleções baseadas em preço ficam em rascunho até haver valores verificados.
export const publishedCollections = [
  { slug: "setup-rosa", name: "Setup rosa", styleIndex: 0 },
  { slug: "setup-minimalista", name: "Setup minimalista", styleIndex: 1 },
  { slug: "home-office-feminino", name: "Home office feminino", styleIndex: 3 },
];
export const products: Product[] = [
  {
    slug: "luminaria-de-mesa",
    published: true,
    affiliateUrl: "https://s.shopee.com.br/20vXQYrNiT",
    name: "Luminária Hello Kitty",
    image: "/products/luminaria-de-mesa.png",
    category: "decoracao",
    price: 39.9,
    art: "lamp",
    color: "pink",
    description:
      "Uma luminária decorativa da Hello Kitty para deixar o seu cantinho mais aconchegante.",
    collections: ["Setup rosa", "Home office feminino"],
  },
  {
    slug: "mousepad",
    published: true,
    affiliateUrl: "https://s.shopee.com.br/5LBzOi4p9L",
    name: "Mousepad xadrez com flores",
    image: "/products/mousepad.png",
    category: "setup",
    price: 24.9,
    art: "mat",
    color: "peach",
    description:
      "Mousepad com estampa xadrez e flores para dar um toque de cor à sua mesa.",
    collections: ["Setup rosa", "Achadinhos até R$30", "Home office feminino"],
  },
  {
    slug: "fita-led",
    published: true,
    affiliateUrl: "https://s.shopee.com.br/20vXQWWKS1",
    name: "Fita LED RGB HiGooGoo com app e controle",
    image: "/products/fita-led.png",
    category: "eletronicos",
    price: 19.9,
    art: "led",
    color: "lilac",
    description:
      "Fita LED RGB com ajuste de cores, brilho e efeitos pelo aplicativo ou controle remoto. Possui verso adesivo e opções de comprimento. Confira no anúncio o tamanho e a alimentação da versão escolhida.",
    collections: ["Setup rosa", "Achadinhos até R$30"],
  },
  {
    slug: "bonequinho-decorativo",
    published: true,
    affiliateUrl: "https://s.shopee.com.br/8Kpb1u6gr7",
    name: "Bonequinho decorativo Kuromi",
    image: "/products/bonequinho-decorativo.png",
    category: "decoracao",
    price: 16.9,
    art: "bunny",
    color: "cream",
    description:
      "Bonequinho da Kuromi em estilo de blocos para decorar a mesa ou a estante.",
    collections: ["Setup rosa", "Achadinhos até R$30"],
  },
  {
    slug: "suporte-de-fone",
    published: true,
    affiliateUrl: "https://s.shopee.com.br/1130EnJyH0",
    name: "Suporte para fone Hello Kitty",
    image: "/products/suporte-de-fone.png",
    category: "setup",
    price: 29.9,
    art: "headphone",
    color: "pink",
    description:
      "Suporte com visual da Hello Kitty para organizar seu fone e decorar a mesa. Confira os itens incluídos no anúncio.",
    collections: ["Setup minimalista", "Achadinhos até R$30"],
  },
  {
    slug: "organizador-de-cabos",
    published: false,
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
    published: false,
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
    published: false,
    name: "Hub USB compacto",
    category: "eletronicos",
    price: 27.9,
    art: "hub",
    color: "lilac",
    description:
      "Mais conexões em um acessório compacto para acompanhar sua rotina.",
    collections: ["Setup minimalista", "Achadinhos até R$30"],
  },
].map((p) => ({
  ...p,
  affiliateUrl: p.affiliateUrl ?? "https://shopee.com.br/",
}));
export const videos = [
  {
    code: "001",
    published: true,
    cover: "/videos/carrossel-001.png",
    instagramUrl: "https://www.instagram.com/p/Ddcj01vGOxd/?img_index=1",
    tiktokUrl:
      "https://www.tiktok.com/@issofacilita1/photo/7687007054258539783",
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
    published: false,
    title: "Mesa organizada, mente leve",
    description: "Pequenas facilidades para um home office mais gostoso.",
    slugs: ["organizador-de-cabos", "suporte-para-notebook", "hub-usb"],
  },
  {
    code: "003",
    published: false,
    title: "Pequenos mimos para o seu setup",
    description: "Uma seleção de achadinhos para renovar os detalhes.",
    slugs: [
      "mousepad",
      "bonequinho-decorativo",
      "luminaria-de-mesa",
      "fita-led",
    ],
  },
];
export const publishedProducts = products.filter(
  (product) => product.published,
);
export const publishedVideos = videos.filter((video) => video.published);
export const currentVideoCode = "001";
export const latestVideo = (() => {
  const video = publishedVideos.find(
    (video) => video.code === currentVideoCode,
  );
  if (!video) {
    throw new Error(
      "O conteúdo atual precisa corresponder a um vídeo publicado.",
    );
  }
  return video;
})();
export const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const videoProducts = (slugs: string[]) =>
  slugs
    .map((slug) => publishedProducts.find((product) => product.slug === slug))
    .filter((product): product is Product => product !== undefined);
