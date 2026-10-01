import { translate, localizedPath, contentLabel, findsLabel, type Language } from "@/lib/i18n";

import { socialImage } from "@/lib/social-image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocalizedCatalog } from "@/lib/localized-catalog";
import { productsBySlugs } from "@/lib/data-source/types";
import { ProductGrid } from "@/components/catalog";
import { pageMetadata } from "@/lib/site";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}, language: Language = "pt") {

  const snapshot = await getLocalizedCatalog(language);
  const { contents } = snapshot;
  const { codigo } = await params;
  const video = contents.find((video) => video.code === codigo);
  if (!video) notFound();
  return pageMetadata({
    title: `${language === "en" ? "Products from" : "Produtos do"} ${contentLabel(video.contentType, language)} #${video.code}`,
    description: video.description,
    path: localizedPath(`/v/${video.code}`, language), language,
    image: socialImage(`/social/carrossel-${video.code}.jpg`),
    imageAlt: video.title,
  });
}
export async function generateStaticParams() {
  const { contents } = await getLocalizedCatalog("pt");
  return contents.map(item => ({ codigo: item.code }));
}
export default async function VideoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}, language: Language = "pt") {
 const t = (text:string) => translate(language,text);
  const snapshot = await getLocalizedCatalog(language);
  const { contents } = snapshot;
  const { codigo } = await params;
  const video = contents.find((v) => v.code === codigo);
  if (!video) notFound();
  return (
    <div className="page-wrap">
      <Link className="back-link" href={localizedPath("/#videos", language)}>
        {t("← Todas as publicações")}{" "}</Link>
      <div className="page-heading">
        <span className="pill">▶ {contentLabel(video.contentType, language)} #{video.code}</span>
        <h1>{video.title}</h1>
        <p>{video.description}</p>
        <small>
          {findsLabel(productsBySlugs(snapshot, video.slugs).length, language)} {language === "en" ? "in this" : "neste"} {contentLabel(video.contentType, language)}
        </small>
      </div>
      <div className="video-social-links">{Object.entries(video.links).map(([platform,url])=><a key={platform} href={url} target="_blank" rel="noopener noreferrer">{language === "en" ? "View on" : "Ver no"} {({instagram:"Instagram",tiktok:"TikTok",youtube:"YouTube"} as Record<string,string>)[platform]??platform} ↗</a>)}</div>
      <ProductGrid language={language} pageType="content" contentCode={video.code} items={productsBySlugs(snapshot, video.slugs)} />
    </div>
  );
}
