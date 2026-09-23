import type { Metadata } from "next";

function resolveSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured && process.env.NODE_ENV !== "development") {
    throw new Error(
      "Defina NEXT_PUBLIC_SITE_URL com a URL pública real antes de gerar o site para produção.",
    );
  }
  const url = new URL(configured || "http://localhost:3000");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL deve ser uma origem HTTP(S), sem caminho, credenciais, query ou fragmento.",
    );
  }
  if (
    process.env.NODE_ENV === "production" &&
    (url.protocol !== "https:" ||
      /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\])$/.test(url.hostname) ||
      url.hostname.endsWith(".localhost"))
  ) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL de produção deve usar HTTPS e não pode apontar para localhost.",
    );
  }
  return url;
}

export const site = {
  name: "Isso Facilita!",
  shortName: "Isso Facilita!",
  title: "Isso Facilita! · Achadinhos para o seu dia",
  description:
    "Achadinhos de setup, decoração, eletrônicos e utilidades para deixar sua rotina mais prática, bonita e leve.",
  locale: "pt_BR",
  language: "pt-BR",
  url: resolveSiteUrl(),
  socialImage: "/social/isso-facilita.jpg",
};

export const absoluteUrl = (path: string) => new URL(path, site.url).href;

export function pageMetadata({
  title,
  description,
  path,
  image = site.socialImage,
  imageAlt = site.name,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const fullTitle = title === site.title ? title : `${title} · ${site.name}`;
  const socialImage = {
    url: absoluteUrl(image),
    width: 1200,
    height: 630,
    alt: imageAlt,
    type: "image/jpeg",
  };
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: site.locale,
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [socialImage],
    },
  };
}
